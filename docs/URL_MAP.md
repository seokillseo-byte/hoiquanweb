# HOIQUANWEB — URL Map & Indexation Matrix

**Status:** Phase 0 working document — route inventory verified from source; keyword and indexation recommendations pending owner approval  
**Source of truth:** `scripts/build_public_site.mjs`  
**Domain:** `https://hoiquanweb.io.vn`  
**Languages:** Vietnamese (`vi`) and English (`en`)  
**Inventory:** 20 language pairs / 40 generated static HTML routes

## 1. Scope and evidence

This inventory is derived from the current route declarations in `scripts/build_public_site.mjs`. It describes what the generator currently emits; it does not imply that every page has approved final content or is ready for search indexing.

Verified generator behavior:
- Creates 40 localized HTML routes from 20 VI/EN page pairs.
- Writes one HTML file for every route and generates `public-site/dist/sitemap.xml` from the same `pages` array.
- Writes `<meta name="robots" content="index,follow,max-image-preview:large">` on every generated route.
- Writes canonical, VI/EN hreflang and x-default links for every generated route.
- Adds all 40 generated routes to the sitemap, including the generic blog-detail shells at `/blog/post/` and `/en/blog/post/`.
- Blog detail currently loads the article by a query-string slug in browser JavaScript and changes metadata after the page loads. It does not generate one static route per published article.

**Important distinction:** the current implementation's index/follow and sitemap behavior is observed code, not an approved SEO policy. The recommended policy below is a planning proposal and requires implementation plus QA.

## 2. Route inventory

“Topic seed” is a topical direction for later keyword research, not a validated target keyword, search-volume claim or ranking opportunity. Page purposes and CTAs are summarized from current page content and navigation.

| # | Page group | Vietnamese URL | English URL | Purpose | Primary CTA / next action | Topic seed (not validated) | Proposed indexation |
|---:|---|---|---|---|---|---|---|
| 01 | Home | `/` | `/en/` | Explain the brand, seven service groups and project approach | Contact / discuss a project | technology partner; digital solutions | Index after business messaging and claims are approved |
| 02 | About | `/gioi-thieu/` | `/en/about/` | Explain company approach, working principles and scope clarity | Contact / discuss a project | about HoiQuanWeb; technology company | Index after legal/business identity and factual copy are confirmed |
| 03 | Services overview | `/dich-vu/` | `/en/services/` | Present the seven approved service groups | Open a relevant service page; then inquire | technology services; digital services | Index after all seven service summaries are reviewed |
| 04 | Website service | `/dich-vu/thiet-ke-website/` | `/en/services/website-design/` | Describe website design scope and deliverables | Discuss website requirements | website design; business website | Index after unique content and capability claims are approved |
| 05 | Software service | `/dich-vu/phat-trien-phan-mem/` | `/en/services/software-development/` | Describe custom software and workflow solutions | Discuss software requirements | custom software development | Index after unique content and capability claims are approved |
| 06 | Mobile app service | `/dich-vu/ung-dung-di-dong/` | `/en/services/mobile-app-development/` | Describe iOS/Android application development | Discuss mobile app requirements | mobile app development | Index after platform scope and capability claims are confirmed |
| 07 | Game service | `/dich-vu/phat-trien-game/` | `/en/services/game-development/` | Describe PC/mobile game development scope | Discuss a game project | game development; PC mobile game | Index after portfolio/capability claims are verified |
| 08 | SEO service | `/dich-vu/dich-vu-seo-website/` | `/en/services/website-seo/` | Describe SEO audit, technical SEO and content strategy | Discuss SEO requirements | website SEO; technical SEO | Index after service scope and evidence-backed claims are reviewed |
| 09 | AI & Automation service | `/dich-vu/ai-va-tu-dong-hoa/` | `/en/services/ai-automation/` | Describe AI assistant and workflow automation services | Discuss automation requirements | AI automation; workflow automation | Index after scope, safeguards and capability claims are confirmed |
| 10 | Other technology service | `/dich-vu/giai-phap-cong-nghe/` | `/en/services/technology-solutions/` | Provide an inquiry route for other custom technology needs | Describe a custom requirement | technology consulting; custom technology solutions | Index after the service scope is clarified and made distinct |
| 11 | Projects listing | `/du-an/` | `/en/projects/` | List selected products/projects | Open project details | software projects; digital products | Index only with reviewed, publishable project entries |
| 12 | Template catalog | `/templates/` | `/en/templates/` | Search and filter published website templates | View catalog item / inquire | website templates; WordPress templates | Conditional: index only when the catalog has useful published inventory |
| 13 | Blog listing | `/blog/` | `/en/blog/` | Search and filter published knowledge articles | Open an article | website, software, SEO and AI knowledge | Conditional: index when useful published articles are available |
| 14 | Blog detail shell | `/blog/post/` | `/en/blog/post/` | Generic client-side container that loads an article from a query slug | Return to blog / read loaded article | No independent topic; article-specific topic belongs to each post URL | **Noindex and exclude from sitemap** until replaced by clean per-article routes with initial-HTML content |
| 15 | FunLink project | `/du-an/funlink/` | `/en/projects/funlink/` | Describe the FunLink URL-shortening SaaS project | Visit product / discuss a project | FunLink; URL shortener SaaS | Conditional on owner approval of description, product status and publication rights |
| 16 | Entity Manager project | `/du-an/entity-manager/` | `/en/projects/entity-manager/` | Describe the Entity Manager desktop software | Discuss a similar software project | entity management software | Conditional on owner approval of description, product status and publication rights |
| 17 | Social Media Automation project | `/du-an/social-media-automation/` | `/en/projects/social-media-automation/` | Describe social-platform workflow automation software | Discuss an automation project | social media automation software | Conditional on owner approval of description, capability and publication rights |
| 18 | FAQ | `/faq/` | `/en/faq/` | Answer common service, process and inquiry questions | Contact / ask about a project | technology services FAQ; project inquiry | Index after answers are verified against actual operating policies |
| 19 | Contact / inquiry | `/lien-he/` | `/en/contact/` | Collect consultation and quotation requests with consent | Submit inquiry | contact technology company; request a software quote | Index after API handling, privacy notice and contact ownership are verified |
| 20 | Privacy | `/quyen-rieng-tu/` | `/en/privacy/` | Explain form-data handling and privacy information | Read policy; contact for questions | HoiQuanWeb privacy policy | Index after legal identity, retention and data-contact details are finalized |

