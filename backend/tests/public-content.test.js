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
          return null;
        },
        async all() {
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
  assert.equal(body.meta.limit, 50);
  assert.match(calls[0], /status = 'published'/);
  assert.match(calls[0], /LIMIT \?/);
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
