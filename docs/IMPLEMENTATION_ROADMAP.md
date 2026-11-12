# Lộ trình triển khai Hội Quán Web

**Định hướng sản phẩm:** nền tảng vận hành kinh doanh dịch vụ website gồm website marketing, CMS riêng, kho mẫu WordPress + HTML/CSS, cổng khách hàng, CRM/bán hàng, chatbot hỗ trợ khách hàng, SEO/AI content, tự động hóa, đơn hàng/thanh toán và quản lý hosting/domain. Các module được chia giai đoạn; không có nghĩa là đã triển khai.

**Nguyên tắc trạng thái:** “Có mã nguồn” không đồng nghĩa “đã deploy” hay “đã nghiệm thu”. Chỉ đánh dấu hoàn thành khi có kiểm thử phù hợp và xác minh môi trường chạy. Baseline kiến trúc được mô tả tại [docs/ARCHITECTURE.md](ARCHITECTURE.md).

## Baseline đã kiểm tra

- Public website đã có generator tĩnh song ngữ Việt/Anh với 40 trang nội dung, metadata theo trang, hreflang, canonical, sitemap, blog listing/detail và biểu mẫu tư vấn. CMS pages/posts/services có admin UI + API, draft-first workflow và revision history; blog có taxonomy; CMS media library upload R2, alt text, preview, publish/archive đã merge vào main và CI/Pages deploy xanh. Public renderer có thể đọc page đã xuất bản để ghi đè route tĩnh cùng slug khi HQ_API_BASE được cấu hình; biến này chưa được cấu hình và chưa xác minh runtime với Worker/D1.
- Có Worker scaffold và D1 migration cho lead, lead events và rate limiting.
- `backend/wrangler.toml` vẫn chứa database ID placeholder; API base trên frontend hiện để trống.
- Better Auth và role checks có integration tests; CMS API/UI cho pages/posts/services có kiểm thử. D1 migrations chưa deploy; public CMS rendering chưa xác minh runtime; template package/provisioning chưa hoàn thiện. CMS media code đã có nhưng cần R2 bucket và migration trên Cloudflare. Customer portal đã có báo giá, đơn hàng, dự án/milestone/bình luận và ticket hỗ trợ ở mức nền tảng; CRM order/project/ticket admin UI và membership onboarding đã có. Các tích hợp production, file riêng tư và thanh toán chưa hoàn thiện.
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

**Đã merge vào `main`:** frontend Vite + React + TypeScript shell, Better Auth email/password, role checks phía server, Worker/D1 schema nền, CRM identity/customer read APIs, CMS pages/posts/services API và admin UI. CI hiện kiểm tra public API, Better Auth integration, typecheck/build và public-site validation. Backend vẫn chưa được deploy lên Cloudflare staging/production.

- Thiết lập cấu trúc frontend có routing, layout chung, design system và môi trường local/test/staging.
- Chọn và cấu hình xác thực/session an toàn; phân quyền admin, staff và customer ở backend.
- Tạo API conventions, validation, error format, logging, migrations và test harness.
- Chuẩn bị database schema ban đầu cho users/roles, customers, content, templates, leads và audit events theo migration có kiểm soát.
- Bảo vệ secrets, CORS, session, CSRF (nếu cookie-based), rate limits và dữ liệu cá nhân.
- Giữ GitHub Pages làm preview tĩnh nếu phù hợp; không tuyên bố portal bảo mật hoạt động trên Pages nếu chưa có auth/API thực.

**Acceptance gates**
- [x] Validator hiện có, typecheck và production build của frontend chạy thành công trong CI.
- [x] Bổ sung integration tests cho public content API, Better Auth, role checks, customer isolation và CMS publication lifecycle.
- [ ] Bổ sung unit/integration tests cho các domain services còn lại.
- [ ] Migration được chạy trên môi trường test sạch và có hướng rollback.
- [ ] Backend kiểm tra quyền trên từng API; test xác nhận user không thể đọc dữ liệu của user khác.
- [ ] Không có secret trong source/frontend/logs.
- [ ] Deploy preview và kiểm tra thực tế URL, error states, responsive và accessibility.

## Phase 2 — Website dịch vụ nhiều trang + CMS nội dung

