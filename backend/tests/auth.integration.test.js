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

  const signOut = await server.fetch(origin + "/api/v1/auth/sign-out", {
    method: "POST", headers: { origin, cookie }
  });
  assert.equal(signOut.status, 200, await signOut.clone().text());

  const session = await server.fetch(origin + "/api/v1/auth/session", { headers: { origin, cookie } });
  assert.equal(session.status, 200);
  assert.equal(await session.json(), null);
});

test("hostile Origin is rejected before auth routes are reached", async () => {
  const response = await server.fetch(origin + "/api/v1/auth/sign-up/email", {
    method: "POST",
    headers: { origin: "https://attacker.invalid", "content-type": "application/json" },
    body: JSON.stringify({ name: "Attacker", email: "attacker@example.test", password: "Valid-Test-Password-123!" })
  });
  assert.equal(response.status, 403);
});
