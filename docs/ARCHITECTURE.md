# Hội Quán Web — Target Architecture

**Status:** Proposed architecture; not a statement that these capabilities are implemented.
**Baseline reviewed:** `main` at `a09c4dc5df5562135f22cd0de25fd25c796919fb`.

## Product direction

Hội Quán Web is to become a website-services business platform with:
1. A public, SEO-first multi-page marketing website.
2. A private, custom-built CMS and business operations console.
3. A catalog for both WordPress and standalone HTML/CSS website templates.
4. A secure customer portal from the first usable product release.
5. A backend API and database as the authoritative source for business data.
6. Later, controlled integrations for provisioning, payments, AI generation, hosting, domains, CRM, and support.

This is not just a static marketing site. Existing lead API scaffolding should be reviewed and reused where appropriate, not treated as a production backend before Cloudflare resources are configured and tested.

## Current verified baseline and gaps

- Public frontend is currently a static `index.html` landing page plus `privacy.html`, `404.html`, and `admin.html`.
- A Cloudflare Worker source file and D1 migration exist for lead intake, lead status/history, and basic rate limiting.
- `backend/wrangler.toml` contains the placeholder `REPLACE_WITH_CLOUDFLARE_D1_DATABASE_ID`.
- The frontend API-base metadata is empty in the current baseline.
- The repository does not currently contain an implemented multi-page CMS, template catalog, real authentication/customer portal, order/project management, or persistent content-management interface.
- GitHub Pages workflows can deploy static assets; they do not run the Worker or create/configure Cloudflare D1 resources.
- CI success means the configured repository checks passed; it does not prove that a live API, database, email sender, or customer portal is operational.

## Proposed logical architecture

```text
Public website / Template catalog / Customer portal / Admin CMS
                          |
                    HTTPS API layer
                          |
          Authentication + authorization + validation
                          |
       Domain services (content, catalog, CRM, quotes, projects)
                          |
          Relational database + object/media storage
                          |
       Email/notifications and approved external integrations
```

The frontend must never be trusted to authorize a user, determine final prices, approve quotes, or decide access to another customer's records. Every protected operation must be authorized by the backend.

## Deployment shape

- **Frontend:** deployable static/client application with real routes and shared design system. GitHub Pages may remain a preview host for static builds, but production routing, environment configuration, and portal behavior must be tested explicitly.
- **API:** Cloudflare Workers is the current candidate because a Worker scaffold already exists.
- **Database:** Cloudflare D1 is the current candidate because a migration already exists.
- **Media:** use object storage or a managed media service; do not store large uploads in relational rows.
- **Secrets:** use deployment secret storage only. Never commit tokens or expose admin credentials in frontend code.
- **Environment separation:** local/test, preview/staging, production. Each environment must have distinct credentials and data resources.
- **Custom domain:** configure canonical URLs, CORS origins, cookies/session policy, sitemap, and security headers for the actual production domain before launch.

The choice of identity/session implementation, object storage provider, and production frontend host remains an architecture decision to be recorded before implementation. Do not assume GitHub Pages alone can provide a secure authenticated application.

## Application areas

### Public website
- Home, company, contact, process, pricing, FAQs and legal/policy pages.
- Service detail pages for business websites, e-commerce, landing pages, SEO, hosting/domain, maintenance and related services.
- Industry solution pages only where distinct, useful content exists.
- Case studies and portfolio with verified permission and evidence; no fabricated client claims.
- Blog/knowledge base with categories, author/editor, publication status, SEO metadata, and internal links.
- Template catalog with search, filters, category pages, detail pages, preview links, compatibility labels, licensing/usage notes, and a conversion CTA.

### Custom CMS and operations console
- Page/content blocks, navigation, footer, reusable sections, menus and publication states.
- Posts, categories, tags, authors, revisions, scheduling and preview.
- Media library with file type/size validation, alt text and metadata.
- Service offerings, pricing rules, FAQ, case studies and template catalog.
- Leads, customers, quotes, orders, projects, tasks, milestones and support requests.
- Team accounts, roles, permissions, audit trail, system settings and operational reports.
- SEO controls: title, description, canonical, index directives, structured data, redirects, sitemap inclusion and social preview.
- Draft, preview, publish, unpublish and restore flows. Changes must persist in the backend and render on the public site.

