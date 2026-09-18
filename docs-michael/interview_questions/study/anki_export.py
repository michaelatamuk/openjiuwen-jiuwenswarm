#!/usr/bin/env python
"""Build Anki cards from the interview question bank.

Outputs (into study/dist/):
  jiuwen-interview-anki.csv   - import into Anki/AnkiDroid (HTML enabled)
  jiuwen-interview.apkg       - ready-to-open Anki deck (needs `genanki`)

Usage:
    python anki_export.py
"""
import os
import re
import glob
import html
import hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
DIST = os.path.join(HERE, "dist")

TOPIC = {
    "01": "LLM foundations",
    "02": "Prompting & output",
    "03": "Fine-tuning",
    "04": "RAG & retrieval",
    "05": "RAG system design",
    "06": "Agents, tools & memory",
    "07": "Evaluation",
    "08": "Production & scale",
    "09": "Security & safety",
    "10": "General engineering",
}


def parse_blocks(path):
    lines = open(path, encoding="utf-8").read().split("\n")
    res, cur = [], None
    for ln in lines:
        m = re.match(r"^## (\d+)\.\s*(.+)$", ln)
        if m:
            if cur:
                res.append(cur)
            cur = {"title": m.group(2).strip(), "body": []}
        elif ln.startswith("## "):
            if cur:
                res.append(cur)
                cur = None
        elif cur is not None:
            cur["body"].append(ln)
    if cur:
        res.append(cur)
    out = []
    for b in res:
        if b["title"].lower().startswith("summary"):
            continue
        b["body"] = "\n".join(b["body"]).strip()
        out.append(b)
    return out


def md_to_html(text):
    try:
        import markdown
        return markdown.markdown(text, extensions=["extra", "sane_lists", "nl2br"])
    except Exception:
        # minimal fallback
        t = html.escape(text)
        t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
        return "<p>" + t.replace("\n\n", "</p><p>").replace("\n", "<br>") + "</p>"


def main():
    os.makedirs(DIST, exist_ok=True)
    files = sorted(glob.glob(os.path.join(BASE, "[01][0-9]-*.md")))
    cards = []
    for f in files:
        prefix = os.path.basename(f)[:2]
        topic = TOPIC.get(prefix, prefix)
        for b in parse_blocks(f):
            body = b["body"]
            body = re.sub(r"```mermaid\n.*?```", "", body, flags=re.S)
            body = body.strip()
            cards.append({"q": b["title"], "topic": topic, "a": md_to_html(body)})

    with open(os.path.join(DIST, "jiuwen-interview-anki.csv"), "w", encoding="utf-8") as fh:
        fh.write("Question,Topic,Answer\n")
        for c in cards:
            q = c["q"].replace('"', '""')
            ans = c["a"].replace('"', '""').replace("\r", "").replace("\n", " ")
            fh.write(f'"{q}","{c["topic"]}","{ans}"\n')

    csv_path = os.path.join(DIST, "jiuwen-interview-anki.csv")
    print(f"wrote {csv_path} ({len(cards)} cards)")

    try:
        import genanki
    except Exception:
        print("genanki not installed; skipping .apkg (CSV is ready for import).")
        return

    mid = int(hashlib.sha1(b"jiuwen-qa-model").hexdigest()[:8], 16)
    did = int(hashlib.sha1(b"jiuwen-interview-prep").hexdigest()[:8], 16)
    model = genanki.Model(
        mid, "Jiuwen Q&A",
        fields=[{"name": "Question"}, {"name": "Topic"}, {"name": "Answer"}],
        templates=[{
            "name": "Recall",
            "qfmt": '<div class="topic">{{Topic}}</div><div class="q">{{Question}}</div>',
            "afmt": '{{FrontSide}}<hr id="answer"><div class="a">{{Answer}}</div>',
        }],
        css=(
            ".card{font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:16px;"
            "text-align:left;color:#222;background:#fff;line-height:1.5}"
            ".topic{color:#3f51b5;font-size:12px;font-weight:700;text-transform:uppercase;"
            "letter-spacing:.04em;margin-bottom:6px}.q{font-weight:600;font-size:18px}"
            ".a{font-size:15px}.a code{background:#f2f2f2;padding:1px 4px;border-radius:4px}"
            ".a pre{background:#f6f8fa;padding:8px;border-radius:6px;overflow:auto}"
            ".a table{border-collapse:collapse}.a td,.a th{border:1px solid #ccc;padding:4px 6px}"
        ),
    )
    deck = genanki.Deck(did, "Jiuwen Interview Prep")
    for c in cards:
        guid = hashlib.sha1((c["topic"] + "|" + c["q"]).encode("utf-8")).hexdigest()
        deck.add_note(genanki.Note(
            model=model, guid=guid,
            fields=[c["q"], c["topic"], c["a"]]))
    apkg = os.path.join(DIST, "jiuwen-interview.apkg")
    genanki.Package(deck).write_to_file(apkg)
    print(f"wrote {apkg} ({len(cards)} cards)")


if __name__ == "__main__":
    main()
