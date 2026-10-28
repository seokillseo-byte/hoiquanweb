# Lộ trình triển khai Hội Quán Web

**Định hướng sản phẩm:** CMS riêng cho công ty thiết kế website, kho mẫu WordPress + HTML/CSS, website dịch vụ nhiều trang và cổng khách hàng ngay từ bản phát hành đầu tiên.

**Nguyên tắc trạng thái:** “Có mã nguồn” không đồng nghĩa “đã deploy” hay “đã nghiệm thu”. Chỉ đánh dấu hoàn thành khi có kiểm thử phù hợp và xác minh môi trường chạy. Baseline kiến trúc được mô tả tại [docs/ARCHITECTURE.md](ARCHITECTURE.md).

## Baseline đã kiểm tra

- Public website hiện là landing page tĩnh cùng các trang phụ; chưa có CMS nhiều trang hoàn chỉnh.
- Có Worker scaffold và D1 migration cho lead, lead events và rate limiting.
- `backend/wrangler.toml` vẫn chứa database ID placeholder; API base trên frontend hiện để trống.
- Cổng khách hàng, xác thực/phân quyền, quản lý nội dung có persistence, kho template có dữ liệu thực, đơn hàng/dự án và quy trình xuất bản chưa được triển khai hoàn chỉnh.
- GitHub Pages chỉ deploy frontend tĩnh. Backend Cloudflare và database cần cấu hình/deploy riêng.
- Vì vậy Phase 2 trước đây không được coi là production-ready; roadmap này thay thế thứ tự ưu tiên cũ.

## Phase 0 — Kiến trúc, phạm vi và kiểm soát phát triển (đang thực hiện)

- [x] Kiểm tra cấu trúc repo và ghi lại giới hạn hiện tại.
- [x] Xác định hướng CMS riêng + WordPress cho website khách hàng.
- [x] Xác định kho mẫu gồm WordPress và HTML/CSS.
- [x] Xác định cổng khách hàng là yêu cầu của bản đầu tiên.
- [x] Tạo tài liệu kiến trúc đích, vùng chức năng, dữ liệu logic, bảo mật và tiêu chí chất lượng.
- [ ] Chốt host frontend production, auth/session, object storage và chiến lược triển khai template WordPress.
- [ ] Định nghĩa API contracts, mô hình dữ liệu và ADR cho các quyết định kỹ thuật trước khi phụ thuộc vào chúng.

## Phase 1 — Nền tảng ứng dụng và bảo mật

Mục tiêu: dựng nền tảng có thể mở rộng, không chỉ thêm HTML tĩnh.

- Thiết lập cấu trúc frontend có routing, layout chung, design system và môi trường local/test/staging.
- Chọn và cấu hình xác thực/session an toàn; phân quyền admin, staff và customer ở backend.
- Tạo API conventions, validation, error format, logging, migrations và test harness.
- Chuẩn bị database schema ban đầu cho users/roles, customers, content, templates, leads và audit events theo migration có kiểm soát.
- Bảo vệ secrets, CORS, session, CSRF (nếu cookie-based), rate limits và dữ liệu cá nhân.
- Giữ GitHub Pages làm preview tĩnh nếu phù hợp; không tuyên bố portal bảo mật hoạt động trên Pages nếu chưa có auth/API thực.

**Acceptance gates**
- [ ] Build/lint/typecheck và unit tests chạy trong CI.
- [ ] Migration được chạy trên môi trường test sạch và có hướng rollback.
- [ ] Backend kiểm tra quyền trên từng API; test xác nhận user không thể đọc dữ liệu của user khác.
- [ ] Không có secret trong source/frontend/logs.
- [ ] Deploy preview và kiểm tra thực tế URL, error states, responsive và accessibility.

## Phase 2 — Website dịch vụ nhiều trang + CMS nội dung

- Các trang riêng: home, giới thiệu, dịch vụ, trang dịch vụ chi tiết, giải pháp theo ngành, portfolio/case study, bảng giá, blog/kiến thức, FAQ, liên hệ và pháp lý.
- CMS cho pages, posts, categories/tags, navigation, footer, reusable content blocks, media, metadata SEO, revisions, draft/preview/publish/unpublish.
- Nội dung công khai được đọc từ API/database; có fallback lỗi rõ ràng, không âm thầm hiển thị dữ liệu giả.
- Sitemap và canonical phản ánh các URL thực; metadata và structured data chỉ dùng thông tin đã xác minh.
- Chuyển các section hiện tại thành nội dung/khối tái sử dụng khi phù hợp, tránh viết lại không cần thiết.

**Acceptance gates**
- [ ] Admin tạo/sửa/xem trước/xuất bản nội dung và nội dung được lưu qua reload.
- [ ] Public routes hoạt động trực tiếp khi mở URL, gồm refresh và 404.
- [ ] Test quyền xuất bản, XSS-safe rendering, validation, media upload và revision/restore.
- [ ] Kiểm tra link, SEO metadata, sitemap, accessibility, mobile, Lighthouse và lỗi API.

## Phase 3 — Kho template WordPress + HTML/CSS

