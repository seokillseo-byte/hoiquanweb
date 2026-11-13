# HOIQUANWEB — Architecture Blueprint

**Deliverable ID:** BP-ARCH-01  
**Module:** 11 — Architecture Blueprint  
**Status:** Draft / partial — for Solution Architect, Technical Lead and Project Owner review  
**Scope:** Core Preview P0, with platform architecture explicitly separated as future scope  
**Assessment date:** 2026-11-13

> This document consolidates the current logical architecture, source-observed repository structure, API/data contracts and existing ADRs. It does not convert proposed providers into approved production decisions, does not authorize infrastructure provisioning, and does not expand Core Preview P0.

## 1. Purpose and architecture principles

Define a modular, testable architecture that supports the approved bilingual public website now and the wider service-business platform incrementally later.

Architecture principles:
1. Business requirements and approved scope take precedence over existing code.
2. Core Preview P0 is the public bilingual website and inquiry conversion path; later CMS/CRM/portal/catalog capabilities must not be pulled into P0 by implication.
3. Keep public presentation, application/API, domain rules, persistence and external integrations separated.
4. Enforce authorization and data ownership on the server for every protected operation.
5. Public SEO content must be available in initial HTML for routes that are eligible for indexing.
6. Prefer small, reversible changes; preserve the existing public site while application capability is developed.
7. A repository scaffold, ADR proposal or CI pass is not evidence of deployed runtime or production readiness.
8. All TBD decisions remain explicit until approved by the Project Owner.

## 2. System Architecture

### BP-ARCH-01 — System Architecture

- **Objective:** Describe the system boundary and the relationship between public site, application, API, domain logic, data and integrations.
- **Description:** The logical target consists of a public SEO-first website; a separately mounted frontend application for private staff/administrative capabilities; an HTTPS API; server-side authentication, authorization and validation; domain services; relational persistence; object/media storage; and approved email/external integrations. The customer portal and advanced operations platform are future capabilities outside Core Preview P0.
- **Priority:** P0 architecture baseline.
- **User/stakeholder:** Project Owner, Solution Architect, Technical Lead, Development, QA, Security/Operations.
- **Dependencies:** Business Blueprint, Feature Blueprint, Technical Blueprint, Security Blueprint, approved scope.
- **Acceptance criteria:** P0 and future platform boundaries are explicit; no provider is described as production-approved without Owner decision; each layer has a defined responsibility and test boundary.
- **Implementation notes:** Current observed stack includes static public-site generation, Vite/React/TypeScript frontend application, Cloudflare Worker scaffold, D1 migrations, Better Auth integration and R2-dependent media code. Runtime provisioning and deployment are not established by these observations.
- **Risks:** Treating the entire long-term platform diagram as P0; coupling public SEO rendering to an unverified API.
- **Quality checklist:** [x] P0 boundary [x] Future boundary [x] Layer responsibilities [x] Observed vs proposed distinguished [ ] Owner architecture acceptance.

### BP-ARCH-02 — Module Architecture

- **Objective:** Define cohesive modules and their allowed dependencies.
- **Description:** Logical modules are Public Website/SEO; Frontend Application Shell; Identity & Access; Content Management; Lead Intake; CRM; Template Catalog; Customer Portal; Media; Notifications/Email; Audit/Operations. For Core Preview, Public Website/SEO and a safe inquiry boundary are the relevant modules; all other modules remain deferred or repository-observed only unless explicitly approved.
- **Priority:** P0 for public site and inquiry boundary; future modules deferred.
- **User/stakeholder:** Product/Business Analyst, Solution Architect, Development, QA.
- **Dependencies:** Feature Blueprint, API Contract, Data Model.
- **Acceptance criteria:** Each module owns a clear domain responsibility; no direct cross-module database access from UI; dependencies flow through documented interfaces; deferred modules are not activated in P0.
- **Implementation notes:** Keep route/indexation logic in public-site generation/validation; keep privileged operations in backend services.
- **Risks:** Shared global state, circular dependencies, exposing unfinished modules.
- **Quality checklist:** Module boundaries reviewed; dependency direction documented; P0/future labels visible; no circular dependency.

