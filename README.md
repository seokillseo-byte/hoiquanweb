# Hội Quán Web

Hội Quán Web được định hướng thành nền tảng vận hành công ty thiết kế website: website dịch vụ nhiều trang, CMS riêng, kho mẫu WordPress + HTML/CSS, quản trị kinh doanh và cổng khách hàng.

**Tình trạng hiện tại:** generator hiện tạo 40 route HTML song ngữ (20 cặp VI/EN); điều này xác nhận route generation, không đồng nghĩa toàn bộ nội dung đã được duyệt hoặc đủ điều kiện index. SEO runtime, sitemap/indexation policy, form end-to-end và Preview acceptance vẫn cần kiểm tra theo Blueprint. CMS có giao diện/API quản lý pages/posts/services, revision history và restore; blog song ngữ có category/tags, tìm kiếm, lọc danh mục và bài viết chi tiết; template catalog song ngữ có admin CRUD, lọc và workflow xuất bản. CRM đã có lead pipeline, lead conversion idempotent, customer workspace, activity timeline, báo giá và phân quyền Better Auth. Customer portal có quote, order, project/milestone/comment và support ticket; admin có quy trình quản lý tương ứng. Lead assignment có migration 0008, API kiểm tra role admin/staff, event history, audit log và giao diện phân công/xem lịch sử trong admin. Cloudflare Worker/D1 chưa được cấu hình và nghiệm thu staging/production; HQ_API_BASE chưa được cấu hình; public CMS renderer chỉ ghi đè trang tĩnh có slug tương ứng. CMS media library có mã nguồn R2-backed với upload ảnh giới hạn MIME/signature/5 MiB, alt text, draft/publish/archive và public delivery chỉ cho asset published; cần tạo R2 bucket và chạy migration 0010 trên Cloudflare. Private customer project files now have membership-scoped upload/download APIs and portal/admin UI, private R2 storage, internal/customer visibility and local integration tests; Cloudflare staging acceptance remains pending. In-app notifications for project/milestone/ticket events now have a user-scoped inbox and read-state API; CRM dashboard provides D1-backed KPIs, lead status breakdown, recent leads and safe activity summaries. Lead email delivery đã có durable D1 outbox, retry scheduler và Resend idempotency ở mức mã nguồn/CI; sender domain/secrets và cron runtime Cloudflare vẫn cần nghiệm thu. Payment/invoicing, template package upload/provisioning và các tích hợp vận hành vẫn còn trong roadmap. Không coi CI xanh là bằng chứng backend đang chạy thực tế.

## Tài liệu dự án

- [Master Blueprint — nguồn điều hướng Planning](docs/MASTER_BLUEPRINT.md)
- [Blueprint Cross-check — đối chiếu 19 modules và Phase 0 blockers](docs/BLUEPRINT_CROSS_CHECK.md)
- [Owner Decision Review — các quyết định chờ Project Owner xác nhận](docs/OWNER_DECISION_REVIEW.md)
- [BP-17 Risk Assessment](docs/RISK_ASSESSMENT.md)
- [Kiến trúc đích](docs/ARCHITECTURE.md)
- [Mô hình dữ liệu logic](docs/DATA_MODEL.md)
- [API contract ban đầu](docs/API_CONTRACT.md)
- [ADR — lựa chọn stack ban đầu](docs/adr/0001-initial-platform-stack.md)
- [ADR — xác thực, session và file riêng tư](docs/adr/0002-authentication-and-private-media.md)
- [Roadmap và tiêu chí nghiệm thu](docs/IMPLEMENTATION_ROADMAP.md)
- [Hướng dẫn cấu hình backend lead hiện có](docs/PHASE_2_BACKEND_SETUP.md)
- [SEO foundation và design system hiện tại](docs/SEO_AND_DESIGN_SYSTEM.md)
- [URL Map — 40 route song ngữ và indexation matrix](docs/URL_MAP.md)
- [Feature Blueprint — Core Preview P0](docs/FEATURE_BLUEPRINT.md)
- [UI Blueprint — public website](docs/UI_BLUEPRINT.md)
- [UX Blueprint — visitor journey and inquiry flow](docs/UX_BLUEPRINT.md)

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

Repository hiện có migration CRM `0003_crm_foundation.sql`, CMS revisions `0005_cms_revisions.sql`, Better Auth, CMS admin APIs, CRM customer/activity APIs và UI, quote management APIs/UI và customer quote portal. Các migration này chưa được áp dụng lên database thật; lead pipeline/conversion, CRM dashboard, email delivery, order/project workflows và các phần còn lại của customer portal vẫn chưa hoàn thiện. Xem [docs/PHASE_2_BACKEND_SETUP.md](docs/PHASE_2_BACKEND_SETUP.md). Không commit secrets và không gửi token/password vào chat hoặc mã nguồn.

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


### Customer workspace

The static `portal.html` now includes customer quote access, order history, project milestones/comments and support ticket conversations. Customer data is scoped by server-side customer membership. The portal is noindex and requires a configured Worker API plus provisioned customer membership; self-registration alone does not create customer access. Admin order/project/ticket management UI is implemented. Private attachments, notifications, payments and production Worker/D1 deployment remain incomplete.
