import { getAuth, migrateAuthDatabase } from "./better-auth.js";
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const LEAD_STATUSES = new Set(["new", "contacted", "qualified", "proposal_sent", "won", "lost", "spam"]);
const SERVICES = new Set(["Website doanh nghiệp", "Website thương mại điện tử", "Landing page", "Website chuẩn SEO", "UX/UI và Design System", "Bảo trì và tăng trưởng", "Chưa xác định", "Thiết kế Website", "Website Design", "Phát triển Phần mềm", "Software Development", "Ứng dụng Di động", "Mobile App Development", "Phát triển Game", "Game Development", "SEO Website", "Website SEO", "AI & Tự động hóa", "AI & Automation", "Giải pháp Công nghệ khác", "Other Technology Solutions"]);
function json(data, status = 200, extra = {}) { return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extra } }); }
function clean(value, max = 2000) { return typeof value === "string" ? value.trim().replace(/\u0000/g, "").slice(0, max) : ""; }
function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 254; }
function corsHeaders(request, env) { const origin = request.headers.get("Origin"); const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(v => v.trim()).filter(Boolean); if (!origin || !allowed.includes(origin)) return {}; return { "access-control-allow-origin": origin, "access-control-allow-credentials": "true", "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS", "access-control-allow-headers": "Content-Type, Authorization", "access-control-max-age": "86400", "vary": "Origin" }; }
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
  const leadConversionMatch = url.pathname.match(/^\\/api\\/v1\\/admin\\/leads\\/([^/]+)\\/convert$/);
  if (leadConversionMatch && request.method === "POST") {
    const principal = await authenticatedPrincipal(request, env);
    if (principal.error) return principal.error;
    if (!hasAnyRole(principal, ["admin", "staff"])) {
      return json({ error: { code: "FORBIDDEN", message: "Bạn không có quyền chuyển đổi lead." } }, 403);
    }
    let leadId;
    try { leadId = decodeURIComponent(leadConversionMatch[1]); }
    catch { return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy lead." } }, 404); }
    if (!leadId || leadId.length > 80 || leadId.includes("/")) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy lead." } }, 404);
    const lead = await env.DB.prepare("SELECT id, name, email, service, budget, goals, status FROM leads WHERE id = ? LIMIT 1").bind(leadId).first();
    if (!lead) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy lead." } }, 404);
    const existing = await env.DB.prepare("SELECT id FROM crm_customers WHERE lead_id = ? LIMIT 1").bind(leadId).first();
    if (existing) return json({ data: { customer_id: existing.id, lead_id: leadId, already_converted: true } });
    if (!validEmail(lead.email)) return json({ error: { code: "LEAD_EMAIL_INVALID", message: "Email của lead không hợp lệ; cần cập nhật lead trước khi chuyển đổi." } }, 409);
    const now = new Date().toISOString(), customerId = crypto.randomUUID(), activityId = crypto.randomUUID();
    const activityBody = ["Dịch vụ quan tâm: " + lead.service, "Ngân sách: " + (lead.budget || "Chưa xác định"), "Mục tiêu: " + (lead.goals || "Chưa cung cấp")].join("\\n");
    const statements = [
      env.DB.prepare("INSERT INTO crm_customers (id, lead_id, display_name, organization_name, contact_email, phone, status, notes, created_at, updated_at) VALUES (?, ?, ?, '', ?, '', 'active', '', ?, ?)").bind(customerId, leadId, lead.name, lead.email, now, now),
      env.DB.prepare("INSERT INTO crm_activities (id, customer_id, lead_id, activity_type, subject, body, actor_id, occurred_at, created_at) VALUES (?, ?, ?, 'system', 'Lead được chuyển thành khách hàng', ?, ?, ?, ?)").bind(activityId, customerId, leadId, activityBody, principal.user.id, now, now),
      env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'customer.created_from_lead', 'customer', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, customerId, JSON.stringify({ lead_id: leadId }), now),
      env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'lead.converted', 'lead', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, leadId, JSON.stringify({ customer_id: customerId }), now)
    ];
    try {
      const results = await env.DB.batch(statements);
      if (!results?.[0]?.meta?.changes) {
        const raced = await env.DB.prepare("SELECT id FROM crm_customers WHERE lead_id = ? LIMIT 1").bind(leadId).first();
        if (raced) return json({ data: { customer_id: raced.id, lead_id: leadId, already_converted: true } });
        return json({ error: { code: "CONVERSION_CONFLICT", message: "Lead đã thay đổi. Vui lòng tải lại." } }, 409);
      }
    } catch (error) {
      const raced = await env.DB.prepare("SELECT id FROM crm_customers WHERE lead_id = ? LIMIT 1").bind(leadId).first();
      if (raced) return json({ data: { customer_id: raced.id, lead_id: leadId, already_converted: true } });
      throw error;
    }
    return json({ data: { customer_id: customerId, lead_id: leadId, already_converted: false } }, 201);
  }
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
      "SELECT q.id, q.customer_id, q.quote_number, q.status, q.currency, q.subtotal_minor, q.discount_minor, q.total_minor, q.valid_until, q.created_at, q.updated_at, m.membership_role FROM crm_quotes q INNER JOIN crm_customer_members m ON m.customer_id = q.customer_id WHERE m.user_id = ? AND q.status != 'draft' ORDER BY q.created_at DESC LIMIT 100"
    ).bind(principal.user.id).all();
    return json({ data: result.results || [] });
  }
  const quoteMatch = url.pathname.match(/^\/api\/v1\/me\/quotes\/([^/]+)(?:\/accept)?$/);
  if (quoteMatch && ["GET", "POST"].includes(request.method)) {
    const principal = await authenticatedPrincipal(request, env);
    if (principal.error) return principal.error;
    let quoteId;
    try { quoteId = decodeURIComponent(quoteMatch[1]); }
    catch { return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy báo giá." } }, 404); }
    if (!quoteId || quoteId.length > 80 || quoteId.includes("/")) {
      return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy báo giá." } }, 404);
    }
    const isAccept = url.pathname.endsWith("/accept");
    if (!isAccept && request.method !== "GET") {
      return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
    }
    const quote = await env.DB.prepare(
      "SELECT q.id, q.customer_id, q.quote_number, q.status, q.currency, q.subtotal_minor, q.discount_minor, q.total_minor, q.valid_until, q.created_at, q.updated_at, q.accepted_by, q.accepted_at, m.membership_role FROM crm_quotes q INNER JOIN crm_customer_members m ON m.customer_id = q.customer_id WHERE q.id = ? AND m.user_id = ? AND q.status != 'draft' LIMIT 1"
    ).bind(quoteId, principal.user.id).first();
    if (!quote) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy báo giá." } }, 404);
    if (isAccept) {
      if (request.method !== "POST") return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
      if (!["owner", "billing"].includes(quote.membership_role)) {
        return json({ error: { code: "FORBIDDEN", message: "Bạn không có quyền xác nhận báo giá này." } }, 403);
      }
      if (quote.status !== "sent") {
        return json({ error: { code: "INVALID_STATE", message: "Chỉ báo giá đang chờ xác nhận mới có thể được chấp nhận." } }, 409);
      }
      if (quote.valid_until) {
        const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(quote.valid_until);
        const expired = dateOnly
          ? quote.valid_until < new Date().toISOString().slice(0, 10)
          : !Number.isFinite(Date.parse(quote.valid_until)) || Date.parse(quote.valid_until) < Date.now();
        if (expired) return json({ error: { code: "QUOTE_EXPIRED", message: "Báo giá đã hết hạn và không thể được chấp nhận." } }, 409);
      }
      const acceptedAt = new Date().toISOString();
      const auditId = crypto.randomUUID();
      const update = env.DB.prepare(
        "UPDATE crm_quotes SET status = 'accepted', accepted_by = ?, accepted_at = ?, updated_at = ? WHERE id = ? AND status = 'sent' AND (valid_until IS NULL OR date(valid_until) >= date(?))"
      ).bind(principal.user.id, acceptedAt, acceptedAt, quoteId, acceptedAt);
      const audit = env.DB.prepare(
        "INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) SELECT ?, ?, 'quote.accepted', 'quote', id, ?, ? FROM crm_quotes WHERE id = ? AND status = 'accepted' AND accepted_by = ? AND accepted_at = ?"
      ).bind(auditId, principal.user.id, JSON.stringify({ quote_number: quote.quote_number }), acceptedAt, quoteId, principal.user.id, acceptedAt);
      const results = await env.DB.batch([update, audit]);
      if (!results?.[0]?.meta?.changes) {
        return json({ error: { code: "INVALID_STATE", message: "Báo giá đã thay đổi hoặc không còn hiệu lực. Vui lòng tải lại." } }, 409);
      }
    }
    const current = await env.DB.prepare(
      "SELECT id, quote_number, status, currency, subtotal_minor, discount_minor, total_minor, valid_until, created_at, updated_at, accepted_by, accepted_at FROM crm_quotes WHERE id = ? LIMIT 1"
    ).bind(quoteId).first();
    const items = await env.DB.prepare(
      "SELECT id, description, quantity, unit_price_minor, line_total_minor, sort_order FROM crm_quote_items WHERE quote_id = ? ORDER BY sort_order ASC, id ASC"
    ).bind(quoteId).all();
    return json({ data: { ...current, customer_id: quote.customer_id, membership_role: quote.membership_role, items: items.results || [] } });
  }
  const adminQuotePath = url.pathname.match(/^\/api\/v1\/admin\/quotes(?:\/([^/]+)(?:\/([^/]+))?)?$/);
  if (adminQuotePath) {
    const principal = await authenticatedPrincipal(request, env);
    if (principal.error) return principal.error;
    if (!hasAnyRole(principal, ["admin", "staff"])) {
      return json({ error: { code: "FORBIDDEN", message: "Bạn không có quyền quản lý báo giá." } }, 403);
    }
    let quoteId = "";
    try { quoteId = adminQuotePath[1] ? decodeURIComponent(adminQuotePath[1]) : ""; }
    catch { return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy báo giá." } }, 404); }
    const action = adminQuotePath[2] || "";
    if (quoteId && (quoteId.length > 80 || quoteId.includes("/"))) {
      return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy báo giá." } }, 404);
    }
    if (!quoteId && !action && request.method === "GET") {
      const status = clean(url.searchParams.get("status"), 20);
      if (status && !["draft", "sent", "accepted", "rejected", "expired", "cancelled"].includes(status)) {
        return json({ error: { code: "VALIDATION_ERROR", message: "Trạng thái báo giá không hợp lệ." } }, 400);
      }
      const limit = Math.max(1, Math.min(100, Number.parseInt(url.searchParams.get("limit") || "50", 10) || 50));
      const result = status
        ? await env.DB.prepare("SELECT q.id, q.customer_id, c.display_name AS customer_name, q.quote_number, q.status, q.currency, q.subtotal_minor, q.discount_minor, q.total_minor, q.valid_until, q.created_at, q.updated_at FROM crm_quotes q INNER JOIN crm_customers c ON c.id = q.customer_id WHERE q.status = ? ORDER BY q.created_at DESC, q.quote_number ASC LIMIT ?").bind(status, limit).all()
        : await env.DB.prepare("SELECT q.id, q.customer_id, c.display_name AS customer_name, q.quote_number, q.status, q.currency, q.subtotal_minor, q.discount_minor, q.total_minor, q.valid_until, q.created_at, q.updated_at FROM crm_quotes q INNER JOIN crm_customers c ON c.id = q.customer_id ORDER BY q.created_at DESC, q.quote_number ASC LIMIT ?").bind(limit).all();
      return json({ data: result.results || [], meta: { limit, status: status || "all" } });
    }
    if (!quoteId && !action && request.method === "POST") {
      const body = await readJson(request);
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return json({ error: { code: "VALIDATION_ERROR", message: "Dữ liệu báo giá không hợp lệ." } }, 400);
      }
      const customerId = clean(body.customer_id, 80);
      const customer = await env.DB.prepare("SELECT id FROM crm_customers WHERE id = ? AND status = 'active' LIMIT 1").bind(customerId).first();
      if (!customer) return json({ error: { code: "CUSTOMER_NOT_FOUND", message: "Không tìm thấy khách hàng đang hoạt động." } }, 404);
      if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) {
        return json({ error: { code: "VALIDATION_ERROR", message: "Báo giá cần có từ 1 đến 50 hạng mục." } }, 400);
      }
      const currency = clean(body.currency || "VND", 3).toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency)) return json({ error: { code: "VALIDATION_ERROR", message: "Mã tiền tệ phải gồm 3 chữ cái." } }, 400);
      const discount = body.discount_minor === undefined ? 0 : body.discount_minor;
      if (!Number.isSafeInteger(discount) || discount < 0) return json({ error: { code: "VALIDATION_ERROR", message: "Giảm giá phải là số nguyên không âm." } }, 400);
      const items = [];
      let subtotal = 0;
      for (const [index, item] of body.items.entries()) {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          return json({ error: { code: "VALIDATION_ERROR", message: "Hạng mục báo giá không hợp lệ." } }, 400);
        }
        const description = clean(item.description, 500);
        const quantity = item.quantity;
        const unitPrice = item.unit_price_minor;
        if (!description || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100000 || !Number.isSafeInteger(unitPrice) || unitPrice < 0) {
          return json({ error: { code: "VALIDATION_ERROR", message: "Mô tả, số lượng hoặc đơn giá của hạng mục không hợp lệ." } }, 400);
        }
        const lineTotal = quantity * unitPrice;
        if (!Number.isSafeInteger(lineTotal) || !Number.isSafeInteger(subtotal + lineTotal)) {
          return json({ error: { code: "VALIDATION_ERROR", message: "Tổng giá trị báo giá vượt giới hạn cho phép." } }, 400);
        }
        subtotal += lineTotal;
        items.push({ id: crypto.randomUUID(), description, quantity, unit_price_minor: unitPrice, line_total_minor: lineTotal, sort_order: Number.isInteger(item.sort_order) ? Math.max(0, Math.min(100000, item.sort_order)) : index });
      }
      if (discount > subtotal) return json({ error: { code: "VALIDATION_ERROR", message: "Giảm giá không được lớn hơn tạm tính." } }, 400);
      const validUntil = body.valid_until == null || body.valid_until === "" ? null : clean(body.valid_until, 40);
      if (validUntil) {
        const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(validUntil);
        const parsed = Date.parse(dateOnly ? validUntil + "T00:00:00Z" : validUntil);
        const validDate = Number.isFinite(parsed) && (!dateOnly || new Date(parsed).toISOString().slice(0, 10) === validUntil);
        if (!validDate) return json({ error: { code: "VALIDATION_ERROR", message: "Ngày hết hạn báo giá không hợp lệ." } }, 400);
      }
      const notes = clean(body.notes, 5000);
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const quoteNumber = "HQ-" + now.slice(0, 10).replace(/-/g, "") + "-" + crypto.randomUUID().slice(0, 6).toUpperCase();
      const quote = { id, customer_id: customerId, quote_number: quoteNumber, status: "draft", currency, subtotal_minor: subtotal, discount_minor: discount, total_minor: subtotal - discount, valid_until: validUntil, notes, created_by: principal.user.id, created_at: now, updated_at: now, accepted_by: null, accepted_at: null };
      const statements = [
        env.DB.prepare("INSERT INTO crm_quotes (id, customer_id, quote_number, status, currency, subtotal_minor, discount_minor, total_minor, valid_until, notes, created_by, created_at, updated_at, accepted_by, accepted_at) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)").bind(id, customerId, quoteNumber, currency, subtotal, discount, subtotal - discount, validUntil, notes, principal.user.id, now, now),
        ...items.map(item => env.DB.prepare("INSERT INTO crm_quote_items (id, quote_id, description, quantity, unit_price_minor, line_total_minor, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(item.id, id, item.description, item.quantity, item.unit_price_minor, item.line_total_minor, item.sort_order)),
        env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'quote.created', 'quote', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, id, JSON.stringify({ quote_number: quoteNumber, customer_id: customerId }), now)
      ];
      await env.DB.batch(statements);
      return json({ data: { ...quote, items } }, 201);
    }
    if (quoteId && !action && request.method === "GET") {
      const quote = await env.DB.prepare("SELECT q.id, q.customer_id, c.display_name AS customer_name, q.quote_number, q.status, q.currency, q.subtotal_minor, q.discount_minor, q.total_minor, q.valid_until, q.notes, q.created_by, q.created_at, q.updated_at, q.accepted_by, q.accepted_at FROM crm_quotes q INNER JOIN crm_customers c ON c.id = q.customer_id WHERE q.id = ? LIMIT 1").bind(quoteId).first();
      if (!quote) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy báo giá." } }, 404);
      const items = await env.DB.prepare("SELECT id, description, quantity, unit_price_minor, line_total_minor, sort_order FROM crm_quote_items WHERE quote_id = ? ORDER BY sort_order ASC, id ASC").bind(quoteId).all();
      return json({ data: { ...quote, items: items.results || [] } });
    }
    if (quoteId && action === "send" && request.method === "POST") {
      const quote = await env.DB.prepare("SELECT id, quote_number, status, valid_until FROM crm_quotes WHERE id = ? LIMIT 1").bind(quoteId).first();
      if (!quote) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy báo giá." } }, 404);
      if (quote.status !== "draft") return json({ error: { code: "INVALID_STATE", message: "Chỉ báo giá nháp mới có thể gửi." } }, 409);
      if (quote.valid_until) {
        const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(quote.valid_until);
        const expired = dateOnly ? quote.valid_until < new Date().toISOString().slice(0, 10) : !Number.isFinite(Date.parse(quote.valid_until)) || Date.parse(quote.valid_until) < Date.now();
        if (expired) return json({ error: { code: "QUOTE_EXPIRED", message: "Ngày hết hạn đã qua; không thể gửi báo giá." } }, 409);
      }
      const itemCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM crm_quote_items WHERE quote_id = ?").bind(quoteId).first();
      if (!itemCount?.count) return json({ error: { code: "INVALID_STATE", message: "Báo giá cần có ít nhất một hạng mục." } }, 409);
      const now = new Date().toISOString();
      const update = env.DB.prepare("UPDATE crm_quotes SET status = 'sent', updated_at = ? WHERE id = ? AND status = 'draft' AND (valid_until IS NULL OR date(valid_until) >= date(?))").bind(now, quoteId, now);
      const audit = env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) SELECT ?, ?, 'quote.sent', 'quote', id, ?, ? FROM crm_quotes WHERE id = ? AND status = 'sent' AND updated_at = ?").bind(crypto.randomUUID(), principal.user.id, JSON.stringify({ quote_number: quote.quote_number }), now, quoteId, now);
      const results = await env.DB.batch([update, audit]);
      if (!results?.[0]?.meta?.changes) return json({ error: { code: "INVALID_STATE", message: "Báo giá đã thay đổi. Vui lòng tải lại." } }, 409);
      const updated = await env.DB.prepare("SELECT id, quote_number, status, currency, subtotal_minor, discount_minor, total_minor, valid_until, notes, created_at, updated_at FROM crm_quotes WHERE id = ? LIMIT 1").bind(quoteId).first();
      const items = await env.DB.prepare("SELECT id, description, quantity, unit_price_minor, line_total_minor, sort_order FROM crm_quote_items WHERE quote_id = ? ORDER BY sort_order ASC, id ASC").bind(quoteId).all();
      return json({ data: { ...updated, items: items.results || [] } });
    }
    return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy thao tác báo giá." } }, 404);
  }
  if (url.pathname === "/api/v1/admin/customers") {
    const principal = await authenticatedPrincipal(request, env);
    if (principal.error) return principal.error;
    if (!hasAnyRole(principal, ["admin", "staff"])) {
      return json({ error: { code: "FORBIDDEN", message: "Bạn không có quyền quản lý khách hàng." } }, 403);
    }
    if (request.method === "GET") {
      const result = await env.DB.prepare(
        "SELECT id, display_name, organization_name, contact_email, phone, status, created_at, updated_at FROM crm_customers ORDER BY created_at DESC LIMIT 100"
      ).all();
      return json({ data: result.results || [] });
    }
    if (request.method === "POST") {
      const body = await readJson(request);
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return json({ error: { code: "VALIDATION_ERROR", message: "Dữ liệu khách hàng không hợp lệ." } }, 400);
      }
      const displayName = clean(body.display_name, 180);
      const organizationName = clean(body.organization_name, 180);
      const contactEmail = clean(body.contact_email, 254).toLowerCase();
      const phone = clean(body.phone, 40);
      const notes = clean(body.notes, 5000);
      if (displayName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
        return json({ error: { code: "VALIDATION_ERROR", message: "Tên khách hàng hoặc email không hợp lệ." } }, 400);
      }
      const now = new Date().toISOString(), id = crypto.randomUUID();
      const customer = { id, display_name: displayName, organization_name: organizationName, contact_email: contactEmail, phone, status: "active", notes, created_at: now, updated_at: now };
      await env.DB.batch([
        env.DB.prepare("INSERT INTO crm_customers (id, display_name, organization_name, contact_email, phone, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)").bind(id, displayName, organizationName, contactEmail, phone, notes, now, now),
        env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'customer.created', 'customer', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, id, JSON.stringify({ contact_email: contactEmail }), now)
      ]);
      return json({ data: customer }, 201);
    }
    return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
  }
  const customerMatch = url.pathname.match(/^\/api\/v1\/admin\/customers\/([^/]+)(?:\/(activities))?$/);
  if (customerMatch) {
    const principal = await authenticatedPrincipal(request, env);
    if (principal.error) return principal.error;
    if (!hasAnyRole(principal, ["admin", "staff"])) {
      return json({ error: { code: "FORBIDDEN", message: "Bạn không có quyền quản lý khách hàng." } }, 403);
    }
    let customerId;
    try { customerId = decodeURIComponent(customerMatch[1]); }
    catch { return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy khách hàng." } }, 404); }
    if (!customerId || customerId.length > 80 || customerId.includes("/")) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy khách hàng." } }, 404);
    const isActivities = customerMatch[2] === "activities";
    const customer = await env.DB.prepare("SELECT id, display_name, organization_name, contact_email, phone, status, notes, created_at, updated_at FROM crm_customers WHERE id = ? LIMIT 1").bind(customerId).first();
    if (!customer) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy khách hàng." } }, 404);
    if (isActivities && request.method === "GET") {
      const limit = Math.max(1, Math.min(100, Number.parseInt(url.searchParams.get("limit") || "50", 10) || 50));
      const result = await env.DB.prepare("SELECT id, activity_type, subject, body, actor_id, occurred_at, created_at FROM crm_activities WHERE customer_id = ? ORDER BY occurred_at DESC, id DESC LIMIT ?").bind(customerId, limit).all();
      return json({ data: result.results || [], meta: { limit } });
    }
    if (isActivities && request.method === "POST") {
      const body = await readJson(request);
      if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: { code: "VALIDATION_ERROR", message: "Dữ liệu hoạt động không hợp lệ." } }, 400);
      const activityType = clean(body.activity_type, 30);
      const subject = clean(body.subject, 180);
      const activityBody = clean(body.body, 10000);
      if (!["note", "call", "email", "meeting", "status_change"].includes(activityType) || !subject) {
        return json({ error: { code: "VALIDATION_ERROR", message: "Loại hoạt động hoặc tiêu đề không hợp lệ." } }, 400);
      }
      const now = new Date().toISOString(), id = crypto.randomUUID();
      const activity = { id, customer_id: customerId, activity_type: activityType, subject, body: activityBody, actor_id: principal.user.id, occurred_at: now, created_at: now };
      await env.DB.batch([
        env.DB.prepare("INSERT INTO crm_activities (id, customer_id, activity_type, subject, body, actor_id, occurred_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(id, customerId, activityType, subject, activityBody, principal.user.id, now, now),
        env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'customer.activity.created', 'customer', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, customerId, JSON.stringify({ activity_id: id, activity_type: activityType }), now)
      ]);
      return json({ data: activity }, 201);
    }
    if (!isActivities && request.method === "GET") return json({ data: customer });
    if (!isActivities && request.method === "PATCH") {
      const body = await readJson(request);
      if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: { code: "VALIDATION_ERROR", message: "Dữ liệu khách hàng không hợp lệ." } }, 400);
      const displayName = body.display_name === undefined ? customer.display_name : clean(body.display_name, 180);
      const organizationName = body.organization_name === undefined ? customer.organization_name : clean(body.organization_name, 180);
      const contactEmail = body.contact_email === undefined ? customer.contact_email : clean(body.contact_email, 254).toLowerCase();
      const phone = body.phone === undefined ? customer.phone : clean(body.phone, 40);
      const notes = body.notes === undefined ? customer.notes : clean(body.notes, 5000);
      const status = body.status === undefined ? customer.status : clean(body.status, 20);
      if (displayName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) || !["active", "inactive", "archived"].includes(status)) {
        return json({ error: { code: "VALIDATION_ERROR", message: "Thông tin hoặc trạng thái khách hàng không hợp lệ." } }, 400);
      }
      const now = new Date().toISOString();
      await env.DB.batch([
        env.DB.prepare("UPDATE crm_customers SET display_name = ?, organization_name = ?, contact_email = ?, phone = ?, notes = ?, status = ?, updated_at = ? WHERE id = ?").bind(displayName, organizationName, contactEmail, phone, notes, status, now, customerId),
        env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'customer.updated', 'customer', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, customerId, JSON.stringify({ status }), now)
      ]);
      const updated = await env.DB.prepare("SELECT id, display_name, organization_name, contact_email, phone, status, notes, created_at, updated_at FROM crm_customers WHERE id = ? LIMIT 1").bind(customerId).first();
      return json({ data: updated });
    }
    return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
  }
  return null;
}

