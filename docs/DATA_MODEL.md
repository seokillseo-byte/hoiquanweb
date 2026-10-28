# Hội Quán Web — Logical Data Model

**Status:** Logical contract with a partial CRM foundation migration. CRM customer/activity/quote/audit tables are added in `backend/migrations/0003_crm_foundation.sql`; this does not imply protected CRM APIs, authentication, or production deployment exist.

## Modeling rules

- Use opaque UUID/ULID identifiers; never expose sequential customer IDs as authorization controls.
- Store timestamps as UTC ISO-8601 strings or integer epoch values consistently per migration.
- Store money as integer minor units plus currency, or a documented integer VND amount; never use floating-point totals.
- Every customer-owned row must have an explicit tenant/customer relationship and be authorized server-side on every read and write.
- Add foreign keys, constraints, indexes and migration/rollback plans before implementing tables.
- Sensitive actions require append-only audit events. Do not store secrets, raw passwords, or payment-card data in these tables.
- Define privacy retention, export and deletion policies before production.

## Core identity and access

| Entity | Important fields | Notes |
|---|---|---|
| users | id, email_normalized, display_name, status, created_at, updated_at | Unique normalized email; no plaintext password field |
| user_identities | id, user_id, provider, provider_subject, created_at | For selected identity provider; unique provider + subject |
| roles | id, key, label | Initial roles: admin, staff, customer |
| permissions | id, key, description | Fine-grained server-side permissions |
| user_roles | user_id, role_id, assigned_by, assigned_at | Explicit role assignment |
| sessions | provider/session reference, user_id, expires_at, revoked_at | Only if required by chosen auth/session architecture |
| audit_events | id, actor_user_id, action, resource_type, resource_id, metadata_json, created_at | Append-only for sensitive operations; sanitize metadata |

## Customer and sales

| Entity | Important fields | Notes |
|---|---|---|
| customers | id, owner_user_id, display_name, organization_name, contact_email, status, created_at | A customer may have multiple users in a later iteration |
| leads | id, name, email, service, budget, goals, status, consent_at, created_at, updated_at | Existing migration already has a minimal leads table; evolve through new migrations |
| lead_events | id, lead_id, actor_user_id, event_type, details_json, created_at | Existing migration has lead history; avoid destructive rewrites |
| services | id, slug, name, summary, status, sort_order | CMS-managed service catalog |
| pricing_rules | id, service_id, rule_json, currency, active_from, active_to, status | Server calculates authoritative quote values |
| quotes | id, customer_id, lead_id, quote_number, status, currency, subtotal_minor, discount_minor, total_minor, valid_until, created_by, created_at, updated_at | Track revisions; acceptance event records actor/time |
| quote_items | id, quote_id, description, quantity, unit_price_minor, line_total_minor, sort_order | Validate totals server-side |
| orders | id, customer_id, quote_id, status, currency, total_minor, created_at, updated_at | Idempotency key for create/checkout operations where applicable |

## CMS and SEO

| Entity | Important fields | Notes |
|---|---|---|
| pages | id, slug, title, status, current_revision_id, published_at, created_by, updated_by, updated_at | Unique slug; status controls public visibility |
| page_revisions | id, page_id, revision_number, content_json, seo_json, created_by, created_at | Versioned block content; validate schema and sanitize rendering |
| posts | id, slug, title, excerpt, body_json, status, author_user_id, published_at, updated_at | Draft/preview/published lifecycle |
| categories | id, name, slug, parent_id, taxonomy_type | Separate post/template taxonomy by explicit type or dedicated tables |
| tags | id, name, slug | Unique slug |
| post_tags | post_id, tag_id | Many-to-many relation |
| menus | id, key, label, items_json, status, updated_at | Validate links and item schema |
| media_assets | id, storage_key, original_name, mime_type, size_bytes, alt_text, visibility, uploaded_by, created_at | Store object key, not file bytes; private assets need authorized delivery |
| redirects | id, source_path, destination_url, status_code, active | Validate loops and unsafe destinations |

## Template marketplace

| Entity | Important fields | Notes |
|---|---|---|
| templates | id, slug, name, template_type, category_id, summary, description, status, price_minor, currency, license_key, created_at, updated_at | template_type: wordpress or html_css |
| template_versions | id, template_id, version, package_storage_key, compatibility_json, dependency_json, changelog, checksum, created_at | Package must be scanned/reviewed before release |
| template_media | template_id, media_asset_id, media_role, sort_order | Screenshots, thumbnails and gallery |
| template_previews | id, template_id, preview_url, preview_type, verified_at | Only publish verified demo URLs |
| template_entitlements | id, customer_id, template_version_id, order_id, license_status, granted_at | Add only when licensing/sales rules are defined |

Template license and compatibility information must be reviewed before publication. HTML/CSS packages and WordPress packages have different runtime and provisioning requirements.

## Projects and customer portal

| Entity | Important fields | Notes |
|---|---|---|
| projects | id, customer_id, order_id, name, status, owner_user_id, start_at, due_at, created_at, updated_at | Customer isolation is mandatory |
| milestones | id, project_id, name, status, due_at, approved_by, approved_at, sort_order | Approval actor/time are authoritative server fields |
| tasks | id, project_id, milestone_id, assignee_user_id, title, status, due_at, created_at | Staff-only fields must not leak to customer views |
| project_files | id, project_id, storage_key, filename, mime_type, size_bytes, visibility, uploaded_by, created_at | Private by default; download authorization on each request |
| comments | id, project_id, milestone_id, author_user_id, body, visibility, created_at | Validate visibility and sanitize rendered content |
| support_tickets | id, customer_id, project_id, subject, status, priority, created_at, updated_at | Customer can access only their tickets |
| ticket_messages | id, ticket_id, author_user_id, body, created_at | Access inherited from ticket authorization |

## Notifications and operational controls

| Entity | Important fields | Notes |
|---|---|---|
| notifications | id, user_id, type, payload_json, read_at, created_at | Avoid sensitive information in push/email payloads |
| idempotency_keys | key, actor_user_id, operation, response_reference, expires_at | For non-repeatable write operations if needed |
| rate_limits | key_hash, window_start, hits | Existing migration has IP-hash rate limiting; revisit storage/retention limits |

## Required relationships and invariants

1. A customer portal API must scope every query to the authenticated user's customer membership; never rely on a client-supplied customer_id alone.
2. Quote acceptance must validate current status/version and persist the actor and timestamp atomically.
3. Order totals and quote totals are recalculated by the server from validated line items.
4. Publishing a page/post must validate the revision, permissions, slug uniqueness, and publication state.
5. A template cannot be published without required type, version, license/rights status, compatibility metadata and verified preview or an explicit no-preview state.
6. A private media asset cannot be downloaded without server-side authorization.
7. Deleting a customer must follow a documented retention/legal-hold policy; do not cascade-delete business/audit records without review.
8. Database migrations are additive where practical and are tested against both a clean database and the previous schema.

## Migration strategy

- Keep the current `0001_initial.sql` migration intact; it creates the initial lead-related schema.
- `0003_crm_foundation.sql` adds CRM customers, activity timeline, quotes, quote items and audit events. It intentionally adds no write API until authentication/authorization and domain-level integration tests are in place.
- Add numbered migrations for new domains instead of editing already-applied production migrations.
- Test migrations against an empty D1 database and a copy of the previous schema.
- Back up before production migrations and document rollback or forward-fix procedures.
- Do not run production migrations until the project owner has configured and verified the intended Cloudflare account/database.
