# HOIQUANWEB — Content Blueprint

**Document status:** Phase 0 planning deliverable — working draft for Project Owner review  
**Scope:** Public bilingual Core Preview (P0)  
**Markets:** Vietnam and international; English-speaking markets prioritized, exact countries TBD  
**Audience priority:** B2C first, then B2B; both remain in scope  
**Primary conversion:** Consultation and quotation request  
**Source of truth:** `MASTER_BLUEPRINT.md`, `OWNER_DECISION_REVIEW.md`, `FEATURE_BLUEPRINT.md`, `UX_BLUEPRINT.md`, `URL_MAP.md`, and Owner-supplied Website Blueprint & Design System Standard v3.0

---

## 1. Purpose and content governance

This blueprint defines the content system for the HOIQUANWEB public website: strategy, page architecture, content types, conversion path, editorial controls, media, internal linking, maintenance and measurement.

It is a planning specification. It does not mean that page copy, translations, articles, portfolio entries or inquiry functionality are complete or approved for publication.

### 1.1 Source hierarchy

1. Explicit Project Owner decisions and approved wording.
2. Approved Project Input values.
3. Approved Blueprint and design-system decisions.
4. Repository implementation, only as evidence of current behavior.
5. AI proposals, which must remain clearly marked as proposals until approved.

### 1.2 Non-negotiable content rules

- Use the exact Owner-approved factual business description in `OWNER_DECISION_REVIEW.md`; do not embellish it with unverified company history, scale, credentials or operating claims.
- Do not publish an unsupported USP, comparative claim, superlative, guarantee, customer result, testimonial, client logo, award, certification, experience duration, customer count or ranking.
- Do not invent prices, package inclusions, delivery timelines, warranties, support commitments, SLA or legal terms.
- Keep all seven approved service groups distinct. Do not merge, remove or rename a group without Owner approval.
- B2C is the first content and UX priority. B2B remains a supported audience and must not be represented as excluded.
- Vietnamese and English content must be genuinely localized. Do not treat machine-translated or empty duplicate pages as equivalent localized content.
- Use internal placeholders labelled `CONTENT REQUIRED` only during planning. Never publish placeholders, fabricated sample data or empty SEO landing pages.
- The existence of a route in the repository does not prove that its content is complete, indexable or approved.

## 2. Content strategy

### 2.1 Strategy

Build a service-led, bilingual content system that helps visitors:
1. Understand what HOIQUANWEB provides.
2. Identify the service relevant to their requirement.
3. Understand the confirmed scope and what information is needed for consultation.
4. Review genuine, approved evidence where available.
5. Submit a consultation or quotation request when the inquiry workflow is operationally accepted.

### 2.2 Audience sequencing

| Audience | Priority | Content treatment | Known limitations |
|---|---|---|---|
| B2C / individual customers | First | Lead with clear service explanations, practical outcomes only where substantiated, simple service discovery and consultation CTA | Specific personas, demographics, needs, use cases, budgets and buying triggers are TBD |
| B2B / organizations | Next | Retain access to all service information and a general inquiry path; expand dedicated business messaging after B2C-first baseline | Buyer roles, company sizes, industries, procurement needs and buying cycle are TBD |
| Vietnamese-language visitors | Core language | Vietnamese route and natural Vietnamese copy | Detailed localization glossary and keyword mapping pending |
| English-language visitors | Core language / international priority | English route with natural English copy for international visitors | Exact target countries, regional terminology and legal localization are TBD |

Do not create persona-specific claims or demographic targeting until supported by Owner input or research.

### 2.3 Content goals

- Explain all approved service groups consistently.
- Support the agreed consultation/quotation conversion.
- Establish clear page purpose and search intent for every indexable page.
- Provide a structure that can expand through useful articles and verified portfolio material.
- Maintain consistency between Vietnamese and English versions.
- Avoid thin, duplicated, misleading or unsupported content.

## 3. Content architecture

### 3.1 Core navigation and page groups

| Content group | Required content | P0 status |
|---|---|---|
| Homepage | Factual company introduction, seven service groups, primary consultation path, approved factual trust information only | P0-Must |
| About | Owner-approved business description and verified contact/business facts | P0-Must |
| Services overview | Seven distinct service groups with descriptive summaries and links | P0-Must |
| Service detail pages | One page per approved service group; verified scope, deliverables/process only where confirmed, relevant questions and inquiry CTA | P0-Must |
| Projects / portfolio | Genuine, verified and publication-authorized projects only | P0-Conditional |
| Knowledge / blog | Useful reviewed articles only; dynamic article indexation requires separate technical readiness | P0-Conditional |
| Contact / consultation | Confirmed contact details and inquiry form only when API, privacy/consent and email delivery are accepted | P0-Must, runtime conditional |
| Legal / privacy content | Accurate policy and consent text based on Owner-approved operational/legal details | Required before collecting personal inquiry data; exact final text pending |