const CMS_RESOURCES = {
  pages: {
    table: "cms_pages", kind: "page",
    select: "id, slug, title, excerpt, content_json, seo_json, status, published_at, created_at, updated_at",
    required: ["slug", "title"]
  },
  posts: {
    table: "cms_posts", kind: "post",
    select: "id, slug, title, excerpt, body_json, seo_json, author_name, status, published_at, created_at, updated_at",
    required: ["slug", "title"]
  },
  services: {
    table: "cms_services", kind: "service",
    select: "id, slug, name, summary, description_json, sort_order, status, published_at, created_at, updated_at",
    required: ["slug", "name"]
  }
};

function cmsObject(value, maxLength = 100000) {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const serialized = JSON.stringify(value);
  return serialized.length <= maxLength ? value : null;
}

function validCmsSlug(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 180;
}

function cmsSnapshot(resource, row) {
  const snapshot = { ...row };
  for (const key of ["content_json", "body_json", "seo_json", "description_json"]) {
    if (Object.prototype.hasOwnProperty.call(snapshot, key)) {
      snapshot[key.replace(/_json$/, "")] = parseJsonField(snapshot[key]);
      delete snapshot[key];
    }
  }
  return snapshot;
}

function recordCmsRevision(env, resourceName, resourceId, action, actorId, snapshot, createdAt) {
  return env.DB.prepare(
    "INSERT INTO cms_revisions (id, resource_type, resource_id, action, actor_id, snapshot_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(crypto.randomUUID(), resourceName, resourceId, action, actorId, JSON.stringify(snapshot), createdAt);
}

async function adminContent(request, env, url) {
  const principal = await authenticatedPrincipal(request, env);
  if (principal.error) return principal.error;
  if (!hasAnyRole(principal, ["admin", "staff"])) {
    return json({ error: { code: "FORBIDDEN", message: "Bạn không có quyền quản lý nội dung." } }, 403);
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const resourceName = parts[3];
  const config = CMS_RESOURCES[resourceName];
  if (!config || parts.length > 6) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy tài nguyên." } }, 404);

  let resourceId = "";
  try { resourceId = parts[4] ? decodeURIComponent(parts[4]) : ""; }
  catch { return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy nội dung." } }, 404); }
  const action = parts[5] || "";
  if (resourceId && (!resourceId || resourceId.length > 80 || resourceId.includes("/"))) {
    return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy nội dung." } }, 404);
  }
  if (action && !["publish", "archive", "revisions", "restore"].includes(action)) {
    return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy thao tác." } }, 404);
  }

  if (action === "publish" || action === "archive" || action === "restore" || request.method === "DELETE") {
    if (!hasAnyRole(principal, ["admin"])) {
      return json({ error: { code: "FORBIDDEN", message: "Chỉ quản trị viên được xuất bản hoặc lưu trữ nội dung." } }, 403);
    }
  }

  const now = new Date().toISOString();
  if (!resourceId && request.method === "GET") {
    const status = clean(url.searchParams.get("status"), 20);
    if (status && !["draft", "published", "archived"].includes(status)) {
      return json({ error: { code: "VALIDATION_ERROR", message: "Trạng thái nội dung không hợp lệ." } }, 400);
    }
    const limit = Math.max(1, Math.min(100, Number.parseInt(url.searchParams.get("limit") || "50", 10) || 50));
    const offset = Math.max(0, Math.min(10000, Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0));
    const where = status ? " WHERE status = ?" : "";
    const statement = env.DB.prepare(
      "SELECT " + config.select + " FROM " + config.table + where + " ORDER BY updated_at DESC, slug ASC LIMIT ? OFFSET ?"
    );
    const result = status ? await statement.bind(status, limit, offset).all() : await statement.bind(limit, offset).all();
    return json({ data: (result.results || []).map(row => cmsSnapshot(config, row)), meta: { limit, offset, status: status || "all" } });
  }

  if (!resourceId && request.method === "POST") {
    const body = await readJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ error: { code: "VALIDATION_ERROR", message: "Dữ liệu nội dung không hợp lệ." } }, 400);
    }
    const slug = clean(body.slug, 180);
    const titleKey = resourceName === "services" ? "name" : "title";
    const title = clean(body[titleKey], 240);
    const excerpt = clean(body.excerpt, 500);
    if (!validCmsSlug(slug) || title.length < 2) {
      return json({ error: { code: "VALIDATION_ERROR", message: "Slug và tiêu đề là bắt buộc; slug chỉ gồm chữ thường, số và dấu gạch nối." } }, 400);
    }
    const seo = cmsObject(body.seo, 10000);
    if (seo === null) return json({ error: { code: "VALIDATION_ERROR", message: "Dữ liệu SEO phải là đối tượng JSON hợp lệ và không vượt quá giới hạn." } }, 400);
    const id = crypto.randomUUID();
    let row, statement;
    if (resourceName === "pages") {
      const content = cmsObject(body.content, 100000);
      if (content === null) return json({ error: { code: "VALIDATION_ERROR", message: "Nội dung trang không hợp lệ hoặc quá lớn." } }, 400);
      row = { id, slug, title, excerpt, content, seo, status: "draft", published_at: null, created_at: now, updated_at: now };
      statement = env.DB.prepare("INSERT INTO cms_pages (id, slug, title, excerpt, content_json, seo_json, status, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'draft', NULL, ?, ?)")
        .bind(id, slug, title, excerpt, JSON.stringify(content), JSON.stringify(seo), now, now);
    } else if (resourceName === "posts") {
      const bodyContent = cmsObject(body.body, 150000);
      if (bodyContent === null) return json({ error: { code: "VALIDATION_ERROR", message: "Nội dung bài viết không hợp lệ hoặc quá lớn." } }, 400);
      const author = clean(body.author_name || principal.user.name || "", 120);
      row = { id, slug, title, excerpt, body: bodyContent, seo, author_name: author, status: "draft", published_at: null, created_at: now, updated_at: now };
      statement = env.DB.prepare("INSERT INTO cms_posts (id, slug, title, excerpt, body_json, seo_json, author_name, status, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', NULL, ?, ?)")
        .bind(id, slug, title, excerpt, JSON.stringify(bodyContent), JSON.stringify(seo), author, now, now);
    } else {
      const summary = clean(body.summary, 500);
      const description = cmsObject(body.description, 100000);
      const sortOrder = Number.isInteger(body.sort_order) ? Math.max(0, Math.min(100000, body.sort_order)) : 0;
      if (description === null) return json({ error: { code: "VALIDATION_ERROR", message: "Mô tả dịch vụ không hợp lệ hoặc quá lớn." } }, 400);
      row = { id, slug, name: title, summary, description, sort_order: sortOrder, status: "draft", published_at: null, created_at: now, updated_at: now };
      statement = env.DB.prepare("INSERT INTO cms_services (id, slug, name, summary, description_json, sort_order, status, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'draft', NULL, ?, ?)")
        .bind(id, slug, title, summary, JSON.stringify(description), sortOrder, now, now);
    }
    const revision = recordCmsRevision(env, resourceName, id, "created", principal.user.id, row, now);
    await env.DB.batch([statement, revision]);
    return json({ data: row }, 201);
  }

  if (!resourceId) return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
  const existing = await env.DB.prepare("SELECT " + config.select + " FROM " + config.table + " WHERE id = ? LIMIT 1").bind(resourceId).first();
  if (!existing) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy nội dung." } }, 404);

  if (action === "revisions" && request.method === "GET") {
    const limit = Math.max(1, Math.min(50, Number.parseInt(url.searchParams.get("limit") || "20", 10) || 20));
    const result = await env.DB.prepare(
      "SELECT id, action, actor_id, created_at FROM cms_revisions WHERE resource_type = ? AND resource_id = ? ORDER BY created_at DESC, id DESC LIMIT ?"
    ).bind(resourceName, resourceId, limit).all();
    return json({ data: result.results || [], meta: { limit } });
  }

  if (action === "restore" && request.method === "POST") {
    const body = await readJson(request);
    const revisionId = clean(body?.revision_id, 80);
    if (!revisionId) return json({ error: { code: "VALIDATION_ERROR", message: "Mã phiên bản cần khôi phục không hợp lệ." } }, 400);
    const revision = await env.DB.prepare(
      "SELECT snapshot_json FROM cms_revisions WHERE id = ? AND resource_type = ? AND resource_id = ? LIMIT 1"
    ).bind(revisionId, resourceName, resourceId).first();
    if (!revision) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy phiên bản nội dung." } }, 404);
    const previous = parseJsonField(revision.snapshot_json);
    const titleKey = resourceName === "services" ? "name" : "title";
    const slug = clean(previous.slug, 180);
    const title = clean(previous[titleKey], 240);
    if (!validCmsSlug(slug) || title.length < 2) {
      return json({ error: { code: "INVALID_REVISION", message: "Phiên bản lưu trữ không có cấu trúc hợp lệ." } }, 409);
    }
    const excerpt = clean(previous.excerpt, 500);
    const seo = cmsObject(previous.seo || {}, 10000);
    if (seo === null) return json({ error: { code: "INVALID_REVISION", message: "Dữ liệu SEO trong phiên bản không hợp lệ." } }, 409);
    let snapshot, update;
    if (resourceName === "pages") {
      const content = cmsObject(previous.content || {}, 100000);
      if (content === null) return json({ error: { code: "INVALID_REVISION", message: "Nội dung trang trong phiên bản không hợp lệ." } }, 409);
      snapshot = { ...previous, id: resourceId, slug, title, excerpt, content, seo, status: "draft", published_at: null, updated_at: now };
      update = env.DB.prepare("UPDATE cms_pages SET slug = ?, title = ?, excerpt = ?, content_json = ?, seo_json = ?, status = 'draft', published_at = NULL, updated_at = ? WHERE id = ?")
        .bind(slug, title, excerpt, JSON.stringify(content), JSON.stringify(seo), now, resourceId);
    } else if (resourceName === "posts") {
      const bodyContent = cmsObject(previous.body || {}, 150000);
      const author = clean(previous.author_name || "", 120);
      if (bodyContent === null) return json({ error: { code: "INVALID_REVISION", message: "Nội dung bài viết trong phiên bản không hợp lệ." } }, 409);
      snapshot = { ...previous, id: resourceId, slug, title, excerpt, body: bodyContent, seo, author_name: author, status: "draft", published_at: null, updated_at: now };
      update = env.DB.prepare("UPDATE cms_posts SET slug = ?, title = ?, excerpt = ?, body_json = ?, seo_json = ?, author_name = ?, status = 'draft', published_at = NULL, updated_at = ? WHERE id = ?")
        .bind(slug, title, excerpt, JSON.stringify(bodyContent), JSON.stringify(seo), author, now, resourceId);
    } else {
      const summary = clean(previous.summary || "", 500);
      const description = cmsObject(previous.description || {}, 100000);
      const sortOrder = Number.isInteger(previous.sort_order) ? Math.max(0, Math.min(100000, previous.sort_order)) : 0;
      if (description === null) return json({ error: { code: "INVALID_REVISION", message: "Mô tả dịch vụ trong phiên bản không hợp lệ." } }, 409);
      snapshot = { ...previous, id: resourceId, slug, name: title, summary, description, sort_order: sortOrder, seo, status: "draft", published_at: null, updated_at: now };
      update = env.DB.prepare("UPDATE cms_services SET slug = ?, name = ?, summary = ?, description_json = ?, sort_order = ?, status = 'draft', published_at = NULL, updated_at = ? WHERE id = ?")
        .bind(slug, title, summary, JSON.stringify(description), sortOrder, now, resourceId);
    }
    await env.DB.batch([update, recordCmsRevision(env, resourceName, resourceId, "updated", principal.user.id, snapshot, now)]);
    return json({ data: snapshot, restored_from: revisionId });
  }

  if (!action && request.method === "GET") {
    return json({ data: cmsSnapshot(config, existing) });
  }

  if (action === "publish" && request.method === "POST") {
    if (existing.status === "archived") return json({ error: { code: "INVALID_STATE", message: "Không thể xuất bản nội dung đã lưu trữ." } }, 409);
    const publishedAt = existing.published_at || now;
    const snapshot = { ...cmsSnapshot(config, existing), status: "published", published_at: publishedAt, updated_at: now };
    const update = env.DB.prepare("UPDATE " + config.table + " SET status = 'published', published_at = ?, updated_at = ? WHERE id = ?").bind(publishedAt, now, resourceId);
    await env.DB.batch([update, recordCmsRevision(env, resourceName, resourceId, "published", principal.user.id, snapshot, now)]);
    return json({ data: snapshot });
  }

  if (action === "archive" && request.method === "POST" || !action && request.method === "DELETE") {
    const snapshot = { ...cmsSnapshot(config, existing), status: "archived", published_at: null, updated_at: now };
    const update = env.DB.prepare("UPDATE " + config.table + " SET status = 'archived', published_at = NULL, updated_at = ? WHERE id = ?").bind(now, resourceId);
    await env.DB.batch([update, recordCmsRevision(env, resourceName, resourceId, "archived", principal.user.id, snapshot, now)]);
    return json({ data: snapshot });
  }

  if (!action && request.method === "PATCH") {
    const body = await readJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ error: { code: "VALIDATION_ERROR", message: "Dữ liệu cập nhật không hợp lệ." } }, 400);
    }
    const old = cmsSnapshot(config, existing);
    const slug = body.slug === undefined ? old.slug : clean(body.slug, 180);
    const titleKey = resourceName === "services" ? "name" : "title";
    const title = body[titleKey] === undefined ? old[titleKey] : clean(body[titleKey], 240);
    const excerpt = body.excerpt === undefined ? (old.excerpt || "") : clean(body.excerpt, 500);
    if (!validCmsSlug(slug) || title.length < 2) {
      return json({ error: { code: "VALIDATION_ERROR", message: "Slug hoặc tiêu đề không hợp lệ." } }, 400);
    }
    const seo = body.seo === undefined ? (old.seo || {}) : cmsObject(body.seo, 10000);
    if (seo === null) return json({ error: { code: "VALIDATION_ERROR", message: "Dữ liệu SEO không hợp lệ." } }, 400);
    let snapshot, update;
    if (resourceName === "pages") {
      const content = body.content === undefined ? (old.content || {}) : cmsObject(body.content, 100000);
      if (content === null) return json({ error: { code: "VALIDATION_ERROR", message: "Nội dung trang không hợp lệ." } }, 400);
      snapshot = { ...old, slug, title, excerpt, content, seo, status: "draft", published_at: null, updated_at: now };
      update = env.DB.prepare("UPDATE cms_pages SET slug = ?, title = ?, excerpt = ?, content_json = ?, seo_json = ?, status = 'draft', published_at = NULL, updated_at = ? WHERE id = ?")
        .bind(slug, title, excerpt, JSON.stringify(content), JSON.stringify(seo), now, resourceId);
    } else if (resourceName === "posts") {
      const bodyContent = body.body === undefined ? (old.body || {}) : cmsObject(body.body, 150000);
      const author = body.author_name === undefined ? (old.author_name || "") : clean(body.author_name, 120);
      if (bodyContent === null) return json({ error: { code: "VALIDATION_ERROR", message: "Nội dung bài viết không hợp lệ." } }, 400);
      snapshot = { ...old, slug, title, excerpt, body: bodyContent, seo, author_name: author, status: "draft", published_at: null, updated_at: now };
      update = env.DB.prepare("UPDATE cms_posts SET slug = ?, title = ?, excerpt = ?, body_json = ?, seo_json = ?, author_name = ?, status = 'draft', published_at = NULL, updated_at = ? WHERE id = ?")
        .bind(slug, title, excerpt, JSON.stringify(bodyContent), JSON.stringify(seo), author, now, resourceId);
    } else {
      const summary = body.summary === undefined ? (old.summary || "") : clean(body.summary, 500);
      const description = body.description === undefined ? (old.description || {}) : cmsObject(body.description, 100000);
      const sortOrder = body.sort_order === undefined ? (old.sort_order || 0) : (Number.isInteger(body.sort_order) ? Math.max(0, Math.min(100000, body.sort_order)) : -1);
      if (description === null || sortOrder < 0) return json({ error: { code: "VALIDATION_ERROR", message: "Mô tả hoặc thứ tự dịch vụ không hợp lệ." } }, 400);
      snapshot = { ...old, slug, name: title, summary, description, sort_order: sortOrder, status: "draft", published_at: null, updated_at: now };
      update = env.DB.prepare("UPDATE cms_services SET slug = ?, name = ?, summary = ?, description_json = ?, sort_order = ?, status = 'draft', published_at = NULL, updated_at = ? WHERE id = ?")
        .bind(slug, title, summary, JSON.stringify(description), sortOrder, now, resourceId);
    }
    await env.DB.batch([update, recordCmsRevision(env, resourceName, resourceId, "updated", principal.user.id, snapshot, now)]);
    return json({ data: snapshot });
  }

  return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
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
  if (!["GET", "POST", "PATCH", "DELETE"].includes(request.method)) return withSecurity(json({ error: "METHOD_NOT_ALLOWED" }, 405, { allow: "GET, POST, PATCH, OPTIONS" }));
  if (origin && !allowed.includes(origin)) return withSecurity(json({ error: "ORIGIN_NOT_ALLOWED" }, 403));
  try { let response;
    if (url.pathname === "/_test/migrate" && request.method === "POST" && env.TEST_MODE === "true") {
      const auth = getAuth(env, request);
      await migrateAuthDatabase(auth);
      // Wrangler's test harness does not automatically apply application D1
      // migrations. Build the minimal CRM fixture schema only in TEST_MODE.
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS crm_customers (id TEXT PRIMARY KEY, lead_id TEXT, display_name TEXT NOT NULL, organization_name TEXT NOT NULL DEFAULT '', contact_email TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'active', notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_test_crm_customers_lead_unique ON crm_customers(lead_id) WHERE lead_id IS NOT NULL").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS app_user_roles (user_id TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','staff','customer')), assigned_by TEXT NOT NULL, assigned_at TEXT NOT NULL, PRIMARY KEY(user_id, role))").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS crm_customer_members (customer_id TEXT NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE, user_id TEXT NOT NULL, membership_role TEXT NOT NULL DEFAULT 'owner' CHECK(membership_role IN ('owner','member','billing')), created_at TEXT NOT NULL, PRIMARY KEY(customer_id, user_id))").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS crm_activities (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE, lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL, activity_type TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL DEFAULT '', actor_id TEXT NOT NULL, occurred_at TEXT NOT NULL, created_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS crm_quotes (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES crm_customers(id) ON DELETE RESTRICT, quote_number TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'draft', currency TEXT NOT NULL DEFAULT 'VND', subtotal_minor INTEGER NOT NULL DEFAULT 0, discount_minor INTEGER NOT NULL DEFAULT 0, total_minor INTEGER NOT NULL DEFAULT 0, valid_until TEXT, notes TEXT NOT NULL DEFAULT '', created_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, accepted_by TEXT, accepted_at TEXT)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS crm_quote_items (id TEXT PRIMARY KEY, quote_id TEXT NOT NULL REFERENCES crm_quotes(id) ON DELETE CASCADE, description TEXT NOT NULL, quantity INTEGER NOT NULL, unit_price_minor INTEGER NOT NULL, line_total_minor INTEGER NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS crm_audit_events (id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, action TEXT NOT NULL, resource_type TEXT NOT NULL, resource_id TEXT NOT NULL, metadata_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, service TEXT NOT NULL, budget TEXT NOT NULL DEFAULT '', goals TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'new', consent_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS lead_events (id TEXT PRIMARY KEY, lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE, event_type TEXT NOT NULL, details TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS cms_pages (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, excerpt TEXT NOT NULL DEFAULT '', content_json TEXT NOT NULL DEFAULT '{}', seo_json TEXT NOT NULL DEFAULT '{}', status TEXT NOT NULL DEFAULT 'draft', published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS cms_posts (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, excerpt TEXT NOT NULL DEFAULT '', body_json TEXT NOT NULL DEFAULT '{}', seo_json TEXT NOT NULL DEFAULT '{}', author_name TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft', published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS cms_services (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, summary TEXT NOT NULL DEFAULT '', description_json TEXT NOT NULL DEFAULT '{}', sort_order INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'draft', published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS cms_revisions (id TEXT PRIMARY KEY, resource_type TEXT NOT NULL, resource_id TEXT NOT NULL, action TEXT NOT NULL, actor_id TEXT NOT NULL, snapshot_json TEXT NOT NULL, created_at TEXT NOT NULL)").run();
      response = new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
    }
    else if (url.pathname === "/_test/audit-count" && request.method === "GET" && env.TEST_MODE === "true") {
      const result = await env.DB.prepare("SELECT COUNT(*) AS count FROM crm_audit_events WHERE action = 'quote.accepted'").first();
      response = json({ count: result?.count || 0 });
    }
    else if (url.pathname === "/_test/quote-audit-count" && request.method === "GET" && env.TEST_MODE === "true") {
      const result = await env.DB.prepare("SELECT action, COUNT(*) AS count FROM crm_audit_events WHERE resource_type = 'quote' GROUP BY action").all();
      response = json({ data: result.results || [] });
    }
    else if (url.pathname === "/_test/seed-lead" && request.method === "POST" && env.TEST_MODE === "true") {
      const body = await readJson(request), id = clean(body?.id, 80) || crypto.randomUUID();
      const name = clean(body?.name, 120), email = clean(body?.email, 254).toLowerCase(), service = clean(body?.service, 100);
      if (name.length < 2 || !validEmail(email) || !SERVICES.has(service)) response = json({ error: "INVALID_TEST_LEAD" }, 400);
      else {
        const now = new Date().toISOString();
        await env.DB.prepare("INSERT INTO leads (id, name, email, service, budget, goals, status, consent_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'qualified', ?, ?, ?)").bind(id, name, email, service, clean(body?.budget, 100), clean(body?.goals, 3000), now, now, now).run();
        response = json({ id }, 201);
      }
    }
    else if (url.pathname === "/_test/customer-audit-count" && request.method === "GET" && env.TEST_MODE === "true") {
      const result = await env.DB.prepare("SELECT action, COUNT(*) AS count FROM crm_audit_events WHERE resource_type = 'customer' GROUP BY action").all();
      response = json({ data: result.results || [] });
    }
    else if (url.pathname === "/_test/seed-identity" && request.method === "POST" && env.TEST_MODE === "true") {
      const body = await readJson(request);
      const ids = [body?.userA, body?.userB, body?.adminUser].map(value => clean(value, 128));
      const memberUser = clean(body?.memberUser, 128);
      if (ids.some(value => !value) || new Set(ids).size !== 3 || (memberUser && ids.includes(memberUser))) {
        response = json({ error: "VALIDATION_ERROR" }, 400);
      } else {
        const now = new Date().toISOString();
        const customers = [
          { id: "test-customer-a", name: "Test Customer A", email: "a@example.test", userId: ids[0], quoteId: "test-quote-a", quoteNumber: "TEST-A" },
          { id: "test-customer-b", name: "Test Customer B", email: "b@example.test", userId: ids[1], quoteId: "test-quote-b", quoteNumber: "TEST-B" }
        ];
        for (const customer of customers) {
          await env.DB.prepare("INSERT INTO crm_customers (id, display_name, organization_name, contact_email, phone, status, notes, created_at, updated_at) VALUES (?, ?, '', ?, '', 'active', '', ?, ?) ON CONFLICT(id) DO UPDATE SET display_name = excluded.display_name, contact_email = excluded.contact_email, status = 'active', updated_at = excluded.updated_at").bind(customer.id, customer.name, customer.email, now, now).run();
          await env.DB.prepare("INSERT OR REPLACE INTO crm_customer_members (customer_id, user_id, membership_role, created_at) VALUES (?, ?, 'owner', ?)").bind(customer.id, customer.userId, now).run();
          await env.DB.prepare("INSERT OR REPLACE INTO crm_quotes (id, customer_id, quote_number, status, currency, subtotal_minor, discount_minor, total_minor, created_by, created_at, updated_at) VALUES (?, ?, ?, 'sent', 'VND', 1000000, 0, 1000000, ?, ?, ?)").bind(customer.quoteId, customer.id, customer.quoteNumber, customer.userId, now, now).run();
          await env.DB.prepare("INSERT OR REPLACE INTO crm_quote_items (id, quote_id, description, quantity, unit_price_minor, line_total_minor, sort_order) VALUES (?, ?, 'Website development', 1, 1000000, 1000000, 0)").bind(customer.quoteId + "-item", customer.quoteId).run();
          if (customer.id === "test-customer-a") {
            await env.DB.prepare("INSERT OR REPLACE INTO crm_quotes (id, customer_id, quote_number, status, currency, subtotal_minor, discount_minor, total_minor, valid_until, created_by, created_at, updated_at) VALUES ('test-quote-expired', ?, 'TEST-EXPIRED', 'sent', 'VND', 1000000, 0, 1000000, '2000-01-01', ?, ?, ?)").bind(customer.id, customer.userId, now, now).run();
          }
        }
        await env.DB.prepare("INSERT OR REPLACE INTO app_user_roles (user_id, role, assigned_by, assigned_at) VALUES (?, 'admin', 'test-fixture', ?)").bind(ids[2], now).run();
        if (memberUser) {
          await env.DB.prepare("INSERT OR REPLACE INTO crm_customer_members (customer_id, user_id, membership_role, created_at) VALUES ('test-customer-a', ?, 'member', ?)").bind(memberUser, now).run();
        }
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
    else if (url.pathname.startsWith("/api/v1/admin/pages") || url.pathname.startsWith("/api/v1/admin/posts") || url.pathname.startsWith("/api/v1/admin/services")) response = await adminContent(request, env, url);
    else if (url.pathname === "/api/v1/me" || url.pathname.startsWith("/api/v1/me/") || url.pathname === "/api/v1/admin/customers" || url.pathname.startsWith("/api/v1/admin/customers/") || url.pathname === "/api/v1/admin/quotes" || url.pathname.startsWith("/api/v1/admin/quotes/")) response = await identityRoutes(request, env, url) || json({ error: { code: "NOT_FOUND", message: "Không tìm thấy tài nguyên." } }, 404);
    else if (url.pathname.startsWith("/api/v1/public/")) response = await publicContent(request, env, url) || json({ error: { code: "NOT_FOUND", message: "Không tìm thấy tài nguyên." } }, 404);
    else if (url.pathname === "/api/leads" && request.method === "POST") response = await createLead(request, env);
    else if (url.pathname === "/api/estimate" && request.method === "POST") response = await estimate(request);
    else if (url.pathname === "/api/admin/leads") response = await adminLeads(request, env, url);
    else if (url.pathname === "/api/booking" && request.method === "GET") response = env.BOOKING_URL ? json({ url: env.BOOKING_URL }) : json({ error: "BOOKING_NOT_CONFIGURED", message: "Chưa cấu hình nhà cung cấp lịch hẹn." }, 503);
    else response = json({ error: "NOT_FOUND" }, 404);
    const headers = new Headers(response.headers); for (const [key, value] of Object.entries(cors)) headers.set(key, value); return withSecurity(new Response(response.body, { status: response.status, headers }));
  } catch (error) { console.error("API request failed", error?.message || "unknown"); const known = new Set(["CONTENT_TYPE", "TOO_LARGE", "INVALID_JSON", "DB_NOT_CONFIGURED"]); if (known.has(error?.message)) { const status = error.message === "TOO_LARGE" ? 413 : error.message === "DB_NOT_CONFIGURED" ? 503 : 400; return withSecurity(json({ error: error.message, message: "Không thể xử lý yêu cầu. Vui lòng kiểm tra dữ liệu hoặc thử lại sau." }, status, cors)); } return withSecurity(json({ error: "INTERNAL_ERROR", message: "Máy chủ đang gặp sự cố. Vui lòng thử lại sau." }, 500, cors)); }
} };