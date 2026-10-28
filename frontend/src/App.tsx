import { useState } from "react";

type Area = "overview" | "content" | "templates" | "customers" | "projects" | "settings";

const areas: { id: Area; label: string; detail: string }[] = [
  { id: "overview", label: "Tổng quan", detail: "Tổng quan nền tảng" },
  { id: "content", label: "Nội dung CMS", detail: "Trang, bài viết và thư viện media" },
  { id: "templates", label: "Kho website mẫu", detail: "Mẫu WordPress và HTML/CSS" },
  { id: "customers", label: "Khách hàng", detail: "Khách hàng, lead và báo giá" },
  { id: "projects", label: "Dự án", detail: "Tiến độ, mốc bàn giao và hỗ trợ" },
  { id: "settings", label: "Cấu hình", detail: "Cấu hình môi trường và tích hợp" },
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
              <span aria-hidden="true">{area.id === "overview" ? "◫" : area.id === "content" ? "▤" : area.id === "templates" ? "▦" : area.id === "customers" ? "♙" : area.id === "projects" ? "✓" : "⚙"}</span>
              {area.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-note"><strong>Bản nền tảng</strong><p>Đây là khung giao diện phát triển, chưa kết nối dữ liệu thật.</p></div>
      </aside>
      <main className="main">
        <header className="topbar"><div><span className="eyebrow">HỘI QUÁN WEB / NỀN TẢNG</span><h1>{current.label}</h1></div><span className="environment">LOCAL / PREVIEW</span></header>
        <section className="welcome">
          <div><span className="eyebrow">GIAI ĐOẠN 1 · APPLICATION FOUNDATION</span><h2>{current.detail}</h2><p>Khung ứng dụng ban đầu cho CMS riêng, kho mẫu và cổng khách hàng.</p></div>
          <span className="status">Chưa kết nối backend</span>
        </section>
        <section className="cards" aria-label="Các phân hệ mục tiêu">
          <article className="card"><span className="card-icon">▤</span><h3>CMS nội dung</h3><p>Quản lý trang, bài viết, SEO và media sau khi API được triển khai.</p><span className="tag">Đang lên kế hoạch</span></article>
          <article className="card"><span className="card-icon">▦</span><h3>Kho website mẫu</h3><p>Danh mục WordPress và HTML/CSS, preview, phiên bản và giấy phép.</p><span className="tag">Đang lên kế hoạch</span></article>
          <article className="card"><span className="card-icon">♙</span><h3>Cổng khách hàng</h3><p>Báo giá, đơn hàng, tiến độ và file riêng tư cần xác thực phía máy chủ.</p><span className="tag">Chưa khả dụng</span></article>
        </section>
        <section className="notice" role="status"><strong>Chế độ xem phát triển</strong><p>Các nút điều hướng hiện chỉ đổi vùng giao diện. Không có dữ liệu khách hàng, đăng nhập, lưu trữ hay thao tác backend nào được mô phỏng thành công.</p></section>
        <footer>Hội Quán Web · Application shell · {new Date().getFullYear()}</footer>
      </main>
    </div>
  );
}