# SEO Foundation & Design System — Hội Quán Web

## 1. SEO nền tảng hiện tại
- Ngôn ngữ tài liệu: vi; có viewport cho thiết bị di động.
- Có title, meta description, robots meta, canonical, Open Graph và JSON-LD.
- Có robots.txt, sitemap.xml và 404.html.
- Điều hướng nội bộ sử dụng liên kết đến các section có ID ổn định.
- Nội dung hiện là landing page một trang. Khi triển khai nhiều trang, cần mở rộng sitemap và xây dựng URL riêng cho dịch vụ, ngành, dự án, bài viết, chính sách và liên hệ.
- Canonical/URL hiện dùng GitHub Pages làm preview. Khi có domain production, phải thay canonical, Open Graph URL, sitemap và JSON-LD bằng domain chính thức.
- Schema phải mô tả đúng loại hình tổ chức và thông tin đã xác minh; không tạo đánh giá, địa chỉ, số điện thoại hay thành tích giả.
- SEO không bảo đảm thứ hạng. Cần đo index coverage, organic clicks, impressions, conversions, Core Web Vitals và lỗi crawl sau khi ra mắt.

## 2. Kiến trúc nội dung mục tiêu
- Trang chủ: định vị thương hiệu, giá trị, giải pháp, quy trình, bằng chứng, CTA.
- Trang dịch vụ: /dich-vu/website-doanh-nghiep/, /dich-vu/thuong-mai-dien-tu/, /dich-vu/landing-page/, /dich-vu/seo-website/, /dich-vu/ux-ui/, /dich-vu/bao-tri-website/.
- Trang giải pháp theo ngành: chỉ tạo khi có chuyên môn, nội dung riêng và nhu cầu tìm kiếm rõ.
- Dự án/case study: chỉ công bố khách hàng, kết quả và chỉ số khi có bằng chứng và quyền công bố.
- Kiến thức/blog: nhóm theo chủ đề và intent; mỗi bài có tác giả/người duyệt, ngày cập nhật, nguồn và liên kết đến trang dịch vụ phù hợp.
- Chuyển đổi: brief, tư vấn, báo giá, lịch hẹn và chính sách quyền riêng tư.
- Tin cậy/pháp lý: giới thiệu, liên hệ xác minh, điều khoản, quyền riêng tư, cookie/consent nếu dùng tracking.

## 3. Quy tắc giao diện
- Token màu: --ink, --muted, --paper, --white, --line, --blue, --blue2, --lime, --navy.
- Token bố cục: --max, --radius, --shadow; khoảng cách và typography ưu tiên theo thang nhất quán.
- Component hiện có: button, card, eyebrow, section heading, service card, process step, project card, benefit, pricing card, form field, FAQ accordion, toast và footer.
- Breakpoint responsive chính: 980px và 720px; kiểm tra thêm các kích thước trung gian.
- Có skip link, focus outline, label form, live region, aria-expanded, accessible label phù hợp và hỗ trợ prefers-reduced-motion.
- Mục tiêu accessibility là WCAG 2.1 AA; vẫn cần kiểm thử tự động và thủ công (keyboard, screen reader, contrast, zoom).
- Tránh nội dung giả, testimonial giả hoặc kết quả SEO không có chứng cứ trong bản production.

## 4. Checklist kiểm thử
- [ ] Kiểm tra tất cả liên kết, CTA, menu, FAQ và biểu mẫu.
- [ ] Kiểm tra keyboard-only, focus-visible, labels, contrast và reduced motion.
- [ ] Kiểm tra 320px, 375px, 768px, 1024px và màn hình rộng; không có horizontal overflow.
- [ ] Kiểm tra HTML title/meta/canonical/robots/sitemap/structured data bằng validator phù hợp.
- [ ] Kiểm tra 404, đường dẫn tương đối và URL GitHub Pages.
- [ ] Đo Lighthouse/Performance, tải font/ảnh và Core Web Vitals khi có môi trường chạy thật.
- [ ] Thay mọi nội dung concept, giá tham khảo và thông tin liên hệ bằng dữ liệu được chủ dự án xác nhận trước khi ra mắt.
