# SEO Foundation & Design System — HOIQUANWEB

**Status:** 40 static localized routes verified by CI; dynamic blog/CMS SEO and live URL acceptance pending  
**Project:** HOIQUANWEB / hoiquanweb.io.vn  
**Languages:** Vietnamese and English

## 1. SEO status — verified facts vs. pending verification

### 1.1 Verified from repository documents/files

- README.md and IMPLEMENTATION_ROADMAP.md report 40 generated localized routes for the bilingual public website; generated routes are not equivalent to approved or indexable content.
- scripts/build_public_site.mjs defines 40 localized page objects and generates HTML routes plus sitemap.xml from the same pages array.
- scripts/validate_public_site.mjs verifies generated HTML page count, sitemap URL count, uniqueness and canonical path parity.
- CI run 43364844705 passed and its log confirms: Generated 40 localized pages; Public site validation passed: 40 pages, internal links/assets, localized metadata, canonical sitemap, brand tokens and inquiry fallback.
- .github/workflows/pages.yml deploys public-site/dist after running the generator and validator; it does not copy the repository-root sitemap.xml.
- The repository-root sitemap.xml contains only the homepage and is stale for the generated site, but it is not the sitemap used by the current Pages workflow.
- ARCHITECTURE.md previously reported 34 pages and this document previously described a one-page landing page; those descriptions are outdated and are being corrected in this PR.
- GitHub Pages is a static preview host. It does not run the Cloudflare Worker, create D1 resources, or provide the authenticated backend.

**Conclusion:** 40 static localized routes and their generated sitemap are verified by CI. Live Preview/production URL acceptance remains pending. Dynamic blog/CMS URLs are a separate unresolved SEO gap described below.

### 1.2 Required route and sitemap reconciliation

1. Use scripts/build_public_site.mjs as the static route source of truth.
2. Keep the generated sitemap from public-site/dist as the sitemap deployed by GitHub Pages.
3. Preserve CI checks for generated page count, sitemap URL count, uniqueness and canonical path parity.
4. Inspect live Preview URLs for direct navigation, refresh, 404, hreflang, canonical and HTTP response after an approved Pages deployment.
5. Classify static, dynamic, noindex, draft and private routes separately.
6. Add published dynamic blog URLs only after clean routes and SSR/prerender/static generation are implemented.
7. Update README, Architecture, Roadmap and this document whenever route or deployment generation changes.

### 1.3 Dynamic blog and CMS route limitation

- The generated static site includes generic blog detail shells at /blog/post/ and /en/blog/post/. The current generator also places these shells in the 40-route sitemap and gives them index,follow; this is observed behavior, not the desired target policy.
- The current browser code reads the article slug from a query parameter and updates canonical/title/description after JavaScript runs.
- Individual published blog posts are not emitted as individual URLs in the 40-page static sitemap. Arbitrary new CMS pages are also not generated as routes.
- Do not treat dynamic blog/CMS content as fully SEO-ready. Before indexation, use clean slug routes with SSR, prerendering or static generation; include only published URLs in sitemap; ensure metadata and Article structured data are present in the initial HTML.
- Required correction: mark the generic blog-detail shells noindex and exclude them from the sitemap until clean per-article routes exist. The current generator does not yet implement this correction.
- Until then, keep unsupported dynamic routes out of the indexable sitemap and do not claim full dynamic SEO coverage.

## 2. Target information architecture

The approved business scope is a multi-page bilingual services website. The high-level content groups are:

- Home.
- About.
- Services overview.
- Seven approved service groups: Website, Software, Mobile App, Game, SEO, AI & Automation, and Other Technology Services.
- Service detail pages.
- Portfolio/projects, only when the work and publishing rights are verified.
- Knowledge/blog, only when useful content and editorial ownership are available.
- Contact / consultation and quotation request.
- Legal and privacy information required for the actual operation.

The source-verified route inventory is documented in [URL_MAP.md](URL_MAP.md): 20 VI/EN pairs and 40 generated routes. Topic seeds in that document are not validated keyword research. Indexation recommendations remain subject to owner approval and implementation. Do not create thin or duplicate pages merely to increase the URL count.

## 3. SEO rules per page

Each indexable public page must define:

- Unique title and meta description aligned with the page intent.
- One canonical URL matching the selected host and route.
- Correct language metadata and reciprocal hreflang where a real translation exists.
- Robots directives appropriate to page purpose.
- Open Graph metadata with verified title, description and image.
- Structured data only when the page content supports the declared entity/type.
- Descriptive headings and useful unique content.
- Contextual internal links to relevant services and supporting content.
- Image alt text describing meaningful image content; decorative images use empty alt where appropriate.
- No fabricated reviews, ratings, addresses, customer logos, testimonials, performance metrics or case studies.

SEO does not guarantee ranking. Post-launch measurement should include index coverage, organic clicks, impressions, conversions, Core Web Vitals and crawl errors where the relevant analytics/search tools are configured.

## 4. Content architecture and conversion

- Homepage communicates only confirmed business facts and the approved seven service groups.
- Service pages explain scope, deliverables, process, relevant questions and a consultation/quotation CTA.
- Industry solution pages should only be created when there is distinct expertise, useful original content and search demand.
- Portfolio/case studies require evidence and permission to publish.
- Blog articles require a defined search intent, author/editor responsibility, update date, sources where applicable and links to relevant services.
- Primary conversion is consultation and quotation requests.
- Do not display invented prices. If pricing rules are not confirmed, use a consultation/quotation flow rather than fake price cards.
- The form must not display a success state until the receiving API/provider confirms acceptance.

## 5. Design system — current repository tokens

The current design document records these CSS tokens:

- Color tokens: --ink, --muted, --paper, --white, --line, --blue, --blue2, --lime, --navy.
- Layout tokens: --max, --radius, --shadow.
- Existing component vocabulary: button, card, eyebrow, section heading, service card, process step, project card, benefit, pricing card, form field, FAQ accordion, toast and footer.
- Main responsive breakpoints recorded in the current stylesheet/documentation: 980px and 720px; intermediate sizes must also be tested.
- Accessibility patterns recorded: skip link, focus outline, form labels, live region, aria-expanded, accessible labels and prefers-reduced-motion support.
- Accessibility target: WCAG 2.1 AA, subject to automated and manual testing.

These tokens describe the repository's current design vocabulary; they are not proof that the final brand identity has been approved. Official logo, typography, palette and imagery direction remain subject to brand confirmation.

## 6. QA checklist

- [ ] Actual route inventory exported from the source of truth.
- [ ] Sitemap matches every eligible indexable route and no other route.
- [ ] VI/EN route pairs and reciprocal hreflang are correct.
- [ ] Canonical, robots, Open Graph and structured data are correct per route.
- [ ] Direct navigation, refresh, internal links and 404 behavior are tested.
- [ ] No placeholder, fabricated claim, price, testimonial or case study is published.
- [ ] Form validation, API success and API failure states are tested.
- [ ] Keyboard navigation, focus-visible, labels, contrast and reduced motion are checked.
- [ ] 320px, 375px, 768px, 1024px and wide screens are tested with no horizontal overflow.
- [ ] Lighthouse/performance and Core Web Vitals are measured on an actual accessible preview/runtime.
- [ ] Preview host and production domain are not confused in canonical/sitemap/structured data.
- [ ] All contact and legal details are confirmed by the project owner before production.
