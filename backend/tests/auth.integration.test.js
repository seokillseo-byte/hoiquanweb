import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createTestHarness } from "wrangler";

const server = createTestHarness({ workers: [{ configPath: "./backend/wrangler.test.toml" }] });
const origin = "http://localhost:8787";

before(async () => {
  await server.listen();
  const response = await server.fetch(origin + "/_test/migrate", { method: "POST", headers: { origin } });
  assert.equal(response.status, 204, "test D1 schema must migrate before auth tests");
});

after(async () => {
  await server.close();
});

async function authRequest(path, body, extraHeaders = {}) {
  return server.fetch(origin + path, {
    method: "POST",
    headers: { origin, "content-type": "application/json", ...extraHeaders },
    body: JSON.stringify(body)
  });
}

test("Better Auth signs up a user and rejects a weak password", async () => {
  const email = crypto.randomUUID() + "@example.test";
  const response = await authRequest("/api/v1/auth/sign-up/email", {
    name: "Test Customer",
    email,
    password: "Valid-Test-Password-123!"
  });
  assert.equal(response.status, 200, await response.clone().text());
  const body = await response.json();
  assert.equal(body.user.email, email);

  const weak = await authRequest("/api/v1/auth/sign-up/email", {
    name: "Weak Password",
    email: crypto.randomUUID() + "@example.test",
    password: "short"
  });
  assert.ok(weak.status >= 400, "weak passwords must be rejected");
});

test("sign-in creates a session cookie and session lookup reads it", async () => {
  const email = crypto.randomUUID() + "@example.test";
  const password = "Valid-Test-Password-123!";
  const signUp = await authRequest("/api/v1/auth/sign-up/email", { name: "Session User", email, password });
  assert.equal(signUp.status, 200, await signUp.clone().text());
  await signUp.text();

  const signIn = await authRequest("/api/v1/auth/sign-in/email", { email, password });
  assert.equal(signIn.status, 200, await signIn.clone().text());
  const setCookie = signIn.headers.get("set-cookie") || "";
  assert.match(setCookie, /better-auth\.session|__Secure-better-auth\.session/i);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Lax/i);
  const cookie = setCookie.split(";")[0];

  const session = await server.fetch(origin + "/api/v1/auth/session", { headers: { origin, cookie } });
  assert.equal(session.status, 200, await session.clone().text());
  const body = await session.json();
  assert.equal(body.user.email, email);
});

test("invalid credentials fail and sign-out invalidates the session", async () => {
  const email = crypto.randomUUID() + "@example.test";
  const password = "Valid-Test-Password-123!";
  const signUp = await authRequest("/api/v1/auth/sign-up/email", { name: "Signout User", email, password });
  assert.equal(signUp.status, 200, await signUp.clone().text());
  await signUp.text();

  const invalid = await authRequest("/api/v1/auth/sign-in/email", { email, password: "Wrong-Password-123!" });
  assert.ok(invalid.status >= 400);

  const signIn = await authRequest("/api/v1/auth/sign-in/email", { email, password });
  assert.equal(signIn.status, 200, await signIn.clone().text());
  const cookie = (signIn.headers.get("set-cookie") || "").split(";")[0];
  await signIn.text();

  const signOut = await authRequest("/api/v1/auth/sign-out", {}, { cookie });
  assert.equal(signOut.status, 200, await signOut.clone().text());

  const session = await server.fetch(origin + "/api/v1/auth/session", { headers: { origin, cookie } });
  assert.equal(session.status, 200);
  assert.equal(await session.json(), null);
});

test("sign-in rate limit trusts Cloudflare client IP, not spoofed X-Forwarded-For", async () => {
  const ip = "198.51.100." + (20 + Math.floor(Math.random() * 100));
  const attempts = [];
  for (let i = 0; i < 6; i++) {
    attempts.push(await authRequest("/api/v1/auth/sign-in/email", {
      email: "missing-" + crypto.randomUUID() + "@example.test",
      password: "Invalid-Test-Password-123!"
    }, {
      "cf-connecting-ip": ip,
      // A client can supply arbitrary X-Forwarded-For values; they must not
      // reset or evade the counter when running behind Cloudflare.
      "x-forwarded-for": "203.0.113." + (10 + i)
    }));
  }
  assert.ok(attempts.slice(0, 5).every(response => response.status >= 400 && response.status !== 429),
    "the first five invalid credentials should be rejected as credentials, not rate limited");
  assert.equal(attempts[5].status, 429,
    "the sixth attempt from the same Cloudflare client IP must be rate limited despite changing X-Forwarded-For");
});

test("trusted Origin receives credentialed CORS headers without wildcard origins", async () => {
  const response = await server.fetch(origin + "/api/v1/auth/session", {
    headers: { origin }
  });
  assert.equal(response.headers.get("access-control-allow-origin"), origin);
  assert.equal(response.headers.get("access-control-allow-credentials"), "true");
  assert.equal((response.headers.get("access-control-allow-origin") || "").includes("*"), false);
  assert.match(response.headers.get("vary") || "", /Origin/i);
});

test("untrusted Origin receives no credentialed CORS permission", async () => {
  const response = await server.fetch(origin + "/api/v1/auth/session", {
    headers: { origin: "https://attacker.invalid" }
  });
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("access-control-allow-credentials"), null);
});

test("hostile Origin is rejected before auth routes are reached", async () => {
  const response = await server.fetch(origin + "/api/v1/auth/sign-up/email", {
    method: "POST",
    headers: { origin: "https://attacker.invalid", "content-type": "application/json" },
    body: JSON.stringify({ name: "Attacker", email: "attacker@example.test", password: "Valid-Test-Password-123!" })
  });
  assert.equal(response.status, 403);
});


test("credentialed CORS preflight allows only the configured frontend origin", async () => {
  const response = await server.fetch(origin + "/api/v1/auth/sign-in/email", {
    method: "OPTIONS",
    headers: {
      origin,
      "access-control-request-method": "POST",
      "access-control-request-headers": "content-type"
    }
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), origin);
  assert.equal(response.headers.get("access-control-allow-credentials"), "true");
  assert.match(response.headers.get("access-control-allow-methods") || "", /POST/);
  assert.match(response.headers.get("access-control-allow-headers") || "", /Content-Type/i);

  const hostile = await server.fetch(origin + "/api/v1/auth/sign-in/email", {
    method: "OPTIONS",
    headers: {
      origin: "https://attacker.invalid",
      "access-control-request-method": "POST",
      "access-control-request-headers": "content-type"
    }
  });
  assert.equal(hostile.status, 403);
  assert.equal(hostile.headers.get("access-control-allow-origin"), null);
  assert.equal(hostile.headers.get("access-control-allow-credentials"), null);
});


test("public sign-up cannot self-assign a privileged role", async () => {
  const email = crypto.randomUUID() + "@example.test";
  const response = await authRequest("/api/v1/auth/sign-up/email", {
    name: "Untrusted Role Request",
    email,
    password: "Valid-Test-Password-123!",
    role: "admin"
  });
  assert.equal(response.status, 200, await response.clone().text());
  const body = await response.json();
  assert.equal(body.user.email, email);
  assert.notEqual(body.user.role, "admin", "public sign-up must not accept a client-supplied admin role");

  const signIn = await authRequest("/api/v1/auth/sign-in/email", {
    email,
    password: "Valid-Test-Password-123!"
  });
  assert.equal(signIn.status, 200, await signIn.clone().text());
  const cookie = (signIn.headers.get("set-cookie") || "").split(";")[0];
  await signIn.text();
  const session = await server.fetch(origin + "/api/v1/auth/session", { headers: { origin, cookie } });
  assert.equal(session.status, 200, await session.clone().text());
  const sessionBody = await session.json();
  assert.notEqual(sessionBody.user.role, "admin", "session must not expose a self-assigned admin role");
});


async function createSignedInUser(label) {
  const email = crypto.randomUUID() + "@example.test";
  const password = "Valid-Test-Password-123!";
  // Isolate this fixture's IP so the shared rate-limit counter from earlier
  // auth tests does not make the authorization test order-dependent.
  const clientIp = "192.0.2." + (1 + Math.floor(Math.random() * 200));
  const signUp = await authRequest("/api/v1/auth/sign-up/email", { name: label, email, password }, { "cf-connecting-ip": clientIp });
  assert.equal(signUp.status, 200, await signUp.clone().text());
  const user = (await signUp.json()).user;
  const signIn = await authRequest("/api/v1/auth/sign-in/email", { email, password }, { "cf-connecting-ip": clientIp });
  assert.equal(signIn.status, 200, await signIn.clone().text());
  const cookie = (signIn.headers.get("set-cookie") || "").split(";")[0];
  assert.ok(cookie, "successful sign-in must issue a session cookie");
  return { id: user.id, cookie, email };
}

