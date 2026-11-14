# HOIQUANWEB — Feature Blueprint

**Status:** Phase 0 planning deliverable — draft complete, owner review required  
**Scope:** Core Preview (P0) public bilingual website  
**Primary conversion:** Consultation and quotation requests  
**Languages:** Vietnamese and English  
**Source of scope:** `docs/MASTER_BLUEPRINT.md` §2–4 and `docs/URL_MAP.md`

---

## 1. Purpose and scope boundary

This document defines the user-visible features required to accept the Core Preview. It is a requirements contract, not a statement that every feature is currently implemented or production-connected.

P0 delivers a public, multi-page, bilingual company website that allows visitors to understand the approved service groups, inspect verified project/content material when available, and submit a consultation/quotation inquiry.

### P0 includes
- Public home and about pages.
- Services overview and all seven approved service detail pages.
- Projects/portfolio only where content and publishing rights are verified.
- Knowledge/blog only when useful approved content exists.
- Contact/consultation/quotation inquiry.
- Vietnamese/English navigation and equivalent routes.
- Responsive layouts, accessible interactions and basic technical SEO.
- Required empty, loading, error, not-found and form submission states.

### Explicitly out of P0
- Advanced CMS/page builder or CMS administration workflows.
- CRM pipeline, staff task management or expanded sales automation.
- Customer portal, customer accounts or project workspace.
- Payment, invoicing, booking or checkout.
- AI chatbot, AI content automation or AI SEO operations.
- Hosting/domain provisioning and customer website deployment.
- Template marketplace purchase, package delivery or provisioning.
- Production integrations not yet selected and configured.

The existence of related code in the repository does not change this P0 boundary.

## 2. Feature register

Priority meanings:
- **P0-Must:** required for Core Preview acceptance.
- **P0-Conditional:** included only when the underlying content/configuration is real and approved.
- **P1/P2:** deferred; not part of this Preview.

| ID | Feature | Priority | Dependencies | Acceptance criteria |
|---|---|---|---|---|
| F-001 | Global navigation and site shell | P0-Must | Approved IA, route map | Header, primary navigation, footer and active/current route work on every public route; no broken internal links |
| F-002 | Vietnamese/English language switching | P0-Must | URL Map, translated content | Switch opens the equivalent language route; language state is clear; reciprocal hreflang is emitted only for genuine translated pairs |
| F-003 | Homepage | P0-Must | Confirmed brand/service facts; TBD messaging | Presents HOIQUANWEB, the seven service groups and a clear consultation CTA; contains no invented USP, proof, prices or customer claims |
| F-004 | About page | P0-Must | Owner-approved business description (TBD-002) | Uses only confirmed company facts; if facts are not approved, page remains an explicitly reviewed neutral introduction rather than invented company history |
| F-005 | Services overview | P0-Must | Seven approved service groups | All seven groups are present, distinct and link to their detail routes in both languages |
| F-006 | Seven service detail pages | P0-Must | Service scope and deliverables approved | Each page explains service scope, deliverables/process where confirmed, relevant questions and inquiry CTA; no unsupported guarantees |
| F-007 | Projects/portfolio | P0-Conditional | Verified project records and publication rights (TBD-005) | Only owner-approved projects are rendered; when none are approved, hide project claims/cards or show a neutral empty state; no fabricated metrics/logos |
| F-008 | Knowledge/blog | P0-Conditional | Editorial ownership and approved useful articles | Only published, reviewed articles appear; no placeholder articles; article routes must meet the SEO rendering requirements before indexation |
| F-009 | Consultation/quotation form + business email notification | P0-Must | Owner-supplied destination `info@hoiquanweb.io.vn`; confirmed operational handler; privacy/consent wording; configured inquiry API and email sender | Client validation works; submitting state prevents duplicate clicks; success appears only after API confirms acceptance; notification delivery is verified; failure preserves entered data and gives retry guidance; no false success |
| F-010 | Page-level SEO metadata | P0-Must | URL Map, approved page content | Unique title/description, canonical, language, robots, OG and supported structured data are emitted correctly for each eligible route |
| F-011 | Sitemap, robots and 404 behavior | P0-Must | Route/indexation policy | Sitemap contains only eligible canonical public URLs; 404 returns a not-found experience; drafts/private routes are not exposed |
| F-012 | Responsive and accessible interaction | P0-Must | UI Blueprint | Navigation, forms, controls and content work by keyboard and touch; no horizontal overflow at required viewport sizes; accessibility checks meet the documented target |
| F-013 | Performance and runtime observability baseline | P0-Must for acceptance | Accessible Preview/runtime | Measure actual page performance and Core Web Vitals where available; record test URL, device/viewport, date and findings; do not claim success without measurements |

