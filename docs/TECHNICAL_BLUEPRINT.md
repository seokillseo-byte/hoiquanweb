# HOIQUANWEB — Technical Blueprint

**Deliverable ID:** BP-TECH-01  
**Module:** 10 — Technical Blueprint  
**Status:** Draft — for Technical Lead and Project Owner review  
**Scope:** Core Preview P0 public bilingual website  
**Date:** 2026-11-13

> This document defines the technical requirements and evidence for Core Preview. It does not approve a production provider, create infrastructure, or authorize implementation beyond the existing XC-03/R-016 and XC-10/R-017 work packages.

## 1. Purpose and objective

Define the technical delivery contract for the public VI/EN website so that Development and QA can build and verify the approved P0 scope without inferring production infrastructure or activating incomplete services.

## 2. Source requirements and constraints

- Project Owner-approved scope: public multi-page website, Vietnamese and English, seven service groups, responsive layouts, SEO fundamentals and consultation/quotation conversion.
- Primary conversion: consultation and quotation requests.
- Core Preview excludes advanced CMS, expanded CRM, customer portal, payment, booking, AI automation and hosting/domain provisioning unless separately approved.
- Do not publish unsupported USP, prices, customer proof, rankings, guarantees or fabricated content.
- Vietnamese is the x-default destination for genuine VI/EN translation pairs.
- Generic blog shells remain noindex and outside the sitemap until R-016 readiness is met.
- Inquiry form remains non-submitting until F-009 prerequisites are accepted.

## 3. Technical baseline — observed, not automatically approved

| Layer | Repository observation | Acceptance status |
|---|---|---|
| Public frontend | Static public-site generator creates 40 localized route objects and sitemap from route data | Build/validator CI evidence exists; actual Preview visual acceptance pending |
| Frontend application | Vite/React application is isolated under /platform/ in PR Preview | Preview assembly checks passed; not a public portal release |
| API | Cloudflare Worker scaffold exists | Runtime/provider configuration and staging acceptance pending |
| Database | D1 migrations exist | Not evidenced as applied to an accepted environment |
| Media | R2-dependent media functionality exists in repository | Bucket/resource configuration and private-media acceptance pending |
| Authentication | Better Auth and server-side role checks exist in repository | Selected integration tests exist; staging and production runtime acceptance pending |
| Email | Inquiry notification destination supplied as info@hoiquanweb.io.vn | Mailbox access, sender/provider configuration and delivery not verified |
| Hosting | GitHub Pages workflow deploys static public-site output | Production hosting/domain topology and Preview URL acceptance remain open |

## 4. P0 technical deliverables

### TECH-01 — Public build and route contract

- **Objective:** Produce deterministic VI/EN public HTML routes and a sitemap from one route inventory.
- **Description:** Route data, generated HTML, canonical, hreflang, robots directives and sitemap eligibility must remain consistent.
- **Priority:** P0.
- **User/stakeholder:** Development, SEO/Content, QA.
- **Acceptance criteria:** All approved routes generate deterministically; direct route and refresh behavior work; canonical matches route; reciprocal hreflang exists only for genuine translations; x-default points to Vietnamese; sitemap includes only indexable routes; unknown routes resolve to localized 404 behavior.
- **Dependencies:** URL Map, approved page inventory, R-016 indexability policy.
- **Risks:** Stale route inventory, duplicate canonical URLs, dynamic article shells accidentally indexed.
- **Implementation notes:** Keep generic blog shells noindex and excluded from sitemap. Do not add dynamic articles until clean-slug and article-specific initial HTML are available.
- **Quality checklist:** Route inventory reviewed; build repeatability; canonical/hreflang/robots validator; sitemap uniqueness; direct-load/refresh; 404 checks.

### TECH-02 — Preview artifact assembly

