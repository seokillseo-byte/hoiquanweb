# HOIQUANWEB — URL Map & Indexation Matrix

**Status:** Phase 0 working document — route inventory verified from source; keyword and indexation recommendations pending owner approval  
**Source of truth:** `scripts/build_public_site.mjs`  
**Domain:** `https://hoiquanweb.io.vn`  
**Languages:** Vietnamese (`vi`) and English (`en`)  
**Inventory:** 15 language pairs / 30 generated static HTML routes. Project and localized privacy-policy routes are reserved and are not generated; a standalone noindex privacy notice is copied separately.

## 1. Scope and evidence

This inventory is derived from the current route declarations in `scripts/build_public_site.mjs`. It describes active generated routes; reserved project and localized privacy routes are not generated until their owner-approval gates pass.

Verified generator behavior:
- Creates 30 active localized HTML routes from 15 VI/EN page pairs. Project and localized privacy-policy routes are reserved and omitted pending owner approval.
- Writes one HTML file for every route and generates `public-site/dist/sitemap.xml` from the same `pages` array.
- Applies indexability per route: blog listing and generic article shells are noindex; eligible CMS article pages are prerendered and indexable only after the explicit SEO readiness gate.
- Writes canonical, VI/EN hreflang and x-default links for every generated route.
- Adds only explicitly indexable public routes and eligible prerendered CMS articles to the sitemap. Generic blog shells, project routes, privacy notice, admin and customer portal are excluded.
- Blog detail currently loads the article by a query-string slug in browser JavaScript and changes metadata after the page loads. It does not generate one static route per published article.

**Important distinction:** the current implementation's index/follow and sitemap behavior is observed code, not an approved SEO policy. The recommended policy below is a planning proposal and requires implementation plus QA.

## 2. Route inventory

“Topic seed” is a topical direction for later keyword research, not a validated target keyword, search-volume claim or ranking opportunity. Page purposes and CTAs are summarized from current page content and navigation.

| # | Page group | Vietnamese URL | English URL | Purpose | Primary CTA / next action | Topic seed (not validated) | Proposed indexation |
|---:|---|---|---|---|---|---|---|
| 01 | Home | `/` | `/en/` | Introduce the seven service groups using factual service wording | Contact / discuss a service | technology services; digital solutions | Index factual copy; no unapproved slogan, portfolio proof or delivery claims |
| 02 | About | `/gioi-thieu/` | `/en/about/` | Explain the service approach without inventing company history, credentials or guarantees | Contact / discuss a service | about HoiQuanWeb; technology services | Index factual copy only; legal identity and company credentials remain owner-controlled |
| 03 | Services overview | `/dich-vu/` | `/en/services/` | Present the seven approved service groups | Open a relevant service page; then inquire | technology services; digital services | Index after all seven service summaries are reviewed |
| 04 | Website service | `/dich-vu/thiet-ke-website/` | `/en/services/website-design/` | Describe website design scope and deliverables | Discuss website requirements | website design; business website | Index after unique content and capability claims are approved |
| 05 | Software service | `/dich-vu/phat-trien-phan-mem/` | `/en/services/software-development/` | Describe custom software and workflow solutions | Discuss software requirements | custom software development | Index after unique content and capability claims are approved |
| 06 | Mobile app service | `/dich-vu/ung-dung-di-dong/` | `/en/services/mobile-app-development/` | Describe iOS/Android application development | Discuss mobile app requirements | mobile app development | Index after platform scope and capability claims are confirmed |
| 07 | Game service | `/dich-vu/phat-trien-game/` | `/en/services/game-development/` | Describe PC/mobile game development scope | Discuss a game project | game development; PC mobile game | Index after portfolio/capability claims are verified |
| 08 | SEO service | `/dich-vu/dich-vu-seo-website/` | `/en/services/website-seo/` | Describe SEO audit, technical SEO and content strategy | Discuss SEO requirements | website SEO; technical SEO | Index after service scope and evidence-backed claims are reviewed |
| 09 | AI & Automation service | `/dich-vu/ai-va-tu-dong-hoa/` | `/en/services/ai-automation/` | Describe AI assistant and workflow automation services | Discuss automation requirements | AI automation; workflow automation | Index after scope, safeguards and capability claims are confirmed |
| 10 | Other technology service | `/dich-vu/giai-phap-cong-nghe/` | `/en/services/technology-solutions/` | Provide an inquiry route for other custom technology needs | Describe a custom requirement | technology consulting; custom technology solutions | Index after the service scope is clarified and made distinct |
| 11 | Projects listing (reserved) | `/du-an/` | `/en/projects/` | Reserved for owner-approved case studies | Open approved project details | software projects; digital products | **Not generated, linked or indexed** until product status, evidence and publication rights are approved |
| 12 | Template catalog | `/templates/` | `/en/templates/` | Search and filter published website templates | View catalog item / inquire | website templates; WordPress templates | Conditional: index only when the catalog has useful published inventory |
| 13 | Blog listing | `/blog/` | `/en/blog/` | Search and filter published knowledge articles | Open an article | website, software, SEO and AI knowledge | Conditional: index when useful published articles are available |
| 14 | Generic blog detail shell | `/blog/post/` | `/en/blog/post/` | Legacy client-side fallback for articles not yet eligible for prerendering | Return to blog / read loaded article | No independent topic; article-specific topic belongs to each post URL | **Noindex and exclude from sitemap** |
| 14A | Published article detail (dynamic) | `/blog/{slug}/` | `/en/blog/{slug}/` | Serve one approved published CMS article with its body and SEO metadata in initial HTML | Read article / return to blog | Article-specific topic and search intent defined by the approved CMS post | Index only when `seo.indexable=true`, locale, unique SEO title/description and body readiness pass; genuine VI/EN pairs only receive reciprocal hreflang |
| 15 | FunLink project (reserved) | `/du-an/funlink/` | `/en/projects/funlink/` | Reserved for a verified product case study | Visit product / discuss a project | FunLink; URL shortener SaaS | **Not generated or linked** until product status, description and publication rights are approved |
| 16 | Entity Manager project (reserved) | `/du-an/entity-manager/` | `/en/projects/entity-manager/` | Reserved for a verified product case study | Discuss a similar software project | entity management software | **Not generated or linked** until product status, description and publication rights are approved |
| 17 | Social Media Automation project (reserved) | `/du-an/social-media-automation/` | `/en/projects/social-media-automation/` | Reserved for a verified product case study | Discuss an automation project | social media automation software | **Not generated or linked** until product capability and publication rights are approved |
| 18 | FAQ | `/faq/` | `/en/faq/` | Answer verified service-group and inquiry-preparation questions | Contact / ask about a service | technology services FAQ; project inquiry | Index factual answers only; omit unconfirmed process, pricing and market claims |
| 19 | Contact / inquiry | `/lien-he/` | `/en/contact/` | Provide an inquiry form; default mode downloads a local brief without server transmission | Download brief; submit only when approved online intake is enabled | contact technology company; request a software quote | Online submission requires HTTPS API base, explicit policy approval, approved HTTPS policy URL and consent |
| 20 | Privacy information notice (standalone) | `/privacy.html` | Not localized | Explain that the notice is temporary and online intake is disabled by default | Read notice | HoiQuanWeb privacy information | **Noindex, not linked and not an approved legal policy**; legal identity, purposes, retention, processors and privacy contact still require owner approval |