test("customer portal isolates customers and quotes; admin access requires a server-assigned role", async () => {
  const userA = await createSignedInUser("Customer A");
  const userB = await createSignedInUser("Customer B");
  const admin = await createSignedInUser("Test Admin");
  const ordinaryUser = await createSignedInUser("Ordinary User");
  const memberUser = await createSignedInUser("Customer Member");

  const seed = await authRequest("/_test/seed-identity", {
    userA: userA.id,
    userB: userB.id,
    adminUser: admin.id,
    memberUser: memberUser.id
  });
  assert.equal(seed.status, 200, await seed.clone().text());

  const seededLead = await authRequest("/_test/seed-lead", {
    id: "test-lead-convert",
    name: "Lead To Convert",
    email: "convert@example.test",
    service: "Website Design",
    budget: "20-50 million VND",
    goals: "Build a bilingual company website"
  });
  assert.equal(seededLead.status, 201, await seededLead.clone().text());

  async function getFor(path, cookie) {
    return server.fetch(origin + path, { headers: { origin, cookie } });
  }

  const customersA = await getFor("/api/v1/me/customers", userA.cookie);
  assert.equal(customersA.status, 200, await customersA.clone().text());
  assert.deepEqual((await customersA.json()).data.map(item => item.id), ["test-customer-a"]);

  const customersB = await getFor("/api/v1/me/customers", userB.cookie);
  assert.equal(customersB.status, 200, await customersB.clone().text());
  assert.deepEqual((await customersB.json()).data.map(item => item.id), ["test-customer-b"]);

  const quotesA = await getFor("/api/v1/me/quotes", userA.cookie);
  assert.equal(quotesA.status, 200, await quotesA.clone().text());
  const quotesAData = (await quotesA.json()).data;
  assert.deepEqual(quotesAData.map(item => item.quote_number).sort(), ["TEST-A", "TEST-EXPIRED"]);
  assert.ok(quotesAData.every(item => item.membership_role === "owner"), "quote list must include the authenticated user's membership role");

  const quotesB = await getFor("/api/v1/me/quotes", userB.cookie);
  assert.equal(quotesB.status, 200, await quotesB.clone().text());
  assert.deepEqual((await quotesB.json()).data.map(item => item.quote_number), ["TEST-B"]);

  const quoteDetail = await getFor("/api/v1/me/quotes/test-quote-a", userA.cookie);
  assert.equal(quoteDetail.status, 200, await quoteDetail.clone().text());
  const detail = (await quoteDetail.json()).data;
  assert.equal(detail.quote_number, "TEST-A");
  assert.equal(detail.status, "sent");
  assert.equal(detail.membership_role, "owner");
  assert.equal(detail.customer_id, "test-customer-a");
  assert.equal(Object.hasOwn(detail, "notes"), false, "internal CRM notes must not be exposed to customers");
  assert.equal(detail.items.length, 1);
  assert.equal(detail.items[0].description, "Website development");

  const crossCustomerQuote = await getFor("/api/v1/me/quotes/test-quote-a", userB.cookie);
  assert.equal(crossCustomerQuote.status, 404, "a customer must not read another customer's quote");

  const memberDetail = await getFor("/api/v1/me/quotes/test-quote-a", memberUser.cookie);
  assert.equal(memberDetail.status, 200, "a customer member may read the shared quote");
  const memberAcceptance = await server.fetch(origin + "/api/v1/me/quotes/test-quote-a/accept", {
    method: "POST",
    headers: { origin, cookie: memberUser.cookie }
  });
  assert.equal(memberAcceptance.status, 403, "a non-billing customer member must not accept the quote");

  const accepted = await server.fetch(origin + "/api/v1/me/quotes/test-quote-a/accept", {
    method: "POST",
    headers: { origin, cookie: userA.cookie }
  });
  assert.equal(accepted.status, 200, await accepted.clone().text());
  const acceptedQuote = (await accepted.json()).data;
  assert.equal(acceptedQuote.status, "accepted");
  assert.equal(acceptedQuote.accepted_by, userA.id);
  assert.ok(acceptedQuote.accepted_at);
  const auditCount = await server.fetch(origin + "/_test/audit-count", { headers: { origin } });
  assert.equal(auditCount.status, 200, await auditCount.clone().text());
  assert.equal((await auditCount.json()).count, 1, "acceptance must write one audit event");

  const repeatedAcceptance = await server.fetch(origin + "/api/v1/me/quotes/test-quote-a/accept", {
    method: "POST",
    headers: { origin, cookie: userA.cookie }
  });
  assert.equal(repeatedAcceptance.status, 409, "quote acceptance must not be repeated");
  const auditCountAfterRepeat = await server.fetch(origin + "/_test/audit-count", { headers: { origin } });
  assert.equal((await auditCountAfterRepeat.json()).count, 1, "a repeated acceptance must not create another audit event");

  const expiredAcceptance = await server.fetch(origin + "/api/v1/me/quotes/test-quote-expired/accept", {
    method: "POST",
    headers: { origin, cookie: userA.cookie }
  });
  assert.equal(expiredAcceptance.status, 409, "expired quotes must not be accepted");

  const crossCustomerAcceptance = await server.fetch(origin + "/api/v1/me/quotes/test-quote-b/accept", {
    method: "POST",
    headers: { origin, cookie: userA.cookie }
  });
  assert.equal(crossCustomerAcceptance.status, 404, "a customer must not accept another customer's quote");

  const ordinaryAdminAccess = await getFor("/api/v1/admin/customers", ordinaryUser.cookie);
  assert.equal(ordinaryAdminAccess.status, 403, await ordinaryAdminAccess.clone().text());

  const adminAccess = await getFor("/api/v1/admin/customers", admin.cookie);
  assert.equal(adminAccess.status, 200, await adminAccess.clone().text());
  assert.deepEqual(new Set((await adminAccess.json()).data.map(item => item.id)), new Set(["test-customer-a", "test-customer-b"]));

  const anonymousLeadConversion = await server.fetch(origin + "/api/v1/admin/leads/test-lead-convert/convert", { method: "POST", headers: { origin } });
  assert.equal(anonymousLeadConversion.status, 401, "lead conversion must require authentication");
  const forbiddenLeadConversion = await server.fetch(origin + "/api/v1/admin/leads/test-lead-convert/convert", {
    method: "POST", headers: { origin, cookie: ordinaryUser.cookie }
  });
  assert.equal(forbiddenLeadConversion.status, 403, "ordinary users must not convert leads");
  const convertedLead = await server.fetch(origin + "/api/v1/admin/leads/test-lead-convert/convert", {
    method: "POST", headers: { origin, cookie: admin.cookie }
  });
  assert.equal(convertedLead.status, 201, await convertedLead.clone().text());
  const conversion = (await convertedLead.json()).data;
  assert.equal(conversion.lead_id, "test-lead-convert");
  assert.equal(conversion.already_converted, false);
  const adminLeadList = await getFor("/api/v1/admin/leads", admin.cookie);
  assert.equal(adminLeadList.status, 200, await adminLeadList.clone().text());
  const convertedLeadInList = (await adminLeadList.json()).leads.find(item => item.id === "test-lead-convert");
  assert.equal(convertedLeadInList.customer_id, conversion.customer_id, "lead list must expose the linked CRM customer");

  const unqualifiedLead = await authRequest("/_test/seed-lead", {
    id: "test-lead-unqualified",
    name: "Unqualified Lead",
    email: "unqualified@example.test",
    service: "Website Design",
    status: "new"
  });
  assert.equal(unqualifiedLead.status, 201, await unqualifiedLead.clone().text());
  const blockedConversion = await server.fetch(origin + "/api/v1/admin/leads/test-lead-unqualified/convert", {
    method: "POST", headers: { origin, cookie: admin.cookie }
  });
  assert.equal(blockedConversion.status, 409, "new leads must be qualified before conversion");
  const repeatedConversion = await server.fetch(origin + "/api/v1/admin/leads/test-lead-convert/convert", {
    method: "POST", headers: { origin, cookie: admin.cookie }
  });
  assert.equal(repeatedConversion.status, 200, "repeating lead conversion must be idempotent");
  assert.equal((await repeatedConversion.json()).data.customer_id, conversion.customer_id);
  const convertedActivities = await getFor("/api/v1/admin/customers/" + conversion.customer_id + "/activities", admin.cookie);
  assert.equal(convertedActivities.status, 200, await convertedActivities.clone().text());
  assert.equal((await convertedActivities.json()).data[0].activity_type, "system");



  const forbiddenCustomerCreate = await server.fetch(origin + "/api/v1/admin/customers", {
    method: "POST",
    headers: { origin, cookie: ordinaryUser.cookie, "content-type": "application/json" },
    body: JSON.stringify({ display_name: "Unauthorized Customer", contact_email: "unauthorized@example.test" })
  });
  assert.equal(forbiddenCustomerCreate.status, 403, "ordinary users must not create CRM customers");

  const invalidCustomerCreate = await server.fetch(origin + "/api/v1/admin/customers", {
    method: "POST",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ display_name: "Invalid Email", contact_email: "not-an-email" })
  });
  assert.equal(invalidCustomerCreate.status, 400, "customer email must be validated");

  const createCustomer = await server.fetch(origin + "/api/v1/admin/customers", {
    method: "POST",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({
      display_name: "New CRM Customer",
      organization_name: "Example Organization",
      contact_email: "crm-customer@example.test",
      phone: "+84 900 000 000",
      notes: "Private CRM note"
    })
  });
  assert.equal(createCustomer.status, 201, await createCustomer.clone().text());
  const createdCustomer = (await createCustomer.json()).data;
  assert.equal(createdCustomer.status, "active");

  const customerDetail = await getFor("/api/v1/admin/customers/" + createdCustomer.id, admin.cookie);
  assert.equal(customerDetail.status, 200, await customerDetail.clone().text());
  assert.equal((await customerDetail.json()).data.contact_email, "crm-customer@example.test");

  const forbiddenActivityRead = await getFor("/api/v1/admin/customers/" + createdCustomer.id + "/activities", ordinaryUser.cookie);
  assert.equal(forbiddenActivityRead.status, 403, "ordinary users must not read internal CRM activity");

  const createActivity = await server.fetch(origin + "/api/v1/admin/customers/" + createdCustomer.id + "/activities", {
    method: "POST",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ activity_type: "call", subject: "Discovery call", body: "Discussed initial project requirements." })
  });
  assert.equal(createActivity.status, 201, await createActivity.clone().text());
  const activity = (await createActivity.json()).data;
  assert.equal(activity.actor_id, admin.id);
  assert.equal(activity.activity_type, "call");

  const activities = await getFor("/api/v1/admin/customers/" + createdCustomer.id + "/activities", admin.cookie);
  assert.equal(activities.status, 200, await activities.clone().text());
  assert.equal((await activities.json()).data[0].subject, "Discovery call");

  const updateCustomer = await server.fetch(origin + "/api/v1/admin/customers/" + createdCustomer.id, {
    method: "PATCH",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ status: "inactive", phone: "+84 911 111 111" })
  });
  assert.equal(updateCustomer.status, 200, await updateCustomer.clone().text());
  assert.equal((await updateCustomer.json()).data.status, "inactive");

  const customerAudit = await server.fetch(origin + "/_test/customer-audit-count", { headers: { origin } });
  assert.equal(customerAudit.status, 200, await customerAudit.clone().text());
  const customerAuditCounts = Object.fromEntries((await customerAudit.json()).data.map(row => [row.action, row.count]));
  assert.equal(customerAuditCounts["customer.created"], 1);
  assert.equal(customerAuditCounts["customer.updated"], 1);
  assert.equal(customerAuditCounts["customer.activity.created"], 1);

  const forbiddenQuoteCreate = await server.fetch(origin + "/api/v1/admin/quotes", {
    method: "POST",
    headers: { origin, cookie: ordinaryUser.cookie, "content-type": "application/json" },
    body: JSON.stringify({ customer_id: "test-customer-a", items: [{ description: "Website", quantity: 1, unit_price_minor: 1000000 }] })
  });
  assert.equal(forbiddenQuoteCreate.status, 403, "ordinary users must not create CRM quotes");

  const invalidDiscount = await server.fetch(origin + "/api/v1/admin/quotes", {
    method: "POST",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ customer_id: "test-customer-a", discount_minor: 2000000, items: [{ description: "Website", quantity: 1, unit_price_minor: 1000000 }] })
  });
  assert.equal(invalidDiscount.status, 400, "discount cannot exceed subtotal");

  const createQuote = await server.fetch(origin + "/api/v1/admin/quotes", {
    method: "POST",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({
      customer_id: "test-customer-a",
      currency: "VND",
      discount_minor: 1000000,
      valid_until: "2099-12-31",
      notes: "Integration test quote",
      items: [
        { description: "Website design", quantity: 2, unit_price_minor: 5000000, sort_order: 0 },
        { description: "SEO setup", quantity: 1, unit_price_minor: 3000000, sort_order: 1 }
      ]
    })
  });
  assert.equal(createQuote.status, 201, await createQuote.clone().text());
  const createdQuote = (await createQuote.json()).data;
  assert.equal(createdQuote.status, "draft");
  assert.equal(createdQuote.subtotal_minor, 13000000);
  assert.equal(createdQuote.total_minor, 12000000);
  assert.equal(createdQuote.items.length, 2);
  const privateDraft = await getFor("/api/v1/me/quotes/" + createdQuote.id, userA.cookie);
  assert.equal(privateDraft.status, 404, "draft quotes must remain private from customers");

  const adminQuoteDetail = await getFor("/api/v1/admin/quotes/" + createdQuote.id, admin.cookie);
  assert.equal(adminQuoteDetail.status, 200, await adminQuoteDetail.clone().text());
  assert.equal((await adminQuoteDetail.json()).data.items.length, 2);

  const sendAsCustomer = await server.fetch(origin + "/api/v1/admin/quotes/" + createdQuote.id + "/send", {
    method: "POST",
    headers: { origin, cookie: userA.cookie }
  });
  assert.equal(sendAsCustomer.status, 403, "customers must not send quotes");

  const sendQuote = await server.fetch(origin + "/api/v1/admin/quotes/" + createdQuote.id + "/send", {
    method: "POST",
    headers: { origin, cookie: admin.cookie }
  });
  assert.equal(sendQuote.status, 200, await sendQuote.clone().text());
  assert.equal((await sendQuote.json()).data.status, "sent");

  const visibleSentQuote = await getFor("/api/v1/me/quotes/" + createdQuote.id, userA.cookie);
  assert.equal(visibleSentQuote.status, 200, await visibleSentQuote.clone().text());
  assert.equal((await visibleSentQuote.json()).data.total_minor, 12000000);

  const quoteAudit = await server.fetch(origin + "/_test/quote-audit-count", { headers: { origin } });
  assert.equal(quoteAudit.status, 200, await quoteAudit.clone().text());
  const quoteAuditCounts = Object.fromEntries((await quoteAudit.json()).data.map(row => [row.action, row.count]));
  assert.equal(quoteAuditCounts["quote.created"], 1);
  assert.equal(quoteAuditCounts["quote.sent"], 1);

  const adminLeadAccess = await getFor("/api/admin/leads?limit=1", admin.cookie);
  assert.equal(adminLeadAccess.status, 200, await adminLeadAccess.clone().text());

  const ordinaryLeadAccess = await getFor("/api/admin/leads?limit=1", ordinaryUser.cookie);
  assert.equal(ordinaryLeadAccess.status, 403, await ordinaryLeadAccess.clone().text());

  const legacyTokenAccess = await server.fetch(origin + "/api/admin/leads?limit=1", {
    headers: { origin, authorization: "Bearer test-only-legacy-token" }
  });
  assert.equal(legacyTokenAccess.status, 401, await legacyTokenAccess.clone().text());

  const leadSeed = await authRequest("/_test/seed-lead", {
    id: "test-lead-assignment",
    name: "Lead Assignment",
    email: "lead-assignment@example.test",
    service: "Website Design"
  });
  assert.equal(leadSeed.status, 201, await leadSeed.clone().text());

  const staffDirectory = await getFor("/api/v1/admin/staff", admin.cookie);
  assert.equal(staffDirectory.status, 200, await staffDirectory.clone().text());
  assert.ok((await staffDirectory.json()).data.some(person => person.id === admin.id));
  const forbiddenStaffDirectory = await getFor("/api/v1/admin/staff", ordinaryUser.cookie);
  assert.equal(forbiddenStaffDirectory.status, 403);

  const assignLead = await server.fetch(origin + "/api/v1/admin/leads", {
    method: "PATCH",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ id: "test-lead-assignment", assigned_to: admin.id })
  });
  assert.equal(assignLead.status, 200, await assignLead.clone().text());
  assert.equal((await assignLead.json()).assigned_to, admin.id);

  const updateLeadStatus = await server.fetch(origin + "/api/v1/admin/leads", {
    method: "PATCH",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ id: "test-lead-assignment", status: "contacted" })
  });
  assert.equal(updateLeadStatus.status, 200, await updateLeadStatus.clone().text());
  assert.equal((await updateLeadStatus.json()).status, "contacted");

  const invalidAssignment = await server.fetch(origin + "/api/v1/admin/leads", {
    method: "PATCH",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ id: "test-lead-assignment", assigned_to: ordinaryUser.id })
  });
  assert.equal(invalidAssignment.status, 400, "customer accounts cannot be assigned as lead owners");

  const assignedLeads = await getFor("/api/v1/admin/leads", admin.cookie);
  const assignedLead = (await assignedLeads.json()).leads.find(lead => lead.id === "test-lead-assignment");
  assert.equal(assignedLead.assigned_to, admin.id);
  assert.equal(assignedLead.assigned_name, "Test Admin");

  const unassignLead = await server.fetch(origin + "/api/v1/admin/leads", {
    method: "PATCH",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ id: "test-lead-assignment", assigned_to: null })
  });
  assert.equal(unassignLead.status, 200, await unassignLead.clone().text());
  assert.equal((await unassignLead.json()).assigned_to, null);

  const leadHistory = await getFor("/api/v1/admin/leads/test-lead-assignment/events", admin.cookie);
  assert.equal(leadHistory.status, 200, await leadHistory.clone().text());
  const eventRows = (await leadHistory.json()).data;
  const eventTypes = eventRows.map(event => event.event_type);
  assert.ok(eventTypes.includes("assigned"));
  assert.ok(eventTypes.includes("unassigned"));
  assert.ok(eventTypes.includes("status_changed"));
  assert.ok(eventRows.every(event => JSON.parse(event.details).actorId === admin.id));
  const forbiddenLeadHistory = await getFor("/api/v1/admin/leads/test-lead-assignment/events", ordinaryUser.cookie);
  assert.equal(forbiddenLeadHistory.status, 403, "customer accounts cannot read internal lead history");
  const leadAudit = await getFor("/_test/lead-audit?lead_id=test-lead-assignment", admin.cookie);
  assert.equal(leadAudit.status, 200, await leadAudit.clone().text());
  const auditActions = (await leadAudit.json()).data.map(event => event.action);
  assert.ok(auditActions.includes("lead.assigned"));
  assert.ok(auditActions.includes("lead.unassigned"));
  assert.ok(auditActions.includes("lead.status_changed"));

  const noMembership = await getFor("/api/v1/me/customers", ordinaryUser.cookie);
  assert.equal(noMembership.status, 200, await noMembership.clone().text());
  assert.deepEqual((await noMembership.json()).data, []);
});


