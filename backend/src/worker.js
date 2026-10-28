import { getAuth, migrateAuthDatabase } from "./better-auth.js";
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const LEAD_STATUSES = new Set(["new", "contacted", "qualified", "proposal_sent", "won", "lost", "spam"]);
const SERVICES = new Set(["Website doanh nghiệp", "Website thương mại điện tử", "Landing page", "Website chuẩn SEO", "UX/UI và Design System", "Bảo trì và tăng trưởng", "Chưa xác định"]);
function json(data, status = 200, extra = {}) { return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extra } }); }
function clean(value, max = 2000) { return typeof value === "string" ? value.trim().replace(/\u0000/g, "").slice(0, max) : ""; }
function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 254; }
function corsHeaders(request, env) { const origin = request.headers.get("Origin"); const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(v => v.trim()).filter(Boolean); if (!origin || !allowed.includes(origin)) return {}; return { "access-control-allow-origin": origin, "access-control-allow-credentials": "true", "access-control-allow-methods": "GET, POST, PATCH, OPTIONS", "access-control-allow-headers": "Content-Type, Authorization", "access-control-max-age": "86400", "vary": "Origin" }; }
function withSecurity(response) { const headers = new Headers(response.headers); headers.set("x-content-type-options", "nosniff"); headers.set("referrer-policy", "no-referrer"); headers.set("x-frame-options", "DENY"); headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()"); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
async function readJson(request) { const type = request.headers.get("content-type") || ""; if (!type.toLowerCase().includes("application/json")) throw new Error("CONTENT_TYPE"); const length = Number(request.headers.get("content-length") || 0); if (length > 12000) throw new Error("TOO_LARGE"); try { return await request.json(); } catch { throw new Error("INVALID_JSON"); } }
async function rateLimit(request, env) { if (!env.DB) throw new Error("DB_NOT_CONFIGURED"); const ip = request.headers.get("CF-Connecting-IP") || "unknown"; const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip)); const hash = [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2, "0")).join(""); const now = Math.floor(Date.now() / 60000); await env.DB.prepare("DELETE FROM rate_limits WHERE window_minute < ?").bind(now - 2).run(); const row = await env.DB.prepare("SELECT hits FROM rate_limits WHERE ip_hash = ? AND window_minute = ?").bind(hash, now).first(); if ((row?.hits || 0) >= 5) return false; await env.DB.prepare("INSERT INTO rate_limits (ip_hash, window_minute, hits) VALUES (?, ?, 1) ON CONFLICT(ip_hash, window_minute) DO UPDATE SET hits = hits + 1").bind(hash, now).run(); return true; }
async function sendNotification(env, lead) { if (!env.RESEND_API_KEY || !env.NOTIFICATION_EMAIL) return; const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: "Bearer " + env.RESEND_API_KEY, "content-type": "application/json" }, body: JSON.stringify({ from: env.EMAIL_FROM || "Hội Quán Web <onboarding@resend.dev>", to: [env.NOTIFICATION_EMAIL], subject: "Lead mới: " + lead.name + " — Hội Quán Web", text: ["Có yêu cầu dự án mới.", "Mã lead: " + lead.id, "Tên: " + lead.name, "Email: " + lead.email, "Dịch vụ: " + lead.service, "Ngân sách: " + (lead.budget || "Chưa xác định"), "Mục tiêu: " + (lead.goals || "Chưa cung cấp"), "Consent: " + lead.consentAt].join("\n") }) }); if (!response.ok) throw new Error("EMAIL_PROVIDER_ERROR"); }
async function createLead(request, env) {
  if (!await rateLimit(request, env)) return json({ error: "RATE_LIMITED", message: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút." }, 429);
  const body = await readJson(request); if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "VALIDATION_ERROR", message: "Dữ liệu yêu cầu không hợp lệ." }, 400); if (clean(body.website, 200)) return json({ ok: true, id: "accepted" }, 202);
  const name = clean(body.name, 120), email = clean(body.email, 254).toLowerCase(), service = clean(body.service, 100), budget = clean(body.budget, 100), goals = clean(body.goals, 3000), consent = body.consent === true;
  if (name.length < 2 || !validEmail(email) || !SERVICES.has(service) || !consent) return json({ error: "VALIDATION_ERROR", message: "Vui lòng kiểm tra họ tên, email, dịch vụ và đồng ý chính sách quyền riêng tư." }, 400);
  const id = crypto.randomUUID(), createdAt = new Date().toISOString(), consentAt = createdAt;
  await env.DB.prepare("INSERT INTO leads (id, name, email, service, budget, goals, status, consent_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)").bind(id, name, email, service, budget, goals, consentAt, createdAt, createdAt).run();
  const lead = { id, name, email, service, budget, goals, consentAt }; let notification = "not_configured";
  try { await sendNotification(env, lead); notification = env.RESEND_API_KEY && env.NOTIFICATION_EMAIL ? "sent" : "not_configured"; } catch (error) { console.error("Lead notification failed", error?.message || "unknown"); notification = "failed"; }
  return json({ ok: true, id, message: "Yêu cầu đã được lưu.", notification }, 201);
}
async function estimate(request) { const body = await readJson(request); if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "VALIDATION_ERROR", message: "Dữ liệu ước tính không hợp lệ." }, 400); const pages = Math.max(1, Math.min(100, Number.parseInt(body.pages, 10) || 1)); const complexity = ["simple", "standard", "advanced"].includes(body.complexity) ? body.complexity : "standard"; const integrations = Math.max(0, Math.min(10, Number.parseInt(body.integrations, 10) || 0)); const base = { simple: 8000000, standard: 20000000, advanced: 50000000 }[complexity]; const total = base + Math.max(0, pages - 5) * 800000 + integrations * 2500000; return json({ currency: "VND", min: total, max: Math.round(total * 1.45), disclaimer: "Ước tính sơ bộ, không phải báo giá ràng buộc. Giá cuối cùng cần xác nhận sau khi làm rõ phạm vi." }); }
async function adminLeads(request, env, url) {
  const principal = await authenticatedPrincipal(request, env);
  if (principal.error) return principal.error;
  if (!hasAnyRole(principal, ["admin", "staff"])) {
    return json({ error: { code: "FORBIDDEN", message: "Bạn không có quyền quản trị lead." } }, 403);
  }
  if (request.method === "GET") {
    const status = clean(url.searchParams.get("status"), 30);
    const limit = Math.max(1, Math.min(100, Number.parseInt(url.searchParams.get("limit"), 10) || 50));
    const result = status && LEAD_STATUSES.has(status)
      ? await env.DB.prepare("SELECT id,name,email,service,budget,goals,status,consent_at,created_at,updated_at FROM leads WHERE status = ? ORDER BY created_at DESC LIMIT ?").bind(status, limit).all()
      : await env.DB.prepare("SELECT id,name,email,service,budget,goals,status,consent_at,created_at,updated_at FROM leads ORDER BY created_at DESC LIMIT ?").bind(limit).all();
    return json({ leads: result.results || [] });
  }
  if (request.method === "PATCH") {
    const body = await readJson(request), id = clean(body.id, 80), status = clean(body.status, 30);
    if (!id || !LEAD_STATUSES.has(status)) return json({ error: "VALIDATION_ERROR", message: "Mã lead hoặc trạng thái không hợp lệ." }, 400);
    const updatedAt = new Date().toISOString();
    const result = await env.DB.prepare("UPDATE leads SET status = ?, updated_at = ? WHERE id = ?").bind(status, updatedAt, id).run();
    if (!result.meta?.changes) return json({ error: "NOT_FOUND" }, 404);
    const auditDetails = JSON.stringify({ status, actorId: principal.user.id });
    await env.DB.prepare("INSERT INTO lead_events (id,lead_id,event_type,details,created_at) VALUES (?, ?, 'status_changed', ?, ?)").bind(crypto.randomUUID(), id, auditDetails, updatedAt).run();
    return json({ ok: true, id, status, updatedAt });
  }
  return json({ error: "METHOD_NOT_ALLOWED" }, 405, { allow: "GET, PATCH" });
}
function parseJsonField(value) {
  if (typeof value !== "string" || !value) return {};
  try { return JSON.parse(value); } catch { return {}; }
}
function decodeSlug(path, prefix) {
  const encoded = path.slice(prefix.length);
  try {
    const slug = decodeURIComponent(encoded);
    if (!slug || slug.length > 180 || slug.includes("/")) return null;
    return slug;
  } catch {
    return null;
  }
}
function contentRecord(row, kind) {
  if (!row) return null;
  const result = { ...row };
  for (const key of ["content_json", "body_json", "seo_json", "compatibility_json", "description_json"]) {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      const outputKey = key.replace(/_json$/, "").replace("body", "body");
      result[outputKey] = parseJsonField(result[key]);
      delete result[key];
    }
  }
  if (kind === "page") delete result.id;
  return result;
}
async function authenticatedPrincipal(request, env) {
  if (!env.DB) return { error: json({ error: { code: "SERVICE_UNAVAILABLE", message: "Dịch vụ hiện chưa khả dụng." } }, 503) };
  const auth = getAuth(env, request);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return { error: json({ error: { code: "UNAUTHENTICATED", message: "Vui lòng đăng nhập để tiếp tục." } }, 401) };
  try {
    const result = await env.DB.prepare("SELECT role FROM app_user_roles WHERE user_id = ? ORDER BY role").bind(session.user.id).all();
    return { user: session.user, roles: (result.results || []).map(row => row.role) };
  } catch {
    return { error: json({ error: { code: "IDENTITY_SCHEMA_UNAVAILABLE", message: "Hệ thống phân quyền chưa được cấu hình đầy đủ." } }, 503) };
  }
}
function hasAnyRole(principal, allowed) {
  return principal.roles.some(role => allowed.includes(role));
}
async function identityRoutes(request, env, url) {
  if (url.pathname === "/api/v1/me" && request.method === "GET") {
    const principal = await authenticatedPrincipal(request, env);
    if (principal.error) return principal.error;
    return json({ data: { id: principal.user.id, email: principal.user.email, name: principal.user.name, roles: principal.roles } });
  }
  if (url.pathname === "/api/v1/me/customers" && request.method === "GET") {
    const principal = await authenticatedPrincipal(request, env);
    if (principal.error) return principal.error;
    const result = await env.DB.prepare(
      "SELECT c.id, c.display_name, c.organization_name, c.status, m.membership_role FROM crm_customers c INNER JOIN crm_customer_members m ON m.customer_id = c.id WHERE m.user_id = ? AND c.status = 'active' ORDER BY c.display_name ASC LIMIT 100"
    ).bind(principal.user.id).all();
    return json({ data: result.results || [] });
  }
  if (url.pathname === "/api/v1/me/quotes" && request.method === "GET") {
    const principal = await authenticatedPrincipal(request, env);
    if (principal.error) return principal.error;
    const result = await env.DB.prepare(
      "SELECT q.id, q.quote_number, q.status, q.currency, q.subtotal_minor, q.discount_minor, q.total_minor, q.valid_until, q.created_at, q.updated_at FROM crm_quotes q INNER JOIN crm_customer_members m ON m.customer_id = q.customer_id WHERE m.user_id = ? AND q.status != 'draft' ORDER BY q.created_at DESC LIMIT 100"
    ).bind(principal.user.id).all();
    return json({ data: result.results || [] });
  }
  if (url.pathname === "/api/v1/admin/customers" && request.method === "GET") {
    const principal = await authenticatedPrincipal(request, env);
    if (principal.error) return principal.error;
    if (!hasAnyRole(principal, ["admin", "staff"])) {
      return json({ error: { code: "FORBIDDEN", message: "Bạn không có quyền truy cập chức năng này." } }, 403);
    }
    const result = await env.DB.prepare(
      "SELECT id, display_name, organization_name, contact_email, phone, status, created_at, updated_at FROM crm_customers ORDER BY created_at DESC LIMIT 100"
    ).all();
    return json({ data: result.results || [] });
  }
  return null;
}

