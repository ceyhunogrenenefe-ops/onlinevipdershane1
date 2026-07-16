#!/usr/bin/env python3
"""Add program poster images to standard program lander pages."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROG_DIR = ROOT / "programlar"

PROGRAMS = {
    "lgs.html": ("lgs.png", "LGS Online Eğitim Paketi"),
    "yks.html": ("yks.png", "YKS Online Eğitim Paketi"),
    "ortaokul.html": ("ortaokul.png", "5-6-7. Sınıf Online Eğitim Paketi"),
    "lise.html": ("lise.png", "9-10-11. Sınıf Online Eğitim Paketi"),
    "ilkokul.html": ("ilkokul.png", "3-4. Sınıf Online Eğitim Paketi"),
    "kamplar.html": ("kamplar.png", "Yaz LGS Kursu"),
    "yazili.html": ("yazili.png", "Yazılıya Hazırlık Kampı"),
    "start.html": ("start.png", "VIP Start Eğitim Paketi"),
}


def poster_block(img: str, alt: str, eager: bool = False) -> str:
    loading = "eager" if eager else "lazy"
    return (
        f'    <div class="prog-hero-poster">\n'
        f'      <img src="../assets/img/programlar/{img}" alt="{alt}" '
        f'loading="{loading}" width="600" height="750">\n'
        f"    </div>"
    )


def feature_block(img: str, alt: str) -> str:
    return (
        f'      <div class="prog-poster-feature">\n'
        f'        <img src="../assets/img/programlar/{img}" alt="{alt}" loading="lazy">\n'
        f"      </div>"
    )


def patch_standard_page(path: Path, img: str, alt: str) -> bool:
    text = path.read_text(encoding="utf-8")
    if "prog-hero-poster" in text:
        return False

    if "program-page.css" not in text:
        text = text.replace(
            '<link rel="stylesheet" href="../assets/welcome-modal.css">',
            '<link rel="stylesheet" href="../assets/welcome-modal.css">\n'
            '  <link rel="stylesheet" href="../assets/program-page.css">',
            1,
        )

    og = (
        f'<meta property="og:image" '
        f'content="https://onlinevipdershane.com/assets/img/programlar/{img}">\n'
    )
    if "og:image" not in text:
        text = text.replace("<meta name=\"description\"", og + "<meta name=\"description\"", 1)

    text = re.sub(
        r"(<section class=\"prog-hero\">\s*<div class=\"prog-hero-in\">\s*)<div>",
        r'\1<div class="prog-hero-copy">',
        text,
        count=1,
    )

    hero_pat = re.compile(
        r"(<section class=\"prog-hero\">.*?<div class=\"prog-meta\">.*?</div>\s*</div>\s*)"
        r"(<div class=\"price-box\">)",
        re.DOTALL,
    )
    if not hero_pat.search(text):
        raise RuntimeError(f"hero block not found in {path.name}")
    text = hero_pat.sub(r"\1" + poster_block(img, alt, eager=True) + r"\n    \2", text, count=1)

    body_pat = (
        '<div class="prog-grid">\n    <div>\n      <div class="content-sec">'
    )
    if body_pat in text:
        text = text.replace(
            body_pat,
            '<div class="prog-grid">\n    <div>\n'
            + feature_block(img, alt)
            + '\n      <div class="content-sec">',
            1,
        )

    path.write_text(text, encoding="utf-8")
    return True


def patch_kitap_page(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if "hero-poster-wrap" in text:
        return False

    css = """
  .hero-poster-wrap {
    position: relative; max-width: 420px; margin: 28px auto 0;
    padding: 12px; background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.2); border-radius: 16px;
    backdrop-filter: blur(8px);
  }
  .hero-poster-img {
    width: 100%; height: auto; display: block; border-radius: 12px;
    object-fit: contain;
  }
"""
    text = text.replace("  .hero-badge.red {", css + "  .hero-badge.red {", 1)

    poster = (
        '  <div class="hero-poster-wrap">\n'
        '    <img src="../assets/img/programlar/kitap.png" alt="Kitap Okuma Atölyesi" '
        'class="hero-poster-img" loading="eager">\n'
        "  </div>\n"
    )
    marker = '  <div class="hero-badges">'
    end = text.find("</section>", text.find(marker))
    badges_end = text.rfind("</div>", 0, end)
    # insert after hero-badges block
    insert_at = text.find("</div>", text.find('class="hero-badges"'))
    insert_at = text.find("\n", insert_at) + 1
    # find closing of hero-badges - the div after hero-badges opens
    m = re.search(
        r'(<div class="hero-badges">.*?</div>\s*)',
        text,
        re.DOTALL,
    )
    if not m:
        raise RuntimeError("kitap hero-badges not found")
    text = text[: m.end()] + poster + text[m.end() :]

    og = (
        '<meta property="og:image" '
        'content="https://onlinevipdershane.com/assets/img/programlar/kitap.png">\n'
    )
    if "og:image" not in text:
        text = text.replace("<title>", og + "<title>", 1)

    path.write_text(text, encoding="utf-8")
    return True


def main() -> None:
    changed = []
    for fname, (img, alt) in PROGRAMS.items():
        path = PROG_DIR / fname
        if path.exists() and patch_standard_page(path, img, alt):
            changed.append(fname)

    kitap = PROG_DIR / "kitap.html"
    if kitap.exists() and patch_kitap_page(kitap):
        changed.append("kitap.html")

    print("Updated:", ", ".join(changed) if changed else "nothing")


if __name__ == "__main__":
    main()
