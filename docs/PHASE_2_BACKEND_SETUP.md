# Backend, CMS, CRM và Customer Portal — Deployment Runbook

## Kiến trúc
- Website tĩnh production tiếp tục deploy bằng GitHub Pages từ `main`; PR preview được đóng gói thành GitHub Actions artifact riêng, không ghi đè website production.
- API chạy riêng trên Cloudflare Workers; lead lưu trong Cloudflare D1.
- Email thông báo tùy chọn qua Resend. Lỗi gửi email không làm mất lead đã lưu.
- Lịch tư vấn trả về từ GET /api/booking; chưa có nhà cung cấp lịch mặc định nên trả 503 cho đến khi cấu hình.
- API có allowlist CORS, validation, honeypot, rate limit cơ bản theo IP hash, security headers và consent timestamp. Endpoint quản trị yêu cầu Better Auth session và vai trò admin/staff được cấp từ phía máy chủ.
- Better Auth dùng cookie HttpOnly, Secure, SameSite=Lax; production frontend/API phải ở cùng site tin cậy để tránh third-party cookies.
- D1 migrations hiện gồm 0001 đến 0012: lead, CMS, CRM/quotes/identity, revisions, template metadata, orders/projects/milestones/comments/tickets, lead assignment, blog post category/tags, CMS media metadata, private project file metadata và CRM in-app notifications.

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

## Triển khai staging lần đầu — không đụng production

**Bắt buộc nghiệm thu staging trước.** Repository hiện chưa có Worker/D1 staging thật; `backend/wrangler.toml` vẫn chứa D1 ID placeholder cho production. Không tạo database production, không thay production ID và không chạy migration production trong giai đoạn này.

1. Xác nhận tài khoản Cloudflare do chủ dự án kiểm soát và tạo API token có quyền tối thiểu cần thiết cho Workers, D1, R2.
2. Từ thư mục gốc repository, cài dependencies bằng `npm ci`.
3. Tạo D1 staging riêng: `npx wrangler d1 create hoiquanweb-staging`. Lưu ID do Cloudflare trả về trong password manager; không gửi token hoặc secret vào chat.
4. Sao chép `backend/wrangler.staging.example.toml` thành `backend/wrangler.staging.toml`. File đích đã được .gitignore loại khỏi Git.
5. Chỉ thay `database_id` bằng ID của database `hoiquanweb-staging`. Không lấy ID từ `hoiquanweb-production`.
6. Tạo hai R2 bucket staging riêng: `npx wrangler r2 bucket create hoiquanweb-media-staging` và `npx wrangler r2 bucket create hoiquanweb-media-staging-preview`. Không bind bucket production vào staging.
7. Cấu hình `AUTH_BASE_URL` là HTTPS origin API staging và `ALLOWED_ORIGINS` là HTTPS origin frontend staging. Hai origin phải được xác minh thuộc cùng site đáng tin cậy (ví dụ `api-staging.hoiquanweb.io.vn` và `staging.hoiquanweb.io.vn`) để cookie Better Auth hoạt động; không mặc định dùng cặp `github.io` + `workers.dev`.
8. Chạy preflight từ thư mục gốc: `python scripts/validate_staging_config.py`. Không tiếp tục nếu script báo placeholder, sai database name hoặc origin không hợp lệ.
9. Từ thư mục `backend`, áp dụng migrations vào đúng D1 staging: `npx wrangler d1 migrations apply hoiquanweb-staging --remote --config wrangler.staging.toml`. Kiểm tra database name/ID trước khi xác nhận.
10. Từ thư mục `backend`, cấu hình secrets bằng `npx wrangler secret put RESEND_API_KEY --config wrangler.staging.toml` và (nếu cần) `npx wrangler secret put NOTIFICATION_EMAIL --config wrangler.staging.toml`. Không lưu secrets trong TOML hoặc source.
11. Deploy Worker staging: `npx wrangler deploy --config wrangler.staging.toml`. Ghi lại URL Worker và kiểm tra `GET /api/health` trả 200.
12. Kiểm thử Better Auth sign-up/sign-in/sign-out, role provisioning, CRM/lead, CMS, R2 media, file access, notifications, CORS, cookie flags, rate limit, email retry và cách ly customer. Chỉ dùng dữ liệu giả lập.
13. Kiểm thử frontend staging trên custom domain cùng site với API. Không đặt GitHub repository variable production `HQ_API_BASE` trỏ tới staging.
14. Chỉ sau khi tất cả staging gates đạt và chủ dự án phê duyệt riêng, mới lập kế hoạch production: tạo D1/R2 production riêng, backup, xác minh ID, review migration/rollback, domain/CORS/cookie, secrets và cửa sổ triển khai. Không tái sử dụng staging ID hoặc bucket.

**Không có bước nào ở trên được tự động thực hiện trong PR.** Cần Cloudflare account, D1 ID, R2 bucket, custom domain và secrets do chủ dự án quản lý. Production deploy, migration production và thay đổi secrets cần phê duyệt riêng.

## Identity, CRM membership và customer portal

