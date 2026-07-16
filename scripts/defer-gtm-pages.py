#!/usr/bin/env python3
"""Defer GTM on inner pages for faster first paint."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GTM_BLOCK = re.compile(
    r"<!-- Google Tag Manager -->\s*<script>\(function\(w,d,s,l,i\).*?</script>\s*",
    re.DOTALL,
)


def patch(path: Path, analytics: str) -> bool:
    text = path.read_text(encoding="utf-8")
    if "perf-analytics.js" in text or "perf-gtm.js" in text:
        return False
    new_text, n = GTM_BLOCK.subn("", text, count=1)
    if not n:
        return False
    insert = f'<script src="{analytics}" defer></script>\n'
    if 'src="assets/icons.js"' in new_text:
        new_text = new_text.replace(
            '<script src="assets/icons.js">',
            insert + '<script src="assets/icons.js" defer>',
            1,
        )
    elif 'src="../assets/icons.js"' in new_text:
        new_text = new_text.replace(
            '<script src="../assets/icons.js">',
            insert + '<script src="../assets/icons.js" defer>',
            1,
        )
    else:
        new_text = new_text.replace("</body>", insert + "</body>", 1)
    path.write_text(new_text, encoding="utf-8")
    return True


def main() -> None:
    changed = []
    for path in sorted(ROOT.rglob("*.html")):
        if path.name == "index.html":
            continue
        rel = "../assets/perf-gtm.js" if "programlar" in path.parts else "assets/perf-gtm.js"
        if patch(path, rel):
            changed.append(str(path.relative_to(ROOT)))
    print("Deferred GTM:", ", ".join(changed) if changed else "none")


if __name__ == "__main__":
    main()
