#!/usr/bin/env python3
"""Compress site images for faster loads."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "assets" / "img"

RULES = {
    "hero": {"max_w": 960, "quality": 82},
    "kurucu": {"max_w": 800, "quality": 82},
    "kadro": {"max_w": 400, "quality": 82},
    "programlar": {"max_w": 600, "quality": 85, "png_optimize": False, "skip_png": True},
}


def optimize(path: Path, max_w: int, quality: int, png_optimize: bool = False) -> None:
    before = path.stat().st_size
    img = Image.open(path)
    if img.mode in ("RGBA", "P") and path.suffix.lower() == ".jpg":
        img = img.convert("RGB")
    w, h = img.size
    if w > max_w:
        nh = int(h * max_w / w)
        img = img.resize((max_w, nh), Image.Resampling.LANCZOS)
    if path.suffix.lower() in {".jpg", ".jpeg"}:
        img.save(path, "JPEG", quality=quality, optimize=True, progressive=True)
    elif path.suffix.lower() == ".png" and png_optimize:
        img.save(path, "PNG", optimize=True)
    after = path.stat().st_size
    print(f"{path.relative_to(ROOT)}: {before//1024}KB -> {after//1024}KB")


def main() -> None:
    for folder, cfg in RULES.items():
        d = IMG / folder
        if not d.exists():
            continue
        for path in sorted(d.iterdir()):
            if path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
                continue
            if cfg.get("skip_png") and path.suffix.lower() == ".png":
                continue
            optimize(
                path,
                cfg["max_w"],
                cfg["quality"],
                cfg.get("png_optimize", False),
            )


if __name__ == "__main__":
    main()
