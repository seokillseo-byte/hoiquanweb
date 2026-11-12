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
    const columns = "l.id,l.name,l.email,l.service,l.budget,l.goals,l.status,l.assigned_to,l.consent_at,l.created_at,l.updated_at,c.id AS customer_id,u.name AS assigned_name,u.email AS assigned_email";
    const joins = ' FROM leads l LEFT JOIN crm_customers c ON c.lead_id = l.id LEFT JOIN "user" u ON u.id = l.assigned_to';
    const result = status && LEAD_STATUSES.has(status)
      ? await env.DB.prepare("SELECT " + columns + joins + " WHERE l.status = ? ORDER BY l.created_at DESC LIMIT ?").bind(status, limit).all()
      : await env.DB.prepare("SELECT " + columns + joins + " ORDER BY l.created_at DESC LIMIT ?").bind(limit).all();
    return json({ leads: result.results || [] });
  }
  if (request.method === "PATCH") {
    const body = await readJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "VALIDATION_ERROR", message: "Dữ liệu cập nhật lead không hợp lệ." }, 400);
    const id = clean(body.id, 80);
    const hasStatus = Object.prototype.hasOwnProperty.call(body, "status");
    const hasAssignment = Object.prototype.hasOwnProperty.call(body, "assigned_to");
    if (!id || (!hasStatus && !hasAssignment)) return json({ error: "VALIDATION_ERROR", message: "Cần mã lead và ít nhất một trường cần cập nhật." }, 400);
    const current = await env.DB.prepare("SELECT id, status, assigned_to, updated_at FROM leads WHERE id = ? LIMIT 1").bind(id).first();
    if (!current) return json({ error: "NOT_FOUND" }, 404);
    const status = hasStatus ? clean(body.status, 30) : current.status;
    if (hasStatus && !LEAD_STATUSES.has(status)) return json({ error: "VALIDATION_ERROR", message: "Trạng thái lead không hợp lệ." }, 400);
    let assignedTo = current.assigned_to || null;
    if (hasAssignment) {
      assignedTo = body.assigned_to == null || body.assigned_to === "" ? null : clean(body.assigned_to, 128);
      if (body.assigned_to != null && body.assigned_to !== "" && !assignedTo) return json({ error: "VALIDATION_ERROR", message: "Mã nhân viên không hợp lệ." }, 400);
      if (assignedTo) {
        const staff = await env.DB.prepare("SELECT user_id FROM app_user_roles WHERE user_id = ? AND role IN ('admin','staff') LIMIT 1").bind(assignedTo).first();
        if (!staff) return json({ error: "INVALID_ASSIGNEE", message: "Chỉ có thể giao lead cho tài khoản admin hoặc staff." }, 400);
      }
    }
    const statusChanged = status !== current.status;
    const assignmentChanged = assignedTo !== (current.assigned_to || null);
    if (!statusChanged && !assignmentChanged) return json({ ok: true, id, status, assigned_to: assignedTo, updatedAt: current.updated_at });
    const updatedAt = new Date().toISOString();
    const statements = [env.DB.prepare("UPDATE leads SET status = ?, assigned_to = ?, updated_at = ? WHERE id = ? AND status = ? AND assigned_to IS ?").bind(status, assignedTo, updatedAt, id, current.status, current.assigned_to || null)];
    if (statusChanged) {
      const details = JSON.stringify({ from: current.status, to: status, actorId: principal.user.id });
      statements.push(env.DB.prepare("INSERT INTO lead_events (id,lead_id,event_type,details,created_at) VALUES (?, ?, 'status_changed', ?, ?)").bind(crypto.randomUUID(), id, details, updatedAt));
      statements.push(env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'lead.status_changed', 'lead', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, id, details, updatedAt));
    }
    if (assignmentChanged) {
      const eventType = assignedTo ? "assigned" : "unassigned";
      const details = JSON.stringify({ from: current.assigned_to || null, to: assignedTo, actorId: principal.user.id });
      statements.push(env.DB.prepare("INSERT INTO lead_events (id,lead_id,event_type,details,created_at) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), id, eventType, details, updatedAt));
      statements.push(env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, ?, 'lead', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, assignedTo ? "lead.assigned" : "lead.unassigned", id, details, updatedAt));
    }
    // Commit the lead mutation and every history/audit record atomically in one D1 batch.
    const results = await env.DB.batch(statements);
    if (!results?.[0]?.meta?.changes) return json({ error: { code: "LEAD_UPDATE_CONFLICT", message: "Lead vừa được cập nhật bởi người khác. Vui lòng tải lại." } }, 409);
    return json({ ok: true, id, status, assigned_to: assignedTo, updatedAt });
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
  for (const key of ["content_json", "body_json", "seo_json", "compatibility_json", "description_json", "tags_json"]) {
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
  if (url.pathname === "/api/v1/admin/staff" && request.method === "GET") {
    const principal = await authenticatedPrincipal(request, env);
    if (principal.error) return principal.error;
    if (!hasAnyRole(principal, ["admin", "staff"])) return json({ error: { code: "FORBIDDEN", message: "Bạn không có quyền xem danh sách nhân viên." } }, 403);
    const result = await env.DB.prepare("SELECT u.id, u.name, u.email, GROUP_CONCAT(r.role, ',') AS roles FROM \"user\" u INNER JOIN app_user_roles r ON r.user_id = u.id WHERE r.role IN ('admin','staff') GROUP BY u.id, u.name, u.email ORDER BY u.name ASC LIMIT 100").all();
    return json({ data: result.results || [] });
  }
  const leadEventsMatch = url.pathname.match(/^\/api\/v1\/admin\/leads\/([^/]+)\/events$/);
  if (leadEventsMatch && request.method === "GET") {
    const principal = await authenticatedPrincipal(request, env);
    if (principal.error) return principal.error;
    if (!hasAnyRole(principal, ["admin", "staff"])) return json({ error: { code: "FORBIDDEN", message: "Bạn không có quyền xem lịch sử lead." } }, 403);
    let leadId;
    try { leadId = decodeURIComponent(leadEventsMatch[1]); } catch { return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy lead." } }, 404); }
    if (!leadId || leadId.length > 80 || leadId.includes("/")) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy lead." } }, 404);
    const exists = await env.DB.prepare("SELECT id FROM leads WHERE id = ? LIMIT 1").bind(leadId).first();
    if (!exists) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy lead." } }, 404);
    const result = await env.DB.prepare("SELECT id, event_type, details, created_at FROM lead_events WHERE lead_id = ? ORDER BY created_at DESC, id DESC LIMIT 100").bind(leadId).all();
    return json({ data: result.results || [] });
  }
  const leadConversionMatch = url.pathname.match(/^\/api\/v1\/admin\/leads\/([^/]+)\/convert$/);
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
    if (!["qualified", "proposal_sent", "won"].includes(lead.status)) {
      return json({ error: { code: "INVALID_LEAD_STAGE", message: "Chỉ lead đã đủ điều kiện, đã gửi đề xuất hoặc thành công mới có thể chuyển vào CRM." } }, 409);
    }
    if (!validEmail(lead.email)) return json({ error: { code: "LEAD_EMAIL_INVALID", message: "Email của lead không hợp lệ; cần cập nhật lead trước khi chuyển đổi." } }, 409);
    const now = new Date().toISOString(), customerId = crypto.randomUUID(), activityId = crypto.randomUUID();
    const activityBody = ["Dịch vụ quan tâm: " + lead.service, "Ngân sách: " + (lead.budget || "Chưa xác định"), "Mục tiêu: " + (lead.goals || "Chưa cung cấp")].join("\n");
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
  const customerMatch = url.pathname.match(/^\/api\/v1\/admin\/customers\/([^/]+)(?:\/(activities|members)(?:\/([^/]+))?)?$/);
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
    if (customerMatch[2] === "members") {
      if (customerMatch[3] && request.method === "DELETE") {
        let memberUserId;
        try { memberUserId = decodeURIComponent(customerMatch[3]); }
        catch { return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy thành viên." } }, 404); }
        if (!memberUserId || memberUserId.length > 128 || memberUserId.includes("/")) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy thành viên." } }, 404);
        const membership = await env.DB.prepare("SELECT membership_role FROM crm_customer_members WHERE customer_id = ? AND user_id = ? LIMIT 1").bind(customerId, memberUserId).first();
        if (!membership) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy thành viên của khách hàng." } }, 404);
        if (membership.membership_role === "owner") {
          const owners = await env.DB.prepare("SELECT COUNT(*) AS count FROM crm_customer_members WHERE customer_id = ? AND membership_role = 'owner'").bind(customerId).first();
          if ((owners?.count || 0) <= 1) return json({ error: { code: "LAST_CUSTOMER_OWNER", message: "Khách hàng phải luôn có ít nhất một chủ sở hữu." } }, 409);
        }
        const now = new Date().toISOString();
        const metadata = JSON.stringify({ user_id: memberUserId, membership_role: membership.membership_role });
        const results = await env.DB.batch([
          env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) SELECT ?, ?, 'customer.member.unlinked', 'customer', ?, ?, ? WHERE EXISTS (SELECT 1 FROM crm_customer_members WHERE customer_id = ? AND user_id = ? AND membership_role = ? AND (membership_role != 'owner' OR (SELECT COUNT(*) FROM crm_customer_members WHERE customer_id = ? AND membership_role = 'owner') > 1))").bind(crypto.randomUUID(), principal.user.id, customerId, metadata, now, customerId, memberUserId, membership.membership_role, customerId),
          env.DB.prepare("DELETE FROM crm_customer_members WHERE customer_id = ? AND user_id = ? AND membership_role = ? AND (membership_role != 'owner' OR (SELECT COUNT(*) FROM crm_customer_members WHERE customer_id = ? AND membership_role = 'owner') > 1)").bind(customerId, memberUserId, membership.membership_role, customerId)
        ]);
        if (!results?.[1]?.meta?.changes) return json({ error: { code: "MEMBERSHIP_CONFLICT", message: "Quyền thành viên vừa thay đổi. Vui lòng tải lại." } }, 409);
        return json({ data: { customer_id: customerId, user_id: memberUserId, revoked: true } });
      }
      if (customerMatch[3]) return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
      if (request.method === "GET") {
        const result = await env.DB.prepare("SELECT m.user_id, u.email, u.name, m.membership_role, m.created_at FROM crm_customer_members m INNER JOIN user u ON u.id = m.user_id WHERE m.customer_id = ? ORDER BY m.created_at ASC").bind(customerId).all();
        return json({ data: result.results || [] });
      }
      if (request.method === "POST") {
        const body = await readJson(request);
        const email = clean(body?.email, 254).toLowerCase();
        const membershipRole = clean(body?.membership_role || "member", 20);
        if (!validEmail(email) || !["owner", "member", "billing"].includes(membershipRole)) {
          return json({ error: { code: "VALIDATION_ERROR", message: "Email hoặc vai trò thành viên không hợp lệ." } }, 400);
        }
        const account = await env.DB.prepare("SELECT id, email, name FROM user WHERE lower(email) = ? LIMIT 1").bind(email).first();
        if (!account) return json({ error: { code: "USER_NOT_FOUND", message: "Chưa có tài khoản với email này. Khách hàng cần đăng ký tài khoản trước." } }, 404);
        const now = new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare("INSERT INTO crm_customer_members (customer_id, user_id, membership_role, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(customer_id, user_id) DO UPDATE SET membership_role = excluded.membership_role").bind(customerId, account.id, membershipRole, now),
          env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'customer.member.linked', 'customer', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, customerId, JSON.stringify({ user_id: account.id, email: account.email, membership_role: membershipRole }), now)
        ]);
        return json({ data: { user_id: account.id, email: account.email, name: account.name, membership_role: membershipRole } }, 201);
      }
      return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
    }
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

