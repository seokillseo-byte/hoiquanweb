import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.js";

function makeEnv(rows = {}) {
  const calls = [];
  const DB = {
    prepare(sql) {
      calls.push(sql);
      let params = [];
      const statement = {
        bind(...values) { params = values; return statement; },
        async first() {
          if (sql.includes("FROM cms_pages")) return rows.page ?? null;
          if (sql.includes("FROM cms_posts") && sql.includes("slug = ?")) return rows.post ?? null;
          if (sql.includes("FROM cms_templates") && sql.includes("slug = ?")) return rows.template ?? null;
          return null;
        },
        async all() {
          if (sql.includes("GROUP BY category")) return { results: rows.categories ?? [] };
          if (sql.includes("FROM cms_posts")) return { results: rows.posts ?? [] };
          if (sql.includes("FROM cms_services")) return { results: rows.services ?? [] };
          if (sql.includes("FROM cms_templates")) return { results: rows.templates ?? [] };
          return { results: [] };
        },
      };
      return statement;
    },
  };
  return { env: { DB, ALLOWED_ORIGINS: "https://example.test" }, calls };
}

async function request(path, env, init = {}) {
  return worker.fetch(new Request("https://api.example.test" + path, {
    ...init,
    headers: { Origin: "https://example.test", ...(init.headers ?? {}) },
  }), env);
}

test("public page endpoint selects published page by slug", async () => {
  const { env, calls } = makeEnv({ page: { id: "p1", slug: "about", title: "About", excerpt: "", content_json: "{}", seo_json: "{}", status: "published", published_at: "2026-10-01T00:00:00.000Z" } });
  const response = await request("/api/v1/public/pages/about", env);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.slug, "about");
  assert.match(calls[0], /status = 'published'/);
  assert.match(calls[0], /published_at IS NOT NULL/);
});

test("public page endpoint returns 404 for draft or missing content", async () => {
  const { env } = makeEnv({ page: null });
  const response = await request("/api/v1/public/pages/private-draft", env);
  assert.equal(response.status, 404);
});

test("public posts list is bounded and published-only", async () => {
  const { env, calls } = makeEnv({ posts: [{ id: "post1", slug: "hello", title: "Hello", excerpt: "", body_json: "{}", seo_json: "{}", author_name: "Team", published_at: "2026-10-01T00:00:00.000Z" }] });
  const response = await request("/api/v1/public/posts?limit=999", env);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.length, 1);
  assert.deepEqual(body.data[0].seo, {});
  assert.equal("seo_json" in body.data[0], false);
  assert.equal(body.meta.limit, 50);
  assert.match(calls[0], /status = 'published'/);
  assert.match(calls[0], /LIMIT \?/);
});

test("public post listing filters by category, tag and search without exposing drafts", async () => {
  const { env, calls } = makeEnv({ posts: [{ slug: "seo-basics", title: "SEO Basics", category: "SEO", tags_json: '["technical-seo"]', seo_json: "{}" }] });
  const response = await request("/api/v1/public/posts?category=SEO&tag=technical-seo&q=Basics", env);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data[0].category, "SEO");
  assert.deepEqual(body.data[0].tags, ["technical-seo"]);
  assert.equal("tags_json" in body.data[0], false);
  assert.match(calls[0], /status = 'published'/);
  assert.match(calls[0], /EXISTS \(SELECT 1 FROM json_each\(cms_posts\.tags_json\)/);
  assert.match(calls[0], /title LIKE/);
});

test("public blog listing filters by locale and keeps legacy posts in Vietnamese", async () => {
  const { env, calls } = makeEnv({ posts: [{ slug: "seo-basics", title: "SEO Basics", seo_json: "{\"locale\":\"en\"}" }] });
  const response = await request("/api/v1/public/posts?locale=en", env);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.meta.locale, "en");
  assert.match(calls[0], /json_extract\(seo_json, '\$\.locale'\)/);
  const invalid = await request("/api/v1/public/posts?locale=fr", env);
  assert.equal(invalid.status, 400);
});