- **Objective:** Preserve public-site output while making the frontend application available in its isolated Preview path.
- **Description:** Public homepage remains at /; application assets are served under /platform/; generated portal HTML is not overwritten by an unconfigured root file.
- **Priority:** P0.
- **User/stakeholder:** Development, QA, Project Owner.
- **Acceptance criteria:** Final assembled artifact passes PREV-01..06; root metadata/canonical/hreflang remain intact; platform entrypoint and assets resolve; direct-load and repeat requests succeed.
- **Dependencies:** Build workflow and Vite base-path configuration.
- **Risks:** Root-route collision or stale artifact composition.
- **Implementation notes:** Existing CI evidence reports PREV-01..06 passed; full visual/browser/responsive review remains open under R-017.
- **Quality checklist:** Artifact inventory; root HTML inspection; platform asset checks; direct-load/repeat-request checks; artifact commit/hash recorded.

### TECH-03 — Inquiry interface and API boundary

- **Objective:** Ensure the consultation form communicates submission state truthfully.
- **Description:** Client-side validation may improve UX but does not constitute durable receipt. A success state is permitted only after server-confirmed acceptance.
- **Priority:** P0.
- **User/stakeholder:** Visitor, Project Owner, Development, QA.
- **Acceptance criteria:** Required/optional fields and consent are clear; server validates input; duplicate submission is controlled; errors retain user input; no success state without API acceptance; notifications are delivered and failure/retry behavior is verified before live use.
- **Dependencies:** F-009, approved privacy/consent wording, API, sender/mailbox.
- **Risks:** Lost inquiries, false success, personal data collection without accepted privacy controls.
- **Implementation notes:** Keep the form explicitly inactive/non-submitting until all F-009 prerequisites pass.
- **Quality checklist:** Idle/invalid/submitting/accepted/failed states; API validation; duplicate-submit; notification delivery; failure/retry; retention/deletion.

### TECH-04 — Environment and release boundary

- **Objective:** Prevent Preview, staging and production resources/data from being confused.
- **Description:** Define distinct environments, credentials, domains, API endpoints, data stores, deployment permissions and rollback ownership before runtime activation.
- **Priority:** P0.
- **User/stakeholder:** Technical Lead, Security/Operations, Project Owner.
- **Acceptance criteria:** Environment matrix and deployment diagram are approved; secrets are stored server-side; production resources are not used by Preview; deployment and rollback responsibilities are named.
- **Dependencies:** TBD-008; GAP-TECH-01; GAP-ARCH-01.
- **Risks:** Credential leakage, wrong-environment writes, unreviewed production changes.
- **Implementation notes:** Provider choices and environment resource IDs remain TBD. No resource creation or production change is authorized by this document.
- **Quality checklist:** Environment matrix; origin/CORS list; secret inventory (names only); deploy/rollback plan; access ownership; release approval record.

## 5. Non-functional technical requirements

- **SEO:** Initial HTML must expose meaningful content and metadata for indexable public pages; no client-only article indexation.
- **Accessibility:** Follow the UI/QA specifications and verify keyboard, semantics, labels, focus and contrast.
- **Performance:** Apply only Owner-approved CWV thresholds: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 at field p75 by mobile/desktop when sufficient data exists. Other budgets remain TBD.
- **Security:** Follow SECURITY_BLUEPRINT.md; frontend controls are never authorization.
- **Reliability:** Errors must be explicit; no fabricated success or fallback data.
- **Maintainability:** Keep route data and validators consistent; document decisions and regression tests.
- **Observability:** Logging, monitoring provider, alert thresholds and retention remain TBD pending environment/ownership decisions.

## 6. Explicit TBD decisions

- Production frontend host and custom-domain routing.
- API runtime and environment topology.
- Database provider/resource ownership and migration execution.
- Object/media storage provider and private-file delivery.
- Email sender/provider and mailbox verification.
- Monitoring, backup lifecycle, restore objectives and incident ownership.
- Supported browser matrix and exact Preview URL.
- Technical staffing and timeline.

## 7. Risks and dependencies

Primary linked risks: R-008, R-009, R-010, R-012, R-013, R-016 and R-017. Related blockers: F-009, GAP-TECH-01, GAP-ARCH-01, GAP-PERF-01 and GAP-QA-01.

## 8. Acceptance status

**Draft / Partial — not Owner-accepted.** The repository provides static build and Preview CI evidence, but production topology, live inquiry runtime, staging resources, performance measurements and full Preview QA remain unaccepted. This Blueprint does not authorize Gate 2, merge, deployment or production changes.
