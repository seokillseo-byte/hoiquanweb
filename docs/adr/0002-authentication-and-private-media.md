# ADR-0002: Authentication, sessions and private media

- **Status:** Decision for prototype; production enablement is gated on dependency compatibility tests and deployment configuration.
- **Date:** 2026-10-28

## Context

The platform needs staff-only CMS/CRM access and a customer portal. The repository currently has a static frontend and an existing Worker/D1 lead API with a shared `ADMIN_TOKEN` gate. That token is not an acceptable long-term identity model for staff and customers. Private project files must not be exposed by public object URLs.

## Decision

1. **Identity/session prototype:** evaluate Better Auth on Cloudflare Workers with D1 as the session/user persistence layer. Use secure, HttpOnly cookies and same-site protections; configure trusted origins explicitly. Prefer email verification and password reset through the existing Resend integration once the sending domain is verified. Never store raw passwords or implement password hashing/session cryptography ourselves.
2. **Role and tenancy authorization:** application code must enforce explicit roles (`admin`, `staff`, `customer`) and resource-level customer membership checks on every protected API. Authentication alone does not grant access to a customer/project.
3. **Private media prototype:** Cloudflare R2 is the preferred object storage candidate. Keep customer files private; route downloads through an authenticated Worker that checks project/customer authorization before streaming the object. Do not expose bucket credentials or permanent public object URLs. Short-lived signed URLs may be considered only after threat-model and expiry tests.
4. **Secrets and configuration:** secrets are provisioned through the Cloudflare dashboard/CLI secret store, never committed to Git or sent in chat. Separate local, staging and production configuration.
5. **Compatibility gate:** before shipping login, add a minimal integration prototype and test the current supported Better Auth/Workers/D1 versions, cookie behavior, migrations, password recovery, email delivery and CSRF/origin protections. If the supported runtime integration fails, revisit this ADR rather than silently substituting custom auth.

## Consequences

- Do not use the existing shared `ADMIN_TOKEN` as customer authentication or as a permanent staff login mechanism.
- Do not implement production sign-in until the dependency integration and deployment origins have been verified.
- CMS and public content work can proceed independently; public read APIs must return only published rows.
- R2 account/bucket creation and secret setup require project-owner authorization and cannot be claimed complete in this repository-only change.

## Acceptance checks before production

- Verified login, logout, session expiry and recovery flows.
- Cookies are Secure, HttpOnly and SameSite-appropriate; CSRF/origin checks pass.
- Staff/customer role boundaries and cross-customer access denial are covered by integration tests.
- Private object downloads fail without a valid session and authorization.
- No secrets in repository history, responses or logs.


## CMS public media implementation

- CMS public images use the same Cloudflare R2 candidate but are distinct from private customer/project attachments.
- All R2 objects remain in a non-public bucket. The Worker streams an asset only after checking its D1 publication state; draft previews require an authenticated admin/staff session.
- Uploads are restricted to PNG, JPEG, GIF and WebP, capped at 5 MiB, with file-signature validation and server-generated object keys. SVG and arbitrary files are not accepted.
- Admin publication/archive is an explicit state transition. Archiving revokes the public Worker route while retaining the object for controlled retention/deletion.
- Customer project attachments still require separate project/customer authorization and must never reuse the public CMS media route.
- Staging and production bucket creation, D1 migration application, and browser/runtime verification remain owner-account deployment steps.


## Customer project files and in-app notifications

- Customer project files use the private R2 binding and are never delivered through public URLs. Every list/download request checks current customer membership and the file visibility flag.
- In-app notifications are stored in D1 and scoped to the authenticated user. Notification payloads contain generic event summaries and resource references only, not comment or ticket message bodies.
- Email delivery is a separate integration; an in-app notification must not be reported as an email sent. Resend sender identity, secrets, retry policy and consent remain staging/production configuration gates.
