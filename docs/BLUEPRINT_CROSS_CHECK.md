# HOIQUANWEB — Blueprint Cross-check (19 Modules)

**Document status:** Cross-check draft — review required  
**Planning phase:** Phase 0 — Requirements & Blueprint  
**Branch:** `docs/phase-0-master-blueprint-risk-review`  
**Review date:** 2026-11-13  
**Scope:** Core Preview P0 and its dependencies; long-term platform roadmap is tracked separately.

## 1. Purpose and review method

This document checks the 19 mandatory Blueprint modules against the five **Project Owner-supplied external planning standards** listed below. These source files were provided in the HOIQUANWEB project context on 2026-11-13; they are planning inputs and are not repository-tracked files in this branch.

| External source supplied by Project Owner | Source revision stated in file | Use in this cross-check |
|---|---|---|
| `01_AI_CONSTITUTION_AND_PLANNING_STANDARD.md` | Version 3.0 (Merged) | AI role, planning workflow, requirements and decision-control rules |
| `02_PROJECT_INPUT_TEMPLATE.md` | Version 3.0 (Condensed) | Required project/business/brand/audience inputs and completeness checks |
| `03_BLUEPRINT_AND_DESIGN_SYSTEM_STANDARD.md` | Version 3.0 (Merged) | Mandatory 19-module Blueprint structure and Design System requirements |
| `04_DEVELOPMENT_STANDARD.md` | Version 3.0 (Renumbered) | Architecture, implementation, testing, DevOps, deployment and documentation standards |
| `05_QA_ACCEPTANCE_STANDARD.md` | Version 3.0 (Renumbered) | QA workflow, acceptance evidence, severity and production-readiness gates |

The source files remain external Project inputs; the version labels above identify the exact revisions used, but do not imply they are vendored into this repository. Reproducibility requires retaining those owner-supplied source files with the project record.

The review also uses current repository planning documents, source-observed route inventory, and recorded user-confirmed decisions. It distinguishes **approved facts**, **source/code observations**, **proposals**, and **TBD owner decisions**. Existing implementation does not become a business requirement merely because code exists. A draft document or green CI run is not equivalent to runtime acceptance.

### Status meanings

- **Draft / partial:** Some planning material exists; required evidence or decisions are still missing.
- **Blocked:** A missing owner decision or dependency prevents completion/acceptance of the relevant deliverable.
- **Deferred:** Explicitly outside Core Preview P0.
- **Pending:** Must be completed after upstream requirements and evidence are ready.

### Priority meanings

- **P0:** Required for the public bilingual Core Preview or for its acceptance.
- **P0 dependency:** An input or decision that blocks a P0 deliverable.
- **Planning prerequisite:** Needed to approve the complete Blueprint, but not necessarily to build a neutral preview shell.
- **Deferred:** Not part of Core Preview.

Owner names have not been assigned. The role labels below are proposed responsibility boundaries, not confirmed staffing assignments.

## 2. Cross-check matrix — all 19 modules

