#!/usr/bin/env python
"""Convert the interview markdown docs into a structured content.json for the
native Android app, plus the diagram images (PNG) it references.

Output: study/android-app-2026/app/src/main/assets/content.json
        study/android-app-2026/app/src/main/assets/diagrams/<hash>.png
"""
import os
import re
import glob
import json
import hashlib
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
OUT = os.path.join(HERE, "android-app-2026", "app", "src", "main", "assets")
PNG_CACHE = os.path.join(HERE, ".mmd-png")

MH = re.compile(r"^## (\d+)\.\s*(.+)$")
DIAGRAM = re.compile(r"```mermaid\r?\n(.*?)```", re.S)
ANCHORS = re.compile(r"<details>\s*<summary>Anchors</summary>\s*\n\s*<sub>(.*?)</sub>\s*\n\s*</details>", re.S)
CODE = re.compile(r"<code>(.*?)</code>", re.S)


def strip_md_header(body, label):
    """Return the paragraph following a **Label:** marker."""
    m = re.search(r"\*\*" + label + r":\*\*\s*(.*?)(?:\n\n|\Z)", body, re.S)
    return m.group(1).strip() if m else ""


def parse_anchors(body):
    m = ANCHORS.search(body)
    if not m:
        return []
    inner = m.group(1)
    out = []
    for chunk in inner.split("<br>"):
        codes = CODE.findall(chunk)
        if not codes:
            continue
        ref = codes[0].strip()
        desc = chunk.split("</code>", 1)[1] if "</code>" in chunk else ""
        desc = re.sub(r"<[^>]+>", "", desc)
        desc = desc.replace("&bull;", "").replace("&amp;", "&").strip(" —-:").strip()
        out.append({"ref": ref, "desc": desc})
    return out


def parse_file(path):
    text = open(path, encoding="utf-8").read()
    title = ""
    for ln in text.split("\n"):
        if ln.startswith("# "):
            title = ln[2:].strip()
            break
    lines = text.split("\n")
    idx = next((i for i, l in enumerate(lines) if MH.match(l)), None)
    if idx is None:
        return title, []
    questions = []
    cur = None
    for ln in lines[idx:]:
        m = MH.match(ln)
        if m:
            if cur:
                questions.append(cur)
            cur = {"number": int(m.group(1)), "question": m.group(2).strip(), "body": []}
        elif ln.startswith("# "):
            if cur:
                questions.append(cur)
                cur = None
        elif cur is not None:
            cur["body"].append(ln)
    if cur:
        questions.append(cur)
    return title, questions


def main():
    files = sorted(glob.glob(os.path.join(BASE, "[01][0-9]-*.md")))
    os.makedirs(os.path.join(OUT, "diagrams"), exist_ok=True)
    topics = []
    missing_diagrams = 0
    for f in files:
        prefix = os.path.basename(f)[:2]
        title, questions = parse_file(f)
        t = {"id": prefix, "title": title, "questions": []}
        for qi, q in enumerate(questions, 1):
            body = "\n".join(q["body"])
            gen = strip_md_header(body, "General")
            jiu = strip_md_header(body, "Jiuwen")
            gap = strip_md_header(body, "Gap")
            anchors = parse_anchors(body)
            dia = DIAGRAM.search(body)
            diagram = ""
            if dia:
                code = dia.group(1).replace("\r", "").strip()
                h = hashlib.sha1(code.encode("utf-8")).hexdigest()
                src = os.path.join(PNG_CACHE, h + ".png")
                if os.path.isfile(src):
                    shutil.copyfile(src, os.path.join(OUT, "diagrams", h + ".png"))
                    diagram = "diagrams/" + h + ".png"
                else:
                    missing_diagrams += 1
            t["questions"].append({
                "id": f"{prefix}-{qi}",
                "topicId": prefix,
                "topicTitle": title,
                "number": qi,
                "question": q["question"],
                "general": gen,
                "jiuwen": jiu,
                "gap": gap,
                "diagram": diagram,
                "anchors": anchors,
            })
        topics.append(t)
    data = {"version": 1, "topics": topics}
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "content.json"), "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)
    total = sum(len(t["questions"]) for t in topics)
    print(f"topics={len(topics)} questions={total} missing_diagrams={missing_diagrams}")


if __name__ == "__main__":
    main()
