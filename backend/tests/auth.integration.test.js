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

  const seed = await authRequest("/_test/seed-identity", {
    userA: userA.id,
    userB: userB.id,
    adminUser: admin.id
  });
  assert.equal(seed.status, 200, await seed.clone().text());

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
  assert.deepEqual((await quotesA.json()).data.map(item => item.quote_number), ["TEST-A"]);

  const quotesB = await getFor("/api/v1/me/quotes", userB.cookie);
  assert.equal(quotesB.status, 200, await quotesB.clone().text());
  assert.deepEqual((await quotesB.json()).data.map(item => item.quote_number), ["TEST-B"]);

  const ordinaryAdminAccess = await getFor("/api/v1/admin/customers", ordinaryUser.cookie);
  assert.equal(ordinaryAdminAccess.status, 403, await ordinaryAdminAccess.clone().text());

  const adminAccess = await getFor("/api/v1/admin/customers", admin.cookie);
  assert.equal(adminAccess.status, 200, await adminAccess.clone().text());
  assert.deepEqual(new Set((await adminAccess.json()).data.map(item => item.id)), new Set(["test-customer-a", "test-customer-b"]));

  const noMembership = await getFor("/api/v1/me/customers", ordinaryUser.cookie);
  assert.equal(noMembership.status, 200, await noMembership.clone().text());
  assert.deepEqual((await noMembership.json()).data, []);
});