### Template catalog: two template types
- **WordPress:** record WordPress/PHP requirements, theme/plugin dependencies, demo preview, package/version, license, update policy and supported deployment method.
- **HTML/CSS:** record build/runtime requirements, source/package version, assets, responsive preview, customization options and deployment instructions.
- Shared fields: slug, name, category, tags, description, preview media, demo URL, price model, status, compatibility, version, rights/license, created/updated timestamps.
- Do not promise one-click provisioning until an isolated, secure provisioning pipeline exists and is tested.

### Customer portal — required in first usable release
- Secure sign-in and sign-out, account recovery, and server-enforced session lifecycle.
- Customer can only see their own profile, quotes, orders, project milestones, approved files, comments and support requests.
- Quote review/acceptance and project feedback must be recorded with actor and timestamp.
- File access must be authorized on the server; unguessable URLs alone are not authorization.
- Admin/staff views use explicit role permissions; customer roles must never inherit staff access.
- Audit important actions: login/security events, quote status changes, approvals, file access where appropriate, and permission changes.
- Require automated tests proving cross-customer access is denied.

## Initial data model (logical; migration not yet implemented)

Expected entities:
- `users`, `roles`, `permissions`, `sessions` or identity-provider mappings.
- `customers`, `leads`, `lead_events`.
- `pages`, `page_revisions`, `content_blocks`, `posts`, `categories`, `tags`, `media_assets`, `menus`.
- `services`, `pricing_rules`, `templates`, `template_versions`, `template_categories`.
- `quotes`, `quote_items`, `orders`, `projects`, `milestones`, `tasks`, `project_files`, `comments`, `support_tickets`.
- `audit_events`, `notifications`, and consent/privacy records where required.

Define primary keys, foreign keys, constraints, indexes, retention rules and migration/rollback strategy before creating production tables. Use decimal/integer minor-unit representation for money; never trust a client-submitted total.

## Security and privacy requirements

- Deny by default; check authorization on every API route and every record lookup/mutation.
- Use a proven authentication/session solution; store password hashes only if implementing password authentication, with a suitable modern password hashing algorithm. Never store plaintext passwords.
- Protect against CSRF where cookie-based sessions are used; configure Secure, HttpOnly and SameSite cookies and TLS.
- Validate request schemas, enforce payload/file size limits, rate limit sensitive endpoints, and return non-sensitive errors.
- Apply strict CORS allowlists; CORS is not authentication.
- Keep admin/service tokens and provider keys in server-side secrets.
- Enforce upload MIME/type and size checks, safe filenames, private-by-default customer files, and authorized downloads.
- Record audit events for sensitive state transitions. Define backup, restore, retention, deletion and incident-response procedures.
- Minimize personal data, publish accurate privacy/terms policies, and obtain consent where required.
- Never use fabricated testimonials, customer logos, project results, metrics, or prices as verified facts.

## Quality gates

Each phase must:
1. Be implemented on a feature branch and reviewed through a pull request; do not push unreviewed architecture changes directly to `main`.
2. Add or update automated tests for the changed behavior.
3. Run repository validation and relevant type/build/unit/integration checks.
4. Test responsive behavior, accessibility, SEO, broken links and error states where applicable.
5. Verify deployment and the actual runtime environment; CI green alone is not production acceptance.
6. Document known gaps and stop before any account-owned external setup that requires the project owner's login, secrets, billing, or approval.

## Architecture decisions still required

- Production frontend host and custom domain.
- Authentication/session provider and recovery flow.
- Object/media storage and private file delivery.
- CMS page-builder schema and safe rendering model.
- WordPress template packaging, licensing, sandboxing and provisioning strategy.
- Payment, e-signature, booking, email, analytics and AI providers.
- Backup/restore objectives, data retention, and operational ownership.

Resolve these decisions incrementally before the dependent feature is built; do not block documentation and non-production scaffolding on unrelated future integrations.
