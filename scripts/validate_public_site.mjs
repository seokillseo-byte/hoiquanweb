import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { createServer } from "node:http";

const root = resolve(process.env.HQ_PUBLIC_SITE_ROOT || join(process.cwd(), "public-site", "dist"));
const basePath = (process.env.HQ_BASE_PATH || "").replace(/\/+$/, "");
const previewMode = process.env.HQ_VALIDATE_PREVIEW === "1";

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(path));
    else out.push(path);
  }
  return out;
}

assert.ok(await exists(join(root, "index.html")), "Vietnamese homepage must exist");
assert.ok(await exists(join(root, "en", "index.html")), "English homepage must exist");
assert.ok(await exists(join(root, "assets", "css", "site.css")), "Generated CSS must exist");
assert.ok(await exists(join(root, "assets", "js", "site.js")), "Generated JavaScript must exist");
assert.ok(await exists(join(root, "portal.html")), "Customer portal page must be generated");

for (const path of ["blog/index.html", "en/blog/index.html", "blog/post/index.html", "en/blog/post/index.html"]) {
  assert.ok(await exists(join(root, path)), "Bilingual blog route must be generated: " + path);
}

const files = (await walk(root)).filter(file => {
  const name = relative(root, file).split(sep).join("/");
  return (name === "index.html" || name.endsWith("/index.html")) && !name.startsWith("platform/");
});
assert.ok(files.length >= 30, "Expected a complete bilingual set of public pages");

const errors = [];
const canonicalPaths = new Set();
const indexablePaths = new Set();
const noindexPaths = new Set();

