import test from "node:test";
import assert from "node:assert/strict";
import {
  articleStructuredData,
  buildPublicArticleRoutes,
  isIndexableArticle,
  renderArticleBody,
  safeArticleUrl
} from "./public_articles.mjs";

function post(id, slug, locale, extra = {}) {
  return {
    id, slug, title: "Fallback title", excerpt: "Fallback excerpt",
    author_name: "Editorial Team", published_at: "2026-11-13T08:00:00.000Z", updated_at: "2026-11-13T09:00:00.000Z",
    body: { blocks: [{ type: "paragraph", text: "Useful article content." }] },
    seo: {
      locale, indexable: true,
      title: "A sufficiently unique article title",
      description: "A sufficiently descriptive summary for search results that explains the article accurately.",
      ...extra
    },
    status: "published"
  };
}

test("only published, explicitly approved, complete articles become indexable routes", () => {
  const routes = buildPublicArticleRoutes([
    post("vi-1", "seo-co-ban", "vi"),
    post("en-1", "seo-basics", "en"),
    { ...post("draft", "draft-post", "vi"), status: "draft" },
    post("no-meta", "missing-meta", "vi", { description: "" }),
    post("no-consent", "not-approved", "vi", { indexable: false }),
    post("bad-locale", "unknown-language", "fr")
  ]);
  assert.deepEqual(routes.map(route => route.path), ["/blog/seo-co-ban/", "/en/blog/seo-basics/"]);
  assert.equal(isIndexableArticle(post("ok", "valid-slug", "vi")), true);
});

test("reserved article slugs never receive clean routes", () => {
  const reserved = post("reserved-post", "post", "vi");
  assert.equal(isIndexableArticle(reserved), false);
  assert.deepEqual(buildPublicArticleRoutes([reserved]), []);
});

test("genuine translation pairs receive reciprocal hreflang and Vietnamese x-default", () => {
  const routes = buildPublicArticleRoutes([
    post("vi-1", "seo-co-ban", "vi", { translation_group_id: "article-1" }),
    post("en-1", "seo-basics", "en", { translation_group_id: "article-1" })
  ]);
  assert.deepEqual(routes[0].alternates, [
    { locale: "vi", path: "/blog/seo-co-ban/" },
    { locale: "en", path: "/en/blog/seo-basics/" },
    { locale: "x-default", path: "/blog/seo-co-ban/" }
  ]);
  assert.deepEqual(routes[1].alternates, routes[0].alternates);
});

test("incomplete translation groups do not create false language alternates", () => {
  const routes = buildPublicArticleRoutes([
    post("vi-1", "seo-co-ban", "vi", { translation_group_id: "article-1" }),
    post("en-1", "seo-basics", "en", { translation_group_id: "article-1" }),
    post("vi-2", "seo-co-ban-2", "vi", { translation_group_id: "article-1" })
  ]);
  assert.deepEqual(routes[0].alternates, [
    { locale: "vi", path: "/blog/seo-co-ban/" },
    { locale: "x-default", path: "/blog/seo-co-ban/" }
  ]);
  assert.deepEqual(routes[1].alternates, [{ locale: "en", path: "/en/blog/seo-basics/" }]);
});

test("server-rendered article HTML escapes text and rejects unsafe URLs", () => {
  const safe = renderArticleBody(post("x", "secure", "vi"), "vi");
  assert.match(safe, /Useful article content\./);
  const injected = renderArticleBody({
    ...post("x", "secure", "vi"),
    body: { blocks: [
      { type: "paragraph", text: "<script>alert(1)</script>" },
      { type: "image", src: "javascript:alert(1)", alt: "x" },
      { type: "cta", href: "//evil.example", label: "Click" }
    ] }
  }, "vi");
  assert.ok(!injected.includes("<script>"));
  assert.ok(!injected.includes("javascript:"));
  assert.ok(!injected.includes("evil.example"));
  assert.equal(safeArticleUrl("https://example.test/image.png"), "https://example.test/image.png");
  assert.equal(safeArticleUrl("data:text/html,hi"), null);
});

test("article structured data uses the clean canonical URL and approved metadata", () => {
  const article = post("vi-1", "seo-co-ban", "vi");
  const schema = articleStructuredData(article, "/blog/seo-co-ban/", "vi");
  assert.equal(schema["@type"], "Article");
  assert.equal(schema.mainEntityOfPage, "https://hoiquanweb.io.vn/blog/seo-co-ban/");
  assert.equal(schema.inLanguage, "vi");
  assert.equal(schema.headline, article.title);
  assert.equal(schema.dateModified, "2026-11-13T09:00:00.000Z");
});
