import re
import base64
from pathlib import Path

root = Path(__file__).resolve().parents[1]
html = (root / "index.html").read_text(encoding="utf-8", errors="ignore")
m = re.search(r'<a[^>]*class="nav-logo"[^>]*>\s*<img src="(data:image/png;base64,[^"]+)"', html)
if not m:
    raise SystemExit("logo not found")
raw = base64.b64decode(m.group(1).split(",", 1)[1])
out = root / "assets" / "img" / "ovd-logo.png"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_bytes(raw)
print(out, len(raw))
