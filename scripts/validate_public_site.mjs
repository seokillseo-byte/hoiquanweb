import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const root = join(process.cwd(), "public-site", "dist");
const basePath = (process.env.HQ_BASE_PATH || "").replace(/\/+$/, "");
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

const files = (await walk(root)).filter(path => path.endsWith(".html") && !path.endsWith("404.html"));
assert.ok(files.length >= 30, "Expected a complete bilingual set of public pages");
const errors = [];
const canonicalPaths = new Set();

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
    ["Vietnamese hreflang", /hreflang="vi"/],
    ["English hreflang", /hreflang="en"/],
    ["x-default hreflang", /hreflang="x-default"/],
    ["main landmark", /<main id="main">/],
    ["site stylesheet", /\/assets\/css\/site\.css/],
    ["site script", /\/assets\/js\/site\.js/],
    ["API base metadata in head", /<head>[\s\S]*<meta name="hq-api-base" content="">/]
  ]) {
    if (!pattern.test(html)) errors.push(name + ": missing " + label);
  }

  const alternates = [...html.matchAll(/<link rel="alternate" hreflang="(vi|en|x-default)" href="([^"]+)">/g)];
  if (alternates.length !== 3) errors.push(name + ": expected exactly three language alternates");
  for (const [, lang, href] of alternates) {
    if (!href.startsWith("https://hoiquanweb.io.vn/")) errors.push(name + ": invalid " + lang + " alternate URL");
  }

  if (/REPLACE_ME|TODO|Lorem ipsum|example\.com/i.test(html)) {
    errors.push(name + ": contains placeholder content");
  }

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

const notFound = await readFile(join(root, "404.html"), "utf8");
assert.ok(notFound.includes('name="robots" content="noindex,follow"'), "404 page must not be indexed");
assert.ok(notFound.includes('href="' + basePath + '/">Về trang chủ'), "404 page must link back to the homepage");

const sitemap = await readFile(join(root, "sitemap.xml"), "utf8");
assert.ok(sitemap.includes("https://hoiquanweb.io.vn/"), "Sitemap must use the production domain");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => new URL(url).pathname);
assert.equal(sitemapUrls.length, files.length, "Sitemap must include every generated content page exactly once");
assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, "Sitemap must not contain duplicate URLs");
assert.equal(canonicalPaths.size, files.length, "Every generated page must have a unique canonical URL");
for (const path of sitemapUrls) {
  assert.ok(canonicalPaths.has(path), "Sitemap URL must map to a generated canonical page: " + path);
}

const robots = await readFile(join(root, "robots.txt"), "utf8");
assert.ok(robots.includes("Sitemap: https://hoiquanweb.io.vn/sitemap.xml"), "Robots file must reference the sitemap");
assert.ok(robots.includes("Disallow: " + basePath + "/admin.html"), "Robots file must disallow the admin page at the configured base path");

const css = await readFile(join(root, "assets", "css", "site.css"), "utf8");
const js = await readFile(join(root, "assets", "js", "site.js"), "utf8");
assert.ok(css.includes("#155EEF") && css.includes("#0B1F3A") && css.includes("#38BDF8"), "Brand colors must match the approved palette");
assert.ok(js.includes("/api/leads"), "Inquiry form must use the existing lead API when configured");
assert.ok(js.includes("hoiquanweb-project-brief.txt"), "Unconfigured API must not report a false successful submission");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("Public site validation passed: " + files.length + " pages, internal links/assets, localized metadata, canonical sitemap, brand tokens and inquiry fallback.");
