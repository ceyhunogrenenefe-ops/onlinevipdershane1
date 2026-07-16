#!/usr/bin/env python3
"""Inject Google Ads gtag.js snippet into <head> on all HTML pages."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GTAG_HEAD = """<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-17235832134"></script>
{config}
<script src="{prefix}/gtag-init.js"></script>
"""
REMOVE_OLD = re.compile(
    r"<!-- Google tag \(gtag\.js\) -->.*?"
    r'<script src="(?:\.\./)?assets/gtag-init\.js"></script>\s*',
    re.DOTALL,
)
REMOVE_DEFER_CONFIG = re.compile(
    r'<script src="(?:\.\./)?assets/analytics-config\.js" defer></script>\s*'
)


def gtag_block(path: Path) -> str:
    prefix = "../assets" if "programlar" in path.parts else "assets"
    config = f'<script src="{prefix}/analytics-config.js"></script>'
    return GTAG_HEAD.format(prefix=prefix, config=config)


def patch(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text
    text = REMOVE_OLD.sub("", text)
    if "gtag/js?id=AW-17235832134" not in text:
        text = text.replace("</head>", gtag_block(path) + "</head>", 1)
    else:
        text = REMOVE_OLD.sub(gtag_block(path), text, count=1)
    text = REMOVE_DEFER_CONFIG.sub("", text)
    prefix = "../assets" if "programlar" in path.parts else "assets"
    body_scripts = (
        f'<script src="{prefix}/perf-analytics.js" defer></script>\n'
    )
    text = re.sub(
        r'<script src="(?:\.\./)?assets/analytics-config\.js" defer></script>\s*'
        r'<script src="(?:\.\./)?assets/perf-analytics\.js" defer></script>\s*',
        body_scripts,
        text,
    )
    if f'{prefix}/perf-analytics.js' not in text:
        text = text.replace("</body>", body_scripts + "</body>", 1)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    changed = []
    for path in sorted(ROOT.rglob("*.html")):
        if patch(path):
            changed.append(str(path.relative_to(ROOT)))
    print("Updated", len(changed), "files")


if __name__ == "__main__":
    main()
