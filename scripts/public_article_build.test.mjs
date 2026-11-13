import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";

const run = promisify(execFile);
const posts = [
  {
    id: "article-vi", slug: "seo-co-ban", title: "Kiến thức SEO cơ bản",
    excerpt: "Tổng quan về nền tảng SEO và cách xây dựng nội dung hữu ích.",
    seo: {
      locale: "vi", indexable: true, translation_group_id: "seo-basics",
      title: "Kiến thức SEO cơ bản cho website | HoiQuanWeb",
      description: "Hướng dẫn nền tảng SEO cho website, từ cấu trúc nội dung đến khả năng thu thập dữ liệu và trải nghiệm người dùng."
    }
  },
  {
    id: "article-en", slug: "seo-basics", title: "SEO Fundamentals",
    excerpt: "A practical overview of SEO foundations for websites.",
    seo: {
      locale: "en", indexable: true, translation_group_id: "seo-basics",
      title: "SEO Fundamentals for Websites | HoiQuanWeb",
      description: "A practical guide to website SEO foundations, from content structure and crawling to user experience and technical quality."
    }
  },
  {
    id: "article-reserved", slug: "post", title: "Reserved Slug Article",
    excerpt: "A published article using a slug reserved by the static route builder.",
    seo: {
      locale: "vi", indexable: true,
      title: "Reserved Slug Article for Route Fallback | HoiQuanWeb",
      description: "A valid SEO description for a published article whose slug is reserved by the static route builder."
    }
  }
];
const fullPosts = Object.fromEntries(posts.map(post => [post.slug, {
  ...post,
  author_name: "HoiQuanWeb Editorial",
  category: "SEO",
  tags: ["SEO", "Website"],
  published_at: "2026-11-10T08:00:00.000Z",
  updated_at: "2026-11-12T08:00:00.000Z",
  body: { blocks: [
    { type: "heading", level: 2, text: post.seo.locale === "en" ? "Why SEO foundations matter" : "Vì sao nền tảng SEO quan trọng" },
    { type: "paragraph", text: post.seo.locale === "en" ? "This complete article body is rendered in the initial HTML document." : "Nội dung bài viết đầy đủ được kết xuất ngay trong tài liệu HTML ban đầu." }
  ] }
}]));

test("static generator prerenders approved bilingual CMS articles and validates their sitemap", async () => {
  const server = createServer((request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    response.setHeader("content-type", "application/json; charset=utf-8");
    if (request.method !== "GET") {
      response.writeHead(405);
      response.end(JSON.stringify({ error: "method_not_allowed" }));
      return;
    }
    if (url.pathname === "/api/v1/public/posts") {
      response.writeHead(200);
      response.end(JSON.stringify({ data: posts }));
      return;
    }
    const prefix = "/api/v1/public/posts/";
    if (url.pathname.startsWith(prefix)) {
      const slug = decodeURIComponent(url.pathname.slice(prefix.length));
      if (fullPosts[slug]) {
        response.writeHead(200);
        response.end(JSON.stringify({ data: fullPosts[slug] }));
        return;
      }
    }
    response.writeHead(404);
    response.end(JSON.stringify({ error: "not_found" }));
  });

  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const env = {
    ...process.env,
    HQ_API_BASE: "http://127.0.0.1:" + address.port,
    HQ_BASE_PATH: "/hoiquanweb"
  };

  try {
    await run(process.execPath, ["scripts/build_public_site.mjs"], { env, maxBuffer: 4 * 1024 * 1024 });
    await run(process.execPath, ["scripts/validate_public_site.mjs"], { env, maxBuffer: 4 * 1024 * 1024 });

    const viHtml = await readFile("public-site/dist/blog/seo-co-ban/index.html", "utf8");
    const enHtml = await readFile("public-site/dist/en/blog/seo-basics/index.html", "utf8");
    const listingHtml = await readFile("public-site/dist/blog/index.html", "utf8");
    const enListingHtml = await readFile("public-site/dist/en/blog/index.html", "utf8");
    const siteScript = await readFile("public-site/src/site.js", "utf8");
    const sitemap = await readFile("public-site/dist/sitemap.xml", "utf8");

    assert.match(viHtml, /<meta name="robots" content="index,follow/);
    assert.match(viHtml, /<article class="blog-article">/);
    assert.match(viHtml, /Nội dung bài viết đầy đủ được kết xuất ngay/);
    assert.match(viHtml, /hreflang="vi"/);
    assert.match(viHtml, /hreflang="en"/);
    assert.match(viHtml, /hreflang="x-default"/);
    assert.match(enHtml, /<article class="blog-article">/);
    assert.match(enHtml, /This complete article body is rendered in the initial HTML document/);
    assert.match(enHtml, /hreflang="vi"/);
    assert.match(enHtml, /hreflang="en"/);
    assert.match(enHtml, /hreflang="x-default"/);
    assert.match(listingHtml, /data-base-path="\/hoiquanweb"/);
    assert.match(listingHtml, /data-clean-article-slugs="\\[&quot;seo-co-ban&quot;\\]"/);
    assert.match(enListingHtml, /data-clean-article-slugs="\\[&quot;seo-basics&quot;\\]"/);
    assert.match(siteScript, /cleanArticleSlugs\.has\(item\.slug\)/);
    assert.match(siteScript, /root\.dataset\.detailPath\+"\?slug="/);
    assert.match(sitemap, /https:\/\/hoiquanweb\.io\.vn\/blog\/seo-co-ban\//);
    assert.match(sitemap, /https:\/\/hoiquanweb\.io\.vn\/en\/blog\/seo-basics\//);
    assert.match(sitemap, /<lastmod>2026-11-12<\/lastmod>/);
    assert.doesNotMatch(sitemap, /\/blog\/post\//);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