function validDateOnly(value) {
  if (value == null || value === "") return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = Date.parse(value + "T00:00:00Z");
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
}
const PROJECT_FILE_MAX_BYTES = 10 * 1024 * 1024;
const PROJECT_FILE_TYPES = {
  "application/pdf": { extension: "pdf", valid: bytes => bytes.length >= 5 && new TextDecoder().decode(bytes.slice(0,5)) === "%PDF-" },
  "image/png": { extension: "png", valid: bytes => bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((value,index) => bytes[index] === value) },
  "image/jpeg": { extension: "jpg", valid: bytes => bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 },
  "image/webp": { extension: "webp", valid: bytes => bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0,4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8,12)) === "WEBP" },
  "text/plain": { extension: "txt", valid: bytes => { try { return !new TextDecoder("utf-8", { fatal: true }).decode(bytes).includes("\u0000"); } catch { return false; } } },
  "text/csv": { extension: "csv", valid: bytes => { try { return !new TextDecoder("utf-8", { fatal: true }).decode(bytes).includes("\u0000"); } catch { return false; } } }
};
function projectFileRecord(row) {
  return {
    id: row.id, project_id: row.project_id, customer_id: row.customer_id,
    filename: row.filename, content_type: row.content_type, size_bytes: row.size_bytes,
    sha256: row.sha256, visibility: row.visibility,
    uploaded_role: row.uploaded_role, created_at: row.created_at
  };
}
async function uploadProjectFile(request, env, project, principal, visibility) {
  if (!env.MEDIA_BUCKET) return json({ error: { code: "FILE_STORAGE_UNAVAILABLE", message: "Kho lưu trữ tệp dự án chưa được cấu hình." } }, 503);
  const length = Number(request.headers.get("content-length") || 0);
  if (length > PROJECT_FILE_MAX_BYTES + 128 * 1024) return json({ error: { code: "UPLOAD_TOO_LARGE", message: "Tệp vượt quá giới hạn 10 MB." } }, 413);
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) return json({ error: { code: "VALIDATION_ERROR", message: "Yêu cầu tải tệp phải dùng multipart/form-data." } }, 400);
  let form;
  try { form = await request.formData(); } catch { return json({ error: { code: "INVALID_UPLOAD", message: "Không đọc được dữ liệu tệp tải lên." } }, 400); }
  const file = form.get("file");
  if (!file || typeof file.arrayBuffer !== "function" || typeof file.size !== "number") return json({ error: { code: "VALIDATION_ERROR", message: "Vui lòng chọn một tệp hợp lệ." } }, 400);
  if (file.size < 1 || file.size > PROJECT_FILE_MAX_BYTES) return json({ error: { code: "UPLOAD_TOO_LARGE", message: "Tệp phải có dung lượng từ 1 byte đến 10 MB." } }, 413);
  const mime = clean(file.type, 100).toLowerCase();
  const typeConfig = PROJECT_FILE_TYPES[mime];
  if (!typeConfig) return json({ error: { code: "UNSUPPORTED_MEDIA_TYPE", message: "Chỉ chấp nhận PDF, PNG, JPEG, WebP, TXT và CSV." } }, 415);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength !== file.size || !typeConfig.valid(bytes)) return json({ error: { code: "INVALID_FILE_SIGNATURE", message: "Nội dung tệp không khớp định dạng đã khai báo." } }, 400);
  const id = crypto.randomUUID(), now = new Date().toISOString();
  const objectKey = "projects/" + project.id + "/" + id + "." + typeConfig.extension;
  const filename = clean(String(file.name || "project-file." + typeConfig.extension).replace(/[\u0000-\u001f\\/:*?"<>|]/g, "_"), 150) || "project-file." + typeConfig.extension;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const sha256 = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
  const row = {
    id, project_id: project.id, customer_id: project.customer_id, object_key: objectKey,
    filename, content_type: mime, size_bytes: bytes.byteLength, sha256, visibility,
    uploaded_by: principal.user.id, uploaded_role: hasAnyRole(principal, ["admin"]) ? "admin" : hasAnyRole(principal, ["staff"]) ? "staff" : "customer", created_at: now
  };
  try {
    await env.MEDIA_BUCKET.put(objectKey, bytes, {
      httpMetadata: { contentType: mime, cacheControl: "private, no-store" },
      customMetadata: { fileId: id, projectId: project.id, customerId: project.customer_id, visibility }
    });
    await env.DB.batch([
      env.DB.prepare("INSERT INTO crm_project_files (id, project_id, customer_id, object_key, filename, content_type, size_bytes, sha256, visibility, uploaded_by, uploaded_role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(id, project.id, project.customer_id, objectKey, filename, mime, bytes.byteLength, sha256, visibility, principal.user.id, row.uploaded_role, now),
      env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'project.file.uploaded', 'project', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, project.id, JSON.stringify({ file_id: id, filename, content_type: mime, size_bytes: bytes.byteLength, visibility }), now)
    ]);
    return json({ data: projectFileRecord(row) }, 201);
  } catch {
    try { await env.MEDIA_BUCKET.delete(objectKey); } catch {}
    return json({ error: { code: "FILE_UPLOAD_FAILED", message: "Không thể lưu tệp dự án. Vui lòng thử lại." } }, 503);
  }
}
async function downloadProjectFile(env, row) {
  if (!env.MEDIA_BUCKET) return json({ error: { code: "FILE_STORAGE_UNAVAILABLE", message: "Kho lưu trữ tệp dự án chưa được cấu hình." } }, 503);
  const object = await env.MEDIA_BUCKET.get(row.object_key);
  if (!object) return json({ error: { code: "FILE_NOT_FOUND", message: "Không tìm thấy tệp trong kho lưu trữ." } }, 404);
  const safeFilename = row.filename.replace(/[^a-zA-Z0-9._-]/g, "_") || "project-file";
  const headers = new Headers({
    "content-type": row.content_type,
    "content-length": String(row.size_bytes),
    "content-disposition": "attachment; filename=\"" + safeFilename + "\"",
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff"
  });
  return new Response(object.body, { status: 200, headers });
}

async function createUserNotifications(env, userIds, notification) {
  const recipients = [...new Set((userIds || []).filter(id => typeof id === "string" && id.length > 0))];
  if (!recipients.length) return;
  const now = new Date().toISOString();
  const statements = recipients.map(userId => env.DB.prepare(
    "INSERT INTO crm_notifications (id, user_id, type, title, body, resource_type, resource_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(crypto.randomUUID(), userId, notification.type, notification.title, notification.body, notification.resource_type, notification.resource_id, now));
  await env.DB.batch(statements);
}
async function notifySafely(env, recipientsPromise, notification) {
  try {
    const recipients = await recipientsPromise;
    await createUserNotifications(env, recipients, notification);
  } catch (error) {
    console.error("Notification persistence failed", error?.message || "unknown");
  }
}
async function adminDashboardRoutes(request, env, url) {
  if (url.pathname !== "/api/v1/admin/dashboard") return null;
  if (request.method !== "GET") return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405, { allow: "GET" });
  const principal = await authenticatedPrincipal(request, env);
  if (principal.error) return principal.error;
  if (!hasAnyRole(principal, ["admin", "staff"])) return json({ error: { code: "FORBIDDEN", message: "Bạn không có quyền xem CRM dashboard." } }, 403);

  const [
    leads, newLeads, customers, draftQuotes, sentQuotes, acceptedQuotes,
    activeOrders, activeProjects, overdueProjects, openTickets, urgentTickets,
    leadStatuses, recentLeads, recentActivity
  ] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS count FROM leads").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM leads WHERE julianday(created_at) >= julianday('now','-7 days')").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM crm_customers WHERE status = 'active'").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM crm_quotes WHERE status = 'draft'").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM crm_quotes WHERE status = 'sent'").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM crm_quotes WHERE status = 'accepted'").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM crm_orders WHERE status NOT IN ('cancelled','completed')").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM crm_projects WHERE status IN ('planning','in_progress','review','on_hold')").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM crm_projects WHERE due_date IS NOT NULL AND due_date < date('now') AND status NOT IN ('completed','cancelled')").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM crm_tickets WHERE status IN ('open','in_progress','waiting_customer')").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM crm_tickets WHERE priority = 'urgent' AND status NOT IN ('resolved','closed')").first(),
    env.DB.prepare("SELECT status, COUNT(*) AS count FROM leads GROUP BY status ORDER BY status").all(),
    env.DB.prepare("SELECT id, name, service, status, created_at FROM leads ORDER BY created_at DESC, id DESC LIMIT 6").all(),
    env.DB.prepare("SELECT action, resource_type, resource_id, created_at FROM crm_audit_events ORDER BY created_at DESC, id DESC LIMIT 10").all()
  ]);
  const count = row => Number(row?.count || 0);
  return json({
    data: {
      kpis: {
        total_leads: count(leads), new_leads_7d: count(newLeads), active_customers: count(customers),
        draft_quotes: count(draftQuotes), sent_quotes: count(sentQuotes), accepted_quotes: count(acceptedQuotes),
        active_orders: count(activeOrders), active_projects: count(activeProjects), overdue_projects: count(overdueProjects),
        open_tickets: count(openTickets), urgent_tickets: count(urgentTickets)
      },
      lead_statuses: leadStatuses.results || [],
      recent_leads: recentLeads.results || [],
      recent_activity: recentActivity.results || []
    },
    meta: { generated_at: new Date().toISOString(), source: "crm_d1" }
  });
}

