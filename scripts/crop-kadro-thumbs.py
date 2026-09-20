"""Kadro küçük daire fotoğraflarını Eda kartı gibi kare yüz-omuz kırp."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "assets" / "img" / "kadro"
OUT = ROOT / "thumbs"
SIZE = 600

# cx, cy: kırpma karesinin merkezi (0-1). scale: kare kenarı / min(w,h)
# Hedef: Eda kartındaki daire gibi yüz + omuz.
CROPS = {
    "eda-akturk.jpg": (0.50, 0.34, 0.90),
    "dogan-akturk.jpg": (0.50, 0.26, 0.84),
    "merve-matematik.jpg": (0.50, 0.40, 0.90),
    "gonul-cavusoglu-studio.jpg": (0.50, 0.36, 0.88),
    "tayyibe-ogrenenefe-2.jpg": (0.48, 0.38, 0.50),
    "merve-yetkin-studio.jpg": (0.50, 0.36, 0.88),
    "sultan-kurt-studio.jpg": (0.50, 0.36, 0.88),
    "ali-aktas-studio.jpg": (0.50, 0.36, 0.88),
    "demet.jpg": (0.70, 0.50, 0.55),
    "nadide-akturk.jpg": (0.78, 0.42, 0.48),
    "mustafa-kozan-studio.jpg": (0.50, 0.36, 0.88),
    "mustafa-ozturk.jpg": (0.42, 0.36, 0.70),
    "turgut-usul.jpg": (0.50, 0.28, 0.80),
    "yasin-kandemir.jpg": (0.50, 0.36, 0.88),
    "yilmaz-isik.jpg": (0.50, 0.32, 0.64),
}


def crop_square(im, cx, cy, scale):
    w, h = im.size
    side = int(min(w, h) * scale)
    side = max(80, min(side, min(w, h)))
    left = int(cx * w - side / 2)
    top = int(cy * h - side / 2)
    left = max(0, min(left, w - side))
    top = max(0, min(top, h - side))
    return im.crop((left, top, left + side, top + side))


def main():
    OUT.mkdir(exist_ok=True)
    for name, (cx, cy, scale) in CROPS.items():
        src = ROOT / name
        if not src.exists():
            print("missing", name)
            continue
        im = Image.open(src).convert("RGB")
        sq = crop_square(im, cx, cy, scale).resize((SIZE, SIZE), Image.Resampling.LANCZOS)
        stem = src.stem.replace("-studio", "")
        out = OUT / (stem + ".jpg")
        sq.save(out, "JPEG", quality=84, optimize=True, progressive=True)
        print(out.name, sq.size)


if __name__ == "__main__":
    main()
