import { useState } from "react";

type Area =
  | "overview" | "content" | "templates" | "crm" | "chatbot" | "customers"
  | "projects" | "seo" | "automation" | "commerce" | "hosting" | "settings";

type ModuleCard = { title: string; description: string; status: string };
type AreaConfig = { id: Area; label: string; detail: string; description: string; icon: string; cards: ModuleCard[] };

const areas: AreaConfig[] = [
  { id: "overview", label: "Tổng quan", detail: "Bức tranh toàn bộ nền tảng", description: "Bảng điều khiển mục tiêu cho hoạt động website, khách hàng và vận hành.", icon: "◫", cards: [
    { title: "CRM & bán hàng", description: "Lead, pipeline, lịch sử chăm sóc, báo giá và nhắc việc.", status: "Chưa triển khai" },
    { title: "CMS & kho mẫu", description: "Quản trị trang/bài viết và catalog WordPress, HTML/CSS.", status: "API đọc đang phát triển" },
    { title: "Chatbot AI", description: "Tư vấn ban đầu, thu lead, chuyển hội thoại cho nhân viên.", status: "Chưa triển khai" },
    { title: "SEO & AI content", description: "Metadata, internal link, schema, kiểm tra và hỗ trợ nội dung.", status: "Chưa triển khai" },
    { title: "Cổng khách hàng", description: "Báo giá, dự án, tiến độ, tài liệu và yêu cầu hỗ trợ.", status: "Chưa triển khai" },
    { title: "Hosting & tự động hóa", description: "Domain, SSL, provisioning, tác vụ nền và thông báo.", status: "Chưa triển khai" },
  ]},
  { id: "content", label: "Nội dung CMS", detail: "Trang, bài viết và thư viện media", description: "Quản lý nội dung có nháp, xem trước, xuất bản, lịch sử và SEO.", icon: "▤", cards: [
    { title: "Trang & bài viết", description: "CRUD, taxonomy, bản nháp, lịch xuất bản và revision.", status: "API đọc có trên nhánh PR" },
    { title: "SEO on-page", description: "Title, description, canonical, robots, schema và internal links.", status: "Chưa triển khai" },
    { title: "Media library", description: "Upload, tối ưu ảnh, quyền truy cập và metadata.", status: "Chưa triển khai" },
  ]},
  { id: "templates", label: "Kho website mẫu", detail: "Mẫu WordPress và HTML/CSS", description: "Catalog sản phẩm mẫu với demo, phiên bản, license và giá.", icon: "▦", cards: [
    { title: "WordPress themes", description: "Package, phiên bản, yêu cầu plugin và hướng dẫn cài đặt.", status: "API đọc có trên nhánh PR" },
    { title: "HTML/CSS templates", description: "Demo, cấu trúc file, responsive và quyền sử dụng.", status: "API đọc có trên nhánh PR" },
    { title: "Kiểm duyệt sản phẩm", description: "Rà soát mã nguồn, license, bảo mật và quy trình phát hành.", status: "Chưa triển khai" },
  ]},
  { id: "crm", label: "CRM & bán hàng", detail: "Quản lý lead đến khách hàng", description: "Tập trung pipeline, chăm sóc khách, báo giá và hoạt động bán hàng.", icon: "♙", cards: [
    { title: "Lead inbox", description: "Nguồn lead, trạng thái, phân công, chống trùng và lịch sử liên hệ.", status: "API lead cơ bản có mã nguồn; chưa xác minh production" },
    { title: "Pipeline & chăm sóc", description: "Các giai đoạn, nhắc follow-up, ghi chú và nhiệm vụ nhân viên.", status: "Chưa triển khai" },
    { title: "Báo giá & hợp đồng", description: "Báo giá theo hạng mục, phiên bản, duyệt và tài liệu liên quan.", status: "Chưa triển khai" },
  ]},
  { id: "chatbot", label: "Chatbot & hội thoại", detail: "Tư vấn khách hàng đa kênh", description: "Widget website, hộp thư hội thoại, bàn giao nhân viên và AI có kiểm soát.", icon: "☏", cards: [
    { title: "Widget chat website", description: "Giao diện chat, lời chào, FAQ và form thu thông tin khách.", status: "Chưa triển khai" },
    { title: "AI tư vấn dịch vụ", description: "Trả lời theo knowledge base được duyệt, có giới hạn và nguồn tham chiếu.", status: "Chưa triển khai" },
    { title: "Inbox & handoff", description: "Hội thoại, phân công nhân viên, trạng thái và lịch sử tương tác.", status: "Chưa triển khai" },
  ]},
  { id: "customers", label: "Cổng khách hàng", detail: "Không gian riêng của từng khách", description: "Khách hàng theo dõi báo giá, dự án và tài liệu sau khi đăng nhập.", icon: "♧", cards: [
    { title: "Tài khoản & quyền", description: "Đăng nhập, khôi phục tài khoản, session và cách ly dữ liệu khách hàng.", status: "Chưa triển khai" },
    { title: "Báo giá & phê duyệt", description: "Xem, xác nhận báo giá và lưu audit trail phía máy chủ.", status: "Chưa triển khai" },
    { title: "Tài liệu & hỗ trợ", description: "File riêng tư, bình luận, ticket và lịch sử xử lý.", status: "Chưa triển khai" },
  ]},
  { id: "projects", label: "Dự án & hỗ trợ", detail: "Từ khởi tạo đến bàn giao", description: "Theo dõi tiến độ, công việc, milestone, thay đổi và yêu cầu hỗ trợ.", icon: "✓", cards: [
    { title: "Dự án & milestone", description: "Phạm vi, deadline, người phụ trách và tiêu chí nghiệm thu.", status: "Chưa triển khai" },
    { title: "Tasks & yêu cầu sửa đổi", description: "Giao việc, trao đổi, thời hạn và lịch sử thay đổi phạm vi.", status: "Chưa triển khai" },
    { title: "Ticket hỗ trợ", description: "Phân loại, ưu tiên, SLA và trạng thái xử lý.", status: "Chưa triển khai" },
  ]},
  { id: "seo", label: "SEO & AI nội dung", detail: "Tăng trưởng tìm kiếm có kiểm soát", description: "Công cụ SEO và AI hỗ trợ nội dung, không tự tuyên bố số liệu chưa đo.", icon: "⌕", cards: [
    { title: "SEO on-page", description: "Metadata, canonical, sitemap, robots, schema và breadcrumb.", status: "Chưa triển khai" },
    { title: "AI content workflow", description: "Brief, outline, draft, kiểm tra chất lượng, trùng lặp và phê duyệt.", status: "Chưa triển khai" },
    { title: "Search analytics", description: "Kết nối Search Console/analytics và báo cáo dựa trên dữ liệu thật.", status: "Chưa triển khai" },
  ]},
  { id: "automation", label: "Tự động hóa", detail: "Quy trình và tác vụ nền", description: "Điều phối workflow và tích hợp theo trạng thái, retry và audit log.", icon: "⟳", cards: [
    { title: "Workflow builder", description: "Trigger, điều kiện, hành động, retry và nhật ký thực thi.", status: "Chưa triển khai" },
    { title: "Email & thông báo", description: "Thông báo lead, báo giá, task và lỗi tích hợp.", status: "Chưa xác minh cấu hình provider" },
    { title: "Tích hợp n8n/API", description: "Webhook ký xác thực, idempotency và quản lý lỗi.", status: "Chưa triển khai" },
  ]},
  { id: "commerce", label: "Đơn hàng & thanh toán", detail: "Thương mại và tài chính", description: "Quản lý đơn, gói dịch vụ, hóa đơn và trạng thái thanh toán đáng tin cậy.", icon: "▣", cards: [
    { title: "Đơn hàng & dịch vụ", description: "Gói dịch vụ, template order, trạng thái và lịch sử.", status: "Chưa triển khai" },
    { title: "Thanh toán & hóa đơn", description: "Provider, webhook, đối soát, thất bại và hoàn tiền.", status: "Chưa triển khai" },
    { title: "Doanh thu & báo cáo", description: "Chỉ tổng hợp số liệu từ giao dịch đã xác minh.", status: "Chưa triển khai" },
  ]},
  { id: "hosting", label: "Hosting & domain", detail: "Hạ tầng website khách hàng", description: "Quản lý dịch vụ hạ tầng; provisioning chỉ bật khi có tích hợp và rollback an toàn.", icon: "⌂", cards: [
    { title: "Hosting & website", description: "Gói tài nguyên, website, môi trường và tình trạng dịch vụ.", status: "Chưa triển khai" },
    { title: "Domain, DNS & SSL", description: "Vòng đời domain, bản ghi DNS, chứng chỉ và cảnh báo hết hạn.", status: "Chưa triển khai" },
    { title: "Provisioning & backup", description: "Tạo môi trường, backup, restore và rollback có kiểm thử.", status: "Chưa triển khai" },
  ]},
  { id: "settings", label: "Cấu hình", detail: "Bảo mật và tích hợp nền tảng", description: "Cấu hình môi trường, quyền truy cập, provider và nhật ký vận hành.", icon: "⚙", cards: [
    { title: "Người dùng & vai trò", description: "RBAC cho admin, staff và customer; quyền được kiểm tra ở backend.", status: "Chưa triển khai" },
    { title: "Tích hợp & secrets", description: "Email, AI, thanh toán, analytics; secrets chỉ lưu phía server.", status: "Chưa triển khai" },
    { title: "Audit & monitoring", description: "Nhật ký, cảnh báo, retention, backup và quy trình sự cố.", status: "Chưa triển khai" },
  ]},
];

