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
  for (const path of ["/api/v1/me", "/api/v1/me/customers", "/api/v1/me/quotes", "/api/v1/admin/customers", "/api/v1/admin/customers/test-customer/activities", "/api/v1/admin/quotes", "/api/v1/admin/staff", "/api/v1/admin/media", "/api/v1/me/notifications"]) {
    const response = await request(path);
    assert.equal(response.status, 503, `${path} must fail closed if identity storage is unavailable`);
    const body = await response.json();
    assert.equal(body.error.code, "SERVICE_UNAVAILABLE");
  }
});

test("legacy ADMIN_TOKEN does not bypass identity-protected routes", async () => {
  for (const path of ["/api/v1/me", "/api/v1/me/customers", "/api/v1/me/quotes", "/api/v1/admin/customers", "/api/v1/admin/customers/test-customer/activities", "/api/v1/admin/quotes", "/api/v1/admin/staff", "/api/v1/admin/media", "/api/v1/me/notifications"]) {
    const response = await request(path, "Bearer test-only-legacy-token");
    assert.equal(response.status, 503, `${path} must not use the legacy token as identity`);
    const body = await response.json();
    assert.equal(body.error.code, "SERVICE_UNAVAILABLE");
  }
});

test("legacy lead administration no longer accepts the shared ADMIN_TOKEN", async () => {
  const response = await request("/api/v1/admin/leads", "Bearer test-only-legacy-token");
  assert.equal(response.status, 503, "lead administration must fail closed when identity storage is unavailable");
  const versionedLeadConversion = await worker.fetch(new Request("https://api.example.test/api/v1/admin/leads/test-lead/convert", {
    method: "POST",
    headers: { Origin: "https://example.test", Authorization: "Bearer test-only-legacy-token" }
  }), env);
  assert.equal(versionedLeadConversion.status, 503, "versioned lead conversion must fail closed when identity storage is unavailable");
  const body = await response.json();
  assert.equal(body.error.code, "SERVICE_UNAVAILABLE");
});

test("private project file routes fail closed when private object storage is unavailable", async () => {
  const response = await request("/api/v1/me/projects/test-project/files");
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, "SERVICE_UNAVAILABLE");
});

test("public media delivery fails closed when media storage/database is unavailable", async () => {
  const response = await request("/api/v1/public/media/test-asset");
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, "SERVICE_UNAVAILABLE");
});

test("customer portal routes fail closed when identity storage is unavailable", async () => {
  for (const path of ["/api/v1/me/projects", "/api/v1/me/orders", "/api/v1/me/tickets"]) {
    const response = await request(path);
    assert.equal(response.status, 503, `${path} must require a valid authenticated identity`);
    assert.equal((await response.json()).error.code, "SERVICE_UNAVAILABLE");
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



test("lead history remains protected from anonymous and legacy-token access", async () => {
  for (const authorization of [undefined, "Bearer test-only-legacy-token"]) {
    const response = await request("/api/v1/admin/leads/test-lead/events", authorization);
    assert.equal(response.status, 503, "lead history must fail closed when identity storage is unavailable");
    const body = await response.json();
    assert.equal(body.error.code, "SERVICE_UNAVAILABLE");
  }
});