| # | Blueprint module | Current source / status | Priority | Proposed owner role | Dependencies | Acceptance evidence / remaining gap |
|---:|---|---|---|---|---|---|
| 01 | Executive Summary | `MASTER_BLUEPRINT.md` — partial | Planning prerequisite | Project Owner + Planning | 02–06, 10–13, 16–18 | One-page summary must state confirmed business, audience, scope, routes, technology and SEO facts; unresolved fields remain visibly TBD. Current summary is a working baseline, not final approval. |
| 02 | Business Blueprint | `MASTER_BLUEPRINT.md` — in progress | P0 dependency | Project Owner + Business Analyst | Project Input sections 00, 01, 03, 04, 05, 18 | Factual business description wording is owner-approved (2026-11-13); formal industry classification, operating/revenue model, detailed B2C persona inputs, USP, business goals and success metrics remain open. Seven service groups and consultation/quotation conversion are confirmed. Owner has approved both B2C and B2B, with B2C first and B2B expansion next; detailed personas and market details remain incomplete. |
| 03 | Brand Blueprint | UI tokens observed; formal Brand Blueprint absent / blocked | P0 dependency for final visual approval | Project Owner + Brand/UI | 01, 02, 08 | Approve official logo, brand description, color system, typography and visual tone. Existing CSS tokens are code observations only and must not be represented as approved brand identity. |
| 04 | Competitor Blueprint | Not started | Planning prerequisite; not a structural P0 blocker | Project Owner + Research/SEO | 02, 03, 05, 15 | Competitor set, comparison criteria and evidence-based differentiation are missing. Do not invent competitor names, rankings or claims. |
| 05 | SEO Blueprint | `URL_MAP.md`, `SEO_AND_DESIGN_SYSTEM.md`, Master Blueprint — partial | P0 | SEO Architect + Development + QA | 02, 05, 06, 08, 10, 11, 12 | Verify per-route initial HTML metadata, canonical, hreflang, robots, sitemap, structured data and direct navigation. Resolve blog-detail shell/query-slug indexing gap (R-016); decide whether Vietnamese is the x-default fallback. |
| 06 | Content Blueprint | Master Blueprint + URL Map + page copy in source — partial | P0 | Project Owner + Content/SEO | 02, 03, 04, 05, 07 | Approve page-level VI/EN content and parity. No fabricated business history, USP, prices, testimonials, metrics, portfolio or SLA. Project/blog content stays conditional on evidence and editorial approval. |
| 07 | UX Blueprint | `UX_BLUEPRINT.md` — B2C-first baseline documented; review required | P0 | UX Architect + Project Owner | 02, 05, 06, 08, 09 | B2C-first visitor journey and form flows are documented in line with owner-approved sequencing; detailed persona, customer pain points, objections and usability validation remain TBD pending evidence/research. B2B remains in scope for the subsequent content/UX expansion. |
| 08 | UI Blueprint | `UI_BLUEPRINT.md` — draft complete, review required | P0 | UI Architect + Project Owner | 03, 06, 07 | Page templates, shell, components, responsive and accessibility rules exist. Final visual approval is blocked by missing official brand identity; current tokens are not an approved brand system. |
| 09 | Feature Blueprint | `FEATURE_BLUEPRINT.md` — draft complete, review required | P0 | Product/Business Analyst + Development + QA | 02, 05–08, 10–13 | Thirteen features are registered with dependencies and acceptance criteria. Inquiry form (F-009) cannot pass end-to-end acceptance until an API endpoint and approved privacy/consent wording are available. |
| 10 | Technical Blueprint | `ARCHITECTURE.md`, Roadmap — partial | P0 for Preview build/runtime; production choices deferred | Technical Architect + Operations | 05, 09, 11–13 | Documented static preview path and existing Worker/D1 scaffold. Production host, API endpoint, database/resource configuration, secrets, ownership and runtime are not accepted. |
| 11 | Architecture Blueprint | `ARCHITECTURE.md` — partial | P0 for the selected Preview architecture | Solution Architect | 09, 10, 13 | Logical architecture and security boundaries exist. Final deployment topology and external service choices remain open; do not treat the long-term platform architecture as Core Preview scope. |
| 12 | Performance Blueprint | Not separately completed; Feature NFR and QA gates exist | P0 acceptance gate | Performance Engineer + QA | 08, 10, 11 | Measure actual Preview with recorded URL, date, device and method. Project-specific performance targets and acceptance thresholds must be agreed; do not claim performance success from build/CI alone. |
| 13 | Security Blueprint | Architecture security section, tests and Risk Assessment — partial | P0 acceptance gate | Security Engineer + Development + QA | 09–11, 16 | Verify public/private boundaries, form validation, rate limiting, secrets, headers, dependency and runtime controls. Worker/D1/R2 staging or production runtime is not accepted. |
| 14 | AI Blueprint | Deferred; no Core Preview requirement | Deferred | Project Owner + AI/Technical Architect | 02, 10, 11, 13, 15 | No AI feature is authorized in Core Preview. Create a separate AI Blueprint only after a specific approved business requirement, data policy, risk controls and provider decision exist. |
| 15 | Marketing Blueprint | Not started | Planning prerequisite for growth; not a Core Preview build blocker | Project Owner + Marketing/SEO | 02–06, 17 | Audience, positioning, channel strategy, budget, campaign goals and measurable KPIs are missing. Do not invent market size, acquisition targets or campaign commitments. |
| 16 | Development Roadmap | `IMPLEMENTATION_ROADMAP.md` — in progress | P0 governance | Project Owner + Project Manager + Technical Lead | All relevant modules, especially 09–13 and 17 | Keep Core Preview P0 separate from long-term phases. Architecture now places the customer portal in a later platform release, outside Core Preview P0; keep this boundary consistent across the Master Blueprint, Roadmap, README and Architecture. |
| 17 | Risk Assessment | `RISK_ASSESSMENT.md` — draft complete; risks remain open | P0 governance | Project Owner + Planning + QA | 01–16, 18 | Risk register has 16 items. Each high/critical risk needs an owner, mitigation evidence, residual status and explicit acceptance where it cannot be closed before Preview. |
| 18 | Project Timeline | Not baselined | Planning prerequisite before schedule commitment | Project Owner + Project Manager | 01–17; scope and dependencies confirmed | No credible schedule can be baselined until scope, owner availability, dependencies and acceptance work are estimated. Do not invent dates or effort. |
| 19 | Final Validation | Pending | Mandatory acceptance gate | QA Lead + Project Owner | 01–18 and all P0 evidence | Complete requirement traceability, content/business, functional, UI/UX, responsive, SEO, accessibility, performance, security and runtime checks. Produce evidence and defect disposition; user approval is required before phase transition. |

