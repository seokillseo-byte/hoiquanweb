# Hội Quán Web

Hội Quán Web được định hướng thành nền tảng vận hành công ty thiết kế website: website dịch vụ nhiều trang, CMS riêng, kho mẫu WordPress + HTML/CSS, quản trị kinh doanh và cổng khách hàng.

**Tình trạng hiện tại:** repository vẫn chủ yếu là frontend tĩnh và backend scaffold. CMS, template marketplace có dữ liệu thật, xác thực/phân quyền và cổng khách hàng chưa được triển khai hoặc nghiệm thu production. Không coi CI xanh là bằng chứng các chức năng này đang chạy.

## Tài liệu dự án

- [Kiến trúc đích](docs/ARCHITECTURE.md)
- [Mô hình dữ liệu logic](docs/DATA_MODEL.md)
- [API contract ban đầu](docs/API_CONTRACT.md)
- [ADR — lựa chọn stack ban đầu](docs/adr/0001-initial-platform-stack.md)
- [Roadmap và tiêu chí nghiệm thu](docs/IMPLEMENTATION_ROADMAP.md)
- [Hướng dẫn cấu hình backend lead hiện có](docs/PHASE_2_BACKEND_SETUP.md)
- [SEO foundation và design system hiện tại](docs/SEO_AND_DESIGN_SYSTEM.md)

## Preview hiện tại

GitHub Actions triển khai frontend tĩnh lên GitHub Pages khi có thay đổi trên `main`.

- Preview URL dự kiến: https://seokillseo-byte.github.io/hoiquanweb/
- Workflows: https://github.com/seokillseo-byte/hoiquanweb/actions

GitHub Pages chỉ phục vụ frontend tĩnh; nó không chạy Cloudflare Worker, tạo D1 database hoặc cung cấp xác thực/cơ sở dữ liệu cho portal.

## Chạy frontend hiện tại ở local

Mở `index.html` hoặc chạy server tĩnh trong thư mục dự án:

```bash
python -m http.server 4173
```

Sau đó mở `http://localhost:4173`.

## Backend hiện có — chưa được xác minh production

Có Cloudflare Worker scaffold và D1 migration cho lead, lịch sử lead và rate limiting. Cấu hình hiện tại vẫn chứa placeholder D1 database ID, còn API base frontend chưa cấu hình. Không gửi dữ liệu khách hàng thật cho đến khi backend được cấu hình, deploy và kiểm thử.

Xem [docs/PHASE_2_BACKEND_SETUP.md](docs/PHASE_2_BACKEND_SETUP.md). Không commit secrets và không gửi token/password vào chat hoặc mã nguồn.

## Mục tiêu sản phẩm

1. Website công khai nhiều trang với SEO, dịch vụ, dự án, blog, FAQ và trang pháp lý.
2. CMS riêng để quản lý trang, bài viết, media, SEO, dịch vụ, giá và nội dung xuất bản.
3. Kho mẫu WordPress và HTML/CSS, có tìm kiếm, lọc, preview, phiên bản, compatibility và license.
4. Cổng khách hàng ngay từ bản phát hành đầu tiên: tài khoản an toàn, báo giá, đơn hàng, tiến độ, file, duyệt và hỗ trợ.
5. CRM và vận hành: leads, khách hàng, báo giá, dự án, công việc, thông báo và báo cáo.
6. Giai đoạn sau: page builder, triển khai WordPress có kiểm soát, hosting/domain và AI automation.

## Quy tắc phát triển

- Thực hiện thay đổi qua feature branch và pull request; không sửa thẳng `main` cho các thay đổi kiến trúc.
- Mỗi tính năng cần kiểm thử tương ứng, kiểm tra bảo mật và tiêu chí nghiệm thu.
- Phân biệt rõ mã nguồn, deploy và nghiệm thu runtime.
- Không công bố dữ liệu demo, giá tham khảo, case study hoặc chức năng chưa xác minh như sự thật production.
- Chỉ chuyển giai đoạn khi acceptance gates trong roadmap đạt; các thao tác cần tài khoản, billing hoặc secrets của chủ dự án phải được ghi rõ là blocker.