for (const file of files) {
  const html = await readFile(file, "utf8");
  const name = relative(root, file).split(sep).join("/");
  const pagePath = name === "index.html" ? "/" : "/" + name.replace(/index\.html$/, "");
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/);
  if (canonical) {
    const url = new URL(canonical[1]);
    canonicalPaths.add(url.pathname);
    if (url.pathname !== pagePath) errors.push(name + ": canonical does not match its route");
  }

  for (const [label, pattern] of [
    ["doctype", /^<!doctype html>/i],
    ["language", /<html lang="(vi|en)">/],
    ["title", /<title>[^<]{3,}<\/title>/],
    ["description", /<meta name="description" content="[^"]{20,}">/],
    ["canonical", /<link rel="canonical" href="https:\/\/hoiquanweb\.io\.vn\/[^"]*">/],
    ["main landmark", /<main id="main" data-cms-page="[^"]*">/],
    ["site stylesheet", /\/assets\/css\/site\.css/],
    ["site script", /\/assets\/js\/site\.js/],
    ["API base metadata in head", /<head>[\s\S]*<meta name="hq-api-base" content="[^"]*">/],
    ["CMS page slug hook", /<main id="main" data-cms-page="[^"]*">/]
  ]) if (!pattern.test(html)) errors.push(name + ": missing " + label);

  if ((html.match(/name="hq-api-base"/g) || []).length !== 1) errors.push(name + ": expected exactly one API base meta tag");

  const robots = html.match(/<meta name="robots" content="([^"]+)">/);
  if (!robots) errors.push(name + ": missing robots meta");
  else if (/^noindex(?:,|$)/i.test(robots[1])) noindexPaths.add(pagePath);
  else if (/^index(?:,|$)/i.test(robots[1])) indexablePaths.add(pagePath);
  else errors.push(name + ": robots meta must explicitly declare index or noindex");

  const alternates = [...html.matchAll(/<link rel="alternate" hreflang="(vi|en|x-default)" href="([^"]+)">/g)];
  const isArticlePath = /^\/(?:en\/)?blog\/[^/]+\/$/.test(pagePath) && !["/blog/post/", "/en/blog/post/"].includes(pagePath);
  if (!isArticlePath && alternates.length !== 3) errors.push(name + ": expected exactly three language alternates");
  if (isArticlePath && (alternates.length < 1 || alternates.length > 3)) errors.push(name + ": article must declare only genuine language alternates");
  const alternateMap = new Map(alternates.map(([, lang, href]) => [lang, href]));
  if (!isArticlePath && !["vi", "en", "x-default"].every(lang => alternateMap.has(lang))) errors.push(name + ": static bilingual route must declare vi, en and x-default alternates");
  for (const [lang, href] of alternateMap) {
    if (!href.startsWith("https://hoiquanweb.io.vn/")) errors.push(name + ": invalid " + lang + " alternate URL");
  }
  if (isArticlePath) {
    const lang = html.match(/<html lang="(vi|en)">/)?.[1];
    const selfHref = alternateMap.get(lang);
    if (!selfHref || new URL(selfHref).pathname !== pagePath) errors.push(name + ": article must declare its own language URL");
    if (lang === "vi" && new URL(alternateMap.get("x-default") || "https://hoiquanweb.io.vn/").pathname !== pagePath) errors.push(name + ": Vietnamese article x-default must point to itself");
    if (lang === "en" && alternateMap.has("x-default") && !alternateMap.has("vi")) errors.push(name + ": English article x-default requires a genuine Vietnamese translation");
    if (lang === "en" && alternateMap.has("x-default") && new URL(alternateMap.get("x-default")).pathname !== new URL(alternateMap.get("vi")).pathname) errors.push(name + ": English article x-default must point to its Vietnamese translation");
    if (!html.includes("<article class=\"blog-article\">")) errors.push(name + ": article body must exist in initial HTML");
    if (html.includes("data-blog-post")) errors.push(name + ": indexable article must not depend on client-side article loading");
    const schemaMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    try {
      const schema = schemaMatch ? JSON.parse(schemaMatch[1]) : null;
      if (schema?.["@type"] !== "Article" || schema.mainEntityOfPage !== "https://hoiquanweb.io.vn" + pagePath || schema.inLanguage !== lang) {
        errors.push(name + ": Article structured data must match the clean route and language");
      }
    } catch {
      errors.push(name + ": Article structured data must be valid JSON");
    }
  }
  if (alternateMap.has("vi") && alternateMap.has("x-default") &&
      new URL(alternateMap.get("x-default")).pathname !== new URL(alternateMap.get("vi")).pathname) {
    errors.push(name + ": x-default must point to the corresponding Vietnamese URL");
  }

  if (/REPLACE_ME|TODO|Lorem ipsum|example\.com/i.test(html)) errors.push(name + ": contains placeholder content");

  for (const [, href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (!href || href.startsWith("#") || /^(https?:|mailto:|tel:|javascript:|data:|\/\/)/i.test(href)) continue;
    const target = new URL(href, "https://hoiquanweb.io.vn" + pagePath);
    const targetPath = decodeURIComponent(target.pathname);
    if (basePath && !targetPath.startsWith(basePath + "/")) {
      errors.push(name + ": internal URL is missing the configured base path: " + href);
      continue;
    }
    const sitePath = basePath ? targetPath.slice(basePath.length) || "/" : targetPath;
    let targetFile = join(root, sitePath.replace(/^\/+/, ""));
    if (targetPath.endsWith("/")) targetFile = join(targetFile, "index.html");
    if (!(await exists(targetFile))) errors.push(name + ": broken internal link or asset " + href);
  }
}

for (const path of ["/blog/", "/en/blog/", "/blog/post/", "/en/blog/post/"]) {
  assert.ok(noindexPaths.has(path), "Client-rendered blog route must be noindex: " + path);
}

const portal = await readFile(join(root, "portal.html"), "utf8");
assert.ok(portal.includes('name="robots" content="noindex,nofollow"'), "Customer portal must not be indexed");
assert.ok(portal.includes('id="loginForm"') && portal.includes('id="quoteList"'), "Customer portal must provide login and quote views");
assert.ok(portal.includes('name="hq-api-base"'), "Customer portal must receive the configured API base");
assert.ok(!portal.includes("__HQ_API_BASE__"), "Customer portal API base placeholder must be replaced during build");
assert.ok(!portal.includes("innerHTML"), "Customer portal must render API content without raw HTML injection");