## 3. Project Input completeness check

The Project Input Template labels multiple fields as Required. The current project baseline does not yet contain confirmed values for all of them.

### Confirmed or substantially confirmed

- Project/brand name: HOIQUANWEB.
- Domain: `hoiquanweb.io.vn`.
- Website type: multi-page business/service website.
- Languages: Vietnamese and English.
- Market direction: Vietnam and international; English-speaking markets prioritized, exact countries TBD.
- Core service groups: the seven approved groups in Master Blueprint.
- Primary conversion: consultation and quotation requests.
- Customer scope and sequence: B2C first, then B2B; both remain in scope (owner-confirmed 2026-11-13). Detailed personas remain TBD.
- Factual business description: owner-approved wording recorded in `OWNER_DECISION_REVIEW.md` and `MASTER_BLUEPRINT.md` (2026-11-13).
- Website direction: SEO-first; Preview-first / Core-first.

### Required inputs still open or only partially specified

| Project Input field | Current state | Impact |
|---|---|---|
| 00.2 / 01.3 Industry | Technology/service context is apparent, but the owner has not supplied a formal industry classification | Business/SEO best practices |
| 01.2 Business Model | Customer scope and priority order confirmed: B2C first, then B2B; operating/revenue model remains TBD | Funnel and business blueprint |
| 01.6 USP | TBD | Homepage, service messaging and differentiation |
| 01.9 Primary Conversion Goal | Confirmed: consultation/quotation request | CTA and inquiry flow |
| 01.12 Geographic Market | Vietnam + international; target English-speaking countries TBD | Localization, legal and SEO targeting |
| 02.3 Brand Description, 02.8 Logo, 02.10 Brand Colors | Official identity not approved; current code tokens are observational only | Brand and final UI approval |
| 03.1 Primary Audience, 03.5 Geographic Markets, 03.7 User Intent, 03.8 Search Behavior, 03.10 User Goals | B2C-first then B2B priority is confirmed; detailed B2C personas, B2B buyer roles, market, intent and search behavior remain unvalidated | Persona, UX, content and keyword strategy |
| 04.1 Primary Business Goal, 04.4 Target Keywords, 04.7 Success Metrics | Lead-generation direction is known; measurable business KPIs and target keywords are not approved | Marketing and SEO acceptance |
| 05.2 Website Scale and 05.4/05.5 content modules/types | Route inventory exists; final content inventory and publishing policy remain conditional | Content/technical scope |
| 06.1 Core Features, 06.2 Priority Features, 06.5 Business Workflows | P0 feature register exists; owner acceptance and end-to-end form workflow still pending | Feature sign-off |
| SEO-001 Primary Keywords and SEO-003 Search Intent | Topic seeds exist but are explicitly unvalidated | SEO strategy |
| UX-001 Primary User Journey and UI-001–UI-003 | Neutral journey and UI baseline exist; audience/brand validation pending | UX/UI sign-off |
| TECH-001–003, INFRA-001 and related infrastructure fields | Preview implementation is observed; production stack/topology and ownership are not fully approved | Production architecture |
| PERF-001 / PERF-002 | No project-approved target/measurement baseline is recorded | Performance acceptance |

