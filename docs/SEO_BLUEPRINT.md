# HOIQUANWEB — SEO Blueprint

**Document status:** Phase 0 planning deliverable — draft for Project Owner review  
**Scope:** Public bilingual Core Preview (P0), with scalable SEO foundations  
**Languages:** Vietnamese and English  
**Market direction:** Vietnam + international; English-speaking markets prioritized, exact countries TBD  
**Source of truth:** Owner-approved decisions, `MASTER_BLUEPRINT.md`, `URL_MAP.md`, `CONTENT_BLUEPRINT.md`, `PROJECT_INPUT_TRACEABILITY.md`, and Owner-supplied Website Blueprint & Design System Standard v3.0.

---

## 1. Purpose and governance

Define the SEO strategy and acceptance requirements for the HOIQUANWEB website, covering research, intent, mapping, information architecture, content hubs, internal links, URLs, metadata, structured data, entity/trust, technical SEO, indexation, link building and KPIs.

This is a strategy and planning document, not proof of rankings, search demand, competitive ability or completed SEO implementation. No keyword volume, difficulty, CPC, competitor ranking, backlink profile or performance result is asserted without a dated evidence source.

### 1.1 Confirmed constraints

- Website is a multi-page service website.
- Vietnamese and English are required.
- Market direction is Vietnam and international; English-speaking markets are prioritized, exact countries remain TBD.
- B2C is the first audience priority; B2B remains in scope for subsequent expansion.
- All seven approved service groups must remain represented: Website, Software, Mobile App, Game, SEO, AI & Automation, Other Technology Services.
- Primary conversion is consultation / quotation request.
- Vietnamese (`vi`) is the approved `x-default` language fallback (DEC-021).
- No unsupported USP, comparison, ranking, guarantee, client result or authority claim may be published (DEC-013).
- Generic blog shells and dynamic articles without clean URLs and article-specific initial HTML must not be indexed; R-016 remains open.
- Core Web Vitals acceptance thresholds: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 at field p75 separately for mobile and desktop where data is available; lab data is reported separately (DEC-022).

## 2. SEO objectives and scope

### 2.1 Objectives

1. Make every intended public page discoverable and technically understandable.
2. Align each indexable URL with one clear page purpose and search intent.
3. Prevent duplicate, thin, placeholder or unsupported content from entering the index.
4. Establish reciprocal language relationships for genuine Vietnamese/English page pairs.
5. Build service-led content hubs that can expand without keyword cannibalization.
6. Measure organic visibility and qualified inquiry outcomes only when the required analytics and inquiry systems are accepted.

### 2.2 Scope

| Scope | Priority | Acceptance boundary |
|---|---|---|
| Core public pages and seven service pages | P0 | Unique approved content, metadata, canonical, hreflang, indexation decision and internal links |
| VI/EN language architecture | P0 | Genuine translated pairs; reciprocal hreflang; Vietnamese x-default |
| Sitemap, robots, canonical and crawl paths | P0 | Generated output matches URL Map and indexability policy |
| Structured data and social metadata | P0 | Valid, page-appropriate and consistent with visible content |
| Blog listing/detail shell | P0 guard | Generic shells noindex and excluded from sitemap until real content is ready |
| Dynamic published articles | Blocked by R-016 | Clean slug, article-specific initial HTML and complete SEO QA required before indexation |
| Keyword research and content roadmap | Planning prerequisite | Evidence-backed research remains pending; seed topics are not validated targets |
| Link building campaigns | Deferred pending strategy/evidence | No campaign, paid link or volume commitment approved |
| Advanced SEO automation / CMS | Deferred | Requires separate scope and authorization |

## 3. SEO deliverable register

Each deliverable below has a stable ID, objective, description, priority, user/owner role and completion condition.

