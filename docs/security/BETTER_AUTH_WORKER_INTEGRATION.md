# Better Auth Worker/D1 integration spike

## What this branch implements

- Pins Better Auth 1.7.14 and Wrangler 4.123.0 in the repository package manifest.
- Mounts Better Auth's email/password handlers at `/api/v1/auth/*`.
- Adds `GET /api/v1/auth/session` as a session lookup endpoint.
- Adds a test-only D1 schema migration endpoint at `POST /_test/migrate`, enabled only when the Worker binding `TEST_MODE=true`.
- Adds Wrangler's isolated local D1 test configuration and integration tests for sign-up, weak-password rejection, sign-in, session cookie/session lookup, invalid credentials, sign-out, and hostile Origin rejection.
- Adds the auth integration suite to GitHub Actions.
- Tests credentialed CORS preflight for an explicitly allowlisted origin and verifies that an untrusted origin receives no CORS permission.

## Test scope and limitations

These are local Worker/D1 integration tests; they are not evidence of a production deployment. The test config uses a local-only placeholder D1 identifier and disables Secure cookies only for the local HTTP harness. Production must use HTTPS and secure cookies.

This spike does not yet implement customer/staff/admin role provisioning, protected CRM routes, cross-customer resource authorization, account recovery/email verification, rate limiting for auth endpoints, or production D1 schema rollout. CRM/customer APIs must remain unavailable until those controls have dedicated tests.

The frontend preview is hosted on GitHub Pages while the Worker is a separate origin, so browser session requests must use credentialed fetch (`credentials: "include"`) and the Worker must emit `Access-Control-Allow-Credentials: true` only for exact origins in `ALLOWED_ORIGINS`. Never use wildcard origins with cookies. The integration suite verifies Worker preflight headers, but does not replace a browser-level test against the actual deployed frontend and Worker origins.

The existing `ADMIN_TOKEN` remains a legacy lead-management mechanism and is not an identity/session substitute. Do not add credentials to source control. Do not deploy this Worker or apply migrations to production as part of this spike.

## Production gate

Before enabling this integration in a real environment:

1. Commit reproducible dependency resolution (including a reviewed lockfile).
2. Review the generated Better Auth D1 schema and establish a versioned production migration process.
3. Configure a real D1 database ID and secure Worker secrets outside source control.
4. Test session expiry, cookie security in HTTPS, CSRF/trusted-origin behavior, recovery/email delivery, role authorization, and cross-customer isolation.
5. Run all tests in CI and validate the deployment in staging before production.