### 3.2 Seven service groups

Use the canonical service group names in the Master Blueprint. The UX document currently uses “SEO Website” as a descriptive variant for “SEO”; retain this as a naming inconsistency to resolve in the Owner-approved terminology/glossary rather than silently changing the approved Master Blueprint label.

| ID | Canonical group | Content purpose | Required content boundary |
|---|---|---|---|
| SVC-01 | Website | Explain website design and development services | Specific platforms, technology, features, scope and delivery model require confirmation |
| SVC-02 | Software | Explain software design and development services | Do not imply particular software categories, integrations or support commitments unless verified |
| SVC-03 | Mobile App | Explain mobile application services | Supported platforms, publication, maintenance and feature scope require confirmation |
| SVC-04 | Game | Explain game development services | Game genres, engines, platforms, monetization and delivery capabilities require confirmation |
| SVC-05 | SEO | Explain SEO services | Specific SEO disciplines, methods, deliverables, reporting and performance promises require confirmation |
| SVC-06 | AI & Automation | Explain AI and automation services | Models, integrations, automation scope, data handling and accuracy claims require confirmation |
| SVC-07 | Other Technology Services | Provide a clearly bounded route for related technology requirements not represented above | Do not use as a catch-all to imply unapproved services; describe only confirmed scope |

The detail-page template must not imply that every possible technology, platform or deliverable is offered. Service-specific input is required before final commercial copy is approved.

## 4. Page content specifications

### 4.1 Homepage

Recommended content order for the B2C-first Core Preview:

1. **Hero / factual introduction:** identify HOIQUANWEB using the Owner-approved business description; primary CTA is consultation/quotation.
2. **Service discovery:** show all seven approved service groups as separate choices.
3. **How to proceed:** explain only the confirmed inquiry/consultation process; do not invent delivery stages, timelines or contractual commitments.
4. **Verified work or knowledge:** include only approved portfolio items or reviewed articles. Omit the module when no approved material exists.
5. **Factual company/contact information:** use confirmed facts only.
6. **Closing consultation CTA:** link to the accepted inquiry path or clearly identify the contact method.

This hierarchy is a content-order proposal consistent with the approved B2C-first UX direction. Exact headline, section copy, imagery and service ranking remain subject to content review and evidence.

### 4.2 About page

- Use the exact approved business description.
- Explain the listed service scope without adding unsupported company history, founding date, team size, office location, credentials or mission statements.
- Add contact or business details only when verified.
- Do not create an “Our achievements” or “Why choose us” section without approved evidence.

### 4.3 Services overview

- Present all seven service groups separately.
- Each card/section contains a concise factual summary, a link to its detail page and a relevant consultation CTA.
- Avoid generic keyword-stuffed descriptions and claims that one service is “best” or guaranteed to achieve a result.
- Use consistent naming across navigation, page titles, breadcrumbs, internal links and Vietnamese/English equivalents.

### 4.4 Service detail page template

Each service page should use the following structure, omitting any subsection whose factual content is not yet available:

1. Page title and concise factual service definition.
2. Customer requirement / problem context — only after validated research or Owner input.
3. Scope of service — explicit inclusions and exclusions, once confirmed.
4. Deliverables — only confirmed outputs.
5. Process — only verified operational steps.
6. Relevant questions / FAQ — answerable from confirmed facts.
7. Related service links — only genuinely related services.
8. Consultation/quotation CTA.

Do not publish empty headings, placeholder FAQs, invented case studies, pricing or estimated delivery times.

### 4.5 Portfolio / project page

A project may be published only when all of the following are recorded:
- Project identity and description are accurate.
- The Project Owner has approved publication.
- Rights to display customer name, logo, screenshots and other materials are confirmed.
- Metrics and outcomes have a traceable source and approved context.
- No confidential or personal information is exposed.

If no project passes these checks, hide the proof module or show a neutral state without implying a portfolio exists.

### 4.6 Knowledge / blog

Publish only useful, reviewed articles with a clear audience and search intent. Each article needs:
- A unique topic and purpose.
- Accurate, supportable information.
- A named author/editor or transparent editorial responsibility once confirmed.
- Original title, description, headings and useful body content.
- Relevant internal links and a proportionate CTA.
- A review/update date where meaningful and verifiable.
- Approved images and descriptive alternative text.

Generic blog shells and query-string-only article rendering are not publishable SEO article experiences. Dynamic published articles must have stable clean URLs, article-specific initial HTML, correct metadata/canonical/hreflang, sitemap eligibility and independent QA before indexation is enabled.

## 5. Topic clusters and editorial roadmap