async function notificationRoutes(request, env, url) {
  if (!url.pathname.startsWith("/api/v1/me/notifications")) return null;
  const principal = await authenticatedPrincipal(request, env);
  if (principal.error) return principal.error;
  if (url.pathname === "/api/v1/me/notifications" && request.method === "GET") {
    const limit = Math.max(1, Math.min(100, Number.parseInt(url.searchParams.get("limit") || "50", 10) || 50));
    const result = await env.DB.prepare("SELECT id, type, title, body, resource_type, resource_id, read_at, created_at FROM crm_notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?").bind(principal.user.id, limit).all();
    const unread = await env.DB.prepare("SELECT COUNT(*) AS count FROM crm_notifications WHERE user_id = ? AND read_at IS NULL").bind(principal.user.id).first();
    return json({ data: result.results || [], meta: { unread_count: unread?.count || 0, limit } });
  }
  if (url.pathname === "/api/v1/me/notifications/read-all" && request.method === "POST") {
    const now = new Date().toISOString();
    const result = await env.DB.prepare("UPDATE crm_notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL").bind(now, principal.user.id).run();
    return json({ data: { marked_read: result.meta?.changes || 0, read_at: now } });
  }
  const match = url.pathname.match(/^\/api\/v1\/me\/notifications\/([^/]+)\/read$/);
  if (match && request.method === "POST") {
    let id;
    try { id = decodeURIComponent(match[1]); } catch { return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy thông báo." } }, 404); }
    if (!id || id.length > 80 || id.includes("/")) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy thông báo." } }, 404);
    const notification = await env.DB.prepare("SELECT id, type, title, body, resource_type, resource_id, read_at, created_at FROM crm_notifications WHERE id = ? AND user_id = ? LIMIT 1").bind(id, principal.user.id).first();
    if (!notification) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy thông báo." } }, 404);
    if (!notification.read_at) {
      const now = new Date().toISOString();
      await env.DB.prepare("UPDATE crm_notifications SET read_at = ? WHERE id = ? AND user_id = ? AND read_at IS NULL").bind(now, id, principal.user.id).run();
      notification.read_at = now;
    }
    return json({ data: notification });
  }
  return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
}

async function customerProjectRoutes(request, env, url) {
  const path = url.pathname;
  if (!path.startsWith("/api/v1/me/orders") && !path.startsWith("/api/v1/me/projects") && !path.startsWith("/api/v1/me/tickets")) return null;
  const principal = await authenticatedPrincipal(request, env);
  if (principal.error) return principal.error;
  if (path === "/api/v1/me/orders" && request.method === "GET") {
    const result = await env.DB.prepare(
      "SELECT o.id, o.customer_id, o.order_number, o.status, o.currency, o.total_minor, o.created_at, o.updated_at FROM crm_orders o INNER JOIN crm_customer_members m ON m.customer_id = o.customer_id WHERE m.user_id = ? ORDER BY o.created_at DESC LIMIT 100"
    ).bind(principal.user.id).all();
    return json({ data: result.results || [] });
  }
  if (path === "/api/v1/me/projects" && request.method === "GET") {
    const result = await env.DB.prepare(
      "SELECT p.id, p.customer_id, p.order_id, p.name, p.description, p.status, p.start_date, p.due_date, p.created_at, p.updated_at, (SELECT COUNT(*) FROM crm_project_milestones ms WHERE ms.project_id = p.id) AS milestone_count FROM crm_projects p INNER JOIN crm_customer_members m ON m.customer_id = p.customer_id WHERE m.user_id = ? ORDER BY p.updated_at DESC LIMIT 100"
    ).bind(principal.user.id).all();
    return json({ data: result.results || [] });
  }
  const projectMatch = path.match(/^\/api\/v1\/me\/projects\/([^/]+)(?:\/(comments|files)(?:\/([^/]+))?)?$/);
  if (projectMatch) {
    let projectId;
    try { projectId = decodeURIComponent(projectMatch[1]); }
    catch { return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy dự án." } }, 404); }
    if (!projectId || projectId.length > 80 || projectId.includes("/")) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy dự án." } }, 404);
    const project = await env.DB.prepare(
      "SELECT p.id, p.customer_id, p.order_id, p.name, p.description, p.status, p.start_date, p.due_date, p.created_at, p.updated_at FROM crm_projects p INNER JOIN crm_customer_members m ON m.customer_id = p.customer_id WHERE p.id = ? AND m.user_id = ? LIMIT 1"
    ).bind(projectId, principal.user.id).first();
    if (!project) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy dự án." } }, 404);
    if (projectMatch[2] === "files") {
      if (projectMatch[3]) {
        let fileId;
        try { fileId = decodeURIComponent(projectMatch[3]); } catch { return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy tệp." } }, 404); }
        if (!fileId || fileId.length > 80 || fileId.includes("/")) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy tệp." } }, 404);
        if (request.method !== "GET") return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
        const file = await env.DB.prepare("SELECT id, project_id, customer_id, object_key, filename, content_type, size_bytes, sha256, visibility, uploaded_by, uploaded_role, created_at FROM crm_project_files WHERE id = ? AND project_id = ? AND visibility = 'customer' LIMIT 1").bind(fileId, projectId).first();
        if (!file) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy tệp." } }, 404);
        return downloadProjectFile(env, file);
      }
      if (request.method === "GET") {
        const result = await env.DB.prepare("SELECT id, project_id, customer_id, filename, content_type, size_bytes, sha256, visibility, uploaded_by, uploaded_role, created_at FROM crm_project_files WHERE project_id = ? AND visibility = 'customer' ORDER BY created_at DESC, id DESC LIMIT 100").bind(projectId).all();
        return json({ data: (result.results || []).map(projectFileRecord) });
      }
      if (request.method === "POST") return uploadProjectFile(request, env, project, principal, "customer");
      return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
    }
    if (projectMatch[2] === "comments") {
      if (request.method === "GET") {
        const result = await env.DB.prepare("SELECT id, actor_type, body, created_at FROM crm_project_comments WHERE project_id = ? AND visibility = 'customer' ORDER BY created_at ASC LIMIT 200").bind(projectId).all();
        return json({ data: result.results || [] });
      }
      if (request.method === "POST") {
        const body = await readJson(request), message = clean(body?.body, 10000);
        if (!message) return json({ error: { code: "VALIDATION_ERROR", message: "Nội dung bình luận không được để trống." } }, 400);
        const now = new Date().toISOString(), id = crypto.randomUUID();
        const comment = { id, project_id: projectId, actor_id: principal.user.id, actor_type: "customer", visibility: "customer", body: message, created_at: now };
        await env.DB.batch([
          env.DB.prepare("INSERT INTO crm_project_comments (id, project_id, actor_id, actor_type, visibility, body, created_at) VALUES (?, ?, ?, 'customer', 'customer', ?, ?)").bind(id, projectId, principal.user.id, message, now),
          env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'project.comment.created', 'project', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, projectId, JSON.stringify({ comment_id: id }), now)
        ]);
        await notifySafely(env, env.DB.prepare("SELECT user_id FROM app_user_roles WHERE role IN ('admin','staff')").all().then(result => (result.results || []).map(row => row.user_id)), {
          type: "project_comment", title: "Trao đổi dự án mới", body: "Khách hàng vừa gửi trao đổi trong dự án.", resource_type: "project", resource_id: projectId
        });
        return json({ data: comment }, 201);
      }
      return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
    }
    if (request.method !== "GET") return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
    const milestones = await env.DB.prepare("SELECT id, title, description, status, due_date, sort_order, created_at, updated_at FROM crm_project_milestones WHERE project_id = ? ORDER BY sort_order ASC, due_date ASC, id ASC").bind(projectId).all();
    return json({ data: { ...project, milestones: milestones.results || [] } });
  }
  if (path === "/api/v1/me/tickets" && request.method === "GET") {
    const result = await env.DB.prepare("SELECT t.id, t.customer_id, t.ticket_number, t.subject, t.description, t.status, t.priority, t.created_at, t.updated_at FROM crm_tickets t INNER JOIN crm_customer_members m ON m.customer_id = t.customer_id WHERE m.user_id = ? ORDER BY t.updated_at DESC LIMIT 100").bind(principal.user.id).all();
    return json({ data: result.results || [] });
  }
  if (path === "/api/v1/me/tickets" && request.method === "POST") {
    const body = await readJson(request), customerId = clean(body?.customer_id, 80), subject = clean(body?.subject, 180), description = clean(body?.description, 10000);
    if (!customerId || subject.length < 2) return json({ error: { code: "VALIDATION_ERROR", message: "Vui lòng chọn khách hàng và nhập tiêu đề yêu cầu." } }, 400);
    const membership = await env.DB.prepare("SELECT customer_id FROM crm_customer_members WHERE customer_id = ? AND user_id = ? LIMIT 1").bind(customerId, principal.user.id).first();
    if (!membership) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy khách hàng." } }, 404);
    const now = new Date().toISOString(), id = crypto.randomUUID(), ticketNumber = "HQ-T-" + now.slice(0, 10).replace(/-/g, "") + "-" + crypto.randomUUID().slice(0, 5).toUpperCase();
    const ticket = { id, customer_id: customerId, ticket_number: ticketNumber, subject, description, status: "open", priority: "normal", created_by: principal.user.id, created_at: now, updated_at: now };
    const statements = [
      env.DB.prepare("INSERT INTO crm_tickets (id, customer_id, ticket_number, subject, description, status, priority, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'open', 'normal', ?, ?, ?)").bind(id, customerId, ticketNumber, subject, description, principal.user.id, now, now),
      env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'ticket.created', 'ticket', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, id, JSON.stringify({ customer_id: customerId, ticket_number: ticketNumber }), now)
    ];
    if (description) statements.splice(1, 0, env.DB.prepare("INSERT INTO crm_ticket_messages (id, ticket_id, actor_id, actor_type, body, created_at) VALUES (?, ?, ?, 'customer', ?, ?)").bind(crypto.randomUUID(), id, principal.user.id, description, now));
    await env.DB.batch(statements);
    await notifySafely(env, env.DB.prepare("SELECT user_id FROM app_user_roles WHERE role IN ('admin','staff')").all().then(result => (result.results || []).map(row => row.user_id)), {
      type: "ticket_created", title: "Yêu cầu hỗ trợ mới", body: "Khách hàng đã tạo yêu cầu hỗ trợ mới.", resource_type: "ticket", resource_id: id
    });
    return json({ data: ticket }, 201);
  }
  const ticketMatch = path.match(/^\/api\/v1\/me\/tickets\/([^/]+)\/messages$/);
  if (ticketMatch) {
    let ticketId;
    try { ticketId = decodeURIComponent(ticketMatch[1]); }
    catch { return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy yêu cầu hỗ trợ." } }, 404); }
    const ticket = await env.DB.prepare("SELECT t.id, t.status FROM crm_tickets t INNER JOIN crm_customer_members m ON m.customer_id = t.customer_id WHERE t.id = ? AND m.user_id = ? LIMIT 1").bind(ticketId, principal.user.id).first();
    if (!ticket) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy yêu cầu hỗ trợ." } }, 404);
    if (request.method === "GET") {
      const result = await env.DB.prepare("SELECT id, actor_type, body, created_at FROM crm_ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC LIMIT 200").bind(ticketId).all();
      return json({ data: result.results || [] });
    }
    if (request.method === "POST") {
      if (["resolved", "closed"].includes(ticket.status)) return json({ error: { code: "INVALID_STATE", message: "Yêu cầu đã đóng; vui lòng tạo yêu cầu mới." } }, 409);
      const body = await readJson(request), message = clean(body?.body, 10000);
      if (!message) return json({ error: { code: "VALIDATION_ERROR", message: "Nội dung phản hồi không được để trống." } }, 400);
      const now = new Date().toISOString(), id = crypto.randomUUID();
      await env.DB.batch([
        env.DB.prepare("INSERT INTO crm_ticket_messages (id, ticket_id, actor_id, actor_type, body, created_at) VALUES (?, ?, ?, 'customer', ?, ?)").bind(id, ticketId, principal.user.id, message, now),
        env.DB.prepare("UPDATE crm_tickets SET status = 'open', updated_at = ? WHERE id = ? AND status NOT IN ('resolved','closed')").bind(now, ticketId),
        env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'ticket.message.created', 'ticket', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, ticketId, JSON.stringify({ message_id: id, actor_type: "customer" }), now)
      ]);
      await notifySafely(env, env.DB.prepare("SELECT user_id FROM app_user_roles WHERE role IN ('admin','staff')").all().then(result => (result.results || []).map(row => row.user_id)), {
        type: "ticket_message", title: "Phản hồi hỗ trợ mới", body: "Khách hàng vừa gửi phản hồi cho yêu cầu hỗ trợ.", resource_type: "ticket", resource_id: ticketId
      });
      return json({ data: { id, ticket_id: ticketId, actor_id: principal.user.id, actor_type: "customer", body: message, created_at: now } }, 201);
    }
    return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
  }
  return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy tài nguyên." } }, 404);
}

async function adminProjectRoutes(request, env, url) {
  const path = url.pathname;
  if (!path.startsWith("/api/v1/admin/orders") && !path.startsWith("/api/v1/admin/projects") && !path.startsWith("/api/v1/admin/milestones") && !path.startsWith("/api/v1/admin/tickets")) return null;
  const principal = await authenticatedPrincipal(request, env);
  if (principal.error) return principal.error;
  if (!hasAnyRole(principal, ["admin", "staff"])) return json({ error: { code: "FORBIDDEN", message: "Bạn không có quyền quản lý dự án và hỗ trợ." } }, 403);
  const projectFilesMatch = path.match(/^\/api\/v1\/admin\/projects\/([^/]+)\/files(?:\/([^/]+))?$/);
  if (projectFilesMatch) {
    let projectId, fileId = "";
    try { projectId = decodeURIComponent(projectFilesMatch[1]); fileId = projectFilesMatch[2] ? decodeURIComponent(projectFilesMatch[2]) : ""; }
    catch { return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy dự án hoặc tệp." } }, 404); }
    if (!projectId || projectId.length > 80 || projectId.includes("/") || (fileId && (fileId.length > 80 || fileId.includes("/")))) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy dự án hoặc tệp." } }, 404);
    const project = await env.DB.prepare("SELECT id, customer_id, name FROM crm_projects WHERE id = ? LIMIT 1").bind(projectId).first();
    if (!project) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy dự án." } }, 404);
    if (fileId) {
      if (request.method !== "GET") return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
      const file = await env.DB.prepare("SELECT id, project_id, customer_id, object_key, filename, content_type, size_bytes, sha256, visibility, uploaded_by, uploaded_role, created_at FROM crm_project_files WHERE id = ? AND project_id = ? LIMIT 1").bind(fileId, projectId).first();
      if (!file) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy tệp." } }, 404);
      return downloadProjectFile(env, file);
    }
    if (request.method === "GET") {
      const result = await env.DB.prepare("SELECT id, project_id, customer_id, filename, content_type, size_bytes, sha256, visibility, uploaded_by, uploaded_role, created_at FROM crm_project_files WHERE project_id = ? ORDER BY created_at DESC, id DESC LIMIT 100").bind(projectId).all();
      return json({ data: (result.results || []).map(projectFileRecord) });
    }
    if (request.method === "POST") {
      const visibility = clean(url.searchParams.get("visibility") || "customer", 20);
      if (!["customer", "internal"].includes(visibility)) return json({ error: { code: "VALIDATION_ERROR", message: "Phạm vi hiển thị tệp không hợp lệ." } }, 400);
      return uploadProjectFile(request, env, project, principal, visibility);
    }
    return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
  }

  if (path === "/api/v1/admin/orders" && request.method === "GET") {
    const result = await env.DB.prepare("SELECT o.id, o.customer_id, c.display_name AS customer_name, o.order_number, o.status, o.currency, o.total_minor, o.quote_id, o.created_at, o.updated_at FROM crm_orders o INNER JOIN crm_customers c ON c.id = o.customer_id ORDER BY o.created_at DESC LIMIT 100").all();
    return json({ data: result.results || [] });
  }
  if (path === "/api/v1/admin/orders" && request.method === "POST") {
    const body = await readJson(request), quoteId = clean(body?.quote_id, 80);
    if (!quoteId) return json({ error: { code: "VALIDATION_ERROR", message: "Mã báo giá là bắt buộc." } }, 400);
    const existing = await env.DB.prepare("SELECT id, order_number, customer_id FROM crm_orders WHERE quote_id = ? LIMIT 1").bind(quoteId).first();
    if (existing) return json({ data: { ...existing, already_created: true } });
    const quote = await env.DB.prepare("SELECT id, customer_id, quote_number, status, currency, total_minor FROM crm_quotes WHERE id = ? LIMIT 1").bind(quoteId).first();
    if (!quote) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy báo giá." } }, 404);
    if (quote.status !== "accepted") return json({ error: { code: "INVALID_STATE", message: "Chỉ báo giá đã được khách hàng chấp nhận mới có thể tạo đơn hàng." } }, 409);
    const now = new Date().toISOString(), id = crypto.randomUUID(), orderNumber = "HQ-O-" + now.slice(0, 10).replace(/-/g, "") + "-" + crypto.randomUUID().slice(0, 5).toUpperCase();
    const order = { id, customer_id: quote.customer_id, quote_id: quote.id, order_number: orderNumber, status: "confirmed", currency: quote.currency, total_minor: quote.total_minor, created_by: principal.user.id, created_at: now, updated_at: now };
    const results = await env.DB.batch([
      env.DB.prepare("INSERT INTO crm_orders (id, customer_id, quote_id, order_number, status, currency, total_minor, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, ?)").bind(id, quote.customer_id, quote.id, orderNumber, quote.currency, quote.total_minor, principal.user.id, now, now),
      env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'order.created', 'order', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, id, JSON.stringify({ quote_id: quote.id, order_number: orderNumber }), now)
    ]);
    if (!results?.[0]?.meta?.changes) {
      const raced = await env.DB.prepare("SELECT id, order_number, customer_id FROM crm_orders WHERE quote_id = ? LIMIT 1").bind(quoteId).first();
      if (raced) return json({ data: { ...raced, already_created: true } });
      return json({ error: { code: "ORDER_CONFLICT", message: "Không thể tạo đơn hàng. Vui lòng tải lại." } }, 409);
    }
    return json({ data: order }, 201);
  }
  if (path === "/api/v1/admin/projects" && request.method === "GET") {
    const result = await env.DB.prepare("SELECT p.id, p.customer_id, c.display_name AS customer_name, p.order_id, p.name, p.description, p.status, p.start_date, p.due_date, p.created_at, p.updated_at FROM crm_projects p INNER JOIN crm_customers c ON c.id = p.customer_id ORDER BY p.updated_at DESC LIMIT 100").all();
    return json({ data: result.results || [] });
  }
  if (path === "/api/v1/admin/projects" && request.method === "POST") {
    const body = await readJson(request), customerId = clean(body?.customer_id, 80), orderId = body?.order_id ? clean(body.order_id, 80) : null;
    const name = clean(body?.name, 180), description = clean(body?.description, 10000);
    const startDate = body?.start_date == null || body.start_date === "" ? null : clean(body.start_date, 10);
    const dueDate = body?.due_date == null || body.due_date === "" ? null : clean(body.due_date, 10);
    const milestones = body?.milestones === undefined ? [] : body.milestones;
    if (!customerId || name.length < 2 || !validDateOnly(startDate) || !validDateOnly(dueDate) || (startDate && dueDate && dueDate < startDate) || !Array.isArray(milestones) || milestones.length > 50) {
      return json({ error: { code: "VALIDATION_ERROR", message: "Thông tin dự án, ngày hoặc danh sách milestone không hợp lệ." } }, 400);
    }
    const customer = await env.DB.prepare("SELECT id FROM crm_customers WHERE id = ? AND status = 'active' LIMIT 1").bind(customerId).first();
    if (!customer) return json({ error: { code: "CUSTOMER_NOT_FOUND", message: "Không tìm thấy khách hàng đang hoạt động." } }, 404);
    if (orderId) {
      const order = await env.DB.prepare("SELECT id FROM crm_orders WHERE id = ? AND customer_id = ? LIMIT 1").bind(orderId, customerId).first();
      if (!order) return json({ error: { code: "ORDER_NOT_FOUND", message: "Đơn hàng không thuộc khách hàng đã chọn." } }, 404);
    }
    const now = new Date().toISOString(), id = crypto.randomUUID();
    const project = { id, customer_id: customerId, order_id: orderId, name, description, status: "planning", start_date: startDate, due_date: dueDate, created_by: principal.user.id, created_at: now, updated_at: now };
    const statements = [env.DB.prepare("INSERT INTO crm_projects (id, customer_id, order_id, name, description, status, start_date, due_date, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'planning', ?, ?, ?, ?, ?)").bind(id, customerId, orderId, name, description, startDate, dueDate, principal.user.id, now, now)];
    const milestoneRows = [];
    for (const [index, milestone] of milestones.entries()) {
      const title = clean(milestone?.title, 180), milestoneDescription = clean(milestone?.description, 5000), milestoneDue = milestone?.due_date == null || milestone.due_date === "" ? null : clean(milestone.due_date, 10);
      if (title.length < 2 || !validDateOnly(milestoneDue)) return json({ error: { code: "VALIDATION_ERROR", message: "Tiêu đề hoặc ngày milestone không hợp lệ." } }, 400);
      const row = { id: crypto.randomUUID(), project_id: id, title, description: milestoneDescription, status: "pending", due_date: milestoneDue, sort_order: Number.isInteger(milestone.sort_order) ? Math.max(0, Math.min(100000, milestone.sort_order)) : index, created_at: now, updated_at: now };
      milestoneRows.push(row);
      statements.push(env.DB.prepare("INSERT INTO crm_project_milestones (id, project_id, title, description, status, due_date, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)").bind(row.id, id, title, milestoneDescription, milestoneDue, row.sort_order, now, now));
    }
    statements.push(env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'project.created', 'project', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, id, JSON.stringify({ customer_id: customerId, order_id: orderId, milestone_count: milestoneRows.length }), now));
    await env.DB.batch(statements);
    return json({ data: { ...project, milestones: milestoneRows } }, 201);
  }
  const projectMatch = path.match(/^\/api\/v1\/admin\/projects\/([^/]+)(?:\/(milestones))?$/);
  if (projectMatch) {
    let projectId;
    try { projectId = decodeURIComponent(projectMatch[1]); }
    catch { return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy dự án." } }, 404); }
    const project = await env.DB.prepare("SELECT id, customer_id, order_id, name, description, status, start_date, due_date, created_by, created_at, updated_at FROM crm_projects WHERE id = ? LIMIT 1").bind(projectId).first();
    if (!project) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy dự án." } }, 404);
    if (projectMatch[2] === "milestones") {
      if (request.method === "GET") {
        const result = await env.DB.prepare("SELECT id, title, description, status, due_date, sort_order, created_at, updated_at FROM crm_project_milestones WHERE project_id = ? ORDER BY sort_order ASC, due_date ASC, id ASC").bind(projectId).all();
        return json({ data: result.results || [] });
      }
      if (request.method === "POST") {
        const body = await readJson(request), title = clean(body?.title, 180), description = clean(body?.description, 5000), dueDate = body?.due_date == null || body.due_date === "" ? null : clean(body.due_date, 10);
        if (title.length < 2 || !validDateOnly(dueDate)) return json({ error: { code: "VALIDATION_ERROR", message: "Tiêu đề hoặc ngày milestone không hợp lệ." } }, 400);
        const now = new Date().toISOString(), id = crypto.randomUUID();
        const row = { id, project_id: projectId, title, description, status: "pending", due_date: dueDate, sort_order: Number.isInteger(body.sort_order) ? Math.max(0, Math.min(100000, body.sort_order)) : 0, created_at: now, updated_at: now };
        await env.DB.batch([
          env.DB.prepare("INSERT INTO crm_project_milestones (id, project_id, title, description, status, due_date, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)").bind(id, projectId, title, description, dueDate, row.sort_order, now, now),
          env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'project.milestone.created', 'project', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, projectId, JSON.stringify({ milestone_id: id }), now)
        ]);
        return json({ data: row }, 201);
      }
      return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
    }
    if (request.method === "GET") {
      const milestones = await env.DB.prepare("SELECT id, title, description, status, due_date, sort_order, created_at, updated_at FROM crm_project_milestones WHERE project_id = ? ORDER BY sort_order ASC, due_date ASC, id ASC").bind(projectId).all();
      return json({ data: { ...project, milestones: milestones.results || [] } });
    }
    if (request.method === "PATCH") {
      const body = await readJson(request), name = clean(body.name ?? project.name, 180), description = clean(body.description ?? project.description, 10000);
      const status = clean(body.status ?? project.status, 20), startDate = body.start_date === undefined ? project.start_date : body.start_date == null || body.start_date === "" ? null : clean(body.start_date, 10), dueDate = body.due_date === undefined ? project.due_date : body.due_date == null || body.due_date === "" ? null : clean(body.due_date, 10);
      if (name.length < 2 || !["planning","in_progress","review","completed","on_hold","cancelled"].includes(status) || !validDateOnly(startDate) || !validDateOnly(dueDate) || (startDate && dueDate && dueDate < startDate)) return json({ error: { code: "VALIDATION_ERROR", message: "Thông tin hoặc trạng thái dự án không hợp lệ." } }, 400);
      const now = new Date().toISOString();
      const changes = {};
      for (const [field, nextValue] of Object.entries({ name, status, start_date: startDate, due_date: dueDate })) {
        const previousValue = project[field] ?? null;
        const normalizedNext = nextValue ?? null;
        if (previousValue !== normalizedNext) changes[field] = { from: previousValue, to: normalizedNext };
      }
      await env.DB.batch([
        env.DB.prepare("UPDATE crm_projects SET name = ?, description = ?, status = ?, start_date = ?, due_date = ?, updated_at = ? WHERE id = ?").bind(name, description, status, startDate, dueDate, now, projectId),
        env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'project.updated', 'project', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, projectId, JSON.stringify({ changes }), now)
      ]);
      const updated = await env.DB.prepare("SELECT id, customer_id, order_id, name, description, status, start_date, due_date, created_by, created_at, updated_at FROM crm_projects WHERE id = ? LIMIT 1").bind(projectId).first();
      await notifySafely(env, env.DB.prepare("SELECT customer_id FROM crm_projects WHERE id = ? LIMIT 1").bind(projectId).first().then(row => row?.customer_id ? env.DB.prepare("SELECT user_id FROM crm_customer_members WHERE customer_id = ?").bind(row.customer_id).all().then(result => (result.results || []).map(member => member.user_id)) : []), {
        type: "project_updated", title: "Dự án có cập nhật", body: "Trạng thái hoặc thông tin dự án đã được cập nhật.", resource_type: "project", resource_id: projectId
      });
      return json({ data: updated });
    }
    return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
  }
  const milestoneMatch = path.match(/^\/api\/v1\/admin\/milestones\/([^/]+)$/);
  if (milestoneMatch && request.method === "PATCH") {
    let milestoneId;
    try { milestoneId = decodeURIComponent(milestoneMatch[1]); } catch { return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy milestone." } }, 404); }
    const current = await env.DB.prepare("SELECT id, project_id, title, description, status, due_date, sort_order FROM crm_project_milestones WHERE id = ? LIMIT 1").bind(milestoneId).first();
    if (!current) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy milestone." } }, 404);
    const body = await readJson(request), title = clean(body.title ?? current.title, 180), description = clean(body.description ?? current.description, 5000), status = clean(body.status ?? current.status, 20), dueDate = body.due_date === undefined ? current.due_date : body.due_date == null || body.due_date === "" ? null : clean(body.due_date, 10);
    if (title.length < 2 || !["pending","in_progress","review","approved","blocked"].includes(status) || !validDateOnly(dueDate)) return json({ error: { code: "VALIDATION_ERROR", message: "Thông tin milestone không hợp lệ." } }, 400);
    const now = new Date().toISOString();
    const changes = {};
    for (const [field, nextValue] of Object.entries({ title, status, due_date: dueDate })) {
      const previousValue = current[field] ?? null;
      const normalizedNext = nextValue ?? null;
      if (previousValue !== normalizedNext) changes[field] = { from: previousValue, to: normalizedNext };
    }
    await env.DB.batch([
      env.DB.prepare("UPDATE crm_project_milestones SET title = ?, description = ?, status = ?, due_date = ?, updated_at = ? WHERE id = ?").bind(title, description, status, dueDate, now, milestoneId),
      env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'project.milestone.updated', 'project', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, current.project_id, JSON.stringify({ milestone_id: milestoneId, changes }), now)
    ]);
    await notifySafely(env, env.DB.prepare("SELECT customer_id FROM crm_projects WHERE id = ? LIMIT 1").bind(current.project_id).first().then(row => row?.customer_id ? env.DB.prepare("SELECT user_id FROM crm_customer_members WHERE customer_id = ?").bind(row.customer_id).all().then(result => (result.results || []).map(member => member.user_id)) : []), {
      type: "milestone_updated", title: "Tiến độ dự án có cập nhật", body: "Một mốc tiến độ trong dự án đã được cập nhật.", resource_type: "project", resource_id: current.project_id
    });
    return json({ data: { ...current, title, description, status, due_date: dueDate, updated_at: now } });
  }
  if (path === "/api/v1/admin/tickets" && request.method === "GET") {
    const status = clean(url.searchParams.get("status"), 20);
    if (status && !["open","in_progress","waiting_customer","resolved","closed"].includes(status)) return json({ error: { code: "VALIDATION_ERROR", message: "Trạng thái ticket không hợp lệ." } }, 400);
    const result = status
      ? await env.DB.prepare("SELECT t.id, t.customer_id, c.display_name AS customer_name, t.ticket_number, t.subject, t.description, t.status, t.priority, t.created_at, t.updated_at FROM crm_tickets t INNER JOIN crm_customers c ON c.id = t.customer_id WHERE t.status = ? ORDER BY t.updated_at DESC LIMIT 100").bind(status).all()
      : await env.DB.prepare("SELECT t.id, t.customer_id, c.display_name AS customer_name, t.ticket_number, t.subject, t.description, t.status, t.priority, t.created_at, t.updated_at FROM crm_tickets t INNER JOIN crm_customers c ON c.id = t.customer_id ORDER BY t.updated_at DESC LIMIT 100").all();
    return json({ data: result.results || [] });
  }
  const adminTicketMatch = path.match(/^\/api\/v1\/admin\/tickets\/([^/]+)(?:\/messages)?$/);
  if (adminTicketMatch) {
    let ticketId;
    try { ticketId = decodeURIComponent(adminTicketMatch[1]); } catch { return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy ticket." } }, 404); }
    const ticket = await env.DB.prepare("SELECT id, customer_id, ticket_number, subject, description, status, priority, created_at, updated_at FROM crm_tickets WHERE id = ? LIMIT 1").bind(ticketId).first();
    if (!ticket) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy ticket." } }, 404);
    if (path.endsWith("/messages")) {
      if (request.method === "GET") {
        const result = await env.DB.prepare("SELECT id, actor_id, actor_type, body, created_at FROM crm_ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC LIMIT 200").bind(ticketId).all();
        return json({ data: result.results || [] });
      }
      if (request.method === "POST") {
        const body = await readJson(request), message = clean(body?.body, 10000);
        if (!message) return json({ error: { code: "VALIDATION_ERROR", message: "Nội dung phản hồi không được để trống." } }, 400);
        const now = new Date().toISOString(), id = crypto.randomUUID();
        await env.DB.batch([
          env.DB.prepare("INSERT INTO crm_ticket_messages (id, ticket_id, actor_id, actor_type, body, created_at) VALUES (?, ?, ?, 'staff', ?, ?)").bind(id, ticketId, principal.user.id, message, now),
          env.DB.prepare("UPDATE crm_tickets SET status = 'waiting_customer', updated_at = ? WHERE id = ?").bind(now, ticketId),
          env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'ticket.message.created', 'ticket', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, ticketId, JSON.stringify({ message_id: id, actor_type: "staff" }), now)
        ]);
        await notifySafely(env, env.DB.prepare("SELECT customer_id FROM crm_tickets WHERE id = ? LIMIT 1").bind(ticketId).first().then(row => row?.customer_id ? env.DB.prepare("SELECT user_id FROM crm_customer_members WHERE customer_id = ?").bind(row.customer_id).all().then(result => (result.results || []).map(member => member.user_id)) : []), {
          type: "ticket_reply", title: "Nhân viên đã phản hồi", body: "Bạn có phản hồi mới cho yêu cầu hỗ trợ.", resource_type: "ticket", resource_id: ticketId
        });
        return json({ data: { id, ticket_id: ticketId, actor_id: principal.user.id, actor_type: "staff", body: message, created_at: now } }, 201);
      }
      return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
    }
    if (request.method === "PATCH") {
      const body = await readJson(request), status = clean(body.status ?? ticket.status, 20), priority = clean(body.priority ?? ticket.priority, 20);
      if (!["open","in_progress","waiting_customer","resolved","closed"].includes(status) || !["low","normal","high","urgent"].includes(priority)) return json({ error: { code: "VALIDATION_ERROR", message: "Trạng thái hoặc độ ưu tiên không hợp lệ." } }, 400);
      const now = new Date().toISOString();
      const changes = {};
      if (ticket.status !== status) changes.status = { from: ticket.status, to: status };
      if (ticket.priority !== priority) changes.priority = { from: ticket.priority, to: priority };
      await env.DB.batch([
        env.DB.prepare("UPDATE crm_tickets SET status = ?, priority = ?, updated_at = ? WHERE id = ?").bind(status, priority, now, ticketId),
        env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'ticket.updated', 'ticket', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, ticketId, JSON.stringify({ changes }), now)
      ]);
      await notifySafely(env, env.DB.prepare("SELECT customer_id FROM crm_tickets WHERE id = ? LIMIT 1").bind(ticketId).first().then(row => row?.customer_id ? env.DB.prepare("SELECT user_id FROM crm_customer_members WHERE customer_id = ?").bind(row.customer_id).all().then(result => (result.results || []).map(member => member.user_id)) : []), {
        type: "ticket_updated", title: "Yêu cầu hỗ trợ được cập nhật", body: "Trạng thái hoặc mức ưu tiên của yêu cầu đã thay đổi.", resource_type: "ticket", resource_id: ticketId
      });
      return json({ data: { ...ticket, status, priority, updated_at: now } });
    }
    if (request.method === "GET") return json({ data: ticket });
    return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
  }
  return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy tài nguyên." } }, 404);
}