This table is a gap check, not a replacement Project Input form. No missing field has been filled by inference.

## 4. Cross-document inconsistencies and required reconciliation

| ID | Finding | Severity | Required correction / handling | Acceptance condition |
|---|---|---|---|---|
| XC-01 | Historical wording in README and Architecture described the customer portal as part of the “first release”, conflicting with Core Preview P0. | Resolved in this branch | README and Architecture now place the portal in a later platform release, outside Core Preview P0; Phase 4 remains a later roadmap capability. | Master Blueprint, Roadmap, README and Architecture use the same scope boundary; retain only as a resolved audit item. |
| XC-02 | Historical README wording described 40 generated routes as “40 pages of content”. | Resolved in this branch | README now says 40 generated localized HTML routes (20 VI/EN pairs) and explicitly separates route generation from approved/indexable content. | Current README wording matches generator evidence and URL Map; retain only as a resolved audit item. |
| XC-03 | URL Map records that the current generator includes all 40 routes in the sitemap and gives them `index,follow`, while the target policy excludes the generic blog-detail shell and adds individual article URLs only after clean routes and initial-HTML SEO exist. | Critical for blog SEO; bounded impact on Core Preview | Keep blog detail conditional and non-indexable until R-016 is resolved; correct generated sitemap/robots/meta policy and validate the artifact. | No generic blog shell in sitemap; article URLs appear only when eligible and rendered with SEO data in initial HTML. |
| XC-04 | F-009 is P0-Must but depends on an API endpoint and approved privacy/consent wording; the backend runtime and API base are not accepted. | Critical for inquiry conversion acceptance | Do not show false success. Either configure and test the approved API path, or explicitly record that end-to-end inquiry submission is not accepted and obtain an owner-approved fallback before Preview sign-off. | Successful API acceptance and failure/retry cases are tested on Preview; privacy/consent copy is approved. |
| XC-05 | Master Blueprint records the 20 VI/EN URL pairs, while URL Map says `x-default` currently points to Vietnamese only if Vietnamese is approved as default fallback. No default-language decision is recorded. | Moderate | Ask owner to approve the default fallback or omit/change x-default until decided. | Every hreflang pair is genuine and x-default policy is approved and tested. |
| XC-06 | The six high-level traceability rows do not yet map the full set of required Project Input fields to module deliverables and evidence. | High — completeness gap | Expand traceability only when the missing Project Input fields are answered; preserve explicit TBDs meanwhile. | Every approved Required input has a destination and acceptance evidence; every unapproved field is marked TBD or accepted as non-blocking by owner. |
| XC-07 | The 19-module register has status and notes, but not a consistent named owner/role, dependency and module-specific acceptance evidence for every module. | High — governance gap | Use this cross-check matrix as the interim role/dependency/acceptance register; owner must confirm role assignments. | No module is marked complete without an accountable owner role and evidence. |
| XC-08 | Performance Blueprint is not a standalone deliverable; Feature NFRs require measurement but project-specific thresholds are not approved. | Moderate | Produce a focused Performance Blueprint or an explicit approved acceptance profile before QA. Do not silently adopt example thresholds as project decisions. | Test method, environment, metrics, target thresholds and evidence are documented. |
| XC-09 | Production host, Worker/D1/R2 resources, API base, secrets and operations ownership are not accepted, while some repository documentation describes capabilities already present in code. | Critical for production; not a reason to widen P0 | Separate code/CI/preview/runtime/production status everywhere. No production claim or external configuration until owner approval. | Staging runtime, security, backup, monitoring and deployment ownership are verified before production approval. |

