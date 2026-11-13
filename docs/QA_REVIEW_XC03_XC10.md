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

---

## 9. Supplemental independent review — latest PR artifact

**Review refresh:** 2026-11-13  
**PR HEAD reviewed:** 81b8cd4937c6c88cbd22f4af604ee6748fd66ba5  
**Validation workflow:** [Validate website and API — run 43408429570](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43408429570) — completed, **success**  
**Preview workflow:** [Build isolated PR Preview — run 43408429572](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43408429572) — completed, **success**  
**Artifact:** [hoiquanweb-pr-43-preview — artifact 14028885257](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43408429572/artifacts/14028885257)  
**Artifact ZIP size:** 203,344 bytes  
**Artifact ZIP SHA-256:** f9376ac68d6dbdb4ae659c03f34fdd6185c0c91851ad45c55ece4a14ca210d78  
**Extracted structure:** 51 files, including 44 HTML files; 40 localized public route HTML documents.

### 9.1 Repeated artifact and SEO checks

The latest artifact was downloaded from the recorded GitHub Actions artifact, extracted and independently inspected. A local static HTTP server was used for route checks.

| Check | Result | Evidence |
|---|---|---|
| Artifact integrity | PASS | Artifact ID 14028885257; SHA-256 above |
| Localized public HTML routes | PASS | 40 generated VI/EN route documents found |
| Canonical/hreflang checks across localized routes | PASS | All 40 had exactly one canonical and vi/en/x-default alternates; zero invariant failures |
| Vietnamese x-default | PASS | All 40 localized route documents had x-default equal to their Vietnamese alternate |
| Sitemap URLs | PASS | 36 unique URLs |
| Sitemap route HTTP checks | PASS | 36/36 returned HTTP 200 |
| Sitemap route files missing | PASS | 0 |
| Sitemap canonical mismatches | PASS | 0 |
| Sitemap entries marked noindex | PASS | 0 |
| Blog listing and generic article shells | PASS | Both VI/EN listing routes and both generic article shells are noindex and excluded from sitemap |
| Root homepage | PASS | Root title, canonical and VI/EN/x-default metadata belong to the Vietnamese public homepage |
| Platform application assets | PASS | /platform/assets/index-CHgcRs-R.js and /platform/assets/index-CCT5DBxr.css both exist and resolve in the extracted artifact |
| Admin/Portal/Platform metadata | PASS | Static entrypoints are noindex and excluded from sitemap |

Additional local HTTP smoke checks returned HTTP 200 for /, /en/, /admin.html, /portal.html, /platform/, platform JS/CSS, /sitemap.xml, /robots.txt, both generic article shells, both blog listing paths, a project detail route and an English service detail route.

### 9.2 Content and inquiry observations — acceptance blockers

These are observations from the extracted public HTML and script, not authorization to change copy or behavior:

1. **Unapproved positioning/tagline:** the phrase “Your All-in-One Technology Partner” appears repeatedly in the public header/footer; the Vietnamese equivalent “Đối tác công nghệ của bạn” is used in the homepage hero. DEC-013 does not authorize an unsupported USP or differentiating claim. The Owner must approve this positioning with evidence or the copy must be revised to the approved factual description before public content acceptance.
2. **Portfolio publication status:** the homepage labels the section “DỰ ÁN ĐÃ THỰC HIỆN” and lists FunLink, Entity Manager and Social Media Automation. Project Input Traceability marks these descriptions/publication rights/status as conditional on Owner approval. Verify each project's public status, factual description and publication permission before treating this section as accepted.
3. **Process and service claims:** phrases about project requirements, scope, milestones, handover and support appear in public copy. Confirm that they describe actual operating practice and approved service scope; do not treat the existence of the text as evidence of an established policy or SLA.
4. **Privacy notice remains incomplete:** the VI/EN privacy pages explicitly state that legal identity, contact channel and applicable retention/deletion policy must be completed before real submissions. The Owner-approved 24-month retention and reset/deletion rules must be reflected accurately, and the legal/contact details and backup lifecycle must be resolved before F-009 can pass.
5. **Inquiry fallback behavior:** the current public script checks the API base. With an empty API base, it downloads a local project-brief text file and explicitly tells the visitor that no data was sent to a server. It does not show a server-received success message in that branch. This is appropriate for a static Preview, but the live API/email path remains unconfigured and untested.
6. **Administrative entrypoints:** admin.html and portal.html are present as static files, with example API URL fields and empty hq-api-base. They are not proof of live protected application runtime. Do not enter real credentials or customer data in this artifact.

