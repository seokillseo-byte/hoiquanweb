# HOIQUANWEB — BP-17 Risk Assessment

**Status:** Draft complete — risks identified; mitigations and acceptance remain open  
**Project:** HOIQUANWEB / hoiquanweb.io.vn  
**Planning phase:** Phase 0  
**Assessment date:** 2026-11-13

---

## 1. Purpose

Đánh giá rủi ro Business, Scope, Content, SEO, UX, Technical, Security, Delivery và QA có thể ảnh hưởng đến Core Website Preview và quá trình đưa website vào vận hành.

Đây là đánh giá dựa trên các quyết định đã xác nhận, năm tiêu chuẩn dự án và trạng thái tài liệu/repository đã kiểm tra. Đây không phải chứng nhận bảo mật, audit hạ tầng production hoặc bằng chứng hệ thống đang vận hành.

## 2. Scoring method

- **Probability (P):** 1 = thấp, 5 = rất cao.
- **Impact (I):** 1 = thấp, 5 = nghiêm trọng.
- **Risk score:** P × I.
- **Priority:** 1–5 Low; 6–10 Moderate; 11–15 High; 16–25 Critical.

Điểm số là đánh giá định tính phục vụ ưu tiên xử lý, không phải số liệu thống kê.

## 3. Risk register

