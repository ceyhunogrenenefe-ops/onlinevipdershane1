"""Compress heavy marketing images for faster page load."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "assets" / "img"
PROG = ROOT / "programlar"

PROGRAM_NAMES = [
    "lgs.png",
    "yks.png",
    "ortaokul.png",
    "lise.png",
    "ilkokul.png",
    "kamplar.png",
    "yazili.png",
    "kitap.png",
    "start.png",
    "kamp-9-hazirlik.png",
]


def compress_program_cards():
    for name in PROGRAM_NAMES:
        src = PROG / name
        if not src.exists():
            print("missing", name)
            continue
        im = Image.open(src).convert("RGB")
        w, h = im.size
        max_w = 800
        if w > max_w:
            nh = int(h * max_w / w)
            im = im.resize((max_w, nh), Image.Resampling.LANCZOS)
        out = PROG / f"{src.stem}.jpg"
        im.save(out, "JPEG", quality=78, optimize=True, progressive=True)
        print(f"{name}: {src.stat().st_size // 1024}KB -> {out.name} {out.stat().st_size // 1024}KB {im.size}")


def compress_logo():
    logo = ROOT / "ovd-logo.png"
    bak = ROOT / "ovd-logo.orig.png"
    if not bak.exists():
        bak.write_bytes(logo.read_bytes())
    im = Image.open(logo)
    print("logo before", im.mode, im.size, f"{logo.stat().st_size // 1024}KB")
    target_w = 560
    if im.width > target_w:
        nh = max(1, int(im.height * target_w / im.width))
        im = im.resize((target_w, nh), Image.Resampling.LANCZOS)
    im.save(logo, "PNG", optimize=True)
    print("logo after", im.size, f"{logo.stat().st_size // 1024}KB")


if __name__ == "__main__":
    compress_program_cards()
    compress_logo()
    print("done")
