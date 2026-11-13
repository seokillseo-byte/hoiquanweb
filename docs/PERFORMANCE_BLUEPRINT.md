# HOIQUANWEB — Performance Blueprint

**Status:** Phase 0 planning deliverable — draft; Core Web Vitals thresholds owner-approved under D-13 (Master Blueprint DEC-022); measurement evidence pending  
**Blueprint module:** 12 — Performance  
**Scope:** Core Preview P0 public bilingual website and its acceptance dependencies  
**Branch:** `docs/phase-0-master-blueprint-risk-review`  
**Review date:** 2026-11-13

---

## 1. Purpose

Define how performance is measured, optimized, monitored and accepted for the HOIQUANWEB Core Preview. This document is a planning and QA contract; it does not claim that any target has been achieved or that monitoring/load infrastructure is configured.

The governing standards require a Core Web Vitals strategy, frontend/backend/API/database performance, caching, CDN, asset/image/font/JavaScript/CSS optimization, lazy loading, critical rendering path, monitoring and performance KPIs. QA must cover Lighthouse, Core Web Vitals, load/stress testing, API/database performance, bundle size, cache and CDN validation.

## 2. Scope and boundaries

### In scope — Core Preview P0

- Public Vietnamese and English routes listed in `docs/URL_MAP.md`.
- Initial HTML, CSS, JavaScript, fonts, images and other public assets.
- Navigation, language switching, responsive layouts and direct route loading.
- Public static asset delivery and the configured hosting/CDN path, once the actual Preview URL and environment are confirmed.
- Consultation/quotation form performance only when a real API is configured; no API performance claim may be made from an inactive form shell.
- Performance regressions introduced by changes to the public Preview.

### Out of scope unless separately approved

- Customer Portal, advanced CMS, CRM expansion, commerce, booking, AI features and other deferred platform modules.
- Production traffic capacity or SLA commitments.
- Database/load capacity claims when the production database and runtime are not selected and configured.
- Third-party integrations not approved for Core Preview.

## 3. Performance objectives

1. Prioritize mobile user experience while also validating desktop.
2. Measure user-visible loading, interactivity and layout stability on representative public routes.
3. Keep the critical rendering path small and avoid unnecessary client-side work.
4. Optimize images, fonts, CSS, JavaScript and delivery without degrading content, accessibility or SEO.
5. Establish repeatable evidence and a regression baseline.
6. Apply the Project Owner-approved Core Web Vitals thresholds in section 10; do not treat any unapproved Lighthouse, bundle, API or load threshold as a project decision.
7. Design the public delivery path so static content can be served efficiently and scale is not dependent on unnecessary runtime work.

## 4. Required metrics and definitions

| Metric | What it measures | Collection / evidence |
|---|---|---|
| LCP | Largest Contentful Paint — loading experience | Lighthouse lab result; field data from CrUX/real-user monitoring if available |
| INP | Interaction to Next Paint — interaction responsiveness | Field data where available; controlled interaction checks in browser |
| CLS | Cumulative Layout Shift — visual stability | Lighthouse and field data where available |
| TTFB | Time to First Byte — server/edge response component | Browser performance trace / Lighthouse; record location and network profile |
| FCP | First Contentful Paint | Lighthouse |
| TBT | Total Blocking Time — lab diagnostic for main-thread blocking | Lighthouse |
| Initial HTML / document size | Weight of the initial document | Network panel / build artifact |
| Transfer size by asset type | HTML, JS, CSS, fonts, images and other assets | Browser network capture and build output |
| JavaScript bundle size | Shipped JavaScript and code-split chunks | Build analyzer or build manifest |
| Image efficiency | Dimensions, format, compression, responsive delivery and loading priority | Asset inspection and browser network capture |
| API latency and reliability | Inquiry API response time and error behavior | Only after a configured API exists; record p50/p95 and error rate |
| Load behavior | Response and error behavior under agreed concurrency | Only after environment, traffic profile and test authorization are approved |

