"""Build the static story banks and QR codes from stories.md.

Run from any directory: python projects/gameshow/build.py
Requires: python -m pip install qrcode[pil]
"""

from html import escape
from pathlib import Path
import re

import qrcode


ROOT = Path(__file__).resolve().parent
BASE_URL = "https://frkatona.github.io/projects/gameshow"


def document(title, body):
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>{escape(title)} · Party gameshow</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
{body}
</body>
</html>
"""


def read_banks():
    banks = {}
    current_bank = None
    story = None
    for line in (ROOT / "stories.md").read_text(encoding="utf-8").splitlines():
        if match := re.fullmatch(r"## Bank ([AB])", line):
            current_bank = match[1]
            banks[current_bank] = []
        elif current_bank and line.startswith("- "):
            story = {"title": line[2:], "beats": []}
            banks[current_bank].append(story)
        elif current_bank and story and line.startswith("\t"):
            match = re.fullmatch(r"(\t+)- (.+)", line)
            if not match:
                raise ValueError(f"Invalid outline line: {line!r}")
            story["beats"].append((len(match[1]), match[2]))
    if set(banks) != {"A", "B"} or any(len(bank) != 4 for bank in banks.values()):
        raise ValueError("Expected two banks of exactly four stories each.")
    if any(not story["beats"] for bank in banks.values() for story in bank):
        raise ValueError("Every story must contain outline beats.")
    return banks


def outline(beats):
    """Render the two outline levels used in stories.md as semantic lists."""
    parts = ["<ul>"]
    depth = 0
    for level, text in beats:
        if level not in (1, 2) or level > depth + 1:
            raise ValueError("Outline levels must be 1 or 2, nested in order.")
        if level > depth:
            if depth:
                parts.append("<ul>")
        elif level == depth:
            parts.append("</li>")
        else:
            parts.append("</li></ul></li>")
        parts.append(f"<li>{escape(text)}")
        depth = level
    if depth == 2:
        parts.append("</li></ul>")
    parts.append("</li></ul>")
    return "".join(parts)


def build():
    banks = read_banks()
    host_cards = []
    qr_screens = []
    for letter, stories in banks.items():
        slug = f"bank-{letter.lower()}"
        url = f"{BASE_URL}/{slug}.html"
        qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,
                           box_size=12, border=4)
        qr.add_data(url)
        qr.make(fit=True)
        qr.make_image(fill_color="black", back_color="white").save(ROOT / f"{slug}-qr.png")

        cards = []
        for number, story in enumerate(stories, 1):
            cards.append(f"""    <article class="story" aria-labelledby="story-{number}">
      <p class="eyebrow">Story {number:02d}</p>
      <h2 id="story-{number}">{escape(story['title'])}</h2>
      {outline(story['beats'])}
    </article>""")
        body = f"""<main class="bank-page">
  <header class="page-header">
    <p class="eyebrow">Party gameshow · Your story bank</p>
    <h1>Bank {letter}<span class="accent">.</span></h1>
    <p class="intro">Four stories to make your own. Pick one, learn the details, and tell it like it happened to you.</p>
    <p class="note">Keep this bank between you and your teammates.</p>
  </header>
  <section class="stories" aria-label="Four story outlines">
{chr(10).join(cards)}
  </section>
  <footer>Bank {letter} · 4 stories · Good luck keeping a straight face.</footer>
</main>"""
        (ROOT / f"{slug}.html").write_text(document(f"Bank {letter}", body), encoding="utf-8")

        host_cards.append(f"""    <article class="host-card">
      <p class="eyebrow">4 story outlines</p>
      <h2>Bank {letter}</h2>
      <a class="button" href="#{slug}-qr">Show Bank {letter} QR code</a>
      <a class="text-link" href="{slug}.html">Open Bank {letter} →</a>
    </article>""")
        qr_screens.append(f"""<section id="{slug}-qr" class="qr-screen" aria-labelledby="{slug}-label">
  <a class="close-qr" href="#host">← Back to host page</a>
  <div class="qr-content">
    <p class="eyebrow">Party gameshow · Scan to open</p>
    <h2 id="{slug}-label">Bank {letter}</h2>
    <img src="{slug}-qr.png" width="492" height="492" alt="QR code linking to Bank {letter}">
    <p>Scan with your phone’s camera.</p>
    <a class="qr-url" href="{slug}.html">{url}</a>
  </div>
</section>""")

    host = f"""<main id="host" class="host-page">
  <header class="page-header">
    <p class="eyebrow">Party gameshow · Host view</p>
    <h1>A story for<br>every storyteller<span class="accent">.</span></h1>
    <p class="intro">Eight stories. Two banks. Show each team its own QR code, then let the storytelling begin.</p>
  </header>
  <section class="host-cards" aria-label="Choose a story bank">
{chr(10).join(host_cards)}
  </section>
  <p class="note">Show one code at a time. Each team page contains only its four stories.</p>
  <footer>Need paper copies? <a href="bank-a-qr.png" download>Download Bank A QR</a> · <a href="bank-b-qr.png" download>Download Bank B QR</a></footer>
</main>
{chr(10).join(qr_screens)}"""
    (ROOT / "index.html").write_text(document("Host", host), encoding="utf-8")
    print("Built two banks of four stories, the host page, and two QR codes.")


if __name__ == "__main__":
    build()