const notFound = await readFile(join(root, "404.html"), "utf8");
assert.ok(notFound.includes('name="robots" content="noindex,follow"'), "404 page must not be indexed");
assert.ok(notFound.includes('href="' + basePath + '/">Về trang chủ'), "404 page must link back to the homepage");

const sitemap = await readFile(join(root, "sitemap.xml"), "utf8");
assert.ok(sitemap.includes("https://hoiquanweb.io.vn/"), "Sitemap must use the production domain");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => new URL(url));
const sitemapPaths = sitemapUrls.map(url => url.pathname);
const sitemapPathSet = new Set(sitemapPaths);
assert.equal(sitemapPaths.length, sitemapPathSet.size, "Sitemap must not contain duplicate URLs");
assert.equal(sitemapPathSet.size, indexablePaths.size, "Sitemap must contain exactly the generated indexable public routes");

for (const url of sitemapUrls) {
  assert.equal(url.origin, "https://hoiquanweb.io.vn", "Sitemap URL must use the canonical public origin");
  assert.ok(!url.search && !url.hash, "Sitemap URL must not contain query strings or fragments");
  assert.ok(indexablePaths.has(url.pathname), "Sitemap URL must map to an explicitly indexable route: " + url.pathname);
  assert.ok(canonicalPaths.has(url.pathname), "Sitemap URL must map to a generated canonical page: " + url.pathname);
}
for (const path of indexablePaths) assert.ok(sitemapPathSet.has(path), "Indexable public route must appear in sitemap: " + path);
for (const path of noindexPaths) assert.ok(!sitemapPathSet.has(path), "Noindex route must not appear in sitemap: " + path);
for (const path of ["/blog/", "/en/blog/", "/blog/post/", "/en/blog/post/"]) {
  assert.ok(!sitemapPathSet.has(path), "Client-rendered blog route must be excluded from sitemap: " + path);
}
assert.ok(!sitemapUrls.some(url => ["/blog/", "/en/blog/", "/blog/post/", "/en/blog/post/"].includes(url.pathname)), "Blog listings and generic article shells must be excluded from sitemap");
assert.ok(!sitemapUrls.some(url => url.searchParams.has("slug")), "Query-slug article URLs must never be included in sitemap");

const robotsTxt = await readFile(join(root, "robots.txt"), "utf8");
assert.ok(robotsTxt.includes("Sitemap: https://hoiquanweb.io.vn/sitemap.xml"), "Robots file must reference the sitemap");
assert.ok(robotsTxt.includes("Disallow: " + basePath + "/admin.html"), "Robots file must disallow the admin page at the configured base path");

const css = await readFile(join(root, "assets", "css", "site.css"), "utf8");
const js = await readFile(join(root, "assets", "js", "site.js"), "utf8");
assert.ok(css.includes("#155EEF") && css.includes("#0B1F3A") && css.includes("#38BDF8"), "Brand colors must match the approved palette");
assert.ok(js.includes("/api/leads"), "Inquiry form must use the existing lead API when configured");
assert.ok(js.includes("/api/v1/public/pages/"), "Public renderer must fetch published CMS pages when configured");
assert.ok(js.includes("/api/v1/public/templates"), "Public template catalog must load published templates when configured");
assert.ok(js.includes("/api/v1/public/posts"), "Public blog must load published posts when configured");
assert.ok(js.includes("/api/v1/public/post-categories"), "Public blog must load published categories when configured");
assert.ok(js.includes("data-blog-post"), "Public blog article renderer must be present");
assert.ok(css.includes(".blog-card") && css.includes(".blog-article-header"), "Responsive blog styles must be generated");
assert.ok(js.includes('credentials:"omit"'), "Public CMS reads must not send admin session cookies");
assert.ok(!js.includes("innerHTML"), "Public CMS renderer must not inject stored content as HTML");
assert.ok(js.includes("hoiquanweb-project-brief.txt"), "Unconfigured API must not report a false successful submission");

