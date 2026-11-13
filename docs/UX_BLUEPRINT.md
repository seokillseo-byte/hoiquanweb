# HOIQUANWEB — UX Blueprint

**Status:** Phase 0 UX specification — draft complete, owner review required  
**Scope:** Public bilingual Core Preview  
**Primary user outcome:** Understand relevant services and submit a consultation/quotation request  
**Audience priority:** B2C first, then B2B (owner-approved 2026-11-13)  
**Personas:** Detailed profiles remain TBD; do not invent demographics or needs

---

## 1. UX objective

The public website must help a visitor move from discovering HOIQUANWEB to understanding the seven approved service groups and deciding whether to request consultation or a quotation.

This document defines a B2C-first baseline journey, followed by planned B2B expansion, without inventing demographic personas, company sizes, industries, budgets or customer pain points. The owner has confirmed that both B2C and B2B are in scope, with individual customers prioritized first. Detailed audience research remains TBD.

## 2. Users and assumptions

### 2.1 Confirmed user contexts
- **First priority — B2C:** individual customer exploring a technology service and considering consultation/quotation.
- **Next priority — B2B:** business/organizational buyer exploring services for an organization.
- Visitor reading the website in Vietnamese or English.
- Visitor exploring one or more of the seven approved service groups.
- Visitor who wants to contact the business for consultation/quotation.

The B2C-first order controls content emphasis and UX prioritization; it does not exclude B2B visitors from the public website.

### 2.2 Not yet confirmed
- Specific B2C persona, age range, needs, use cases and purchasing triggers.
- B2B company-size weighting (startup, SME, enterprise) and detailed individual customer segments.
- Buyer roles (owner, marketing, IT, product, procurement).
- Typical project size, budget range and decision cycle.
- Main objections, urgency and buying triggers.
- Priority English-speaking countries and localization conventions.

Do not turn these unknowns into persona facts. Design the first content/UX pass for B2C as the approved priority, while retaining a clear path for B2B visitors. Validate detailed needs through owner input, real inquiry data and customer research.

### 2.3 B2C-first homepage content hierarchy

Apply the owner-approved B2C-first sequence to the initial homepage without inventing a detailed persona or narrowing the approved seven-service scope.

1. **Factual introduction:** identify HOIQUANWEB and use the exact owner-approved business description; do not add an unapproved USP, comparative claim, history, credential or performance promise.
2. **Primary consultation path:** make consultation/quotation the clearest primary action. Until the inquiry API, privacy/consent and email delivery are accepted, the form must remain explicitly inactive/non-submitting and must not imply a request was received.
3. **Seven service groups:** present Website, Software, Mobile App, Game, SEO Website, AI & Automation, and Other Technology Services as distinct discoverable choices. Use plain-language descriptions; do not invent prices, package inclusions, delivery estimates or guaranteed outcomes.
4. **Service exploration:** provide a clear route from each group to its service detail page and onward to consultation. Service detail content must describe only verified scope and deliverables.
5. **Factual trust information:** use only approved business/contact facts and real evidence with confirmed accuracy and publication permission. If no evidence is approved, omit the proof module.
6. **B2B continuity:** keep a clear general business/organization inquiry path and do not imply B2B is unsupported. B2B-specific positioning and journeys are a later content/UX expansion after the B2C-first baseline is established.

This is a content-order and navigation rule, not a validated persona model. The exact B2C needs, demographics, buying triggers, priority service ranking and homepage section copy remain open until supported by owner input or research.

## 3. Core visitor journey