### BP-ARCH-03 — Folder Structure

- **Objective:** Describe the observed repository layout and intended ownership.
- **Description:** Observed top-level layout includes `.github/` workflows; `backend/` Worker and migrations; `frontend/` Vite/React application; `public-site/` static public website; `scripts/` build/validation scripts; root `index.html`, `admin.html`, `portal.html`, `privacy.html`, `404.html`; and `docs/` planning/contracts/ADRs.
- **Priority:** P0 maintainability.
- **User/stakeholder:** Development, Technical Lead, QA.
- **Dependencies:** Repository baseline and Development Standard.
- **Acceptance criteria:** Code remains within its owning area; generated artifacts are not hand-edited as source; documentation identifies source-of-truth files; no unapproved folder restructuring.
- **Implementation notes:** This is a source-observed summary, not an instruction to refactor the repository.
- **Risks:** Confusing root legacy/static files with the generated public-site source or preview-only assembly.
- **Quality checklist:** Current tree reviewed; build outputs distinguished from source; path ownership documented.

### BP-ARCH-04 — Service Architecture

- **Objective:** Define the responsibilities of deployable services and runtime boundaries.
- **Description:** Public static delivery is generated by the public-site build and deployed by the configured Pages workflow. A Worker API scaffold provides application/API handlers. D1 is the current relational persistence candidate represented by migrations. R2 is the current object-storage candidate represented by bindings/code. Email is an external integration whose sender/delivery remains unverified.
- **Priority:** P0 for static public delivery; runtime services gated.
- **User/stakeholder:** Technical Lead, Development, Operations, Project Owner.
- **Dependencies:** Technical Blueprint; ADR-0001; ADR-0002; environment decisions.
- **Acceptance criteria:** Service ownership, origin, credentials, health checks, failure behavior and deploy/rollback process are documented before runtime activation; static hosting is not represented as hosting the Worker.
- **Implementation notes:** Do not provision or deploy any provider resources under this documentation task.
- **Risks:** Split deployment drift, unavailable API, unconfigured bindings, incorrect health claims.
- **Quality checklist:** Service inventory; runtime owner; health/readiness contract; environment separation; rollback plan.

### BP-ARCH-05 — Database Architecture

- **Objective:** Define persistence boundaries, integrity and migration governance.
- **Description:** The logical data model covers identity/access, customers/leads, CMS content, templates, quotes/orders, projects/files, tickets, notifications and audit. Current D1 migrations include initial lead schema and CRM foundation; the model and migrations do not establish that a production database exists or has been migrated.
- **Priority:** P0 only for any activated API data path; broader schema deferred.
- **User/stakeholder:** Data/Backend Architect, Development, Security/Operations, Project Owner.
- **Dependencies:** DATA_MODEL.md, migrations, privacy/retention decisions, provider selection.
- **Acceptance criteria:** Approved environment database; migration applied to clean test database and previous-schema fixture; constraints/indexes reviewed; rollback/forward-fix documented; tenant isolation tested; retention and deletion rules verified.
- **Implementation notes:** Use additive versioned migrations where practical. Money is integer minor units plus currency. Never use client-supplied totals or client-supplied customer IDs as authorization.
- **Risks:** Data loss, schema drift, cross-customer disclosure, untested restore.
- **Quality checklist:** ER model; keys/constraints; migration tests; rollback plan; backup/restore test; retention test.
- **Current status:** D1 is a candidate and code/migrations are present; no accepted staging/production database evidence.

### BP-ARCH-06 — API Architecture

