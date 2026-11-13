# HOIQUANWEB — Owner Decision Review

**Status:** Core owner decisions recorded; remaining inputs and acceptance evidence are still open  
**Date:** 2026-11-13  
**Purpose:** Collect only the unresolved owner decisions that materially affect Blueprint Final or Core Preview acceptance.  
**Source of truth:** `02_PROJECT_INPUT_TEMPLATE.md`, Master Blueprint, Feature/UI/UX Blueprints and Blueprint Cross-check.

## 1. Decisions already confirmed — no need to answer again

| Field | Confirmed value |
|---|---|
| Project / brand | HOIQUANWEB |
| Main domain | `https://hoiquanweb.io.vn` |
| Website type | Multi-page service/business website |
| Languages | Vietnamese + English |
| Market direction | Vietnam + international; English-speaking markets prioritized; exact countries not selected |
| Service groups | Website; Software; Mobile App; Game; SEO; AI & Automation; Other Technology Services |
| Primary conversion | Consultation and quotation requests |
| Core Preview P0 | Public bilingual website only |
| Excluded from Core Preview | Advanced CMS, CRM, customer portal, commerce/payment, AI chatbot/content automation, hosting/domain provisioning |
| Change control | No merge, deployment, production changes or scope expansion without explicit approval |

## 2. Owner decisions required

The questions below are intentionally limited. If a fact is not known or cannot be substantiated, answer **“Chưa xác định / chưa có”**. That is a valid answer; the website will use neutral wording and will not invent a claim.

### D-01 — Business description and industry

**Project Input fields:** 00.4 Project Description; 01.3 Industry; 01.4 Business Description; 02.3 Brand Description.

**Owner decision — Approved (2026-11-13): factual business description wording approved verbatim.**

> HOIQUANWEB cung cấp dịch vụ thiết kế và phát triển website, phần mềm, ứng dụng di động, game, SEO, giải pháp AI và tự động hóa cùng các dịch vụ công nghệ liên quan. Website giới thiệu dịch vụ và tiếp nhận yêu cầu tư vấn, báo giá từ khách hàng tại Việt Nam và thị trường quốc tế.

**Approval boundary:** This approves the factual business description only. It does not approve a formal legal/industry classification, revenue model, operating model, USP, competitive claim or detailed audience persona.

**Industry classification proposal (not approved):** Công nghệ thông tin / Dịch vụ công nghệ số (website, software and digital services). The owner has not confirmed a formal industry classification.

No further approval is required for the factual business-description wording recorded above.

### D-02 — Business model and primary customer

**Project Input fields:** 01.2 Business Model; 03.1 Primary Audience; 03.3 Age Groups; 03.5 Geographic Markets; 03.7 User Intent; 03.10 User Goals.

The lead-generation conversion goal is confirmed, but it does not by itself determine whether the business model is B2B, B2C or hybrid.

**Owner decision — Approved (2026-11-13):** HOIQUANWEB serves both B2C and B2B, with the following rollout and communication priority:
1. **B2C first:** prioritize individual customers in the initial positioning, homepage messaging, content hierarchy and UX journey.
2. **B2B next:** expand the messaging and journeys for business/organizational buyers after the B2C-first work is established.

This is a sequencing decision, not an exclusion of B2B from the business scope or public website. Both segments remain valid customers.

**Still TBD:** Specific B2C personas, needs, use cases, age groups, purchasing triggers and target industries; and the detailed B2B buyer roles/company sizes. Do not invent demographic or market facts. B2B-specific expansion must not be treated as authorization to widen Core Preview P0.

### D-03 — USP and claims that may appear publicly

**Project Input fields:** 01.6 USP; 01.7 Competitive Advantages; 02.16 Trust Signals.

No verified USP, competitive advantage, customer result, award, certification, client logo, review, uptime guarantee or delivery guarantee has been approved in the current project inputs.

**Owner decision — Approved (2026-11-13):** No public USP or comparative claim for Core Preview. Use factual service descriptions only. This does not assert that the business has no differentiators; it means no USP/claim is authorized for publication until the owner supplies and approves it with supporting evidence.

