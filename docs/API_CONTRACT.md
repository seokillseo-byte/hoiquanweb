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
| GET | `/api/v1/public/posts` | List published posts with bounded pagination and category/tag/search filters | Public |
| GET | `/api/v1/public/post-categories` | List categories that contain published posts | Public |
| GET | `/api/v1/public/posts/:slug` | Read a published post including editorial taxonomy | Public |
| GET | `/api/v1/public/services` | List active service offerings | Public |
| GET | `/api/v1/public/templates` | List published templates with filters | Public |
| GET | `/api/v1/public/templates/:slug` | Read published template metadata | Public |
| GET | `/api/v1/public/media/:id` | Stream an explicitly published CMS image from private R2 storage | Public; published assets only |
| POST | `/api/v1/public/leads` | Submit a lead with validation, consent and rate limits | Public, rate-limited |

Public APIs must never return drafts, private media keys, customer details, internal notes, unpublished templates or staff-only fields.

Template catalog listing supports bounded `type`, `category`, `q`, `limit` and `offset` filters. Public template detail is published-only. The admin publish action requires a non-empty demo URL plus explicit administrator attestations for preview and license review; those flags are never exposed publicly. Editing a published template returns it to draft. These attestations are workflow controls, not automated legal, malware or compatibility verification.

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
| GET | `/api/v1/me/notifications` | List the current user's notifications and unread count | Authenticated user |
| POST | `/api/v1/me/notifications/:id/read` | Mark one owned notification as read | Notification owner |
| POST | `/api/v1/me/notifications/read-all` | Mark all current user's notifications as read | Authenticated user |
| GET | `/api/v1/me/projects` | List own projects and milestones | Customer |
| GET | `/api/v1/me/projects/:id/files` | List customer-visible project files | Customer project member |
| POST | `/api/v1/me/projects/:id/files` | Upload a private customer-visible project file (PDF, PNG, JPEG, WebP, TXT, CSV; max 10 MiB) | Customer project member |
| GET | `/api/v1/me/projects/:id/files/:fileId` | Download a customer-visible project file after membership check | Customer project member |
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
| GET/POST | `/api/v1/admin/templates` | Filter/list and create template drafts | Admin or staff |
| GET/PATCH | `/api/v1/admin/templates/:id` | Read/update template; edits return it to draft | Admin or staff |
| POST | `/api/v1/admin/templates/:id/publish` | Publish after preview and license verification attestations | Admin |
| POST | `/api/v1/admin/templates/:id/archive` | Archive template | Admin |
| GET | `/api/v1/admin/templates/:id/revisions` | Read template revision metadata | Admin or staff |
| GET/POST | `/api/v1/admin/media` | List CMS media or upload a draft image to private R2 | Admin or staff |
| GET/PATCH | `/api/v1/admin/media/:id` | Read metadata or update alt text | Admin or staff |
| GET | `/api/v1/admin/media/:id/file` | Preview any CMS media asset before publication | Admin or staff |
| POST | `/api/v1/admin/media/:id/publish` | Publish a validated CMS image for public delivery | Admin |
| POST | `/api/v1/admin/media/:id/archive` | Revoke public delivery of a CMS image | Admin |
| GET/PATCH | `/api/v1/admin/leads` | Review, update status and assign/unassign staff | Admin or staff |
| GET | `/api/v1/admin/staff` | List assignable admin/staff accounts | Admin or staff |
| GET | `/api/v1/admin/leads/:id/events` | Read lead history including assignment/status events | Admin or staff |
| POST | `/api/v1/admin/leads/:id/convert` | Convert a lead into one CRM customer, preserve source attribution and create an initial activity | Admin or staff |
| GET/POST | `/api/v1/admin/customers` | Manage customer records | CRM permission |
| GET/PATCH | `/api/v1/admin/customers/:id` | Read or update customer details/status | Admin or staff |
| GET/POST | `/api/v1/admin/customers/:id/activities` | Read or add customer activity timeline entries | Admin or staff
| GET/POST | `/api/v1/admin/quotes` | Create/list quotes and items | Quote permission |
| GET | `/api/v1/admin/quotes/:id` | Read quote and line items | Admin or staff |
| POST | `/api/v1/admin/quotes/:id/send` | Send a draft quote (state transition; no email is sent yet) | Admin or staff |
| GET/POST | `/api/v1/admin/projects` | Create/list projects | Project permission |
| GET/PATCH | `/api/v1/admin/users` | Manage users and role assignments | User-admin permission |

Lead conversion is implemented at `POST /api/v1/admin/leads/:id/convert`. It requires an authenticated admin/staff session and only permits leads in `qualified`, `proposal_sent` or `won` status. It validates the source lead and email, creates a CRM customer linked through `crm_customers.lead_id`, records a system activity containing the original service/budget/goals and writes customer/lead audit events in one D1 batch. Repeating the conversion returns the existing customer instead of creating a duplicate. It does not automatically mark the lead won or send email. Admin lead list results include the linked `customer_id` to prevent duplicate conversion actions.

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