- **Objective:** Establish stable, secure service contracts between clients and backend domains.
- **Description:** API_CONTRACT.md proposes `/api/v1`, JSON response/error envelopes, bounded pagination, server-side schema validation, UTC timestamps, integer minor-unit money, and distinct public/authenticated/admin/customer access groups.
- **Priority:** P0 for any enabled inquiry endpoint; wider platform APIs deferred.
- **User/stakeholder:** Backend Development, Frontend Development, QA, Security.
- **Dependencies:** API_CONTRACT.md, Technical Blueprint, auth/session ADR, data model.
- **Acceptance criteria:** Each implemented endpoint has request/response schemas, status/error cases, authorization rules, payload limits, rate limits where public, idempotency where needed, and integration tests. Contract-only routes are clearly labelled proposed.
- **Implementation notes:** Do not infer endpoint availability from a row in the API contract. Public APIs must never return drafts, private media keys, customer details or staff-only fields.
- **Risks:** Contract/implementation drift, mass assignment, IDOR, false client success.
- **Quality checklist:** Endpoint inventory; schema tests; authorization matrix; error envelope tests; rate-limit/idempotency tests; contract-to-code traceability.

### BP-ARCH-07 — Security Architecture

- **Objective:** Enforce trust boundaries and minimize attack surface.
- **Description:** Deny by default; server-side role and record authorization; secure sessions; strict origin/CORS policy; CSRF defenses where cookie sessions apply; validation and payload limits; private-by-default customer files; server-side secrets; redacted logs; audit sensitive state transitions.
- **Priority:** P0 acceptance gate for any activated protected or inquiry API.
- **User/stakeholder:** Security/Operations, Backend Development, QA, Project Owner.
- **Dependencies:** SECURITY_BLUEPRINT.md, ADR-0002, API Contract, data model, environment topology.
- **Acceptance criteria:** Threat/control matrix reviewed; unauthenticated and unauthorized tests pass; cross-customer access denied; secrets not exposed; session/cookie/CSRF/CORS controls verified in actual runtime; private file access checked on every request.
- **Implementation notes:** Better Auth is present as a prototype/integration, not a production sign-off. Do not use a shared ADMIN_TOKEN as customer identity.
- **Risks:** Broken access control, session compromise, private data exposure.
- **Quality checklist:** Trust boundaries; data classification; role matrix; session tests; negative authorization tests; secret/dependency scan; security review.

### BP-ARCH-08 — Infrastructure Architecture

- **Objective:** Define the environment topology and deployment responsibilities.
- **Description:** The current candidate shape is static public hosting plus a Worker API, D1 relational database and R2 object storage, with environment-specific configuration. Actual production frontend host, custom-domain routing, API origin, resource IDs, secrets, backup ownership and operational responsibility remain unapproved/TBD.
- **Priority:** P0 decision prerequisite before staging/runtime acceptance.
- **User/stakeholder:** Technical Lead, Operations, Project Owner.
- **Dependencies:** ADR-0001, Technical Blueprint, Security Blueprint, HDO-019.
- **Acceptance criteria:** Approved topology diagram; local/test, preview/staging and production matrix; distinct resources/credentials; origin and CORS policy; secrets inventory by name only; deployment/rollback owner; verified Preview URL.
- **Implementation notes:** GitHub Pages workflow deploys static output only; it does not deploy Worker or provision D1/R2. No infrastructure changes authorized here.
- **Risks:** Wrong-environment writes, secrets leakage, unsupported assumptions about hosting capabilities.
- **Quality checklist:** Topology; environment matrix; access ownership; deploy/rollback; resource backup; runtime URL verification.

### BP-ARCH-09 — Scalability Strategy