Do not substitute TBT for INP or claim field Core Web Vitals from Lighthouse lab data. Report lab and field evidence separately.

## 5. Route and device test matrix

At minimum, select representative routes from the actual URL Map:

- Vietnamese homepage and its English equivalent.
- One service overview route and one service-detail route in each language.
- About and contact/inquiry routes in each language.
- One eligible content/article route only if real approved content and an indexable route exist.
- 404 route and a direct deep-link refresh.

The final route list and exact Preview URLs are **TBD until the assembled Preview artifact is corrected and an accessible Preview URL is supplied**. The root-route collision (XC-10/R-017) must be fixed before the homepage can be accepted as representative.

Test classes:

- Mobile: use the Lighthouse mobile preset and record its emulated viewport/device and throttling profile.
- Desktop: use the Lighthouse desktop preset and record its environment.
- Real devices / real networks: recommended validation where available; record device, browser, OS and connection rather than implying lab emulation is real-user data.
- Browsers: follow the supported browser matrix in the UI/QA specifications; record exact browser versions for reproducibility.

Do not invent a single “average site score” from unlike routes or test profiles.

## 6. Measurement protocol

1. Use the final assembled Preview, not only a local development server or an intermediate build directory.
2. Record commit SHA, Preview URL, date/time, test region, browser/tool version, device profile, viewport and network/throttling profile.
3. Run each selected route at least three times under the same lab profile; retain individual runs and report the median. If runs vary materially, report the spread and investigate rather than hiding outliers.
4. Capture Lighthouse reports and browser network traces. Preserve raw artifacts or stable report links with the QA record.
5. Record Core Web Vitals field data separately when a sufficient real-user dataset is available. If unavailable, state “field data unavailable”; do not fabricate it.
6. Repeat after material changes to route rendering, assets, fonts, dependencies, hosting/CDN or caching.
7. Compare like-for-like environments and profiles only. Do not compare local development results with Preview or production results as if they were equivalent.

**Current baseline:** Not established in this document. No current Lighthouse score, Web Vitals result, bundle size, API latency or load capacity is asserted.

## 7. Optimization strategy

### 7.1 Critical rendering path and frontend

- Deliver meaningful page content and SEO metadata in initial HTML for public routes; avoid making core content dependent on client-side hydration.
- Minimize render-blocking CSS and JavaScript; load non-critical code only when needed.
- Use route-level code splitting where it reduces initial payload without creating navigation regressions.
- Remove unused dependencies and duplicate code; do not add heavy libraries without a documented need.
- Avoid long main-thread tasks and unnecessary animation; respect reduced-motion preferences.
- Reserve image/media dimensions to prevent layout shifts.
- Keep above-the-fold content and primary CTA available without waiting for non-essential scripts.

### 7.2 Images and media

- Use appropriately sized responsive images and modern formats where supported by the delivery pipeline.
- Compress images while preserving acceptable visual quality.
- Do not lazy-load the actual LCP image when it is needed immediately; lazy-load below-the-fold non-critical images.
- Include intrinsic dimensions or aspect-ratio reservation.
- Avoid shipping full-resolution source images to small viewports.
- No unapproved stock or fabricated portfolio imagery may be introduced merely to improve visual density.

### 7.3 Fonts and CSS

- Limit font families, weights and subsets to those actually used.
- Prefer efficient font formats and self-hosting only where licensing and operational decisions permit.
- Use font-display behavior that avoids invisible text; verify layout stability after font swap.
- Remove unused CSS and avoid oversized global styles.
- Keep CSS selectors and component styles maintainable; do not trade correctness or accessibility for marginal score gains.

### 7.4 JavaScript

- Keep the public site shell lightweight.
- Defer non-critical scripts and third-party tags until their purpose and consent requirements are approved.
- Avoid duplicate analytics, tag managers or chat scripts.
- Verify that code splitting does not create broken deep links, missing content or delayed primary interactions.

### 7.5 Backend and API

