# HOIQUANWEB — Project Input Traceability Matrix

**Document status:** Traceability baseline — owner review required  
**Planning phase:** Phase 0 — Requirements & Blueprint  
**Source standard:** Owner-supplied `02_PROJECT_INPUT_TEMPLATE.md`, Version 3.0 (Condensed)  
**Review date:** 2026-11-13  
**Scope:** All fields explicitly labelled **Required** in the supplied Project Input Template.

## 1. Purpose and rules

This matrix maps every Required Project Input field to its Blueprint destination and current evidence/status. It closes the documentation gap identified as XC-06 in `BLUEPRINT_CROSS_CHECK.md`; it does **not** claim that the Project Input is complete or that unresolved values have been approved.

The supplied template states that users need not fill every field, that AI must identify Critical fields, and that missing values must not be silently inferred. The template labels fields as Required, Recommended or Optional. This matrix preserves those labels and does not create new input fields.

Status meanings:

- **Approved:** Explicitly confirmed by the Project Owner or covered by an owner-approved decision.
- **Partially approved:** A limited value or direction is approved; the remaining detail is TBD.
- **Draft / validation pending:** A planning proposal or current document exists but has not received owner approval.
- **TBD / open:** No confirmed value; do not infer one.
- **Observed only:** Present in repository code or workflow, but not approved as the production decision.

## 2. Required-field traceability

The supplied template contains **55 fields explicitly labelled Required** across Sections 00–12 and 14. Each is mapped below.

### 00–04. Project, business, brand, audience and goals

