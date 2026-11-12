# Better Auth staging and browser acceptance checklist

**Status: blocked on owner-controlled Cloudflare staging configuration.** This document defines the next executable gate after the local Worker/D1 integration spike. A green local CI run is not a staging result.

## 1. Required staging resources

- [ ] A dedicated non-production Cloudflare Worker name and URL; do not reuse production resources for tests.
- [ ] A dedicated D1 database, with its real ID configured only in the private deployment environment.
- [ ] Worker D1 binding named `DB` and migrations applied in order, including Better Auth migrations.
- [ ] `AUTH_BASE_URL` set to the exact Worker origin.
- [ ] `ALLOWED_ORIGINS` set to exact approved frontend origins only (comma-separated, no wildcard).
- [ ] Secure cookies enabled; do not set `AUTH_USE_SECURE_COOKIES=false` in staging or production.
- [ ] A dedicated staging frontend origin served over HTTPS. GitHub Pages preview may be used only if explicitly included in the allowlist.
- [ ] Secrets configured through Cloudflare secret storage, never committed to Git or pasted into issues/chat.
- [ ] A documented staging data-retention and cleanup procedure.

## 2. Browser end-to-end tests

Run against the deployed staging frontend and Worker using a real browser engine, not only direct Worker requests.

- [ ] Sign-up succeeds with a valid password and rejects a weak password.
- [ ] Sign-in succeeds; the browser receives the expected session cookie with `HttpOnly`, `Secure`, and appropriate `SameSite` attributes.
- [ ] Frontend requests use credentials and the Worker returns credentialed CORS headers only for the exact allowed origin.
- [ ] Session endpoint recognizes the signed-in user after page reload.
- [ ] Sign-out invalidates the session; subsequent session lookup is unauthenticated.
- [ ] Untrusted Origin is rejected and receives no permissive CORS response.
- [ ] A second browser/profile cannot reuse the first user's session.
- [ ] Error, timeout, offline, and expired-session states are visible and do not falsely report success.
- [ ] Verify cookie behavior in the actual chosen frontend/Worker domain topology; local tests do not prove cross-site cookie compatibility.

Record browser/version, frontend URL, Worker URL, test timestamp, and sanitized pass/fail evidence. Never record passwords, cookies, authorization headers, or session tokens.

## 3. Security gates before any customer data

- [ ] Rate limiting and abuse protection cover sign-up, sign-in, and recovery endpoints.
- [ ] Email verification and password recovery have an approved provider, verified sender domain, token expiry, single-use behavior, and abuse controls.
- [ ] Role assignment is server-controlled; public sign-up cannot create an admin/staff account.
- [ ] Protected API authorization matrix exists for admin/staff/customer.
- [ ] Cross-customer isolation tests cover every customer-owned resource and file.
- [ ] CSRF/session-origin strategy is documented for all state-changing endpoints.
- [ ] Audit logging excludes secrets and sensitive credential data.
- [ ] Backup/restore and migration rollback procedures are tested on staging.

## 4. Deployment and migration procedure

1. Confirm the target environment is staging and the D1 database is dedicated to staging.
2. Review the migration list and current database state before applying changes.
3. Apply migrations using the documented deployment command and capture the result without exposing secrets.
4. Deploy Worker with staging-only variables and secrets.
5. Run browser E2E tests and the security gates above.
6. Verify rollback/restore on disposable staging data.
7. Record the commit SHA, migration version, deployment timestamp, test evidence, and open risks.
8. Stop before production deployment or enabling real customer data until the owner explicitly approves the production change.

## Current known blockers

- `backend/wrangler.toml` contains a placeholder D1 database ID.
- No verified deployed staging Worker/D1 or browser E2E result is recorded.
- Email verification and password recovery are not implemented/verified as production flows.
- Rate limiting and authorization for customer/CRM resources remain future gates.