test("CMS content API requires an authenticated admin; drafts stay private and edits require republishing", async () => {
  const admin = await createSignedInUser("CMS Admin");
  const customer = await createSignedInUser("CMS Customer");
  const seed = await authRequest("/_test/seed-identity", {
    userA: customer.id,
    userB: "cms-no-membership-user",
    adminUser: admin.id
  });
  assert.equal(seed.status, 200, await seed.clone().text());

  const anonymous = await server.fetch(origin + "/api/v1/admin/pages", { headers: { origin } });
  assert.equal(anonymous.status, 401, await anonymous.clone().text());

  const customerCreate = await server.fetch(origin + "/api/v1/admin/pages", {
    method: "POST",
    headers: { origin, cookie: customer.cookie, "content-type": "application/json" },
    body: JSON.stringify({ slug: "customer-page", title: "Customer Page", content: {} })
  });
  assert.equal(customerCreate.status, 403, await customerCreate.clone().text());

  const create = await server.fetch(origin + "/api/v1/admin/pages", {
    method: "POST",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({
      slug: "cms-security-test",
      title: "CMS Security Test",
      excerpt: "A private draft used by integration tests.",
      content: { blocks: [{ type: "paragraph", text: "Draft content" }] },
      seo: { title: "CMS Security Test", robots: "noindex" }
    })
  });
  assert.equal(create.status, 201, await create.clone().text());
  const created = (await create.json()).data;
  assert.equal(created.status, "draft");
  assert.ok(created.id);

  const publicDraft = await server.fetch(origin + "/api/v1/public/pages/cms-security-test", { headers: { origin } });
  assert.equal(publicDraft.status, 404, await publicDraft.clone().text());

  const customerPublish = await server.fetch(origin + "/api/v1/admin/pages/" + created.id + "/publish", {
    method: "POST",
    headers: { origin, cookie: customer.cookie }
  });
  assert.equal(customerPublish.status, 403, await customerPublish.clone().text());

  const publish = await server.fetch(origin + "/api/v1/admin/pages/" + created.id + "/publish", {
    method: "POST",
    headers: { origin, cookie: admin.cookie }
  });
  assert.equal(publish.status, 200, await publish.clone().text());
  const publicPage = await server.fetch(origin + "/api/v1/public/pages/cms-security-test", { headers: { origin } });
  assert.equal(publicPage.status, 200, await publicPage.clone().text());
  assert.equal((await publicPage.json()).data.title, "CMS Security Test");

  const update = await server.fetch(origin + "/api/v1/admin/pages/" + created.id, {
    method: "PATCH",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ title: "Updated CMS Draft", content: { blocks: [] } })
  });
  assert.equal(update.status, 200, await update.clone().text());
  assert.equal((await update.json()).data.status, "draft");
  const hiddenAfterEdit = await server.fetch(origin + "/api/v1/public/pages/cms-security-test", { headers: { origin } });
  assert.equal(hiddenAfterEdit.status, 404, "editing published content must return it to draft until republished");

  const revisionsResponse = await server.fetch(origin + "/api/v1/admin/pages/" + created.id + "/revisions", {
    headers: { origin, cookie: admin.cookie }
  });
  assert.equal(revisionsResponse.status, 200, await revisionsResponse.clone().text());
  const revisions = (await revisionsResponse.json()).data;
  assert.ok(revisions.some(revision => revision.action === "created"));
  const publishedRevision = revisions.find(revision => revision.action === "published");
  assert.ok(publishedRevision, "publication must create an immutable revision");

  const customerRestore = await server.fetch(origin + "/api/v1/admin/pages/" + created.id + "/restore", {
    method: "POST",
    headers: { origin, cookie: customer.cookie, "content-type": "application/json" },
    body: JSON.stringify({ revision_id: publishedRevision.id })
  });
  assert.equal(customerRestore.status, 403, "customers must not restore CMS revisions");

  const restore = await server.fetch(origin + "/api/v1/admin/pages/" + created.id + "/restore", {
    method: "POST",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ revision_id: publishedRevision.id })
  });
  assert.equal(restore.status, 200, await restore.clone().text());
  const restored = (await restore.json()).data;
  assert.equal(restored.title, "CMS Security Test");
  assert.equal(restored.status, "draft", "restoring a published revision must never publish it automatically");
  assert.equal(restored.published_at, null);
  const hiddenAfterRestore = await server.fetch(origin + "/api/v1/public/pages/cms-security-test", { headers: { origin } });
  assert.equal(hiddenAfterRestore.status, 404, "restored content must remain private until an admin republishes it");

  const missingRevision = await server.fetch(origin + "/api/v1/admin/pages/" + created.id + "/restore", {
    method: "POST",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ revision_id: "not-a-revision" })
  });
  assert.equal(missingRevision.status, 404, "a revision from another or missing resource must not be restorable");
});