| ID | Deliverable | Objective and description | Priority | Primary users / accountable role | Completion condition |
|---|---|---|---|---|---|
| SEO-01 | Keyword Research | Collect query candidates by language, geography, audience and service; record source, date, volume/difficulty only when available | P0 planning | SEO Architect, Content Strategist | Evidence-backed dataset and methodology; no fabricated metrics |
| SEO-02 | Search Intent | Classify each target query/page as informational, commercial investigation, transactional or navigational where evidence supports it | P0 | SEO Architect, Content | Intent and rationale recorded per mapped page |
| SEO-03 | Keyword Mapping | Assign one primary intent/topic to each canonical URL and document secondary terms without stuffing | P0 | SEO Architect | No unexplained URL overlap or cannibalization; mapping reviewed |
| SEO-04 | Topic Cluster | Connect each service hub to distinct supporting content ideas | P0 planning | SEO Architect, Content | Cluster map with hub, child topic, intent, language and internal link plan |
| SEO-05 | Content Hub | Define service overview and seven service detail hubs | P0 | Content, UX, SEO | All seven groups represented; no thin or unsupported claims |
| SEO-06 | Internal Linking | Specify contextual links, navigation, breadcrumbs and language switcher behavior | P0 | SEO, Development, QA | Crawlable links; no orphaned approved pages or broken internal links |
| SEO-07 | URL Structure | Maintain stable, readable, language-specific clean URLs | P0 | SEO, Development | URL Map and generated routes agree; redirects documented for any change |
| SEO-08 | Information Architecture | Align navigation, page hierarchy, breadcrumbs and route relationships | P0 | UX, SEO | IA maps to actual page templates and route inventory |
| SEO-09 | Metadata Strategy | Define unique title, description, canonical, robots and social metadata by page | P0 | SEO, Development | Per-route generated HTML passes metadata validation |
| SEO-10 | Schema Strategy | Use only relevant structured data supported by visible page facts | P0 | SEO, Development, QA | Valid schema with no fabricated ratings, reviews, prices or organization facts |
| SEO-11 | Entity Strategy | Maintain consistent business/service identity and factual entity references | P0 planning | SEO, Project Owner | Verified name, description, contact and service facts; unknown properties omitted |
| SEO-12 | E-E-A-T Strategy | Govern experience, expertise, authority and trust evidence | P0 content | Project Owner, Content, SEO | Claims have evidence and publication approval; unsupported proof excluded |
| SEO-13 | Technical SEO | Validate crawlability, rendering, status codes, mobile readiness, performance and index controls | P0 | Development, SEO, QA | Direct-route and assembled-preview checks pass; blockers tracked |
| SEO-14 | Indexing Strategy | Decide which routes may be indexed and when; control sitemap and robots directives | P0 | SEO, Development, QA | Sitemap contains only canonical, indexable, approved URLs |
| SEO-15 | Link Building Strategy | Define ethical, evidence-based authority development; no unsupported link promises | P1 planning | SEO, Project Owner | Strategy, risk controls and budget approved before campaign |
| SEO-16 | SEO KPI | Define baselines and reporting for visibility, technical health and qualified conversion | P0 planning | SEO, Project Owner | Measurement plan approved; numeric targets set only after baseline |

## 4. Keyword research and search intent

### 4.1 Research methodology

Research must be performed separately for Vietnamese and English. For each candidate keyword, record:
- Exact query and language.
- Target country/market, if confirmed.
- Search intent and intended visitor stage.
- Related service/page and proposed canonical URL.
- Evidence source and retrieval date.
- Volume, difficulty and CPC only when the source actually provides them.
- SERP observations and competing page types, with date and geography.
- Confidence and unresolved questions.

Potential research sources may include search engine result pages, first-party Search Console data when connected, keyword research tools and validated customer language. No source has yet been supplied as a completed research dataset.

### 4.2 Seed-topic boundary

The seven service groups are seed themes, not keyword targets. Examples such as “website design”, “custom software”, “mobile app development”, “game development”, “SEO services” and “AI automation” are research prompts only. They must not be presented as validated high-volume or low-difficulty keywords.

### 4.3 Search intent classification

- Informational: visitor is learning about a topic or requirement.
- Commercial investigation: visitor is comparing approaches or providers.
- Transactional: visitor is ready to request consultation or quotation.
- Navigational: visitor is seeking a known brand or destination.

Assign intent from observed query/SERP evidence, not from assumptions based only on a keyword phrase.

## 5. Keyword mapping and topic clusters

### 5.1 Mapping rules

- One primary intent and topic per indexable URL.
- Avoid creating multiple pages for the same intent without a documented distinction.
- Map Vietnamese and English pages as localized equivalents only when content is genuinely equivalent.
- Do not create geographic landing pages until target geography and distinct useful content are confirmed.
- Do not create programmatic or bulk SEO pages to inflate route count.
- Record a redirect plan before changing a published URL.

### 5.2 Initial service hub framework

| Hub ID | Service hub | Supporting research directions (not validated keywords) |
|---|---|---|
| HUB-01 | Website | Website planning, design requirements, development scope, maintenance |
| HUB-02 | Software | Custom software requirements, workflow analysis, integration |
| HUB-03 | Mobile App | App planning, platform selection, feature and release planning |
| HUB-04 | Game | Game concept, platform and development workflow |
| HUB-05 | SEO | SEO planning, technical review, content strategy and measurement |
| HUB-06 | AI & Automation | Process automation, AI integration and workflow design |
| HUB-07 | Other Technology Services | Only confirmed related technology services |