const CMS_RESOURCES = {
  pages: {
    table: "cms_pages", kind: "page",
    select: "id, slug, title, excerpt, content_json, seo_json, status, published_at, created_at, updated_at",
    required: ["slug", "title"]
  },
  posts: {
    table: "cms_posts", kind: "post",
    select: "id, slug, title, excerpt, body_json, seo_json, author_name, category, tags_json, status, published_at, created_at, updated_at",
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

function cmsTags(value, fallback = []) {
  if (value === undefined) return fallback;
  if (!Array.isArray(value) || value.length > 20) return null;
  return [...new Set(value.map(item => clean(item, 40).toLowerCase()).filter(Boolean))];
}

function cmsSnapshot(resource, row) {
  const snapshot = { ...row };
  for (const key of ["content_json", "body_json", "seo_json", "description_json", "tags_json"]) {
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
      const category = clean(body.category || "", 80);
      const tags = cmsTags(body.tags, []);
      if (tags === null) return json({ error: { code: "VALIDATION_ERROR", message: "Tags phải là danh sách tối đa 20 nhãn." } }, 400);
      row = { id, slug, title, excerpt, body: bodyContent, seo, author_name: author, category, tags, status: "draft", published_at: null, created_at: now, updated_at: now };
      statement = env.DB.prepare("INSERT INTO cms_posts (id, slug, title, excerpt, body_json, seo_json, author_name, category, tags_json, status, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', NULL, ?, ?)")
        .bind(id, slug, title, excerpt, JSON.stringify(bodyContent), JSON.stringify(seo), author, category, JSON.stringify(tags), now, now);
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
      const category = clean(previous.category || "", 80);
      const tags = cmsTags(previous.tags || [], []);
      if (bodyContent === null || tags === null) return json({ error: { code: "INVALID_REVISION", message: "Nội dung hoặc taxonomy bài viết trong phiên bản không hợp lệ." } }, 409);
      snapshot = { ...previous, id: resourceId, slug, title, excerpt, body: bodyContent, seo, author_name: author, category, tags, status: "draft", published_at: null, updated_at: now };
      update = env.DB.prepare("UPDATE cms_posts SET slug = ?, title = ?, excerpt = ?, body_json = ?, seo_json = ?, author_name = ?, category = ?, tags_json = ?, status = 'draft', published_at = NULL, updated_at = ? WHERE id = ?")
        .bind(slug, title, excerpt, JSON.stringify(bodyContent), JSON.stringify(seo), author, category, JSON.stringify(tags), now, resourceId);
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
      const category = body.category === undefined ? (old.category || "") : clean(body.category, 80);
      const tags = cmsTags(body.tags, old.tags || []);
      if (bodyContent === null || tags === null) return json({ error: { code: "VALIDATION_ERROR", message: "Nội dung hoặc tags bài viết không hợp lệ." } }, 400);
      snapshot = { ...old, slug, title, excerpt, body: bodyContent, seo, author_name: author, category, tags, status: "draft", published_at: null, updated_at: now };
      update = env.DB.prepare("UPDATE cms_posts SET slug = ?, title = ?, excerpt = ?, body_json = ?, seo_json = ?, author_name = ?, category = ?, tags_json = ?, status = 'draft', published_at = NULL, updated_at = ? WHERE id = ?")
        .bind(slug, title, excerpt, JSON.stringify(bodyContent), JSON.stringify(seo), author, category, JSON.stringify(tags), now, resourceId);
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

const CMS_MEDIA_MAX_BYTES = 5 * 1024 * 1024;
const CMS_IMAGE_TYPES = {
  "image/png": { extension: "png", valid: bytes => bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((value,index) => bytes[index] === value) },
  "image/jpeg": { extension: "jpg", valid: bytes => bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 },
  "image/gif": { extension: "gif", valid: bytes => bytes.length >= 6 && ["GIF87a","GIF89a"].includes(new TextDecoder().decode(bytes.slice(0,6))) },
  "image/webp": { extension: "webp", valid: bytes => bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0,4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8,12)) === "WEBP" }
};

function mediaRecord(row) {
  return {
    id: row.id, filename: row.filename, content_type: row.content_type,
    size_bytes: row.size_bytes, alt_text: row.alt_text, status: row.status,
    uploaded_by: row.uploaded_by, created_at: row.created_at, updated_at: row.updated_at,
    public_url: row.status === "published" ? "/api/v1/public/media/" + encodeURIComponent(row.id) : null
  };
}

let activeCmsMediaUploads = 0;
const CMS_MEDIA_MAX_CONCURRENT_UPLOADS = 4;

async function readRequestBodyWithinLimit(request, maxBytes) {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  // Allocate the bounded body once. Retaining chunk arrays and then flattening
  // them created a second full-size copy for every concurrent upload.
  const body = new Uint8Array(maxBytes);
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value.byteLength > maxBytes - total) {
        try { await reader.cancel(); } catch {}
        return null;
      }
      body.set(value, total);
      total += value.byteLength;
    }
  } catch (error) {
    try { await reader.cancel(); } catch {}
    throw error;
  }
  return body.subarray(0, total);
}