| Stage | Visitor question / task | Required experience | Success signal | Failure / recovery |
|---|---|---|---|---|
| 1. Arrival | “What is HOIQUANWEB and can it help?” | Clear homepage introduction, language, service overview | Visitor can identify the company’s service scope | Confusing claims → simplify to confirmed facts |
| 2. Orientation | “Which service is relevant?” | Seven distinct service groups with descriptive links | Visitor opens a relevant service detail page | No suitable fit → provide general inquiry path |
| 3. Evaluation | “What is included and how does the work proceed?” | Service scope, deliverables, process and FAQ where confirmed | Visitor understands enough to ask a specific question | Missing details → explain what will be clarified during consultation; do not invent |
| 4. Trust check | “Can I verify their work or expertise?” | Approved portfolio/articles only; factual about page | Visitor can inspect real, permitted evidence | No approved evidence → omit proof module rather than fabricate |
| 5. Conversion decision | “How do I discuss my requirement?” | Repeated but non-intrusive consultation CTA | Visitor opens contact form | CTA unclear → consistent labels and destination |
| 6. Inquiry preparation | “What information should I provide?” | Short form with service selection and project details | Visitor understands required/optional fields and consent | Form too long → keep only approved minimum fields |
| 7. Submission | “Was my request received?” | Validation, submitting, accepted or failed state | Server-confirmed acceptance is communicated accurately | API unavailable/rejected → preserve values, explain failure and offer retry |
| 8. Next step | “What happens after I send it?” | Only owner-approved expectation or neutral acknowledgement | Visitor is not promised an unapproved response time/SLA | SLA unknown → do not display response-time guarantees |

## 4. Key user flows

### Flow A — Service discovery to inquiry
1. Visitor lands on Home.
2. Reads the introductory statement and sees the primary consultation CTA.
3. Opens Services overview.
4. Selects one of the seven service groups.
5. Reviews service-specific scope and deliverables.
6. Opens the inquiry form with the relevant service preselected where supported.
7. Completes required fields and consent.
8. Submits and receives a truthful server-confirmed result.

**Acceptance:** the selected service is preserved into the inquiry context; the visitor can still change it; no submission success is shown without backend acceptance.

### Flow B — Direct service landing
1. Visitor arrives from search or a shared link directly on a service detail page.
2. The page title and introduction identify the service immediately.
3. Breadcrumb/navigation provides a route back to the service overview.
4. Relevant CTA leads to the inquiry form.
5. Language switch opens the matching translation where available.

**Acceptance:** direct route and refresh work; page-specific metadata exists in initial HTML; no dependence on first visiting Home.

### Flow C — English/Vietnamese switching
1. Visitor opens a page in VI or EN.
2. Language control indicates the current language.
3. Visitor switches language.
4. Site opens the equivalent translated route, not a guessed path.
5. If no equivalent exists, the control follows an explicit fallback rule rather than generating a broken URL.

**Acceptance:** all approved route pairs map correctly; hreflang is reciprocal only for genuine equivalents.

### Flow D — Contact-first visitor
1. Visitor opens Contact directly from navigation or a CTA.
2. Reads the short explanation and required consent notice.
3. Completes name, email, service, consent and optional budget/project details.
4. Receives validation feedback without losing data.
5. On submission, receives accepted or failed state according to the API response.

**Acceptance:** keyboard and mobile form operation; duplicate submit prevention; entered values persist after failure.

### Flow E — Content-led discovery (conditional)
1. Visitor opens an approved blog article or project.
2. Content provides useful context and links to related services.
3. Visitor can navigate to a relevant service or inquiry.
4. No empty/fake project or article is presented as published content.

**Acceptance:** only approved published content appears; each indexable article has a clean URL and crawlable initial HTML before it is added to sitemap.

## 5. Information scent and navigation rules

- Keep the primary navigation concise and oriented around Home, About, Services, conditional Projects/Knowledge, Contact and language.
- The seven service groups remain visible and separately identifiable.
- Every page must provide a clear next step: explore a related service, return to the overview or inquire.
- Avoid multiple competing primary CTAs in the same viewport.
- Use consistent consultation/quotation wording in VI and EN.
- Use breadcrumbs on service detail, project detail and article detail where appropriate.
- Do not show links to empty, unpublished or inaccessible modules.
- Do not expose internal CMS/admin/customer portal navigation on the public website.