export default function App() {
  const [active, setActive] = useState<Area>("overview");
  const current = areas.find((area) => area.id === active) ?? areas[0];

  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Điều hướng ứng dụng">
        <a className="brand" href="/" aria-label="Hội Quán Web">
          <span className="brand-mark">HQ</span>
          <span><strong>Hội Quán Web</strong><small>PLATFORM PREVIEW</small></span>
        </a>
        <p className="nav-caption">KHÔNG GIAN LÀM VIỆC</p>
        <nav>
          {areas.map((area) => (
            <button key={area.id} className={active === area.id ? "nav-item active" : "nav-item"} onClick={() => setActive(area.id)} aria-current={active === area.id ? "page" : undefined}>
              <span aria-hidden="true">{area.icon}</span>
              {area.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-note"><strong>Preview chức năng</strong><p>Danh mục thể hiện phạm vi sản phẩm. Chưa có dữ liệu thật hoặc thao tác nghiệp vụ được kết nối.</p></div>
      </aside>
      <main className="main">
        <header className="topbar"><div><span className="eyebrow">HỘI QUÁN WEB / NỀN TẢNG</span><h1>{current.label}</h1></div><span className="environment">LOCAL / PREVIEW</span></header>
        <section className="welcome">
          <div><span className="eyebrow">PRODUCT MODULE MAP</span><h2>{current.detail}</h2><p>{current.description}</p></div>
          <span className="status">Chưa kết nối backend</span>
        </section>
        <section className="cards" aria-label={`Các chức năng thuộc ${current.label}`}>
          {current.cards.map((card) => (
            <article className="card" key={card.title}>
              <span className="card-icon">{current.icon}</span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <span className="tag">{card.status}</span>
            </article>
          ))}
        </section>
        <section className="notice" role="status"><strong>Phân biệt kế hoạch và chức năng hoạt động</strong><p>Đây là bản đồ module để hoàn thiện thiết kế sản phẩm. Điều hướng chỉ thay đổi nội dung preview; không có đăng nhập, lưu dữ liệu, chatbot AI, gửi email, thanh toán hoặc thao tác backend nào được giả lập là thành công.</p></section>
        <footer>Hội Quán Web · Platform module preview · {new Date().getFullYear()}</footer>
      </main>
    </div>
  );
}