- Core Preview is primarily a public website; production API topology remains TBD.
- If the inquiry API is enabled, measure endpoint latency and error rate under a documented test profile, validate server-side work and avoid synchronous non-essential work in the request path.
- Keep email notification delivery asynchronous from durable inquiry acceptance where the approved architecture supports it.
- Do not report API/database performance until the actual runtime and dependencies are configured and tested.

### 7.6 Database

- No database performance target is set while the production database/runtime is unapproved.
- If a database-backed inquiry API is introduced, capture query plans/slow-query evidence, index only demonstrated access patterns, avoid N+1 behavior and verify retention/deletion jobs do not create unacceptable operational load.
- Do not add database infrastructure to the static Preview solely to satisfy this planning document.

### 7.7 Caching and CDN

- Define cache behavior by asset type and mutability: fingerprinted static assets may use long-lived immutable caching; HTML and mutable route data require an explicit freshness/revalidation policy.
- Verify cache headers, cache hit/miss behavior and invalidation on the actual Preview host.
- Confirm CDN behavior and geographic test region once provider/hosting is known.
- Do not apply long-lived caching to inquiry responses, private data or non-public endpoints.
- Provider, cache TTL values and purge procedure remain **TBD** until the hosting/CDN configuration is accepted.

## 8. Load, stress and API testing

Load and stress tests are conditional, not currently authorized against an unspecified production system.

Before running them, document and approve:

- Target environment and URL.
- Test window and responsible operator.
- Expected normal and peak traffic profile.
- Concurrency, request mix, ramp-up and duration.
- Rate limits and provider restrictions.
- Stop conditions and monitoring.
- Whether test data is synthetic and how it will be removed.

For a configured inquiry API, include normal submission, validation rejection, duplicate submission, API timeout, dependency failure and retry scenarios. Do not send load to production without explicit owner approval.

## 9. Monitoring and regression control

- During Preview QA, retain per-run Lighthouse reports and build/network artifacts.
- After a production monitoring stack is selected, define real-user monitoring, alert thresholds, ownership, retention and incident response separately.
- Monitor field LCP, INP and CLS only when data collection is available and appropriately disclosed.
- Track route-level regressions rather than only a single homepage score.
- Any performance regression must be assessed against user impact, accessibility, SEO and reliability; a score improvement does not justify breaking functionality.

Monitoring provider, data retention, alert thresholds and operational ownership are **TBD**.

## 10. Project-specific acceptance thresholds — owner-approved Core Web Vitals

**Owner decision D-13 — Approved (2026-11-13; mapped as DEC-022 in Master Blueprint):** Core Web Vitals thresholds are approved as LCP ≤ 2.5 seconds, INP ≤ 200 milliseconds and CLS ≤ 0.1. Evaluate field data at p75 separately for mobile and desktop where sufficient data is available. Lab results (including Lighthouse) must be reported separately and must not be represented as field p75. The thresholds are acceptance criteria, not a claim that the current site meets them.

The thresholds below apply to Core Web Vitals only. Lighthouse score, TTFB, asset budgets, API latency and load/concurrency targets remain TBD until separately approved.

| Acceptance item | Proposed measurement basis | Project target | Status |
|---|---|---|---|
| LCP | Field p75 separately for mobile and desktop; lab result reported separately | ≤ 2.5 seconds | Owner-approved (D-13 / DEC-022) |
| INP | Field p75 separately for mobile and desktop | ≤ 200 milliseconds | Owner-approved (D-13) |
| CLS | Field p75 separately for mobile and desktop; lab result reported separately | ≤ 0.1 | Owner-approved (D-13) |
| Lighthouse Performance — mobile | Median of at least 3 equivalent runs per selected route | TBD | Owner decision required |
| Lighthouse Performance — desktop | Median of at least 3 equivalent runs per selected route | TBD | Owner decision required |
| TTFB | Agreed test region/profile; field and lab separated | TBD | Owner decision required |
| Initial HTML / JS / CSS / image budgets | Measured per route/build output | TBD | Owner decision required |
| API p95 latency and error rate | Only after API/runtime exists and test profile is approved | TBD | Conditional / owner decision required |
| Load/concurrency capacity | Approved traffic model and test environment | TBD | Conditional / owner decision required |

