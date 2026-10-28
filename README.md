# Hội Quán Web

Website dịch vụ thiết kế website — SEO-first, responsive, lấy khách hàng làm trung tâm.

## Preview tự động

Workflow GitHub Actions tại `.github/workflows/pages.yml` triển khai site lên GitHub Pages mỗi khi có thay đổi trên nhánh `main`.

1. Mở **Settings → Pages** và chọn **GitHub Actions** làm build/deployment source nếu GitHub yêu cầu.
2. Mở tab **Actions**, chọn workflow **Deploy preview to GitHub Pages** và đợi job thành công.
3. URL mặc định dự kiến: https://seokillseo-byte.github.io/hoiquanweb/
4. Mỗi lần cập nhật giao diện, push lên `main` sẽ kích hoạt một lần deploy mới. Có thể xem trạng thái và URL preview trong **Actions / Deployments**.

## Chạy local

Mở `index.html` trực tiếp, hoặc chạy static server trong thư mục dự án:

```bash
python -m http.server 4173
```

Sau đó mở `http://localhost:4173`.

## Phase 2 — Backend scaffold và chuyển đổi lead

- Cloudflare Worker API: tiếp nhận lead, validation, CORS allowlist, honeypot, rate limit cơ bản và security headers.
- Cloudflare D1 schema/migration cho lead, lịch sử thay đổi và rate limit.
- API ước tính khoảng chi phí; trạng thái CRM; endpoint quản trị bảo vệ bằng bearer token và trang admin.html để xem/phân loại lead.
- Tích hợp email qua Resend theo cấu hình; lỗi email không làm mất lead.
- Biểu mẫu có consent, fallback tải/copy brief khi API chưa cấu hình và bộ ước tính giá ở frontend.
- Trang thông tin quyền riêng tư nêu rõ các hạng mục phải xác nhận trước khi nhận dữ liệu thật.
- Hướng dẫn triển khai: [docs/PHASE_2_BACKEND_SETUP.md](docs/PHASE_2_BACKEND_SETUP.md).

**Chưa deploy backend:** cần tài khoản Cloudflare, D1 database ID, URL Worker và secrets do chủ dự án cấu hình. GitHub Pages chỉ phục vụ frontend tĩnh; backend không thể chạy trực tiếp trên GitHub Pages.

## Đã có trong bản giao diện đầu tiên

- Trang giới thiệu dịch vụ, quy trình, portfolio concept, lợi ích, gói giá tham khảo, FAQ và CTA.
- Brief dự án có kiểm tra trường bắt buộc và xuất/copy bản tóm tắt.
- Responsive mobile/desktop, menu mobile, FAQ tương tác, trạng thái focus, reduced motion, skip link.
- Metadata SEO cơ bản, canonical, Open Graph, JSON-LD.
- Preview deployment bằng GitHub Pages.

## Chưa phải tính năng production

Các chức năng sau chưa kết nối backend trong bản front-end này: đăng nhập/cổng khách hàng, CRM, lưu lead, đặt lịch thực, báo giá tự động có tính ràng buộc, thanh toán, chat/ticket, quản lý dự án và duyệt phiên bản thiết kế, CMS, analytics thực tế, gửi email, sao lưu/monitoring. Chúng cần backend, cơ sở dữ liệu, phân quyền, tích hợp dịch vụ và chính sách bảo mật trước khi dùng với khách hàng thật.

Các case study trên trang hiện là **concept minh họa**, không phải dự án khách hàng đã xác minh. Giá hiển thị là mức tham khảo cần được xác nhận trước khi công bố chính thức.

## Roadmap đề xuất

- Phase 1 — Public website, design system, SEO foundations, preview.
- Phase 2 — Lead API/ước tính/CRM scaffold đã có trong repo; cần cấu hình và deploy Cloudflare để vận hành. Booking/email cần provider và secrets.
- Phase 3 — Authenticated customer portal, milestones, design review and approval.
- Phase 4 — CMS, analytics, support workflows, monitoring, backups and production QA.