## 3. Language, canonical and hreflang rules

### Required target behavior
1. Vietnamese routes use the Vietnamese path as canonical; English routes use the corresponding English path.
2. Every genuine translated pair links reciprocally using `hreflang="vi"` and `hreflang="en"`.
3. `hreflang="x-default"` must point to the Vietnamese (`vi`) URL for each genuine VI/EN pair, as approved by the Project Owner under DEC-021. The generator currently points x-default to Vietnamese; retain this behavior and verify it in generated initial HTML and Preview.
4. Canonical must be absolute, self-referencing and use the production host only on production output.
5. Query parameters used for filtering, search or tracking must not create duplicate indexable canonical URLs.
6. If a translation is missing or materially incomplete, do not declare a false hreflang pair.
7. URL changes require a documented one-to-one 301 redirect where a replacement exists; update internal links, canonical, hreflang and sitemap together.
8. CMS posts declare `seo.locale` as `vi` or `en`. Legacy posts without a locale are treated as Vietnamese for listing only, but are not eligible for clean-URL indexation until explicitly reviewed.
9. A post is prerendered only when `seo.indexable=true`, locale is valid, SEO title is 10–240 characters, SEO description is 50–320 characters, and at least one supported content block exists.
10. `seo.translation_group_id` links genuine translations. Exactly one eligible VI post and one eligible EN post in the same group receive reciprocal `hreflang`; `x-default` points to the Vietnamese URL. A Vietnamese-only article has `vi` + `x-default` pointing to itself; an English-only article has only `en`.
11. GitHub Pages build uses `HQ_API_BASE` to read published posts and fetch each eligible article body. If configured API reads fail, the build fails rather than publishing an incomplete sitemap. If `HQ_API_BASE` is absent, no dynamic article HTML is generated.

### Current implementation observation
The generator currently emits canonical and VI/EN hreflang links on every route. The generated static routes use the configured domain constant. Live host behavior, HTTP status, redirect handling and direct-navigation behavior still require Preview/runtime acceptance.

## 4. Sitemap and robots policy

