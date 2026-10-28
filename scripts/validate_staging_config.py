#!/usr/bin/env python3
"""Guardrails for the isolated Cloudflare staging config; standard library only."""
from pathlib import Path
import sys
import tomllib
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
EXAMPLE = ROOT / "backend/wrangler.staging.example.toml"
LOCAL = ROOT / "backend/wrangler.staging.toml"
PLACEHOLDERS = ("REPLACE_WITH_", "example.invalid", "YOUR_")

def fail(message):
    print("FAIL:", message)
    sys.exit(1)

def load(path):
    try:
        return tomllib.loads(path.read_text(encoding="utf-8"))
    except (OSError, tomllib.TOMLDecodeError) as exc:
        fail(f"cannot parse {path.relative_to(ROOT)}: {exc}")

def https_origin(value, label, allow_placeholder=False):
    if not isinstance(value, str) or not value:
        fail(f"{label} must be configured")
    if not allow_placeholder and any(marker in value for marker in PLACEHOLDERS):
        fail(f"{label} still contains a placeholder")
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        fail(f"{label} must be a valid HTTPS URL without embedded credentials")
    if parsed.path not in ("", "/") or parsed.query or parsed.fragment:
        fail(f"{label} must be an origin only, without path/query/fragment")
    return parsed

if not EXAMPLE.exists():
    fail("staging example config is missing")
example = load(EXAMPLE)
if example.get("name") != "hoiquanweb-api-staging":
    fail("example Worker name must be hoiquanweb-api-staging")
example_d1 = example.get("d1_databases", [])
if len(example_d1) != 1 or example_d1[0].get("database_name") != "hoiquanweb-staging":
    fail("example must bind exactly one hoiquanweb-staging D1 database")
if "REPLACE_WITH_STAGING_D1_DATABASE_ID" not in str(example_d1[0].get("database_id", "")):
    fail("example D1 ID must remain an explicit staging placeholder")
example_vars = example.get("vars", {})
https_origin(example_vars.get("AUTH_BASE_URL"), "example AUTH_BASE_URL", allow_placeholder=True)
https_origin(example_vars.get("ALLOWED_ORIGINS"), "example ALLOWED_ORIGINS", allow_placeholder=True)
print("PASS: staging example is valid TOML with separate API/frontend origin placeholders")

if not LOCAL.exists():
    print("SKIP: local backend/wrangler.staging.toml not present; live staging config is not provisioned")
    sys.exit(0)

local = load(LOCAL)
if local.get("name") != "hoiquanweb-api-staging":
    fail("local config must target only hoiquanweb-api-staging")
databases = local.get("d1_databases", [])
if len(databases) != 1 or databases[0].get("database_name") != "hoiquanweb-staging":
    fail("local config must bind exactly one hoiquanweb-staging database")
database_id = databases[0].get("database_id", "")
if not isinstance(database_id, str) or not database_id.strip() or any(marker in database_id for marker in PLACEHOLDERS):
    fail("local staging D1 database_id is missing or still a placeholder")
if databases[0].get("database_name") == "hoiquanweb-production":
    fail("refusing production D1 database")
vars_ = local.get("vars", {})
api = https_origin(vars_.get("AUTH_BASE_URL"), "local AUTH_BASE_URL")
frontend = https_origin(vars_.get("ALLOWED_ORIGINS"), "local ALLOWED_ORIGINS")
if "," in vars_.get("ALLOWED_ORIGINS", ""):
    fail("staging must use one explicitly verified frontend origin")
if api.hostname == "REPLACE_WITH_STAGING_API_HOST" or frontend.hostname == "REPLACE_WITH_STAGING_FRONTEND_HOST":
    fail("staging hostnames are placeholders")
print("PASS: local config targets a separate staging Worker/D1 with HTTPS origins")