## 3. Functional requirements and behavior

### 3.1 Navigation and localization
- Every public page must be reachable through a valid internal route.
- Language switch must map to the equivalent translated page where one exists; it must not blindly append `/en/` to arbitrary paths.
- Navigation must expose a clear current-page state and a keyboard-operable mobile menu.
- A missing translation must not create a false hreflang alternate.
- The default-language fallback for `x-default` remains subject to owner approval; the current generated Vietnamese fallback is not silently re-approved by this document.

### 3.2 Service discovery
- Services overview displays exactly the seven approved groups: Website, Software, Mobile App, Game, SEO, AI & Automation, Other Technology Services.
- Every service card links to its matching detail route.
- Service detail pages use consistent structure while preserving service-specific scope.
- Pricing is not required for P0. When pricing policy is not confirmed, use consultation/quotation CTA instead of invented price cards.

### 3.3 Projects and editorial content
- Project cards, testimonials, ratings, client logos, case-study metrics and named client references require evidence and publication permission.
- Blog listing and detail are conditional on actual reviewed articles.
- Empty catalog/content states must be intentional and useful; never populate them with fabricated content.
- Dynamic blog posts must not be considered SEO-ready until clean per-article URLs and server-rendered/prerendered/static initial HTML, metadata and sitemap inclusion are implemented.

### 3.4 Inquiry form and email notification
Minimum fields currently described by the public form contract:
- Name
- Email
- On API acceptance, notify the owner-approved business recipient using the configured email provider. The recipient address and sender/provider configuration must come from the owner/approved environment; never hardcode credentials.
- Service
- Consent
- Optional budget
- Project goals/details

Required behavior:
1. Validate required fields and email format before submission.
2. Display an explicit submitting state and disable repeat submission.
3. Submit to the configured API only when an API base is configured.
4. Show customer-facing confirmation only when the API confirms that the inquiry has been durably saved/accepted. The confirmation must not claim that the notification email was delivered or that the owner has already been notified.
5. On API/network failure, show an error and preserve form values.
6. If no API is configured, any local download/fallback must explicitly state that no server submission occurred; it must never be described as a received lead.
7. The owner approved retaining inquiry data for 24 months from the last interaction under DEC-017. The 24-month period resets when the Project Owner sends a quotation to the customer or when the customer replies (DEC-019). At expiry, the owner approved complete deletion of the customer's personal information and inquiry/request content under DEC-018. Before live collection, document the D-10 backup policy and confirm the normal backup lifecycle duration and any separate legal/operational exceptions; include the approved duration, reset events, complete-deletion rule and backup/restore behavior accurately in the privacy notice and consent wording. Existing backups may remain until their normal lifecycle expires; if restored, expired inquiry records must be deleted before normal operation resumes.
8. The owner has approved website form + business email notification as the inquiry channel (DEC-015). The destination email is `info@hoiquanweb.io.vn` (owner-supplied), and the Project Owner personally handles incoming inquiries. The 24-month retention period, reset events (Project Owner sends quotation; customer replies) and complete deletion of personal information plus inquiry/request content at expiry are approved under DEC-017/DEC-018/DEC-019. The D-10 backup handling policy is approved: backups remain until their normal lifecycle expires, and expired inquiry records must be deleted after restoration before normal operation resumes. The exact backup lifecycle duration, separate legal/operational exceptions, privacy/consent wording, API/email configuration and delivery tests remain outstanding; do not enable live submission until these prerequisites are met.
9. Treat lead persistence/API acceptance and asynchronous notification delivery as separate states. A successful API response may confirm that the lead was saved, but UI copy must not imply email delivery. Verify eventual delivery to the approved inbox independently in end-to-end QA; cover queued, not-configured, retrying and terminal-failure states without exposing internal provider details to the customer.

### 3.5 SEO and indexation
- Use `docs/URL_MAP.md` as the route inventory.
- Static route metadata must be available in initial HTML.
- Canonical is absolute and self-referencing on the approved host.
- Hreflang alternates are reciprocal and point to true translations.
- Sitemap contains eligible canonical routes only.
- Generic blog-detail shells must be noindex and excluded from sitemap until replaced by clean per-article routes. This is a required target behavior; the current generator has not yet implemented it.
- Structured data must match visible, verifiable page content. No fabricated organization address, ratings, reviews, prices or awards.

