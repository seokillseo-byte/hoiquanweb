# Lộ trình triển khai Hội Quán Web

## Phạm vi và nguyên tắc
Bản đầu tiên là website giới thiệu dịch vụ tĩnh có tương tác phía trình duyệt. Không mô tả các luồng chưa có backend là tính năng đã vận hành. Các chức năng lưu dữ liệu, đăng nhập, phân quyền, thanh toán, gửi email, CRM và quản lý dự án cần API, database, secrets và quy trình bảo mật riêng.

## Phase 1 — Website công khai và preview (đã tạo mã nguồn)
- Trang chủ, dịch vụ, quy trình, portfolio concept, lợi ích, gói giá tham khảo, FAQ, CTA và brief.
- Responsive desktop/mobile, menu mobile, FAQ accordion, thông báo trạng thái, điều hướng bàn phím và reduced motion.
- Metadata SEO, canonical, Open Graph, JSON-LD, robots.txt, sitemap.xml và trang 404.
- GitHub Actions deploy static site lên GitHub Pages.

Tiêu chí nghiệm thu:
- [ ] Trang không tràn ngang ở mobile và desktop.
- [ ] Anchor và menu hoạt động; FAQ có trạng thái aria-expanded.
- [ ] Form brief kiểm tra trường bắt buộc và thông báo rõ rằng demo không gửi dữ liệu lên server.
- [ ] Không công bố concept portfolio như dự án khách hàng đã xác minh.
- [ ] Kiểm tra title/meta, canonical, robots, sitemap, heading, liên kết nội bộ và JSON-LD.
- [ ] Workflow Pages chạy thành công và URL preview được xác nhận trong Actions/Deployments.
- [ ] Chạy kiểm tra accessibility, Lighthouse, link và thiết bị trước khi phát hành.

## Phase 2 — Lead, báo giá và CRM tối thiểu (mã nguồn đã bổ sung; chưa deploy)
Đã thêm Cloudflare Worker API, D1 schema/migration, validation, CORS allowlist, honeypot, rate limit cơ bản, consent timestamp, endpoint ước tính chi phí, endpoint CRM nội bộ có bearer token, email notification tùy chọn qua Resend và endpoint trả URL booking khi đã cấu hình. Frontend có checkbox consent, bộ ước tính sơ bộ và gửi lead khi API URL được cấu hình; nếu chưa cấu hình, form vẫn chỉ tạo/copy/tải brief.

Còn cần chủ dự án cấu hình Cloudflare/D1, URL Worker, secrets, email sender, nhà cung cấp booking, chính sách quyền riêng tư cuối cùng và kiểm thử trên môi trường thật. Chưa có UI quản trị CRM và chưa có email/booking hoạt động mặc định. Xem docs/PHASE_2_BACKEND_SETUP.md.

Tiêu chí nghiệm thu:
- [ ] Không mất lead khi API lỗi; có trạng thái lỗi và khả năng gửi lại.
- [ ] Bí mật API chỉ lưu ở server/secret store, không nhúng trong frontend.
- [ ] Có consent, chính sách lưu trữ/xóa dữ liệu và log tối thiểu cần thiết.
- [ ] Kiểm thử xác thực, chống spam, rate limit, email và webhook.

## Phase 3 — Cổng khách hàng và quản lý dự án
Chức năng: đăng nhập an toàn, reset mật khẩu, phân quyền khách hàng/PM/thiết kế/dev/admin; dự án, mốc tiến độ, deadline, file/asset, nhật ký thay đổi và thông báo; phiên bản thiết kế, bình luận theo vị trí, phản hồi, yêu cầu chỉnh sửa và xác nhận duyệt.

Tiêu chí nghiệm thu:
- [ ] Một khách hàng không thể đọc hoặc sửa dự án của khách hàng khác.
- [ ] Mọi hành động duyệt/đổi trạng thái có người thực hiện và thời gian.
- [ ] Có audit log, xử lý session, quyền truy cập tối thiểu và backup.
- [ ] Kiểm thử quyền truy cập theo vai trò và kiểm thử khôi phục dữ liệu.

## Phase 4 — CMS, vận hành và tăng trưởng
Chức năng: CMS cho dịch vụ, trang ngành, portfolio, blog, FAQ và metadata SEO; analytics/consent, sự kiện chuyển đổi, dashboard KPI; ticket hỗ trợ, SLA, knowledge base, bảo trì, backup và monitoring; tích hợp CRM, thanh toán/hợp đồng hoặc AI với human review.

Tiêu chí nghiệm thu:
- [ ] Có staging trước production và quy trình rollback.
- [ ] Kiểm thử Core Web Vitals, accessibility, SEO, bảo mật và form trước phát hành.
- [ ] Có backup/restore test, cảnh báo lỗi và người phụ trách sự cố.
- [ ] AI không tự gửi nội dung/báo giá/hợp đồng ra ngoài khi chưa được duyệt.

## Quy tắc preview cho mỗi đợt thiết kế
1. Thực hiện thay đổi trên nhánh tính năng hoặc PR khi quy trình nhóm đã sẵn sàng.
2. Chạy kiểm tra và xem diff trước khi merge.
3. Mỗi commit vào main kích hoạt GitHub Actions để cập nhật GitHub Pages.
4. Kiểm tra trạng thái workflow và mở URL preview trong Actions/Deployments.
5. Không đánh dấu nghiệm thu chỉ dựa vào workflow; cần kiểm tra giao diện, liên kết, biểu mẫu, SEO và accessibility.

## Cổng phát hành production
Không đưa website vào sử dụng thương mại cho đến khi có domain chính thức, thông tin liên hệ đã xác minh, chính sách pháp lý, backend bảo mật cho dữ liệu khách hàng, kiểm thử toàn diện và xác nhận quyền sử dụng nội dung/ảnh.
