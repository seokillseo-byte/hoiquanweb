# HOIQUANWEB — Development Handoff: XC-03 & XC-10

**Status:** Owner-authorized Development handoff; implementation not yet evidenced  
**Date:** 2026-11-13  
**Repository:** `seokillseo-byte/hoiquanweb`  
**Working branch:** `docs/phase-0-master-blueprint-risk-review`  
**Related PR:** [#43](https://github.com/seokillseo-byte/hoiquanweb/pull/43)  
**Scope:** XC-03 / R-016 and XC-10 / R-017 only  
**Authority:** Project Owner approved transition to Development on the current PR branch. Merge, deployment and production changes are not authorized.

---

## 1. Objective

Implement only the two approved remediations:

1. **XC-03 / R-016:** A generic client-side blog-detail shell must not be treated as an indexable article or included in the public sitemap. Future published articles may be indexed only when their own clean URL and article-specific initial HTML satisfy the readiness gate.
2. **XC-10 / R-017:** The final assembled PR Preview must preserve the generated Vietnamese public homepage at `/`; the frontend SPA must not overwrite it.

This is a bounded remediation, not approval to build an advanced CMS, change public information architecture, introduce new business features, or redesign the site.

## 2. Authoritative inputs

Developer must follow, in priority order:

- Owner-approved decisions in `docs/OWNER_DECISION_REVIEW.md`.
- `docs/MASTER_BLUEPRINT.md`.
- `docs/URL_MAP.md`.
- `docs/SEO_INDEXATION_AND_PREVIEW_REMEDIATION.md`.
- `docs/ARCHITECTURE.md` and `docs/IMPLEMENTATION_ROADMAP.md`.
- Repository implementation and current app router/base-path configuration.

Relevant approved decision: Vietnamese (`vi`) is the `x-default` fallback; each genuine VI/EN pair must point `x-default` to its corresponding Vietnamese URL (DEC-021).

## 3. Implementation boundaries

### Allowed

- Modify public-site route metadata/indexation policy and sitemap generation.
- Modify the public-site validator and focused tests.
- Modify the PR Preview assembly workflow and its validation steps.
- Add or adjust narrowly scoped test fixtures needed to prove the two remediations.
- Update documentation/evidence records related to these changes.

### Not allowed in this handoff

- Merge PR #43 or deploy any environment.
- Modify the production Pages deployment workflow unless a separate explicit approval is obtained.
- Change public URL inventory, add new public routes, or expose draft/private content.
- Implement CMS/article authoring or publishing features.
- Add a new app/admin/portal public path by assumption.
- Add unrelated features, refactors, dependency upgrades or visual changes.
- Change secrets, production configuration, database schema or infrastructure.

## 4. Work package A — XC-03 / R-016

### A1. Route and indexation model

Inspect `scripts/build_public_site.mjs` and establish an explicit, deterministic route-level indexation policy. Route generation and sitemap eligibility must be separate concerns.

Required behavior:

- Generated HTML existence does not imply indexability.
- Generic shells `/blog/post/` and `/en/blog/post/` emit `noindex,follow` in the initial HTML response.
- These generic shell routes are excluded from the sitemap.
- Sitemap entries are drawn only from explicitly public and indexable routes.
- Keep robots.txt crawl policy separate from the robots meta directive; do not block the shell in robots.txt as a substitute for `noindex`.
- Every sitemap URL must be unique, canonical, public, and indexable.
- A generated non-indexable HTML route may validly be absent from the sitemap.

Use the smallest clear route property/policy consistent with the current generator. Avoid implicit inference from file existence or URL naming alone.

### A2. Published article readiness

Do not create or enable new article routes as part of this task. Preserve the readiness gate for any future article:

- Stable clean language-specific slug URL.
- Article body and meaningful metadata in initial HTML.
- Unique approved title and description.
- Canonical to the current language URL.
- Reciprocal VI/EN alternates only for a genuine translated pair.
- `x-default` points to the matching Vietnamese URL under DEC-021.
- Accurate Article structured data matching visible content.
- Public/approved publication status.
- Sitemap inclusion/removal follows publication lifecycle.
- Direct load, refresh, HTTP status and 404 behavior tested.

### A3. Validator and tests

Update `scripts/validate_public_site.mjs` and existing test locations as appropriate. Remove the invalid assumption that sitemap URL count must equal all generated HTML page count.

Minimum assertions:

- Both generic blog shells contain `noindex,follow` in initial HTML.
- Neither generic shell appears in sitemap.
- Sitemap URLs are unique and resolve to generated public HTML.
- Each sitemap URL has a matching canonical and is explicitly indexable.
- Non-indexable generated HTML is permitted outside the sitemap.
- Existing static public routes retain correct metadata, canonical, VI/EN alternates and DEC-021 x-default behavior.
- No unapproved article routes or fabricated article content are introduced.

## 5. Work package B — XC-10 / R-017

### B1. Inspect before changing paths

Inspect the current frontend router, build output, asset base paths and admin/portal entrypoints before changing the copy layout. Record the discovered entrypoints and their current assumptions.

Do not invent a replacement route. If no non-conflicting app mount path can be established from existing configuration, stop and report the exact blocker rather than silently changing the public URL contract.

### B2. Correct Preview assembly

Modify `.github/workflows/pr-preview.yml` so that:

- `public-site/dist` remains the source of the Preview root.
- The frontend SPA root `index.html` cannot overwrite the public Vietnamese homepage.
- Any required app/admin/portal entrypoint is placed only at a verified, non-conflicting path consistent with the router and asset base configuration.
- Public-site assets, sitemap and robots files remain intact.
- Asset references resolve after final packaging.

Do not change `.github/workflows/pages.yml` under this authorization.

### B3. Validate the final assembled artifact

The validator must run against the final assembled `_preview/` artifact after all copy/assembly steps, not only against intermediate `public-site/dist`.

Minimum assertions:

- `_preview/index.html` is the generated public Vietnamese homepage.
- Root title, description, canonical, robots and VI/EN/x-default links are correct.
- `/en/` and representative public deep routes exist and have correct metadata.
- Admin/portal/app entrypoints, if included, remain at verified paths and their assets resolve.
- Final `sitemap.xml` and `robots.txt` are the public-site generated files.
- No SPA root collision or unintended private/admin content exposure occurs.

## 6. Required acceptance matrix

| Test ID | Requirement | Passing evidence |
|---|---|---|
| SEO-IX-01 | VI generic blog shell initial HTML | Contains `noindex,follow` without executing JS |
| SEO-IX-02 | EN generic blog shell initial HTML | Contains `noindex,follow` without executing JS |
| SEO-IX-03 | Generic shell sitemap exclusion | Neither shell URL is present |
| SEO-IX-04 | Sitemap integrity | Unique URLs; each is canonical, public and indexable |
| SEO-IX-05 | HTML/sitemap decoupling | Non-indexable generated HTML may be absent from sitemap |
| SEO-IX-06 | Blog listing policy | No empty/thin/unapproved listing is indexable |
| SEO-IX-07 | Future article guard | No article becomes indexable without the complete readiness gate |
| PREV-01 | Final Preview root | Root is the public VI homepage, not SPA shell |
| PREV-02 | Root metadata | Title, description, canonical, robots and hreflang/x-default correct |
| PREV-03 | Public route integrity | EN homepage and representative deep routes load/refresh correctly |
| PREV-04 | App/admin/portal paths | Verified entrypoints and assets do not collide with public root |
| PREV-05 | Sitemap/robots integrity | Final artifact contains generated public-site versions |
| PREV-06 | Artifact safety | No unexpected private/admin content or root collision |

For each test, retain a pass/fail result and direct evidence (file path, HTML excerpt, validator output, artifact inspection or workflow log). A green workflow alone is not sufficient evidence for every assertion.

## 7. Required delivery and evidence

Developer must provide:

1. Commit(s) on the existing working branch only.
2. Changed-file list and concise rationale for each change.
3. Tests added/updated and exact commands/workflows executed.
4. Final assembled Preview artifact inspection evidence.
5. Acceptance matrix with all test IDs marked Pass/Fail/Blocked.
6. Any unresolved issue, including the discovered app/admin/portal path mapping.
7. Confirmation that production Pages workflow, secrets, database and infrastructure were not changed.

QA must independently review the artifact and acceptance evidence under `05_QA_ACCEPTANCE_STANDARD.md`. Do not mark R-016 or R-017 closed until the relevant tests pass and evidence is reviewed.

## 8. Release gate

- Development completion does not equal QA acceptance.
- QA acceptance does not equal merge approval.
- PR #43 must remain unmerged until the Project Owner separately approves merge.
- No deployment or production configuration change is authorized by this handoff.
