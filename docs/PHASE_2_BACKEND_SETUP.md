# Backend, CMS, CRM và Customer Portal — Deployment Runbook

## Kiến trúc
- Website tĩnh production tiếp tục deploy bằng GitHub Pages từ `main`; PR preview được đóng gói thành GitHub Actions artifact riêng, không ghi đè website production.
- API chạy riêng trên Cloudflare Workers; lead lưu trong Cloudflare D1.
- Email thông báo tùy chọn qua Resend. Lỗi gửi email không làm mất lead đã lưu.
- Lịch tư vấn trả về từ GET /api/booking; chưa có nhà cung cấp lịch mặc định nên trả 503 cho đến khi cấu hình.
- API có allowlist CORS, validation, honeypot, rate limit cơ bản theo IP hash, security headers và consent timestamp. Endpoint quản trị yêu cầu Better Auth session và vai trò admin/staff được cấp từ phía máy chủ.
- Better Auth dùng cookie HttpOnly, Secure, SameSite=Lax; production frontend/API phải ở cùng site tin cậy để tránh third-party cookies.
- D1 migrations hiện gồm 0001 đến 0010: lead, CMS, CRM/quotes/identity, revisions, template metadata, orders/projects/milestones/comments/tickets, lead assignment, blog post category/tags và CMS media metadata.

## Endpoints

| Method | Path | Mục đích |
|---|---|---|
| GET | /api/health | Health check, không trả dữ liệu cá nhân |
| POST | /api/leads | Validate và lưu brief/lead; email thông báo nếu cấu hình |
| POST | /api/estimate | Ước tính khoảng chi phí theo quy tắc công khai |
| GET | /api/booking | Trả URL đặt lịch nếu đã cấu hình |
| GET | /api/admin/leads?status=new&limit=50 | Danh sách lead, yêu cầu Better Auth session + vai trò admin/staff |
| PATCH | /api/admin/leads | Đổi trạng thái lead, yêu cầu Better Auth session + vai trò admin/staff; ghi actor ID vào lead event |

Trạng thái CRM: new, contacted, qualified, proposal_sent, won, lost, spam.

## Kiểm tra tự động
Workflow validate.yml chạy validator, API boundary tests, Better Auth + D1 integration tests, typecheck/build và public-site validation. Workflow Pages copy public site cùng admin.html và portal.html; không đưa backend và tài liệu triển khai vào artifact.

## Triển khai lần đầu
1. Tạo tài khoản Cloudflare và D1 database tên hoiquanweb-production.
2. Trong thư mục backend, chạy npx wrangler d1 create hoiquanweb-production.
3. Thay database_id trong wrangler.toml bằng ID thực Cloudflare trả về.
4. Tạo database staging riêng cho lần thử đầu; kiểm tra backup/ID rồi chạy migrations: npx wrangler d1 migrations apply hoiquanweb-production --remote.
5. Chạy local: npx wrangler dev; kiểm tra /api/health trên URL local của Wrangler.
6. Cấu hình AUTH_BASE_URL bằng origin API thực tế, ALLOWED_ORIGINS bằng origin frontend được phép; dùng wrangler secret put cho secrets. Nếu cần email, cấu hình RESEND_API_KEY và NOTIFICATION_EMAIL. ADMIN_TOKEN không cấp quyền cho endpoint identity-protected.
7. Không coi GitHub Pages + workers.dev là cấu hình auth production. Chọn custom domain cùng site trước khi mở login thật; CORS allowlist phải khớp chính xác frontend origin.
8. Deploy API bằng npx wrangler deploy và lưu URL Worker thực tế.
9. Đặt GitHub repository variable HQ_API_BASE thành URL Worker (không có dấu / cuối); generator nhúng biến vào public pages. Không hardcode API URL hoặc secrets trong source.
10. Kiểm tra health, gửi brief thử, dữ liệu D1, email, rate limit và CORS.

## Identity, CRM membership và customer portal

- Better Auth email/password được cấu hình trong backend/src/better-auth.js; password tối thiểu 12 ký tự, session cookie HttpOnly + Secure + SameSite=Lax và database-backed rate limits cho sign-in/sign-up/password recovery.
- Migration 0004 tạo app_user_roles và crm_customer_members. Public sign-up không thể tự cấp role admin/staff hoặc customer membership.
- GET /api/v1/me trả identity và server-assigned roles; GET /api/v1/me/customers chỉ trả hồ sơ có membership.
- Admin/staff quản lý liên kết tại GET/POST /api/v1/admin/customers/:id/members. Tài khoản phải đăng ký trước; endpoint tìm Better Auth user theo email đã chuẩn hóa, upsert owner/member/billing và ghi audit event. Email không có tài khoản trả 404.
- Role admin/staff vẫn phải được gán qua quy trình vận hành được kiểm soát; không có public self-service role assignment.
- Customer portal portal.html có quote, order, project/milestone/comment và support ticket. Dữ liệu riêng tư được lọc bằng crm_customer_members; message responses không trả user ID nội bộ.
- Admin admin.html có CRM, quote, CMS, template, media library, order, project/milestone và support ticket management.
- CMS media library upload ảnh PNG/JPEG/GIF/WebP tối đa 5 MiB, lưu R2 ở chế độ private, hỗ trợ alt text, preview có xác thực, Admin publish/archive; public route chỉ stream asset đã published.

