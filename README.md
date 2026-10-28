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
- Phase 2 — Brief/lead API, email notifications, booking and CRM integration.
- Phase 3 — Authenticated customer portal, milestones, design review and approval.
- Phase 4 — CMS, analytics, support workflows, monitoring, backups and production QA.