test("public category directory supports locale filtering", async () => {
  const { env, calls } = makeEnv({ categories: [{ category: "SEO", post_count: 1 }] });
  const response = await request("/api/v1/public/post-categories?locale=vi", env);
  assert.equal(response.status, 200);
  assert.match(calls[0], /json_extract\(seo_json, '\$\.locale'\)/);
  const invalid = await request("/api/v1/public/post-categories?locale=fr", env);
  assert.equal(invalid.status, 400);
});

test("public category directory includes only categories with published posts", async () => {
  const { env, calls } = makeEnv({ categories: [{ category: "SEO", post_count: 2 }] });
  const response = await request("/api/v1/public/post-categories", env);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data, [{ category: "SEO", post_count: 2 }]);
  assert.match(calls[0], /status = 'published'/);
});

test("public post detail returns 404 when no published slug exists", async () => {
  const { env } = makeEnv({ post: null });
  const response = await request("/api/v1/public/posts/not-published", env);
  assert.equal(response.status, 404);
});

test("public template listing filters by allowed type and published state", async () => {
  const { env, calls } = makeEnv({ templates: [{ id: "t1", slug: "clean", name: "Clean", template_type: "html_css", summary: "", price_minor: 0, currency: "VND", preview_url: null, compatibility_json: "{}", published_at: "2026-10-01T00:00:00.000Z" }] });
  const response = await request("/api/v1/public/templates?type=html_css", env);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data[0].template_type, "html_css");
  assert.match(calls[0], /status = 'published'/);
  assert.match(calls[0], /template_type = \?/);
});

test("invalid template type is rejected", async () => {
  const { env } = makeEnv();
  const response = await request("/api/v1/public/templates?type=php", env);
  assert.equal(response.status, 400);
});

test("unknown API path remains not found", async () => {
  const { env } = makeEnv();
  const response = await request("/api/v1/public/not-a-route", env);
  assert.equal(response.status, 404);
});

test("malformed percent-encoded page slug returns 404 instead of 500", async () => {
  const { env } = makeEnv();
  const response = await request("/api/v1/public/pages/%E0%A4%A", env);
  assert.equal(response.status, 404);
});

test("public content endpoint reports unavailable when D1 binding is missing", async () => {
  const response = await request("/api/v1/public/pages/about", { ALLOWED_ORIGINS: "https://example.test" });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, "SERVICE_UNAVAILABLE");
});

test("public post list does not expose raw JSON storage columns", async () => {
  const { env } = makeEnv({ posts: [{ slug: "hello", title: "Hello", excerpt: "", author_name: "Team", published_at: "2026-10-01T00:00:00.000Z", seo_json: "{\"title\":\"Hello SEO\"}" }] });
  const response = await request("/api/v1/public/posts", env);
  const body = await response.json();
  assert.deepEqual(body.data[0].seo, { title: "Hello SEO" });
  assert.equal("seo_json" in body.data[0], false);
});

test("public template detail returns only published catalog fields", async () => {
  const { env, calls } = makeEnv({ template: { slug: "starter", name: "Starter", template_type: "wordpress", category: "Business", tags_json: '["corporate"]', summary: "Summary", description: "Details", version: "1.0.0", price_minor: 0, currency: "VND", license_key: "single_site", compatibility_json: '{"wordpress":"6.x"}', published_at: "2026-10-01T00:00:00.000Z" } });
  const response = await request("/api/v1/public/templates/starter", env);
  assert.equal(response.status, 200);
  const body = (await response.json()).data;
  assert.deepEqual(body.tags, ["corporate"]);
  assert.deepEqual(body.compatibility, { wordpress: "6.x" });
  assert.equal("tags_json" in body, false);
  assert.match(calls[0], /status = 'published'/);
  assert.match(calls[0], /published_at IS NOT NULL/);
});

test("public template detail hides drafts and malformed slugs", async () => {
  const { env } = makeEnv({ template: null });
  const missing = await request("/api/v1/public/templates/draft-template", env);
  assert.equal(missing.status, 404);
  const malformed = await request("/api/v1/public/templates/%E0%A4%A", env);
  assert.equal(malformed.status, 404);
});
