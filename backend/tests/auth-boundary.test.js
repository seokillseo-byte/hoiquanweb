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

test("auth and CRM routes remain unavailable until the identity integration is implemented", async () => {
  const paths = [
    "/api/v1/auth/session",
    "/api/v1/auth/logout",
    "/api/v1/me",
    "/api/v1/admin/customers",
    "/api/v1/admin/quotes",
    "/api/v1/me/quotes",
    "/api/v1/me/projects",
  ];

  for (const path of paths) {
    const response = await request(path);
    assert.equal(response.status, 404, `${path} must not imply a working auth/CRM API`);
  }
});

test("legacy ADMIN_TOKEN does not unlock unimplemented CRM or customer routes", async () => {
  const paths = [
    "/api/v1/admin/customers",
    "/api/v1/admin/quotes",
    "/api/v1/me/quotes",
    "/api/v1/me/projects",
  ];

  for (const path of paths) {
    const response = await request(path, "Bearer test-only-legacy-token");
    assert.equal(response.status, 404, `${path} must remain unavailable without identity-based authorization`);
    const body = await response.json();
    assert.equal(body.error, "NOT_FOUND");
  }
});
