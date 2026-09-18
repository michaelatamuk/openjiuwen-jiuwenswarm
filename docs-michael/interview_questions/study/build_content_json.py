#!/usr/bin/env python
"""Convert the interview markdown docs into a TYPED, LAYERED content.json (v2)
for the native Android app, plus the diagram images (PNG) it references.

Layered/atomic model per question:
  type, tldr, points[] (recall targets), explain, mechanism,
  citations[] (structured code refs), pitfalls[], follow-ups[],
  diagram {source, image, steps}, meta {difficulty, tags, related}, provenance.

Output: study/android-app-2026/app/src/main/assets/content.json (+ diagrams/)
"""
import os
import re
import glob
import json
import html
import hashlib
import shutil
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
OUT = os.path.join(HERE, "android-app-2026", "app", "src", "main", "assets")
PNG_CACHE = os.path.join(HERE, ".mmd-png")

MH = re.compile(r"^## (\d+)\.\s*(.+)$")
DIAGRAM = re.compile(r"```mermaid\r?\n(.*?)```", re.S)
ANCHORS = re.compile(r"<details>\s*<summary>Anchors</summary>\s*\n\s*<sub>(.*?)</sub>\s*\n\s*</details>", re.S)
CODE = re.compile(r"<code>(.*?)</code>", re.S)
CANON = re.compile(r"_Canonical source:\s*`([^`]+)`(.*?)_</sub>", re.S)
NODE = re.compile(r'([A-Za-z0-9_]+)\s*(?:\[|\(|\{)\s*"?(.*?)"?\s*(?:\]|\)|\})')
EDGE = re.compile(r"([A-Za-z0-9_]+)\s*(?:-->|---|-\.->|==>|~~~|--x|--o)\s*(?:\|[^|]*\|\s*)?([A-Za-z0-9_]+)")


def sentences(text):
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if len(p.strip()) > 15]


def strip_md_header(body, label):
    m = re.search(r"\*\*" + label + r":\*\*\s*(.*?)(?:\n\n|\Z)", body, re.S)
    return m.group(1).strip() if m else ""


def parse_anchors(body):
    m = ANCHORS.search(body)
    if not m:
        return []
    out = []
    for chunk in m.group(1).split("<br>"):
        codes = CODE.findall(chunk)
        if not codes:
            continue
        ref = html.unescape(codes[0]).strip()
        rest = chunk.split("</code>", 1)[1] if "</code>" in chunk else ""
        rest = re.sub(r"<[^>]+>", "", rest)
        rest = html.unescape(rest).replace("&bull;", "").strip(" —-:").strip()
        # symbol: first token that looks like an identifier in the description
        sym = ""
        sm = re.search(r"([A-Za-z_][A-Za-z0-9_\.]{2,})", rest)
        if sm:
            sym = sm.group(1)
        lines = ""
        lm = re.search(r":(\d+(?:[/-]\d+)*)\s*$", ref)
        if lm:
            lines = lm.group(1)
        out.append({"kind": "code", "ref": ref, "symbol": sym, "lines": lines, "desc": rest})
    return out


def infer_type(q, citations):
    ql = q.lower()
    if "tell me about a time" in ql or "a time when" in ql:
        return "behavioral"
    if ("difference between" in ql or " vs " in ql or " versus " in ql or ql.startswith("compare")):
        return "compare"
    if "design a" in ql or "how would you design" in ql or "architect" in ql or "what's your strategy" in ql:
        return "design"
    if "under the hood" in ql or "how does the framework" in ql or "how does an agent" in ql or citations:
        return "mechanism"
    return "concept"


def mermaid_steps(code):
    labels = {}
    for m in NODE.finditer(code):
        labels.setdefault(m.group(1), (m.group(2) or m.group(1)).strip())
    order = []
    for m in EDGE.finditer(code):
        for nid in (m.group(1), m.group(2)):
            if nid in labels and nid not in order:
                order.append(nid)
    for m in NODE.finditer(code):
        if m.group(1) not in order:
            order.append(m.group(1))
    return [labels[i] for i in order][:12]


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
    questions, cur = [], None
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
    today = date.today().isoformat()
    topics = []
    missing = 0
    total = 0
    for f in files:
        prefix = os.path.basename(f)[:2]
        title, questions = parse_file(f)
        t = {"id": prefix, "title": title, "questions": []}
        n = len(questions)
        for qi, q in enumerate(questions, 1):
            total += 1
            body = "\n".join(q["body"])
            explain = strip_md_header(body, "General")
            mechanism = strip_md_header(body, "Jiuwen")
            gap = strip_md_header(body, "Gap")
            citations = parse_anchors(body)
            qtype = infer_type(q["question"], citations)

            sents = sentences(explain)
            tldr = sents[0] if sents else q["question"]
            points = sents[:6] if len(sents) >= 2 else ([tldr] if tldr else [])
            pitfalls = sentences(gap)
            sources = []
            cm = CANON.search(body)
            if cm:
                sources.append(cm.group(1).strip())

            diagram = {"source": "", "image": "", "alt": "", "steps": []}
            dia = DIAGRAM.search(body)
            if dia:
                code = dia.group(1).replace("\r", "").strip()
                h = hashlib.sha1(code.encode("utf-8")).hexdigest()
                src = os.path.join(PNG_CACHE, h + ".png")
                if os.path.isfile(src):
                    shutil.copyfile(src, os.path.join(OUT, "diagrams", h + ".png"))
                    diagram = {
                        "source": code,
                        "image": "diagrams/" + h + ".png",
                        "alt": f"Diagram for: {q['question']}",
                        "steps": mermaid_steps(code),
                    }
                else:
                    missing += 1

            t["questions"].append({
                "id": f"{prefix}-{qi}",
                "topicId": prefix,
                "topicTitle": title,
                "number": qi,
                "type": qtype,
                "question": q["question"],
                "tldr": tldr,
                "points": points,
                "explain": explain,
                "mechanism": mechanism,
                "citations": citations,
                "pitfalls": pitfalls,
                "followups": [],
                "diagram": diagram,
                "meta": {
                    "difficulty": "advanced" if qtype in ("design", "compare", "mechanism") else "core",
                    "tags": [prefix],
                    "related": [f"{prefix}-{j}" for j in (qi - 1, qi + 1) if 1 <= j <= n],
                },
                "provenance": {"sources": sources, "reviewedAt": today},
            })
        topics.append(t)

    data = {"version": 2, "topics": topics}
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "content.json"), "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)
    print(f"topics={len(topics)} questions={total} missing_diagrams={missing}")


if __name__ == "__main__":
    main()