## 4. Non-functional requirements

| ID | Requirement | Acceptance evidence |
|---|---|---|
| NFR-01 | Responsive | Manual viewport checks at 320, 375, 768, 1024 and wide desktop; no unintended horizontal scroll |
| NFR-02 | Accessibility | Keyboard-only pass, visible focus, semantic headings, form labels, contrast review, reduced-motion support; target WCAG 2.1 AA |
| NFR-03 | Security | No secrets in frontend; form input validated server-side; public APIs expose published data only; no private customer content in public routes |
| NFR-04 | Performance | Measure real preview using agreed test method; record LCP, INP, CLS and payload observations; do not infer from local build |
| NFR-05 | Reliability | Graceful handling for API unavailable, empty content, 404 and submission failure |
| NFR-06 | SEO | Generated HTML, sitemap and metadata validated against URL Map; direct navigation and refresh tested on Preview |
| NFR-07 | Localization | No mixed-language navigation or untranslated system messages in a language route |
| NFR-08 | Maintainability | Route source of truth and URL Map remain synchronized; acceptance checks run in CI |

## 5. Priority and dependency gates

### Must be available before Core Preview review
- P0-Must features F-001 through F-006 and F-009 through F-013.
- F-007 and F-008 may be absent only if their empty/hidden states are intentional and the owner approves the content readiness status.
- Business/legal facts that cannot yet be confirmed remain explicitly marked TBD and must not be invented.

### Blocking decisions
- TBD-002 business description and legal identity affect About, footer and legal content.
- TBD-003 USP affects final homepage and service messaging.
- TBD-005 portfolio proof affects whether projects can be published.
- TBD-006 pricing policy affects whether any price is displayed.
- TBD-007 official brand identity affects final visual approval.
- TBD-009 support/warranty/SLA affects service claims and FAQ.
- TBD-010 target English market affects localization and keyword validation.

### External/runtime dependencies
- A configured and tested public inquiry API is required to confirm that a lead was saved. The approved email notification must also be delivered and verified for F-009 end-to-end acceptance, but delivery is an asynchronous state distinct from customer-facing lead acceptance.
- Cloudflare Worker/D1, R2 and email provider setup must be verified separately; CI/source presence is not runtime acceptance.
- A live Preview URL is required for direct-navigation, form, responsive, accessibility and performance acceptance.

## 6. Requirement traceability

| Requirement | Feature IDs | Primary document |
|---|---|---|
| Multi-page bilingual public site | F-001, F-002 | MASTER_BLUEPRINT, URL_MAP |
| Seven approved service groups | F-003, F-005, F-006 | MASTER_BLUEPRINT |
| Consultation/quotation conversion | F-009 | MASTER_BLUEPRINT, API_CONTRACT |
| SEO-first architecture | F-002, F-010, F-011 | URL_MAP, SEO_AND_DESIGN_SYSTEM |
| Responsive and accessible | F-012 | UI_BLUEPRINT |
| Preview-first and no false success | F-009, F-013 | QA_ACCEPTANCE_STANDARD, UI_BLUEPRINT |
| Scope control | All feature IDs | MASTER_BLUEPRINT, IMPLEMENTATION_ROADMAP |

## 7. QA acceptance checklist

- [ ] Each P0 route is reachable directly and through internal navigation.
- [ ] VI/EN language switch reaches the matching counterpart.
- [ ] All seven service groups appear in both languages.
- [ ] Every service detail has unique, approved content and a working inquiry CTA.
- [ ] No unapproved project, testimonial, logo, metric, price or company claim is published.
- [ ] Inquiry validation, submitting, API success and API failure are tested.
- [ ] No API acceptance means no success message.
- [ ] Metadata, canonical, hreflang, robots, OG and structured data are correct.
- [ ] Sitemap excludes blog shells, private/draft routes and non-canonical URLs.
- [ ] 404 and empty states are meaningful.
- [ ] Responsive and keyboard checks pass at required sizes.
- [ ] Preview performance and accessibility evidence is recorded.
- [ ] Runtime configuration and production readiness are reported separately from CI.

## 8. Change control

Any proposed P0 addition must include a reason, user value, dependency, risk, acceptance criteria and owner approval. Do not promote P1/P2 modules into P0 because related code already exists. Any change to a public route must update the URL Map, navigation, canonical, hreflang, sitemap, redirects and route validation together.
