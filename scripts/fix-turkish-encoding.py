#!/usr/bin/env python3
"""Fix emoji placeholders lost during cp1254 -> utf-8 migration."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

LEGAL_SUBS = [
    ("<p>?? Bu sayfayı paylaşmak için linki kopyalayın</p>", "<p>🔗 Bu sayfayı paylaşmak için linki kopyalayın</p>"),
    ('">?? Linki Kopyala</button>', '">🔗 Linki Kopyala</button>'),
    ('">?? WhatsApp</button>', '">💬 WhatsApp</button>'),
    ('<div id="copy-toast">? Link kopyalandı!</div>', '<div id="copy-toast">✅ Link kopyalandı!</div>'),
]

VIDEO_SUBS = [
    ("<span>? Sayfada izle</span>", "<span>▶ Sayfada izle</span>"),
    ("<span>? YouTube\\'da izle</span>", "<span>▶ YouTube\\'da izle</span>"),
    ("<span>?</span></div></div>", "<span>▶</span></div></div>"),
]


def main() -> None:
    for name in ["cerez.html", "gizlilik.html", "iade.html", "kullanici.html", "satis.html"]:
        path = ROOT / name
        text = path.read_text(encoding="utf-8")
        for old, new in LEGAL_SUBS:
            text = text.replace(old, new)
        path.write_text(text, encoding="utf-8", newline="\n")
        print("fixed", name)

    video = ROOT / "videolar.html"
    text = video.read_text(encoding="utf-8")
    for old, new in VIDEO_SUBS:
        text = text.replace(old, new)
    video.write_text(text, encoding="utf-8", newline="\n")
    print("fixed videolar.html")


if __name__ == "__main__":
    main()