Until approved, the site must not publish claims such as “best”, “leading”, “number one”, “guaranteed results”, invented years of experience, customer counts, rankings or testimonials.

### D-04 — Brand identity for the Preview

**Project Input fields:** 02.8 Logo; 02.9 Logo Design Direction; 02.10 Brand Colors; UI-001 Design Style; UI-002 Visual Tone; UI-003 Color System.

Current source code contains a blue/navy/cyan visual palette. These are code-observed tokens, not an approved official brand identity.

**Owner decision — Approved (2026-11-13):** Use the interim blue/white technology visual system for Core Preview only and retain the five existing source-observed colors as provisional design tokens:
- Primary blue: `#155EEF`
- Navy: `#0B1F3A`
- Cyan accent: `#38BDF8`
- Light surface: `#F5F8FC`
- White: `#FFFFFF`

**Approval boundary:** These tokens and the blue/white direction are approved only as an interim Core Preview system. They are not the official HOIQUANWEB brand identity. Official logo, brand guidelines, final typography and final identity approval remain TBD.

### D-05 — Inquiry handling and contact/privacy details

**Feature:** F-009 Consultation/quotation form.  
**Project Input fields:** 02.18 Contact Information; 13. Security & Compliance; relevant privacy/consent requirements.

The form must not claim that a lead has been received unless the configured backend confirms acceptance.

**Owner decision — Approved (2026-11-13):** Use the website consultation/quotation form with business email notification as the primary inquiry channel.

**Owner-provided notification destination (2026-11-13):** `info@hoiquanweb.io.vn`.

**Operational handling owner (2026-11-13):** The Project Owner will personally monitor and manage incoming consultation/quotation inquiries delivered to this inbox.

**Approval boundary:** The owner has supplied this address as the business inbox for inquiry notifications and confirmed direct personal handling. This does not verify mailbox existence/deliverability, configure an email provider/sender, or approve the final privacy notice or consent wording. The retention duration, expiry action, reset events and backup handling are recorded separately under D-07 through D-10.

**Still required before live lead collection:**
- Verify mailbox access/deliverability and configure email provider/sender (do not put credentials or API keys in project documents).
- Owner-approved privacy notice URL/text and consent wording, including data collected, purpose and retention/handling explanation.
- Configured and tested public inquiry API plus email delivery on the intended environment.
- End-to-end evidence for API acceptance, notification delivery, failure/retry behavior and duplicate-submit prevention.

Until these are available, F-009 remains blocked for live end-to-end acceptance. The Preview may show the form as an inactive/clearly non-submitting shell only if its state is explicit; it must not claim an inquiry was received.

Do not send credentials, API keys or other secrets in this document or in chat.


### D-07 — Inquiry data retention period

**Feature:** F-009 Consultation/quotation form and related lead records.  
**Project Input fields:** 13. Security & Compliance; Data Retention; privacy/consent requirements.

**Owner decision — Approved (2026-11-13):** Retain customer inquiry data for **24 months from the last interaction**.

**Approval boundary:** The 24-month duration from the last interaction, the reset events approved under D-09, and the expiry action approved under D-08 are recorded. At expiry, **delete completely the customer's personal information and the content of the inquiry/request**. Backup handling is approved under D-10: retain backups until their normal lifecycle expires and, after restoration, remove expired inquiry records before normal operation resumes. The exact backup lifecycle duration, separate legal or operational exceptions and final privacy notice/consent wording remain unspecified. Do not claim automated deletion or restore-time purge is already implemented.

**Still required before live lead collection and retention acceptance:**
- Record the D-10 backup policy accurately; confirm the backup lifecycle duration and any separate legal or operational exceptions.
- Include the approved 24-month period, approved reset events and complete-deletion rule accurately in the privacy notice and consent wording.
- Implement and test retention enforcement only after the remaining policy details are approved.

### D-08 — Action when the inquiry-data retention period expires

**Feature:** F-009 Consultation/quotation form and related lead records.  
**Related decision:** D-07 — 24 months from the last interaction.

**Owner decision — Approved (2026-11-13):** When the 24-month retention period expires, **completely delete the customer's personal information and the content of the inquiry/request**.