## 3. Language, canonical and hreflang rules

### Required target behavior
1. Vietnamese routes use the Vietnamese path as canonical; English routes use the corresponding English path.
2. Every genuine translated pair links reciprocally using `hreflang="vi"` and `hreflang="en"`.
3. `hreflang="x-default"` must point to the Vietnamese (`vi`) URL for each genuine VI/EN pair, as approved by the Project Owner under DEC-021. The generator currently points x-default to Vietnamese; retain this behavior and verify it in generated initial HTML and Preview.
4. Canonical must be absolute, self-referencing and use the production host only on production output.
5. Query parameters used for filtering, search or tracking must not create duplicate indexable canonical URLs.
6. If a translation is missing or materially incomplete, do not declare a false hreflang pair.
7. URL changes require a documented one-to-one 301 redirect where a replacement exists; update internal links, canonical, hreflang and sitemap together.

### Current implementation observation
The generator currently emits canonical and VI/EN hreflang links on every route. The generated static routes use the configured domain constant. Live host behavior, HTTP status, redirect handling and direct-navigation behavior still require Preview/runtime acceptance.

## 4. Sitemap and robots policy

### Current behavior verified from source
- All 40 generated routes are included in the generated sitemap.
- All generated HTML pages currently receive `index,follow`.
- The generated `robots.txt` allows crawling generally and disallows the admin path.
- The GitHub Pages workflow deploys `public-site/dist`, including its generated sitemap; the repository-root `sitemap.xml` is not the sitemap deployed by that workflow.

### Required target policy
- Include only canonical, public, useful and intentionally indexable URLs.
- Exclude the generic blog-detail shell, drafts, unpublished CMS content, private/customer portal routes, admin routes, search/filter parameter variants and error pages.
- Add each published article as its own clean URL only after server rendering, prerendering or static generation provides article content, title, description, canonical and Article structured data in the initial HTML.
- Add/remove URLs in the sitemap as part of the same publication lifecycle as the page.
- Keep robots.txt crawl rules separate from noindex directives; robots.txt disallow is not a substitute for noindex.
- Do not expose private content merely to make a route crawlable.

## 5. Acceptance criteria

- [x] Source inventory currently contains 40 localized routes (20 VI/EN pairs).
- [x] Current generator creates canonical and language alternate links.
- [x] Current generator creates sitemap entries from the same route array.
- [ ] Every route has final, owner-approved title, description, page copy and CTA.
- [ ] Every VI/EN pair is a genuine equivalent translation with reciprocal `hreflang="vi"` and `hreflang="en"`; `hreflang="x-default"` points to the corresponding Vietnamese URL as approved by DEC-021.
- [ ] Indexation policy is implemented per route type; blog detail shell is noindex and absent from sitemap.
- [ ] Published CMS/blog posts receive stable clean-slug URLs and server/prerendered initial HTML.
- [ ] Sitemap contains every eligible published canonical URL exactly once and no ineligible route.
- [ ] Direct navigation, refresh, canonical, hreflang, redirects, HTTP status and 404 are tested on an accessible Preview.
- [ ] Template/project/blog listing pages are not indexed while empty, thin or populated only with unapproved content.
- [ ] Contact form success/error state reflects actual API acceptance; privacy and consent wording are approved.
- [ ] No fabricated price, testimonial, customer logo, case-study metric, legal claim or unsupported capability is published.

## 6. Open decisions

- `x-default` default-language decision: resolved by DEC-021 — Vietnamese (`vi`) is approved. Generated-artifact and Preview verification remain pending.
- Final keyword research and country-specific English localization: pending target-market decision.
- Project descriptions and permission to publish: owner review required.
- Template/blog catalog content readiness: pending.
- Final legal identity, privacy contact and retention policy: pending.
- Production host, redirect and deployment behavior: pending runtime acceptance.

## 7. Change control

This document is a Phase 0 planning artifact. Do not change routes, remove pages, add new service groups or alter the approved bilingual architecture without recording the impact and obtaining owner approval. Any implementation change must update this URL Map and the route generator/validator together.
