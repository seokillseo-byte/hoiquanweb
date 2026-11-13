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
| R-003 | Sitemap tĩnh ở repository root không khớp route generator; cần bảo đảm artifact được deploy dùng sitemap sinh tự động | 3 | 4 | 12 | High | Duy trì generator làm nguồn route; kiểm tra build output/CI và artifact Pages dùng sitemap sinh từ generator | Open |
| R-004 | Tài liệu SEO mô tả landing page một trang trong khi README/Roadmap mô tả site song ngữ nhiều trang | 5 | 3 | 15 | High | Đồng bộ tài liệu theo trạng thái đã xác minh; tách current implementation và target architecture | In progress |
| R-005 | Thiếu portfolio/case study có bằng chứng hoặc quyền công bố | 3 | 4 | 12 | High | Không dùng logo, testimonial, metric hoặc kết quả chưa được chứng minh; cho phép ẩn section khi chưa có dữ liệu | Open |
| R-006 | Chưa có pricing policy; trang giá có thể đưa thông tin gây hiểu nhầm | 4 | 3 | 12 | High | Chỉ dùng CTA tư vấn/báo giá; không hiển thị giá giả hoặc giá tham khảo như giá chính thức | Open |
| R-007 | Nội dung tiếng Anh có thể không đồng nhất/chưa được biên tập tương đương tiếng Việt | 3 | 4 | 12 | High | Có content parity checklist, reviewer, metadata/hreflang theo từng cặp URL | Open |
| R-008 | Preview host/production domain/canonical chưa được cấu hình và xác minh đầy đủ | 3 | 4 | 12 | High | Phân biệt preview với production; chỉ chuyển canonical, sitemap, schema sang domain chính thức sau xác minh | Open |
| R-009 | Form tư vấn có thể hiển thị thành công nhưng backend/provider chưa xác nhận | 3 | 5 | 15 | High | Chỉ hiện success khi nhận xác nhận từ API; test lỗi mạng, rate limit, validation và duplicate submit | Open |
| R-010 | Backend Worker/D1/R2 chưa được staging/production nghiệm thu | 4 | 5 | 20 | Critical | Core Preview ưu tiên static/public behavior; không đưa portal/CMS runtime vào production claims trước staging acceptance | Open |
| R-011 | Mở rộng scope từ roadmap nền tảng thành Core Preview gây chậm và tăng lỗi | 4 | 4 | 16 | Critical | Giữ P0/Core Preview riêng; mọi P1/P2 cần change approval | In progress |
| R-012 | Mã nguồn/CI xanh bị hiểu nhầm là runtime production đã sẵn sàng | 3 | 5 | 15 | High | Ghi rõ code/CI/deploy/runtime/acceptance là các trạng thái khác nhau | Open |
| R-013 | Thiếu xác nhận hosting, secrets, domain routing và ownership | 3 | 5 | 15 | High | Không tạo tài nguyên hoặc thay đổi production; lập checklist owner action và environment separation | Open |
| R-014 | Nội dung placeholder hoặc claim không có bằng chứng được phát hành | 3 | 5 | 15 | High | Content QA bắt buộc; mọi placeholder phải bị chặn trước publish; kiểm tra legal/contact claims | Open |
| R-015 | Thiếu user acceptance trên thiết bị, trình duyệt và ngôn ngữ thực tế | 3 | 4 | 12 | High | Kiểm thử responsive, keyboard, accessibility, browser, form, links, 404 và VI/EN trước nghiệm thu | Open |

## 4. Critical risks requiring closure before Core Preview acceptance

### R-003 — Route inventory / sitemap mismatch

Evidence hiện có:
- README và Implementation Roadmap tuyên bố website công khai song ngữ có 40 trang nội dung.
- docs/ARCHITECTURE.md ghi baseline 34 trang.
- docs/SEO_AND_DESIGN_SYSTEM.md mô tả nội dung là landing page một trang.
- sitemap.xml hiện chỉ chứa URL trang chủ.

Kết luận: chưa có bằng chứng nhất quán để xác nhận số URL nội dung thực tế. Không được ghi nhận “40 URL đã xác minh”.

Required closure:
1. Lấy route inventory từ nguồn route/generator thực tế.
2. Phân loại URL VI/EN, indexable/noindex, static/dynamic.
3. Kiểm tra URL truy cập trực tiếp, refresh và 404.
4. Sinh sitemap từ cùng route inventory.
5. Test sitemap URL count, uniqueness, canonical, hreflang và HTTP response.
6. Cập nhật README, Architecture, Roadmap và SEO document theo kết quả.

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
- R-003 chưa được xử lý và sitemap không phản ánh route thực.
- Có claim, testimonial, giá hoặc thông tin doanh nghiệp không có căn cứ.
- Form báo thành công giả hoặc làm mất lead.
- Có lỗi nghiêm trọng về bảo mật, quyền riêng tư hoặc dữ liệu.
- Các route/ngôn ngữ trọng yếu không truy cập được.
- Có lỗi responsive/accessibility nghiêm trọng chưa xử lý.

Một số rủi ro production (R-008, R-010, R-013) có thể vẫn mở trong một Preview tĩnh được giới hạn rõ ràng, nhưng phải được công bố như blocker trước Production và không được giả định đã nghiệm thu.

## 7. Review checklist

- [ ] Project owner xác nhận audience/USP/business facts hoặc chấp thuận giữ các trường này ngoài scope của Preview.
- [ ] Route inventory và sitemap được đồng bộ.
- [ ] Content evidence và quyền công bố được kiểm tra.
- [ ] VI/EN content parity được kiểm tra.
- [ ] Form end-to-end có backend confirmation.
- [ ] Preview và production được phân biệt rõ.
- [ ] Backend/staging gaps được ghi rõ.
- [ ] P0/P1/P2 scope được khóa.
- [ ] QA evidence được đính kèm.
- [ ] Residual risks được chủ dự án chấp thuận trước production.

**Assessment result:** BP-17 risk identification đã được lập thành tài liệu. Các rủi ro quan trọng vẫn mở; không đồng nghĩa dự án đã đạt risk-free status hoặc được phép production launch.