async function adminMedia(request, env, url) {
  const principal = await authenticatedPrincipal(request, env);
  if (principal.error) return principal.error;
  if (!hasAnyRole(principal, ["admin", "staff"])) {
    return json({ error: { code: "FORBIDDEN", message: "Bạn không có quyền quản lý thư viện media." } }, 403);
  }
  if (!env.MEDIA_BUCKET) return json({ error: { code: "MEDIA_STORAGE_UNAVAILABLE", message: "Kho lưu trữ media chưa được cấu hình." } }, 503);
  const match = url.pathname.match(/^\/api\/v1\/admin\/media(?:\/([^/]+)(?:\/(publish|archive|file))?)?$/);
  if (!match) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy media." } }, 404);
  let mediaId = "";
  try { mediaId = match[1] ? decodeURIComponent(match[1]) : ""; }
  catch { return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy media." } }, 404); }
  if (mediaId && (mediaId.length > 80 || mediaId.includes("/"))) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy media." } }, 404);
  const action = match[2] || "";
  const now = new Date().toISOString();
  if (!mediaId && request.method === "GET") {
    const status = clean(url.searchParams.get("status"), 20);
    if (status && !["draft", "published", "archived"].includes(status)) return json({ error: { code: "VALIDATION_ERROR", message: "Trạng thái media không hợp lệ." } }, 400);
    const limit = Math.max(1, Math.min(100, Number.parseInt(url.searchParams.get("limit") || "50", 10) || 50));
    const offset = Math.max(0, Math.min(10000, Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0));
    const where = status ? " WHERE status = ?" : "";
    const statement = env.DB.prepare("SELECT id, filename, content_type, size_bytes, alt_text, status, uploaded_by, created_at, updated_at FROM cms_media_assets" + where + " ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?");
    const result = status ? await statement.bind(status, limit, offset).all() : await statement.bind(limit, offset).all();
    return json({ data: (result.results || []).map(mediaRecord), meta: { limit, offset, status: status || "all" } });
  }
  if (!mediaId && request.method === "POST") {
    const length = Number(request.headers.get("content-length") || 0);
    if (length > CMS_MEDIA_MAX_BYTES + 128 * 1024) return json({ error: { code: "UPLOAD_TOO_LARGE", message: "Ảnh vượt quá giới hạn 5 MB." } }, 413);
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data")) return json({ error: { code: "VALIDATION_ERROR", message: "Yêu cầu tải ảnh phải dùng multipart/form-data." } }, 400);
    if (activeCmsMediaUploads >= CMS_MEDIA_MAX_CONCURRENT_UPLOADS) {
      return json({ error: { code: "UPLOAD_CAPACITY", message: "Máy chủ đang xử lý nhiều lượt tải ảnh. Vui lòng thử lại sau." } }, 503, { "retry-after": "2" });
    }
    activeCmsMediaUploads++;
    try {
      const boundedBody = await readRequestBodyWithinLimit(request, CMS_MEDIA_MAX_BYTES + 128 * 1024);
      if (!boundedBody) return json({ error: { code: "UPLOAD_TOO_LARGE", message: "Ảnh vượt quá giới hạn 5 MB." } }, 413);
      const boundedHeaders = new Headers(request.headers);
      boundedHeaders.delete("content-length");
      const boundedRequest = new Request(request.url, { method: "POST", headers: boundedHeaders, body: boundedBody });
      const form = await boundedRequest.formData();
      const file = form.get("file");
      if (!file || typeof file.arrayBuffer !== "function" || typeof file.size !== "number") return json({ error: { code: "VALIDATION_ERROR", message: "Vui lòng chọn một tệp ảnh." } }, 400);
      if (file.size < 1 || file.size > CMS_MEDIA_MAX_BYTES) return json({ error: { code: "UPLOAD_TOO_LARGE", message: "Ảnh phải có dung lượng từ 1 byte đến 5 MB." } }, 413);
      const mime = clean(file.type, 80).toLowerCase();
      const typeConfig = CMS_IMAGE_TYPES[mime];
      if (!typeConfig) return json({ error: { code: "UNSUPPORTED_MEDIA_TYPE", message: "Chỉ chấp nhận PNG, JPEG, GIF và WebP." } }, 415);
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (bytes.byteLength !== file.size || !typeConfig.valid(bytes)) return json({ error: { code: "INVALID_IMAGE_SIGNATURE", message: "Nội dung tệp không khớp định dạng ảnh đã khai báo." } }, 400);
      const id = crypto.randomUUID();
      const objectKey = "cms/" + id + "." + typeConfig.extension;
      const filename = clean(String(file.name || "image." + typeConfig.extension).replace(/[\\u0000-\\u001f\\/:*?"<>|]/g, "_"), 120) || "image." + typeConfig.extension;
      const altText = clean(form.get("alt_text"), 250);
      try {
        await env.MEDIA_BUCKET.put(objectKey, bytes, {
          httpMetadata: { contentType: mime, cacheControl: "public, max-age=3600" },
          customMetadata: { assetId: id, uploadedBy: principal.user.id }
        });
        const row = { id, filename, content_type: mime, size_bytes: bytes.byteLength, alt_text: altText, status: "draft", uploaded_by: principal.user.id, created_at: now, updated_at: now };
        await env.DB.batch([
          env.DB.prepare("INSERT INTO cms_media_assets (id, object_key, filename, content_type, size_bytes, alt_text, status, uploaded_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)").bind(id, objectKey, filename, mime, bytes.byteLength, altText, principal.user.id, now, now),
          env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'media.uploaded', 'media', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, id, JSON.stringify({ filename, contentType: mime, sizeBytes: bytes.byteLength }), now)
        ]);
        return json({ data: mediaRecord(row) }, 201);
      } catch {
        try { await env.MEDIA_BUCKET.delete(objectKey); } catch {}
        return json({ error: { code: "MEDIA_UPLOAD_FAILED", message: "Không thể lưu ảnh. Vui lòng thử lại." } }, 503);
      }
    } catch {
      return json({ error: { code: "INVALID_UPLOAD", message: "Không đọc được dữ liệu ảnh tải lên." } }, 400);
    } finally {
      activeCmsMediaUploads--;
    }
  }
  if (!mediaId) return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
  const row = await env.DB.prepare("SELECT id, object_key, filename, content_type, size_bytes, alt_text, status, uploaded_by, created_at, updated_at FROM cms_media_assets WHERE id = ? LIMIT 1").bind(mediaId).first();
  if (!row) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy media." } }, 404);
  if (action === "file" && request.method === "GET") {
    const object = await env.MEDIA_BUCKET.get(row.object_key);
    if (!object) return json({ error: { code: "MEDIA_OBJECT_MISSING", message: "Tệp media không còn trong kho lưu trữ." } }, 404);
    const safeFilename = row.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const headers = new Headers({
      "content-type": row.content_type,
      "content-length": String(row.size_bytes),
      "content-disposition": "inline; filename=\"" + safeFilename + "\"",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff"
    });
    return new Response(object.body, { status: 200, headers });
  }
  if (action === "publish" && request.method === "POST") {
    if (!hasAnyRole(principal, ["admin"])) return json({ error: { code: "FORBIDDEN", message: "Chỉ Admin được xuất bản media." } }, 403);
    if (row.status === "archived") return json({ error: { code: "INVALID_STATE", message: "Không thể xuất bản media đã lưu trữ." } }, 409);
    await env.DB.batch([
      env.DB.prepare("UPDATE cms_media_assets SET status = 'published', updated_at = ? WHERE id = ?").bind(now, mediaId),
      env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'media.published', 'media', ?, '{}', ?)").bind(crypto.randomUUID(), principal.user.id, mediaId, now)
    ]);
    return json({ data: mediaRecord({ ...row, status: "published", updated_at: now }) });
  }
  if (action === "archive" && request.method === "POST") {
    if (!hasAnyRole(principal, ["admin"])) return json({ error: { code: "FORBIDDEN", message: "Chỉ Admin được lưu trữ media." } }, 403);
    await env.DB.batch([
      env.DB.prepare("UPDATE cms_media_assets SET status = 'archived', updated_at = ? WHERE id = ?").bind(now, mediaId),
      env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'media.archived', 'media', ?, '{}', ?)").bind(crypto.randomUUID(), principal.user.id, mediaId, now)
    ]);
    return json({ data: mediaRecord({ ...row, status: "archived", updated_at: now }) });
  }
  if (!action && request.method === "PATCH") {
    const body = await readJson(request);
    const altText = clean(body?.alt_text, 250);
    if (!body || typeof body !== "object" || Array.isArray(body) || !Object.prototype.hasOwnProperty.call(body, "alt_text")) return json({ error: { code: "VALIDATION_ERROR", message: "Thiếu nội dung alt text." } }, 400);
    await env.DB.batch([
      env.DB.prepare("UPDATE cms_media_assets SET alt_text = ?, updated_at = ? WHERE id = ?").bind(altText, now, mediaId),
      env.DB.prepare("INSERT INTO crm_audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, 'media.alt_updated', 'media', ?, ?, ?)").bind(crypto.randomUUID(), principal.user.id, mediaId, JSON.stringify({ altText }), now)
    ]);
    return json({ data: mediaRecord({ ...row, alt_text: altText, updated_at: now }) });
  }
  if (!action && request.method === "GET") return json({ data: mediaRecord(row) });
  return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
}

async function publicMedia(request, env, url) {
  if (request.method !== "GET") return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405, { allow: "GET" });
  if (!env.DB || !env.MEDIA_BUCKET) return json({ error: { code: "SERVICE_UNAVAILABLE", message: "Kho media công khai chưa khả dụng." } }, 503);
  const id = decodeSlug(url.pathname, "/api/v1/public/media/");
  if (!id) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy media." } }, 404);
  const row = await env.DB.prepare("SELECT object_key, filename, content_type, size_bytes FROM cms_media_assets WHERE id = ? AND status = 'published' LIMIT 1").bind(id).first();
  if (!row) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy media." } }, 404);
  const object = await env.MEDIA_BUCKET.get(row.object_key);
  if (!object) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy tệp media." } }, 404);
  const safeFilename = row.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const headers = new Headers({
    "content-type": row.content_type,
    "content-length": String(row.size_bytes),
    "content-disposition": "inline; filename=\"" + safeFilename + "\"",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });
  if (object.httpEtag) headers.set("etag", object.httpEtag);
  return new Response(object.body, { status: 200, headers });
}

