# HOIQUANWEB — Technical, Security & QA Gap Register

**Deliverable ID:** BP-GAP-01  
**Document status:** Working audit — for Project Owner / Technical Lead / QA review  
**Planning phase:** Phase 0 — Requirements & Blueprint  
**Scope:** Core Preview P0 and evidence required to present Gate 2  
**Assessment date:** 2026-11-13  
**Repository:** seokillseo-byte/hoiquanweb  
**Branch:** docs/phase-0-master-blueprint-risk-review  
**Related PR:** [#43](https://github.com/seokillseo-byte/hoiquanweb/pull/43)

> Documentation and test planning only. This document does not authorize implementation outside XC-03/R-016 and XC-10/R-017, live data collection, production load testing, merge, deployment or production changes.

## 1. Deliverable definition

- **Objective:** Convert the five Owner-supplied v3.0 standards and current repository evidence into an actionable, traceable register of Technical, Architecture, Security, Performance and QA gaps.
- **Description:** Identify what is documented, implemented but not runtime-accepted, and still lacks acceptance evidence; define the minimum readiness sequence for Core Preview P0.
- **Priority:** P0 — required input to Phase 0 validation and Gate 2 review.
- **User / stakeholder:** Project Owner; Technical Lead; Development; QA; SEO/Content; UX/UI; Security/Operations.
- **Dependencies:** Five Owner standards; Master Blueprint; Cross-check; Architecture; Performance Blueprint; Risk Assessment; Feature/UI/UX Blueprints; HDO-019; development and QA evidence.
- **Acceptance criteria:** Each gap has status, evidence source, owner role, dependency and closure evidence; unapproved decisions remain TBD; P0 is separated from the later platform roadmap.
- **Implementation notes:** Planning/QA only. No source-code or infrastructure changes.
- **Risks:** Stale evidence, ambiguous authority, incomplete Project Input, and conflating CI success with runtime/security/Owner acceptance.
- **Quality checklist:** [x] Five standards used [x] P0 scope preserved [x] Evidence and unknowns distinguished [x] R-016/R-017/F-009 included [x] No production action authorized [ ] Owner/role disposition recorded [ ] Gate 2 approved.

## 2. Evidence interpretation rules

1. Owner-approved decisions take precedence over proposals and repository observations.
2. Code and tests prove only the behavior actually exercised by those tests.
3. CI success is not proof of live Worker/D1/R2, mailbox delivery, production security, field Core Web Vitals or visual acceptance.
4. A documented architecture is not an approved production topology.
5. A feature present in the repository or long-term roadmap is not automatically part of Core Preview P0.
6. Missing data remains TBD; do not fill it with fabricated values or present generic best practices as Owner decisions.

## 3. Current evidence baseline

| Area | Current evidence | Status / interpretation |
|---|---|---|
| Public routes | Generator defines 40 localized route objects; sitemap is generated from route data; PR CI passes | Automated build/validation exists; live Preview visual acceptance remains pending |
| SEO indexability | Generic blog shells are noindex and excluded from sitemap | Guard implemented; dynamic article clean-slug and article-specific initial HTML remain open under R-016 |
| Preview assembly | Public homepage remains at /; SPA isolated under /platform/; portal HTML retained; PREV-01..06 validated | Static artifact/CI evidence exists; full visual/browser/responsive and Owner acceptance remain open under R-017 |
| Backend | Worker scaffold, Better Auth, role checks, CMS/lead foundations and D1 migrations exist in repository | Runtime resources/migrations are not evidenced as deployed and accepted on staging |
| Database/storage | D1 migration and R2-dependent media code exist | Actual environment resources, migration execution, rollback and restore evidence remain open |
| Inquiry form | Destination and retention decisions recorded | Live collection blocked pending privacy/consent, API, sender/mailbox and end-to-end evidence (F-009) |
| Security | Security boundaries and selected auth/authorization tests documented | Dedicated P0 security acceptance profile and staging runtime evidence incomplete |
| Performance | D-13/DEC-022 thresholds approved: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 at field p75 by device class where available | No current Lighthouse/field baseline or accepted API/load/bundle thresholds |
| Governance | Gate 1 complete in handoff context; HDO-019 draft; Gate 2 not approved | Only bounded XC-03/XC-10 authorization exists; no blanket development authority |

## 4. Gap register

### GAP-TECH-01 — Technical Blueprint lacks an accepted P0 runtime/deployment contract

- **Priority:** P0. **Current state:** Partial.
- **Evidence:** ARCHITECTURE.md describes a proposed target architecture and observed implementation; it does not claim the target is implemented.
- **Gap:** Preview/production hosting boundary, API runtime, database and object-storage ownership, environment separation, deployment responsibility, secrets handling, rollback and operational ownership are not approved as one P0 contract.
- **Owner role:** Technical Lead proposes; Project Owner approves; Security/Operations reviews.
- **Dependencies:** TBD-008; HDO-019 readiness conditions; architecture decisions.
- **Closure evidence:** Approved P0 deployment diagram and environment matrix; exact provider/runtime choices or explicit deferrals; resource ownership; secrets boundary; migration/rollback approach; verified accessible Preview URL.
- **Not authorized:** Creating provider resources, deploying Worker/D1/R2, changing DNS/Cloudflare or production secrets.

### GAP-ARCH-01 — Architecture decisions need a decision ledger

- **Priority:** P0. **Current state:** Documentation consolidated; Owner acceptance and production decisions remain open.
- **Evidence:** `ARCHITECTURE_BLUEPRINT.md` now maps all 15 Architecture Blueprint deliverables and consolidates `ARCHITECTURE.md`, `API_CONTRACT.md`, `DATA_MODEL.md`, ADR-0001 and ADR-0002.
- **Gap:** Production frontend host, API/runtime topology, database and object-storage resources, email sender, monitoring, backup/restore ownership and operational integrations are not approved as production decisions. Existing ADRs remain candidate/prototype status.
- **Owner role:** Technical Lead; Project Owner approval; Security/Operations review.
- **Dependencies:** GAP-TECH-01; business/privacy decisions; HDO-019.
- **Closure evidence:** Owner-reviewed architecture decision ledger; approved topology/environment matrix; provider/resource ownership; operational responsibilities; staging/runtime evidence. Mark non-P0 integrations as deferred.

### GAP-SEC-01 — Dedicated Security Blueprint and P0 security acceptance profile are incomplete

- **Priority:** P0. **Current state:** Partial.
- **Evidence:** ARCHITECTURE.md, RISK_ASSESSMENT.md and selected auth tests describe security boundaries and controls; HDO-019 states security acceptance and staging/runtime evidence remain incomplete.
- **Gap:** No consolidated P0 security profile covers threat boundaries, assets/data classification, authentication/session configuration, authorization matrix, CSRF/CORS, input validation, rate limiting, abuse controls, secrets, logging/redaction, privacy, retention/deletion, backup/restore, incident ownership and security test evidence.
- **Owner role:** Security/Operations and Technical Lead; Project Owner accepts residual risk.
- **Dependencies:** F-009 privacy policy; GAP-TECH-01; environment readiness.
- **Closure evidence:** P0 threat model; endpoint/role authorization matrix; dependency and secret scan results; applicable security test report; session/cookie/CSRF/CORS tests; validation/rate-limit tests; log redaction review; retention/restore tests; vulnerability register with severity and Owner disposition.
- **Boundary:** Do not claim security certification or production security acceptance from repository integration tests alone.

### GAP-PERF-01 — Performance acceptance evidence is absent

- **Priority:** P0. **Current state:** Not established.
- **Evidence:** PERFORMANCE_BLUEPRINT.md defines the protocol and approved CWV thresholds but states no baseline is established.
- **Gap:** Actual assembled Preview URL, representative route/device matrix, repeated Lighthouse runs, raw reports, network traces, bundle/asset measurements and field-data availability are missing.
- **Owner role:** Development supplies artifact and measurements; QA verifies; Project Owner accepts exceptions.
- **Dependencies:** R-017 closure and accessible assembled Preview URL.
- **Closure evidence:** At least three comparable lab runs per selected route/profile with median and spread; commit, URL, date, region, browser/tool version, viewport and throttling recorded; lab and field results separated; mobile/desktop p75 reported only when sufficient field data exists.
- **Approved thresholds only:** LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1. Do not invent Lighthouse score, TTFB, bundle, API, concurrency or SLA targets.

### GAP-QA-01 — Full Core Preview acceptance matrix has not been executed

- **Priority:** P0. **Current state:** Partial.
- **Evidence:** CI validation and selected static artifact checks exist; full visual/browser/responsive/accessibility/usability acceptance is incomplete.
- **Gap:** Evidence does not yet cover every applicable QA Standard section against the actual assembled Preview and approved P0 requirements.
- **Owner role:** QA executes and records; specialists review; Project Owner performs final acceptance.
- **Dependencies:** R-016, R-017, F-009, accessible Preview URL, approved content and supported browser matrix.
- **Closure evidence:** Test cases/results in Section 5; defect IDs/severity; screenshots/logs/reports; regression results; Owner acceptance record.

### GAP-GOV-01 — Timeline and named delivery capacity are not baselined

- **Priority:** P1 / Gate 2 readiness. **Current state:** Open.
- **Evidence:** Role-responsibility model is approved, but named people, capacity and estimates are not assigned.
- **Gap:** A schedule cannot be responsibly committed without scope disposition, dependencies, owners and estimates.
- **Owner role:** Project Owner assigns accountable people; Technical Lead/Delivery proposes estimates.
- **Closure evidence:** Named role coverage or Owner-approved role consolidation; estimates with assumptions; dependency-aware milestone plan; approved schedule/budget if applicable.
- **Boundary:** Do not invent dates, effort, budget or staffing.

## 5. Minimum QA test matrix for Core Preview P0

These are test requirements, not claims that tests have run. Record PASS / FAIL / BLOCKED / NOT APPLICABLE with evidence reference, tested commit and environment.

| Test ID | Area | Test / expected result | Required evidence | Current status |
|---|---|---|---|---|
| QA-ROUTE-01 | Functional/routing | Open each approved VI/EN URL directly and refresh; correct page/language loads | URL list, browser/version, HTTP result, screenshot | PARTIAL |
| QA-I18N-01 | Localization | VI/EN switch reaches genuine equivalent; reciprocal hreflang and x-default point to VI counterpart | HTML captures and route-pair report | PARTIAL |
| QA-SEO-01 | SEO/indexation | Canonical, robots, sitemap and hreflang agree; generic blog shells are not indexable | Validator output and final HTML captures | PARTIAL |
| QA-SEO-02 | Dynamic article | Article has clean slug, article-specific initial HTML, metadata, canonical, hreflang, schema and sitemap eligibility only after readiness | Per-article HTML, route and schema tests | BLOCKED — R-016 |
| QA-PREV-01 | Preview assembly | Root / remains public homepage; SPA assets resolve under /platform/; no root collision | Final artifact inventory and HTTP smoke results | PARTIAL — CI PREV-01..06 passed |
| QA-UI-01 | Visual UI | Header, navigation, hero, service groups, footer, forms and states match approved UI baseline | Screenshots at 320/375/768/1024/1280+ | BLOCKED — R-017 |
| QA-RESP-01 | Responsive | No clipping, overlap or horizontal overflow; controls usable at required widths | Viewport screenshots and issue log | BLOCKED — R-017 |
| QA-BROWSER-01 | Compatibility | Test supported browser matrix with exact browser versions | Browser/version matrix and results | BLOCKED |
| QA-A11Y-01 | Accessibility | Keyboard flow, visible focus, landmarks/headings, labels/errors/status, contrast and reduced motion | Automated scan plus manual keyboard/screen-reader notes | BLOCKED |
| QA-FORM-01 | Inquiry/privacy | No live submission until policy/API/sender approved; accepted state only after backend confirms | API response, mail delivery, failure/retry, duplicate-submit evidence | BLOCKED — F-009 |
| QA-SEC-01 | Security | Authorization denied by default; role/customer isolation; validation, rate limits, secret/log review | Test report, scan artifacts, redacted logs | PARTIAL |
| QA-DATA-01 | Database/retention | Migration on clean test DB; rollback; 24-month expiry and approved reset events; restore purge | Migration/rollback logs and retention/restore records | BLOCKED |
| QA-PERF-01 | Performance | CWV protocol and approved thresholds; lab and field results reported separately | Lighthouse raw reports, traces, field-data availability statement | BLOCKED — baseline absent |
| QA-CONTENT-01 | Content | No fabricated proof, unsupported USP, fake pricing or public placeholders; VI/EN parity | Content checklist and Owner approval | PARTIAL |
| QA-404-01 | Error handling | Unknown route shows localized 404 and useful recovery links | Direct URL/browser capture | NOT VERIFIED |
| QA-REG-01 | Regression | Re-run impacted route, SEO, responsive, security and build tests after fixes | CI run IDs and QA regression log | PENDING |

### Test execution constraints

- Use isolated Preview or dedicated test/staging only.
- Do not load/stress test production without separate explicit authorization.
- Do not submit real personal/customer data while F-009 is blocked.
- Do not claim a test passed without retaining the result and identifying commit/environment.
- If field data is unavailable, say so; do not substitute Lighthouse lab values for p75.

## 6. Required disposition sequence

1. Project Owner/Technical Lead review this register and decide which TBD items block the exact P0 release versus may remain explicitly deferred.
2. Record P0 architecture decisions and environment responsibilities; keep deferred platform capabilities outside P0.
3. Complete the P0 threat/control profile and identify what can be tested in isolated Preview versus staging.
4. Keep dynamic articles noindex/excluded until R-016 closure evidence is complete.
5. Complete R-017 visual, browser, responsive, accessibility and usability review on the assembled artifact.
6. Keep F-009 non-submitting until privacy/consent, API, mailbox/sender and end-to-end acceptance are complete.
7. Run the approved performance protocol after a stable accessible Preview exists.
8. Update HDO-019 and BP-FV-01 with evidence; present a precise Gate 2 decision to the Project Owner.

This is a readiness plan, not authorization for unapproved implementation or production work.

## 7. Current gate decision

- Phase 0: **OPEN / NOT ACCEPTED**.
- R-016: **CRITICAL / OPEN**.
- R-017: **HIGH / OPEN**.
- F-009: **BLOCKED for live end-to-end collection**.
- Technical / Architecture / Security: **PARTIAL**.
- Performance evidence: **NOT ESTABLISHED**.
- Gate 2: **NOT APPROVED**.
- Blanket Development Authorization: **NOT GRANTED**.
- Existing bounded authorization: XC-03/R-016 and XC-10/R-017 only.
- PR #43: open and unmerged; no merge/deployment/production authority.

## 8. References

- [Master Blueprint](MASTER_BLUEPRINT.md)
- [Blueprint Cross-check](BLUEPRINT_CROSS_CHECK.md)
- [Architecture](ARCHITECTURE.md)
- [Performance Blueprint](PERFORMANCE_BLUEPRINT.md)
- [Risk Assessment](RISK_ASSESSMENT.md)
- [Implementation Roadmap](IMPLEMENTATION_ROADMAP.md)
- [HDO-019 Governance & Development Readiness](HDO-019_PROJECT_GOVERNANCE_AND_DEVELOPMENT_READINESS.md)
- [Phase 0 Final Validation](PHASE_0_FINAL_VALIDATION.md)
- [Independent QA Review XC-03 / XC-10](QA_REVIEW_XC03_XC10.md)
