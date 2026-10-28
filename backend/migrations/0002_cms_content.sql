PRAGMA foreign_keys = ON;

-- Public content is returned only when status='published' and published_at is set.
CREATE TABLE IF NOT EXISTS cms_pages (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE CHECK(length(slug) BETWEEN 1 AND 180),
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 240),
  excerpt TEXT NOT NULL DEFAULT '',
  content_json TEXT NOT NULL DEFAULT '{}',
  seo_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cms_pages_public_slug
  ON cms_pages(status, slug, published_at);

CREATE TABLE IF NOT EXISTS cms_posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE CHECK(length(slug) BETWEEN 1 AND 180),
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 240),
  excerpt TEXT NOT NULL DEFAULT '',
  body_json TEXT NOT NULL DEFAULT '{}',
  seo_json TEXT NOT NULL DEFAULT '{}',
  author_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cms_posts_public_listing
  ON cms_posts(status, published_at DESC, slug);

CREATE TABLE IF NOT EXISTS cms_services (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE CHECK(length(slug) BETWEEN 1 AND 180),
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 180),
  summary TEXT NOT NULL DEFAULT '',
  description_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cms_services_public_order
  ON cms_services(status, sort_order, slug);

CREATE TABLE IF NOT EXISTS cms_templates (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE CHECK(length(slug) BETWEEN 1 AND 180),
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 180),
  template_type TEXT NOT NULL CHECK(template_type IN ('wordpress','html_css')),
  summary TEXT NOT NULL DEFAULT '',
  thumbnail_key TEXT,
  preview_url TEXT,
  price_minor INTEGER NOT NULL DEFAULT 0 CHECK(price_minor >= 0),
  currency TEXT NOT NULL DEFAULT 'VND',
  license_key TEXT NOT NULL DEFAULT 'review_required',
  compatibility_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cms_templates_public_filter
  ON cms_templates(status, template_type, published_at DESC, slug);