**Approval boundary:** This is a complete-deletion decision for the customer-identifying information and inquiry content. It does not approve retaining an anonymized copy or statistical record. Backup handling is approved under D-10: existing backups remain until their normal lifecycle expires; if restored, expired inquiry records must be deleted before normal operation resumes. The exact backup lifecycle duration and separate legal or operational exceptions remain unspecified. Do not infer immediate backup purging or implemented deletion enforcement.

**Still required:**
- Confirm the normal backup lifecycle duration and any separately justified legal or operational exceptions; apply D-10 during restore.
- Reflect the approved duration, D-09 reset events and complete-deletion action accurately in the privacy notice and consent wording.
- Implement and test deletion enforcement, including the approved scope of stored copies, after the remaining policy details are approved.

### D-09 — Events that reset the inquiry-data retention period

**Feature:** F-009 Consultation/quotation form and related lead records.  
**Related decisions:** D-07 — 24-month retention period; D-08 — complete deletion at expiry.

**Owner decision — Approved (2026-11-13):** The following events count as an interaction and reset the 24-month period:
1. The Project Owner sends a quotation to the customer.
2. The customer replies.

**Approval boundary:** This records only the two event types stated by the owner. Do not infer that other events (for example, a new inquiry, an internal note, an email open, or an unanswered outbound message other than sending a quotation) reset the period.

**Still required:** Confirm the normal backup lifecycle duration and any separate legal or operational exceptions; reflect D-10 and the approved events accurately in the privacy notice/consent wording and implement/test retention calculation and restore-time expiry enforcement.


### D-10 — Handling inquiry data in backups

**Feature:** F-009 Consultation/quotation form and related lead records.  
**Related decisions:** D-07 — 24-month retention period; D-08 — complete deletion at expiry; D-09 — approved reset events.

**Owner decision — Approved (2026-11-13):** The owner-approved backup policy under D-10 is to retain backups containing expired inquiry data until the backup's normal retention lifecycle ends; do not require immediate deletion from existing backups. If a backup is restored, reapply the inquiry-retention rules and completely delete records whose 24-month period has expired before returning the restored system to normal operation. The exact backup lifecycle duration remains TBD. This policy does not define separate legal/operational exceptions or claim that the restore-time purge is already implemented.

**Approval boundary:** This approves the backup-handling rule only. It does not set the backup lifecycle duration, approve separate legal or operational exceptions, or establish that backup expiry and restore-time deletion are implemented and tested.

**Still required:**
- Confirm/document the normal backup lifecycle duration.
- Include the approved backup handling, 24-month period, reset events and deletion behavior accurately in the privacy notice and consent wording.
- Implement and test backup lifecycle handling and the restore procedure, including deletion of expired inquiry records before restored service resumes normal operation.

### D-11 — Default language for hreflang x-default

**Feature:** Bilingual URL, canonical and hreflang policy.  
**Related document:** `URL_MAP.md`, section 3.

**Owner decision — Approved (2026-11-13):** Vietnamese (`vi`) is the default language destination for `hreflang="x-default"`.

**Implementation rule:** Every genuine VI/EN translation pair must retain reciprocal `hreflang="vi"` and `hreflang="en"` links; its `hreflang="x-default"` link points to the Vietnamese URL in that pair. This decision does not change the bilingual route structure, canonical rules or page-language content.

**Acceptance evidence:** On commit `4cb78e548e4077722dd1a2a3a107c6ca3003d293`, workflow `Validate website and API` (run 43389153063) and `Build isolated PR preview` (run 43389153166) both succeeded. The generated Preview artifact was inspected: 39 available localized route HTML files all contain VI/EN/x-default alternates; each x-default exactly matches its Vietnamese alternate, with no pair-target mismatch. The root homepage could not be inspected from that artifact because the preview assembly overwrote it with the application SPA shell; the unmodified `public-site/dist` root output still needs direct verification. This is tracked as XC-10. Do not mark complete based only on CI success.

**Approval boundary:** This approves only the default-language fallback. It does not approve changes to translation quality, route inventory, target-market localization or indexation eligibility.

### D-12 — Project role-responsibility model