function templateRecord(row) {
  if (!row) return null;
  const result = { ...row };
  result.tags = parseJsonField(result.tags_json);
  result.compatibility = parseJsonField(result.compatibility_json);
  result.license_verified = result.license_verified === 1 || result.license_verified === true;
  result.preview_verified = result.preview_verified === 1 || result.preview_verified === true;
  delete result.tags_json;
  delete result.compatibility_json;
  return result;
}
function safeTemplateUrl(value) {
  const input = clean(value, 2000);
  if (!input) return "";
  try {
    const parsed = new URL(input);
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
function templateTags(value, fallback = []) {
  if (value === undefined) return fallback;
  if (!Array.isArray(value) || value.length > 20) return null;
  const tags = [...new Set(value.map(item => clean(item, 40).toLowerCase()).filter(Boolean))];
  return tags;
}
async function adminTemplates(request, env, url) {
  const principal = await authenticatedPrincipal(request, env);
  if (principal.error) return principal.error;
  if (!hasAnyRole(principal, ["admin", "staff"])) {
    return json({ error: { code: "FORBIDDEN", message: "Bạn không có quyền quản lý kho giao diện." } }, 403);
  }
  const match = url.pathname.match(/^\/api\/v1\/admin\/templates(?:\/([^/]+)(?:\/(publish|archive|revisions))?)?$/);
  if (!match) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy template." } }, 404);
  let templateId = "";
  try { templateId = match[1] ? decodeURIComponent(match[1]) : ""; }
  catch { return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy template." } }, 404); }
  if (templateId && (templateId.length > 80 || templateId.includes("/"))) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy template." } }, 404);
  const action = match[2] || "";
  const select = "id, slug, name, template_type, category, tags_json, summary, description, thumbnail_url, preview_url, version, price_minor, currency, license_key, license_verified, preview_verified, compatibility_json, status, published_at, created_at, updated_at";
  const now = new Date().toISOString();
  if (!templateId && request.method === "GET") {
    const status = clean(url.searchParams.get("status"), 20);
    const type = clean(url.searchParams.get("type"), 20);
    const category = clean(url.searchParams.get("category"), 80);
    const query = clean(url.searchParams.get("q"), 100);
    if (status && !["draft", "published", "archived"].includes(status)) return json({ error: { code: "VALIDATION_ERROR", message: "Trạng thái template không hợp lệ." } }, 400);
    if (type && !["wordpress", "html_css"].includes(type)) return json({ error: { code: "VALIDATION_ERROR", message: "Loại template không hợp lệ." } }, 400);
    const limit = Math.max(1, Math.min(100, Number.parseInt(url.searchParams.get("limit") || "50", 10) || 50));
    const offset = Math.max(0, Math.min(10000, Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0));
    const where = [], values = [];
    if (status) { where.push("status = ?"); values.push(status); }
    if (type) { where.push("template_type = ?"); values.push(type); }
    if (category) { where.push("category = ?"); values.push(category); }
    if (query) { where.push("(name LIKE ? OR summary LIKE ? OR slug LIKE ?)"); values.push("%" + query + "%", "%" + query + "%", "%" + query + "%"); }
    const sql = "SELECT " + select + " FROM cms_templates" + (where.length ? " WHERE " + where.join(" AND ") : "") + " ORDER BY updated_at DESC, slug ASC LIMIT ? OFFSET ?";
    const result = await env.DB.prepare(sql).bind(...values, limit, offset).all();
    return json({ data: (result.results || []).map(templateRecord), meta: { limit, offset, status: status || "all", type: type || "all", category: category || "all" } });
  }
  if (!templateId && request.method === "POST") {
    const body = await readJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: { code: "VALIDATION_ERROR", message: "Dữ liệu template không hợp lệ." } }, 400);
    const slug = clean(body.slug, 180), name = clean(body.name, 180), type = clean(body.template_type, 20);
    const category = clean(body.category, 80), summary = clean(body.summary, 500), description = clean(body.description, 10000);
    const version = clean(body.version || "1.0.0", 40);
    const price = body.price_minor === undefined ? 0 : body.price_minor;
    const currency = clean(body.currency || "VND", 3).toUpperCase();
    const license = clean(body.license_key || "review_required", 80);
    const tags = templateTags(body.tags);
    const compatibility = cmsObject(body.compatibility || {}, 10000);
    const previewUrl = safeTemplateUrl(body.preview_url);
    const thumbnailUrl = safeTemplateUrl(body.thumbnail_url);
    if (!validCmsSlug(slug) || name.length < 2 || !["wordpress", "html_css"].includes(type) || !Number.isSafeInteger(price) || price < 0 || !/^[A-Z]{3}$/.test(currency) || !license || !version || tags === null || compatibility === null || previewUrl === null || thumbnailUrl === null) {
      return json({ error: { code: "VALIDATION_ERROR", message: "Vui lòng kiểm tra slug, tên, loại, giá, tiền tệ, URL, tags và compatibility JSON." } }, 400);
    }
    const id = crypto.randomUUID();
    const row = { id, slug, name, template_type: type, category, tags, summary, description, thumbnail_url: thumbnailUrl || null, preview_url: previewUrl || null, version, price_minor: price, currency, license_key: license, license_verified: body.license_verified === true, preview_verified: body.preview_verified === true, compatibility, status: "draft", published_at: null, created_at: now, updated_at: now };
    const insert = env.DB.prepare("INSERT INTO cms_templates (id, slug, name, template_type, category, tags_json, summary, description, thumbnail_url, preview_url, version, price_minor, currency, license_key, license_verified, preview_verified, compatibility_json, status, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', NULL, ?, ?)")
      .bind(id, slug, name, type, category, JSON.stringify(tags), summary, description, row.thumbnail_url, row.preview_url, version, price, currency, license, row.license_verified ? 1 : 0, row.preview_verified ? 1 : 0, JSON.stringify(compatibility), now, now);
    const revision = env.DB.prepare("INSERT INTO cms_template_revisions (id, template_id, action, actor_id, snapshot_json, created_at) VALUES (?, ?, 'created', ?, ?, ?)")
      .bind(crypto.randomUUID(), id, principal.user.id, JSON.stringify(row), now);
    await env.DB.batch([insert, revision]);
    return json({ data: row }, 201);
  }
  if (!templateId) return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
  const existing = await env.DB.prepare("SELECT " + select + " FROM cms_templates WHERE id = ? LIMIT 1").bind(templateId).first();
  if (!existing) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy template." } }, 404);
  const current = templateRecord(existing);
  if (action === "revisions" && request.method === "GET") {
    const result = await env.DB.prepare("SELECT id, action, actor_id, created_at FROM cms_template_revisions WHERE template_id = ? ORDER BY created_at DESC, id DESC LIMIT 50").bind(templateId).all();
    return json({ data: result.results || [] });
  }
  if (action === "publish" && request.method === "POST") {
    if (!hasAnyRole(principal, ["admin"])) return json({ error: { code: "FORBIDDEN", message: "Chỉ Admin được xuất bản template." } }, 403);
    if (current.status === "archived") return json({ error: { code: "INVALID_STATE", message: "Template đã lưu trữ; hãy sửa và lưu lại thành bản nháp trước khi xuất bản." } }, 409);
    if (current.status === "published") return json({ data: current });
    if (!current.preview_url || !current.preview_verified || !current.license_verified || current.license_key === "review_required") {
      return json({ error: { code: "PUBLISH_REVIEW_REQUIRED", message: "Cần xác minh quyền sử dụng license và kiểm tra URL demo trước khi xuất bản." } }, 409);
    }
    const updated = { ...current, status: "published", published_at: now, updated_at: now };
    const update = env.DB.prepare("UPDATE cms_templates SET status = 'published', published_at = ?, updated_at = ? WHERE id = ? AND status != 'archived'").bind(now, now, templateId);
    const revision = env.DB.prepare("INSERT INTO cms_template_revisions (id, template_id, action, actor_id, snapshot_json, created_at) VALUES (?, ?, 'published', ?, ?, ?)")
      .bind(crypto.randomUUID(), templateId, principal.user.id, JSON.stringify(updated), now);
    await env.DB.batch([update, revision]);
    return json({ data: updated });
  }
  if (action === "archive" && request.method === "POST") {
    if (!hasAnyRole(principal, ["admin"])) return json({ error: { code: "FORBIDDEN", message: "Chỉ Admin được lưu trữ template." } }, 403);
    const updated = { ...current, status: "archived", published_at: null, updated_at: now };
    const update = env.DB.prepare("UPDATE cms_templates SET status = 'archived', published_at = NULL, updated_at = ? WHERE id = ?").bind(now, templateId);
    const revision = env.DB.prepare("INSERT INTO cms_template_revisions (id, template_id, action, actor_id, snapshot_json, created_at) VALUES (?, ?, 'archived', ?, ?, ?)")
      .bind(crypto.randomUUID(), templateId, principal.user.id, JSON.stringify(updated), now);
    await env.DB.batch([update, revision]);
    return json({ data: updated });
  }
  if (action) return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
  if (request.method === "GET") return json({ data: current });
  if (request.method === "PATCH") {
    const body = await readJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: { code: "VALIDATION_ERROR", message: "Dữ liệu template không hợp lệ." } }, 400);
    const slug = clean(body.slug ?? current.slug, 180), name = clean(body.name ?? current.name, 180), type = clean(body.template_type ?? current.template_type, 20);
    const category = clean(body.category ?? current.category, 80), summary = clean(body.summary ?? current.summary, 500), description = clean(body.description ?? current.description, 10000);
    const version = clean(body.version ?? current.version, 40), price = body.price_minor ?? current.price_minor;
    const currency = clean(body.currency ?? current.currency, 3).toUpperCase(), license = clean(body.license_key ?? current.license_key, 80);
    const tags = templateTags(body.tags, current.tags);
    const compatibility = body.compatibility === undefined ? current.compatibility : cmsObject(body.compatibility, 10000);
    const previewUrl = body.preview_url === undefined ? current.preview_url || "" : safeTemplateUrl(body.preview_url);
    const thumbnailUrl = body.thumbnail_url === undefined ? current.thumbnail_url || "" : safeTemplateUrl(body.thumbnail_url);
    const licenseVerified = body.license_verified === undefined ? current.license_verified : body.license_verified === true;
    const previewVerified = body.preview_verified === undefined ? current.preview_verified : body.preview_verified === true;
    if (!validCmsSlug(slug) || name.length < 2 || !["wordpress", "html_css"].includes(type) || !Number.isSafeInteger(price) || price < 0 || !/^[A-Z]{3}$/.test(currency) || !license || !version || tags === null || compatibility === null || previewUrl === null || thumbnailUrl === null) {
      return json({ error: { code: "VALIDATION_ERROR", message: "Vui lòng kiểm tra slug, tên, loại, giá, tiền tệ, URL, tags và compatibility JSON." } }, 400);
    }
    const updated = { ...current, slug, name, template_type: type, category, tags, summary, description, thumbnail_url: thumbnailUrl || null, preview_url: previewUrl || null, version, price_minor: price, currency, license_key: license, license_verified: licenseVerified, preview_verified: previewVerified, compatibility, status: "draft", published_at: null, updated_at: now };
    const update = env.DB.prepare("UPDATE cms_templates SET slug = ?, name = ?, template_type = ?, category = ?, tags_json = ?, summary = ?, description = ?, thumbnail_url = ?, preview_url = ?, version = ?, price_minor = ?, currency = ?, license_key = ?, license_verified = ?, preview_verified = ?, compatibility_json = ?, status = 'draft', published_at = NULL, updated_at = ? WHERE id = ?")
      .bind(slug, name, type, category, JSON.stringify(tags), summary, description, updated.thumbnail_url, updated.preview_url, version, price, currency, license, licenseVerified ? 1 : 0, previewVerified ? 1 : 0, JSON.stringify(compatibility), now, templateId);
    const revision = env.DB.prepare("INSERT INTO cms_template_revisions (id, template_id, action, actor_id, snapshot_json, created_at) VALUES (?, ?, 'updated', ?, ?, ?)")
      .bind(crypto.randomUUID(), templateId, principal.user.id, JSON.stringify(updated), now);
    await env.DB.batch([update, revision]);
    return json({ data: updated });
  }
  return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
}

