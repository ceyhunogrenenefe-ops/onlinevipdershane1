#!/usr/bin/env python3
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BLOCK = (
    "<!-- Google Tag Manager (noscript) -->\n"
    '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NZR5ZLZQ"\n'
    'height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n'
    "<!-- End Google Tag Manager (noscript) -->"
)
PATTERN = re.compile(
    r"(?:<!-- Google Tag Manager \(noscript\) -->\s*)?"
    r'<noscript><iframe src="https://www\.googletagmanager\.com/ns\.html\?id=GTM-NZR5ZLZQ"[^>]*>\s*</iframe></noscript>'
    r"(?:\s*<!-- End Google Tag Manager \(noscript\) -->)?",
    re.DOTALL,
)

for path in ROOT.rglob("*.html"):
    text = path.read_text(encoding="utf-8")
    if "googletagmanager.com/ns.html?id=GTM-NZR5ZLZQ" not in text:
        continue
    new = PATTERN.sub(BLOCK, text, count=1)
    if new != text:
        path.write_text(new, encoding="utf-8")
        print(path.relative_to(ROOT))