**Related document:** `BLUEPRINT_CROSS_CHECK.md`, section 5.

**Owner decision — Approved (2026-11-13):** Approve the following responsibility boundaries:
- Project Owner: accountable for business decisions, scope/priority/content approval, risk acceptance and final acceptance.
- AI Planning Architect: responsible for Project Input analysis, Blueprint planning, traceability, risk documentation and review-ready planning artifacts; planning only.
- Technical Lead: technical architecture and technical decision coordination.
- Development: implementation after the applicable requirements/Blueprint are approved.
- QA: test planning/execution, defect verification, regression and acceptance evidence.
- SEO / Content: SEO strategy, content structure, language/content quality and indexation review.
- UX / UI: user journeys, interaction and interface consistency.
- Security / Operations: security, infrastructure, backups, monitoring and operational readiness.

**Approval boundary:** This approves role responsibilities only. It does not assign named people, confirm that specialist roles are staffed, authorize implementation, or approve merge/deployment. Specialist roles remain placeholders until the Project Owner assigns people or confirms an alternative arrangement. One person may cover multiple roles only if the Project Owner decides so.

## 3. Decisions that can remain TBD for the initial neutral Preview

These are required or recommended fields in the Project Input Template, but they do not all need to block a neutral public-site shell. They must remain visible as TBD and must not be silently guessed.

| Field group | Current handling |
|---|---|
| Exact international target countries | Keep Vietnam + international/English direction; country-specific SEO/legal targeting waits for confirmation. |
| Revenue targets and numerical KPIs | Do not invent targets. Agree measurement definitions first; baseline targets can be set after analytics/data availability is confirmed. |
| Primary keyword list and search intent map | Build from approved service scope and target market; validate with SEO research before treating as final. |
| Competitor set and differentiation | Not approved; research separately after audience and positioning are confirmed. |
| Social profiles, phone, address, legal entity details | Publish only owner-provided, verified information. |
| Production hosting, database and infrastructure | Existing repository code/Preview configuration is an observation, not production approval. |
| Performance thresholds | Record actual measurements; agree project-specific targets before final QA sign-off. |
| Timeline and budget | Do not baseline until scope, owners and dependencies are confirmed. |

## 4. Proposed disposition after owner response

1. Update only the relevant Project Input fields and Master Blueprint decisions.
2. Update homepage/service messaging and UI direction only from approved facts.
3. Keep unapproved claims and unsupported portfolio/trust content hidden.
4. Close or explicitly retain each related risk with evidence.
5. Re-run the 19-module cross-check and prepare **Blueprint Final — Owner Approval**.
6. Do not begin implementation expansion, merge or deployment until the required Blueprint approval is recorded.

## 5. Owner response format

Reply in normal text using the decision IDs; short answers are sufficient:

- D-01: Approve / edit / replace.
- D-02: **Approved — B2C first, then B2B** (2026-11-13); both remain in scope. Detailed personas and demographics remain TBD.
- D-03: No public USP/comparative claim for Core Preview; use factual service descriptions only (owner-approved 2026-11-13).
- D-04: Interim blue/white system and five provisional tokens approved for Core Preview only (2026-11-13); official identity remains TBD.
- D-05: Website form + business email notification approved (2026-11-13); destination `info@hoiquanweb.io.vn` supplied and Project Owner confirmed as direct handler (2026-11-13). The 24-month inquiry-data retention period, complete deletion of personal information plus inquiry content at expiry, the two reset events (Project Owner sends a quotation; customer replies), and backup handling under D-10 are approved under D-07 through D-10. The exact backup lifecycle duration, any separate legal/operational exceptions, privacy/consent wording, mailbox verification, backend/email configuration and end-to-end acceptance remain outstanding.
- D-11: Vietnamese (`vi`) approved as the default destination for `hreflang="x-default"` (2026-11-13). Keep reciprocal VI/EN alternates; verify generated HTML and Preview behavior.\n- D-12: Project role-responsibility model approved (2026-11-13); role boundaries only, no named staffing assignments.

Partial answers are acceptable. Any unanswered item remains **TBD** and is not treated as approved.