test("CMS posts persist taxonomy, publish into public blog feeds and keep drafts private", async () => {
  const admin = await createSignedInUser("Blog Admin");
  const customer = await createSignedInUser("Blog Customer");
  const seed = await authRequest("/_test/seed-identity", {
    userA: customer.id,
    userB: "blog-no-membership-user",
    adminUser: admin.id
  });
  assert.equal(seed.status, 200, await seed.clone().text());
  const create = await server.fetch(origin + "/api/v1/admin/posts", {
    method: "POST",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({
      slug: "taxonomy-blog-post",
      title: "Taxonomy Blog Post",
      excerpt: "A published post with a category and tags.",
      author_name: "Editorial Team",
      category: "SEO",
      tags: ["Technical SEO", "Technical SEO", "Content"],
      body: { blocks: [{ type: "paragraph", text: "Editorial content." }] },
      seo: { title: "Taxonomy Blog Post SEO" }
    })
  });
  assert.equal(create.status, 201, await create.clone().text());
  const created = (await create.json()).data;
  assert.equal(created.category, "SEO");
  assert.deepEqual(created.tags, ["technical seo", "content"]);
  assert.equal(created.status, "draft");

  const invalidTags = await server.fetch(origin + "/api/v1/admin/posts", {
    method: "POST",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ slug: "invalid-tags-post", title: "Invalid Tags", tags: "not-an-array", body: {} })
  });
  assert.equal(invalidTags.status, 400);

  const hidden = await server.fetch(origin + "/api/v1/public/posts?category=SEO", { headers: { origin } });
  assert.equal(hidden.status, 200);
  assert.ok(!(await hidden.json()).data.some(post => post.slug === "taxonomy-blog-post"));

  const customerEdit = await server.fetch(origin + "/api/v1/admin/posts/" + created.id, {
    method: "PATCH",
    headers: { origin, cookie: customer.cookie, "content-type": "application/json" },
    body: JSON.stringify({ category: "Private" })
  });
  assert.equal(customerEdit.status, 403);

  const publish = await server.fetch(origin + "/api/v1/admin/posts/" + created.id + "/publish", {
    method: "POST", headers: { origin, cookie: admin.cookie }
  });
  assert.equal(publish.status, 200, await publish.clone().text());

  const categories = await server.fetch(origin + "/api/v1/public/post-categories", { headers: { origin } });
  assert.equal(categories.status, 200);
  assert.ok((await categories.json()).data.some(item => item.category === "SEO"));

  const filtered = await server.fetch(origin + "/api/v1/public/posts?category=SEO&tag=technical%20seo", { headers: { origin } });
  assert.equal(filtered.status, 200);
  const post = (await filtered.json()).data.find(item => item.slug === "taxonomy-blog-post");
  assert.ok(post);
  assert.deepEqual(post.tags, ["technical seo", "content"]);
  assert.equal("tags_json" in post, false);

  const detail = await server.fetch(origin + "/api/v1/public/posts/taxonomy-blog-post", { headers: { origin } });
  assert.equal(detail.status, 200);
  const detailPost = (await detail.json()).data;
  assert.equal(detailPost.category, "SEO");
  assert.deepEqual(detailPost.tags, ["technical seo", "content"]);
});

test("CMS media uploads validate image signatures, remain private until Admin publication, and archive cleanly", async () => {
  const admin = await createSignedInUser("Media Admin");
  const customer = await createSignedInUser("Media Customer");
  const seed = await authRequest("/_test/seed-identity", {
    userA: customer.id,
    userB: "media-no-membership-user",
    adminUser: admin.id
  });
  assert.equal(seed.status, 200, await seed.clone().text());

  const bytes = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
  const makeMultipart = (fileBytes, mime, filename, altText, boundary) => {
    const encoder = new TextEncoder();
    const head = encoder.encode("--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"" + filename + "\"\r\nContent-Type: " + mime + "\r\n\r\n");
    const tail = encoder.encode("\r\n--" + boundary + "\r\nContent-Disposition: form-data; name=\"alt_text\"\r\n\r\n" + altText + "\r\n--" + boundary + "--\r\n");
    const body = new Uint8Array(head.length + fileBytes.length + tail.length);
    body.set(head, 0); body.set(fileBytes, head.length); body.set(tail, head.length + fileBytes.length);
    return body;
  };
  const boundary = "----hoiquanweb-media-" + crypto.randomUUID();
  const uploadBody = makeMultipart(bytes, "image/png", "brand-mark.png", "HoiQuanWeb brand mark", boundary);
  const upload = await server.fetch(origin + "/api/v1/admin/media", {
    method: "POST",
    headers: { origin, cookie: admin.cookie, "content-type": "multipart/form-data; boundary=" + boundary },
    body: uploadBody
  });
  assert.equal(upload.status, 201, await upload.clone().text());
  const asset = (await upload.json()).data;
  assert.equal(asset.status, "draft");
  assert.equal(asset.content_type, "image/png");
  assert.equal(asset.size_bytes, bytes.byteLength);
  assert.equal(asset.public_url, null);

  const customerList = await server.fetch(origin + "/api/v1/admin/media", { headers: { origin, cookie: customer.cookie } });
  assert.equal(customerList.status, 403, "customer accounts cannot access the CMS media library");

  const hidden = await server.fetch(origin + "/api/v1/public/media/" + asset.id, { headers: { origin } });
  assert.equal(hidden.status, 404, "draft media must not be publicly retrievable");

  const preview = await server.fetch(origin + "/api/v1/admin/media/" + asset.id + "/file", { headers: { origin, cookie: admin.cookie } });
  assert.equal(preview.status, 200, await preview.clone().text());
  assert.equal(preview.headers.get("content-type"), "image/png");
  assert.deepEqual(new Uint8Array(await preview.arrayBuffer()), bytes);

  const altUpdate = await server.fetch(origin + "/api/v1/admin/media/" + asset.id, {
    method: "PATCH",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ alt_text: "Updated accessible description" })
  });
  assert.equal(altUpdate.status, 200, await altUpdate.clone().text());
  assert.equal((await altUpdate.json()).data.alt_text, "Updated accessible description");

  const customerPublish = await server.fetch(origin + "/api/v1/admin/media/" + asset.id + "/publish", {
    method: "POST", headers: { origin, cookie: customer.cookie }
  });
  assert.equal(customerPublish.status, 403, "customers cannot publish media");

  const publish = await server.fetch(origin + "/api/v1/admin/media/" + asset.id + "/publish", {
    method: "POST", headers: { origin, cookie: admin.cookie }
  });
  assert.equal(publish.status, 200, await publish.clone().text());
  assert.equal((await publish.json()).data.public_url, "/api/v1/public/media/" + asset.id);

  const publicAsset = await server.fetch(origin + "/api/v1/public/media/" + asset.id, { headers: { origin } });
  assert.equal(publicAsset.status, 200, await publicAsset.clone().text());
  assert.equal(publicAsset.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual(new Uint8Array(await publicAsset.arrayBuffer()), bytes);

  const invalidBoundary = "----hoiquanweb-invalid-media-" + crypto.randomUUID();
  const invalidBytes = new TextEncoder().encode("not a PNG");
  const invalid = await server.fetch(origin + "/api/v1/admin/media", {
    method: "POST",
    headers: { origin, cookie: admin.cookie, "content-type": "multipart/form-data; boundary=" + invalidBoundary },
    body: makeMultipart(invalidBytes, "image/png", "spoofed.png", "", invalidBoundary)
  });
  assert.equal(invalid.status, 400, "declared MIME type must match the actual image signature");

  const oversizedBoundary = "----hoiquanweb-oversized-media-" + crypto.randomUUID();
  const oversizedBytes = new Uint8Array(5 * 1024 * 1024 + 128 * 1024 + 1);
  const oversizedBody = makeMultipart(oversizedBytes, "image/png", "oversized.png", "", oversizedBoundary);
  const oversizedRequest = new Request(origin + "/api/v1/admin/media", {
    method: "POST",
    headers: { origin, cookie: admin.cookie, "content-type": "multipart/form-data; boundary=" + oversizedBoundary },
    body: oversizedBody
  });
  assert.equal(oversizedRequest.headers.get("content-length"), null, "the regression case must omit Content-Length");
  const oversized = await server.fetch(oversizedRequest.url, {
    method: oversizedRequest.method,
    headers: oversizedRequest.headers,
    body: oversizedBody
  });
  assert.equal(oversized.status, 413, "streamed multipart bodies must be capped before form parsing when Content-Length is absent");

  const archive = await server.fetch(origin + "/api/v1/admin/media/" + asset.id + "/archive", {
    method: "POST", headers: { origin, cookie: admin.cookie }
  });
  assert.equal(archive.status, 200, await archive.clone().text());
  const hiddenAfterArchive = await server.fetch(origin + "/api/v1/public/media/" + asset.id, { headers: { origin } });
  assert.equal(hiddenAfterArchive.status, 404, "archived media must stop being publicly retrievable");
});