Each hub must have a unique purpose and approved service scope before publication. Supporting articles require their own distinct intent and editorial value.

## 6. Content hubs and information architecture

- Homepage introduces the approved business description and links to all seven service hubs.
- Services overview is the central directory for the seven service detail pages.
- Each service detail page is the commercial hub for its service group.
- Knowledge/blog supports informational discovery only when genuine reviewed articles exist.
- Portfolio pages are indexable only when project facts, publication rights and evidence are approved.
- About and Contact pages contain verified business facts and operational contact paths.
- Legal/policy pages must reflect actual approved practices and must not be generic placeholder legal advice.

The canonical route inventory is maintained in `URL_MAP.md`; the route generator is `scripts/build_public_site.mjs`. URL inventory is not proof that page content is ready to index.

## 7. URL and language architecture

- Use stable, human-readable clean URLs.
- Keep language paths consistent with the URL Map.
- Each indexable page has a self-referencing canonical.
- Genuine VI/EN pairs have reciprocal hreflang annotations.
- `x-default` points to the Vietnamese equivalent as approved by DEC-021.
- Do not add hreflang to a missing, empty or non-equivalent translation.
- Avoid query-string-only content URLs for indexable pages.
- Use permanent redirects when a published URL changes; update internal links, canonical, hreflang and sitemap together.
- Do not change route inventory without impact analysis and owner approval.

## 8. Metadata and social metadata

For every eligible public route:
- Unique, accurate title aligned to page purpose.
- Unique description that summarizes visible page content without unsupported claims.
- Self-referencing canonical.
- Correct robots directive.
- Correct language and reciprocal hreflang where a real pair exists.
- Open Graph and social card fields consistent with the page.
- Descriptive heading hierarchy with one clear page-level H1.
- No duplicate metadata copied indiscriminately across all service pages.

Metadata length guidelines may be tuned during implementation, but relevance and uniqueness take priority over arbitrary character-count targets.

## 9. Structured data strategy

Use only schema types appropriate to the actual page and visible facts. Candidate types may include Organization, WebSite, WebPage, Service, BreadcrumbList and Article where each is factually supported and technically valid.

Rules:
- Never fabricate aggregate ratings, reviews, prices, availability, awards or customer facts.
- Structured data must match visible page content.
- Do not add FAQ markup solely to seek a rich result; questions and answers must be visible and useful.
- Validate syntax and eligibility using current validation tools during QA.
- Structured data does not guarantee rich-result display.

## 10. Entity and E-E-A-T strategy

- Maintain consistent business name, description, contact details and service names across the site.
- Use the approved factual business description.
- Publish real authors/reviewers only after their identities and responsibilities are confirmed.
- Publish project evidence only with Owner approval and rights to display.
- Cite reliable sources for factual educational content where appropriate.
- Record editorial review and update responsibility.
- Omit unsupported credentials, certifications, customer counts, years of experience, performance results and comparative statements.

## 11. Technical SEO and indexation

### 11.1 Required route-level checks

- HTTP status and direct navigation.
- Initial HTML contains the intended page title, description, canonical, robots and language annotations.
- Correct H1 and visible page-specific content.
- Internal links and assets resolve.
- Canonical target returns a valid response and is not redirected unexpectedly.
- Hreflang is reciprocal and references actual localized pages.
- Robots directives and sitemap inclusion agree.
- No accidental noindex on intended public pages or indexable placeholders.
- No private/admin content is exposed.
- Mobile rendering and performance are measured on the assembled Preview.

### 11.2 Blog indexation gate — R-016

Generic browser-hydrated blog listing/detail shells remain noindex and excluded from the sitemap. Dynamic published articles must not be indexed until all of the following are implemented and independently verified:
1. Stable clean-slug route per article.
2. Article-specific initial HTML containing title, description, canonical, robots and meaningful body content.
3. Correct language and reciprocal hreflang where translation exists.
4. Sitemap entry only for published, approved, canonical and indexable articles.
5. Correct status, internal links, structured data and social metadata.
6. Direct-navigation and generated-artifact QA.
7. Owner/editorial publication approval.

Until this gate passes, R-016 remains open and article routes must not be promoted to indexable.

### 11.3 Sitemap and robots

- Sitemap includes only canonical, public, approved, indexable URLs returning successful status.
- Exclude noindex routes, redirects, duplicate URLs, private routes, generic blog shells and drafts.
- Sitemap language alternates must match actual localized pairs.
- Robots.txt must permit crawling of intended public content and must not be used as a substitute for noindex.
- Generated sitemap must be tested from the final assembled Preview artifact, not only an intermediate build directory.

## 12. Link building strategy

No backlink campaign, budget, publisher list, anchor plan or volume target has been approved.

