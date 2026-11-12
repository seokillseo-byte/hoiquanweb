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

Quote detail and acceptance are implemented for authenticated customer members. `GET /api/v1/me/quotes/:id` returns only quotes belonging to the current user's customer membership, including line items. `POST /api/v1/me/quotes/:id/accept` is limited to owner/billing members, accepts only a non-expired quote in `sent` state, performs a conditional state transition and records `quote.accepted` in `crm_audit_events` atomically. Cross-customer access returns 404; repeated or stale acceptance returns 409.
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
| GET/POST | `/api/v1/admin/pages` | List/create pages | Admin or staff; creates are drafts |
| GET/PATCH/DELETE | `/api/v1/admin/pages/:id` | Read/update/archive page | Admin or staff for read/update; admin for archive |
| POST | `/api/v1/admin/pages/:id/publish` | Publish a page and record a revision | Admin |
| GET/POST | `/api/v1/admin/posts` | List/create posts | Admin or staff; creates are drafts |
| POST | `/api/v1/admin/posts/:id/publish` | Publish a post and record a revision | Admin |
| GET/POST | `/api/v1/admin/services` | List/create service content | Admin or staff; creates are drafts |
| GET/PATCH/DELETE | `/api/v1/admin/services/:id` | Read/update/archive service content | Admin or staff for read/update; admin for archive |
| POST | `/api/v1/admin/services/:id/publish` | Publish a service and record a revision | Admin |
| GET/POST/PATCH | `/api/v1/admin/templates` | Manage template metadata | Template permission |
| GET/PATCH | `/api/v1/admin/leads` | Review/assign/update leads | CRM permission |
| POST | `/api/v1/admin/leads/:id/convert` | Convert a lead into one CRM customer, preserve source attribution and create an initial activity | Admin or staff |
| GET/POST | `/api/v1/admin/customers` | Manage customer records | CRM permission |
| GET/PATCH | `/api/v1/admin/customers/:id` | Read or update customer details/status | Admin or staff |
| GET/POST | `/api/v1/admin/customers/:id/activities` | Read or add customer activity timeline entries | Admin or staff
| GET/POST | `/api/v1/admin/quotes` | Create/list quotes and items | Quote permission |
| GET | `/api/v1/admin/quotes/:id` | Read quote and line items | Admin or staff |
| POST | `/api/v1/admin/quotes/:id/send` | Send a draft quote (state transition; no email is sent yet) | Admin or staff |
| GET/POST | `/api/v1/admin/projects` | Create/list projects | Project permission |
| GET/PATCH | `/api/v1/admin/users` | Manage users and role assignments | User-admin permission |

Lead conversion is implemented at `POST /api/v1/admin/leads/:id/convert`. It requires an authenticated admin/staff session, validates the source lead and email, creates a CRM customer linked through `crm_customers.lead_id`, records a system activity containing the original service/budget/goals and writes customer/lead audit events in one D1 batch. Repeating the conversion returns the existing customer instead of creating a duplicate. It does not automatically mark the lead won or send email.

The table is a target contract, not a claim of route availability. Add request/response schemas and error cases alongside each implementation PR. Avoid generic endpoints that permit mass assignment of protected fields.


CMS revision history is available to authenticated admin/staff users at `GET /api/v1/admin/{pages|posts|services}/:id/revisions`. The endpoint returns revision identifiers, action, actor and timestamp, without exposing the stored snapshot payload. Admin-only restore is available at `POST /api/v1/admin/{pages|posts|services}/:id/restore` with `{ "revision_id": "..." }`. The revision must belong to the same resource and type. Restore creates a new immutable revision and always places the content in draft state with `published_at=null`; a separate admin publish action is required to make it public.

## CMS page block content schema

The content_json field is stored as a JSON object with a blocks array. The public renderer accepts only these block types:

| Type | Fields |
|---|---|
| heading | text string, level integer 2–4 |
| paragraph | text string |
| list | items string array, optional ordered boolean |
| quote | text string, optional author string |
| image | src HTTP(S) or site-relative URL, alt string, optional caption string |
| cta | label string, href safe HTTP(S), site-relative or fragment URL |
| faq | items array of objects with question and answer strings |
| divider | no additional fields |

The public renderer builds DOM nodes and assigns text with textContent; it does not accept raw HTML or inject innerHTML. Unsupported blocks are ignored. Public CMS overrides are loaded only when the build-time API base is configured and a published page slug matches the static route. Current slug mapping is home for /, en for /en/, and the final route segment for other pages.

SEO JSON may include title, description and robots: "noindex". A missing API, unpublished page or failed request leaves the generated static page unchanged.

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
