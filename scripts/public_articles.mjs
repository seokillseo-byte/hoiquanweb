const PUBLIC_ORIGIN = "https://hoiquanweb.io.vn";
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_SLUGS = new Set(["post", "index", "category", "tag", "search", "page", "feed", "amp"]);

export function escapeArticleHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

export function safeArticleUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const raw = value.trim();
  if (/[\u0000-\u001f\\]/.test(raw) || raw.startsWith("//")) return null;
  if (raw.startsWith("/") || raw.startsWith("#")) return raw;
  try {
    const parsed = new URL(raw);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

export function renderArticleBlocks(body) {
  const blocks = Array.isArray(body?.blocks) ? body.blocks : [];
  const output = [];
  for (const block of blocks.slice(0, 300)) {
    if (!block || typeof block !== "object") continue;
    if (block.type === "heading") {
      const level = Math.max(2, Math.min(4, Number.parseInt(block.level, 10) || 2));
      const value = escapeArticleHtml(block.text);
      if (value) output.push("<h" + level + ">" + value + "</h" + level + ">");
    } else if (block.type === "paragraph") {
      const value = escapeArticleHtml(block.text);
      if (value) output.push("<p>" + value + "</p>");
    } else if (block.type === "list" && Array.isArray(block.items)) {
      const tag = block.ordered === true ? "ol" : "ul";
      const items = block.items.slice(0, 100).map(item => "<li>" + escapeArticleHtml(item) + "</li>").join("");
      if (items) output.push("<" + tag + ">" + items + "</" + tag + ">");
    } else if (block.type === "quote") {
      const quote = escapeArticleHtml(block.text);
      if (quote) output.push("<blockquote><p>" + quote + "</p>" + (block.author ? "<cite>" + escapeArticleHtml(block.author) + "</cite>" : "") + "</blockquote>");
    } else if (block.type === "image") {
      const src = safeArticleUrl(block.src);
      if (!src) continue;
      output.push("<figure><img src=\"" + escapeArticleHtml(src) + "\" alt=\"" + escapeArticleHtml(block.alt) + "\" loading=\"lazy\" decoding=\"async\">" + (block.caption ? "<figcaption>" + escapeArticleHtml(block.caption) + "</figcaption>" : "") + "</figure>");
    } else if (block.type === "cta") {
      const href = safeArticleUrl(block.href);
      if (!href) continue;
      const external = /^https?:\/\//i.test(href) && new URL(href, PUBLIC_ORIGIN).origin !== PUBLIC_ORIGIN;
      output.push("<p class=\"cms-cta\"><a class=\"button button-primary\" href=\"" + escapeArticleHtml(href) + "\"" + (external ? " target=\"_blank\" rel=\"noopener noreferrer\"" : "") + ">" + escapeArticleHtml(block.label || "Tìm hiểu thêm") + "</a></p>");
    } else if (block.type === "faq" && Array.isArray(block.items)) {
      const items = block.items.slice(0, 50).map(item => "<details class=\"faq-item\"><summary>" + escapeArticleHtml(item?.question) + "</summary><p>" + escapeArticleHtml(item?.answer) + "</p></details>").join("");
      if (items) output.push("<section class=\"cms-faq\">" + items + "</section>");
    } else if (block.type === "divider") {
      output.push("<hr>");
    }
  }
  return output.join("");
}

function isReadyPost(post) {
  const seo = post?.seo && typeof post.seo === "object" && !Array.isArray(post.seo) ? post.seo : {};
  const locale = seo.locale;
  const slug = typeof post?.slug === "string" ? post.slug : "";
  const title = typeof seo.title === "string" ? seo.title.trim() : "";
  const description = typeof seo.description === "string" ? seo.description.trim() : "";
  const content = renderArticleBlocks(post?.body);
  return post?.status !== "draft" &&
    seo.indexable === true &&
    (locale === "vi" || locale === "en") &&
    SAFE_SLUG.test(slug) && slug.length <= 180 &&
    !RESERVED_SLUGS.has(slug) &&
    title.length >= 10 && title.length <= 240 &&
    description.length >= 50 && description.length <= 320 &&
    content.length > 0;
}

export function buildPublicArticleRoutes(posts) {
  const candidates = (Array.isArray(posts) ? posts : []).filter(isReadyPost);
  const groups = new Map();
  for (const post of candidates) {
    const group = typeof post.seo?.translation_group_id === "string" ? post.seo.translation_group_id.trim() : "";
    if (!group || group.length > 100) continue;
    const entries = groups.get(group) || [];
    entries.push(post);
    groups.set(group, entries);
  }
  const routes = candidates.map(post => {
    const locale = post.seo.locale;
    const path = locale === "vi" ? "/blog/" + post.slug + "/" : "/en/blog/" + post.slug + "/";
    return { post, locale, path, alternates: [{ locale, path }] };
  });
  const byPostId = new Map(routes.map(route => [route.post.id || route.post.slug, route]));
  for (const entries of groups.values()) {
    const vi = entries.filter(post => post.seo.locale === "vi");
    const en = entries.filter(post => post.seo.locale === "en");
    if (vi.length !== 1 || en.length !== 1) continue;
    const viRoute = byPostId.get(vi[0].id || vi[0].slug);
    const enRoute = byPostId.get(en[0].id || en[0].slug);
    if (!viRoute || !enRoute) continue;
    const alternates = [
      { locale: "vi", path: viRoute.path },
      { locale: "en", path: enRoute.path },
      { locale: "x-default", path: viRoute.path }
    ];
    viRoute.alternates = alternates;
    enRoute.alternates = alternates;
  }
  for (const route of routes) {
    if (route.locale === "vi" && route.alternates.length === 1) {
      route.alternates.push({ locale: "x-default", path: route.path });
    }
  }
  return routes;
}

export function renderArticleBody(post, locale) {
  const vi = locale === "vi";
  const seo = post?.seo || {};
  const title = escapeArticleHtml(post?.title || seo.title || "");
  const excerpt = escapeArticleHtml(seo.description || post?.excerpt || "");
  const author = escapeArticleHtml(post?.author_name || "HoiQuanWeb");
  const category = escapeArticleHtml(post?.category || "");
  const publishedAt = typeof post?.published_at === "string" ? post.published_at : "";
  const date = Number.isFinite(Date.parse(publishedAt)) ? new Date(publishedAt).toISOString() : "";
  const tags = Array.isArray(post?.tags) ? post.tags.slice(0, 20) : [];
  const meta = [
    category ? "<span class=\"blog-category\">" + category + "</span>" : "",
    date ? "<time class=\"blog-date\" datetime=\"" + escapeArticleHtml(date) + "\">" + escapeArticleHtml(new Intl.DateTimeFormat(vi ? "vi-VN" : "en-US", { year: "numeric", month: "long", day: "numeric" }).format(new Date(date))) + "</time>" : ""
  ].filter(Boolean).join("");
  const tagsHtml = tags.length ? "<ul class=\"blog-tags blog-article-tags\">" + tags.map(tag => "<li>" + escapeArticleHtml(tag) + "</li>").join("") + "</ul>" : "";
  const body = renderArticleBlocks(post?.body);
  return "<article class=\"blog-article\"><header class=\"blog-article-header\"><div class=\"blog-card-meta\">" + meta + "</div><h1>" + title + "</h1>" + (excerpt ? "<p class=\"blog-excerpt\">" + excerpt + "</p>" : "") + "<p class=\"blog-author\">" + (vi ? "Tác giả" : "By") + " " + author + "</p></header><div class=\"cms-rendered blog-article-content\">" + body + "</div>" + tagsHtml + "<p><a class=\"blog-back\" href=\"" + (vi ? "/blog/" : "/en/blog/") + "\">" + (vi ? "← Quay lại kiến thức" : "← Back to insights") + "</a></p></article>";
}

export function articleStructuredData(post, path, locale) {
  const author = typeof post?.author_name === "string" && post.author_name.trim()
    ? { "@type": "Person", name: post.author_name.trim() }
    : { "@type": "Organization", name: "HoiQuanWeb" };
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seo.description,
    inLanguage: locale,
    author,
    publisher: { "@type": "Organization", name: "HoiQuanWeb", url: PUBLIC_ORIGIN },
    mainEntityOfPage: PUBLIC_ORIGIN + path
  };
  if (typeof post.published_at === "string" && Number.isFinite(Date.parse(post.published_at))) data.datePublished = new Date(post.published_at).toISOString();
  if (typeof post.updated_at === "string" && Number.isFinite(Date.parse(post.updated_at))) data.dateModified = new Date(post.updated_at).toISOString();
  return data;
}

export function isIndexableArticle(post) {
  return isReadyPost(post);
}