- Các trang riêng: home, giới thiệu, dịch vụ, trang dịch vụ chi tiết, giải pháp theo ngành, portfolio/case study, bảng giá, blog/kiến thức, FAQ, liên hệ và pháp lý.
- CMS cho pages/posts/services có draft, edit, publish/archive và revision snapshots đã có API/UI. Bài viết đã có category/tags, public API lọc theo danh mục/tag/từ khóa, trang blog và trang chi tiết song ngữ; public renderer chỉ lấy nội dung đã xuất bản. Còn thiếu navigation/footer động từ CMS, scheduling, route CMS tùy ý và tối ưu SEO server-render cho bài viết động. CMS revision history + admin-only restore đã được bổ sung ở nhánh feature; restore luôn đưa nội dung về draft và cần publish lại.
- Nội dung công khai được đọc từ API/database; có fallback lỗi rõ ràng, không âm thầm hiển thị dữ liệu giả.
- Sitemap và canonical phản ánh các URL thực; metadata và structured data chỉ dùng thông tin đã xác minh.
- Chuyển các section hiện tại thành nội dung/khối tái sử dụng khi phù hợp, tránh viết lại không cần thiết.

**Acceptance gates**
- [x] Admin/staff tạo và sửa bản nháp; Admin xuất bản/lưu trữ; dữ liệu được lưu qua API/D1 schema và có integration tests.
- [x] Public renderer có API integration tùy chọn cho published CMS page khớp slug route tĩnh, render block bằng textContent.
- [ ] Cấu hình HQ_API_BASE, deploy Worker/D1 và nghiệm thu thay đổi CMS xuất hiện trên public domain.
- [x] Blog listing/detail song ngữ: category/tags, tìm kiếm, lọc danh mục, phân trang tải thêm và bài viết published-only; nội dung block dùng renderer an toàn.
- [ ] Hỗ trợ tạo route CMS mới, media preview và SEO server-render/prerender cho từng bài viết động.
- [ ] Public routes hoạt động trực tiếp khi mở URL, gồm refresh và 404.
- [x] Test quyền xuất bản, revision history và restore; restore không tự xuất bản nội dung.
- [x] Test media upload: file type/signature, size cap, draft privacy, admin preview, role boundary, publish and archive.
- [x] Test private customer project file upload/download, customer membership isolation, internal visibility, MIME/signature validation and 10 MiB size cap.
- [ ] Test XSS-safe rendering, validation, malware scanning/retention policy for customer-private files.
- [ ] Kiểm tra link, SEO metadata, sitemap, accessibility, mobile, Lighthouse và lỗi API.

## Phase 3 — Kho template WordPress + HTML/CSS

- **Đã có catalog công khai song ngữ:** trang `/templates/` và `/en/templates/` đọc template đã xuất bản từ API, hỗ trợ tìm kiếm, lọc nền tảng và tải thêm.
- **Đã có admin catalog:** tạo/sửa/lọc template, tách loại WordPress và HTML/CSS, lưu category/tags/version/description/preview/thumbnail/price/currency/license/compatibility, xem revision history và publish/archive.
- Publication gate yêu cầu Admin xác nhận đã kiểm tra license và URL demo; sửa template đã xuất bản tự chuyển về draft.
- Chưa có upload package, malware/source scanning, lưu trữ tài liệu license, tự động cài đặt/provisioning hoặc thanh toán template. Không seed sản phẩm, demo hay license giả.
- Trước khi có pipeline provisioning cách ly an toàn, CTA là yêu cầu tư vấn/đặt triển khai, không hứa tự động cài đặt một click.

**Acceptance gates**
- [x] Catalog/detail/filter lấy dữ liệu đã xuất bản từ backend; public APIs chỉ trả published templates.
- [x] Admin/staff tạo/sửa và lọc metadata; Admin publish/archive.
- [x] Phân loại rõ WordPress và HTML/CSS; test quyền, validation, publication gate, draft visibility và revision history.
- [x] Không cho publish khi chưa xác nhận license và preview; không công bố mẫu/demo/license chưa được quản trị viên kiểm tra.
- [ ] Upload package/media an toàn, quyền sửa, pagination đầy đủ và quy trình rà soát package/bản quyền trước phát hành.
- [ ] Malware/source scan, license evidence storage, compatibility test và rollback.
- [ ] Provisioning riêng biệt cho WordPress và HTML/CSS; chưa hứa one-click installation.

## Phase 4 — Cổng khách hàng (bắt buộc trong bản phát hành đầu tiên)

