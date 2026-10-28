# Better Auth staging verification runbook

**Status:** Prepared; staging deployment and browser verification have not been run.
**Scope:** Validate the Better Auth Worker/D1 integration before any production decision.
**Safety:** Use a dedicated staging Worker and D1 database. Never point this procedure at production and never put credentials in Git.

## 1. Required staging resources

Create these resources in the project owner's Cloudflare account:

- A dedicated Worker deployment for the current PR branch, with a staging-only name.
- A new D1 database for staging; do not reuse production or the local test database.
- An HTTPS staging frontend origin. GitHub Pages may be used only if its exact origin is explicitly allowlisted and the test account contains no real customer data.
- A verified sender domain/provider if testing email verification or password recovery.

Record the actual Worker URL and frontend origin in the deployment notes, not in source code. Do not continue until the resource owner has verified the account and target database.

## 2. Configuration checklist

Before deployment, verify the staging Worker configuration includes:

- `DB` bound to the newly created staging D1 database.
- `AUTH_BASE_URL` set to the exact HTTPS Worker origin (no trailing path).
- `ALLOWED_ORIGINS` set to the exact frontend origin(s), comma-separated only when multiple origins are intentionally supported.
- Secure cookies enabled; do not set `AUTH_USE_SECURE_COOKIES=false` outside the isolated local test harness.
- `TEST_MODE` unset or `false`; the test-only migration endpoint must not be exposed.
- No production secrets, production D1 bindings, or wildcard CORS origins copied into staging.

Check the final effective Worker configuration and bindings in Cloudflare before applying any migration.

## 3. Database migration gate

1. Review the Better Auth-generated schema/migration output for the pinned dependency version.
2. Confirm the migration targets the staging D1 database ID.
3. Back up/export any existing staging data if the database is not disposable.
4. Apply the migration to staging only, using the documented Better Auth/Wrangler procedure appropriate to the pinned version.
5. Verify expected auth tables exist and record migration output.
6. Confirm no production database ID was used.

Do not use the local-only `POST /_test/migrate` endpoint against a deployed environment. It must remain gated by `TEST_MODE=true` and must never be enabled on a public staging or production Worker.

## 4. Browser-level test matrix

Run from the actual HTTPS frontend origin against the actual staging Worker origin. Use a disposable test mailbox and a unique test password; do not use an employee's or customer's real credentials.

| Case | Action | Expected result |
|---|---|---|
| Trusted origin preflight | Send an OPTIONS request from the exact configured frontend origin | Specific `Access-Control-Allow-Origin`, credentials allowed, no wildcard |
| Untrusted origin | Repeat with a different Origin | No CORS permission granted |
| Sign-up | Create a new test account with a password of at least 12 characters | Successful response; password never returned |
| Weak password | Attempt sign-up with a short password | Rejected |
| Sign-in | Sign in using the new test account | Session cookie set with `HttpOnly`, `Secure`, and appropriate `SameSite` attributes |
| Session lookup | Call `/api/v1/auth/session` with browser credentials | Authenticated session is returned |
| Missing session | Call session endpoint in a clean browser context | No authenticated session |
| Wrong password | Sign in with incorrect password | Rejected without exposing account secrets |
| Sign-out | Sign out, then query session again | Session invalidated |
| Cookie/CORS browser behavior | Use `fetch(..., { credentials: "include" })` from the real frontend origin | Browser accepts only the explicitly trusted credentialed response |
| Origin/CSRF defense | Attempt auth mutation from an untrusted origin | Rejected; no session created or changed |
| Worker restart | Repeat session lookup after a new Worker isolate/request | Session remains valid until expiry/logout; not dependent on in-memory cache |
| Test-only endpoint | Request `POST /_test/migrate` | Not found/unavailable when `TEST_MODE` is not true |

Capture sanitized status codes, response headers, and screenshots/log snippets. Redact cookies, authorization headers, emails where not needed, and all secrets.

## 5. Browser DevTools checks

In Network/Application tools, inspect the Set-Cookie response metadata without copying the cookie value into reports:

- `HttpOnly` is present.
- `Secure` is present on HTTPS.
- `SameSite` matches the chosen cross-site deployment design.
- No wildcard `Access-Control-Allow-Origin: *` is returned with credentials.
- Requests that need a session send credentials explicitly.
- Session and auth responses are not cached publicly.

If the frontend and API are cross-site (not merely different subdomains), assess browser third-party-cookie restrictions. If the chosen browser blocks the cookie model, stop and decide on a same-site custom domain/proxy design rather than weakening cookie protections.

## 6. Security acceptance gates before CRM/customer portal

Do not expose CRM or customer portal routes until all are separately implemented and tested:

- Server-side role provisioning and authorization for admin, staff, and customer.
- Resource-level tenant/customer membership checks and cross-customer denial tests.
- Email verification and password recovery with a verified sender.
- Auth endpoint abuse protection/rate limiting and monitoring.
- Session expiry, revocation, CSRF/origin, and cookie behavior documented and tested.
- Versioned production migration and rollback plan.
- Privacy/retention process and incident-response ownership.

The current auth spike does not satisfy these gates by itself.

## 7. Evidence and sign-off

Attach the following to the PR or release record, with secrets redacted:

- Staging Worker URL, frontend origin, and confirmation that the D1 database is staging-only.
- Exact deployed commit SHA and dependency-lockfile hash.
- Migration result and schema verification.
- Browser/version and test date.
- Pass/fail result for every test in section 4.
- Sanitized CORS/cookie evidence and any browser-console errors.
- Open defects, owner, and remediation plan.

A successful GitHub Actions run is not staging verification. Mark staging as passed only after the browser test matrix is executed against the real deployed origins.
