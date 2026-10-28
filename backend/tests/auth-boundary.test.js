import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.js";

const env = {
  ALLOWED_ORIGINS: "https://example.test",
  // Deliberately present: this legacy shared token must not become user authentication.
  ADMIN_TOKEN: "test-only-legacy-token",
};

async function request(path, authorization) {
  const headers = { Origin: "https://example.test" };
  if (authorization) headers.Authorization = authorization;
  return worker.fetch(new Request("https://api.example.test" + path, { headers }), env);
}

test("identity-protected routes fail closed when the identity database is unavailable", async () => {
  for (const path of ["/api/v1/me", "/api/v1/me/customers", "/api/v1/me/quotes", "/api/v1/admin/customers"]) {
    const response = await request(path);
    assert.equal(response.status, 503, `${path} must fail closed if identity storage is unavailable`);
    const body = await response.json();
    assert.equal(body.error.code, "SERVICE_UNAVAILABLE");
  }
});

test("legacy ADMIN_TOKEN does not bypass identity-protected routes", async () => {
  for (const path of ["/api/v1/me", "/api/v1/me/customers", "/api/v1/me/quotes", "/api/v1/admin/customers"]) {
    const response = await request(path, "Bearer test-only-legacy-token");
    assert.equal(response.status, 503, `${path} must not use the legacy token as identity`);
    const body = await response.json();
    assert.equal(body.error.code, "SERVICE_UNAVAILABLE");
  }
});

test("legacy lead administration no longer accepts the shared ADMIN_TOKEN", async () => {
  const response = await request("/api/admin/leads", "Bearer test-only-legacy-token");
  assert.equal(response.status, 503, "lead administration must fail closed when identity storage is unavailable");
  const body = await response.json();
  assert.equal(body.error.code, "SERVICE_UNAVAILABLE");
});

test("unimplemented customer portal routes remain unavailable", async () => {
  for (const path of ["/api/v1/admin/quotes", "/api/v1/me/projects"]) {
    const response = await request(path);
    assert.equal(response.status, 404, `${path} must not imply a working protected API`);
  }
});

test("test-only D1 migration endpoint is unavailable when TEST_MODE is not enabled", async () => {
  const response = await worker.fetch(new Request("https://api.example.test/_test/migrate", {
    method: "POST",
    headers: { Origin: "https://example.test" },
  }), env);

  assert.equal(response.status, 404);
  assert.equal((await response.json()).error, "NOT_FOUND");
});

test("test-only identity fixture endpoint is unavailable outside TEST_MODE", async () => {
  const response = await worker.fetch(new Request("https://api.example.test/_test/seed-identity", {
    method: "POST",
    headers: { Origin: "https://example.test", "content-type": "application/json" },
    body: JSON.stringify({ userA: "a", userB: "b", adminUser: "c" }),
  }), env);

  assert.equal(response.status, 404);
  assert.equal((await response.json()).error, "NOT_FOUND");
});

