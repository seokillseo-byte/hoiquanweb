# HDO-019 — Project Governance & Development Readiness

**Document status:** Draft — For Project Owner Review  
**Planning phase:** Phase 0 — Requirements & Blueprint  
**Repository:** `seokillseo-byte/hoiquanweb`  
**Working branch:** `docs/phase-0-master-blueprint-risk-review`  
**Related PR:** [#43](https://github.com/seokillseo-byte/hoiquanweb/pull/43)  
**Last evidence check:** 2026-11-13

> This document consolidates the current governance and readiness evidence. It is not an approval record. Gate 2, Development Authorization, merge and deployment remain unapproved unless the Project Owner records a separate explicit decision.

---

## 1. Purpose

HDO-019 defines the governance controls and evidence required to decide whether HOIQUANWEB may move from Phase 0 planning into the next authorized development stage.

It must:
- Preserve the approved Core Preview P0 boundary.
- Separate business decisions, planning documents, source-code observations, CI results, runtime acceptance and production approval.
- Identify open decisions, risks, dependencies and accountable roles.
- Define evidence required before Gate 2 can be presented for approval.
- Prevent implementation, merge or deployment from being inferred from a green CI run or an existing repository feature.

## 2. Authoritative project baseline

Apply the source hierarchy in `MASTER_BLUEPRINT.md`:
1. Explicit Project Owner decisions.
2. Owner-confirmed Project Input.
3. Approved Blueprint and specialist specifications.
4. Repository evidence, used only to describe current implementation and workflow state.
5. AI proposals, which must remain labelled as proposals until approved.

### 2.1 Approved project decisions

The following decisions are recorded in `MASTER_BLUEPRINT.md` and `OWNER_DECISION_REVIEW.md`:
- HOIQUANWEB; domain `hoiquanweb.io.vn`.
- Multi-page business/service website, Vietnamese and English.
- Vietnam and international market direction; English-speaking markets prioritized, exact countries TBD.
- Primary conversion: consultation and quotation requests.
- Seven service groups: Website; Software; Mobile App; Game; SEO; AI & Automation; Other Technology Services.
- Both B2C and B2B are in scope; B2C first, B2B next.
- No public USP or comparative claim is approved for Core Preview.
- Interim blue/white visual system and five provisional tokens are approved for Core Preview only; this is not final brand identity.
- Inquiry channel: website form plus business email notification; destination `info@hoiquanweb.io.vn`; Project Owner directly handles incoming inquiries.
- Inquiry retention: 24 months from last interaction; approved reset events are Project Owner sends a quotation or customer replies; personal information and inquiry/request content are completely deleted at expiry. Existing backups follow their normal lifecycle; after restore, expired inquiry records must be deleted before normal operation resumes.
- Vietnamese is the `hreflang="x-default"` destination for genuine VI/EN pairs.
- Core Web Vitals thresholds: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1; field p75 separately for mobile and desktop where data is available.

These decisions do not imply that the related runtime controls, privacy copy, email delivery, backup lifecycle or performance measurements have already been implemented or accepted.

### 2.2 Core Preview P0 boundary

Core Preview is the public bilingual website only: homepage, about, services and seven service groups, conditional portfolio/blog content, inquiry/contact, legal/privacy content, responsive behavior, SEO fundamentals and public error/empty states.

Unless separately approved, the following remain outside Core Preview P0: advanced CMS/page builder, expanded CRM workflows, customer portal, payments/invoicing/booking, AI chatbot/content automation, hosting/domain provisioning and template marketplace provisioning/checkout.

Existing code or a later roadmap phase does not promote these modules into P0.

## 3. Governance and authority

The Project Owner approved the role-responsibility model recorded in `BLUEPRINT_CROSS_CHECK.md`. It defines role boundaries, not named staffing assignments.

| Role | Accountability | Authority boundary |
|---|---|---|
| Project Owner | Business decisions, scope, priority, factual content, risk acceptance and final acceptance | Approves Blueprint, gate transitions, scope changes, merge and deployment |
| AI Planning Architect | Project Input analysis, Blueprint, traceability, risk and review-ready planning | Planning only; cannot approve on behalf of the Owner |
| Technical Lead | Architecture and technical decision coordination | Proposes and documents; Owner approval required for material scope/cost/risk/production decisions |
| Development | Implements approved requirements and architecture | Starts only after applicable authorization; supplies implementation evidence |
| QA | Test planning/execution, defect verification, regression and acceptance evidence | Reports pass/fail/blockers; does not replace Owner acceptance |
| SEO / Content | SEO strategy, content structure, language quality and indexation review | Publishes only approved factual content |
| UX / UI | User journeys, interaction and interface consistency | Works within approved scope and brand decisions |
| Security / Operations | Security, infrastructure, backups, monitoring and operational readiness | No production rollout without approved architecture, access and authorization |

No named specialist staffing roster is recorded. Do not represent role placeholders as staffed resources.

## 4. Gate register

### Gate 1 — Planning baseline

**Recorded status:** Complete in the project handoff context.  
**Interpretation:** The planning baseline and approved decision set have been established sufficiently to continue preparing governance/readiness evidence. This is not final approval of every Blueprint module or production architecture.

### Gate 2 — Project Governance & Development Readiness

**Status:** Not approved.  
**Development Authorization:** Not granted by this document.

Gate 2 may be submitted to the Project Owner only after the evidence register in section 5 is reviewed and all blockers are either resolved or explicitly accepted by the Owner with documented scope and risk consequences.

A Gate 2 approval must identify:
- The exact scope and phase authorized.
- The approved requirement/Blueprint revision and repository commit/branch.
- The work packages authorized and excluded.
- The accountable delivery and QA roles/people.
- The acceptance criteria and required evidence.
- The permitted environment (local, isolated Preview, staging or production).
- Explicit exclusions for merge, deployment, production configuration or data changes unless separately approved.

A generic “continue” instruction must not be interpreted as permission to bypass a failed gate, broaden P0 or deploy Production.

## 5. Readiness evidence register

| ID | Readiness condition | Current evidence/status | Required disposition before Gate 2 |
|---|---|---|---|
| GOV-01 | Project scope and release boundary | Master Blueprint defines bilingual public Core Preview P0 and deferred platform modules | Owner review of the complete P0 Blueprint and any remaining scope conflicts |
| GOV-02 | Project Input completeness | `PROJECT_INPUT_TRACEABILITY.md` maps 55 fields labelled Required; several critical fields remain TBD/partial | Owner must approve critical values or explicitly record why each may remain non-blocking for the exact authorized phase |
| GOV-03 | 19 Blueprint modules | Cross-check exists; several modules are partial, not started, deferred or pending | Review each module and record approval, deferral or blocker; draft existence is not acceptance |
| GOV-04 | Feature/UI/UX acceptance | Feature, UI and UX Blueprints exist as drafts/baselines; owner review remains required | Record explicit Owner acceptance of the applicable Core Preview specifications |
| GOV-05 | Business/content integrity | Factual description and service groups approved; USP, case studies, prices, proof and several business details remain unapproved/TBD | Confirm all public copy uses approved facts; exclude unsupported claims and fabricated proof |
| GOV-06 | Inquiry/privacy readiness | Channel and recipient approved; privacy/consent wording, mailbox verification, API/email configuration and end-to-end delivery evidence remain open | Keep live form inactive until prerequisites are approved/configured; verify API save, notification, retries, duplicates and failure states |
| GOV-07 | Retention and backup policy | 24-month duration, reset events, deletion action and restore policy approved; backup lifecycle duration and separate legal/operational exceptions remain TBD | Document remaining policy boundaries; do not claim automated expiry deletion or restore purge until implemented and tested |
| GOV-08 | SEO/indexation | XC-03 implementation and CI evidence recorded; R-016 remains Critical because dynamic articles lack clean-slug/article-specific initial HTML | Independent QA of current guard; keep dynamic articles non-indexable until full article readiness gate is delivered |
| GOV-09 | Preview assembly | XC-10 implementation and CI evidence recorded; R-017 remains High pending independent QA | Independently inspect the final assembled artifact and record acceptance; CI alone is insufficient |
| GOV-10 | Security and authorization | PR #42 remains open; code review reported no major issues on reviewed head, but PR is not merged or runtime-accepted | Complete required security/QA review, resolve all findings and obtain the applicable Owner decision before merge |
| GOV-11 | Technical/staging architecture | Worker/D1/R2 runtime and staging acceptance are not evidenced; production identifiers/configuration and ownership remain incomplete | Define and approve the exact environment/topology and evidence needed for the authorized phase; no production assumptions |
| GOV-12 | Performance | CWV thresholds approved; actual measurements are pending; other targets remain TBD | Measure the corrected Preview with reproducible route/device evidence and report field versus lab data distinctly |
| GOV-13 | QA/acceptance profile | QA evidence and handoff exist for specific development packages; complete independent Core Preview acceptance is not recorded | Approve the applicable QA plan, severity rules, test matrix, evidence retention and defect disposition |
| GOV-14 | Ownership and capacity | Responsibility boundaries approved; named specialist staffing is not confirmed | Owner assigns named people or explicitly accepts a documented consolidated responsibility model |
| GOV-15 | Timeline and budget | Not baselined | Do not invent dates/costs; establish only after scope, owners, dependencies and capacity are accepted |
| GOV-16 | Release and change control | PRs and workflow evidence exist; production release remains unapproved | Preserve separate approvals for merge, staging rollout, production deployment, secrets, database migrations and infrastructure changes |

## 6. Repository and delivery status snapshot

This section records repository observations only. It does not approve the underlying features or release them to users.

### 6.1 Relevant merged pull requests

The repository review recorded PR #30–#36 as merged. PR #40 (durable lead email outbox/retries) is also merged.

### 6.2 Open pull requests

- **PR #42 — authorization and membership revocation:** open, not merged. Its latest recorded code review did not report major issues after a last-owner protection finding was addressed. This is not equivalent to independent QA acceptance or Owner merge approval.
- **PR #43 — Phase 0 Blueprint/risk review and bounded XC-03/XC-10 work:** open, not merged. The current head is `9b914ce06a1ab856223feba61a364b4395e2df07` at the time of this readiness review. The two PR-triggered workflows associated with that head reported success in the last retrieved status. Confirm current head and CI again before any later gate decision.

### 6.3 XC-03 / R-016 and XC-10 / R-017

- XC-03: generic blog shells emit `noindex,follow` and are excluded from sitemap; generated route and sitemap eligibility are separated. CI evidence records 40 localized HTML routes, 36 indexable and 4 noindex, with SEO-IX-01..07 passing. Dynamic published articles still lack clean-slug URLs and article-specific initial HTML. R-016 remains Critical and open.
- XC-10: the public Vietnamese homepage remains at Preview root; SPA is isolated under `/platform/`; final assembled artifact checks PREV-01..06 passed. This was an isolated CI artifact, not a public hosted Preview URL. Independent QA remains pending and R-017 remains open.

### 6.4 Release restrictions

- PR #42 and PR #43 remain unmerged.
- No production deployment is authorized by this document.
- Do not change production Pages workflow, production secrets, Cloudflare resources, D1 schema/migrations, R2 buckets or infrastructure without separate approval.
- A downloadable/local static Preview artifact is not a live runtime acceptance environment.

## 7. Risk governance

The current Risk Assessment records 17 risks. At minimum, preserve the following open or residual conditions:
- R-001/R-002: detailed audience and evidence-backed positioning remain incomplete.
- R-010: Worker/D1/R2 staging/production runtime not accepted.
- R-011: scope expansion risk; maintain strict Core Preview P0 boundary.
- R-016: Critical dynamic blog/article SEO readiness gap.
- R-017: High Preview assembly remediation awaiting independent QA.

For every High/Critical risk, retain:
1. A named accountable owner or an explicit role placeholder awaiting assignment.
2. Likelihood/impact rationale.
3. Mitigation and evidence.
4. Residual risk and user impact.
5. Owner acceptance where the risk is intentionally carried forward.

A risk is not closed merely because code was added or CI passed.

## 8. Change, review and release controls

1. Every change must trace to an approved requirement, decision or explicitly authorized remediation.
2. Record the exact work package, files, tests and commit.
3. Changes outside the authorized scope stop for Owner review.
4. Development completion, QA acceptance, merge approval and deployment approval are separate decisions.
5. Merge requires review, CI, acceptance evidence and explicit Owner approval.
6. Staging rollout requires environment-specific authorization and rollback/monitoring readiness.
7. Production deployment requires separate explicit approval, verified secrets/configuration, database migration plan, backup/restore readiness, security review, monitoring and rollback plan.
8. Never put credentials, API keys or private customer data in repository documents or review comments.

## 9. Gate 2 submission checklist

The Project Owner and responsible reviewers should record each item as **Accepted**, **Rejected**, **Blocked** or **Not applicable with reason**:

- [ ] Exact next-phase scope and excluded scope approved.
- [ ] Applicable Blueprint revisions reviewed and accepted.
- [ ] Critical Project Input fields resolved or explicitly accepted as non-blocking for the approved scope.
- [ ] Requirement-to-feature-to-test traceability complete for the authorized work.
- [ ] Technical architecture and environment boundary accepted for the authorized phase.
- [ ] Security, privacy, data retention and backup controls reviewed.
- [ ] QA plan, acceptance criteria, severity rules and evidence requirements accepted.
- [ ] High/Critical risks mitigated or explicitly accepted by the Owner.
- [ ] Named delivery/QA/operations responsibilities assigned or consolidated by Owner decision.
- [ ] Timeline, capacity and budget accepted, or explicitly excluded from the current authorization.
- [ ] Exact branch/commit and permitted actions recorded.
- [ ] Separate merge/deployment/production restrictions acknowledged.

**Gate 2 decision:** Not yet submitted for approval.  
**Decision owner:** Project Owner.  
**Decision date:** Pending.  
**Authorized scope/commit:** Pending.  
**Development Authorization:** Not granted.

## 10. Phase 0 / Gate 2 exit decision

Current evidence supports continuing the planning and readiness review, but does not support declaring Phase 0 complete or Gate 2 approved.

The following remain open: owner review of draft Blueprints; critical Project Input disposition; inquiry privacy/runtime readiness; independent QA for R-016/R-017; security acceptance for PR #42; staging architecture/runtime evidence; performance measurements; named staffing/capacity; and final validation.

The next authorized activity is to close or formally disposition these readiness items and present a precise Gate 2 decision to the Project Owner. Do not start unrelated feature development, merge either open PR or deploy an environment as a consequence of this document.

---

## 11. Evidence links

- [Master Blueprint](MASTER_BLUEPRINT.md)
- [Project Input Traceability](PROJECT_INPUT_TRACEABILITY.md)
- [Blueprint Cross-check — 19 modules](BLUEPRINT_CROSS_CHECK.md)
- [Owner Decision Review](OWNER_DECISION_REVIEW.md)
- [Implementation Roadmap](IMPLEMENTATION_ROADMAP.md)
- [Risk Assessment](RISK_ASSESSMENT.md)
- [Feature Blueprint](FEATURE_BLUEPRINT.md)
- [UI Blueprint](UI_BLUEPRINT.md)
- [UX Blueprint](UX_BLUEPRINT.md)
- [Performance Blueprint](PERFORMANCE_BLUEPRINT.md)
- [Development Report XC-03 / XC-10](DEVELOPMENT_REPORT_XC03_XC10.md)
- [Development Handoff XC-03 / XC-10](DEVELOPMENT_HANDOFF_XC03_XC10.md)
- [PR #42 — Security and authorization](https://github.com/seokillseo-byte/hoiquanweb/pull/42)
- [PR #43 — Phase 0 planning and bounded remediation](https://github.com/seokillseo-byte/hoiquanweb/pull/43)
