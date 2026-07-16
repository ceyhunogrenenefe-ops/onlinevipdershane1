import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOGO_SNIPPET = '<img src="{prefix}assets/img/ovd-logo.png" alt="Online VIP Dershane" width="280" height="68" decoding="async">'
NAV_LOGO_CSS = '<link rel="stylesheet" href="{prefix}assets/nav-logo.css">'
WELCOME_CSS = '<link rel="stylesheet" href="{prefix}assets/welcome-modal.css">'
WELCOME_JS = '<script src="{prefix}assets/welcome-modal.js"></script>'


def prefix_for(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    if rel.startswith("programlar/"):
        return "../"
    return ""


def ensure_assets(html: str, prefix: str) -> str:
    nav_css = NAV_LOGO_CSS.format(prefix=prefix)
    welcome_css = WELCOME_CSS.format(prefix=prefix)
    welcome_js = WELCOME_JS.format(prefix=prefix)

    if "assets/nav-logo.css" not in html:
        html = html.replace("</head>", f"  {nav_css}\n</head>", 1)
    if "assets/welcome-modal.css" not in html:
        html = html.replace("</head>", f"  {welcome_css}\n</head>", 1)
    if "assets/welcome-modal.js" not in html and "</body>" in html:
        html = html.replace("</body>", f"  {welcome_js}\n</body>", 1)
    return html


def fix_nav_logo(html: str, prefix: str) -> str:
    snippet = LOGO_SNIPPET.format(prefix=prefix)

    html = re.sub(
        r'<a([^>]*class="nav-logo"[^>]*)>\s*<img[^>]*>\s*</a>',
        lambda m: f'<a{m.group(1)}>{snippet}</a>',
        html,
        flags=re.I | re.S,
    )
    html = re.sub(
        r'<a([^>]*class="nav-logo"[^>]*)>\s*Online VIP Dershane\s*</a>',
        lambda m: f'<a{m.group(1)}>{snippet}</a>',
        html,
        flags=re.I,
    )

    html = re.sub(r"\.nav-logo img\{[^}]+\}", "", html)
    html = re.sub(
        r"\.nav-logo\{font-family:[^}]+\}",
        ".nav-logo{display:inline-flex;align-items:center;flex-shrink:0;line-height:0;}",
        html,
    )
    return html


def fix_inline_logos(html: str, prefix: str) -> str:
    html = re.sub(
        r'<img([^>]*class="logo-img"[^>]*)\ssrc="data:image/[^"]+"([^>]*)>',
        lambda m: f'<img{m.group(1)} src="{prefix}assets/img/ovd-logo.png"{m.group(2)}>',
        html,
        flags=re.I,
    )
    html = re.sub(
        r'src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABAM[^"]+"',
        f'src="{prefix}assets/img/ovd-logo.png"',
        html,
    )
    return html


def main() -> None:
    for path in ROOT.rglob("*.html"):
        text = path.read_text(encoding="utf-8", errors="ignore")
        original = text
        prefix = prefix_for(path)
        text = fix_nav_logo(text, prefix)
        text = fix_inline_logos(text, prefix)
        text = ensure_assets(text, prefix)
        if text != original:
            path.write_text(text, encoding="utf-8")
            print("updated", path.relative_to(ROOT))


if __name__ == "__main__":
    main()
