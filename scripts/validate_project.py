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
    expected = {"leads", "lead_events", "rate_limits", "cms_pages", "cms_posts", "cms_services", "cms_templates", "crm_customers", "crm_activities", "crm_quotes", "crm_quote_items", "crm_audit_events"}
    if not expected.issubset(tables):
        fail("database migrations did not create all required tables: " + ", ".join(sorted(expected - tables)))
    # Publicly readable content must have an explicit status and publication timestamp.
    page_columns = {row[1] for row in db.execute("PRAGMA table_info(cms_pages)")}
    if not {"status", "published_at", "slug"}.issubset(page_columns):
        fail("CMS page publication columns are missing")
    # CRM foundation invariants: foreign keys, quote arithmetic, and append-only audit records.
    quote_columns = {row[1] for row in db.execute("PRAGMA table_info(crm_quotes)")}
    if not {"customer_id", "subtotal_minor", "discount_minor", "total_minor", "accepted_by", "accepted_at"}.issubset(quote_columns):
        fail("CRM quote fields are missing")
    quote_sql = db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='crm_quotes'").fetchone()[0]
    if "total_minor = subtotal_minor - discount_minor" not in quote_sql:
        fail("CRM quote total constraint is missing")
    customer_indexes = {row[1] for row in db.execute("PRAGMA index_list(crm_customers)")}
    if "idx_crm_customers_lead_unique" not in customer_indexes:
        fail("CRM customer-to-lead deduplication index is missing")
    for table, expected_fk in [("crm_activities", "crm_customers"), ("crm_quotes", "crm_customers"), ("crm_quote_items", "crm_quotes")]:
        foreign_tables = {row[2] for row in db.execute(f"PRAGMA foreign_key_list({table})")}
        if expected_fk not in foreign_tables:
            fail(f"CRM foreign key missing on {table}")

    # Exercise constraints with representative data, not just schema inspection.
    now = "2026-10-28T00:00:00Z"
    db.execute(
        "INSERT INTO leads (id,name,email,service,budget,goals,status,consent_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
        ("lead-test-1","Test Lead","lead@example.test","Website doanh nghiệp","","","new",now,now,now),
    )
    db.execute(
        "INSERT INTO crm_customers (id,lead_id,display_name,contact_email,created_at,updated_at) VALUES (?,?,?,?,?,?)",
        ("customer-test-1","lead-test-1","Test Customer","customer@example.test",now,now),
    )
    def expect_integrity_error(label, statement, values):
        try:
            db.execute(statement, values)
        except sqlite3.IntegrityError:
            return
        fail(label + " constraint did not reject invalid data")
    expect_integrity_error(
        "CRM duplicate lead conversion",
        "INSERT INTO crm_customers (id,lead_id,display_name,contact_email,created_at,updated_at) VALUES (?,?,?,?,?,?)",
        ("customer-test-2","lead-test-1","Duplicate Customer","other@example.test",now,now),
    )
    db.execute(
        "INSERT INTO crm_quotes (id,customer_id,quote_number,status,currency,subtotal_minor,discount_minor,total_minor,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        ("quote-test-1","customer-test-1","HQ-TEST-1","draft","VND",10000000,1000000,9000000,"test-user",now,now),
    )
    expect_integrity_error(
        "CRM quote arithmetic",
        "INSERT INTO crm_quotes (id,customer_id,quote_number,status,currency,subtotal_minor,discount_minor,total_minor,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        ("quote-test-2","customer-test-1","HQ-TEST-2","draft","VND",10000000,1000000,7000000,"test-user",now,now),
    )
    db.execute(
        "INSERT INTO crm_quote_items (id,quote_id,description,quantity,unit_price_minor,line_total_minor) VALUES (?,?,?,?,?,?)",
        ("item-test-1","quote-test-1","Website package",2,1000000,2000000),
    )
    expect_integrity_error(
        "CRM quote item arithmetic",
        "INSERT INTO crm_quote_items (id,quote_id,description,quantity,unit_price_minor,line_total_minor) VALUES (?,?,?,?,?,?)",
        ("item-test-2","quote-test-1","Invalid line",2,1000000,1500000),
    )
    db.close()
except sqlite3.Error as exc:
    fail("database migration failed: " + str(exc))
print("PASS: all D1 migrations parse and create lead/CMS tables")
print("All repository validation checks passed.")