async function publicContent(request, env, url) {
  if (!env.DB) return json({ error: { code: "SERVICE_UNAVAILABLE", message: "Nội dung hiện chưa khả dụng." } }, 503);
  const path = url.pathname;
  if (path.startsWith("/api/v1/public/pages/") && request.method === "GET") {
    const slug = decodeSlug(path, "/api/v1/public/pages/");
    if (!slug) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy trang." } }, 404);
    const row = await env.DB.prepare("SELECT slug, title, excerpt, content_json, seo_json, published_at FROM cms_pages WHERE slug = ? AND status = 'published' AND published_at IS NOT NULL LIMIT 1").bind(slug).first();
    if (!row) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy trang." } }, 404);
    return json({ data: contentRecord(row, "page") });
  }
  if (path === "/api/v1/public/posts" && request.method === "GET") {
    const limit = Math.max(1, Math.min(50, Number.parseInt(url.searchParams.get("limit") || "20", 10) || 20));
    const offset = Math.max(0, Math.min(10000, Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0));
    const result = await env.DB.prepare("SELECT slug, title, excerpt, author_name, published_at, seo_json FROM cms_posts WHERE status = 'published' AND published_at IS NOT NULL ORDER BY published_at DESC, slug ASC LIMIT ? OFFSET ?").bind(limit, offset).all();
    return json({ data: (result.results || []).map(row => contentRecord(row, "post")), meta: { limit, offset } });
  }
  if (path.startsWith("/api/v1/public/posts/") && request.method === "GET") {
    const slug = decodeSlug(path, "/api/v1/public/posts/");
    if (!slug) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy bài viết." } }, 404);
    const row = await env.DB.prepare("SELECT slug, title, excerpt, body_json, seo_json, author_name, published_at FROM cms_posts WHERE slug = ? AND status = 'published' AND published_at IS NOT NULL LIMIT 1").bind(slug).first();
    if (!row) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy bài viết." } }, 404);
    return json({ data: contentRecord(row, "post") });
  }
  if (path === "/api/v1/public/services" && request.method === "GET") {
    const result = await env.DB.prepare("SELECT slug, name, summary, description_json, sort_order FROM cms_services WHERE status = 'published' AND published_at IS NOT NULL ORDER BY sort_order ASC, slug ASC LIMIT 100").all();
    return json({ data: (result.results || []).map(row => contentRecord(row, "service")) });
  }
  if (path === "/api/v1/public/templates" && request.method === "GET") {
    const type = url.searchParams.get("type");
    if (type && !["wordpress", "html_css"].includes(type)) return json({ error: { code: "VALIDATION_ERROR", message: "Loại template không hợp lệ." } }, 400);
    const query = "SELECT slug, name, template_type, summary, preview_url, price_minor, currency, license_key, compatibility_json, published_at FROM cms_templates WHERE status = 'published' AND published_at IS NOT NULL" + (type ? " AND template_type = ?" : "") + " ORDER BY published_at DESC, slug ASC LIMIT 100";
    const statement = env.DB.prepare(query);
    const result = type ? await statement.bind(type).all() : await statement.all();
    return json({ data: (result.results || []).map(row => contentRecord(row, "template")) });
  }
  return null;
}