- Đăng nhập/đăng xuất, phục hồi tài khoản, quản lý phiên và hồ sơ.
- **Đã có UI cổng khách hàng song ngữ:** đăng nhập, xem danh sách/chi tiết báo giá và xác nhận báo giá. Khách xem đơn hàng, dự án, milestone, file được phép xem, bình luận và yêu cầu hỗ trợ vẫn chưa hoàn thiện.
- **Đã triển khai quote detail API (kèm line items) và quote acceptance cho owner/billing:** conditional state transition + audit event cùng D1 batch; CI kiểm tra cross-customer isolation, member role denial, expired/repeated acceptance. UI ẩn ghi chú nội bộ và không cho xác nhận báo giá hết hạn.
- Nhân viên quản lý khách hàng, công việc, deadline, yêu cầu sửa đổi và bàn giao qua RBAC.
- File riêng tư chỉ tải qua cơ chế xác thực/ủy quyền; URL khó đoán không thay thế authorization.

**Acceptance gates**
- [x] Customer portal UI hỗ trợ sign-in/sign-out, danh sách/chi tiết báo giá, xác nhận theo owner/billing, đơn hàng, dự án/milestone/bình luận và ticket hỗ trợ.
- [x] Customer membership được nhân viên liên kết từ tài khoản Better Auth đã đăng ký; self-signup không tự cấp quyền customer.
- [x] Quote detail endpoint chỉ trả dữ liệu thuộc customer membership hiện tại, gồm line items; CI kiểm tra không đọc được quote của customer khác.
- [x] Quote acceptance chỉ dành cho owner/billing, chỉ nhận quote đang sent và chưa hết hạn; kiểm tra member bị từ chối, expired/repeated acceptance và actor/timestamp.
- [x] Quote acceptance ghi `quote.accepted` audit event cùng transaction batch với cập nhật trạng thái.
- [x] Automated authorization matrix cho các ranh giới vai trò cốt lõi (admin/staff/customer owner/member/billing/ordinary/anonymous); xem docs/AUTHORIZATION_MATRIX.md.
- [x] Cross-customer isolation test cho orders, projects, project comments, tickets và ticket messages; quote isolation đã có test riêng.
- [ ] Hoàn thiện authorization matrix cho mọi endpoint riêng tư, gồm session expiry/recovery và file access.
- [x] Audit log cho customer membership link/revoke và chuyển trạng thái project/milestone/ticket; metadata ghi before/after các trường vận hành, không sao chép nội dung trao đổi riêng tư.
- [ ] Test session expiry, recovery, brute-force/rate limit, upload/download và backup/restore.
- [ ] Kiểm tra end-to-end trên môi trường staging; không chấp nhận chỉ vì UI render được.

## Phase 5 — CRM và vận hành kinh doanh

**Đã merge vào `main`:** migration `0003_crm_foundation.sql` bổ sung bảng khách hàng CRM, timeline hoạt động, báo giá, dòng báo giá và audit events; validator kiểm tra schema/foreign keys/ràng buộc tính tổng. Admin/staff có API quản lý khách hàng (list/create/detail/update status/profile), activity timeline (list/create), lead conversion và quote workflow (create/list/detail/send); customer xem quote/line items theo membership và owner/billing xác nhận. Admin UI có CRM workspace để thêm khách hàng, đổi trạng thái vòng đời, xem timeline, ghi nhận note/call/email/meeting và chuyển lead thành khách hàng, đồng thời quản lý báo giá. Lead conversion giữ source attribution, ghi activity/audit và idempotent. Quote totals được tính server-side; customer/activity/quote mutations có audit events và integration tests. Lead assignment có API, phân quyền admin/staff, lịch sử sự kiện và giao diện phân công trong admin; CRM dashboard có KPI tính từ D1, lead status breakdown, recent leads và audit activity summaries đã triển khai; lead email notification có durable D1 outbox, scheduler, retry và Resend idempotency ở mức mã nguồn/CI; sender và cron runtime trên Cloudflare vẫn chưa nghiệm thu. Order/project/milestone/ticket workflow đã có API/UI nền tảng nhưng chưa deploy production.

- Lead pipeline, nguồn lead, lịch sử liên hệ, assignment, khách hàng, báo giá theo hạng mục, đơn hàng, hợp đồng/tài liệu, dự án, tasks, milestone và ticket hỗ trợ.
- Thông báo email khi provider và sender được cấu hình; lỗi gửi thông báo không làm mất giao dịch đã lưu.
- Dashboard chỉ hiển thị số liệu tính từ dữ liệu thật, có định nghĩa metric.
- Tích hợp booking/payment/e-signature chỉ sau khi chốt nhà cung cấp, bảo mật webhook, idempotency và xử lý hoàn tiền/thất bại.