test("template catalog requires admin/staff access and verified previews/licenses before publication", async () => {
  const admin = await createSignedInUser("Template Admin");
  const ordinary = await createSignedInUser("Template Ordinary User");
  const userA = await createSignedInUser("Template Fixture A");
  const userB = await createSignedInUser("Template Fixture B");
  const seed = await authRequest("/_test/seed-identity", { userA: userA.id, userB: userB.id, adminUser: admin.id });
  assert.equal(seed.status, 200, await seed.clone().text());

  async function getFor(path, cookie) {
    return server.fetch(origin + path, { headers: { origin, cookie } });
  }
  const anonymous = await server.fetch(origin + "/api/v1/admin/templates", { headers: { origin } });
  assert.equal(anonymous.status, 401);
  const forbidden = await getFor("/api/v1/admin/templates", ordinary.cookie);
  assert.equal(forbidden.status, 403);

  const invalid = await server.fetch(origin + "/api/v1/admin/templates", {
    method: "POST",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ slug: "bad-template", name: "Bad Template", template_type: "php" })
  });
  assert.equal(invalid.status, 400, "unsupported template types must be rejected");

  const created = await server.fetch(origin + "/api/v1/admin/templates", {
    method: "POST",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({
      slug: "starter-business-wordpress",
      name: "Starter Business",
      template_type: "wordpress",
      category: "Business",
      tags: ["corporate", "responsive"],
      summary: "A starter business theme.",
      description: "A draft template catalog entry.",
      version: "1.0.0",
      preview_url: "https://demo.example.test/starter-business",
      price_minor: 0,
      currency: "VND",
      license_key: "review_required",
      compatibility: { wordpress: "6.x" }
    })
  });
  assert.equal(created.status, 201, await created.clone().text());
  const template = (await created.json()).data;
  assert.equal(template.status, "draft");
  assert.deepEqual(template.tags, ["corporate", "responsive"]);

  const prematurePublish = await server.fetch(origin + "/api/v1/admin/templates/" + template.id + "/publish", {
    method: "POST", headers: { origin, cookie: admin.cookie }
  });
  assert.equal(prematurePublish.status, 409, "unverified license and preview must block publication");

  const verify = await server.fetch(origin + "/api/v1/admin/templates/" + template.id, {
    method: "PATCH",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ license_key: "single_site", license_verified: true, preview_verified: true })
  });
  assert.equal(verify.status, 200, await verify.clone().text());
  assert.equal((await verify.json()).data.status, "draft", "editing a template must keep it unpublished");

  const publish = await server.fetch(origin + "/api/v1/admin/templates/" + template.id + "/publish", {
    method: "POST", headers: { origin, cookie: admin.cookie }
  });
  assert.equal(publish.status, 200, await publish.clone().text());
  assert.equal((await publish.json()).data.status, "published");

  const publicDetail = await server.fetch(origin + "/api/v1/public/templates/starter-business-wordpress", { headers: { origin } });
  assert.equal(publicDetail.status, 200, await publicDetail.clone().text());
  const publicTemplate = (await publicDetail.json()).data;
  assert.equal(publicTemplate.name, "Starter Business");
  assert.deepEqual(publicTemplate.tags, ["corporate", "responsive"]);
  assert.deepEqual(publicTemplate.compatibility, { wordpress: "6.x" });
  assert.equal(Object.hasOwn(publicTemplate, "license_verified"), false, "internal verification flags must not be public");

  const publicList = await server.fetch(origin + "/api/v1/public/templates?type=wordpress&q=Starter", { headers: { origin } });
  assert.equal(publicList.status, 200, await publicList.clone().text());
  assert.equal((await publicList.json()).data[0].slug, "starter-business-wordpress");

  const edit = await server.fetch(origin + "/api/v1/admin/templates/" + template.id, {
    method: "PATCH",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ summary: "Updated summary." })
  });
  assert.equal(edit.status, 200);
  assert.equal((await edit.json()).data.status, "draft");
  const hiddenAfterEdit = await server.fetch(origin + "/api/v1/public/templates/starter-business-wordpress", { headers: { origin } });
  assert.equal(hiddenAfterEdit.status, 404, "editing a published template must require re-publication");

  const revisions = await getFor("/api/v1/admin/templates/" + template.id + "/revisions", admin.cookie);
  assert.equal(revisions.status, 200, await revisions.clone().text());
  const revisionActions = (await revisions.json()).data.map(item => item.action);
  assert.equal(revisionActions.length, 4);
  for (const action of ["created", "updated", "published"]) assert.ok(revisionActions.includes(action));
});


