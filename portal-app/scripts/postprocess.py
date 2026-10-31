#!/usr/bin/env python3
"""Rewrite the Vite build output so the WordPress plugin can inject its placeholders.

After this step dist/index.html contains:
  __SF_PORTAL_ASSET__  -> hashed JS bundle inside the plugin
  __SF_PORTAL_BLOG__   -> WordPress blog entry (portal bypass URL)
  __SF_PORTAL_QUIZ__   -> quiz subdomain entry
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
html_path = ROOT / "dist" / "index.html"
html = html_path.read_text(encoding="utf-8")

html, asset_count = re.subn(
    r'src="/assets/(index-[A-Za-z0-9_-]+\.js)"',
    'src="__SF_PORTAL_ASSET__"',
    html,
)
html, blog_count = re.subn(
    r'href="https://stillfloating\.top/\?sf_blog=1"',
    'href="__SF_PORTAL_BLOG__"',
    html,
)
html, quiz_count = re.subn(
    r'href="https://quiz\.stillfloating\.top/"',
    'href="__SF_PORTAL_QUIZ__"',
    html,
)

if not (asset_count and blog_count and quiz_count):
    sys.exit(
        f"postprocess: unexpected counts asset={asset_count} blog={blog_count} quiz={quiz_count}"
    )

html_path.write_text(html, encoding="utf-8")
print(f"postprocess ok: asset={asset_count} blog={blog_count} quiz={quiz_count}")
