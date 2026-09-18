#!/usr/bin/env python
"""Prepare and build the offline study site for the interview question bank.

Usage:
    python build_study.py            # prepare docs/ and build site/
    python build_study.py --no-build # only prepare docs/

The site is built with mkdocs-material. Install the toolchain once into an
isolated venv, e.g.:
    uv venv .venv
    uv pip install --python .venv/Scripts/python.exe mkdocs-material
Then run this script with that venv's python, or set MKDOCS_PYTHON to it.
"""
import os
import re
import sys
import glob
import shutil
import subprocess

import render_mermaid

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)          # .../interview_questions
DOCS = os.path.join(HERE, "docs")
ASSETS = os.path.join(HERE, "assets")
CONFIG = os.path.join(HERE, "mkdocs.yml")


def prep():
    if os.path.isdir(DOCS):
        shutil.rmtree(DOCS)
    os.makedirs(os.path.join(DOCS, "assets"), exist_ok=True)

    files = sorted(glob.glob(os.path.join(BASE, "[019][0-9]-*.md")))
    for f in files:
        with open(f, encoding="utf-8") as fh:
            text = fh.read()
        text = text.replace("](README.md)", "](index.md)")
        text = text.replace("](orig/README.md)", "](index.md)")
        text = render_mermaid.transform(text)   # fences -> inline SVG (no runtime mermaid)
        with open(os.path.join(DOCS, os.path.basename(f)), "w", encoding="utf-8") as fh:
            fh.write(text)

    readme = os.path.join(BASE, "README.md")
    if os.path.isfile(readme):
        with open(readme, encoding="utf-8") as fh:
            text = fh.read()
        text = text.replace("](README.md)", "](index.md)")
        text = text.replace("](orig/README.md)", "](index.md)")
        # index.md is served as the site home; links to *.md resolve to pages.
        with open(os.path.join(DOCS, "index.md"), "w", encoding="utf-8") as fh:
            fh.write(text)

    for a in glob.glob(os.path.join(ASSETS, "*")):
        shutil.copyfile(a, os.path.join(DOCS, "assets", os.path.basename(a)))

    print(f"prepared {len(files)} content files + index into {DOCS}")


def find_python():
    env = os.environ.get("MKDOCS_PYTHON")
    if env and os.path.isfile(env):
        return env
    candidate = os.path.join(HERE, ".venv", "Scripts", "python.exe")
    if os.path.isfile(candidate):
        return candidate
    return sys.executable


def build():
    py = find_python()
    try:
        subprocess.run([py, "-c", "import mkdocs"], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        print("mkdocs is not installed for", py)
        print("Install it:  uv venv .venv && uv pip install --python .venv/Scripts/python.exe mkdocs-material")
        print("then re-run, or set MKDOCS_PYTHON to that interpreter.")
        return 1
    # Fail fast on broken Mermaid before building.
    lint = subprocess.run([sys.executable, os.path.join(HERE, "lint_mermaid.py")])
    if lint.returncode != 0:
        print("Mermaid lint reported problems; fix them before publishing.")
    subprocess.run([py, "-m", "mkdocs", "build", "-f", CONFIG, "--clean"], check=True)
    site = os.path.join(HERE, "site")
    offline_fix(site)
    print("built site ->", site)
    print("open:", os.path.join(site, "index.html"))
    return 0


def offline_fix(site):
    """Rewrite the one CDN script Material injects so the site is fully offline."""
    for root, _dirs, files in os.walk(site):
        for name in files:
            if not name.endswith(".html"):
                continue
            p = os.path.join(root, name)
            with open(p, encoding="utf-8") as fh:
                text = fh.read()
            fixed = text.replace(
                "https://unpkg.com/iframe-worker/shim",
                "assets/iframe-worker-shim.js",
            )
            if fixed != text:
                with open(p, "w", encoding="utf-8") as fh:
                    fh.write(fixed)


if __name__ == "__main__":
    prep()
    if "--no-build" not in sys.argv:
        sys.exit(build())
