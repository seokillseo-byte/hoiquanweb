# SEO Foundation & Design System — HOIQUANWEB

**Status:** Current-state and target rules; route inventory reconciliation required  
**Project:** HOIQUANWEB / hoiquanweb.io.vn  
**Languages:** Vietnamese and English

## 1. SEO status — verified facts vs. pending verification

### 1.1 Verified from repository documents/files

- README.md and IMPLEMENTATION_ROADMAP.md report a bilingual public website with 40 content pages.
- ARCHITECTURE.md previously reported 34 content pages; that count conflicts with the other repository documents.
- The currently checked sitemap.xml contains only the homepage URL.
- This document previously described the site as a one-page landing page, which conflicts with the multi-page project direction and the current README/Roadmap claims.
- GitHub Pages is described as a static preview host. It does not run the Cloudflare Worker, create D1 resources, or provide the authenticated backend.
- The production domain and runtime configuration must not be treated as verified merely because a preview build or CI workflow succeeds.

**Conclusion:** The current number of generated/indexable URLs is NOT VERIFIED. Do not claim that 40 URLs are live or SEO-ready until the actual route inventory, generated output, sitemap and HTTP responses have been reconciled.

### 1.2 Required route and sitemap reconciliation

1. Extract the canonical route inventory from the actual site generator/source.
2. Identify every Vietnamese and English route and its language counterpart.
3. Classify each route as indexable, noindex, redirect, draft or private.
4. Verify every public route can be opened directly and refreshed without a 404.
5. Generate sitemap.xml from the same route inventory; do not maintain an unrelated hand-written list.
6. Verify sitemap URLs are unique, canonical, publicly accessible and indexable.
7. Verify hreflang reciprocal mappings for each translated pair; do not create a mapping where a translation does not exist.
8. Verify canonical URLs, robots directives, Open Graph URLs and structured data against the actual preview/production host.
9. Add automated checks that fail when an indexable route is missing from the sitemap or a sitemap URL is not part of the route inventory.
10. Update README, Architecture, Roadmap and this document using the verified result.

### 1.3 Dynamic blog and CMS route limitation

- The generated static site includes generic blog detail shells at /blog/post/ and /en/blog/post/.
- The current browser code reads the article slug from a query parameter and updates canonical/title/description after JavaScript runs.
- Individual published blog posts are not emitted as individual URLs in the 40-page static sitemap. Arbitrary new CMS pages are also not generated as routes.
- Do not treat dynamic blog/CMS content as fully SEO-ready. Before indexation, use clean slug routes with SSR, prerendering or static generation; include only published URLs in sitemap; ensure metadata and Article structured data are present in the initial HTML.
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

The final URL map, page count, keyword map and indexation policy remain deliverables of Phase 0. Do not create thin or duplicate pages merely to increase the URL count.

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
