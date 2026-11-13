# HOIQUANWEB — Executive Summary Blueprint

**Document status:** Executive summary draft — Project Owner review required  
**Planning phase:** Phase 0 — Requirements & Blueprint  
**Project domain:** `hoiquanweb.io.vn`  
**Languages:** Vietnamese / English  
**Primary conversion:** Consultation and quotation request

---

## 1. Project overview

HOIQUANWEB is planned as a bilingual, multi-page business/service website introducing the business's technology services and receiving consultation and quotation requests from customers in Vietnam and international markets.

**Owner-approved factual business description:**

> HOIQUANWEB cung cấp dịch vụ thiết kế và phát triển website, phần mềm, ứng dụng di động, game, SEO, giải pháp AI và tự động hóa cùng các dịch vụ công nghệ liên quan. Website giới thiệu dịch vụ và tiếp nhận yêu cầu tư vấn, báo giá từ khách hàng tại Việt Nam và thị trường quốc tế.

This wording is factual and does not establish a formal legal industry classification, revenue model, USP or competitive advantage.

## 2. Confirmed business and audience direction

- Customer scope includes both B2C and B2B.
- Initial communication and UX priority is B2C; B2B expansion follows.
- Markets include Vietnam and international customers; English-speaking markets are prioritized, but exact countries remain TBD.
- Required languages are Vietnamese and English.
- The seven service groups are Website, Software, Mobile App, Game, SEO, AI & Automation and Other Technology Services.
- Primary website conversion is a consultation/quotation request.

## 3. Core Preview P0 scope

The current P0 target is a public bilingual website, including:
- Homepage and About.
- Service overview and seven service-group entry points/details.
- Portfolio only where real content and publication rights are confirmed.
- Knowledge/blog only where approved content and indexation readiness exist.
- Contact/consultation/quotation journey.
- VI/EN navigation and localized metadata.
- Responsive behavior and SEO technical foundations.
- Truthful form states; no success claim without server-confirmed acceptance.

Advanced CMS, CRM, customer portal, commerce/payment, AI chatbot/content automation, hosting/domain provisioning and other platform features are outside Core Preview unless separately approved.

## 4. Brand and public-claim boundaries

- Interim blue/white visual system and five provisional color tokens are approved for Core Preview only under DEC-014; they are not the final official brand identity.
- Official logo, legal entity identity, brand story, mission, vision, values, personality, voice, final typography and full brand guideline remain TBD.
- No public USP or comparative claim is approved for Core Preview under DEC-013.
- Do not invent pricing, credentials, customers, testimonials, awards, case studies, results, guarantees, SLA or company history.

## 5. SEO, performance and inquiry controls

- SEO-first architecture is an approved direction; actual keyword research and content evidence remain pending.
- hreflang x-default uses Vietnamese for genuine VI/EN pairs under DEC-021.
- Core Web Vitals thresholds under DEC-022: LCP ≤ 2.5s, INP ≤ 200ms and CLS ≤ 0.1 at field p75, evaluated separately for mobile and desktop where data is available. Measurement evidence remains pending.
- Inquiry notification destination is `info@hoiquanweb.io.vn`; the Project Owner is the stated handler. Mailbox delivery is not verified.
- Inquiry activation remains gated by privacy/consent approval, API/storage, sender configuration, mailbox verification and end-to-end QA.
- Inquiry retention is 24 months from last interaction, with reset events and expiry/backup handling governed by DEC-017 to DEC-020.

## 6. Current planning and delivery status

- Master Blueprint, Business Blueprint, Brand Blueprint, Competitor Blueprint, Marketing Blueprint, SEO Blueprint and Content Blueprint have draft planning documents.
- UX, UI and Feature Blueprints have draft specifications; Technical, Architecture, Performance and Security planning/acceptance remains partial.
- Development work on PR #43 is bounded to the previously authorized XC-03/R-016 and XC-10/R-017 scope. R-016 retains the dynamic article rendering/indexation gap; R-017 retains visual/browser/responsive acceptance work.
- PR #43 is open and unmerged. No merge, production deployment or production infrastructure change is authorized.
- CI and QA results must be checked against the current PR head; older green runs are not proof for newer commits.

## 7. Critical open decisions and blockers

1. Formal industry and legal business identity.
2. Operating and revenue model, pricing and quotation policy.
3. Detailed service scope/deliverables for all seven groups.
4. Detailed B2C personas; later B2B buyer roles and organization profile.
5. Exact target English-speaking countries.
6. Official logo and final brand system.
7. Approved portfolio/trust evidence and publication rights.
8. Inquiry privacy/consent wording, API/sender/mailbox configuration and runtime acceptance.
9. Dynamic published blog article clean-slug and article-specific initial HTML readiness (R-016).
10. Full assembled Preview visual, browser, responsive and Owner acceptance (R-017).
11. Production hosting/runtime decisions and field performance evidence.

## 8. Phase 0 exit conditions

Phase 0 is not complete until the 19 mandatory Blueprint modules and required inputs are reconciled, critical gaps are resolved or explicitly accepted as non-blocking, all P0 requirements have traceable QA evidence, open risks have documented disposition, and the Project Owner formally accepts the phase.

A draft document, static artifact check or green CI run alone does not constitute final acceptance.

---

## Deliverable record

| ID | Deliverable | Objective | Priority | User/stakeholder | Dependencies | Acceptance criteria |
|---|---|---|---|---|---|---|
| BP-EXEC-01 | Executive Summary | Provide a concise source-grounded view of scope, decisions, blockers and exit criteria | Planning prerequisite | Project Owner and all project roles | Business, Brand, SEO, Content, UX/UI, Technical, Risk and QA modules | Every statement traces to an approved decision or linked project evidence; TBDs remain explicit; Owner review recorded |

**Implementation notes:** Keep this document synchronized with Master Blueprint and Cross-check; update only when a decision or evidence changes.

**Quality checklist:** [ ] Facts traceable [ ] Scope boundary clear [ ] Open inputs visible [ ] No invented claims [ ] Current PR/QA status verified [ ] Owner acceptance recorded.

**Current acceptance status:** Draft for Project Owner review; not Phase 0 approval.