## 6. Conversion and form UX

### Form principles
- Ask only for information needed to begin a useful consultation.
- Clearly distinguish required and optional fields.
- Explain why consent is needed and link to the approved privacy policy.
- Do not require a budget if the visitor does not know it.
- Keep user-entered content when API submission fails.
- Avoid displaying unapproved response-time, guarantee or pricing promises.

### Required states
- Idle: form ready.
- Invalid: inline field-level explanation and focus to first invalid field.
- Submitting: clear progress indication; prevent duplicate submit.
- Accepted: only after server/provider confirms the request has been accepted.
- Failed: clear error, retain values, provide retry guidance.
- API not configured: explicitly state that no server-side submission occurred; local export fallback must not be confused with a received inquiry.

### Conversion measurement (future, consent-aware)
Potential events for later analytics implementation:
- `view_service_overview`
- `view_service_detail`
- `click_consultation_cta`
- `start_inquiry_form`
- `submit_inquiry_attempt`
- `inquiry_accepted`
- `inquiry_failed`

Do not add analytics or tracking until provider, consent/legal basis, retention and ownership are approved. Event names are a planning proposal, not a current implementation claim.

## 7. Content and trust UX

- Use plain language to explain technical services.
- Put service scope and deliverables before decorative claims.
- Use real examples only when publication rights and factual accuracy are confirmed.
- Do not fabricate testimonials, client logos, star ratings, company statistics, portfolio outcomes or certifications.
- Avoid unsupported claims such as guaranteed rankings, guaranteed delivery time or guaranteed business results.
- If the visitor needs a service combination, provide a general inquiry route rather than forcing an incorrect category.
- Explain technical terms where they are likely to block understanding.

## 8. Accessibility and usability

- Ensure all navigation and form flows can be completed with keyboard only.
- Keep focus visible and predictable after menu open/close, validation and route navigation.
- Provide descriptive link text; avoid repeated ambiguous “Learn more” links without context.
- Use semantic page landmarks and a logical heading hierarchy.
- Announce form status changes to assistive technology.
- Make tap targets practical on mobile and do not rely on hover.
- Maintain readable line lengths, font sizes and contrast.
- Respect reduced-motion settings.
- Test the journey on 320px, 375px, 768px, 1024px and desktop widths.

## 9. UX acceptance checklist

- [ ] A first-time visitor can identify HOIQUANWEB and its seven service groups from Home.
- [ ] Every service group has a distinct path to its detail page.
- [ ] Direct service-page entry supports clear orientation and contact.
- [ ] VI/EN switching reaches the matching route.
- [ ] Project/blog content is shown only when approved and available.
- [ ] The consultation CTA is consistent across page types.
- [ ] Form required/optional fields and consent are understandable.
- [ ] Form errors preserve entered data and success is server-confirmed.
- [ ] No unapproved response-time, warranty, pricing or performance promise is displayed.
- [ ] Keyboard, mobile and assistive-technology flows are checked.
- [ ] Usability review with actual target customers is completed once audience is confirmed.

## 10. Open decisions and validation plan

### Owner input required
- TBD-001: detailed B2C persona, needs, use cases and demographics; then detailed B2B buyer roles/company sizes.
- TBD-004: customer size, buyer roles, pain points and objections.
- TBD-010: English-speaking target markets.
- TBD-002 / TBD-003: company description and value proposition.
- TBD-009: approved next-step expectations, support and SLA.

### Validation after audience confirmation
1. Create evidence-based persona profiles from owner input and available customer research.
2. Validate top tasks, objections and service-selection language.
3. Run moderated usability checks on Home → Service → Inquiry.
4. Review form abandonment and inquiry quality only after consent-compliant analytics/data collection is configured.
5. Revise the journey and content hierarchy from observed evidence.

Until those inputs are available, this remains a B2C-first baseline UX specification and does not claim validated persona research.
