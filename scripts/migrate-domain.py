#!/usr/bin/env python3
"""Point site to onlinevipdershane.com and refresh sitemap."""
from __future__ import annotations

import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://onlinevipdershane.com"
TODAY = date.today().isoformat()

REPLACEMENTS = [
    ("https://onlinevipdershane.com", SITE),
    ("https://onlinevipdershane.com", SITE),
    ("https://onlinevipdershane.com", SITE),
    ("https://onlinevipdershane.com", SITE),
]

SITEMAP_PATHS = [
    ("/", "weekly", "1.0"),
    ("/programlar/lgs.html", "monthly", "0.9"),
    ("/programlar/yks.html", "monthly", "0.9"),
    ("/programlar/ortaokul.html", "monthly", "0.8"),
    ("/programlar/lise.html", "monthly", "0.8"),
    ("/programlar/ilkokul.html", "monthly", "0.7"),
    ("/programlar/kamplar.html", "monthly", "0.7"),
    ("/programlar/yazili.html", "monthly", "0.8"),
    ("/programlar/kitap.html", "monthly", "0.6"),
    ("/programlar/start.html", "monthly", "0.8"),
    ("/programlar/gece-etutu.html", "monthly", "0.6"),
    ("/kadromuz.html", "monthly", "0.7"),
    ("/blog.html", "weekly", "0.8"),
    ("/basarilarimiz.html", "monthly", "0.6"),
    ("/videolar.html", "monthly", "0.5"),
    ("/iletisim.html", "monthly", "0.7"),
    ("/kariyer.html", "monthly", "0.6"),
    ("/kayit.html", "monthly", "0.8"),
    ("/gizlilik.html", "yearly", "0.3"),
    ("/cerez.html", "yearly", "0.3"),
    ("/satis.html", "yearly", "0.3"),
    ("/iade.html", "yearly", "0.3"),
    ("/kullanici.html", "yearly", "0.3"),
]

GLOBS = ("*.html", "*.js", "*.xml", "*.txt", "*.py", ".env.example")


def replace_in_files() -> int:
    changed = 0
    for pattern in GLOBS:
        for path in ROOT.rglob(pattern):
            if ".git" in path.parts or "node_modules" in path.parts:
                continue
            text = path.read_text(encoding="utf-8")
            original = text
            for old, new in REPLACEMENTS:
                text = text.replace(old, new)
            if text != original:
                path.write_text(text, encoding="utf-8")
                changed += 1
    return changed


def write_sitemap() -> None:
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for path, freq, priority in SITEMAP_PATHS:
        lines.append(
            f"<url><loc>{SITE}{path}</loc>"
            f"<lastmod>{TODAY}</lastmod>"
            f"<changefreq>{freq}</changefreq>"
            f"<priority>{priority}</priority></url>"
        )
    lines.append("</urlset>")
    lines.append("")
    (ROOT / "sitemap.xml").write_text("\n".join(lines), encoding="utf-8")


def write_robots() -> None:
    (ROOT / "robots.txt").write_text(
        "User-agent: *\nAllow: /\nSitemap: https://onlinevipdershane.com/sitemap.xml\n",
        encoding="utf-8",
    )


def main() -> None:
    n = replace_in_files()
    write_sitemap()
    write_robots()
    print(f"Updated {n} files; sitemap + robots refreshed for {SITE}")


if __name__ == "__main__":
    main()