Before any campaign:
- Define the business objective and risk tolerance.
- Prioritize useful original resources, genuine partnerships, relevant citations and editorially justified outreach.
- Review publisher relevance, editorial quality, transparency and link placement.
- Avoid link schemes, automated spam, hidden paid links, private blog network claims or guaranteed ranking packages.
- Disclose paid/sponsored relationships and use appropriate link qualification where required.
- Record placement URL, target URL, anchor, date, relationship and evidence.
- Monitor removals, redirects, malware, spam and unnatural patterns.

Link building is P1 planning and requires separate Owner approval before execution.

## 13. SEO KPI and measurement

No numeric SEO growth or conversion target is currently approved. Establish a baseline before proposing targets.

| KPI group | Measure | Segmentation / notes |
|---|---|---|
| Search visibility | Impressions, clicks, CTR, average position where available | Search engine, language, country, query, page |
| Landing page quality | Organic sessions and engagement indicators | Page, language, device; privacy-approved analytics only |
| Indexation health | Indexed eligible pages, excluded pages, crawl/status errors | Compare against approved URL/indexation matrix |
| Technical quality | Canonical/hreflang errors, sitemap validity, broken links, CWV | Mobile/desktop; field and lab kept separate |
| Content quality | Approved page completeness, freshness, duplicate/thin-content findings | Page type and language |
| Conversion | Qualified consultation/quotation inquiries | Count only server-accepted inquiries; avoid treating button clicks as leads |

Data sources and access are not assumed to be connected. Search Console, analytics and conversion measurement require explicit configuration and privacy review.

## 14. Dependencies, risks and unresolved inputs

| ID | Dependency / risk | Status | Impact |
|---|---|---|---|
| SEO-D01 | Validated keyword research by language/market | Open | No final keyword map or SEO content calendar |
| SEO-D02 | Exact English-speaking priority countries | Open | Geographic and language targeting |
| SEO-D03 | Confirmed scope/deliverables for all seven services | Open | Service page relevance and claims |
| SEO-D04 | Approved B2C persona evidence; B2B research later | Open | Search intent, messaging and funnel |
| SEO-D05 | Portfolio evidence and publication permissions | Open | Trust and project indexation |
| SEO-D06 | Author/editor identities and editorial workflow | Open | Article trust and accountability |
| SEO-D07 | Dynamic article clean URLs and initial HTML (R-016) | Critical / open | Blog indexing blocked |
| SEO-D08 | Final assembled Preview route, sitemap, hreflang and robots QA | Pending | SEO acceptance |
| SEO-D09 | Field CWV data and lab measurement | Pending | Performance acceptance |
| SEO-D10 | Analytics/Search Console ownership and privacy approval | Open | KPI baselines and reporting |
| SEO-D11 | Link building strategy and budget | Deferred | Off-page SEO execution |

## 15. Implementation notes

- Keep `URL_MAP.md` as the route inventory source of truth.
- Keep `scripts/build_public_site.mjs` as the observed route generator; update both only through approved change control.
- Keep generic blog shells noindex and outside the sitemap until R-016 is accepted.
- Do not introduce new SEO plugins, analytics vendors, external APIs or production services without an approved requirement and access/security review.
- Do not treat green CI as proof of search ranking, indexation or real-user performance.
- No code scope beyond the existing bounded XC-03/R-016 and XC-10/R-017 authorization is granted by this document.

## 16. Quality checklist

- [ ] All seven service hubs have approved, distinct page purpose and content.
- [ ] Keyword research has dated evidence and language/market segmentation.
- [ ] Search intent and keyword mapping are documented without cannibalization.
- [ ] Each indexable URL has unique approved content and metadata.
- [ ] Canonical, hreflang and Vietnamese x-default are correct.
- [ ] Structured data matches visible facts and validates.
- [ ] E-E-A-T claims are evidence-backed and publication-approved.
- [ ] Sitemap includes only canonical, approved, indexable URLs.
- [ ] Robots and noindex controls agree with sitemap policy.
- [ ] Blog article gate R-016 passes before article indexation.
- [ ] Internal links, breadcrumbs and language switchers work.
- [ ] Mobile, accessibility, performance and direct-route QA pass on assembled Preview.
- [ ] SEO KPIs have data-source ownership and a baseline before numeric targets.
- [ ] Link building strategy is approved before any campaign.
- [ ] Remaining risks and residual acceptance are recorded.

**Current acceptance status:** Draft for Project Owner review. Keyword research, competitor evidence, live search data, assembled Preview verification and R-016 acceptance remain open. This document does not close Phase 0, approve Gate 2, authorize implementation expansion, merge or production deployment.
