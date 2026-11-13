# HOIQUANWEB — Independent QA Review: XC-03 / XC-10 Preview Artifact

**Review status:** Partial independent artifact QA — selected checks passed; full Core Preview acceptance remains pending  
**Review date:** 2026-11-13  
**Repository:** `seokillseo-byte/hoiquanweb`  
**PR:** [#43](https://github.com/seokillseo-byte/hoiquanweb/pull/43)  
**Branch:** `docs/phase-0-master-blueprint-risk-review`  
**Artifact source:** GitHub Actions run [#218 — 43395058389](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43395058389)  
**Artifact:** [hoiquanweb-pr-43-preview](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43395058389/artifacts/14021259542)  
**Artifact ID:** 14021259542  
**Artifact size:** 203,344 bytes  
**Artifact SHA-256:** `df973dca75e1a47da5cad40d8eb2f0836635a0afc09ca880cad6ae9c1435abe4`  
**Code implementation baseline reviewed:** `52169201a4e8837ee7bd226f0eb7b61a216f7be8`  
**Release status:** Not merged; not deployed to production

---

## 1. QA scope and limitations

This review independently downloaded and inspected the final assembled static PR Preview artifact from GitHub Actions, extracted it, and served it with a local static HTTP server. It covers artifact structure, route responses, sitemap/canonical/indexability consistency and the presence of the expected static entrypoints.

This review does **not** establish:
- Cloudflare Worker, D1 or R2 runtime operation.
- Better Auth login/session/cookie/CORS behavior against a real staging origin.
- Live inquiry submission, email delivery, retry or retention behavior.
- Full browser/device visual QA, accessibility or usability acceptance.
- Production deployment, security certification or Core Preview final acceptance.

The artifact README itself states that it is a static frontend preview and must not be used with real customer data or credentials.

## 2. Artifact integrity

| Check | Result | Evidence |
|---|---|---|
| ZIP downloaded from the recorded GitHub Actions artifact | PASS | Artifact ID 14021259542 |
| Artifact size matches development report | PASS | 203,344 bytes |
| SHA-256 matches development report | PASS | `df973dca75e1a47da5cad40d8eb2f0836635a0afc09ca880cad6ae9c1435abe4` |
| Extracted artifact structure | PASS | 51 files |

## 3. HTTP route and asset checks

A local HTTP server was started against the extracted artifact. All 36 URLs in the generated sitemap were requested directly.

| Check | Result |
|---|---:|
| Sitemap URLs requested | 36 |
| HTTP 200 | 36 |
| Failed responses | 0 |
| Duplicate sitemap URLs | 0 |
| Sitemap URL missing from artifact | 0 |
| Sitemap canonical mismatch | 0 |
| Sitemap URL marked noindex | 0 |

Additional direct requests:

| Path | HTTP | Result |
|---|---:|---|
| `/` | 200 | PASS — generated Vietnamese homepage |
| `/en/` | 200 | PASS — English homepage |
| `/admin.html` | 200 | PASS — static Admin UI entrypoint |
| `/portal.html` | 200 | PASS — static Portal UI entrypoint |
| `/platform/` | 200 | PASS — isolated SPA entrypoint |
| `/platform/assets/index-CHgcRs-R.js` | 200 | PASS |
| `/platform/assets/index-CCT5DBxr.css` | 200 | PASS |
| `/sitemap.xml` | 200 | PASS |
| `/robots.txt` | 200 | PASS |
| `/blog/post/` | 200 | PASS — generic VI article shell is noindex |
| `/en/blog/post/` | 200 | PASS — generic EN article shell is noindex |

## 4. XC-03 — SEO indexation review

| Test | Result | Evidence |
|---|---|---|
| VI generic blog detail shell has initial-HTML `noindex` | PASS | `/blog/post/` |
| EN generic blog detail shell has initial-HTML `noindex` | PASS | `/en/blog/post/` |
| Generic shells excluded from sitemap | PASS | Neither route occurs in 36 sitemap URLs |
| Sitemap entries are unique | PASS | 36 unique URLs |
| Sitemap entries resolve to artifact HTML | PASS | 36/36 HTTP 200 |
| Sitemap entries are canonical and indexable | PASS | 0 canonical mismatch; 0 noindex entries |
| Dynamic article SEO readiness | **BLOCKED / NOT IMPLEMENTED** | Clean-slug article routes and article-specific initial HTML remain absent |

**Disposition:** The shell/indexation guard is independently verified against the assembled artifact. R-016 remains **Critical / Open** because the actual dynamic published-article URL and article-specific initial HTML requirements have not been implemented and accepted. Do not index dynamic article URLs.

## 5. XC-10 — Preview assembly review

| Test | Result | Evidence |
|---|---|---|
| Public Vietnamese homepage remains at artifact root | PASS | `index.html` contains Vietnamese title and canonical |
| Root canonical points to approved production canonical | PASS | `https://hoiquanweb.io.vn/` |
| VI/EN alternates and Vietnamese x-default are present | PASS | Root initial HTML |
| SPA is isolated under `/platform/` | PASS | Entrypoint and assets use `/platform/assets/...` |
| Admin, Portal and Platform are noindex | PASS | Initial HTML metadata |
| Admin, Portal and Platform are excluded from sitemap | PASS | Not present in sitemap |
| Final asset references resolve | PASS | JS/CSS both HTTP 200 |
| Static Admin/Portal API runtime | **NOT TESTED / NOT CONFIGURED** | `hq-api-base` is empty in both entrypoints |

**Disposition:** The specific root-route collision remediation is independently verified at static-artifact level. R-017 may be downgraded only after the Project Owner accepts the artifact review and any required visual/browser checks are completed. This report alone does not close the risk.

## 6. Safety and operational observations

- The artifact README explicitly warns that this is static frontend output only and does not start Worker, create D1 or prove Better Auth runtime behavior.
- Admin and Portal HTML are directly accessible as static files in the artifact. Their presence is not evidence that protected data or authenticated API access works.
- Both Admin and Portal have an empty `hq-api-base`; no live API or credentials were configured in this artifact.
- Admin, Portal and Platform are marked `noindex,nofollow` and omitted from sitemap. `robots.txt` also disallows `/admin.html`.
- Do not enter real credentials, customer information or production secrets into this static Preview.

## 7. Overall QA disposition

**Partial PASS — static artifact checks only.**

Passed:
- Artifact integrity.
- 36/36 sitemap route HTTP checks.
- Canonical and sitemap consistency.
- Generic blog-shell noindex exclusion.
- Root homepage preservation.
- Platform base-path asset resolution.
- Static Admin/Portal/Platform entrypoint metadata.

Still open:
1. R-016 dynamic article clean-slug and article-specific initial HTML.
2. Full visual/UI/UX/responsive/browser/accessibility QA.
3. Real staging API, authentication, authorization, CORS/cookie and D1/R2 integration tests.
4. Inquiry form, email outbox, retry, duplicate handling, retention and restore/delete tests.
5. Performance baseline and field/lab evidence.
6. Project Owner acceptance and final Core Preview QA score under the supplied QA Acceptance Standard.

This review is not Final Acceptance, Gate 2 approval, merge approval or Production approval.

---

## 8. Evidence links

- [Development Report XC-03 / XC-10](DEVELOPMENT_REPORT_XC03_XC10.md)
- [Development Handoff XC-03 / XC-10](DEVELOPMENT_HANDOFF_XC03_XC10.md)
- [Risk Assessment](RISK_ASSESSMENT.md)
- [HDO-019 — Project Governance & Development Readiness](HDO-019_PROJECT_GOVERNANCE_AND_DEVELOPMENT_READINESS.md)
- [PR #43](https://github.com/seokillseo-byte/hoiquanweb/pull/43)