- **Objective:** Allow growth without premature infrastructure complexity or unsupported capacity promises.
- **Description:** Keep public pages statically generated and CDN-deliverable where the chosen host supports it; isolate API and data workloads; bound pagination and request sizes; index high-use query paths based on measured access patterns; move expensive/long-running work to asynchronous jobs only when requirements justify it.
- **Priority:** P1 planning; P0 correctness and bounded resource usage.
- **User/stakeholder:** Solution Architect, Development, Operations.
- **Dependencies:** Approved workload assumptions, runtime topology and performance measurements.
- **Acceptance criteria:** No capacity/SLA claims without measured load profile; pagination/payload bounds implemented; performance and load tests run only in authorized non-production environment; scaling decisions tied to measured bottlenecks.
- **Implementation notes:** Do not introduce queues, caching tiers or additional services without a demonstrated requirement.
- **Risks:** Premature complexity or unverified performance claims.
- **Quality checklist:** Workload assumptions; bounded requests; measurement baseline; bottleneck evidence; scale-out decision record.

### BP-ARCH-10 — Integration Architecture

- **Objective:** Govern external integrations through explicit contracts and failure handling.
- **Description:** Candidate integrations include email delivery, object storage, analytics, payment, AI, hosting/domain provisioning and WordPress deployment. For Core Preview, only inquiry notification is an approved functional direction; its sender/mailbox/API is not ready. Other integrations are future scope.
- **Priority:** P0 inquiry integration gated by F-009; all others deferred.
- **User/stakeholder:** Project Owner, Development, Security/Operations, QA.
- **Dependencies:** Feature Blueprint, F-009, provider approval, secrets and privacy.
- **Acceptance criteria:** Each enabled integration has owner, provider, credentials boundary, data shared, consent/legal basis where applicable, timeout/retry/idempotency, failure state and E2E evidence.
- **Implementation notes:** An in-app notification is not proof an email was sent. Do not activate real inquiry collection until API, privacy/consent and delivery are verified.
- **Risks:** Lost inquiries, duplicated actions, data disclosure to unapproved providers.
- **Quality checklist:** Integration register; data-flow map; secret storage; failure/retry; E2E test; owner approval.

### BP-ARCH-11 — AI Architecture

- **Objective:** Prevent unapproved AI capabilities from entering the P0 system.
- **Description:** No AI feature is approved as a Core Preview P0 requirement. Future AI use cases, provider/model selection, data handling, evaluation, human review, cost limits and fallback behavior remain deferred until business requirements are supplied and approved.
- **Priority:** Deferred.
- **User/stakeholder:** Project Owner, Product, Security/Privacy, Development.
- **Dependencies:** Approved AI use case, data classification, vendor review and measurable acceptance criteria.
- **Acceptance criteria:** No AI runtime, model integration or AI-generated public claim is activated in P0 without separate approval; future AI ADR must define input/output, evaluation, safety, privacy, cost and human oversight.
- **Implementation notes:** Existing project direction or code scaffolding does not authorize AI implementation.
- **Risks:** Scope expansion, privacy leakage, unreliable generated output, uncontrolled costs.
- **Quality checklist:** P0 exclusion visible; future use case evidence required; provider and evaluation TBD.

### BP-ARCH-12 — Data Flow

- **Objective:** Identify data movement and trust transitions.
- **Description:** Public content flow: approved content/source → public-site build → generated localized HTML/assets/sitemap → static host/CDN → visitor. Inquiry flow, when F-009 is approved: visitor → consent and client validation → HTTPS API → server validation/rate limit → persistence → notification provider → Project Owner handler; retention/deletion rules apply. Protected application flows require authenticated principal → server authorization → domain service → D1/R2.
- **Priority:** P0.
- **User/stakeholder:** Development, Security/Privacy, QA, Project Owner.
- **Dependencies:** Technical/Security Blueprints, API contract, privacy decisions.
- **Acceptance criteria:** Data classification, origin, processing, storage, recipients, retention and deletion are documented for each flow; no real inquiry flow is enabled before acceptance.
- **Implementation notes:** The public static site does not require the Worker API for page delivery. Do not imply CMS runtime is connected until HQ_API_BASE and environment are verified.
- **Risks:** Unintended personal-data collection, wrong recipient, leakage between trust zones.
- **Quality checklist:** Data flow diagram; trust boundaries; PII classification; retention/deletion; failure paths.