assert.ok(noindexPaths.has("/blog/post/"), "SEO-IX-01: Vietnamese generic blog shell must be noindex");
assert.ok(noindexPaths.has("/en/blog/post/"), "SEO-IX-02: English generic blog shell must be noindex");
assert.ok(["/blog/","/en/blog/","/blog/post/","/en/blog/post/"].every(path => !sitemapPathSet.has(path)), "SEO-IX-03: generic blog shells must be excluded from sitemap");
assert.ok([...sitemapPathSet].every(path => indexablePaths.has(path) && canonicalPaths.has(path)), "SEO-IX-04: sitemap URLs must be canonical and indexable");
assert.ok(noindexPaths.size > 0 && [...noindexPaths].every(path => !sitemapPathSet.has(path)), "SEO-IX-05: non-indexable HTML may exist outside sitemap");
assert.ok(noindexPaths.has("/blog/") && noindexPaths.has("/en/blog/"), "SEO-IX-06: thin client-rendered blog listings must not be indexable");
assert.ok(!sitemapUrls.some(url => url.searchParams.has("slug") || ["/blog/post/", "/en/blog/post/"].includes(url.pathname)), "SEO-IX-07: query-slug and generic shell URLs must never be indexed");
const articleRouteFiles = files.filter(file => {
  const path = "/" + relative(root, file).split(sep).join("/").replace(/index\.html$/, "");
  return /^\/(?:en\/)?blog\/[^/]+\/$/.test(path) && !["/blog/post/", "/en/blog/post/"].includes(path);
});
for (const file of articleRouteFiles) {
  const html = await readFile(file, "utf8");
  const path = "/" + relative(root, file).split(sep).join("/").replace(/index\.html$/, "");
  assert.ok(html.includes("<article class=\"blog-article\">"), "SEO-IX-08: clean article must contain its full body in initial HTML");
  assert.ok(html.includes('"@type":"Article"'), "SEO-IX-08: clean article must include Article structured data");
  assert.ok(sitemapPathSet.has(path), "SEO-IX-08: eligible clean article must appear in sitemap");
}
for (const id of ["SEO-IX-01","SEO-IX-02","SEO-IX-03","SEO-IX-04","SEO-IX-05","SEO-IX-06","SEO-IX-07","SEO-IX-08"]) console.log("PASS " + id);