| Input field (exact ID) | Current value / status | Blueprint destination | Evidence / acceptance condition |
|---|---|---|---|
| 00.1 Project Name | **Approved:** HOIQUANWEB | Master Blueprint §2; Executive Summary | DEC-001; consistent brand/project name across approved documents |
| 00.2 Industry | **TBD:** formal industry classification has not been supplied | Business Blueprint | Owner supplies/approves formal classification; do not infer from service names |
| 00.3 Website Type | **Approved:** multi-page business/service website | Business Blueprint; Website Strategy; Sitemap | DEC-003; scope and route inventory remain consistent |
| 00.4 Project Description | **Approved:** bilingual public service website introducing services and receiving consultation/quotation requests | Executive Summary; Business Blueprint; Website Strategy | D-01 factual description plus approved Core Preview scope; no additional business claims |
| 01.1 Business Name | **Partially approved:** HOIQUANWEB is the operating brand label; legal entity/business registration name is not supplied | Business Blueprint; Brand Blueprint; Organization entity data | DEC-001; legal identity remains TBD until owner supplies it |
| 01.2 Business Model | **Partially specified:** B2C and B2B customer scope approved, B2C first; operating/revenue model remains TBD. Lead generation is the website's primary conversion, not proof of the underlying revenue model | Business Blueprint; Conversion Strategy | DEC-011 and DEC-006; owner must supply operating/revenue model before it is represented as fact |
| 01.3 Industry | **TBD:** formal business-industry classification | Business Blueprint; SEO/Content strategy inputs | Owner approval required; do not substitute a broad “technology” label as a formal classification |
| 01.4 Business Description | **Approved:** exact factual wording recorded in Owner Decision Review | Business Blueprint; About page; factual Organization description | D-01 / DEC-012; published wording must match the approved text |
| 01.5 Core Products / Services | **Approved:** seven service groups — Website, Software, Mobile App, Game, SEO, AI & Automation, Other Technology Services | Business Blueprint; Service Blueprint; Sitemap; service-page content | DEC-007; retain all seven groups without unauthorized merging/removal |
| 01.6 Unique Selling Proposition (USP) | **Restricted for Core Preview:** no public USP/comparative claim authorized; evidence-backed USP remains TBD | Business Blueprint; Brand/Content/Marketing Blueprint | DEC-013; no “best”, “leading”, guarantees, comparative claims or unsupported differentiators |
| 01.9 Primary Conversion Goal | **Approved:** consultation and quotation requests | Conversion Strategy; UX Blueprint; Feature Blueprint; Contact page | DEC-006 and DEC-015; form must not claim success without durable API acceptance |
| 01.12 Geographic Market | **Partially approved:** Vietnam and international; English-speaking markets prioritized; exact target countries remain TBD | Business Blueprint; SEO and Localization Blueprint | DEC-005; country-specific SEO/legal/localization requires owner input |
| 02.1 Brand Name | **Approved:** HOIQUANWEB | Brand Blueprint; Design System; metadata/schema | DEC-001; consistent spelling across UI, metadata and schema |
| 02.2 Domain | **Approved:** `hoiquanweb.io.vn` | URL Map; SEO Blueprint; Technical Blueprint | DEC-002; canonical, sitemap and production host must use the approved domain |
| 02.3 Brand Description | **Approved for factual description only:** use the D-01 wording; separate brand story/positioning remains TBD | Brand Blueprint; About page; SEO description | DEC-012; do not add an unapproved brand promise, history or positioning |
| 02.8 Logo | **TBD:** official logo and final logo direction have not been owner-approved in the project baseline | Brand Blueprint; UI Blueprint; header/favicon assets | Owner supplies or approves official logo; interim visual tokens are not logo approval |
| 02.10 Brand Colors | **Partially approved:** five provisional blue/white Preview tokens only; not the official brand palette | Design System; UI Blueprint; component tokens | DEC-014; use only within Core Preview and do not label as official brand identity |
| 03.1 Primary Audience | **Partially approved:** both B2C and B2B; prioritize B2C first, then B2B; detailed personas remain TBD | Business Blueprint; UX/Content/SEO Blueprint | DEC-011; no invented demographics, roles, company sizes or pain points |
| 03.3 Age Groups | **TBD:** no age groups or demographic profile approved | Audience/Persona Blueprint; UX and Content Blueprint | Owner research/input required; do not infer age from service category |
| 03.5 Geographic Markets | **Partially approved:** Vietnam and international; exact English-speaking countries and geographic segments TBD | Audience/Persona Blueprint; Localization and SEO Blueprint | DEC-005; market-specific content and targeting require confirmed countries |
| 03.7 User Intent | **Draft / validation pending:** service discovery and consultation/quotation intent are reasonable journey hypotheses from the approved website purpose; no keyword-level intent map is approved | SEO Blueprint; UX Journey; Sitemap | Validate against owner input and keyword research; label hypotheses until confirmed |
| 03.8 Search Behavior | **TBD:** search behavior and query patterns are not validated; existing topic seeds are not approved target keywords | SEO Blueprint; Keyword Strategy; Content Blueprint | Keyword research with search intent and target-market evidence; no invented search behavior |
| 03.10 User Goals | **Draft / validation pending:** understanding services and requesting consultation/quotation are journey-level hypotheses based on the approved conversion goal | UX Blueprint; Conversion Strategy; Content Blueprint | Validate task goals and objections with owner/customer evidence; do not invent personas |
| 04.1 Primary Business Goal | **Partially approved:** website goal is service introduction and receiving consultation/quotation requests; measurable business outcome/KPI is TBD | Business Blueprint; Executive Summary; Marketing Blueprint | DEC-006 and D-01; owner must confirm business-level outcome and measurement target |
| 04.4 Target Keywords | **TBD:** no owner-approved primary keyword set; current topic seeds are unvalidated | SEO Blueprint; Keyword Map; Content Blueprint | Approved keyword list with target market and search intent |
| 04.7 Success Metrics | **TBD:** measurable business KPIs and numeric targets are not approved | Business Blueprint; Marketing Blueprint; QA Acceptance Profile | Owner approves metric definitions, baselines, targets and measurement period |

### 05–07. Website scope, functions and content