For a route/device segment without sufficient field data, record the field result as unavailable and use lab diagnostics for investigation only; do not claim field acceptance from Lighthouse. Record route coverage, p75 sample availability and any data-collection limitations.

## 11. Dependencies and risks

| ID | Dependency / risk | Current state | Required handling |
|---|---|---|---|
| PERF-DEP-01 | Correct assembled Preview homepage and route integrity | Blocked by XC-10/R-017 | Fix packaging and verify final artifact before baseline |
| PERF-DEP-02 | Accessible Preview URL and stable environment | TBD | Record exact URL, commit and hosting profile |
| PERF-DEP-03 | Core Web Vitals thresholds | Approved under D-13 / DEC-022; other numeric targets remain TBD | Apply approved thresholds and obtain separate decisions for other metrics |
| PERF-DEP-04 | Production host/CDN/cache configuration | TBD | Do not assume provider or settings |
| PERF-DEP-05 | Inquiry API/runtime | Not accepted/configured | API testing remains conditional |
| PERF-DEP-06 | Field data / RUM availability | Not established | Report unavailable rather than fabricate |
| PERF-DEP-07 | Load profile and test authorization | Not defined | Do not run load/stress tests against production without approval |

## 12. Deliverables and acceptance evidence

| Deliverable ID | Deliverable | Required evidence |
|---|---|---|
| PERF-01 | Route/device test matrix | Route URLs, language, page type, device/browser profile |
| PERF-02 | Performance baseline | Raw Lighthouse reports, run metadata, median and variability |
| PERF-03 | Core Web Vitals report | Field data source and p75 where available; lab evidence separately |
| PERF-04 | Asset and bundle report | Build output, JS/CSS/font/image transfer sizes and optimization notes |
| PERF-05 | Cache/CDN validation | Response headers, cache behavior and provider/region evidence |
| PERF-06 | API/database performance report | Only if configured; test profile, p50/p95, errors and query evidence |
| PERF-07 | Load/stress report | Approved environment/profile, results, stop conditions and cleanup |
| PERF-08 | Monitoring plan | Provider, metrics, alerting, ownership and retention decisions |
| PERF-09 | Performance acceptance record | Approved thresholds, route coverage, evidence, defects and owner disposition |

## 13. Acceptance criteria

The Performance Blueprint is ready for owner review when:

- [x] Required performance deliverables from the supplied Blueprint Standard are mapped in this document.
- [x] Metrics and lab-versus-field distinctions are defined.
- [x] Test protocol, route/device matrix, optimization strategy and evidence requirements are documented.
- [x] Unknown infrastructure/runtime choices remain explicitly TBD.
- [x] Project Owner approves Core Web Vitals thresholds (LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1) and p75 mobile/desktop evaluation under D-13 / DEC-022.
- [ ] Other numeric performance targets (Lighthouse, TTFB, asset budgets, API and load) are separately approved if needed.
- [ ] A corrected, accessible assembled Preview is measured and a reproducible baseline is attached.
- [ ] Applicable cache/CDN and API checks are completed against configured environments.
- [ ] QA records defects, retest evidence and final owner disposition.

**Current status:** Core Web Vitals acceptance thresholds are owner-approved under D-13. No performance test has been claimed as run or passed by this document. Module 12 remains open until a corrected accessible Preview is measured and evidence is accepted.

## 14. Change control

- Any change to owner-approved Core Web Vitals thresholds, test profiles, route coverage or production load-test scope requires Project Owner approval.
- Do not convert lab scores, source observations or generic vendor guidance into owner-approved project targets.
- Do not mark performance accepted based on build success, CI success or a single Lighthouse run.
- Keep performance status separate for local, CI, Preview, staging and production environments.