| ID | Risk | P | I | Score | Priority | Mitigation / required action | Residual status |
|---|---|---:|---:|---:|---|---|---|
| R-001 | Chưa xác định phân khúc khách hàng ưu tiên; messaging có thể quá rộng | 4 | 4 | 16 | Critical | Không tự chọn persona; hoàn thiện audience input trước khi khóa messaging và UX copy | Open |
| R-002 | USP, business description và competitive advantage chưa được xác nhận | 4 | 4 | 16 | Critical | Dùng nội dung trung tính có căn cứ; không tạo claim cạnh tranh; yêu cầu chủ dự án cung cấp dữ liệu | Open |
| R-003 | Sitemap tĩnh ở repository root đã cũ, nhưng không phải artifact được Pages workflow deploy | 2 | 2 | 4 | Low | Giữ Pages workflow dùng generated dist; đồng bộ hoặc ghi chú sitemap root để tránh dùng nhầm ở deployment path khác | Mitigated for GitHub Pages; residual low |
| R-004 | Tài liệu kiến trúc/SEO cũ có thể tái xuất hiện và gây hiểu nhầm về baseline | 2 | 3 | 6 | Moderate | Đồng bộ README, Master Blueprint, Architecture, Roadmap và SEO document; review thay đổi tài liệu cùng PR | Mitigated in this PR |
| R-005 | Thiếu portfolio/case study có bằng chứng hoặc quyền công bố | 3 | 4 | 12 | High | Không dùng logo, testimonial, metric hoặc kết quả chưa được chứng minh; cho phép ẩn section khi chưa có dữ liệu | Open |
| R-006 | Chưa có pricing policy; trang giá có thể đưa thông tin gây hiểu nhầm | 4 | 3 | 12 | High | Chỉ dùng CTA tư vấn/báo giá; không hiển thị giá giả hoặc giá tham khảo như giá chính thức | Open |
| R-007 | Nội dung tiếng Anh có thể không đồng nhất/chưa được biên tập tương đương tiếng Việt | 3 | 4 | 12 | High | Có content parity checklist, reviewer, metadata/hreflang theo từng cặp URL | Open |
| R-008 | Preview host/production domain/canonical chưa được cấu hình và xác minh đầy đủ | 3 | 4 | 12 | High | Phân biệt preview với production; chỉ chuyển canonical, sitemap, schema sang domain chính thức sau xác minh | Open |
| R-009 | Form tư vấn có thể hiển thị thành công nhưng backend/provider chưa xác nhận | 3 | 5 | 15 | High | Chỉ hiện success khi nhận xác nhận từ API; test lỗi mạng, rate limit, validation và duplicate submit | Open |
| R-010 | Backend Worker/D1/R2 chưa được staging/production nghiệm thu | 4 | 5 | 20 | Critical | Core Preview ưu tiên static/public behavior; không đưa portal/CMS runtime vào production claims trước staging acceptance | Open |
| R-011 | Mở rộng scope từ roadmap nền tảng thành Core Preview gây chậm và tăng lỗi | 4 | 4 | 16 | Critical | Giữ P0/Core Preview riêng; mọi P1/P2 cần change approval | In progress |
| R-012 | Mã nguồn/CI xanh bị hiểu nhầm là runtime production đã sẵn sàng | 3 | 5 | 15 | High | Ghi rõ code/CI/deploy/runtime/acceptance là các trạng thái khác nhau | Open |
| R-013 | Thiếu xác nhận hosting, secrets, domain routing và ownership | 3 | 5 | 15 | High | Không tạo tài nguyên hoặc thay đổi production; lập checklist owner action và environment separation | Open |
| R-014 | Nội dung placeholder hoặc claim không có bằng chứng được phát hành | 3 | 5 | 15 | High | Content QA bắt buộc; rà soát tagline/positioning, project publication rights/status, service/process claims, legal/contact và privacy copy trước publish; xem `QA_REVIEW_XC03_XC10.md` | Open — latest Preview artifact review found the repeated “Your All-in-One Technology Partner” positioning and project showcase require Owner approval/evidence; privacy notice still identifies legal/contact/retention details as incomplete |
| R-015 | Thiếu user acceptance trên thiết bị, trình duyệt và ngôn ngữ thực tế | 3 | 4 | 12 | High | Kiểm thử responsive, keyboard, accessibility, browser, form, links, 404 và VI/EN trước nghiệm thu | Open |
| R-016 | Client-rendered blog listing/detail shells previously had indexable initial HTML and sitemap entries; they are now noindex and excluded, while dynamic published articles still lack clean slug routes and article-specific initial HTML | 4 | 4 | 16 | Critical | Keep listing/detail shells noindex and out of sitemap; add clean-slug article URLs only after article-specific initial HTML, canonical, reciprocal hreflang and structured data are implemented. Validator enforces sitemap eligibility. See `SEO_INDEXATION_AND_PREVIEW_REMEDIATION.md` and `DEVELOPMENT_REPORT_XC03_XC10.md`. | Development guard implemented; CI evidence passed; independent artifact QA confirmed VI/EN generic shells are noindex and excluded from sitemap; dynamic article rendering remains unresolved |
| R-017 | PR Preview previously overlaid the frontend SPA build on the generated public-site output and replaced the public Vietnamese homepage at `/`; the Preview workflow now isolates the SPA under `/platform/` and validates the final assembled artifact | 4 | 3 | 12 | High | Preserve public homepage at `/`; build the app with the configured `/platform/` base path; retain generated portal output; validate root metadata, entrypoints and app assets after assembly. See `DEVELOPMENT_REPORT_XC03_XC10.md`. | Development implemented; latest Preview CI passed; independent artifact QA on HEAD 81b8cd confirmed 40 localized routes, 36/36 sitemap HTTP 200, canonical/hreflang consistency and platform asset resolution; full visual/browser/responsive/accessibility QA and Project Owner acceptance pending |

## 4. Priority risks requiring closure before SEO / Core Preview acceptance

### R-003 — Repository-root sitemap is stale

Evidence hiện có:
- sitemap.xml ở repository root chỉ chứa homepage.
- .github/workflows/pages.yml chạy scripts/build_public_site.mjs, chạy validator và deploy public-site/dist; workflow không copy sitemap.xml ở root.
- CI run 43364844705 xác nhận build tạo 40 localized pages và validator pass cho internal links/assets, localized metadata, canonical sitemap, brand tokens và inquiry fallback.

Kết luận: đây không phải lỗi sitemap của GitHub Pages pipeline hiện tại. Rủi ro còn lại là người vận hành có thể dùng nhầm sitemap root khi chuyển sang deployment path khác.