test("customer portal scopes orders, projects, milestones, comments and support tickets by membership", async () => {
  const userA = await createSignedInUser("Project Customer A");
  const userB = await createSignedInUser("Project Customer B");
  const admin = await createSignedInUser("Project Admin");
  const ordinary = await createSignedInUser("Project Ordinary User");
  const seed = await authRequest("/_test/seed-identity", { userA: userA.id, userB: userB.id, adminUser: admin.id });
  assert.equal(seed.status, 200, await seed.clone().text());

  async function getFor(path, cookie) {
    return server.fetch(origin + path, { headers: { origin, cookie } });
  }
  const forbiddenAdmin = await getFor("/api/v1/admin/projects", ordinary.cookie);
  assert.equal(forbiddenAdmin.status, 403, "ordinary users must not manage projects");

  const orderBeforeAcceptance = await server.fetch(origin + "/api/v1/admin/orders", {
    method: "POST", headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ quote_id: "test-quote-a" })
  });
  assert.equal(orderBeforeAcceptance.status, 409, "only accepted quotes may become orders");

  const accepted = await server.fetch(origin + "/api/v1/me/quotes/test-quote-a/accept", {
    method: "POST", headers: { origin, cookie: userA.cookie }
  });
  assert.equal(accepted.status, 200, await accepted.clone().text());
  const orderResponse = await server.fetch(origin + "/api/v1/admin/orders", {
    method: "POST", headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ quote_id: "test-quote-a" })
  });
  assert.equal(orderResponse.status, 201, await orderResponse.clone().text());
  const order = (await orderResponse.json()).data;
  assert.equal(order.customer_id, "test-customer-a");
  const repeatedOrder = await server.fetch(origin + "/api/v1/admin/orders", {
    method: "POST", headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ quote_id: "test-quote-a" })
  });
  assert.equal(repeatedOrder.status, 200, "order creation from the same quote must be idempotent");
  assert.equal((await repeatedOrder.json()).data.id, order.id);

  const createProject = await server.fetch(origin + "/api/v1/admin/projects", {
    method: "POST", headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({
      customer_id: "test-customer-a", order_id: order.id, name: "Company Website Delivery",
      description: "Customer-visible project summary.", start_date: "2026-11-01", due_date: "2026-12-15",
      milestones: [
        { title: "Discovery and requirements", due_date: "2026-11-10", sort_order: 0 },
        { title: "Design review", due_date: "2026-11-20", sort_order: 1 }
      ]
    })
  });
  assert.equal(createProject.status, 201, await createProject.clone().text());
  const project = (await createProject.json()).data;
  assert.equal(project.milestones.length, 2);

  const projectsA = await getFor("/api/v1/me/projects", userA.cookie);
  assert.equal(projectsA.status, 200);
  assert.deepEqual((await projectsA.json()).data.map(item => item.id), [project.id]);
  const projectsB = await getFor("/api/v1/me/projects", userB.cookie);
  assert.equal(projectsB.status, 200);
  assert.deepEqual((await projectsB.json()).data, []);
  const crossProject = await getFor("/api/v1/me/projects/" + project.id, userB.cookie);
  assert.equal(crossProject.status, 404, "a customer must not read another customer's project");
  const detail = await getFor("/api/v1/me/projects/" + project.id, userA.cookie);
  assert.equal(detail.status, 200);
  assert.equal((await detail.json()).data.milestones.length, 2);

  const comment = await server.fetch(origin + "/api/v1/me/projects/" + project.id + "/comments", {
    method: "POST", headers: { origin, cookie: userA.cookie, "content-type": "application/json" },
    body: JSON.stringify({ body: "Please confirm the design review schedule." })
  });
  assert.equal(comment.status, 201, await comment.clone().text());
  const comments = await getFor("/api/v1/me/projects/" + project.id + "/comments", userA.cookie);
  assert.equal(comments.status, 200);
  assert.equal((await comments.json()).data[0].body, "Please confirm the design review schedule.");
  const crossComments = await getFor("/api/v1/me/projects/" + project.id + "/comments", userB.cookie);
  assert.equal(crossComments.status, 404);

  const unauthorizedTicket = await server.fetch(origin + "/api/v1/me/tickets", {
    method: "POST", headers: { origin, cookie: ordinary.cookie, "content-type": "application/json" },
    body: JSON.stringify({ customer_id: "test-customer-a", subject: "No membership", description: "Should be rejected." })
  });
  assert.equal(unauthorizedTicket.status, 404, "ticket creation must verify membership for the supplied customer");

  const createTicket = await server.fetch(origin + "/api/v1/me/tickets", {
    method: "POST", headers: { origin, cookie: userA.cookie, "content-type": "application/json" },
    body: JSON.stringify({ customer_id: "test-customer-a", subject: "Website staging issue", description: "The staging page does not load." })
  });
  assert.equal(createTicket.status, 201, await createTicket.clone().text());
  const ticket = (await createTicket.json()).data;
  const ticketsA = await getFor("/api/v1/me/tickets", userA.cookie);
  assert.equal((await ticketsA.json()).data[0].id, ticket.id);
  const ticketsB = await getFor("/api/v1/me/tickets", userB.cookie);
  assert.deepEqual((await ticketsB.json()).data, []);

  const customerReply = await server.fetch(origin + "/api/v1/me/tickets/" + ticket.id + "/messages", {
    method: "POST", headers: { origin, cookie: userA.cookie, "content-type": "application/json" },
    body: JSON.stringify({ body: "I can provide a browser recording if needed." })
  });
  assert.equal(customerReply.status, 201, await customerReply.clone().text());
  const staffReply = await server.fetch(origin + "/api/v1/admin/tickets/" + ticket.id + "/messages", {
    method: "POST", headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ body: "Thank you. We are checking the staging environment." })
  });
  assert.equal(staffReply.status, 201, await staffReply.clone().text());
  const messages = await getFor("/api/v1/me/tickets/" + ticket.id + "/messages", userA.cookie);
  assert.equal((await messages.json()).data.length, 3, "ticket creation and both replies must be visible to the authorized customer");
  const crossTicketMessages = await getFor("/api/v1/me/tickets/" + ticket.id + "/messages", userB.cookie);
  assert.equal(crossTicketMessages.status, 404);

  const resolveTicket = await server.fetch(origin + "/api/v1/admin/tickets/" + ticket.id, {
    method: "PATCH", headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ status: "resolved", priority: "normal" })
  });
  assert.equal(resolveTicket.status, 200, await resolveTicket.clone().text());
  const closedReply = await server.fetch(origin + "/api/v1/me/tickets/" + ticket.id + "/messages", {
    method: "POST", headers: { origin, cookie: userA.cookie, "content-type": "application/json" },
    body: JSON.stringify({ body: "Another reply after resolution." })
  });
  assert.equal(closedReply.status, 409, "resolved tickets must not accept new customer replies");

  const linkMember = await server.fetch(origin + "/api/v1/admin/customers/test-customer-a/members", {
    method: "POST", headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ email: userB.email, membership_role: "member" })
  });
  assert.equal(linkMember.status, 201, await linkMember.clone().text());
  assert.equal((await linkMember.json()).data.membership_role, "member");
  const linkedProjects = await getFor("/api/v1/me/projects", userB.cookie);
  assert.ok((await linkedProjects.json()).data.some(item => item.id === project.id),
    "a newly linked customer member must gain access only after staff links the account");
  const members = await getFor("/api/v1/admin/customers/test-customer-a/members", admin.cookie);
  assert.equal(members.status, 200);
  assert.ok((await members.json()).data.some(item => item.email === userB.email));
  const missingAccount = await server.fetch(origin + "/api/v1/admin/customers/test-customer-a/members", {
    method: "POST", headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ email: "not-registered@example.test", membership_role: "member" })
  });
  assert.equal(missingAccount.status, 404, "staff must not create a membership for an unknown identity");

  const customerRevocation = await server.fetch(origin + "/api/v1/admin/customers/test-customer-a/members/" + encodeURIComponent(userB.id), {
    method: "DELETE", headers: { origin, cookie: userB.cookie }
  });
  assert.equal(customerRevocation.status, 403, "customers cannot revoke customer memberships through admin APIs");

  const lastOwnerRevocation = await server.fetch(origin + "/api/v1/admin/customers/test-customer-a/members/" + encodeURIComponent(userA.id), {
    method: "DELETE", headers: { origin, cookie: admin.cookie }
  });
  assert.equal(lastOwnerRevocation.status, 409, "the final customer owner must not be removable");

  const revokeMember = await server.fetch(origin + "/api/v1/admin/customers/test-customer-a/members/" + encodeURIComponent(userB.id), {
    method: "DELETE", headers: { origin, cookie: admin.cookie }
  });
  assert.equal(revokeMember.status, 200, await revokeMember.clone().text());
  assert.equal((await revokeMember.json()).data.revoked, true);
  const projectsAfterRevocation = await getFor("/api/v1/me/projects", userB.cookie);
  assert.ok(!(await projectsAfterRevocation.json()).data.some(item => item.id === project.id),
    "revoking membership must immediately remove access to that customer's projects");
  const membersAfterRevocation = await getFor("/api/v1/admin/customers/test-customer-a/members", admin.cookie);
  assert.ok(!(await membersAfterRevocation.json()).data.some(item => item.user_id === userB.id));
  const customerAudit = await getFor("/_test/customer-audit-count", admin.cookie);
  assert.ok((await customerAudit.json()).data.some(item => item.action === "customer.member.unlinked" && item.count >= 1),
    "membership revocation must create an audit event");
});

test("private project files enforce customer membership and staff-only internal visibility", async () => {
  const userA = await createSignedInUser("Private File Customer A");
  const userB = await createSignedInUser("Private File Customer B");
  const admin = await createSignedInUser("Private File Admin");
  const ordinary = await createSignedInUser("Private File Ordinary");
  const seed = await authRequest("/_test/seed-identity", { userA: userA.id, userB: userB.id, adminUser: admin.id });
  assert.equal(seed.status, 200, await seed.clone().text());

  const projectResponse = await server.fetch(origin + "/api/v1/admin/projects", {
    method: "POST",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ customer_id: "test-customer-a", name: "Private file access test", description: "Project files" })
  });
  assert.equal(projectResponse.status, 201, await projectResponse.clone().text());
  const project = (await projectResponse.json()).data;

  const makeMultipart = (fileBytes, mime, filename, boundary, visibility) => {
    const encoder = new TextEncoder();
    const head = encoder.encode("--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"" + filename + "\"\r\nContent-Type: " + mime + "\r\n\r\n");
    const middle = visibility ? encoder.encode("\r\n--" + boundary + "\r\nContent-Disposition: form-data; name=\"visibility\"\r\n\r\n" + visibility) : new Uint8Array();
    const tail = encoder.encode("\r\n--" + boundary + "--\r\n");
    const body = new Uint8Array(head.length + fileBytes.length + middle.length + tail.length);
    body.set(head, 0); body.set(fileBytes, head.length); body.set(middle, head.length + fileBytes.length); body.set(tail, head.length + fileBytes.length + middle.length);
    return body;
  };

  const pdfBytes = new TextEncoder().encode("%PDF-1.4\n%HQ test document\n");
  const customerBoundary = "----hq-customer-file-" + crypto.randomUUID();
  const upload = await server.fetch(origin + "/api/v1/me/projects/" + project.id + "/files", {
    method: "POST",
    headers: { origin, cookie: userA.cookie, "content-type": "multipart/form-data; boundary=" + customerBoundary },
    body: makeMultipart(pdfBytes, "application/pdf", "brief.pdf", customerBoundary)
  });
  assert.equal(upload.status, 201, await upload.clone().text());
  const customerFile = (await upload.json()).data;
  assert.equal(customerFile.visibility, "customer");
  assert.equal(customerFile.filename, "brief.pdf");
  assert.equal(customerFile.sha256.length, 64);
  assert.equal(Object.hasOwn(customerFile, "object_key"), false, "storage keys must never leave the API");
  assert.equal(Object.hasOwn(customerFile, "uploaded_by"), false, "internal user identifiers must not leave the API");

  const customerList = await server.fetch(origin + "/api/v1/me/projects/" + project.id + "/files", { headers: { origin, cookie: userA.cookie } });
  assert.equal(customerList.status, 200, await customerList.clone().text());
  assert.deepEqual((await customerList.json()).data.map(item => item.id), [customerFile.id]);

  const download = await server.fetch(origin + "/api/v1/me/projects/" + project.id + "/files/" + customerFile.id, { headers: { origin, cookie: userA.cookie } });
  assert.equal(download.status, 200, await download.clone().text());
  assert.equal(download.headers.get("content-disposition"), 'attachment; filename="brief.pdf"');
  assert.equal(download.headers.get("cache-control"), "private, no-store");
  assert.equal(download.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual(new Uint8Array(await download.arrayBuffer()), pdfBytes);

  const otherCustomerList = await server.fetch(origin + "/api/v1/me/projects/" + project.id + "/files", { headers: { origin, cookie: userB.cookie } });
  assert.equal(otherCustomerList.status, 404, "a different customer must not discover project files");
  const otherCustomerDownload = await server.fetch(origin + "/api/v1/me/projects/" + project.id + "/files/" + customerFile.id, { headers: { origin, cookie: userB.cookie } });
  assert.equal(otherCustomerDownload.status, 404, "a different customer must not download a project file");
  const ordinaryDownload = await server.fetch(origin + "/api/v1/me/projects/" + project.id + "/files/" + customerFile.id, { headers: { origin, cookie: ordinary.cookie } });
  assert.equal(ordinaryDownload.status, 404, "an authenticated non-member must not download project files");

  const internalBoundary = "----hq-internal-file-" + crypto.randomUUID();
  const internalBytes = new TextEncoder().encode("internal-only");
  const internalUpload = await server.fetch(origin + "/api/v1/admin/projects/" + project.id + "/files?visibility=internal", {
    method: "POST",
    headers: { origin, cookie: admin.cookie, "content-type": "multipart/form-data; boundary=" + internalBoundary },
    body: makeMultipart(internalBytes, "text/plain", "internal.txt", internalBoundary)
  });
  assert.equal(internalUpload.status, 201, await internalUpload.clone().text());
  const internalFile = (await internalUpload.json()).data;
  assert.equal(internalFile.visibility, "internal");

  const adminList = await server.fetch(origin + "/api/v1/admin/projects/" + project.id + "/files", { headers: { origin, cookie: admin.cookie } });
  assert.equal(adminList.status, 200, await adminList.clone().text());
  assert.equal((await adminList.json()).data.length, 2);

  const customerListAfterInternal = await server.fetch(origin + "/api/v1/me/projects/" + project.id + "/files", { headers: { origin, cookie: userA.cookie } });
  assert.equal((await customerListAfterInternal.json()).data.length, 1, "internal files must not appear in customer listings");
  const internalCustomerDownload = await server.fetch(origin + "/api/v1/me/projects/" + project.id + "/files/" + internalFile.id, { headers: { origin, cookie: userA.cookie } });
  assert.equal(internalCustomerDownload.status, 404, "internal files must not be downloadable by customers");

  const ordinaryAdminList = await server.fetch(origin + "/api/v1/admin/projects/" + project.id + "/files", { headers: { origin, cookie: ordinary.cookie } });
  assert.equal(ordinaryAdminList.status, 403, "ordinary users cannot access staff project files");

  const invalidBoundary = "----hq-invalid-file-" + crypto.randomUUID();
  const invalidUpload = await server.fetch(origin + "/api/v1/me/projects/" + project.id + "/files", {
    method: "POST",
    headers: { origin, cookie: userA.cookie, "content-type": "multipart/form-data; boundary=" + invalidBoundary },
    body: makeMultipart(new TextEncoder().encode("not a PDF"), "application/pdf", "fake.pdf", invalidBoundary)
  });
  assert.equal(invalidUpload.status, 400, "declared MIME must match the actual file signature");

  const unsupportedBoundary = "----hq-unsupported-file-" + crypto.randomUUID();
  const unsupportedUpload = await server.fetch(origin + "/api/v1/me/projects/" + project.id + "/files", {
    method: "POST",
    headers: { origin, cookie: userA.cookie, "content-type": "multipart/form-data; boundary=" + unsupportedBoundary },
    body: makeMultipart(new Uint8Array([0,1,2,3]), "application/x-msdownload", "payload.exe", unsupportedBoundary)
  });
  assert.equal(unsupportedUpload.status, 415, "executable uploads must be rejected");
});



