#!/usr/bin/env python3
"""Lightweight repository checks; uses only Python's standard library and Node.js."""
from html.parser import HTMLParser
from pathlib import Path
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
        self.script_chunks = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        if tag == "a" and attrs.get("href", "").startswith("#"):
            self.fragments.append(attrs["href"][1:])
        if tag == "script":
            self.in_script = True
            self.script_chunks = []
    def handle_data(self, data):
        if self.in_script:
            self.script_chunks.append(data)
    def handle_endtag(self, tag):
        if tag == "script" and self.in_script:
            self.scripts.append("".join(self.script_chunks))
            self.in_script = False
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
if not parser.scripts or not any("briefForm" in chunk for chunk in parser.scripts):
    fail("inline form handler not found")
for fragment in parser.fragments:
    if fragment and fragment not in parser.ids:
        fail("broken in-page anchor: #" + fragment)
print("PASS: HTML structure, form fields, privacy page and in-page anchors")

try:
    subprocess.run(["node", "--input-type=module", "--check"], input=(ROOT / "backend/src/worker.js").read_text(encoding="utf-8"), text=True, check=True, capture_output=True)
    inline_js = "\n".join(parser.scripts)
    subprocess.run(["node", "--input-type=module", "--check"], input=inline_js, text=True, check=True, capture_output=True)
except FileNotFoundError:
    fail("Node.js is required to validate JavaScript syntax")
except subprocess.CalledProcessError as exc:
    fail("JavaScript syntax check failed: " + (exc.stderr or exc.stdout or "unknown error"))
print("PASS: Worker and inline JavaScript syntax")

try:
    db = sqlite3.connect(":memory:")
    db.executescript((ROOT / "backend/migrations/0001_initial.sql").read_text(encoding="utf-8"))
    tables = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    expected = {"leads", "lead_events", "rate_limits"}
    if not expected.issubset(tables):
        fail("database migration did not create all required tables")
    db.close()
except sqlite3.Error as exc:
    fail("database migration failed: " + str(exc))
print("PASS: D1 migration SQL parses and creates expected tables")
print("All repository validation checks passed.")
