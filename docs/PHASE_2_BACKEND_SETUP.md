# Phase 2 — Lead API, ước tính chi phí và CRM tối thiểu

## Kiến trúc
- Website tĩnh tiếp tục preview/deploy bằng GitHub Pages.
- API chạy riêng trên Cloudflare Workers; lead lưu trong Cloudflare D1.
- Email thông báo tùy chọn qua Resend. Lỗi gửi email không làm mất lead đã lưu.
- Lịch tư vấn trả về từ GET /api/booking; chưa có nhà cung cấp lịch mặc định nên trả 503 cho đến khi cấu hình.
- API có allowlist CORS, validation, honeypot, rate limit cơ bản theo IP hash, security headers, consent timestamp và endpoint CRM bảo vệ bằng bearer token.

## Endpoints

| Method | Path | Mục đích |
|---|---|---|
| GET | /api/health | Health check, không trả dữ liệu cá nhân |
| POST | /api/leads | Validate và lưu brief/lead; email thông báo nếu cấu hình |
| POST | /api/estimate | Ước tính khoảng chi phí theo quy tắc công khai |
| GET | /api/booking | Trả URL đặt lịch nếu đã cấu hình |
| GET | /api/admin/leads?status=new&limit=50 | Danh sách lead, yêu cầu Authorization: Bearer ADMIN_TOKEN |
| PATCH | /api/admin/leads | Đổi trạng thái lead, yêu cầu token |

Trạng thái CRM: new, contacted, qualified, proposal_sent, won, lost, spam.

## Kiểm tra tự động
Workflow .github/workflows/validate.yml chạy kiểm tra cú pháp JavaScript, cấu trúc HTML/anchor và migration SQL khi push hoặc mở pull request. Workflow Pages chỉ publish các tệp public website (index.html, privacy.html, 404.html, robots.txt, sitemap.xml), không đưa thư mục backend và tài liệu triển khai vào artifact website.

## Triển khai lần đầu
1. Tạo tài khoản Cloudflare và D1 database tên hoiquanweb-production.
2. Trong thư mục backend, chạy npx wrangler d1 create hoiquanweb-production.
3. Thay database_id trong wrangler.toml bằng ID thực Cloudflare trả về.
4. Chạy migration: npx wrangler d1 migrations apply hoiquanweb-production --remote.
5. Chạy local: npx wrangler dev; kiểm tra /api/health trên URL local của Wrangler.
6. Cấu hình secrets: npx wrangler secret put ADMIN_TOKEN. Nếu cần email, thêm RESEND_API_KEY và NOTIFICATION_EMAIL.
7. Đặt ALLOWED_ORIGINS thành origin chính xác. Với GitHub Pages hiện tại là https://seokillseo-byte.github.io; khi có domain riêng hãy cập nhật origin production.
8. Deploy API bằng npx wrangler deploy và lưu URL Worker thực tế.
9. Cập nhật meta[name="hq-api-base"] trong index.html thành URL Worker (không có dấu / cuối), rồi commit để GitHub Pages triển khai website.
10. Kiểm tra health, gửi brief thử, dữ liệu D1, email, rate limit và CORS.

## Email và lịch tư vấn
Tạo sender đã xác minh ở Resend và đặt EMAIL_FROM thành sender đó. Giá trị mặc định onboarding@resend.dev chỉ phù hợp thử nghiệm theo giới hạn của nhà cung cấp. Booking chưa được xem là hoạt động cho đến khi có URL nhà cung cấp lịch đã xác minh.

## Ước tính giá
POST /api/estimate nhận JSON gồm pages, complexity (simple/standard/advanced), integrations và trả khoảng min/max VND kèm disclaimer. Quy tắc hiện tại là mức tham khảo kỹ thuật; chủ doanh nghiệp cần xác nhận hoặc điều chỉnh trước khi dùng công khai.

## Quản trị CRM
Trang admin.html cung cấp giao diện tối giản để xem tối đa 100 lead gần nhất và đổi trạng thái. Trang được đánh dấu noindex; URL không phải cơ chế bảo mật, API vẫn yêu cầu ADMIN_TOKEN. Người quản trị nhập token thủ công; trang không lưu token vào localStorage/cookie. Chỉ sử dụng trên thiết bị đáng tin cậy, tải lại trang để xóa token khỏi bộ nhớ và không chia sẻ token. Không bao giờ nhúng ADMIN_TOKEN cố định vào HTML/JavaScript.

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
- [ ] Endpoint admin trả 401 khi thiếu/sai token.
- [ ] Chỉ trạng thái hợp lệ được cập nhật và có audit event.
- [ ] Không có secrets trong repository hoặc frontend.
- [ ] Website fallback hoạt động khi API chưa cấu hình.
- [ ] Kiểm tra mobile, keyboard, labels, live region, SEO và GitHub Pages preview.