test("in-app notifications are generated for project and ticket events and isolated by user", async () => {
  const customerA = await createSignedInUser("Notification Customer A");
  const customerB = await createSignedInUser("Notification Customer B");
  const admin = await createSignedInUser("Notification Admin");
  const seed = await authRequest("/_test/seed-identity", { userA: customerA.id, userB: customerB.id, adminUser: admin.id });
  assert.equal(seed.status, 200, await seed.clone().text());

  const projectResponse = await server.fetch(origin + "/api/v1/admin/projects", {
    method: "POST",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ customer_id: "test-customer-a", name: "Notification project", description: "Project updates" })
  });
  assert.equal(projectResponse.status, 201, await projectResponse.clone().text());
  const project = (await projectResponse.json()).data;

  const comment = await server.fetch(origin + "/api/v1/me/projects/" + project.id + "/comments", {
    method: "POST",
    headers: { origin, cookie: customerA.cookie, "content-type": "application/json" },
    body: JSON.stringify({ body: "Sensitive customer comment must not be copied into notification payload." })
  });
  assert.equal(comment.status, 201, await comment.clone().text());

  async function getNotifications(cookie) {
    return server.fetch(origin + "/api/v1/me/notifications", { headers: { origin, cookie } });
  }
  const staffInbox = await getNotifications(admin.cookie);
  assert.equal(staffInbox.status, 200, await staffInbox.clone().text());
  const staffData = await staffInbox.json();
  assert.equal(staffData.meta.unread_count, 1);
  assert.equal(staffData.data[0].type, "project_comment");
  assert.equal(staffData.data[0].resource_id, project.id);
  assert.equal(staffData.data[0].body.includes("Sensitive customer comment"), false, "notification payloads must not duplicate private message content");

  const customerInboxBefore = await getNotifications(customerA.cookie);
  assert.equal((await customerInboxBefore.json()).meta.unread_count, 0, "customers must not be notified about their own action");
  const otherInbox = await getNotifications(customerB.cookie);
  assert.equal((await otherInbox.json()).data.length, 0, "notifications must be isolated by authenticated user");

  const update = await server.fetch(origin + "/api/v1/admin/projects/" + project.id, {
    method: "PATCH",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ status: "in_progress" })
  });
  assert.equal(update.status, 200, await update.clone().text());
  const customerInbox = await getNotifications(customerA.cookie);
  const customerData = await customerInbox.json();
  assert.equal(customerData.meta.unread_count, 1);
  assert.equal(customerData.data[0].type, "project_updated");

  const crossRead = await server.fetch(origin + "/api/v1/me/notifications/" + customerData.data[0].id + "/read", {
    method: "POST", headers: { origin, cookie: customerB.cookie }
  });
  assert.equal(crossRead.status, 404, "a user cannot mark another user's notification as read");

  const markRead = await server.fetch(origin + "/api/v1/me/notifications/" + customerData.data[0].id + "/read", {
    method: "POST", headers: { origin, cookie: customerA.cookie }
  });
  assert.equal(markRead.status, 200, await markRead.clone().text());
  assert.ok((await markRead.json()).data.read_at);
  const afterRead = await getNotifications(customerA.cookie);
  assert.equal((await afterRead.json()).meta.unread_count, 0);

  const ticket = await server.fetch(origin + "/api/v1/me/tickets", {
    method: "POST",
    headers: { origin, cookie: customerA.cookie, "content-type": "application/json" },
    body: JSON.stringify({ customer_id: "test-customer-a", subject: "Notification test ticket", description: "Please contact me." })
  });
  assert.equal(ticket.status, 201, await ticket.clone().text());
  const staffAfterTicket = await getNotifications(admin.cookie);
  const staffAfterTicketData = await staffAfterTicket.json();
  assert.equal(staffAfterTicketData.meta.unread_count, 2);
  assert.ok(staffAfterTicketData.data.some(item => item.type === "ticket_created"));
  const ticketId = (await ticket.json()).data.id;
  const staffReply = await server.fetch(origin + "/api/v1/admin/tickets/" + ticketId + "/messages", {
    method: "POST",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ body: "We have received your request." })
  });
  assert.equal(staffReply.status, 201, await staffReply.clone().text());
  const customerAfterReply = await getNotifications(customerA.cookie);
  const customerAfterReplyData = await customerAfterReply.json();
  assert.equal(customerAfterReplyData.meta.unread_count, 1);
  assert.ok(customerAfterReplyData.data.some(item => item.type === "ticket_reply"));

  const readAll = await server.fetch(origin + "/api/v1/me/notifications/read-all", {
    method: "POST", headers: { origin, cookie: admin.cookie }
  });
  assert.equal(readAll.status, 200, await readAll.clone().text());
  assert.equal((await getNotifications(admin.cookie).then(response => response.json())).meta.unread_count, 0);

  const milestoneCreate = await server.fetch(origin + "/api/v1/admin/projects/" + project.id + "/milestones", {
    method: "POST",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ title: "Audit milestone" })
  });
  assert.equal(milestoneCreate.status, 201, await milestoneCreate.clone().text());
  const milestone = (await milestoneCreate.json()).data;
  const milestoneUpdate = await server.fetch(origin + "/api/v1/admin/milestones/" + milestone.id, {
    method: "PATCH",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ status: "in_progress" })
  });
  assert.equal(milestoneUpdate.status, 200, await milestoneUpdate.clone().text());

  const projectAudit = await server.fetch(origin + "/_test/resource-audit?resource_type=project&resource_id=" + encodeURIComponent(project.id), { headers: { origin } });
  const projectEvents = (await projectAudit.json()).data;
  const projectUpdateEvent = projectEvents.find(item => item.action === "project.updated");
  assert.deepEqual(JSON.parse(projectUpdateEvent.metadata_json).changes.status, { from: "planning", to: "in_progress" });

  const milestoneAuditEvent = projectEvents.find(item => item.action === "project.milestone.updated");
  assert.deepEqual(JSON.parse(milestoneAuditEvent.metadata_json).changes.status, { from: "pending", to: "in_progress" });

  const ticketUpdate = await server.fetch(origin + "/api/v1/admin/tickets/" + ticketId, {
    method: "PATCH",
    headers: { origin, cookie: admin.cookie, "content-type": "application/json" },
    body: JSON.stringify({ status: "in_progress", priority: "high" })
  });
  assert.equal(ticketUpdate.status, 200, await ticketUpdate.clone().text());
  const ticketAudit = await server.fetch(origin + "/_test/resource-audit?resource_type=ticket&resource_id=" + encodeURIComponent(ticketId), { headers: { origin } });
  const ticketEvents = (await ticketAudit.json()).data;
  const ticketUpdateEvent = ticketEvents.find(item => item.action === "ticket.updated");
  const ticketChanges = JSON.parse(ticketUpdateEvent.metadata_json).changes;
  assert.deepEqual(ticketChanges.status, { from: "waiting_customer", to: "in_progress" });
  assert.deepEqual(ticketChanges.priority, { from: "normal", to: "high" });
});



test("CRM dashboard reports database-backed KPIs and requires staff/admin role", async () => {
  const userA = await createSignedInUser("Dashboard Customer A");
  const userB = await createSignedInUser("Dashboard Customer B");
  const admin = await createSignedInUser("Dashboard Admin");
  const ordinary = await createSignedInUser("Dashboard Ordinary");
  const seed = await authRequest("/_test/seed-identity", { userA: userA.id, userB: userB.id, adminUser: admin.id });
  assert.equal(seed.status, 200, await seed.clone().text());

  const beforeResponse = await server.fetch(origin + "/api/v1/admin/dashboard", { headers: { origin, cookie: admin.cookie } });
  assert.equal(beforeResponse.status, 200, await beforeResponse.clone().text());
  const before = (await beforeResponse.json()).data;

  const lead = await authRequest("/_test/seed-lead", {
    id: "dashboard-lead-test",
    name: "Dashboard Test Lead",
    email: "dashboard-lead@example.test",
    service: "Website Design",
    status: "new"
  });
  assert.equal(lead.status, 201, await lead.clone().text());

  const forbidden = await server.fetch(origin + "/api/v1/admin/dashboard", { headers: { origin, cookie: ordinary.cookie } });
  assert.equal(forbidden.status, 403, "ordinary authenticated users cannot view the CRM dashboard");

  const dashboard = await server.fetch(origin + "/api/v1/admin/dashboard", { headers: { origin, cookie: admin.cookie } });
  assert.equal(dashboard.status, 200, await dashboard.clone().text());
  const data = (await dashboard.json()).data;
  assert.equal(data.kpis.total_leads, before.kpis.total_leads + 1, "dashboard lead KPI must reflect the newly inserted D1 row");
  assert.equal(data.kpis.new_leads_7d, before.kpis.new_leads_7d + 1, "seven-day lead KPI must reflect the newly inserted D1 row");
  const beforeNew = before.lead_statuses.find(item => item.status === "new")?.count || 0;
  assert.equal(data.lead_statuses.find(item => item.status === "new")?.count, beforeNew + 1, "lead status breakdown must reflect the new row");
  assert.equal(data.kpis.active_customers, before.kpis.active_customers, "creating a lead must not change active customer count");
  assert.equal(data.recent_leads[0].id, "dashboard-lead-test");
  assert.equal(Object.hasOwn(data.recent_activity[0] || {}, "metadata_json"), false, "dashboard must not expose raw audit metadata");
});