### 5.1 Cluster model

The seven service groups are the initial service hubs. Supporting content should be created only after keyword research and search-intent validation. The topics below are research directions, not approved target keywords, search-volume findings or guaranteed ranking opportunities.

| Hub | Potential supporting directions for research | Publication gate |
|---|---|---|
| Website | Website planning, design considerations, development scope, maintenance questions | Confirm actual services and validate search intent |
| Software | Custom software requirements, workflow analysis, integration considerations | Confirm software scope and supported integrations |
| Mobile App | App planning, platform selection, feature planning, release considerations | Confirm platforms and delivery capabilities |
| Game | Game concept planning, platform considerations, development workflow | Confirm engines, platforms and genres actually supported |
| SEO | SEO fundamentals, technical review, content planning, measurement | Confirm deliverables and avoid ranking guarantees |
| AI & Automation | Process automation opportunities, AI integration considerations, workflow design | Confirm supported models, data boundaries and integration scope |
| Other Technology Services | Related technology requirements and selection guidance | Define the actual service before creating a landing page |

### 5.2 Pillar pages and supporting articles

- Each service detail page acts as the commercial service hub for its group.
- Supporting articles must answer a distinct informational question and link to the relevant service page when appropriate.
- Do not create multiple pages targeting the same intent without a documented reason.
- Do not generate bulk thin pages merely to increase URL count.
- A topic cluster is considered ready only after keyword mapping, intent, differentiation, internal links and editorial ownership are documented.

### 5.3 Content funnel

| Stage | Content role | Example content type | CTA |
|---|---|---|---|
| Discover | Help visitors understand a topic or requirement | Reviewed informational article | Explore relevant service |
| Evaluate | Explain the relevant service and confirmed scope | Service overview/detail page | Ask for consultation |
| Decide | Help a visitor submit a clear requirement | Contact / quotation page | Submit inquiry, only when live and accepted |
| Post-inquiry | Provide accurate follow-up information | Owner-managed communication | No automated promise until operational process is approved |

## 6. CTA and inquiry content

- Primary CTA wording should consistently communicate consultation or quotation.
- Secondary CTAs may guide visitors to a relevant service detail page or contact information.
- Do not use false urgency, countdowns, fabricated scarcity, unsupported “free” claims or guaranteed response times.
- The approved notification destination is `info@hoiquanweb.io.vn`; the Project Owner is the stated handler. Mailbox access and delivery are not yet verified.
- Do not display a form as operational until the inquiry API, privacy notice/consent, sender configuration and end-to-end notification delivery pass QA.
- A success message may appear only after the server confirms acceptance. If the form is inactive, say so clearly and provide only a verified alternative contact method.
- Inquiry data handling must follow approved decisions: 24-month retention from last interaction; reset only on Owner quotation sent or customer reply; delete personal information and inquiry content at expiry; backups follow their normal lifecycle and expired records must be removed after restore before normal operation. Exact backup lifecycle duration and final legal wording remain open.

## 7. Language and localization strategy

- Maintain Vietnamese and English route pairs only where equivalent, genuinely localized content exists.
- Translate meaning, service terminology, CTA intent and user-facing instructions naturally; do not mechanically mirror Vietnamese sentence structure.
- Keep canonical URLs self-referential and reciprocal hreflang only for genuine language pairs.
- The approved x-default destination is Vietnamese (`vi`).
- Do not publish an English route with untranslated Vietnamese copy or empty placeholder content.
- Exact target English-speaking countries and regional terminology remain TBD; do not invent country-specific legal, currency or market claims.

## 8. E-E-A-T and trust content

Use evidence, not decorative trust claims.

Permitted content:
- Owner-approved factual business description.
- Verified contact and business details.
- Real projects with publication rights.
- Articles reviewed for accuracy and editorial responsibility.
- Verifiable qualifications or certifications only after evidence and publication approval.

Not permitted without approval/evidence:
- Fake testimonials, star ratings, customer logos or partner badges.
- Invented author biographies or expert credentials.
- Unsupported experience duration, customer counts, revenue, ranking or performance metrics.
- Guarantees of rankings, traffic, revenue, security or delivery.

Author identity, editorial review roles, company credentials and portfolio evidence are open inputs.

## 9. Media and image strategy

- Use genuine, relevant, licensed or Owner-authorized images.
- Prefer real project screenshots and original diagrams only when their accuracy and publication rights are confirmed.
- Do not use AI-generated imagery to imply a real customer, real office, real team, actual project or verified result.
- Avoid generic decorative media that obscures service meaning.
- Every meaningful image needs descriptive alt text; decorative images should not create redundant screen-reader content.
- Optimize dimensions, formats and file sizes; use responsive sources and lazy loading for non-critical media.
- Video is optional and deferred unless a clear user need, production owner, caption/transcript and performance budget are defined.