- Catalog có category, search/filter, tags, preview/demo, chi tiết, phiên bản, tương thích, giá/loại phí, license/quyền sử dụng và trạng thái xuất bản.
- Quản trị viên thêm/sửa/ẩn mẫu và quản lý ảnh, demo URL, package metadata.
- Phân loại rõ template WordPress và HTML/CSS; không gộp chúng thành cùng một cơ chế cài đặt.
- Quy định quy trình kiểm tra mã nguồn, phụ thuộc, license, cập nhật, sao lưu và rollback.
- Trước khi có pipeline provisioning cách ly an toàn, CTA là yêu cầu tư vấn/đặt triển khai, không hứa tự động cài đặt một click.

**Acceptance gates**
- [ ] Catalog/detail/filter lấy dữ liệu thật từ backend.
- [ ] Không công bố mẫu/demo/license chưa xác minh như sản phẩm sẵn sàng bán.
- [ ] Test upload, quyền sửa, status, filter, pagination và URL demo.
- [ ] Có quy trình rà soát package và bản quyền trước phát hành.

## Phase 4 — Cổng khách hàng (bắt buộc trong bản phát hành đầu tiên)

- Đăng nhập/đăng xuất, phục hồi tài khoản, quản lý phiên và hồ sơ.
- Khách xem báo giá, đơn hàng, dự án, milestone, file được phép xem, bình luận và yêu cầu hỗ trợ.
- Khách xác nhận báo giá/duyệt mốc; backend ghi actor, timestamp và lịch sử thay đổi.
- Nhân viên quản lý khách hàng, công việc, deadline, yêu cầu sửa đổi và bàn giao qua RBAC.
- File riêng tư chỉ tải qua cơ chế xác thực/ủy quyền; URL khó đoán không thay thế authorization.

**Acceptance gates**
- [ ] Automated authorization matrix cho admin/staff/customer.
- [ ] Cross-customer isolation test cho mọi endpoint dữ liệu riêng tư.
- [ ] Audit log cho quote approval, milestone changes, permissions và thao tác nhạy cảm.
- [ ] Test session expiry, recovery, brute-force/rate limit, upload/download và backup/restore.
- [ ] Kiểm tra end-to-end trên môi trường staging; không chấp nhận chỉ vì UI render được.

## Phase 5 — CRM và vận hành kinh doanh

- Lead pipeline, nguồn lead, lịch sử liên hệ, assignment, khách hàng, báo giá theo hạng mục, đơn hàng, hợp đồng/tài liệu, dự án, tasks, milestone và ticket hỗ trợ.
- Thông báo email khi provider và sender được cấu hình; lỗi gửi thông báo không làm mất giao dịch đã lưu.
- Dashboard chỉ hiển thị số liệu tính từ dữ liệu thật, có định nghĩa metric.
- Tích hợp booking/payment/e-signature chỉ sau khi chốt nhà cung cấp, bảo mật webhook, idempotency và xử lý hoàn tiền/thất bại.

**Acceptance gates**
- [ ] Tính giá và trạng thái quan trọng do backend quyết định.
- [ ] Audit trail và idempotency cho các hành động tạo đơn/duyệt/billing.
- [ ] Kiểm thử email/webhook và lỗi mạng; không báo thành công giả.
- [ ] Kiểm tra quyền, retention, export/delete dữ liệu và báo cáo.

## Phase 6 — Page Builder, WordPress delivery và AI

- Page builder theo block có schema rõ, preview, draft/revision, publication workflow và sanitization.
- Tạo website WordPress từ template chỉ sau khi có pipeline package, môi trường cách ly, secrets, backup, rollback và kiểm thử cập nhật.
- Tự động hóa provision hosting/domain/SSL khi có provider, kiểm tra quyền và xác nhận chi phí.
- AI hỗ trợ brief, nội dung, cấu trúc trang và SEO; nội dung/báo giá/hợp đồng quan trọng cần bước duyệt phù hợp.
- Không cho AI chạy mã tùy ý trên production hoặc tự xuất bản hành động có rủi ro mà không có guardrails.

**Acceptance gates**
- [ ] Snapshot/restore hoặc revision rollback được kiểm thử.
- [ ] Test sanitization, permissions, template compatibility và failed provisioning.
- [ ] AI outputs có provenance, giới hạn chi phí, kiểm tra chất lượng và human review theo chính sách.

## Quy trình phát triển bắt buộc

1. Làm việc trên feature branch; không đẩy thay đổi kiến trúc trực tiếp vào `main`.
2. PR mô tả phạm vi, rủi ro, migrations, ảnh chụp/demo nếu có và cách kiểm thử.
3. Chạy validator hiện có và bổ sung test phù hợp với feature.
4. Review diff, security, accessibility, SEO và regression.
5. CI xanh là điều kiện cần, không phải bằng chứng production đã hoạt động.
6. Deploy staging, kiểm tra runtime/DB/integrations, ghi kết quả nghiệm thu và các giới hạn còn lại.
7. Chỉ mở giai đoạn tiếp theo sau khi các acceptance gates của giai đoạn hiện tại đạt; các thiết lập cần đăng nhập/tài khoản/billing/secrets của chủ dự án phải được báo rõ và không giả lập.

## Cổng production

Không công bố hệ thống là production-ready cho đến khi có domain và thông tin pháp lý được xác minh, backend/database/auth được deploy, test quyền truy cập đạt, backup/restore được thử, monitoring và incident owner được xác định, và kiểm thử end-to-end hoàn tất.
