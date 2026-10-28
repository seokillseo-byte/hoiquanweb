# Lộ trình triển khai Hội Quán Web

**Định hướng sản phẩm:** nền tảng vận hành kinh doanh dịch vụ website gồm website marketing, CMS riêng, kho mẫu WordPress + HTML/CSS, cổng khách hàng, CRM/bán hàng, chatbot hỗ trợ khách hàng, SEO/AI content, tự động hóa, đơn hàng/thanh toán và quản lý hosting/domain. Các module được chia giai đoạn; không có nghĩa là đã triển khai.

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
- [x] Viết API contract ban đầu, mô hình dữ liệu logic và ADR stack; các quyết định auth/session, storage và production host vẫn chờ review.

## Phase 1 — Nền tảng ứng dụng và bảo mật (đang thực hiện)

Mục tiêu: dựng nền tảng có thể mở rộng, không chỉ thêm HTML tĩnh.

**Đã thực hiện trên nhánh feature (chưa merge):** thêm khung Vite + React + TypeScript riêng trong `frontend/`, scripts `npm run typecheck`/`npm run build`, CI chạy validator + typecheck + build, và tài liệu API contract. Đây chỉ là application shell; chưa có đăng nhập, persistence CMS hay customer portal hoạt động. CI đã xanh tại [run #25](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/40677460814).

- Thiết lập cấu trúc frontend có routing, layout chung, design system và môi trường local/test/staging.
- Chọn và cấu hình xác thực/session an toàn; phân quyền admin, staff và customer ở backend.
- Tạo API conventions, validation, error format, logging, migrations và test harness.
- Chuẩn bị database schema ban đầu cho users/roles, customers, content, templates, leads và audit events theo migration có kiểm soát.
- Bảo vệ secrets, CORS, session, CSRF (nếu cookie-based), rate limits và dữ liệu cá nhân.
- Giữ GitHub Pages làm preview tĩnh nếu phù hợp; không tuyên bố portal bảo mật hoạt động trên Pages nếu chưa có auth/API thực.

**Acceptance gates**
- [x] Validator hiện có, typecheck và production build của frontend chạy thành công trong CI.
- [ ] Bổ sung unit/integration tests cho API và các domain services.
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

**Đã bắt đầu trên nhánh feature (chưa merge):** migration `0003_crm_foundation.sql` bổ sung bảng khách hàng CRM, timeline hoạt động, báo giá, dòng báo giá và audit events; validator kiểm tra schema/foreign keys/ràng buộc tính tổng. Đây mới là nền dữ liệu, chưa có API CRM bảo vệ bằng tài khoản người dùng và chưa deploy production.

- Lead pipeline, nguồn lead, lịch sử liên hệ, assignment, khách hàng, báo giá theo hạng mục, đơn hàng, hợp đồng/tài liệu, dự án, tasks, milestone và ticket hỗ trợ.
- Thông báo email khi provider và sender được cấu hình; lỗi gửi thông báo không làm mất giao dịch đã lưu.
- Dashboard chỉ hiển thị số liệu tính từ dữ liệu thật, có định nghĩa metric.
- Tích hợp booking/payment/e-signature chỉ sau khi chốt nhà cung cấp, bảo mật webhook, idempotency và xử lý hoàn tiền/thất bại.

**Acceptance gates**
- [x] Migration nền CRM có customer/activity/quote/quote-item/audit schema và ràng buộc dữ liệu cơ bản (CI cần xác nhận trên PR).
- [ ] Tính giá và trạng thái quan trọng do backend quyết định.
- [ ] Audit trail và idempotency cho các hành động tạo đơn/duyệt/billing.
- [ ] Kiểm thử email/webhook và lỗi mạng; không báo thành công giả.
- [ ] Kiểm tra quyền, retention, export/delete dữ liệu và báo cáo.

## Phase 6 — Chatbot, inbox và tự động hóa\n\n- Widget chatbot nhúng trên website, cấu hình lời chào, FAQ và form thu lead có consent.\n- Hộp thư hội thoại tập trung, gắn contact/lead, phân công nhân viên, trạng thái xử lý, ghi chú và chuyển từ bot sang người thật.\n- AI chỉ trả lời dựa trên nội dung/knowledge base được duyệt; khi không đủ căn cứ phải nói rõ giới hạn hoặc chuyển nhân viên.\n- Quản trị dữ liệu hội thoại, retention, xóa/export dữ liệu, giới hạn tốc độ, chống spam và kiểm soát prompt injection.\n- Workflow tự động hóa cho lead mới, nhắc chăm sóc, email, cập nhật CRM và webhook; có retry, idempotency, nhật ký và công tắc tắt.\n- Tích hợp n8n/API chỉ qua webhook được xác thực; không cho chatbot hoặc workflow tự ý thực hiện thao tác tài chính/production có rủi ro.\n\n**Acceptance gates**\n- [ ] Test widget trên desktop/mobile, keyboard/accessibility và trạng thái offline/lỗi mạng.\n- [ ] Test consent, rate limiting, chống spam, phân quyền hội thoại và cách ly dữ liệu khách hàng.\n- [ ] Test bot không bịa dữ liệu dịch vụ/giá, không lộ prompt/secrets và biết chuyển nhân viên.\n- [ ] Workflow có retry, idempotency, audit log và kiểm thử provider lỗi.\n- [ ] Không hiển thị “đã gửi”, “đã tạo lead” hoặc “đã thông báo” nếu backend/provider chưa xác nhận.\n\n## Phase 7 — SEO nâng cao, thương mại và hạ tầng website\n\n- SEO on-page: title/description, canonical, robots, sitemap, schema, breadcrumb, internal links, redirect và kiểm tra indexability.\n- AI hỗ trợ brief, outline, draft, alt text, phân loại, kiểm tra chất lượng/trùng lặp và cập nhật nội dung; có nguồn gốc và chính sách duyệt.\n- Đơn hàng, thanh toán, hóa đơn/đối soát chỉ sau khi chọn provider và thiết kế webhook an toàn.\n- Quản lý hosting/domain/DNS/SSL, gia hạn, trạng thái dịch vụ và cảnh báo; provisioning chỉ bật khi có backup, rollback, kiểm tra quyền và giới hạn chi phí.\n- Kết nối analytics/Search Console chỉ khi người dùng cấp quyền; báo cáo phản ánh dữ liệu thực và nguồn đo rõ ràng.\n\n**Acceptance gates**\n- [ ] Kiểm thử SEO metadata/sitemap/redirect và nội dung không xuất bản ngoài ý muốn.\n- [ ] Test webhook thanh toán với chữ ký, idempotency, giao dịch thất bại và hoàn tiền.\n- [ ] Test provisioning, DNS/SSL, backup/restore và rollback trong môi trường thử nghiệm.\n- [ ] Secrets chỉ ở server; không có AI/workflow chạy mã tùy ý trên production.\n\n## Phase 8 — Page Builder, WordPress delivery và AI

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


## Cập nhật triển khai xác thực — 2026-10-28

- [x] Better Auth Worker/D1 integration spike có CI local integration xanh tại [run #62](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/40716709043), xác minh trên commit `f75174ffefcd8d6ac71af6c0be915402e0e6b002`; bao gồm `npm ci`, API/auth integration tests, typecheck và frontend build.
- [x] Đã thêm checklist staging và kiểm thử trình duyệt tại [BETTER_AUTH_STAGING_ACCEPTANCE.md](security/BETTER_AUTH_STAGING_ACCEPTANCE.md).
- [ ] Chưa đạt staging gate: `backend/wrangler.toml` vẫn dùng D1 database ID placeholder; chưa có URL Worker/D1 staging được xác minh.
- [ ] Chưa có browser E2E chạy trên frontend + Worker đã deploy; các test hiện tại chạy local qua Wrangler test harness.
- [ ] Chưa hoàn tất email verification/password recovery, rate limiting chống abuse, role provisioning và kiểm thử cách ly dữ liệu customer.
- [ ] Chưa được phép dùng dữ liệu khách hàng thật hoặc tuyên bố auth production-ready.

**Bước tiếp theo:** chuẩn bị Cloudflare staging Worker + D1 riêng biệt, cấu hình origin/secret bằng dashboard hoặc CLI riêng tư, chạy migrations và browser E2E theo checklist. Các bước tạo tài nguyên, cấu hình secrets và deploy cần quyền/tài khoản Cloudflare của chủ dự án; không thể giả định các quyền đó đã được cấp. Không deploy production và không merge PR tự động.