## 10. Internal linking strategy

- Global navigation links to Home, About, Services, Contact and other approved public sections.
- Services overview links to all seven service detail pages.
- Each service page links to relevant sibling services only where the relationship is meaningful.
- Supporting articles link to the relevant service hub and related articles where useful.
- Breadcrumbs reflect the actual information architecture.
- Language switchers link to the equivalent localized page only when that translation exists.
- Avoid orphan pages, repeated exact-match anchor stuffing and links to draft/private routes.
- Broken links and links to non-indexable generic blog shells must be detected during QA.

## 11. Content calendar and editorial ownership

No publishing cadence or author identity has been approved. Do not invent one.

Before scheduling an article, record:
- Proposed topic and audience.
- Search intent and target page relationship.
- Evidence/research sources and fact-check owner.
- Draft owner, reviewer and final approver.
- Vietnamese/English localization owner.
- Planned publication date only after capacity and approval are confirmed.
- Review trigger/date and update responsibility.

Initial sequence:
1. Complete and approve factual core pages.
2. Complete seven service-page content briefs and obtain service-scope inputs.
3. Validate keyword research and topic clusters.
4. Prepare reviewed supporting articles only where they add distinct value.
5. Add portfolio content only when evidence and rights are approved.

## 12. Content maintenance plan

Review content when:
- A service scope, deliverable, process or contact detail changes.
- A policy, privacy statement or inquiry workflow changes.
- A technical or factual article becomes outdated.
- A project permission or evidence source changes.
- Search intent or page performance indicates a meaningful content issue.
- A translation no longer matches the approved source content.

Every substantive update should record the page, reason, editor/reviewer, evidence and date. Remove or correct inaccurate claims promptly. Do not change URLs or indexation rules without SEO impact review.

## 13. Content KPIs and measurement

No numeric business targets have been approved. Establish baselines before setting targets.

Measure, where analytics and privacy configuration are approved:
- Required core-page content completeness and factual accuracy.
- Seven-service coverage and route/link integrity.
- VI/EN translation parity and localization quality.
- Organic impressions, clicks and landing-page engagement by page/language.
- Qualified consultation/quotation inquiries, where the inquiry system is operational.
- Form completion, validation errors and confirmed server acceptance.
- Content freshness and review completion.
- Indexation eligibility, canonical/hreflang correctness and duplicate/thin-content issues.

Do not treat page views, generated route count or form button clicks as proof of qualified leads or business success. Define numeric targets only after Owner approval and baseline data.

## 14. Dependencies and unresolved inputs

| ID | Required input / dependency | Current status | Impact |
|---|---|---|---|
| C-01 | Confirmed scope, deliverables and exclusions for each of seven services | Open | Final service-page copy |
| C-02 | Specific B2C needs, use cases and buying triggers | Open; B2C-first sequence approved | Detailed messaging and content prioritization |
| C-03 | B2B buyer roles, company sizes and needs | Open; B2B retained for later expansion | B2B-specific content |
| C-04 | Exact priority English-speaking countries | Open | Localization and country-specific research |
| C-05 | Approved projects, metrics, testimonials and publication rights | Open | Portfolio and proof modules |
| C-06 | Pricing and quotation policy | Open | Pricing/package content |
| C-07 | Author/editor identity and editorial responsibility | Open | Article attribution and review governance |
| C-08 | Keyword research, search-intent validation and topic mapping | Pending | SEO content calendar |
| C-09 | Privacy notice, consent wording and inquiry runtime acceptance | Partially resolved; final text/runtime evidence open | Live lead-generation form |
| C-10 | Official logo and final brand voice/typography guidance | Interim Preview system approved; official identity open | Final content presentation |
| C-11 | Terminology decision for “SEO” vs “SEO Website” across Blueprint files | Open | Consistent naming and localization |

Unknowns must remain marked as TBD or be omitted from public copy. They must not be filled with generic AI assumptions.

## 15. Acceptance criteria

This Content Blueprint is ready for Owner review when:
- It covers all deliverables required by the Owner-supplied Content Blueprint standard.
- Its audience priority, languages, market direction and service groups trace to approved project decisions.
- Every content type has a defined purpose, publication boundary and relevant CTA.
- Topic-cluster directions are explicitly distinguished from validated keyword research.
- Content accuracy, localization, E-E-A-T, media rights, internal linking and maintenance rules are documented.
- Open inputs, dependencies and risks are explicit and traceable.
- No unsupported business claims, fabricated evidence, pricing, guarantees or operational commitments are introduced.

**Current acceptance status:** Draft for Owner review. This document does not close Phase 0, approve Gate 2, authorize additional implementation, or authorize merge/deployment.