### 9.3 Updated QA disposition

- **XC-03 generic-shell guard:** PASS at static artifact level.
- **XC-10 root collision / platform path:** PASS at static artifact level.
- **R-016:** remains **CRITICAL / OPEN** because individual published articles still lack clean-slug URLs and article-specific initial HTML. The bounded handoff explicitly says not to create or enable new article routes or CMS publishing features in this work package.
- **R-017:** remains **HIGH / OPEN** because this static artifact inspection does not include full visual/browser/responsive/accessibility/usability QA or Project Owner acceptance.
- **F-009:** remains **BLOCKED** because privacy/legal details, live API, verified mailbox/sender, email delivery and end-to-end retention/deletion evidence are incomplete.
- **Content acceptance:** remains pending Owner confirmation of tagline/positioning, project publication rights/status, and process/service claims.

The latest two CI workflows succeeded on the exact reviewed PR HEAD. This does not convert the static artifact into a hosted Preview URL or prove Worker/D1/R2, authentication, email, performance field data or production operation.
### 9.4 Artifact refresh on latest checked PR HEAD

After the documentation updates, the isolated Preview workflow was rerun on latest checked PR HEAD 2d83b9d6d56c3b1a647d33eaac9845438dbf0763:

- Validate website and API — [run 43408897535](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43408897535): completed, success.
- Build isolated PR Preview — [run 43408897677](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43408897677): completed, success.
- Latest artifact — [artifact 14028652129](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43408897677/artifacts/14028652129), 203,344 bytes; ZIP SHA-256 d6d68da24e0cee651802c85e8151e59fd5cfe9cf34c5baadfd026f78e6590551.
- The artifact was downloaded and rechecked: 51 files, 44 HTML documents, 40 localized public route documents, 36 unique sitemap URLs, 36/36 route files present, zero sitemap canonical mismatches, zero noindex sitemap entries, zero localized canonical/hreflang/x-default invariant failures, and both /platform/ JS/CSS asset references resolve.
- The latest artifact contains the same public static route and indexation behavior as the previously inspected artifact. Full visual/browser/responsive/accessibility and live-runtime checks remain unperformed.

This refresh is the latest artifact evidence for PR HEAD 2d83b9d. The current QA disposition and open risks in section 9.3 are unchanged.

### 9.5 Latest artifact verification — PR HEAD 388aa6ef

**Review refresh:** 2026-11-13  
**PR HEAD:** `388aa6ef53d106f181b8983a7d9021e245d7086c`  
**Validation workflow:** [Validate website and API — run 43409087189](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43409087189) — completed, **success**. All steps in the validate job completed successfully, including API/auth boundary tests, local Worker/D1 integration tests, frontend typecheck/build, bilingual site generation and public-site validation.  
**Preview workflow:** [Build isolated PR Preview — run 43409087020](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43409087020) — completed, **success**. All steps completed successfully, including staging-config guardrails, final assembled Preview validation and artifact upload.  
**Artifact:** [hoiquanweb-pr-43-preview — artifact 14028672376](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43409087020/artifacts/14028672376)  
**Artifact ZIP size:** 203,344 bytes  
**Artifact ZIP SHA-256:** `221bd701c120ac744c4ffc0c5bbaee4a51c528267a0de349221e91c4fb3f00c2`  
**Extracted structure:** 51 files, 44 HTML documents, 40 localized public route documents.

#### 9.5.1 Repeated static artifact checks

The exact artifact produced from PR HEAD `388aa6ef` was downloaded, SHA-256 verified, extracted and independently inspected.

