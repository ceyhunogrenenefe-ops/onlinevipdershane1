#!/usr/bin/env python3
"""Unify GTM, Clarity, GA4 config and Search Console meta across all HTML pages."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERIFICATION = "3zMZ-JrvFsPWEUs_bzeFJOH-kmWIVfx9A-Ibq21w-Rs"
GTM_NOSCRIPT = (
    "<!-- Google Tag Manager (noscript) -->\n"
    '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NZR5ZLZQ"\n'
    'height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n'
    "<!-- End Google Tag Manager (noscript) -->"
)
VERIFICATION_META = (
    f'<meta name="google-site-verification" content="{VERIFICATION}">'
)

REMOVE_BLOCKS = [
    re.compile(
        r"<!-- Google Tag Manager -->\s*<script>\(function\(w,d,s,l,i\).*?</script>\s*"
        r"(?:<!-- End Google Tag Manager -->\s*)?",
        re.DOTALL,
    ),
    re.compile(
        r"<!-- Microsoft Clarity -->.*?<!-- End Microsoft Clarity -->\s*",
        re.DOTALL,
    ),
    re.compile(r"<!-- TikTok Pixel Code Start -->.*?<!-- TikTok Pixel Code End -->\s*", re.DOTALL),
    re.compile(r"<!-- Meta Pixel Code -->.*?<!-- End Meta Pixel Code -->\s*", re.DOTALL),
    re.compile(r"<!-- Google Ads Conversion -->.*?(?=\n\n|\n<link|\n<style|\n<meta|\n<script src)", re.DOTALL),
    re.compile(r"<!-- End Google Tag Manager -->\s*"),
]


def analytics_scripts(path: Path) -> str:
    prefix = "../assets" if "programlar" in path.parts else "assets"
    return (
        f'<script src="{prefix}/analytics-config.js" defer></script>\n'
        f'<script src="{prefix}/perf-analytics.js" defer></script>\n'
    )


def ensure_verification(text: str) -> str:
    if VERIFICATION in text:
        return text
    if "</head>" in text:
        return text.replace("</head>", f"  {VERIFICATION_META}\n</head>", 1)
    return text


def strip_inline_tracking(text: str) -> str:
    for pattern in REMOVE_BLOCKS:
        text = pattern.sub("", text)
    text = re.sub(
        r'<script async src="https://www\.googletagmanager\.com/gtag/js\?id=AW-[^"]+"></script>\s*',
        "",
        text,
    )
    return text


def replace_analytics_scripts(text: str, path: Path) -> str:
    scripts = analytics_scripts(path)
    text = re.sub(
        r'<script src="(?:\.\./)?assets/perf-gtm\.js" defer></script>\s*',
        "",
        text,
    )
    text = re.sub(
        r'<script src="(?:\.\./)?assets/perf-analytics\.js" defer></script>\s*',
        "",
        text,
    )
    text = re.sub(
        r'<script src="(?:\.\./)?assets/analytics-config\.js" defer></script>\s*',
        "",
        text,
    )
    if scripts.strip() not in text:
        text = text.replace("</body>", scripts + "</body>", 1)
    return text


def ensure_gtm_noscript(text: str) -> str:
    if "googletagmanager.com/ns.html?id=GTM-NZR5ZLZQ" in text:
        return text
    body_match = re.search(r"<body[^>]*>", text, re.IGNORECASE)
    if not body_match:
        return text
    insert_at = body_match.end()
    return text[:insert_at] + "\n" + GTM_NOSCRIPT + text[insert_at:]


def patch(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    text = strip_inline_tracking(original)
    text = ensure_verification(text)
    text = ensure_gtm_noscript(text)
    text = replace_analytics_scripts(text, path)
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
    for name in changed:
        print(" -", name)


if __name__ == "__main__":
    main()
