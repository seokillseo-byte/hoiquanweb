# HOIQUANWEB — Development Report: XC-03 & XC-10

**Date:** 2026-11-13  
**Repository:** seokillseo-byte/hoiquanweb  
**PR:** [#43](https://github.com/seokillseo-byte/hoiquanweb/pull/43)  
**Branch:** docs/phase-0-master-blueprint-risk-review  
**Final code/test commit:** 52169201a4e8837ee7bd226f0eb7b61a216f7be8  
**Development report/docs commit:** 27d8564cd643caff5cd3a56db8c510b198e3c786  
**Development status:** Implemented; automated CI passed  
**QA status:** Independent QA review pending  
**Release status:** Not merged; not deployed

---

## 1. Summary

Implemented the approved work packages XC-03/R-016 and XC-10/R-017 directly on the existing PR branch.

### XC-03 — SEO indexation

- Added explicit route-level indexability metadata to the public-site generator.
- VI/EN blog listing routes and generic blog-detail shell routes now emit noindex,follow in initial HTML.
- Sitemap generation now includes only routes explicitly eligible for indexation.
- Validator no longer requires sitemap URL count to equal all generated HTML route count.
- Validator checks canonical paths, indexability, duplicate sitemap entries, noindex exclusions and Vietnamese x-default mapping.
- Query-slug and unqualified dynamic article routes are guarded from indexation.

**Important residual gap:** Clean-slug URLs and article-specific initial HTML for dynamic published blog posts are not implemented in this task. Those posts remain outside the sitemap and must not be indexed until the full article readiness gate is implemented and accepted.

### XC-10 — PR Preview assembly

- Frontend Vite build now uses the existing VITE_BASE_PATH setting with /platform/ for the isolated Preview.
- Frontend SPA output is assembled under _preview/platform/; it no longer overwrites the public homepage at _preview/index.html.
- Removed redundant copying of root portal.html, which had overwritten the generated portal file with an unresolved API-base placeholder.
- Added final-artifact validation after all copy/assembly steps.
- Added HTTP smoke checks for root, VI/EN routes, representative deep routes, admin, portal, platform and generated platform assets. Public deep routes are requested twice to simulate direct load and refresh.

The /platform/ mount is confined to the isolated PR Preview and uses the Vite base-path configuration already present in the repository. It is not a new public production route.

## 2. Changed files

| File | Change |
|---|---|
| scripts/build_public_site.mjs | Explicit indexability per route; blog listing/detail shells noindex; sitemap filters non-indexable routes |
| scripts/validate_public_site.mjs | Validate indexable route set, sitemap integrity, x-default, noindex shells and final Preview artifact; add HTTP smoke tests |
| .github/workflows/pr-preview.yml | Build SPA with /platform/ base; isolate app output; preserve generated portal; validate final artifact before upload |
| docs/RISK_ASSESSMENT.md | Record implementation evidence and residual risk state |
| docs/BLUEPRINT_CROSS_CHECK.md | Update XC-03/XC-10 findings, implementation status and acceptance evidence |
| docs/SEO_INDEXATION_AND_PREVIEW_REMEDIATION.md | Record completed implementation and current acceptance status |
| docs/DEVELOPMENT_HANDOFF_XC03_XC10.md | Link implementation report and QA handoff |
| docs/DEVELOPMENT_REPORT_XC03_XC10.md | This report |

No changes were made to .github/workflows/pages.yml, database schema, secrets, Cloudflare resources, production configuration or infrastructure.

## 3. CI evidence

### Validate website and API

- Workflow run: [#391 — 43395058445](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43395058445)
- Conclusion: **success**
- Project validation: passed.
- Staging config guardrails: passed; live staging config remains unprovisioned.
- API/auth tests: 20 tests passed, 0 failed.
- Frontend typecheck: passed.
- Frontend build: passed.
- Public site generation: 40 localized HTML routes.
- Public-site validator: passed; 36 indexable routes and 4 noindex routes.
- SEO-IX-01 through SEO-IX-07: passed.

### Build isolated PR Preview

- Workflow run: [#218 — 43395058389](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43395058389)
- Conclusion: **success**
- Project and staging-config validation: passed.
- Dependency installation: passed.
- Frontend typecheck/build with VITE_BASE_PATH=/platform/: passed.
- Public website generation: passed.
- Preview assembly: passed.
- Final assembled artifact validation: passed.
- PREV-01 through PREV-06: passed.
- Preview artifact upload: passed.

**Final artifact:** [hoiquanweb-pr-43-preview](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43395058389/artifacts/14021259542)

- Artifact ID: 14021259542
- Size: 203,344 bytes
- SHA-256: df973dca75e1a47da5cad40d8eb2f0836635a0afc09ca880cad6ae9c1435abe4
- Retention expiry shown by GitHub: 2026-11-20

## 4. Acceptance matrix

### SEO indexation

| Test ID | Result | Evidence |
|---|---|---|
| SEO-IX-01 | PASS | VI generic blog-detail initial HTML contains noindex |
| SEO-IX-02 | PASS | EN generic blog-detail initial HTML contains noindex |
| SEO-IX-03 | PASS | Both generic shells and both blog listings are absent from sitemap |
| SEO-IX-04 | PASS | Sitemap URLs are unique, canonical and explicitly indexable |
| SEO-IX-05 | PASS | Four generated noindex HTML routes exist outside sitemap |
| SEO-IX-06 | PASS | Client-hydrated blog listings remain noindex |
| SEO-IX-07 | PASS | No query-slug or unqualified dynamic article route is indexable |

### Preview assembly

| Test ID | Result | Evidence |
|---|---|---|
| PREV-01 | PASS | Final Preview root is generated Vietnamese public homepage |
| PREV-02 | PASS | Root title, canonical, robots and VI/EN/x-default alternates verified |
| PREV-03 | PASS | Root, EN homepage and representative VI/EN deep routes returned HTTP 200 on direct and repeat requests |
| PREV-04 | PASS | Admin, portal, /platform/ and generated platform assets returned HTTP 200; app assets exist under the isolated base path |
| PREV-05 | PASS | Final artifact contains generated public sitemap and robots; non-public entrypoints are excluded from sitemap |
| PREV-06 | PASS | Root collision absent; admin, portal and platform entrypoints remain noindex and outside sitemap |

The HTTP smoke test uses a temporary local static server against the final assembled CI artifact. It is not a live production URL test.

## 5. Remaining issues and risk status

### R-016 — remains OPEN / Critical

The current guard is implemented and tested. However, dynamic published blog articles still do not have clean slug routes and article-specific initial HTML. They remain excluded from the sitemap. A later, separately scoped implementation must provide SSR, prerender or static generation and pass the complete article readiness gate before any dynamic article is indexable.

### R-017 — Development remediation complete; QA pending

The final Preview artifact preserves the public homepage at /, isolates the app at /platform/, retains generated portal output and passes the final-artifact HTTP smoke checks. Independent QA review is still required before closing the risk.

## 6. Git and release status

- Working branch: docs/phase-0-master-blueprint-risk-review
- Final commit: 52169201a4e8837ee7bd226f0eb7b61a216f7be8
- PR #43: open, not merged.
- Merge: not performed.
- Deployment: not performed.
- Production Pages workflow: unchanged.
- Secrets, database, Cloudflare resources and infrastructure: unchanged.

**Handover:** Ready for independent QA review under 05_QA_ACCEPTANCE_STANDARD.md. Development completion does not close R-016/R-017, approve merge or authorize deployment.