**Acceptance gates**
- [x] Migration nền CRM có customer/activity/quote/quote-item/audit schema và ràng buộc dữ liệu cơ bản.
- [x] Backend tính subtotal/discount/total, kiểm tra line items và chỉ cho phép chuyển draft → sent khi quote hợp lệ.
- [x] Audit events cho quote.created, quote.sent và quote.accepted; CI xác minh quyền và trạng thái.
- [x] Idempotency khi tạo order từ cùng accepted quote.
- [ ] Idempotency đầy đủ cho quote creation, billing, webhook và các workflow tài chính.
- [x] Admin UI tạo bản nháp, xem danh sách/chi tiết và chuyển báo giá sang trạng thái đã gửi.
- [x] CRM customer workspace: tạo/list khách hàng, cập nhật trạng thái active/inactive/archived, ghi nhận và xem activity timeline.
- [x] Lead conversion vào CRM, giữ source attribution, ghi activity/audit và chống tạo khách hàng trùng khi retry.
- [x] Lead assignment: chỉ admin/staff được xem danh sách nhân sự; chỉ tài khoản có role admin/staff được giao lead; assignment/unassignment và status changes được ghi history + CRM audit trong một D1 batch.
- [x] CRM dashboard API/UI với KPI từ dữ liệu thật, lead status breakdown, recent leads và audit activity summaries.
- [x] Lead email notification được enqueue cùng D1 batch; scheduled worker, lease, retry tối đa 6 lần và Resend idempotency được kiểm thử với lỗi 503/400.
- [ ] Xác minh sender domain/secrets, cron và gửi email thực tế trên Cloudflare staging; kiểm tra retry/idempotency với provider thật.
- [ ] Kiểm thử webhook thanh toán và các lỗi mạng/provider khác; không báo thành công giả.
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
- [x] CI chạy thành công trên commit cập nhật roadmap `7930fe02895e1ad72ce54c3b92c72e55704189f8` tại [run #64](https://github.com/seokillseo-byte/hoiquanweb/actions/runs/40718009878); toàn bộ validator, API/auth tests, typecheck và build đều xanh.
- [x] Đã thêm checklist staging và kiểm thử trình duyệt tại [BETTER_AUTH_STAGING_ACCEPTANCE.md](security/BETTER_AUTH_STAGING_ACCEPTANCE.md).
- [ ] Chưa đạt staging gate: `backend/wrangler.toml` vẫn dùng D1 database ID placeholder; chưa có URL Worker/D1 staging được xác minh.
- [ ] Chưa có browser E2E chạy trên frontend + Worker đã deploy; các test hiện tại chạy local qua Wrangler test harness.
- [ ] Chưa hoàn tất email verification/password recovery, rate limiting chống abuse, role provisioning và kiểm thử cách ly dữ liệu customer.
- [ ] Chưa được phép dùng dữ liệu khách hàng thật hoặc tuyên bố auth production-ready.

**Bước tiếp theo:** chuẩn bị Cloudflare staging Worker + D1 riêng biệt, cấu hình origin/secret bằng dashboard hoặc CLI riêng tư, chạy migrations và browser E2E theo checklist. Các bước tạo tài nguyên, cấu hình secrets và deploy cần quyền/tài khoản Cloudflare của chủ dự án; không thể giả định các quyền đó đã được cấp. Không deploy production và không merge PR tự động.


## Customer portal and delivery workflow

- [x] Customer APIs for orders, projects, milestones, customer-visible comments and support tickets.
- [x] Convert accepted quote to one order with unique quote linkage and idempotent retries.
- [x] Customer membership isolation for all order/project/ticket reads and writes; integration tests cover cross-customer access denial.
- [x] Staff/admin project, milestone and ticket management APIs with audit events.
- [x] Static customer portal UI extended to quotes, orders, project milestones/comments and support tickets.
- [x] Customer portal marked noindex; runtime script and schema validation added to repository checks.
- [x] Admin UI for order creation from accepted quotes, project creation/status/milestones, ticket queue/status/priority and staff replies.
- [x] Customer account onboarding: staff can link an already registered Better Auth identity to a CRM customer from the admin CRM workspace; membership updates are audited.
- [x] Private project file APIs/UI, customer membership isolation, internal/customer visibility and local integration tests are implemented.
- [ ] Cloudflare staging R2/D1 runtime acceptance for CMS media and private project files.
- [x] In-app notifications for project, milestone and support-ticket events; per-user inbox/read-state isolation covered by integration tests.
- [ ] Resend email delivery, retry/idempotency and verified sender configuration; invoicing/payment and production deployment remain incomplete.