## 5. Priority blockers and disposition

### Must be resolved before Core Preview can be accepted

1. **Inquiry path (F-009):** approved API endpoint or an owner-approved alternative, privacy/consent wording, and end-to-end success/failure evidence.
2. **Eligible sitemap and route SEO:** remove generic blog-detail shell from indexable sitemap; keep dynamic blog/CMS content non-indexable until clean routes and initial-HTML rendering meet R-016.
3. **Content integrity:** no placeholder, invented company facts, unsupported claims, false portfolio evidence, unapproved prices or SLA.
4. **Preview evidence:** test direct route loading, VI/EN pairs, forms, responsive behavior, accessibility, SEO metadata and actual performance on the accessible Preview.
5. **Security/runtime boundary:** no private/admin content exposed; no secrets in frontend; clearly disclose any feature that depends on an unconfigured API.

### Must be resolved before Blueprint Final approval

1. Owner response to required Project Input fields for business description, business model, industry, USP, target audience and measurable success criteria — or an explicit owner decision that named fields are non-blocking for this public-site scope.
2. Official brand identity decision, or explicit approval to proceed with a neutral interim visual system that is not represented as final brand identity.
3. Confirm whether Vietnamese is the `x-default` language fallback.
4. Confirm module owner roles and approve the scope boundary between Core Preview and the later platform release.
5. Complete Competitor, Marketing, Performance, Timeline and Final Validation planning at the level required by the applicable Blueprint Standard, or formally defer the non-P0 deliverable with reason and approval.

### Deferred from Core Preview

- AI features and AI automation.
- CMS advanced page builder, CRM expansion, customer portal, payments/commerce, booking, template provisioning, hosting/domain provisioning and chatbot.
- Production infrastructure rollout until provider, ownership, access, security and operational decisions are approved.

## 6. Phase 0 exit criteria — cross-checked

Phase 0 is **not complete** until all applicable conditions below are evidenced and the Project Owner approves the Blueprint.

- [ ] All 19 modules have a status, priority, accountable owner role, dependencies, deliverables and acceptance criteria.
- [ ] Required Project Input fields are answered or explicitly accepted by the Project Owner as non-blocking for Core Preview.
- [ ] Core Preview P0 and long-term platform roadmap are unambiguous across Master Blueprint, Roadmap and README.
- [ ] Feature, UI and UX Blueprints are reviewed and approved; draft completion is not treated as acceptance.
- [ ] Business, brand, content, competitor and marketing gaps are resolved or explicitly deferred with impact recorded.
- [ ] URL Map, generator output, canonical, hreflang, robots and sitemap policy are consistent.
- [ ] Blog-detail shell is excluded from indexable sitemap and noindex is emitted; dynamic articles are not indexed before R-016 acceptance.
- [ ] Inquiry form endpoint, privacy/consent copy and success/failure behavior are approved and tested.
- [ ] Technical and architecture choices needed for Preview are distinguished from production choices.
- [ ] Performance and security acceptance profiles are documented and tested in the actual Preview/runtime.
- [ ] Critical/high risks have mitigation evidence or explicit owner-approved residual-risk acceptance.
- [ ] Timeline is baselined only after scope, dependencies and owner availability are known.
- [ ] Final Validation evidence is recorded and the Project Owner explicitly approves transition to the next phase.

**Current decision:** Phase 0 remains open. The cross-check identifies documentation and acceptance gaps; it does not authorize implementation expansion, merge, deployment, production configuration or external account changes.

## 7. Change control

- This document is a review artifact and does not override the user-confirmed decisions in Master Blueprint.
- Any change to P0, service groups, route inventory, language strategy, conversion behavior or production topology requires explicit owner approval.
- Never promote an assumption, code observation, proposal or CI result into an approved business decision.
- Keep the pull request open until review and acceptance; do not merge or deploy without explicit approval.
