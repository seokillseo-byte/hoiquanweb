# HOIQUANWEB — Owner Decision Review

**Status:** Awaiting Project Owner decisions  
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

**Proposed neutral wording for approval (not yet approved):**

> HOIQUANWEB cung cấp dịch vụ thiết kế và phát triển website, phần mềm, ứng dụng di động, game, SEO, giải pháp AI và tự động hóa cùng các dịch vụ công nghệ liên quan. Website giới thiệu dịch vụ và tiếp nhận yêu cầu tư vấn, báo giá từ khách hàng tại Việt Nam và thị trường quốc tế.

**Please confirm:**
- [ ] Approve this wording as the factual business description.
- [ ] Approve with edits (provide the corrected wording).
- [ ] Not accurate; provide a replacement description.

**Industry classification proposal:** Công nghệ thông tin / Dịch vụ công nghệ số (website, software and digital services). This is a proposed classification, not an approved industry fact.

### D-02 — Business model and primary customer

**Project Input fields:** 01.2 Business Model; 03.1 Primary Audience; 03.3 Age Groups; 03.5 Geographic Markets; 03.7 User Intent; 03.10 User Goals.

The lead-generation conversion goal is confirmed, but it does not by itself determine whether the business model is B2B, B2C or hybrid.

**Please confirm the main customer type:**
- [ ] B2B — businesses/organizations buying services.
- [ ] B2C — individual customers buying services.
- [ ] Both B2B and B2C.
- [ ] Other — specify.

**Please identify the primary audience in one sentence:** e.g. “SMEs looking for website and software development” is only an example, not a pre-filled assumption.

**Age groups:** If the primary audience is an organization/business, confirm “Not applicable — organizational buyers” rather than inventing age demographics.

### D-03 — USP and claims that may appear publicly

**Project Input fields:** 01.6 USP; 01.7 Competitive Advantages; 02.16 Trust Signals.

No verified USP, competitive advantage, customer result, award, certification, client logo, review, uptime guarantee or delivery guarantee has been approved in the current project inputs.

**Please choose:**
- [ ] No public USP or comparative claim for the Preview; use factual service descriptions only.
- [ ] I will provide a specific USP and evidence.
- [ ] Use the following approved claim(s), with supporting evidence/source: ______.

Until approved, the site must not publish claims such as “best”, “leading”, “number one”, “guaranteed results”, invented years of experience, customer counts, rankings or testimonials.

### D-04 — Brand identity for the Preview

**Project Input fields:** 02.8 Logo; 02.9 Logo Design Direction; 02.10 Brand Colors; UI-001 Design Style; UI-002 Visual Tone; UI-003 Color System.

Current source code contains a blue/navy/cyan visual palette. These are code-observed tokens, not an approved official brand identity.

**Please choose one path:**
- [ ] Approve an interim blue/white technology visual system for Core Preview only. It does not become the official brand identity.
- [ ] I will provide an official logo and brand guideline; keep final visual approval pending.
- [ ] Create a new logo/brand identity as a separate approved scope before final UI sign-off.

If approving an interim palette, confirm whether the existing source-observed colors may be retained as provisional tokens:
- Primary blue: `#155EEF`
- Navy: `#0B1F3A`
- Cyan accent: `#38BDF8`
- Light surface: `#F5F8FC`
- White: `#FFFFFF`

### D-05 — Inquiry handling and contact/privacy details

**Feature:** F-009 Consultation/quotation form.  
**Project Input fields:** 02.18 Contact Information; 13. Security & Compliance; relevant privacy/consent requirements.

The form must not claim that a lead has been received unless the configured backend confirms acceptance.

**Please confirm the intended primary inquiry channel:**
- [ ] Website form only (backend endpoint must be configured and tested).
- [ ] Website form plus business email notification.
- [ ] Website form plus another channel (specify: ______).
- [ ] Do not activate lead submission in Preview; show approved contact information only.

**Required owner-provided information before real lead collection:**
- Business contact email or other approved contact channel.
- Approved privacy notice and consent wording describing what data is collected and why.
- Confirmation of who receives and handles inquiries.

Do not send credentials, API keys or other secrets in this document or in chat.

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
- D-02: B2B / B2C / both / other; primary audience: ...
- D-03: No USP claim for Preview / provide claim + evidence.
- D-04: Interim blue/white / provide brand guideline / separate brand project.
- D-05: Form only / form + email / other / no lead submission; approved contact/privacy details to follow.

Partial answers are acceptable. Any unanswered item remains **TBD** and is not treated as approved.