test("new lead and email outbox event are persisted atomically when email is not configured", async () => {
  const ip = "198.51.100." + (30 + Math.floor(Math.random() * 100));
  const response = await server.fetch(origin + "/api/leads", {
    method: "POST",
    headers: { origin, "content-type": "application/json", "cf-connecting-ip": ip },
    body: JSON.stringify({
      name: "Outbox Test Lead",
      email: "outbox-test@example.test",
      service: "Website Design",
      budget: "20-50 million VND",
      goals: "Validate durable email event",
      consent: true
    })
  });
  assert.equal(response.status, 201, await response.clone().text());
  const body = await response.json();
  assert.equal(body.notification, "not_configured", "the API must not claim email was sent without provider configuration");
  const outboxResponse = await server.fetch(origin + "/_test/email-outbox", { headers: { origin } });
  assert.equal(outboxResponse.status, 200, await outboxResponse.clone().text());
  const events = (await outboxResponse.json()).data;
  const event = events.find(item => item.lead_id === body.id);
  assert.ok(event, "lead creation must enqueue a durable email event");
  assert.equal(event.event_key, "lead.created/" + body.id);
  assert.equal(event.status, "pending");
  assert.equal(event.attempts, 0);
});


test("email outbox retries transient provider failures with a stable idempotency key and stops on permanent failures", async () => {
  async function createOutboxLead(label) {
    const response = await server.fetch(origin + "/api/leads", {
      method: "POST",
      headers: { origin, "content-type": "application/json", "cf-connecting-ip": "198.51.100." + (40 + Math.floor(Math.random() * 100)) },
      body: JSON.stringify({
        name: label,
        email: "outbox-" + crypto.randomUUID() + "@example.test",
        service: "Website Design",
        budget: "20-50 million VND",
        goals: "Verify retry behavior",
        consent: true
      })
    });
    assert.equal(response.status, 201, await response.clone().text());
    return (await response.json()).id;
  }
  async function process(leadId, status, now) {
    return server.fetch(origin + "/_test/process-email-outbox?lead_id=" + encodeURIComponent(leadId) +
      "&provider_status=" + status + "&now=" + encodeURIComponent(now), {
      method: "POST", headers: { origin }
    });
  }
  async function readEvent(leadId) {
    const response = await server.fetch(origin + "/_test/email-outbox", { headers: { origin } });
    assert.equal(response.status, 200);
    return (await response.json()).data.find(item => item.lead_id === leadId);
  }

  const transientLeadId = await createOutboxLead("Transient Provider Failure");
  const firstNow = new Date();
  const transientFailure = await process(transientLeadId, 503, firstNow.toISOString());
  assert.equal(transientFailure.status, 200, await transientFailure.clone().text());
  const firstAttempt = await transientFailure.json();
  assert.equal(firstAttempt.data.processed, 1);
  assert.equal(firstAttempt.idempotency_key, "lead-created/" + transientLeadId);
  const pending = await readEvent(transientLeadId);
  assert.equal(pending.status, "pending");
  assert.equal(pending.attempts, 1);
  assert.equal(pending.last_error_code, "PROVIDER_HTTP_503");

  const retryNow = new Date(firstNow.getTime() + 10 * 60 * 1000);
  const retrySuccess = await process(transientLeadId, 200, retryNow.toISOString());
  assert.equal(retrySuccess.status, 200, await retrySuccess.clone().text());
  const secondAttempt = await retrySuccess.json();
  assert.equal(secondAttempt.data.processed, 1);
  assert.equal(secondAttempt.idempotency_key, firstAttempt.idempotency_key);
  const sent = await readEvent(transientLeadId);
  assert.equal(sent.status, "sent");
  assert.equal(sent.attempts, 2);
  assert.equal(sent.last_error_code, null);

  const permanentLeadId = await createOutboxLead("Permanent Provider Failure");
  const permanentFailure = await process(permanentLeadId, 400, new Date().toISOString());
  assert.equal(permanentFailure.status, 200, await permanentFailure.clone().text());
  const failed = await readEvent(permanentLeadId);
  assert.equal(failed.status, "failed");
  assert.equal(failed.attempts, 1);
  assert.equal(failed.last_error_code, "PROVIDER_HTTP_400");
});


test("authorization matrix separates admin, staff, customer membership roles, ordinary users and anonymous requests", async () => {
  const owner = await createSignedInUser("Matrix Customer Owner");
  const otherCustomer = await createSignedInUser("Matrix Other Customer");
  const admin = await createSignedInUser("Matrix Admin");
  const staff = await createSignedInUser("Matrix Staff");
  const member = await createSignedInUser("Matrix Customer Member");
  const billing = await createSignedInUser("Matrix Customer Billing");
  const ordinary = await createSignedInUser("Matrix Ordinary User");

  const seed = await authRequest("/_test/seed-identity", {
    userA: owner.id, userB: otherCustomer.id, adminUser: admin.id,
    staffUser: staff.id, memberUser: member.id, billingUser: billing.id
  });
  assert.equal(seed.status, 200, await seed.clone().text());

  const getFor = (path, cookie) => server.fetch(origin + path, { headers: { origin, cookie } });
  const postFor = (path, cookie, body) => server.fetch(origin + path, {
    method: "POST",
    headers: { origin, cookie, "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  assert.equal((await server.fetch(origin + "/api/v1/admin/customers", { headers: { origin } })).status, 401);
  assert.equal((await getFor("/api/v1/admin/customers", ordinary.cookie)).status, 403);
  assert.equal((await getFor("/api/v1/admin/leads", ordinary.cookie)).status, 403);
  assert.equal((await getFor("/api/v1/admin/projects", ordinary.cookie)).status, 403);
  assert.equal((await getFor("/api/v1/admin/templates", ordinary.cookie)).status, 403);

  for (const path of ["/api/v1/admin/customers", "/api/v1/admin/leads", "/api/v1/admin/projects", "/api/v1/admin/staff"]) {
    const response = await getFor(path, staff.cookie);
    assert.equal(response.status, 200, "staff should have operational access to " + path + ": " + await response.clone().text());
  }

  const pageSlug = "authorization-matrix-" + crypto.randomUUID().slice(0, 8);
  const pageCreate = await postFor("/api/v1/admin/pages", staff.cookie, {
    slug: pageSlug, title: "Authorization Matrix Draft",
    content: { blocks: [{ type: "paragraph", text: "Staff-managed draft content." }] }
  });
  assert.equal(pageCreate.status, 201, await pageCreate.clone().text());
  const page = (await pageCreate.json()).data;
  assert.equal(page.status, "draft");
  const pageUpdate = await server.fetch(origin + "/api/v1/admin/pages/" + page.id, {
    method: "PATCH",
    headers: { origin, cookie: staff.cookie, "content-type": "application/json" },
    body: JSON.stringify({ title: "Staff Updated Draft" })
  });
  assert.equal(pageUpdate.status, 200, await pageUpdate.clone().text());
  assert.equal((await postFor("/api/v1/admin/pages/" + page.id + "/publish", staff.cookie, {})).status, 403);
  assert.equal((await server.fetch(origin + "/api/v1/admin/pages/" + page.id, { method: "DELETE", headers: { origin, cookie: staff.cookie } })).status, 403);
  const adminPublish = await postFor("/api/v1/admin/pages/" + page.id + "/publish", admin.cookie, {});
  assert.equal(adminPublish.status, 200, await adminPublish.clone().text());

  const templateCreate = await postFor("/api/v1/admin/templates", staff.cookie, {
    slug: "matrix-template-" + crypto.randomUUID().slice(0, 8),
    name: "Authorization Matrix Template", template_type: "html_css",
    category: "Business", summary: "Draft created by staff.",
    description: "Used to verify staff permissions.", version: "1.0.0",
    preview_url: "https://demo.example.test/matrix-template",
    price_minor: 0, currency: "VND", license_key: "review_required", compatibility: {}
  });
  assert.equal(templateCreate.status, 201, await templateCreate.clone().text());
  const template = (await templateCreate.json()).data;
  const templateUpdate = await server.fetch(origin + "/api/v1/admin/templates/" + template.id, {
    method: "PATCH",
    headers: { origin, cookie: staff.cookie, "content-type": "application/json" },
    body: JSON.stringify({ description: "Updated by staff." })
  });
  assert.equal(templateUpdate.status, 200, await templateUpdate.clone().text());
  assert.equal((await postFor("/api/v1/admin/templates/" + template.id + "/publish", staff.cookie, {})).status, 403);
  assert.equal((await postFor("/api/v1/admin/templates/" + template.id + "/archive", staff.cookie, {})).status, 403);

  assert.equal((await getFor("/api/v1/me/quotes/test-quote-a", owner.cookie)).status, 200);
  assert.equal((await getFor("/api/v1/me/quotes/test-quote-a", member.cookie)).status, 200);
  assert.equal((await getFor("/api/v1/me/quotes/test-quote-a", billing.cookie)).status, 200);
  assert.equal((await getFor("/api/v1/me/quotes/test-quote-a", otherCustomer.cookie)).status, 404);
  assert.equal((await postFor("/api/v1/me/quotes/test-quote-a/accept", member.cookie, {})).status, 403);
  assert.equal((await postFor("/api/v1/me/quotes/test-quote-a/accept", billing.cookie, {})).status, 200);
  assert.equal((await postFor("/api/v1/me/quotes/test-quote-a/accept", owner.cookie, {})).status, 409);
  assert.equal((await getFor("/api/v1/me/orders", ordinary.cookie)).status, 200);
});
