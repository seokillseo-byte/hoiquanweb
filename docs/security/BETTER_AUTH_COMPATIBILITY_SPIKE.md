# Better Auth + Cloudflare Workers/D1 compatibility spike

**Status:** Security regression guard added; Better Auth runtime integration is not yet implemented or accepted.

## Why this spike is gated

The repository currently has a Cloudflare Worker and a D1 binding placeholder. It does not have a verified deployment target or configured D1 database ID. The existing `ADMIN_TOKEN` protects only the legacy lead endpoint; it is not an identity/session system and must not authorize customer or CRM resources.

This change adds automated boundary tests so planned authentication and CRM routes cannot accidentally appear to work before a real provider and authorization layer are integrated.

## Compatibility work required before adding the provider

1. Confirm the exact supported Better Auth version and Cloudflare Workers adapter/runtime requirements from the provider's current official documentation.
2. Add the pinned dependency and lockfile; install reproducibly in CI.
3. Create an isolated test Worker + test D1 database and apply only the provider's documented migrations.
4. Verify sign-up/sign-in, session lookup, sign-out, expiry/revocation, and cookie attributes (Secure, HttpOnly, suitable SameSite, correct Path).
5. Verify trusted-origin enforcement and CSRF protection for cookie-authenticated mutations, including hostile-origin tests.
6. Verify recovery flow without account enumeration. Email delivery remains unaccepted until the sender domain/provider configuration is verified.
7. Add explicit role and resource-level authorization tests for admin, staff, and customer, including cross-customer quote/project/file access denial.
8. Verify secrets are read only from Worker secret bindings and never returned or logged.
9. Run the complete repository CI suite and record the exact dependency/runtime versions and results here.

## Current automated guard

`backend/tests/auth-boundary.test.js` verifies that the planned auth/session, customer portal, and CRM routes remain unavailable (404) until implemented. It also verifies that supplying the legacy `ADMIN_TOKEN` does not unlock these routes.

A 404 in this test is intentional: it is not a successful login/API implementation.

## Not done by this spike

- No Better Auth dependency or hand-written password/session cryptography.
- No auth, customer, quote, project, or file API exposed.
- No production D1 migration, Worker deployment, secret provisioning, or email-delivery claim.
- No PR merge.

## Acceptance criteria for the next implementation PR

- Real provider-backed integration tests run against an isolated Worker/D1 environment.
- Login/logout/session expiry/recovery and cookie/origin/CSRF tests pass.
- Server-side role and tenant authorization matrix passes.
- Protected endpoints fail closed on missing/invalid session and unauthorized resource membership.
- CI is green on the latest commit; staging deployment is separately verified before production enablement.
