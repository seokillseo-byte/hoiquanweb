import { getAuth, migrateAuthDatabase } from "./better-auth.js";
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const LEAD_STATUSES = new Set(["new", "contacted", "qualified", "proposal_sent", "won", "lost", "spam"]);
const SERVICES = new Set(["Website doanh nghiệp", "Website thương mại điện tử", "Landing page", "Website chuẩn SEO", "UX/UI và Design System", "Bảo trì và tăng trưởng", "Chưa xác định"]);
function json(data, status = 200, extra = {}) { return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extra } }); }
function clean(value, max = 2000) { return typeof value === "string" ? value.trim().replace(/\u0000/g, "").slice(0, max) : ""; }
function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 254; }
function corsHeaders(request, env) { const origin = request.headers.get("Origin"); const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(v => v.trim()).filter(Boolean); if (!origin || !allowed.includes(origin)) return {}; return { "access-control-allow-origin": origin, "access-control-allow-methods": "GET, POST, PATCH, OPTIONS", "access-control-allow-headers": "Content-Type, Authorization", "access-control-max-age": "86400", "vary": "Origin" }; }
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
function authorized(request, env) { return Boolean(env.ADMIN_TOKEN && request.headers.get("Authorization") === "Bearer " + env.ADMIN_TOKEN); }
async function adminLeads(request, env, url) {
  if (!authorized(request, env)) return json({ error: "UNAUTHORIZED" }, 401);
  if (request.method === "GET") { const status = clean(url.searchParams.get("status"), 30), limit = Math.max(1, Math.min(100, Number.parseInt(url.searchParams.get("limit"), 10) || 50)); const result = status && LEAD_STATUSES.has(status) ? await env.DB.prepare("SELECT id,name,email,service,budget,goals,status,consent_at,created_at,updated_at FROM leads WHERE status = ? ORDER BY created_at DESC LIMIT ?").bind(status, limit).all() : await env.DB.prepare("SELECT id,name,email,service,budget,goals,status,consent_at,created_at,updated_at FROM leads ORDER BY created_at DESC LIMIT ?").bind(limit).all(); return json({ leads: result.results || [] }); }
  if (request.method === "PATCH") { const body = await readJson(request), id = clean(body.id, 80), status = clean(body.status, 30); if (!id || !LEAD_STATUSES.has(status)) return json({ error: "VALIDATION_ERROR", message: "Mã lead hoặc trạng thái không hợp lệ." }, 400); const updatedAt = new Date().toISOString(); const result = await env.DB.prepare("UPDATE leads SET status = ?, updated_at = ? WHERE id = ?").bind(status, updatedAt, id).run(); if (!result.meta?.changes) return json({ error: "NOT_FOUND" }, 404); await env.DB.prepare("INSERT INTO lead_events (id,lead_id,event_type,details,created_at) VALUES (?, ?, 'status_changed', ?, ?)").bind(crypto.randomUUID(), id, status, updatedAt).run(); return json({ ok: true, id, status, updatedAt }); }
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
      response = new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
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
    else if (url.pathname.startsWith("/api/v1/public/")) response = await publicContent(request, env, url) || json({ error: { code: "NOT_FOUND", message: "Không tìm thấy tài nguyên." } }, 404);
    else if (url.pathname === "/api/leads" && request.method === "POST") response = await createLead(request, env);
    else if (url.pathname === "/api/estimate" && request.method === "POST") response = await estimate(request);
    else if (url.pathname === "/api/admin/leads") response = await adminLeads(request, env, url);
    else if (url.pathname === "/api/booking" && request.method === "GET") response = env.BOOKING_URL ? json({ url: env.BOOKING_URL }) : json({ error: "BOOKING_NOT_CONFIGURED", message: "Chưa cấu hình nhà cung cấp lịch hẹn." }, 503);
    else response = json({ error: "NOT_FOUND" }, 404);
    const headers = new Headers(response.headers); for (const [key, value] of Object.entries(cors)) headers.set(key, value); return withSecurity(new Response(response.body, { status: response.status, headers }));
  } catch (error) { console.error("API request failed", error?.message || "unknown"); const known = new Set(["CONTENT_TYPE", "TOO_LARGE", "INVALID_JSON", "DB_NOT_CONFIGURED"]); if (known.has(error?.message)) { const status = error.message === "TOO_LARGE" ? 413 : error.message === "DB_NOT_CONFIGURED" ? 503 : 400; return withSecurity(json({ error: error.message, message: "Không thể xử lý yêu cầu. Vui lòng kiểm tra dữ liệu hoặc thử lại sau." }, status, cors)); } return withSecurity(json({ error: "INTERNAL_ERROR", message: "Máy chủ đang gặp sự cố. Vui lòng thử lại sau." }, 500, cors)); }
} };