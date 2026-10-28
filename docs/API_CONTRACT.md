# API Contract — Initial Platform

**Status:** Proposed contract for implementation and review. These routes are not implemented merely because they are listed here.

## Conventions

- Prefix: `/api/v1`.
- Request/response content type: `application/json; charset=utf-8`, except file upload/download endpoints.
- Every response uses a stable shape. Success: `{ "data": ..., "meta"?: ... }`; error: `{ "error": { "code": "STABLE_CODE", "message": "Safe user-facing message", "requestId"?: "..." } }`.
- Use appropriate HTTP status codes; never return stack traces, secrets, internal SQL, or raw provider errors.
- Validate schemas and payload limits server-side. Unknown fields should be rejected or ignored according to each versioned schema, consistently.
- Dates are UTC ISO-8601. Money uses integer minor units and currency, not floating point.
- Pagination is bounded and deterministic; list responses include cursor/page metadata.
- Mutating endpoints must enforce authorization and state transitions on the server. Use idempotency keys for operations that could create duplicate orders or approvals.

## Public endpoints

| Method | Route | Purpose | Access |
|---|---|---|---|
| GET | `/health` | Runtime health/readiness without exposing secrets | Public, minimal response |
| GET | `/api/v1/public/pages/:slug` | Read published page content only | Public |
| GET | `/api/v1/public/posts` | List published posts with bounded pagination | Public |
| GET | `/api/v1/public/posts/:slug` | Read a published post | Public |
| GET | `/api/v1/public/services` | List active service offerings | Public |
| GET | `/api/v1/public/templates` | List published templates with filters | Public |
| GET | `/api/v1/public/templates/:slug` | Read published template metadata | Public |
| POST | `/api/v1/public/leads` | Submit a lead with validation, consent and rate limits | Public, rate-limited |

Public APIs must never return drafts, private media keys, customer details, internal notes, unpublished templates or staff-only fields.

## Authentication and account endpoints

Final routes depend on the approved identity/session ADR. Do not implement password/session handling until the provider and cookie/token design are selected.

| Method | Route | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/auth/session` | Return the current authenticated identity and safe role summary | Authenticated session |
| POST | `/api/v1/auth/logout` | Revoke/end current session | Authenticated session |
| POST | `/api/v1/auth/recovery` | Start account recovery without account enumeration | Public, rate-limited |
| GET | `/api/v1/me` | Read current user's profile | Authenticated |
| PATCH | `/api/v1/me` | Update allowlisted profile fields | Authenticated |

If a managed identity provider owns login and recovery, document its callback routes, trusted origins, session expiry and logout semantics before enabling them.

## Customer portal

| Method | Route | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/me/quotes` | List quotes for current customer's authorized account | Customer |
| GET | `/api/v1/me/quotes/:id` | Read one authorized quote and items | Customer owner/member |
| POST | `/api/v1/me/quotes/:id/accept` | Accept a valid quote version | Customer authorized to accept |
| GET | `/api/v1/me/orders` | List own orders | Customer |
| GET | `/api/v1/me/projects` | List own projects and milestones | Customer |
| GET | `/api/v1/me/projects/:id/files` | List files the customer is allowed to access | Customer project member |
| POST | `/api/v1/me/projects/:id/comments` | Add a customer-visible project comment | Customer project member |
| GET | `/api/v1/me/tickets` | List own support tickets | Customer |
| POST | `/api/v1/me/tickets` | Open a support request | Customer |

Never accept a client-provided customer ID as proof of ownership. Resolve membership from the authenticated principal and authorize every resource read/write. Quote acceptance must validate status/version and record actor/time atomically.

## Admin/staff endpoints

| Method | Route | Purpose | Access |
|---|---|---|---|
| GET/POST | `/api/v1/admin/pages` | List/create pages | CMS permission |
| GET/PATCH/DELETE | `/api/v1/admin/pages/:id` | Read/update/archive page | CMS permission |
| POST | `/api/v1/admin/pages/:id/publish` | Publish an approved revision | Publish permission |
| GET/POST | `/api/v1/admin/posts` | List/create posts | CMS permission |
| GET/POST/PATCH | `/api/v1/admin/templates` | Manage template metadata | Template permission |
| GET/PATCH | `/api/v1/admin/leads` | Review/assign/update leads | CRM permission |
| GET/POST | `/api/v1/admin/customers` | Manage customer records | CRM permission |
| GET/POST | `/api/v1/admin/quotes` | Create/list quotes and items | Quote permission |
| GET/POST | `/api/v1/admin/projects` | Create/list projects | Project permission |
| GET/PATCH | `/api/v1/admin/users` | Manage users and role assignments | User-admin permission |

The table is a target contract, not a claim of route availability. Add request/response schemas and error cases alongside each implementation PR. Avoid generic endpoints that permit mass assignment of protected fields.

## Security invariants

1. Authorization is server-side and deny-by-default for every route.
2. Public routes return published content only; private records are scoped to authorized users.
3. Admin/staff permissions are explicit and distinct from customer roles.
4. Use CSRF protection for cookie-authenticated state changes; set Secure, HttpOnly and suitable SameSite cookie attributes.
5. Configure strict CORS allowlists. CORS is not an authorization mechanism.
6. Rate-limit login/recovery, lead submission and expensive operations; avoid leaking account existence.
7. Validate state transitions, record audit events, and prevent duplicate actions with transaction/idempotency where appropriate.
8. File uploads require type/size checks, malware/scanning policy where applicable, private storage defaults and server-authorized download.
9. Tests must prove cross-customer access is denied and public APIs never expose drafts or internal fields.
10. API schema and contract tests must run in CI before a route is considered accepted.