Các endpoint đã có integration tests local với Wrangler D1; đây không thay thế staging/browser E2E. Không chạy SQL gán role trực tiếp trên production khi chưa có xác minh tài khoản, backup và rollback.


## Lead assignment và lịch sử xử lý

- Migration `0008_lead_assignment.sql` thêm `leads.assigned_to` và index theo người phụ trách/trạng thái/thời gian tạo.
- `GET /api/v1/admin/staff` chỉ trả tài khoản có role server-side `admin` hoặc `staff`; endpoint yêu cầu session admin/staff.
- `PATCH /api/v1/admin/leads` nhận `{ id, assigned_to }` để giao hoặc bỏ giao lead, hoặc `{ id, status }` để cập nhật trạng thái. Backend xác minh role của người nhận; tài khoản customer bị từ chối.
- Thay đổi trạng thái, giao và bỏ giao được ghi vào `lead_events` và `crm_audit_events` cùng batch với cập nhật lead. Cập nhật có điều kiện theo trạng thái/người phụ trách hiện tại để trả 409 khi có cập nhật đồng thời.
- `GET /api/v1/admin/leads/:id/events` trả lịch sử tối đa 100 sự kiện cho admin/staff.
- Trước khi bật API, phải áp dụng migration 0008 vào đúng D1 staging/production sau khi xác minh database ID và backup. Không sửa schema thủ công ngoài migration.

## Email và lịch tư vấn
Tạo sender đã xác minh ở Resend và đặt EMAIL_FROM thành sender đó. Giá trị mặc định onboarding@resend.dev chỉ phù hợp thử nghiệm theo giới hạn của nhà cung cấp. Booking chưa được xem là hoạt động cho đến khi có URL nhà cung cấp lịch đã xác minh.

## Ước tính giá
POST /api/estimate nhận JSON gồm pages, complexity (simple/standard/advanced), integrations và trả khoảng min/max VND kèm disclaimer. Quy tắc hiện tại là mức tham khảo kỹ thuật; chủ doanh nghiệp cần xác nhận hoặc điều chỉnh trước khi dùng công khai.

## Quản trị CRM
Trang admin.html cung cấp quản lý lead, CRM, quote, CMS, template, orders, projects/milestones và tickets. Trang portal.html dành cho customer. Trang được đánh dấu noindex; URL không phải cơ chế bảo mật. Người quản trị đăng nhập bằng Better Auth và phải có vai trò admin/staff được cấp từ phía máy chủ. Phiên dùng cookie và yêu cầu CORS/credentials được cấu hình đúng cho origin quản trị. Vai trò được gán ngoài luồng; không cho phép tự đăng ký thành admin. Lưu ý: do session cookie là thông tin xác thực, nên host trang quản trị và API trên cùng site đáng tin cậy (ví dụ cùng custom domain) trước khi sử dụng thật; GitHub Pages và workers.dev là hai site khác nhau và có thể bị chặn cookie bên thứ ba. Chưa coi giao diện hiện tại là staging/production accepted cho đến khi xác minh cookie/CORS trên origin thực.

## Quyền riêng tư và production gate
- Chỉ thu thập trường cần cho tư vấn; consent phải rõ ràng và có timestamp.
- Trước khi nhận dữ liệu khách hàng thật, xuất bản chính sách quyền riêng tư đúng pháp lý, xác định thời hạn lưu trữ/xóa dữ liệu, quy trình xử lý yêu cầu xóa và người phụ trách.
- Cần cấu hình email, kiểm tra CORS/rate limit, kiểm thử API/database, backup/monitoring, xác minh domain và security review.
- Rate limit D1 là lớp cơ bản; với traffic thật nên bổ sung Cloudflare WAF/Turnstile hoặc rate limiting tại edge.
- Không ghi email, nội dung brief hoặc token vào log ứng dụng.
- Backend chưa được deploy vì cần tài khoản Cloudflare, database ID, URL API và secrets do chủ dự án kiểm soát.

