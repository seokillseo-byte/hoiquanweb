# Better Auth + Cloudflare Workers/D1 runtime verification

**Status:** Official-source compatibility review completed; application integration and runtime tests are still pending.

**Reviewed:** 2026-10-28  
**Repository baseline:** feat/better-auth-compatibility-spike at e0ea3c27b2c54751ced5457667a8a0885bb8518c

## Official-source evidence

The upstream better-auth/better-auth repository currently contains a Cloudflare Workers smoke-test fixture. This is stronger evidence than assuming generic Node.js support means Workers compatibility.

- [Upstream Cloudflare smoke-test fixture](https://github.com/better-auth/better-auth/tree/main/e2e/smoke/test/fixtures/cloudflare)
- [Fixture auth configuration](https://github.com/better-auth/better-auth/blob/main/e2e/smoke/test/fixtures/cloudflare/src/auth.ts)
- [Fixture Worker routing and D1 migration harness](https://github.com/better-auth/better-auth/blob/main/e2e/smoke/test/fixtures/cloudflare/src/index.ts)
- [Fixture Wrangler configuration](https://github.com/better-auth/better-auth/blob/main/e2e/smoke/test/fixtures/cloudflare/wrangler.json)
- [Upstream authentication-flow tests](https://github.com/better-auth/better-auth/blob/main/e2e/smoke/test/fixtures/cloudflare/test/auth-flow.test.ts)
- [Upstream D1 migration tests](https://github.com/better-auth/better-auth/blob/main/e2e/smoke/test/fixtures/cloudflare/test/migration.test.ts)

Observed upstream implementation details:

1. Better Auth is initialized with the Worker runtime's env.DB D1 binding.
2. Auth handlers are mounted on a Worker-compatible router under /api/auth/*.
3. The upstream fixture uses Wrangler's createTestHarness for local Worker tests and calls Better Auth's migration API against the test database.
4. Its Wrangler configuration enables nodejs_compat and declares a D1 binding.
5. The upstream fixture pins Wrangler in its own workspace and runs auth-flow tests for sign-up, sign-in, cookie-based session lookup, invalid-password rejection, and repeated D1 migrations.

This confirms there is a concrete upstream Workers/D1 test path to follow. It does **not** establish that this repository's production configuration is valid, that a deployed D1 database exists, or that every security requirement for this product has been met.

## Repository-specific findings

- The current project root package contains only the frontend toolchain; it has no Better Auth or Wrangler dependency.
- backend/wrangler.toml still contains a placeholder D1 database_id.
- The current Worker has no implemented provider-backed session endpoints or customer/CRM authorization layer.
- The current auth-boundary tests intentionally expect planned routes to remain unavailable until implementation.
- There is no verified staging Worker/D1 deployment or configured email sender in this repository state.

## Implementation decision

Proceed with a **separate backend auth test harness** rather than adding auth dependencies to the frontend package. Before implementing routes:

1. Create a backend-specific package and lockfile with explicitly pinned, mutually compatible Better Auth, Wrangler, and test-runner versions. Record the resolved versions in the PR; do not use floating latest versions.
2. Adapt the upstream Workers/D1 harness pattern to this repository's Worker entry point, keeping test-only endpoints out of production routing.
3. Run local D1 migrations in an isolated Wrangler test environment; do not target a production database.
4. Add provider-backed tests for sign-up/sign-in, sign-out, session lookup/expiry, cookie flags, trusted origins/CSRF, and missing/invalid sessions.
5. Add authorization tests for admin/staff/customer roles and cross-customer resource access before exposing CRM/customer endpoints.
6. Keep recovery/email delivery as unaccepted until a verified test mail provider is configured. Never put credentials in repository files or PR comments.
7. Require green CI and an explicitly verified staging deployment before enabling authentication in production.

## Security boundaries

- Do not implement password hashing, session signing, or cookie cryptography manually.
- Do not reuse the legacy shared ADMIN_TOKEN as an identity/session substitute.
- Do not expose CRM/customer APIs until server-side role and resource-membership checks are implemented and tested.
- Do not create or apply a production D1 migration, deploy a Worker, or configure secrets as part of this documentation-only change.

## Acceptance criteria for the implementation PR

- Reproducible backend dependency installation from a committed lockfile.
- Wrangler local Worker/D1 integration tests execute in CI, not just static assertions.
- Authentication, cookie, origin/CSRF, and session lifecycle tests pass.
- Cross-customer authorization tests prove denial by default.
- Existing API tests, frontend typecheck, and production build remain green.
- Documentation records the exact tested dependency versions and separates local test results from staging/production verification.
