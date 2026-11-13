# HOIQUANWEB — SEO Indexation & PR Preview Remediation Plan

**Status:** Development authorized by Project Owner for XC-03 and XC-10; implementation and acceptance evidence pending  
**Phase:** Phase 0 — Core Preview P0  
**Related cross-checks:** XC-03, XC-10  
**Related risks:** R-016, R-017  
**Scope boundary:** Public bilingual Core Preview and isolated PR preview packaging only

---

## 1. Purpose and confirmed findings

This plan defines the minimum remediation and acceptance evidence for two observed issues. The Project Owner has authorized Development for XC-03 and XC-10 on the current PR branch. This authorization does not include merge, deployment or production changes.

### XC-03 / R-016 — Generic blog-detail shell is incorrectly indexable

Source inspection confirms:

- `scripts/build_public_site.mjs` registers `/blog/post/` and `/en/blog/post/` as `kind: "blog-post"` pages in the same `pages` array used for route generation and sitemap generation.
- The renderer currently emits `index,follow` for every generated route.
- The blog detail shell obtains the article from browser-side JavaScript; it is not a per-article initial-HTML document with its own stable clean URL and article metadata.
- The sitemap is generated from every item in `pages`, so the two generic shell routes are included.
- `scripts/validate_public_site.mjs` currently asserts that the sitemap URL count equals the count of generated HTML pages. This enforces the incorrect assumption that every generated HTML route must be indexable.

This is a confirmed source/code observation, not a claim about search engine indexing or traffic impact.

### XC-10 / R-017 — PR preview root route is overwritten

Source inspection confirms:

- `.github/workflows/pr-preview.yml` copies `public-site/dist/.` into `_preview/`.
- It then copies the frontend `dist/.` into the same root.
- The frontend build can therefore overwrite `_preview/index.html`, replacing the public Vietnamese homepage with the application SPA shell.
- The workflow's existing `validate_public_site.mjs` step is not run after final assembly; it validates `public-site/dist` before the overlay.
- `.github/workflows/pages.yml` assembles from `public-site/dist` only, so this finding establishes a PR Preview packaging collision, not a production Pages overwrite.

## 2. Target behavior — XC-03 indexation

### 2.1 Route classes

| Route class | Initial HTML policy | Sitemap policy | Eligibility condition |
|---|---|---|---|
| Approved static public page | Self-canonical, correct VI/EN alternates, approved x-default, index/follow | Include once | Unique useful content, approved copy, public route |
| Blog listing | Self-canonical and language metadata; index/follow only when useful/approved | Include only when content-ready | Not empty, thin or populated solely by unapproved content |
| Generic blog-detail shell `/blog/post/`, `/en/blog/post/` | `noindex,follow` in initial HTML; canonical behavior must not imply a nonexistent unique article | Exclude | Shell is a client-side loader, not a unique article document |
| Published article with clean slug | Article-specific title, description, canonical, reciprocal VI/EN alternates, x-default and Article structured data in initial HTML | Include once per eligible language URL | Stable clean URL; content approved; server-rendered, prerendered or statically generated HTML |
| Draft/unpublished/private/customer/admin/search/error route | Appropriate noindex/private policy; no public exposure | Exclude | Never include in public sitemap |

### 2.2 Required generator/validator separation

- Keep route generation independent from indexation eligibility. A generated HTML file is not automatically an indexable URL.
- Introduce an explicit per-route indexation eligibility/policy in the generator model, or an equivalent deterministic allow-list. Do not infer eligibility from whether a file exists.
- Emit the robots meta directive from that route policy. The generic detail shell must emit `noindex,follow` in its first HTML response.
- Generate sitemap entries only from routes explicitly marked public and indexable.
- Keep the sitemap restricted to canonical URLs on the approved production domain; no query-string article identifiers.
- Change validator assertions: every sitemap URL must resolve to exactly one generated public HTML document, have a matching canonical and be indexable; generated non-indexable HTML pages may validly be absent from the sitemap.
- Add explicit tests for the negative and positive cases listed below.

### 2.3 Published article readiness gate

Do not expose individual article URLs as indexable until all of the following are true:

1. Stable, clean, language-specific slug URL exists.
2. The article body and meaningful metadata are in the initial HTML, not only injected after browser JavaScript executes.
3. Title and description are unique and approved.
4. Canonical points to the current language URL.
5. VI/EN alternates are reciprocal only where a genuine translated pair exists; x-default points to the corresponding Vietnamese URL under DEC-021.
6. Article structured data is accurate and consistent with visible content.
7. Publication status is public/approved.
8. Sitemap publication/removal follows the same lifecycle as the article.
9. Direct URL load, refresh, HTTP status and 404 behavior are tested.

No new article route inventory, CMS capability or advanced CMS scope is approved by this plan.

## 3. Target behavior — XC-10 Preview assembly

### 3.1 Root route invariant

The final assembled PR Preview must serve the generated public Vietnamese homepage at `/`.