The public renderer builds DOM nodes and assigns text with textContent; it does not accept raw HTML or inject innerHTML. Unsupported blocks are ignored. CMS posts store a category string and up to 20 normalized, deduplicated tags. Public post listing accepts bounded `category`, `tag`, and `q` filters; category discovery counts only published posts. The bilingual blog listing and article shell use public APIs with credentials omitted, render approved blocks through the same safe renderer, and update document title/description/canonical/Article JSON-LD after a published article is loaded. The article route currently uses a stable static route plus a `?slug=` parameter; static hosting does not generate a distinct HTML document per database article, so crawler-specific prerendering remains a separate acceptance item. Public CMS overrides are loaded only when the build-time API base is configured and a published page slug matches the static route. Current slug mapping is home for /, en for /en/, and the final route segment for other pages.

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


## Customer workspace: orders, projects and support

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/me/orders` | List orders belonging to the signed-in user's customer memberships | Authenticated customer |
| GET | `/api/v1/me/projects` | List customer projects and milestone counts | Authenticated customer |
| GET | `/api/v1/me/projects/:id` | Read one authorized project and its milestones | Project membership |
| GET/POST | `/api/v1/me/projects/:id/comments` | Read/add customer-visible project comments | Project membership |
| GET/POST | `/api/v1/me/tickets` | List/create support tickets for a linked customer profile | Authenticated customer + membership |
| GET/POST | `/api/v1/me/tickets/:id/messages` | Read/reply to an authorized support ticket | Ticket customer membership |
| GET/POST | `/api/v1/admin/orders` | List orders; create an order from an accepted quote | Admin or staff |
| GET/POST/PATCH | `/api/v1/admin/projects` | List/create/update projects | Admin or staff |
| GET | `/api/v1/admin/projects/:id/files` | List customer-visible and internal project files | Admin or staff |
| POST | `/api/v1/admin/projects/:id/files?visibility=customer\|internal` | Upload a private project file with explicit visibility | Admin or staff |
| GET | `/api/v1/admin/projects/:id/files/:fileId` | Download a project file, including internal files | Admin or staff |
| GET/POST | `/api/v1/admin/projects/:id/milestones` | List/add milestones | Admin or staff |
| PATCH | `/api/v1/admin/milestones/:id` | Update milestone status/details | Admin or staff |
| GET/PATCH | `/api/v1/admin/tickets/:id` | Read and update support ticket status/priority | Admin or staff |
| GET/POST | `/api/v1/admin/tickets/:id/messages` | Read/respond to support tickets | Admin or staff |

Customer-facing project and ticket queries are scoped through `crm_customer_members`. Customer message responses omit internal actor IDs. Project comments returned to customers are filtered to `visibility='customer'`; internal notes are not exposed. Order creation is idempotent per accepted quote. Resolved/closed tickets reject further customer replies.

The static `portal.html` customer workspace is marked `noindex,nofollow`; it includes quote access plus orders, project milestones/comments and support tickets. It requires the API base URL and a production same-site frontend/API origin arrangement for reliable session cookies. A user must already be linked to a customer membership; self-registration does not grant customer access automatically.


### Customer membership provisioning

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET/POST | `/api/v1/admin/customers/:id/members` | List linked identities; link a registered account by email with owner/member/billing role | Admin or staff |

The endpoint resolves an existing Better Auth user by normalized email and upserts the membership. It never creates an identity or grants membership during public sign-up. Unknown emails return 404; invalid membership roles return 400. The operation is recorded in the CRM audit log. Customer portal access continues to depend on membership, not on the supplied customer ID.


### CMS media library

CMS media uploads use multipart/form-data with a single file and optional alt_text. The Worker accepts PNG, JPEG, GIF and WebP only, enforces a 5 MiB file limit and checks file signatures against the declared MIME type. Object keys are generated server-side and remain private in R2. Uploads are draft by default. Admin publication changes the D1 state; only published assets can be streamed through the public media endpoint. Admin/staff can preview drafts through the authenticated admin file route. Archiving immediately revokes public delivery but retains the R2 object for controlled retention/deletion. The CMS media library is for public website imagery; customer project attachments remain a separate private-file workflow and are not implemented by this API.


### Private customer project files

Project files are stored in the private R2 bucket under server-generated `projects/{projectId}/` keys. The Worker accepts PDF, PNG, JPEG, WebP, UTF-8 TXT and CSV files up to 10 MiB, validates the declared MIME type against the file signature/content, computes SHA-256 and records metadata/audit events in D1. Storage keys are never returned. All downloads use attachment disposition, `private, no-store` and `nosniff`. Customer endpoints check current `crm_customer_members` membership on every request and expose only `visibility='customer'`; staff/admin endpoints can read both customer and internal files. Customer uploads are always customer-visible. Staff/admin uploads default to customer-visible and can explicitly set `visibility=internal`. No public or signed permanent file URLs are created. The shared R2 binding is used with separate `cms/` and `projects/` prefixes; customer files must never use the public CMS media route.


### In-app notifications

Notifications are created for customer-visible project status/milestone changes and staff ticket replies, and for staff/admin when customers create tickets or post project/ticket messages. Payloads contain generic summaries and resource identifiers only; private comment/message bodies and other customer details are not copied into notifications. Every inbox query and read mutation is scoped by the authenticated `user_id`; cross-user read attempts return 404. This implementation is in-app only; Resend email delivery remains separately configurable and is not implied by an in-app notification.