Required closure:
1. Giữ generated sitemap từ public-site/dist làm nguồn sitemap cho GitHub Pages.
2. Đồng bộ hoặc ghi chú rõ sitemap.xml ở root là stale/non-deployment artifact.
3. Khi đổi deployment pipeline, xác minh lại artifact thực tế trước khi publish.

### R-017 — Isolated Preview root-route collision

Evidence from PR preview artifact run 43389153166 on commit `4cb78e548e4077722dd1a2a3a107c6ca3003d293`:
- `.github/workflows/pr-preview.yml` first copies `public-site/dist/.` into `_preview/`, then copies frontend `dist/.` into the same root.
- The second copy overwrites `_preview/index.html` with the frontend application shell (`noindex,nofollow`) and removes the generated public homepage canonical and hreflang tags.
- The sitemap in that artifact still contains the public homepage URL `/`.
- `.github/workflows/pages.yml` currently assembles deployment from `public-site/dist` only; the preview collision is not evidence that production Pages output is overwritten.

Implementation evidence (2026-11-13):
- Commit `c630041db0981d2f125a6c25a00fc114aebc707d` and final validator commit `52169201a4e8837ee7bd226f0eb7b61a216f7be8` keep the public-site output at Preview root and place the frontend SPA at `/platform/` using the existing Vite `base` configuration.
- The generated `portal.html` is retained; the redundant copy of the unconfigured root portal file was removed.
- PR Preview workflow run **43395058389** (run #218) passed all build, assembly, final-artifact validation and upload steps.
- Final validator passed PREV-01 through PREV-06, including HTTP direct-load/repeat-request smoke checks for public routes and HTTP checks for admin, portal, platform and platform assets.
- Artifact: [hoiquanweb-pr-43-preview](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/43395058389/artifacts/14021259542).

Remaining:
- Independent static artifact QA subset passed; full visual/browser/responsive QA and Project Owner acceptance remain pending. See `QA_REVIEW_XC03_XC10.md`.
- This is isolated Preview evidence only; production Pages workflow and live production URL were not changed or tested.

### R-016 — Dynamic blog/CMS SEO coverage

Evidence hiện có:
- Static generator tạo 40 localized routes, trong đó có route shell /blog/post/ và /en/blog/post/.
- public-site/src/site.js lấy slug bài viết từ query parameter slug, gọi public post API và cập nhật canonical/title/description bằng JavaScript.
- Sitemap generated từ mảng static pages; không thêm từng published blog post URL.
- Public CMS renderer chỉ thay nội dung trên static route tương ứng; arbitrary new CMS routes và server-render/prerender cho dynamic blog detail vẫn là gap trong Roadmap.

Kết luận: 40 trang static đã được CI xác minh, nhưng điều đó không chứng minh từng bài blog/CMS dynamic đã có URL indexable riêng hoặc metadata trong HTML ban đầu.

Implementation evidence (2026-11-13):
- scripts/build_public_site.mjs now assigns explicit route-level indexability. The VI/EN blog listing shells and generic blog-detail shells emit noindex,follow; sitemap generation filters to explicitly indexable routes.
- scripts/validate_public_site.mjs no longer equates generated HTML count with sitemap count. It validates canonical/indexability consistency, x-default-to-Vietnamese mapping, noindex exclusions and the query-slug/article guard.
- Validation workflow run 43395058445 (run #391) passed. The generator produced 40 localized HTML routes; the validator identified 36 indexable routes and 4 noindex blog routes and passed SEO-IX-01 through SEO-IX-07.
- This intentionally does not implement clean-slug article routing or SSR/prerender. Dynamic published articles remain outside the sitemap and must not be indexed until the full article readiness gate is implemented and QA-approved.

Remaining:
1. Implement clean slug URLs for published articles.
2. Implement SSR, prerender or static generation with article-specific initial HTML.
3. Add only approved published VI/EN article URLs to sitemap.
4. Verify initial-HTML title, description, canonical, reciprocal hreflang, Article structured data and publication lifecycle.
5. Keep unsupported arbitrary CMS routes noindex and outside sitemap.
6. Independent artifact QA verified the current generic-shell guard; independently QA the future article-readiness implementation before enabling article indexation.

### R-010 — Backend runtime not accepted

Evidence hiện có trong tài liệu repository:
- Worker/D1 có scaffold và migrations.
- D1 database ID còn placeholder trong cấu hình đã mô tả.
- HQ_API_BASE chưa cấu hình theo tài liệu hiện tại.
- Cloudflare D1/R2 staging và production runtime chưa được xác minh.
- CI success không chứng minh API/database/provider đang chạy thật.

Required closure:
1. Chọn environment và owner cho staging.
2. Cấu hình resource/secrets bởi chủ dự án.
3. Chạy migrations có backup/rollback plan.
4. Kiểm thử API, authorization, file delivery, email và cron trên staging.
5. Ghi lại evidence và rollback procedure.
6. Chỉ công bố tính năng runtime sau khi nghiệm thu.

### R-011 — Scope creep

Required closure:
- Core Preview chỉ bao gồm website công khai, dịch vụ, nội dung có căn cứ, form tư vấn/báo giá và SEO cơ bản.
- CRM nâng cao, customer portal, AI, payment, template provisioning và hosting/domain automation không thuộc P0 của Core Preview.
- Mọi thay đổi scope cần Change Request và phê duyệt.

## 5. Risk response ownership

| Owner | Responsibility |
|---|---|
| Project owner | Xác nhận audience, USP, business facts, pricing, proof, brand, domain/hosting và production credentials |
| Planning / Architecture | Duy trì Blueprint, traceability, risk register và change control |
| Development | Xây dựng theo scope đã duyệt, thêm tests, không tự thay đổi business requirements |
| QA | Kiểm thử acceptance, ghi evidence, xác nhận defect closure |
| Operations / deployment owner | Staging, secrets, migrations, backup, monitoring và production release |

Tên cá nhân/đơn vị phụ trách chưa được chỉ định; các vai trò trên là role ownership, không phải phân công nhân sự cụ thể.

## 6. Risk acceptance rules

Không được nghiệm thu Core Preview nếu:
- R-016 chưa được xử lý nếu blog/CMS dynamic content được đưa vào phạm vi indexable. R-017 phải được xử lý trước khi nghiệm thu Preview homepage. R-003 chỉ là rủi ro thấp đối với deployment path khác, không phải blocker của Pages pipeline hiện tại.
- Có claim, testimonial, giá hoặc thông tin doanh nghiệp không có căn cứ.
- Form báo thành công giả hoặc làm mất lead.
- Có lỗi nghiêm trọng về bảo mật, quyền riêng tư hoặc dữ liệu.
- Các route/ngôn ngữ trọng yếu không truy cập được.
- Có lỗi responsive/accessibility nghiêm trọng chưa xử lý.

Một số rủi ro production (R-008, R-010, R-013) có thể vẫn mở trong một Preview tĩnh được giới hạn rõ ràng, nhưng phải được công bố như blocker trước Production và không được giả định đã nghiệm thu.

## 7. Review checklist

- [ ] Project owner xác nhận audience/USP/business facts hoặc chấp thuận giữ các trường này ngoài scope của Preview.
- [x] Static route inventory và generated sitemap được kiểm tra trong CI (40 pages).
- [ ] Dynamic blog/CMS routes được prerender/SSR, có URL riêng và được đưa vào sitemap trước khi index.
- [ ] Isolated Preview artifact giữ nguyên public homepage tại `/` và không bị frontend SPA shell ghi đè.
- [ ] Content evidence và quyền công bố được kiểm tra.
- [ ] VI/EN content parity được kiểm tra.
- [ ] Form end-to-end có backend confirmation.
- [ ] Preview và production được phân biệt rõ.
- [ ] Backend/staging gaps được ghi rõ.
- [ ] P0/P1/P2 scope được khóa.
- [ ] QA evidence được đính kèm.
- [ ] Residual risks được chủ dự án chấp thuận trước production.

**Assessment result:** BP-17 risk identification đã được lập thành tài liệu. Các rủi ro quan trọng vẫn mở; không đồng nghĩa dự án đã đạt risk-free status hoặc được phép production launch.