| Input field (exact ID) | Current value / status | Blueprint destination | Evidence / acceptance condition |
|---|---|---|---|
| 05.1 Website Purpose | **Approved:** corporate/service introduction with consultation and quotation lead generation | Website Strategy; Executive Summary; Sitemap | DEC-003 and DEC-006; all P0 pages support the approved purpose |
| 05.2 Website Scale | **TBD:** formal scale classification has not been approved; generated route count is an implementation observation, not an owner-approved scale | Technical Blueprint; Sitemap; Roadmap | Owner confirms scale or explicitly accepts it as non-blocking; do not infer from generated route count |
| 05.4 Website Modules | **Approved at scope level:** homepage, about, service overview and seven service groups, conditional projects/blog, FAQ, contact/inquiry, privacy, language routes and 404 | Sitemap; Feature Blueprint; URL Map | Core Preview P0 scope; project/blog content remains conditional on approval and indexability rules |
| 05.5 Content Types | **Partially approved:** factual business/service pages, service detail pages, inquiry/contact and privacy content; project/blog/FAQ publication depends on verified content and approval | Content Blueprint; Sitemap; Content Model | No fabricated portfolio, article, testimonial, result, policy or placeholder content |
| 05.6 Languages | **Approved:** Vietnamese and English; Vietnamese is the approved `x-default` fallback | Localization Blueprint; URL Map; SEO Blueprint | DEC-004 and DEC-021; genuine reciprocal VI/EN pairs and Vietnamese x-default verified in generated HTML where available |
| 06.1 Core Features | **Approved at P0 scope level:** bilingual public pages, service taxonomy, responsive layout, basic SEO route metadata, inquiry channel and required public-site states | Feature Blueprint; UX/UI/Technical Blueprint | P0 feature register and acceptance criteria; live inquiry submission remains blocked by API/privacy/email prerequisites |
| 06.2 Priority Features | **Approved:** Core Preview P0 first; P1/P2 and long-term platform capabilities remain deferred unless separately approved | Feature Blueprint; Development Roadmap | DEC-009 and DEC-010; no deferred module is silently promoted into P0 |
| 06.5 Business Workflows | **Partially approved:** consultation/quotation inquiry is the primary external workflow; Owner directly handles incoming requests; retention and deletion rules are approved, but runtime processing is not accepted | UX Flow; Feature Blueprint; Security/Privacy; QA | D-05 through D-10; test durable save, notification failure/retry, duplicate handling, retention reset and expiry deletion before activation |
| 07.1 Primary Content Types | **Partially approved:** business/service information, service detail, project descriptions, blog/articles, FAQ and inquiry/privacy content; publication rights and content readiness vary by type | Content Blueprint; Sitemap; CMS/SEO rules | Every published item needs verified source, approval and correct indexation policy; project/blog content remains conditional |
| 07.2 Content Categories | **Partially approved:** seven service groups are approved as service taxonomy; blog/knowledge categories remain TBD | Information Architecture; Content Blueprint; URL Map | DEC-007; service taxonomy must remain consistent; blog taxonomy requires content strategy/owner approval |

### SEO, UX, UI and Technical requirements

| Input field (exact ID) | Current value / status | Blueprint destination | Evidence / acceptance condition |
|---|---|---|---|
| SEO-001 Primary Keywords | **TBD:** no approved primary keyword set | SEO Blueprint; Keyword Map | Owner/SEO review of keyword research; no topic seed becomes a target keyword by inference |
| SEO-003 Search Intent | **TBD:** no approved search-intent map | SEO Blueprint; Content Map | Map each approved keyword to an evidenced intent and matching page |
| UX-001 Primary User Journey | **Draft / validation pending:** service discovery → service detail/relevant project information → consultation/quotation request | UX Blueprint; User Journey and Flow | Validate task sequence and edge cases; approved conversion goal is not approval of every interaction detail |
| UX-002 Navigation Structure | **Draft / review required:** route/navigation baseline exists in UX and URL Map documents | UX Blueprint; Information Architecture; Navigation Specification | Owner review of labels, hierarchy, VI/EN parity, direct routes and mobile navigation |
| UX-003 Homepage Priority | **Draft / validation pending:** homepage follows the approved B2C-first sequence and factual service/lead-generation scope; exact section order remains reviewable | UX Blueprint; Homepage Blueprint; Content Blueprint | No unapproved USP, demographic claims or fabricated trust signals; Owner review required |
| UX-004 CTA Strategy | **Partially approved:** primary action is consultation/quotation request; exact labels, placements and secondary CTAs remain TBD | UX Blueprint; Conversion Strategy; Feature Blueprint | DEC-006; validate visible CTA and form states without false success |
| UX-008 Mobile Experience | **Partially approved:** responsive mobile/tablet/desktop support is in Core Preview scope; detailed mobile behavior remains to be tested | UX Blueprint; Responsive Specification; QA | Test representative mobile viewports, keyboard/form use, navigation and overflow on Preview |
| UI-001 Design Style | **Partially approved:** interim blue/white technology visual direction for Core Preview; formal style classification and official brand direction remain TBD | UI Blueprint; Design System | DEC-014; do not describe interim direction as final brand identity |
| UI-002 Visual Tone | **Draft / validation pending:** technology-oriented visual direction is provisional; exact tone/voice remains TBD | UI Blueprint; Brand Blueprint; Content Guidelines | Owner review; ensure visual/copy tone does not imply unsupported positioning |
| UI-003 Color System | **Partially approved:** Primary `#155EEF`, Navy `#0B1F3A`, Cyan `#38BDF8`, Light Surface `#F5F8FC`, White `#FFFFFF` as provisional Preview tokens | Design System; UI Blueprint; Component Tokens | DEC-014; use only for Core Preview pending official palette approval |
| UI-009 Responsive Design | **Partially approved:** mobile, tablet and desktop coverage is required; exact breakpoints are not approved | UI Blueprint; Responsive Specification; QA | Document chosen breakpoints as implementation parameters and validate layout at agreed viewport sizes |
| TECH-001 Technology Stack | **Observed only:** repository contains a frontend build, generated static public site and Worker/D1-related application scaffold; production stack/runtime is not accepted | Technical Blueprint; Architecture Blueprint; Deployment Plan | Owner approves target stack and environment; distinguish source code, CI, Preview, staging and production |
| TECH-002 Architecture Pattern | **Observed / partial:** architecture documents and existing code describe a current pattern, but final production architecture has not been accepted | Architecture Blueprint; Technical Blueprint | Approved architecture diagram, boundaries, dependencies and deployment topology |
| TECH-003 Database | **Observed only:** Worker/D1 integration tests/scaffold exist; production database choice, resource and operational ownership are not accepted | Data/Architecture Blueprint; Security; Backup & Recovery | Approve target database, schema/data ownership, backup and restore evidence before production |
| INFRA-001 Hosting | **TBD / observed only:** GitHub Pages workflow builds a static public-site artifact; production host and ownership are not accepted | Infrastructure Blueprint; Deployment Plan | Owner approves production host, DNS, deployment ownership and runtime acceptance |
| INFRA-008 SSL | **Partially evidenced:** generated URLs use HTTPS; live certificate, renewal, redirect and origin behavior have not been accepted as runtime evidence | Infrastructure Blueprint; Security Blueprint; QA | Verify HTTPS, certificate validity/renewal, HTTP→HTTPS behavior and canonical host on accessible Preview/production |

