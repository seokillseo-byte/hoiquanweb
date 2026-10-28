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