if (previewMode) {
  const rootHtml = await readFile(join(root, "index.html"), "utf8");
  assert.ok(rootHtml.includes("<title>Thiết kế Website &amp; Giải pháp Công nghệ | HoiQuanWeb</title>"), "PREV-01: Preview root must be the generated Vietnamese public homepage");
  assert.ok(rootHtml.includes('<link rel="canonical" href="https://hoiquanweb.io.vn/">'), "PREV-02: Preview root canonical must target the public homepage");
  assert.ok(rootHtml.includes('name="robots" content="index,follow,max-image-preview:large"'), "PREV-02: Preview root must remain indexable");
  assert.ok(rootHtml.includes('hreflang="vi"') && rootHtml.includes('hreflang="en"') && rootHtml.includes('hreflang="x-default"'), "PREV-02: Preview root must preserve language alternates");
  assert.ok(!rootHtml.includes("Application preview"), "PREV-01: frontend SPA must not overwrite the public homepage");

  const admin = await readFile(join(root, "admin.html"), "utf8");
  assert.ok(admin.includes('name="robots" content="noindex,nofollow"'), "PREV-04: admin entrypoint must remain noindex");
  assert.ok(!sitemapPathSet.has("/admin.html"), "PREV-06: admin entrypoint must not appear in sitemap");
  assert.ok(await exists(join(root, "en", "index.html")) && await exists(join(root, "en", "about", "index.html")) && await exists(join(root, "gioi-thieu", "index.html")), "PREV-03: English homepage and representative bilingual deep routes must exist");

  const platformIndexPath = join(root, "platform", "index.html");
  assert.ok(await exists(platformIndexPath), "PREV-04: isolated platform preview entrypoint must exist at /platform/");
  const platformHtml = await readFile(platformIndexPath, "utf8");
  assert.ok(platformHtml.includes('name="robots" content="noindex,nofollow"'), "PREV-04: platform preview must remain noindex");
  assert.ok(platformHtml.includes("Application preview"), "PREV-04: platform entrypoint must be the frontend SPA");
  const platformAssets = [...platformHtml.matchAll(/(?:src|href)="(\/platform\/[^"]+)"/g)].map(([, href]) => href);
  assert.ok(platformAssets.length > 0, "PREV-04: platform entrypoint must reference built assets under /platform/");
  for (const href of platformAssets) {
    const assetPath = new URL(href, "https://hoiquanweb.io.vn").pathname.replace(/^\/+/, "");
    assert.ok(await exists(join(root, assetPath)), "PREV-04: platform asset must exist in final Preview artifact: " + href);
  }

  // Exercise the assembled artifact over HTTP, including repeat requests to
  // representative deep routes to simulate direct navigation and refresh.
  const previewServer = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url || "/", "http://127.0.0.1").pathname);
      let filePath = join(root, pathname.replace(/^\/+/, ""));
      if (pathname.endsWith("/")) filePath = join(filePath, "index.html");
      if (!(await exists(filePath))) {
        response.statusCode = 404;
        response.end("Not Found");
        return;
      }
      response.statusCode = 200;
      response.end(await readFile(filePath));
    } catch {
      response.statusCode = 500;
      response.end("Preview smoke server error");
    }
  });
  await new Promise((resolveListen, rejectListen) => {
    previewServer.once("error", rejectListen);
    previewServer.listen(0, "127.0.0.1", resolveListen);
  });
  const address = previewServer.address();
  assert.ok(address && typeof address === "object", "Preview smoke server must bind an ephemeral port");
  const previewOrigin = "http://127.0.0.1:" + address.port;
  try {
    for (const route of ["/", "/en/", "/gioi-thieu/", "/en/about/"]) {
      for (const attempt of [1, 2]) {
        const response = await fetch(previewOrigin + route);
        assert.equal(response.status, 200, "PREV-03: direct load/refresh must return 200 for " + route);
        const html = await response.text();
        assert.ok(html.startsWith("<!doctype html>"), "PREV-03: route must return a complete HTML document: " + route);
      }
    }
    for (const route of ["/admin.html", "/portal.html", "/platform/"]) {
      const response = await fetch(previewOrigin + route);
      assert.equal(response.status, 200, "PREV-04: verified entrypoint must load: " + route);
    }
    for (const href of platformAssets) {
      const response = await fetch(previewOrigin + href);
      assert.equal(response.status, 200, "PREV-04: built application asset must load: " + href);
    }
  } finally {
    await new Promise((resolveClose, rejectClose) => previewServer.close(error => error ? rejectClose(error) : resolveClose()));
  }

  assert.ok(!sitemapPathSet.has("/portal.html") && !sitemapPathSet.has("/platform/"), "PREV-05: non-public entrypoints must not appear in sitemap");
  assert.ok(robotsTxt.includes("Disallow: " + basePath + "/admin.html"), "PREV-05: final robots.txt must preserve admin crawl exclusion");
  assert.ok(portal.includes('name="robots" content="noindex,nofollow"'), "PREV-06: portal entrypoint must remain noindex");
  assert.ok(admin.includes('name="robots" content="noindex,nofollow"'), "PREV-06: admin entrypoint must remain noindex");
  assert.ok(platformHtml.includes('name="robots" content="noindex,nofollow"'), "PREV-06: app preview must remain noindex");
  for (const id of ["PREV-01","PREV-02","PREV-03","PREV-04","PREV-05","PREV-06"]) console.log("PASS " + id);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("Public site validation passed: " + files.length + " public routes, " + indexablePaths.size + " indexable routes, " + noindexPaths.size + " noindex routes.");
