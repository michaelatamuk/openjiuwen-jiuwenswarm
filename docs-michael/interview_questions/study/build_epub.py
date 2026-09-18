#!/usr/bin/env python
"""Build an EPUB (EPUB3) from the interview docs, with Mermaid rendered to PNG
so it works in any Android/desktop e-reader.

Output: study/dist/jiuwenswarm-interview.epub
Run with an interpreter that has markdown, pymdown-extensions, ebooklib and
mmdc available.
"""
import os
import re
import glob
import sys
import html
import hashlib
import tempfile
import subprocess

import markdown
from pymdownx.superfences import fence_code_format
from ebooklib import epub

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
DIST = os.path.join(HERE, "dist")
PNG_CACHE = os.path.join(HERE, ".mmd-png")
PUPPETEER = os.path.join(HERE, ".mmd-cache", "puppeteer.json")
MERMAID_BLOCK = re.compile(r"```mermaid\r?\n(.*?)```", re.S)
DETAILS = re.compile(r"<details>\s*<summary>Anchors</summary>\s*\n\s*\n(<sub>.*?</sub>)\s*\n\s*\n</details>", re.S)

CSS = """
body { font-family: serif; line-height: 1.5; }
h1 { font-size: 1.6em; border-bottom: 1px solid #ccc; padding-bottom: .2em; }
h2 { font-size: 1.2em; margin-top: 1.2em; }
code { font-family: monospace; background: #f2f2f2; padding: 0 2px; }
pre { background: #f6f8fa; padding: .5em; overflow-x: auto; }
sub { color: #666; font-size: .8em; }
table { border-collapse: collapse; }
th, td { border: 1px solid #ccc; padding: 2px 5px; }
.diagram { text-align: center; margin: .8em 0; }
.diagram img { max-width: 100%; height: auto; }
.title-page { text-align: center; margin-top: 30%; }
"""


def find_mmdc():
    env = os.environ.get("MMDC")
    if env and os.path.isfile(env):
        return [env]
    for name in ("mmdc.cmd", "mmdc"):
        p = os.path.join(HERE, "node_modules", ".bin", name)
        if os.path.isfile(p):
            return [p]
    return ["npx", "--yes", "@mermaid-js/mermaid-cli"]


def render_png(code, mmdc):
    h = hashlib.sha1(code.encode("utf-8")).hexdigest()
    os.makedirs(PNG_CACHE, exist_ok=True)
    out = os.path.join(PNG_CACHE, h + ".png")
    if os.path.isfile(out):
        return out, h
    with tempfile.TemporaryDirectory() as d:
        inp = os.path.join(d, "in.mmd")
        with open(inp, "w", encoding="utf-8") as fh:
            fh.write(code)
        cmd = mmdc + ["-i", inp, "-o", out, "-b", "white", "-s", "2"]
        if os.path.isfile(PUPPETEER):
            cmd += ["-p", PUPPETEER]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    return out, h


def make_md():
    return markdown.Markdown(
        extensions=["extra", "sane_lists", "tables", "md_in_html", "admonition", "toc", "pymdownx.superfences"],
        extension_configs={"pymdownx.superfences": {"custom_fences": [
            {"name": "mermaid", "class": "mermaid", "format": fence_code_format}]}},
    )


def build():
    mmdc = find_mmdc()
    files = sorted(glob.glob(os.path.join(BASE, "[01][0-9]-*.md"))) + \
            sorted(glob.glob(os.path.join(BASE, "[9][0-9]-*.md")))

    book = epub.EpubBook()
    book.set_identifier("jiuwenswarm-interview-prep")
    book.set_title("Jiuwenswarm Interview Prep")
    book.set_language("en")
    book.add_author("Jiuwenswarm")

    style = epub.EpubItem(uid="style", file_name="style/main.css",
                          media_type="text/css", content=CSS)
    book.add_item(style)

    images = {}
    chapters = []
    toc = []
    n = 0
    for f in files:
        text = open(f, encoding="utf-8").read()
        topic = ""
        for ln in text.split("\n"):
            if ln.startswith("# "):
                topic = ln[2:].strip()
                break
        # diagrams -> png
        def repl(m):
            png, h = render_png(m.group(1).replace("\r", "").strip(), mmdc)
            images[h] = png
            return f'\n<div class="diagram"><img src="images/{h}.png" alt="diagram"/></div>\n'
        text = MERMAID_BLOCK.sub(repl, text)
        text = DETAILS.sub(r"\1", text)

        md = make_md()
        body = md.convert(text)
        n += 1
        fname = os.path.basename(f).replace(".md", "") + ".xhtml"
        ch = epub.EpubHtml(title=topic, file_name=fname, lang="en")
        ch.content = f'<h1>{html.escape(topic)}</h1>\n{body}'
        ch.add_item(style)
        book.add_item(ch)
        chapters.append(ch)

        children = []
        for t in md.toc_tokens:
            for c in t.get("children", []):
                children.append(epub.Link(fname + "#" + c["id"], c["name"], c["id"]))
        toc.append((epub.Section(topic), children) if children else epub.Link(fname, topic, fname))

    for h, p in images.items():
        with open(p, "rb") as fh:
            data = fh.read()
        book.add_item(epub.EpubItem(uid="img_" + h, file_name=f"images/{h}.png",
                                    media_type="image/png", content=data))

    book.toc = toc
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())
    book.spine = ["nav"] + chapters

    os.makedirs(DIST, exist_ok=True)
    out = os.path.join(DIST, "jiuwenswarm-interview.epub")
    epub.write_epub(out, book)
    print(f"wrote {out} ({os.path.getsize(out)//1024} KB, {len(chapters)} chapters, {len(images)} diagrams)")


if __name__ == "__main__":
    build()
