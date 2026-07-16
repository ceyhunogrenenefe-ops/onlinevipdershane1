#!/usr/bin/env python3
"""Add mobile nav CSS/JS to program lander pages."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROG = ROOT / "programlar"

CSS = '  <link rel="stylesheet" href="../assets/program-nav.css">\n'
JS = '<script src="../assets/program-nav.js" defer></script>\n'


def patch(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if "prog-hero" not in text or "program-nav.js" in text:
        return False
    if "program-nav.css" not in text:
        text = text.replace(
            '  <link rel="stylesheet" href="../assets/program-page.css">',
            '  <link rel="stylesheet" href="../assets/program-page.css">\n' + CSS,
            1,
        )
    if "program-nav.js" not in text:
        text = text.replace(
            '<script src="../assets/perf-gtm.js" defer></script>',
            JS + '<script src="../assets/perf-gtm.js" defer></script>',
            1,
        )
        if "program-nav.js" not in text:
            text = text.replace(
                '<script src="../assets/icons.js" defer></script>',
                JS + '<script src="../assets/icons.js" defer></script>',
                1,
            )
    path.write_text(text, encoding="utf-8")
    return True


def main() -> None:
    changed = [f.name for f in sorted(PROG.glob("*.html")) if patch(f)]
    print("Patched:", ", ".join(changed) if changed else "none")


if __name__ == "__main__":
    main()