async function publicContent(request, env, url) {
  if (!env.DB) return json({ error: { code: "SERVICE_UNAVAILABLE", message: "Nội dung hiện chưa khả dụng." } }, 503);
  const path = url.pathname;
  if (path.startsWith("/api/v1/public/media/")) return publicMedia(request, env, url);
  if (path.startsWith("/api/v1/public/pages/") && request.method === "GET") {
    const slug = decodeSlug(path, "/api/v1/public/pages/");
    if (!slug) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy trang." } }, 404);
    const row = await env.DB.prepare("SELECT slug, title, excerpt, content_json, seo_json, published_at FROM cms_pages WHERE slug = ? AND status = 'published' AND published_at IS NOT NULL LIMIT 1").bind(slug).first();
    if (!row) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy trang." } }, 404);
    return json({ data: contentRecord(row, "page") });
  }
  if (path === "/api/v1/public/post-categories" && request.method === "GET") {
    const result = await env.DB.prepare("SELECT category, COUNT(*) AS post_count FROM cms_posts WHERE status = 'published' AND published_at IS NOT NULL AND category <> '' GROUP BY category ORDER BY category COLLATE NOCASE ASC LIMIT 100").all();
    return json({ data: result.results || [] });
  }
  if (path === "/api/v1/public/posts" && request.method === "GET") {
    const limit = Math.max(1, Math.min(50, Number.parseInt(url.searchParams.get("limit") || "20", 10) || 20));
    const offset = Math.max(0, Math.min(10000, Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0));
    const category = clean(url.searchParams.get("category"), 80);
    const tag = clean(url.searchParams.get("tag"), 40).toLowerCase();
    const query = clean(url.searchParams.get("q"), 100);
    const where = ["status = 'published'", "published_at IS NOT NULL"], values = [];
    if (category) { where.push("category = ?"); values.push(category); }
    if (tag) { where.push("EXISTS (SELECT 1 FROM json_each(cms_posts.tags_json) WHERE value = ?)"); values.push(tag); }
    if (query) { where.push("(title LIKE ? OR excerpt LIKE ?)"); values.push("%" + query + "%", "%" + query + "%"); }
    const result = await env.DB.prepare("SELECT slug, title, excerpt, author_name, category, tags_json, published_at, seo_json FROM cms_posts WHERE " + where.join(" AND ") + " ORDER BY published_at DESC, slug ASC LIMIT ? OFFSET ?").bind(...values, limit, offset).all();
    return json({ data: (result.results || []).map(row => contentRecord(row, "post")), meta: { limit, offset, category: category || null, tag: tag || null, query: query || null } });
  }
  if (path.startsWith("/api/v1/public/posts/") && request.method === "GET") {
    const slug = decodeSlug(path, "/api/v1/public/posts/");
    if (!slug) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy bài viết." } }, 404);
    const row = await env.DB.prepare("SELECT slug, title, excerpt, body_json, seo_json, author_name, category, tags_json, published_at FROM cms_posts WHERE slug = ? AND status = 'published' AND published_at IS NOT NULL LIMIT 1").bind(slug).first();
    if (!row) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy bài viết." } }, 404);
    return json({ data: contentRecord(row, "post") });
  }
  if (path === "/api/v1/public/services" && request.method === "GET") {
    const result = await env.DB.prepare("SELECT slug, name, summary, description_json, sort_order FROM cms_services WHERE status = 'published' AND published_at IS NOT NULL ORDER BY sort_order ASC, slug ASC LIMIT 100").all();
    return json({ data: (result.results || []).map(row => contentRecord(row, "service")) });
  }
  if (path === "/api/v1/public/templates" && request.method === "GET") {
    const type = clean(url.searchParams.get("type"), 20);
    const category = clean(url.searchParams.get("category"), 80);
    const query = clean(url.searchParams.get("q"), 100);
    if (type && !["wordpress", "html_css"].includes(type)) return json({ error: { code: "VALIDATION_ERROR", message: "Loại template không hợp lệ." } }, 400);
    const limit = Math.max(1, Math.min(50, Number.parseInt(url.searchParams.get("limit") || "20", 10) || 20));
    const offset = Math.max(0, Math.min(10000, Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0));
    const where = ["status = 'published'", "published_at IS NOT NULL"], values = [];
    if (type) { where.push("template_type = ?"); values.push(type); }
    if (category) { where.push("category = ?"); values.push(category); }
    if (query) { where.push("(name LIKE ? OR summary LIKE ? OR slug LIKE ?)"); values.push("%" + query + "%", "%" + query + "%", "%" + query + "%"); }
    const sql = "SELECT slug, name, template_type, category, tags_json, summary, description, thumbnail_url, preview_url, version, price_minor, currency, license_key, compatibility_json, published_at FROM cms_templates WHERE " + where.join(" AND ") + " ORDER BY published_at DESC, slug ASC LIMIT ? OFFSET ?";
    const result = await env.DB.prepare(sql).bind(...values, limit, offset).all();
    return json({ data: (result.results || []).map(row => contentRecord(row, "template")), meta: { limit, offset } });
  }
  if (path.startsWith("/api/v1/public/templates/") && request.method === "GET") {
    const slug = decodeSlug(path, "/api/v1/public/templates/");
    if (!slug) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy template." } }, 404);
    const row = await env.DB.prepare("SELECT slug, name, template_type, category, tags_json, summary, description, thumbnail_url, preview_url, version, price_minor, currency, license_key, compatibility_json, published_at FROM cms_templates WHERE slug = ? AND status = 'published' AND published_at IS NOT NULL LIMIT 1").bind(slug).first();
    if (!row) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy template." } }, 404);
    return json({ data: contentRecord(row, "template") });
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
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, service TEXT NOT NULL, budget TEXT NOT NULL DEFAULT '', goals TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'new', assigned_to TEXT, consent_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS lead_events (id TEXT PRIMARY KEY, lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE, event_type TEXT NOT NULL, details TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS cms_pages (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, excerpt TEXT NOT NULL DEFAULT '', content_json TEXT NOT NULL DEFAULT '{}', seo_json TEXT NOT NULL DEFAULT '{}', status TEXT NOT NULL DEFAULT 'draft', published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS cms_posts (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, excerpt TEXT NOT NULL DEFAULT '', body_json TEXT NOT NULL DEFAULT '{}', seo_json TEXT NOT NULL DEFAULT '{}', author_name TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT '', tags_json TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'draft', published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_cms_posts_category_public ON cms_posts(status, category, published_at DESC, slug)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS cms_services (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, summary TEXT NOT NULL DEFAULT '', description_json TEXT NOT NULL DEFAULT '{}', sort_order INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'draft', published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS cms_templates (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, template_type TEXT NOT NULL, summary TEXT NOT NULL DEFAULT '', thumbnail_key TEXT, preview_url TEXT, price_minor INTEGER NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'VND', license_key TEXT NOT NULL DEFAULT 'review_required', compatibility_json TEXT NOT NULL DEFAULT '{}', status TEXT NOT NULL DEFAULT 'draft', published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, category TEXT NOT NULL DEFAULT '', tags_json TEXT NOT NULL DEFAULT '[]', version TEXT NOT NULL DEFAULT '1.0.0', description TEXT NOT NULL DEFAULT '', thumbnail_url TEXT, license_verified INTEGER NOT NULL DEFAULT 0, preview_verified INTEGER NOT NULL DEFAULT 0)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS cms_template_revisions (id TEXT PRIMARY KEY, template_id TEXT NOT NULL REFERENCES cms_templates(id) ON DELETE CASCADE, action TEXT NOT NULL, actor_id TEXT NOT NULL, snapshot_json TEXT NOT NULL, created_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS crm_orders (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES crm_customers(id), quote_id TEXT UNIQUE REFERENCES crm_quotes(id), order_number TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'confirmed', currency TEXT NOT NULL DEFAULT 'VND', total_minor INTEGER NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS crm_projects (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES crm_customers(id), order_id TEXT REFERENCES crm_orders(id), name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'planning', start_date TEXT, due_date TEXT, created_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS crm_project_milestones (id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES crm_projects(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'pending', due_date TEXT, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS crm_project_comments (id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES crm_projects(id) ON DELETE CASCADE, actor_id TEXT NOT NULL, actor_type TEXT NOT NULL, visibility TEXT NOT NULL DEFAULT 'customer', body TEXT NOT NULL, created_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS crm_tickets (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES crm_customers(id), ticket_number TEXT NOT NULL UNIQUE, subject TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'open', priority TEXT NOT NULL DEFAULT 'normal', created_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS crm_ticket_messages (id TEXT PRIMARY KEY, ticket_id TEXT NOT NULL REFERENCES crm_tickets(id) ON DELETE CASCADE, actor_id TEXT NOT NULL, actor_type TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS cms_revisions (id TEXT PRIMARY KEY, resource_type TEXT NOT NULL, resource_id TEXT NOT NULL, action TEXT NOT NULL, actor_id TEXT NOT NULL, snapshot_json TEXT NOT NULL, created_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS cms_media_assets (id TEXT PRIMARY KEY, object_key TEXT NOT NULL UNIQUE, filename TEXT NOT NULL, content_type TEXT NOT NULL, size_bytes INTEGER NOT NULL CHECK(size_bytes > 0), alt_text TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')), uploaded_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_cms_media_status_created ON cms_media_assets(status, created_at DESC, id)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS crm_project_files (id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES crm_projects(id) ON DELETE CASCADE, customer_id TEXT NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE, object_key TEXT NOT NULL UNIQUE, filename TEXT NOT NULL, content_type TEXT NOT NULL CHECK(content_type IN ('application/pdf','image/png','image/jpeg','image/webp','text/plain','text/csv')), size_bytes INTEGER NOT NULL CHECK(size_bytes BETWEEN 1 AND 10485760), sha256 TEXT NOT NULL, visibility TEXT NOT NULL DEFAULT 'customer' CHECK(visibility IN ('customer','internal')), uploaded_by TEXT NOT NULL, uploaded_role TEXT NOT NULL CHECK(uploaded_role IN ('admin','staff','customer')), created_at TEXT NOT NULL, archived_at TEXT)").run();
      await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_crm_project_files_project_visibility_created ON crm_project_files(project_id, visibility, created_at DESC, id)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS crm_notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, resource_type TEXT NOT NULL, resource_id TEXT NOT NULL, read_at TEXT, created_at TEXT NOT NULL)").run();
      await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_crm_notifications_user_created ON crm_notifications(user_id, created_at DESC, id)").run();
      await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_crm_notifications_user_unread ON crm_notifications(user_id, read_at, created_at DESC)").run();
      response = new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
    }
    else if (url.pathname === "/_test/audit-count" && request.method === "GET" && env.TEST_MODE === "true") {
      const result = await env.DB.prepare("SELECT COUNT(*) AS count FROM crm_audit_events WHERE action = 'quote.accepted'").first();
      response = json({ count: result?.count || 0 });
    }
    else if (url.pathname === "/_test/lead-audit" && request.method === "GET" && env.TEST_MODE === "true") {
      const leadId = clean(url.searchParams.get("lead_id"), 80);
      if (!leadId) response = json({ error: "VALIDATION_ERROR" }, 400);
      else {
        const result = await env.DB.prepare("SELECT action, metadata_json FROM crm_audit_events WHERE resource_type = 'lead' AND resource_id = ? ORDER BY created_at ASC, id ASC").bind(leadId).all();
        response = json({ data: result.results || [] });
      }
    }
    else if (url.pathname === "/_test/quote-audit-count" && request.method === "GET" && env.TEST_MODE === "true") {
      const result = await env.DB.prepare("SELECT action, COUNT(*) AS count FROM crm_audit_events WHERE resource_type = 'quote' GROUP BY action").all();
      response = json({ data: result.results || [] });
    }
    else if (url.pathname === "/_test/seed-lead" && request.method === "POST" && env.TEST_MODE === "true") {
      const body = await readJson(request), id = clean(body?.id, 80) || crypto.randomUUID();
      const name = clean(body?.name, 120), email = clean(body?.email, 254).toLowerCase(), service = clean(body?.service, 100), status = clean(body?.status || "qualified", 30);
      if (name.length < 2 || !validEmail(email) || !SERVICES.has(service) || !LEAD_STATUSES.has(status)) response = json({ error: "INVALID_TEST_LEAD" }, 400);
      else {
        const now = new Date().toISOString();
        await env.DB.prepare("INSERT INTO leads (id, name, email, service, budget, goals, status, consent_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(id, name, email, service, clean(body?.budget, 100), clean(body?.goals, 3000), status, now, now, now).run();
        response = json({ id }, 201);
      }
    }
    else if (url.pathname === "/_test/customer-audit-count" && request.method === "GET" && env.TEST_MODE === "true") {
      const result = await env.DB.prepare("SELECT action, COUNT(*) AS count FROM crm_audit_events WHERE resource_type = 'customer' GROUP BY action").all();
      response = json({ data: result.results || [] });
    }
    else if (url.pathname === "/_test/resource-audit" && request.method === "GET" && env.TEST_MODE === "true") {
      const resourceType = clean(url.searchParams.get("resource_type"), 80);
      const resourceId = clean(url.searchParams.get("resource_id"), 80);
      if (!resourceType || !resourceId) response = json({ error: "VALIDATION_ERROR" }, 400);
      else {
        const result = await env.DB.prepare("SELECT action, metadata_json, created_at FROM crm_audit_events WHERE resource_type = ? AND resource_id = ? ORDER BY created_at ASC, id ASC").bind(resourceType, resourceId).all();
        response = json({ data: result.results || [] });
      }
    }
    else if (url.pathname === "/_test/seed-identity" && request.method === "POST" && env.TEST_MODE === "true") {
      const body = await readJson(request);
      const ids = [body?.userA, body?.userB, body?.adminUser].map(value => clean(value, 128));
      const memberUser = clean(body?.memberUser, 128);
      const billingUser = clean(body?.billingUser, 128);
      const staffUser = clean(body?.staffUser, 128);
      const optionalIds = [memberUser, billingUser, staffUser].filter(Boolean);
      if (ids.some(value => !value) || new Set(ids).size !== 3 ||
          optionalIds.some(value => ids.includes(value)) || new Set(optionalIds).size !== optionalIds.length) {
        response = json({ error: "VALIDATION_ERROR" }, 400);
      } else {
        const now = new Date().toISOString();
        await env.DB.prepare("DELETE FROM crm_customer_members WHERE customer_id IN ('test-customer-a','test-customer-b')").run();
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
        if (staffUser) await env.DB.prepare("INSERT OR REPLACE INTO app_user_roles (user_id, role, assigned_by, assigned_at) VALUES (?, 'staff', 'test-fixture', ?)").bind(staffUser, now).run();
        if (memberUser) {
          await env.DB.prepare("INSERT OR REPLACE INTO crm_customer_members (customer_id, user_id, membership_role, created_at) VALUES ('test-customer-a', ?, 'member', ?)").bind(memberUser, now).run();
        }
        if (billingUser) {
          await env.DB.prepare("INSERT OR REPLACE INTO crm_customer_members (customer_id, user_id, membership_role, created_at) VALUES ('test-customer-a', ?, 'billing', ?)").bind(billingUser, now).run();
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
    else if (url.pathname.startsWith("/api/v1/me/orders") || url.pathname.startsWith("/api/v1/me/projects") || url.pathname.startsWith("/api/v1/me/tickets")) response = await customerProjectRoutes(request, env, url);
    else if (url.pathname === "/api/v1/admin/dashboard") response = await adminDashboardRoutes(request, env, url);
    else if (url.pathname.startsWith("/api/v1/me/notifications")) response = await notificationRoutes(request, env, url);
    else if (url.pathname.startsWith("/api/v1/admin/orders") || url.pathname.startsWith("/api/v1/admin/projects") || url.pathname.startsWith("/api/v1/admin/milestones") || url.pathname.startsWith("/api/v1/admin/tickets")) response = await adminProjectRoutes(request, env, url);
    else if (url.pathname === "/api/v1/admin/media" || url.pathname.startsWith("/api/v1/admin/media/")) response = await adminMedia(request, env, url);
    else if (url.pathname === "/api/v1/admin/templates" || url.pathname.startsWith("/api/v1/admin/templates/")) response = await adminTemplates(request, env, url);
    else if (url.pathname === "/api/v1/me" || url.pathname.startsWith("/api/v1/me/") || url.pathname === "/api/v1/admin/staff" || url.pathname === "/api/v1/admin/customers" || url.pathname.startsWith("/api/v1/admin/customers/") || url.pathname === "/api/v1/admin/quotes" || url.pathname.startsWith("/api/v1/admin/quotes/") || url.pathname.startsWith("/api/v1/admin/leads/")) response = await identityRoutes(request, env, url) || json({ error: { code: "NOT_FOUND", message: "Không tìm thấy tài nguyên." } }, 404);
    else if (url.pathname.startsWith("/api/v1/public/")) response = await publicContent(request, env, url) || json({ error: { code: "NOT_FOUND", message: "Không tìm thấy tài nguyên." } }, 404);
    else if (url.pathname === "/api/leads" && request.method === "POST") response = await createLead(request, env);
    else if (url.pathname === "/api/estimate" && request.method === "POST") response = await estimate(request);
    else if (url.pathname === "/api/admin/leads" || url.pathname === "/api/v1/admin/leads") response = await adminLeads(request, env, url);
    else if (url.pathname === "/api/booking" && request.method === "GET") response = env.BOOKING_URL ? json({ url: env.BOOKING_URL }) : json({ error: "BOOKING_NOT_CONFIGURED", message: "Chưa cấu hình nhà cung cấp lịch hẹn." }, 503);
    else response = json({ error: "NOT_FOUND" }, 404);
    const headers = new Headers(response.headers); for (const [key, value] of Object.entries(cors)) headers.set(key, value); return withSecurity(new Response(response.body, { status: response.status, headers }));
  } catch (error) { console.error("API request failed", error?.message || "unknown"); const known = new Set(["CONTENT_TYPE", "TOO_LARGE", "INVALID_JSON", "DB_NOT_CONFIGURED"]); if (known.has(error?.message)) { const status = error.message === "TOO_LARGE" ? 413 : error.message === "DB_NOT_CONFIGURED" ? 503 : 400; return withSecurity(json({ error: error.message, message: "Không thể xử lý yêu cầu. Vui lòng kiểm tra dữ liệu hoặc thử lại sau." }, status, cors)); } return withSecurity(json({ error: "INTERNAL_ERROR", message: "Máy chủ đang gặp sự cố. Vui lòng thử lại sau." }, 500, cors)); }
} };