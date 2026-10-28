#!/usr/bin/env python3
"""Lightweight repository checks; uses only Python's standard library and Node.js."""
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import sqlite3
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]

class MarkupCheck(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.fragments = []
        self.scripts = []
        self.in_script = False
        self.script_type = ""
        self.script_chunks = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        if tag == "a" and attrs.get("href", "").startswith("#"):
            self.fragments.append(attrs["href"][1:])
        if tag == "script":
            self.in_script = True
            self.script_type = (attrs.get("type") or "").strip().lower()
            self.script_chunks = []
    def handle_data(self, data):
        if self.in_script:
            self.script_chunks.append(data)
    def handle_endtag(self, tag):
        if tag == "script" and self.in_script:
            self.scripts.append((self.script_type, "".join(self.script_chunks)))
            self.in_script = False
            self.script_type = ""
            self.script_chunks = []

def fail(message):
    print("FAIL:", message)
    sys.exit(1)

index = ROOT / "index.html"
if not index.exists():
    fail("index.html is missing")
html = index.read_text(encoding="utf-8")
parser = MarkupCheck()
parser.feed(html)
required = ["briefForm", "name", "email", "service", "consent", "formMessage", "estimateButton", "estimateResult"]
missing = [item for item in required if item not in parser.ids]
if missing:
    fail("required form/UI IDs missing: " + ", ".join(missing))
if 'name="hq-api-base"' not in html:
    fail("API base configuration meta tag is missing")
if not (ROOT / "privacy.html").exists():
    fail("privacy.html is missing")
admin_path = ROOT / "admin.html"
if not admin_path.exists():
    fail("admin.html is missing")
admin_html = admin_path.read_text(encoding="utf-8")
admin_parser = MarkupCheck()
admin_parser.feed(admin_html)
if 'name="robots" content="noindex,nofollow"' not in admin_html:
    fail("admin page must be marked noindex")
for required_admin_id in ["connectForm", "apiBase", "adminToken", "refreshButton", "leadRows"]:
    if required_admin_id not in admin_parser.ids:
        fail("required admin UI ID missing: " + required_admin_id)
for fragment in admin_parser.fragments:
    if fragment and fragment not in admin_parser.ids:
        fail("broken admin in-page anchor: #" + fragment)
if not parser.scripts or not any("briefForm" in chunk for script_type, chunk in parser.scripts if script_type in ("", "text/javascript", "application/javascript", "module")):
    fail("inline form handler not found")
for fragment in parser.fragments:
    if fragment and fragment not in parser.ids:
        fail("broken in-page anchor: #" + fragment)
print("PASS: HTML structure, form fields, privacy page and in-page anchors")

def validate_script_blocks(markup_parser, label):
    javascript_types = {"", "text/javascript", "application/javascript", "module"}
    json_types = {"application/ld+json", "application/json"}
    for index, (script_type, source) in enumerate(markup_parser.scripts, start=1):
        if not source.strip():
            continue
        if script_type in json_types:
            try:
                json.loads(source)
            except json.JSONDecodeError as exc:
                fail(f"{label} JSON script #{index} is invalid: {exc}")
        elif script_type in javascript_types:
            try:
                subprocess.run(
                    ["node", "--input-type=module", "--check"],
                    input=source, text=True, check=True, capture_output=True,
                )
            except subprocess.CalledProcessError as exc:
                fail(f"{label} JavaScript syntax check failed in script #{index}: " + (exc.stderr or exc.stdout or "unknown error"))
        # Data scripts such as JSON-LD are validated as data, not JavaScript.

try:
    subprocess.run(
        ["node", "--input-type=module", "--check"],
        input=(ROOT / "backend/src/worker.js").read_text(encoding="utf-8"),
        text=True, check=True, capture_output=True,
    )
    validate_script_blocks(parser, "index.html")
    validate_script_blocks(admin_parser, "admin.html")
except FileNotFoundError:
    fail("Node.js is required to validate JavaScript syntax")
except subprocess.CalledProcessError as exc:
    fail("Worker JavaScript syntax check failed: " + (exc.stderr or exc.stdout or "unknown error"))
print("PASS: Worker and inline JavaScript syntax; JSON-LD and JSON script blocks")

try:
    db = sqlite3.connect(":memory:")
    migration_files = sorted((ROOT / "backend/migrations").glob("*.sql"))
    if not migration_files:
        fail("no database migrations found")
    for migration in migration_files:
        db.executescript(migration.read_text(encoding="utf-8"))
    tables = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    expected = {"leads", "lead_events", "rate_limits", "cms_pages", "cms_posts", "cms_services", "cms_templates"}
    if not expected.issubset(tables):
        fail("database migrations did not create all required tables: " + ", ".join(sorted(expected - tables)))
    # Publicly readable content must have an explicit status and publication timestamp.
    page_columns = {row[1] for row in db.execute("PRAGMA table_info(cms_pages)")}
    if not {"status", "published_at", "slug"}.issubset(page_columns):
        fail("CMS page publication columns are missing")
    db.close()
except sqlite3.Error as exc:
    fail("database migration failed: " + str(exc))
print("PASS: all D1 migrations parse and create lead/CMS tables")
print("All repository validation checks passed.")