- Better Auth email/password được cấu hình trong backend/src/better-auth.js; password tối thiểu 12 ký tự, session cookie HttpOnly + Secure + SameSite=Lax và database-backed rate limits cho sign-in/sign-up/password recovery.
- Migration 0004 tạo app_user_roles và crm_customer_members. Public sign-up không thể tự cấp role admin/staff hoặc customer membership.
- GET /api/v1/me trả identity và server-assigned roles; GET /api/v1/me/customers chỉ trả hồ sơ có membership.
- Admin/staff quản lý liên kết tại GET/POST /api/v1/admin/customers/:id/members. Tài khoản phải đăng ký trước; endpoint tìm Better Auth user theo email đã chuẩn hóa, upsert owner/member/billing và ghi audit event. Email không có tài khoản trả 404.
- Role admin/staff vẫn phải được gán qua quy trình vận hành được kiểm soát; không có public self-service role assignment.
- Customer portal portal.html có quote, order, project/milestone/comment, support ticket và tải lên/tải xuống tệp dự án riêng tư. Dữ liệu riêng tư được lọc bằng crm_customer_members; message responses không trả user ID nội bộ.
- Admin admin.html có thể quản lý tệp dự án theo phạm vi customer-visible hoặc internal; mọi lần tải xuống đều đi qua Worker sau khi xác thực staff/admin.
- Admin admin.html có CRM, quote, CMS, template, media library, order, project/milestone và support ticket management.
- CMS media library upload ảnh PNG/JPEG/GIF/WebP tối đa 5 MiB, lưu R2 ở chế độ private, hỗ trợ alt text, preview có xác thực, Admin publish/archive; public route chỉ stream asset đã published. API upload dùng multipart/form-data và không đặt thủ công Content-Type ở trình duyệt để giữ boundary do browser sinh.

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


## Private project file storage

- Migration `0011_private_project_files.sql` tạo metadata/index; chạy migration trên D1 staging trước khi kiểm thử runtime.
- Dùng binding R2 `MEDIA_BUCKET` đã khai báo trong Wrangler. Bucket phải để private; không bật public access. CMS media và project files dùng prefix tách biệt `cms/` và `projects/`.
- Giới hạn upload 10 MiB; loại tệp được hỗ trợ: PDF, PNG, JPEG, WebP, UTF-8 TXT và CSV. API kiểm tra MIME/signature/content, SHA-256, role và project membership.
- Customer upload luôn có visibility `customer`; staff/admin có thể chọn `customer` hoặc `internal`. Customer không thể list/download file internal. Admin/staff có thể list/download cả hai loại.
- Không có direct R2 URL, permanent signed URL hoặc public project-file route. Download đi qua Worker với membership check, `Content-Disposition: attachment`, `Cache-Control: private, no-store` và `X-Content-Type-Options: nosniff`.
- CI chạy local Wrangler/R2 simulator; staging nghiệm thu cần bucket thật, D1 migration 0011 và kiểm thử hai customer accounts khác nhau trước khi production.


## In-app notifications

- Migration `0012_crm_notifications.sql` tạo inbox theo user ID và index cho danh sách/thông báo chưa đọc.
- API: GET `/api/v1/me/notifications`, POST `/api/v1/me/notifications/:id/read`, POST `/api/v1/me/notifications/read-all`. Tất cả truy vấn/mutation chỉ thao tác notification thuộc session hiện tại.
- Project status/milestone và staff ticket reply tạo notification cho các customer members; customer project comments, ticket creation và customer ticket replies tạo notification cho staff/admin.
- Notification payload chỉ chứa summary chung và resource ID; không sao chép nội dung trao đổi, dữ liệu liên hệ hoặc thông tin nhạy cảm.
- Đây là in-app notification; Resend email chưa được cấu hình bởi migration/API này. Chỉ bật email sau khi xác minh sender domain, secrets, retry/idempotency và consent/policy.


## CRM dashboard

- `GET /api/v1/admin/dashboard` yêu cầu Better Auth session và role admin/staff.
- API tổng hợp counts trực tiếp từ D1: leads/new leads 7 ngày, active customers, quotes theo trạng thái, active orders/projects, overdue projects, open/urgent tickets.
- API trả lead status breakdown, 6 lead gần nhất và 10 audit activity summaries gần nhất; không trả raw `metadata_json`, nội dung comment/ticket hoặc secrets.
- Admin console hiển thị KPI cards, lead status, recent leads và recent activity. Dashboard không phải báo cáo kế toán/doanh thu ghi nhận.


## Email outbox và retry

- Migration 0013 tạo durable outbox, unique event key và index cho tác vụ đến hạn. Lead và outbox row được ghi cùng một D1 batch.
- Worker scheduled trigger chạy mỗi 5 phút, xử lý tối đa 10 email mỗi lượt. Email chỉ được gửi khi RESEND_API_KEY, NOTIFICATION_EMAIL và EMAIL_FROM đều được cấu hình.
- Retry tối đa 6 lần với backoff tăng dần; lỗi cuối chuyển trạng thái failed. Lease cho phép khôi phục tác vụ bị dừng giữa chừng.
- Mỗi lead dùng Resend Idempotency-Key lead-created/<lead-id>. Outbox chỉ lưu lead ID và trạng thái gửi, không nhân bản email/brief; log chỉ ghi mã lỗi tổng quát.
- Trước khi bật: áp dụng migration 0013 lên D1 staging, đặt secrets/vars, xác minh sender domain và kiểm thử cron + Resend thật. CI không thay thế runtime acceptance.