| Check | Result | Evidence |
|---|---|---|
| Artifact integrity | PASS | Artifact ID 14028672376; SHA-256 above |
| Localized public route documents | PASS | 40/40 documents contain canonical and VI/EN/x-default alternates |
| Canonical/hreflang invariants | PASS | 0 missing canonical, 0 missing alternates, 0 x-default-to-Vietnamese mismatches, 0 canonical/alternate mismatches |
| Sitemap URLs | PASS | 36 unique URLs |
| Sitemap route files | PASS | 36/36 local route files exist |
| Sitemap duplicates | PASS | 0 |
| Sitemap canonical mismatches | PASS | 0 |
| Noindex URLs in sitemap | PASS | 0 |
| Generic blog listing/article shells | PASS | VI/EN listing and generic article shells remain noindex and excluded from sitemap |
| Root homepage | PASS | Vietnamese public homepage at `/`, with canonical and language alternates |
| Platform application assets | PASS | Both `/platform/assets/index-CHgcRs-R.js` and `/platform/assets/index-CCT5DBxr.css` exist in the artifact |
| Admin/Portal/Platform metadata | PASS | Static entrypoints remain noindex and excluded from sitemap |

These checks are static artifact inspection. The asset files were verified to exist in the extracted artifact; no claim is made here about hosted production delivery or Worker/D1/R2 runtime.

#### 9.5.2 Updated disposition

- CI is now **2/2 successful on exact PR HEAD `388aa6ef`**; this supersedes the older CI-head caveat in section 9.4.
- XC-03 generic-shell/indexation guard and XC-10 root collision/platform asset assembly remain **PASS at static artifact level**.
- R-016 remains **CRITICAL / OPEN**: dynamic published articles still lack clean-slug URLs and article-specific initial HTML. The current bounded handoff does not authorize implementing those routes or CMS publishing behavior.
- R-017 remains **HIGH / OPEN**: full visual/browser/responsive/accessibility/usability QA and Project Owner acceptance have not been completed.
- F-009 remains **BLOCKED** for live collection: privacy/legal copy, mailbox/sender verification, live API/email configuration and end-to-end retention/deletion evidence remain incomplete.
- Public content acceptance remains pending Owner disposition of positioning/tagline, portfolio status/rights and process/service claims.

The latest CI and artifact checks do not establish full Core Preview acceptance, Gate 2 approval, merge approval, deployment or production readiness.


### 9.6 Artifact refresh on PR HEAD 29a189a

**Review refresh:** 2026-11-13  
**PR HEAD:** `29a189a787281c925fb034be16f42e118ac8ca8a`  
**Validation workflow:** [Validate website and API — run 43409687056](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43409687056) — completed, **success**.  
**Preview workflow:** [Build isolated PR Preview — run 43409687119](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43409687119) — completed, **success**.  
**Artifact:** [hoiquanweb-pr-43-preview — artifact 14028368167](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43409687119/artifacts/14028368167)  
**Artifact ZIP size:** 203,344 bytes  
**Artifact ZIP SHA-256:** `30735b0e303c8b2fa8125d69062d8060f1bc124104c1e20939e854215b4f2289`  
**Extracted structure:** 51 files, 44 HTML documents, 40 localized public route documents.

The artifact was downloaded and SHA-256 verified, then independently inspected again:

| Check | Result | Evidence |
|---|---|---|
| Artifact integrity | PASS | Artifact ID 14028368167; SHA-256 above |
| Localized route SEO invariants | PASS | 40/40 canonical + vi/en/x-default; 0 failures |
| Sitemap URLs | PASS | 36 unique URLs |
| Sitemap route files | PASS | 36/36 present |
| Sitemap duplicates | PASS | 0 |
| Sitemap canonical mismatches | PASS | 0 |
| Noindex entries in sitemap | PASS | 0 |
| Platform JS/CSS assets | PASS | Both referenced files exist |
| Generic VI/EN blog shells | PASS | Noindex and excluded from sitemap |
| Root homepage | PASS | Vietnamese public homepage remains at / |

**Disposition:** CI and artifact checks are **2/2 PASS** on PR HEAD `29a189a`. XC-03 and XC-10 static artifact checks remain passed. R-016 remains Critical/Open; R-017 remains High/Open; F-009 remains blocked for live collection; content Owner acceptance remains pending. These checks do not establish full visual/browser/accessibility QA, hosted runtime, production readiness, Gate 2 approval, merge approval or deployment.