### 14. Performance requirements

| Input field (exact ID) | Current value / status | Blueprint destination | Evidence / acceptance condition |
|---|---|---|---|
| PERF-001 Core Web Vitals | **Approved:** LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1; evaluate field p75 separately for mobile and desktop where sufficient data is available; lab results reported separately | Performance Blueprint; QA Acceptance Profile | Owner decision D-13 (mapped as DEC-022 in Master Blueprint, 2026-11-13); this approves thresholds only, not current site performance. Attach reproducible field/lab evidence before acceptance |
| PERF-002 Page Load Time | **TBD:** no project-approved page-load target | Performance Blueprint; QA Acceptance Profile | Define metric, test method, device/network profile and acceptance threshold before sign-off |
| PERF-008 Mobile Performance | **TBD:** mobile is in responsive scope, but a measurable mobile-performance target is not approved | Performance Blueprint; Mobile QA | Record mobile lab/field measurements and owner-approved thresholds; do not claim success from CI build alone |

## 3. Sections and fields without an explicit requirement level

The supplied template includes fields in Sections 13 and 15–19 whose Level column is blank (including Security & Compliance, AI & Automation, Integrations, Constraints & Assumptions, Success Criteria and Additional Notes). This matrix does not silently promote those fields to Required, Recommended or Optional.

Their applicability and priority must be determined from the approved Core Preview scope, security/QA standards and any later owner decisions. AI-specific fields are not Core Preview requirements unless a separate AI requirement is approved. Security and privacy controls can still be P0 acceptance requirements under the project standards and approved inquiry-data decisions; that is distinct from claiming the template labels every SEC field as Required.

## 4. Completeness and acceptance status

- **Traceability coverage:** 55/55 explicitly Required fields are mapped to a Blueprint destination and an evidence/acceptance condition.
- **Input completeness:** Not complete. Formal industry classification, operating/revenue model, logo, detailed audience data, keyword/search-intent evidence, business KPIs, approved scale, final navigation/homepage decisions, production technology/infrastructure and non-CWV performance targets remain open or partial.
- **No silent inference:** Audience demographics, legal entity, USP, target keywords, numeric KPIs, production stack/hosting and non-CWV performance thresholds remain TBD unless explicitly approved elsewhere; Core Web Vitals thresholds are approved under D-13 / DEC-022.
- **Core Preview boundary:** An open input does not automatically authorize adding a new feature or expanding P0. Keep unresolved values visible and use only approved factual content.
- **Approval gate:** This matrix is a traceability baseline, not final Project Input approval or Blueprint approval. Phase 0 remains open until critical inputs, deliverables and evidence are accepted by the Project Owner.

## 5. Source and cross-references

- Owner-supplied source: `02_PROJECT_INPUT_TEMPLATE.md`, Version 3.0 (Condensed), Sections 00–19.
- Project decisions: `OWNER_DECISION_REVIEW.md`.
- Consolidated decisions and scope: `MASTER_BLUEPRINT.md`.
- Module review and cross-document gaps: `BLUEPRINT_CROSS_CHECK.md`.
- Route and SEO policy: `URL_MAP.md`.