### Current behavior verified from source
- Only explicitly indexable public routes and eligible CMS article routes are included in the sitemap.
- Blog listing/generic article shells emit `noindex,follow`; the standalone privacy notice is `noindex,follow`; project/legal routes are not generated.
- The generated `robots.txt` allows crawling generally and disallows the admin path.
- The GitHub Pages workflow deploys `public-site/dist`, including its generated sitemap; the repository-root `sitemap.xml` is not the sitemap deployed by that workflow.
- Historical validation run 43389153063 recorded the former 40-route implementation. It is not evidence for the current 30-route build.
- Isolated preview artifact run 43389153166 was inspected directly: 39 generated localized route HTML files were available in the assembled artifact; all 39 contained `hreflang="vi"`, `hreflang="en"` and `hreflang="x-default"`, with `x-default` exactly matching the Vietnamese alternate and no pair-target mismatch. The Vietnamese root route was not inspectable in that artifact because preview assembly overlaid `dist/index.html` over the generated public homepage. The root file in the artifact is the app shell with `noindex,nofollow` and no canonical/hreflang. See XC-10; this is not proof of the production Pages output, which copies only `public-site/dist`.
- Current validation requires generic blog shells to remain noindex and absent from the sitemap; prerendered article routes are validated separately.

### Required target policy
- Include only canonical, public, useful and intentionally indexable URLs.
- Exclude the generic blog-detail shell, drafts, unpublished CMS content, private/customer portal routes, admin routes, search/filter parameter variants and error pages.
- Add each published article as its own clean URL only after server rendering, prerendering or static generation provides article content, title, description, canonical and Article structured data in the initial HTML.
- Add/remove URLs in the sitemap as part of the same publication lifecycle as the page.
- Keep robots.txt crawl rules separate from noindex directives; robots.txt disallow is not a substitute for noindex.
- Do not expose private content merely to make a route crawlable.

## 5. Acceptance criteria

- [x] Active source inventory contains 30 localized routes (15 VI/EN pairs); project and localized privacy routes are reserved.
- [x] Current generator creates canonical and language alternate links.
- [x] Current generator creates sitemap entries from the same route array.
- [ ] Every route has final, owner-approved title, description, page copy and CTA.
- [ ] Every VI/EN pair is a genuine equivalent translation with reciprocal `hreflang="vi"` and `hreflang="en"`; `hreflang="x-default"` points to the corresponding Vietnamese URL as approved by DEC-021. Artifact check passed for 39 available route files; verify the root homepage in the correctly assembled public-site output.
- [x] Indexation policy is implemented per route type; generic blog shells emit `noindex,follow` and are absent from the sitemap; eligible clean article routes are validated separately.
- [x] Generator supports stable clean-slug routes and article-specific initial HTML for published CMS posts that pass the explicit SEO readiness gate.
- [ ] Configure `HQ_API_BASE` in the production Pages environment and verify real published articles are generated, refreshed and removed from the sitemap on unpublish.
- [ ] Sitemap contains every eligible published canonical URL exactly once and no ineligible route.
- [ ] Direct navigation, refresh, canonical, hreflang, redirects, HTTP status and 404 are tested on an accessible Preview.
- [x] Project routes are not generated or linked until case-study evidence and publication rights are approved; blog listing shells remain noindex.
- [x] Contact form defaults to local brief download and explicitly states that data is not sent to a server; online intake remains gated on approved HTTPS policy and API configuration.
- [ ] No fabricated price, testimonial, customer logo, case-study metric, legal claim or unsupported capability is published.

## 6. Article route implementation and acceptance

The original indexation defect was addressed by XC-03 and the clean-article route implementation in R-016. The following behavior is now present in the implementation branch and is covered by unit/end-to-end build validation:

- Generic `/blog/post/` and `/en/blog/post/` fallback shells remain available for legacy browser-side navigation, emit `noindex,follow` in initial HTML and are excluded from the sitemap.
- Blog listing routes remain noindex until useful published inventory and server-rendered listing content are available.
- The static generator fetches published posts, then fetches full detail for posts explicitly marked `seo.indexable=true` and emits clean `/blog/{slug}/` or `/en/blog/{slug}/` HTML documents.
- Each eligible article has article-specific initial HTML, title, description, self-canonical, language alternates, Article structured data and sitemap entry.
- Translation alternates are emitted only for a genuine one-to-one VI/EN translation group; Vietnamese is x-default.
- The validator checks unique canonical sitemap URLs, initial article body and structured data, and permits generated non-indexable shells to remain outside the sitemap.

**Remaining runtime acceptance:** configure `HQ_API_BASE` for the Pages build and verify published articles are generated, refreshed and removed from the sitemap on unpublish against the dedicated Worker/D1 staging environment. Static tests without that environment do not prove live CMS synchronization.
 
## 7. Open decisions

- `x-default` default-language decision: resolved by DEC-021 — Vietnamese (`vi`) is approved. Generated artifact check passed on 39 available localized route files; root homepage verification remains pending because the isolated preview bundle overwrote it during assembly. Verify the root route from the unmodified `public-site/dist` output.
- Final keyword research and country-specific English localization: pending target-market decision.
- Project descriptions and permission to publish: owner review required.
- Template/blog catalog content readiness: pending.
- Final legal identity, privacy contact and retention policy: pending.
- Production host, redirect and deployment behavior: pending runtime acceptance.

## 8. Change control

This document is a Phase 0 planning artifact. Do not change routes, remove pages, add new service groups or alter the approved bilingual architecture without recording the impact and obtaining owner approval. Any implementation change must update this URL Map and the route generator/validator together.