This is an evidence refresh only; it does not expand the existing XC-03/XC-10 authorization.


### 9.7 Evidence refresh on current PR #43 HEAD

**Refresh date:** 2026-11-13  
**PR HEAD:** `8bac71df67c2ef22e8a5ab704dbb87530af414e3`  
**Validation workflow:** [Validate website and API — run 43449166280](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43449166280) — completed, **success**.  
**Preview workflow:** [Build isolated PR Preview — run 43449166305](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43449166305) — completed, **success**.  
**Artifact:** [hoiquanweb-pr-43-preview — artifact 14049751657](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43449166305/artifacts/14049751657)  
**Artifact size:** 203,344 bytes  
**GitHub artifact SHA-256 digest:** `1483f94030397d516bebe5ba6562fa37395fd7d36bf9c773ae206229b7824061`

The refreshed artifact was downloaded and its top-level structure inspected. It contains the generated public root `index.html`, the isolated `platform/index.html`, `admin.html`, `portal.html`, localized route directories, `sitemap.xml` and the static assets directory. The root document is the Vietnamese public homepage with an indexable robots directive and canonical URL `https://hoiquanweb.io.vn/`.

This refresh records the current PR HEAD and successful CI/artifact generation. It does **not** repeat the complete 40-route canonical/hreflang and 36-URL sitemap audit already recorded in §9.6, and does not replace full visual/browser/responsive/accessibility QA or Project Owner acceptance.

**Disposition:** Current PR #43 HEAD has **2/2 CI workflows successful** and a new Preview artifact available. R-016 remains Critical/Open; R-017 remains High/Open; F-009 remains blocked for live collection. Gate 2, merge and deployment remain unapproved. This evidence refresh does not expand the existing XC-03/XC-10 authorization.


### 9.8 Evidence refresh on current documentation HEAD and Admin UI workstream

**Refresh date:** 2026-11-13  
**PR #43 HEAD:** `bddf27a8b76cb90b140f7f25f605f481c2312bd6` (documentation-only QA evidence update; application implementation unchanged from `8bac71d`).  
**Validation workflow:** [Validate website and API — run 43453802718](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43453802718) — completed, **success**.  
**Preview workflow:** [Build isolated PR Preview — run 43453802707](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43453802707) — completed, **success**.  
**Artifact:** [hoiquanweb-pr-43-preview — artifact 14051693406](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43453802707/artifacts/14051693406)  
**Artifact size:** 203,344 bytes  
**GitHub artifact SHA-256 digest:** `3246e7a3f81b97c069a04aa966506611a49738aa5d6f42b5a6a9d2cbcb791c82`

The artifact was generated successfully by CI. Independent full extraction and route-by-route inspection of this latest artifact remain outstanding. The previous artifact 14049751657 had its top-level structure inspected and contained the public root homepage and isolated `/platform/` entrypoint. Do not transfer that inspection claim to artifact 14051693406.

**Separate Admin UI workstream — PR #49:**
- Current Admin UI commit: `bf8292f289e78842d7a890559d0159cdbf6afa3c`.
- Validate website/API run 43451427869 and isolated Preview run 43451427714 both completed successfully.
- Codex code review completed without findings on that exact commit; three earlier inline review findings were resolved.
- PR #49 remains Draft and unmerged. The refreshed Admin artifact 14051055530 is based on `main`, while PR #43 is a separate unmerged branch. There is no combined, CI-verified full-site artifact containing both PR #43 public-site changes and PR #49 Admin changes.
- Browser-based visual review, Worker/D1 staging integration and authenticated end-to-end acceptance remain outstanding.

**Disposition:** PR #43 latest HEAD has 2/2 CI workflows successful and a newly generated Preview artifact. PR #49 Admin UI code review and CI are successful, but full Admin acceptance is incomplete. R-016 remains Critical/Open; R-017 remains High/Open; F-009 remains blocked for live collection. Gate 2, merge and deployment remain unapproved.

This is a documentation/evidence refresh only. It does not authorize combining branches, changing application code outside existing work packages, merging or deploying.