### BP-ARCH-13 — Request Flow

- **Objective:** Define the request lifecycle and expected failure handling.
- **Description:** Static page request resolves at the host/CDN to generated localized HTML and assets. API request, when enabled, passes origin/TLS controls, route/method validation, authentication if required, authorization, schema validation/rate limiting, domain service and persistence/integration, then returns a stable response envelope and safe error.
- **Priority:** P0.
- **User/stakeholder:** Frontend/Backend Development, QA, Operations.
- **Dependencies:** API Contract, hosting topology, Security Blueprint.
- **Acceptance criteria:** Request flow identifies authentication and authorization points; public and protected endpoint paths are distinct; errors are bounded and non-sensitive; timeout and unavailable dependency behavior are tested.
- **Implementation notes:** Do not return success from a form based solely on client-side validation or an unconfirmed provider action.
- **Risks:** Bypass of controls, timeout ambiguity, false success.
- **Quality checklist:** Sequence diagrams; status/error mapping; authz checkpoints; timeout/retry behavior.

### BP-ARCH-14 — Dependency Diagram

- **Objective:** Make component dependencies explicit and reviewable.
- **Description:** P0 dependency chain: approved requirements/URL map → public-site route/content data → static generator → validator → assembled Preview artifact → hosting. Inquiry path adds approved form/privacy requirements → API contract → Worker runtime → D1 persistence → email sender. Frontend application is separately built and mounted under its verified Preview path. Future CMS/CRM/portal/catalog depend on auth, data and object storage acceptance.
- **Priority:** P0.
- **User/stakeholder:** Solution Architect, Development, QA, Project Owner.
- **Dependencies:** Current repository workflows, scripts, API/data contracts, ADRs.
- **Acceptance criteria:** No circular dependency; critical dependencies and blockers identified; preview assembly dependencies are tested after final packaging; future modules cannot block or leak into P0.
- **Implementation notes:** Keep build/validation scripts as independent, testable steps. Do not couple sitemap eligibility to mere HTML route existence.
- **Risks:** Build order drift, root collision, hidden dependency on unconfigured API.
- **Quality checklist:** Dependency graph; build order; failure points; owner of each external dependency.

### BP-ARCH-15 — Architecture Decision Records (ADR)

- **Objective:** Record consequential technical choices and their authority/status.
- **Description:** Existing ADR-0001 describes an incremental Vite/React/TypeScript + Worker/D1 candidate architecture and defers provider/runtime approval. ADR-0002 records Better Auth/D1 and R2 as prototype/candidate choices with production gates. These ADRs are not blanket production approval.
- **Priority:** P0 governance.
- **User/stakeholder:** Project Owner, Solution Architect, Technical Lead, Security/Operations.
- **Dependencies:** Owner decisions, Technical/Security Blueprints, HDO-019.
- **Acceptance criteria:** Each ADR has ID, context, decision/status, alternatives, consequences, acceptance checks, owner/approver and review triggers; proposed and accepted choices are distinguished; changes supersede rather than silently rewrite decisions.
- **Implementation notes:** Maintain ADRs in `docs/adr/`. Record provider and deployment choices only after Owner approval.
- **Risks:** Prototype decision treated as final; conflicting architecture docs.
- **Quality checklist:** ADR index; status labels; approver; dependencies; review triggers; consistency audit.

## 3. Observed repository architecture

The following is a source-observed map on the reviewed branch, not a claim that every component is deployed:

