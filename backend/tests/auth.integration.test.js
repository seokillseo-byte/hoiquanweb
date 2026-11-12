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
  assert.deepEqual((await revisions.json()).data.map(item => item.action), ["updated", "published", "updated", "created"]);
});