export default { async fetch(request, env) {
  const url = new URL(request.url), cors = corsHeaders(request, env), origin = request.headers.get("Origin"), allowed = (env.ALLOWED_ORIGINS || "").split(",").map(v => v.trim()).filter(Boolean);
  if (request.method === "OPTIONS") return withSecurity(cors["access-control-allow-origin"] ? new Response(null, { status: 204, headers: cors }) : json({ error: "ORIGIN_NOT_ALLOWED" }, 403));
  if (!["GET", "POST", "PATCH"].includes(request.method)) return withSecurity(json({ error: "METHOD_NOT_ALLOWED" }, 405, { allow: "GET, POST, PATCH, OPTIONS" }));
  if (origin && !allowed.includes(origin)) return withSecurity(json({ error: "ORIGIN_NOT_ALLOWED" }, 403));
  try { let response;
    if (url.pathname === "/_test/migrate" && request.method === "POST" && env.TEST_MODE === "true") {
      const auth = getAuth(env, request);
      await migrateAuthDatabase(auth);
      // Wrangler's test harness does not automatically apply application D1
      // migrations. Build the minimal CRM fixture schema only in TEST_MODE.
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS crm_customers (id TEXT PRIMARY KEY, display_name TEXT NOT NULL, organization_name TEXT NOT NULL DEFAULT '', contact_email TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'active', notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS app_user_roles (user_id TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','staff','customer')), assigned_by TEXT NOT NULL, assigned_at TEXT NOT NULL, PRIMARY KEY(user_id, role))").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS crm_customer_members (customer_id TEXT NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE, user_id TEXT NOT NULL, membership_role TEXT NOT NULL DEFAULT 'owner' CHECK(membership_role IN ('owner','member','billing')), created_at TEXT NOT NULL, PRIMARY KEY(customer_id, user_id))").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS crm_quotes (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES crm_customers(id) ON DELETE RESTRICT, quote_number TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'draft', currency TEXT NOT NULL DEFAULT 'VND', subtotal_minor INTEGER NOT NULL DEFAULT 0, discount_minor INTEGER NOT NULL DEFAULT 0, total_minor INTEGER NOT NULL DEFAULT 0, valid_until TEXT, notes TEXT NOT NULL DEFAULT '', created_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, accepted_by TEXT, accepted_at TEXT)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, service TEXT NOT NULL, budget TEXT NOT NULL DEFAULT '', goals TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'new', consent_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS lead_events (id TEXT PRIMARY KEY, lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE, event_type TEXT NOT NULL, details TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL)").run();
      response = new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
    }
    else if (url.pathname === "/_test/seed-identity" && request.method === "POST" && env.TEST_MODE === "true") {
      const body = await readJson(request);
      const ids = [body?.userA, body?.userB, body?.adminUser].map(value => clean(value, 128));
      if (ids.some(value => !value) || new Set(ids).size !== 3) {
        response = json({ error: "VALIDATION_ERROR" }, 400);
      } else {
        const now = new Date().toISOString();
        const customers = [
          { id: "test-customer-a", name: "Test Customer A", email: "a@example.test", userId: ids[0], quoteId: "test-quote-a", quoteNumber: "TEST-A" },
          { id: "test-customer-b", name: "Test Customer B", email: "b@example.test", userId: ids[1], quoteId: "test-quote-b", quoteNumber: "TEST-B" }
        ];
        for (const customer of customers) {
          await env.DB.prepare("INSERT OR REPLACE INTO crm_customers (id, display_name, organization_name, contact_email, phone, status, notes, created_at, updated_at) VALUES (?, ?, '', ?, '', 'active', '', ?, ?)").bind(customer.id, customer.name, customer.email, now, now).run();
          await env.DB.prepare("INSERT OR REPLACE INTO crm_customer_members (customer_id, user_id, membership_role, created_at) VALUES (?, ?, 'owner', ?)").bind(customer.id, customer.userId, now).run();
          await env.DB.prepare("INSERT OR REPLACE INTO crm_quotes (id, customer_id, quote_number, status, currency, subtotal_minor, discount_minor, total_minor, created_by, created_at, updated_at) VALUES (?, ?, ?, 'sent', 'VND', 1000000, 0, 1000000, ?, ?, ?)").bind(customer.quoteId, customer.id, customer.quoteNumber, customer.userId, now, now).run();
        }
        await env.DB.prepare("INSERT OR REPLACE INTO app_user_roles (user_id, role, assigned_by, assigned_at) VALUES (?, 'admin', 'test-fixture', ?)").bind(ids[2], now).run();
        response = json({ ok: true });
      }
    }
    else if (url.pathname === "/api/v1/auth/session" && request.method === "GET") {
      const auth = getAuth(env, request);
      response = json(await auth.api.getSession({ headers: request.headers }));
    }
    else if (url.pathname.startsWith("/api/v1/auth/") && ["GET", "POST"].includes(request.method)) {
      const auth = getAuth(env, request);
      response = await auth.handler(request);
    }
    else if (url.pathname === "/api/health" && request.method === "GET") response = json({ ok: true, service: "hoiquanweb-api", version: "phase-2" });
    else if (url.pathname === "/api/v1/me" || url.pathname.startsWith("/api/v1/me/") || url.pathname === "/api/v1/admin/customers") response = await identityRoutes(request, env, url) || json({ error: { code: "NOT_FOUND", message: "Không tìm thấy tài nguyên." } }, 404);
    else if (url.pathname.startsWith("/api/v1/public/")) response = await publicContent(request, env, url) || json({ error: { code: "NOT_FOUND", message: "Không tìm thấy tài nguyên." } }, 404);
    else if (url.pathname === "/api/leads" && request.method === "POST") response = await createLead(request, env);
    else if (url.pathname === "/api/estimate" && request.method === "POST") response = await estimate(request);
    else if (url.pathname === "/api/admin/leads") response = await adminLeads(request, env, url);
    else if (url.pathname === "/api/booking" && request.method === "GET") response = env.BOOKING_URL ? json({ url: env.BOOKING_URL }) : json({ error: "BOOKING_NOT_CONFIGURED", message: "Chưa cấu hình nhà cung cấp lịch hẹn." }, 503);
    else response = json({ error: "NOT_FOUND" }, 404);
    const headers = new Headers(response.headers); for (const [key, value] of Object.entries(cors)) headers.set(key, value); return withSecurity(new Response(response.body, { status: response.status, headers }));
  } catch (error) { console.error("API request failed", error?.message || "unknown"); const known = new Set(["CONTENT_TYPE", "TOO_LARGE", "INVALID_JSON", "DB_NOT_CONFIGURED"]); if (known.has(error?.message)) { const status = error.message === "TOO_LARGE" ? 413 : error.message === "DB_NOT_CONFIGURED" ? 503 : 400; return withSecurity(json({ error: error.message, message: "Không thể xử lý yêu cầu. Vui lòng kiểm tra dữ liệu hoặc thử lại sau." }, status, cors)); } return withSecurity(json({ error: "INTERNAL_ERROR", message: "Máy chủ đang gặp sự cố. Vui lòng thử lại sau." }, 500, cors)); }
} };