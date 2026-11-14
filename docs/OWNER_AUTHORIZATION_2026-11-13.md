# Project Owner Development Authorization — 2026-11-13

**Project:** HOIQUANWEB.IO.VN  
**Decision owner:** Project Owner  
**Decision date:** 2026-11-13  
**Status:** Authorized for continued implementation; not a production or release approval.

## Owner instruction

The Project Owner stated:

> “Hoàn thiện toàn bộ, bao gồm giao diện, chức năng, backend và SEO.”

and then confirmed:

> “ok tiếp tục triển khai để hoàn thành công việc cho tôi”

## Authorized development scope

Continue implementation to completion across the existing HOIQUANWEB project scope, including:

- Public website UI/UX and responsive behavior.
- Admin interface and CMS workflows.
- Product features and business workflows defined by the Master Blueprint.
- Backend APIs, database integration, authentication, authorization and security.
- Customer portal and CRM capabilities in their planned phases.
- Technical SEO, CMS article rendering, metadata, canonical/hreflang, structured data, sitemap and performance work.
- Automated tests, documentation, QA evidence and controlled Preview validation.

Work must follow the existing Master Blueprint, approved URL Map, Implementation Roadmap and project standards. Implement phase by phase; do not invent new business requirements or treat deferred modules as P0 without recording the roadmap phase.

## Explicit exclusions

This authorization does NOT authorize:

- Merging PRs or pushing directly to main.
- Deploying staging or production environments.
- Changing production Cloudflare resources, DNS, secrets, database IDs, D1 migrations, R2 buckets or live Pages configuration.
- Using real customer data for tests.
- Creating or provisioning real administrator/customer accounts.
- Publishing unverified business claims, case studies, pricing, testimonials, legal identity or privacy wording.
- Waiving the QA Acceptance Standard, final Owner review or the minimum 90/100 acceptance score.

Those actions require their own explicit approval and the applicable operational prerequisites.

## Delivery controls

1. Work on feature branches with narrowly scoped commits and pull requests.
2. Run relevant unit, integration, build and static-site validation tests.
3. Record the exact commit, files changed, test results, risks and remaining blockers.
4. Keep missing business inputs marked TBD; do not fabricate content or silently infer facts.
5. Distinguish implementation complete, CI pass, staging verified, Owner accepted, merged and deployed as separate states.
6. Continue to stop before merge, deployment or production changes until the Owner explicitly approves.

## Relationship to Gate 2

This authorization permits continued development. It does not declare Phase 0 complete and does not approve formal Gate 2, final QA acceptance, merge or production release. HDO-019 remains the readiness evidence register; its outstanding blockers and acceptance checklist remain in force.