| Area | Observed location | Responsibility / caveat |
|---|---|---|
| CI workflows | `.github/workflows/` | Public-site validation, Pages deployment and isolated PR Preview packaging; production Pages workflow is outside XC-03/XC-10 authorization |
| Public website | `public-site/` | Static bilingual public output source |
| Build and validation | `scripts/` | Public route generation, metadata/sitemap validation and final Preview checks |
| Frontend application | `frontend/` | Vite/React/TypeScript app; Preview isolated under `/platform/` |
| Backend API | `backend/` | Worker source, configuration and migrations; provider resources are not accepted as deployed |
| Admin / portal shells | `admin.html`, `portal.html` | Repository entrypoints; not proof of public production availability |
| Root fallback/legal files | `404.html`, `privacy.html`, root legacy files | Verify deployment source before treating as live public output |
| Architecture and contracts | `docs/`, `docs/adr/` | Planning, API/data contracts, decisions, risks and acceptance evidence |

## 4. Decision status and authority

| Decision area | Current evidence | Status |
|---|---|---|
| Incremental frontend approach | ADR-0001; Vite/React/TypeScript repository implementation | Prototype/implementation baseline; not a complete production approval |
| API runtime | Cloudflare Worker scaffold; ADR-0001 candidate | Candidate; environment and deployment acceptance TBD |
| Relational database | D1 migrations; ADR-0001 candidate | Candidate; migration and staging acceptance TBD |
| Authentication/session | Better Auth integration; ADR-0002 prototype gate | Prototype decision; production compatibility/configuration acceptance required |
| Object storage | R2 binding/code; ADR-0002 preferred candidate | Candidate; bucket, secret and access tests not accepted |
| Public static hosting | GitHub Pages workflow deploys public-site/dist | Current CI deployment mechanism; final production host/domain acceptance remains separate |
| Email sender | info@hoiquanweb.io.vn destination supplied | Destination only; mailbox and sender delivery not verified |
| Production topology | Not approved | TBD |
| AI provider/features | No P0 requirement approved | Deferred |
| Payment/booking/provisioning | Future platform capabilities | Deferred |

## 5. P0 and future platform boundary

### Core Preview P0
- Public Vietnamese and English website.
- Approved service group information and page navigation.
- Static HTML generation and SEO metadata/indexation controls.
- Responsive public experience and accessible navigation.
- Consultation/quotation intent and a non-live inquiry shell until F-009 passes.
- Isolated PR Preview packaging that preserves the public homepage.

### Future / separate approval
- Production CMS runtime and full editorial workflows.
- CRM expansion and customer portal.
- Template marketplace, package delivery and WordPress provisioning.
- Payment, e-signature, booking and billing.
- AI content, chatbot, automation or model integrations.
- Hosting/domain provisioning and external customer infrastructure.
- Any new public routes or capabilities not in the approved P0 inventory.

## 6. Architecture quality and release gates

Before a runtime capability is accepted:
1. Its requirement and owner approval are traceable.
2. Its ADR and contracts are current.
3. Environment, secrets, origin and data resources are approved.
4. Migrations are tested against a clean database and previous schema.
5. API authorization, validation, failure and integration tests pass.
6. Security and privacy controls are verified in the actual environment.
7. Observability, backup/restore, rollback and operational ownership are documented.
8. QA evidence identifies exact commit, URL/environment, tool/browser version and test result.
9. Project Owner explicitly accepts the applicable gate.

CI green is necessary evidence for code checks but is not sufficient for runtime, visual, security or production acceptance.

## 7. Risks and dependencies

Linked risks: R-008, R-009, R-010, R-011, R-012, R-013, R-016 and R-017.  
Linked blockers: F-009, GAP-TECH-01, GAP-ARCH-01, GAP-SEC-01, GAP-QA-01.  
Key dependencies: Technical Blueprint, Security Blueprint, API Contract, Data Model, ADR-0001, ADR-0002, HDO-019 and Project Owner decisions.

## 8. Acceptance status

**Draft / Partial — not Owner-accepted.** The logical architecture, current repository map, data/API contracts and two ADRs are consolidated. Production topology, hosting/domain, database and object-storage resources, email integration, operations/monitoring ownership and complete staging/runtime acceptance remain open.

This document does not approve Gate 2, grant blanket Development Authorization, authorize infrastructure provisioning, or permit merge/deployment/production changes.