The build must not allow a generic frontend SPA `index.html` to overwrite the public website root. The public website and application/admin entrypoints must be assembled at explicit, non-conflicting paths.

### 3.2 Path and asset requirements

- Preserve public website files from `public-site/dist` at the Preview root.
- Keep `/en/` and all other generated public routes intact.
- Keep admin and portal entrypoints only at their intended, explicit paths; verify their asset references resolve after packaging.
- If the frontend SPA build is required in the Preview, place it under a separately agreed application path or copy only the required non-conflicting assets/entrypoints. The exact path must be confirmed against the existing app router and asset base-path configuration before implementation; this plan does not invent or approve a new public route.
- Ensure asset filenames do not collide with public-site assets; verify relative and absolute references after extraction/hosting.

### 3.3 Post-assembly validation

Run validation against the final `_preview/` artifact, not only the intermediate `public-site/dist` directory.

The final artifact must prove:

- `index.html` at root is the generated public homepage, not the application SPA shell.
- Root title, description, canonical, robots and VI/EN/x-default alternates match the public route policy.
- English homepage at `/en/` remains present and correct.
- All required public routes, assets, direct loads and refreshes work.
- Admin/portal entrypoints remain at their intended paths and do not replace the root homepage.
- The sitemap and robots files are the generated public-site versions.
- No unexpected private or admin data is exposed.

## 4. Required implementation tasks — ordered

| Order | Task | Scope | Dependency |
|---:|---|---|---|
| 1 | Separate route generation from sitemap eligibility and robots policy | Public-site generator | D-021 language policy; URL Map |
| 2 | Update public-site validator for indexable/non-indexable route classes | Public-site QA validator | Task 1 |
| 3 | Add tests for generic blog shell exclusion and future article inclusion gates | Public-site QA validator/tests | Tasks 1–2 |
| 4 | Correct PR preview assembly to avoid root collision | PR preview workflow | Confirm app router/base path and admin/portal entrypoints |
| 5 | Add post-assembly Preview assertions | PR preview workflow/validator | Task 4 |
| 6 | Build and inspect new artifact; verify all route and indexation invariants | CI/QA evidence | Tasks 1–5 |

The Project Owner has authorized the six tasks above for Development on the current PR branch. No implementation is evidenced by this planning document. Production changes, merge and deployment remain outside this authorization.

## 5. Acceptance test matrix

| ID | Test | Expected result |
|---|---|---|
| SEO-IX-01 | Inspect initial HTML at `/blog/post/` | Contains `noindex,follow` before JavaScript runs |
| SEO-IX-02 | Inspect initial HTML at `/en/blog/post/` | Contains `noindex,follow` before JavaScript runs |
| SEO-IX-03 | Parse generated sitemap | Neither generic blog-detail shell URL appears |
| SEO-IX-04 | Parse sitemap entries | Every URL is unique, canonical, public and explicitly indexable |
| SEO-IX-05 | Validate generated HTML set | Non-indexable shell routes may exist but are not required in sitemap |
| SEO-IX-06 | Verify blog listing | Listing indexation follows content-readiness policy; no empty/thin indexable listing |
| SEO-IX-07 | Verify a future published article | Clean URL; article-specific initial HTML metadata/body; correct language links; eligible sitemap entry |
| PREV-01 | Inspect final assembled `_preview/index.html` | Public Vietnamese homepage remains at root |
| PREV-02 | Inspect final root metadata | Expected title, description, canonical, robots and VI/EN/x-default links |
| PREV-03 | Inspect `/en/` and representative deep routes | Correct public pages; direct load and refresh work |
| PREV-04 | Inspect app/admin/portal entrypoints | Each remains at its intended path; no root overwrite; assets resolve |
| PREV-05 | Inspect `sitemap.xml` and `robots.txt` in final artifact | Generated public-site files remain intact |
| PREV-06 | Inspect complete artifact | No private/admin content or unexpected SPA root collision |

## 6. Required evidence and status

For each run, retain:

- PR number, commit SHA, workflow run IDs and job conclusions.
- Generated public-site artifact and final assembled Preview artifact.
- Route inventory and sitemap URL list.
- Initial HTML excerpts for root, English homepage and generic blog-detail shells.
- Validator output and explicit negative/positive test results.
- Artifact extraction/inspection record.

Current status:

- XC-03: Open; source and validator behavior confirmed; target behavior and tests specified here; no implementation evidence.
- XC-10: Open; workflow collision confirmed; target assembly and final-artifact assertions specified here; no implementation evidence.
- R-016 and R-017 remain open until the acceptance tests pass on a newly built artifact.

## 7. Change control

- This is an implementation-ready planning specification, not permission to modify code or workflows.
- Confirm the frontend app router/base path and admin/portal entrypoint requirements before choosing any application subpath.
- Do not change production Pages workflow, deploy, merge or alter production configuration without explicit Project Owner approval.
- Any change to public routes, language strategy, CMS/article scope or indexation policy requires an updated URL Map and owner review.