## QA / nghiệm thu
- [ ] Schema migration chạy thành công trên database mới.
- [ ] Health endpoint trả 200.
- [ ] Dữ liệu sai và request không phải JSON bị từ chối.
- [ ] Lead hợp lệ được lưu cùng consent timestamp.
- [ ] Lỗi email không làm mất lead.
- [ ] Origin ngoài allowlist bị từ chối.
- [ ] Rate limit trả 429 sau ngưỡng.
- [ ] Endpoint quản trị lead trả 401 khi chưa đăng nhập, 403 nếu user không có vai trò admin/staff, và không chấp nhận ADMIN_TOKEN cũ.
- [ ] Chỉ trạng thái hợp lệ được cập nhật và có audit event.
- [ ] Không có secrets trong repository hoặc frontend.
- [ ] Website fallback hoạt động khi API chưa cấu hình.
- [ ] Kiểm tra mobile, keyboard, labels, live region, SEO và GitHub Pages preview.


## PR preview và staging an toàn

Workflow `.github/workflows/pr-preview.yml` tạo artifact tĩnh riêng cho mỗi pull request, giữ trong 7 ngày. Mở tab **Actions → Build isolated PR preview → run tương ứng → Artifacts** để tải gói preview; giải nén và chạy `python -m http.server 4173`, sau đó mở `http://localhost:4173`. Đây là bản xem giao diện tĩnh, không phải URL web preview công khai và không chứng minh session Better Auth hoạt động trên môi trường thật.

Không dùng workflow GitHub Pages production để preview PR vì workflow Pages hiện tại xuất bản từ `main` lên cùng một site. Để có URL preview trực tuyến, cần tạo Cloudflare Pages project riêng (không phải production), cấu hình secrets/variables cho tài khoản Cloudflare và triển khai branch preview riêng. Để kiểm thử đăng nhập end-to-end, cần thêm Worker staging + D1 staging riêng, migrations áp dụng vào D1 staging, `AUTH_BASE_URL` và `ALLOWED_ORIGINS` khớp origin thực tế, rồi xác minh cookie/CORS. Không dùng database production hoặc bí mật production cho preview.

### Gate staging trước khi dùng dữ liệu thật
- [ ] Tạo Cloudflare Pages project preview riêng và xác minh URL preview.
- [ ] Tạo Worker/D1 staging riêng; thay placeholder database ID bằng ID staging thực tế.
- [ ] Đặt secrets staging trong Cloudflare/GitHub, không commit vào repository.
- [ ] Chạy migrations trên D1 staging và cấu hình `AUTH_BASE_URL`, `ALLOWED_ORIGINS` theo origin đã xác minh.
- [ ] Kiểm tra login/logout, session cookie, CORS, role admin/staff, từ chối user thường và từ chối token legacy.
- [ ] Không merge hoặc deploy production chỉ dựa trên CI xanh hay static preview artifact.


Staging-specific runbook and isolated config template: [CLOUDFLARE_STAGING_RUNBOOK.md](CLOUDFLARE_STAGING_RUNBOOK.md) and [wrangler.staging.example.toml](../backend/wrangler.staging.example.toml). The local `backend/wrangler.staging.toml` is intentionally gitignored.


## CMS media và Cloudflare R2

- Tạo bucket riêng cho staging và production; không bật public bucket access. Tên mặc định trong cấu hình: hoiquanweb-media-staging và hoiquanweb-media.
- Lệnh tạo bucket (chạy bằng tài khoản Cloudflare của chủ dự án):
  - `npx wrangler r2 bucket create hoiquanweb-media-staging`
  - `npx wrangler r2 bucket create hoiquanweb-media`
- Binding `MEDIA_BUCKET` được khai báo trong wrangler.toml, wrangler.staging.example.toml và wrangler.test.toml. Local integration test dùng R2 simulator; production/staging phải có bucket thật đúng tên.
- Migration `0010_cms_media_assets.sql` tạo metadata và index. Áp dụng trên D1 staging trước khi kiểm tra upload; chỉ áp dụng production sau backup và xác minh database ID.
- Admin upload tạo asset draft. Chỉ Admin có thể publish/archive; public Worker chỉ stream ảnh published. Bucket object key không xuất hiện trong public response.
- Không sử dụng CMS public media để lưu hợp đồng, hồ sơ khách hàng hoặc file dự án riêng tư. Những file đó cần endpoint riêng với customer membership/project authorization.
- Không coi upload/preview local hoặc CI pass là bằng chứng R2 staging/production đã được cấu hình. Ghi lại bucket ID/tên, migration run và kiểm thử runtime trong checklist triển khai.
