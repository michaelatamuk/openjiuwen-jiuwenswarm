#!/usr/bin/env python
"""Build ONE self-contained offline HTML study app from the interview docs.

No server, no network: Mermaid is inlined, search is client-side, answers can
be hidden for self-quizzing. Output: study/dist/jiuwenswarm-interview-offline.html

Run with an interpreter that has `markdown` and `pymdown-extensions`
(the mkdocs-material venv does).
"""
import os
import re
import glob
import html

import render_mermaid

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
DIST = os.path.join(HERE, "dist")
MERMAID = os.path.join(HERE, "assets", "mermaid.min.js")

try:
    import markdown
    from pymdownx.superfences import fence_code_format
    HAVE_MD = True
except Exception:
    HAVE_MD = False


def make_md():
    return markdown.Markdown(
        extensions=["extra", "sane_lists", "tables", "md_in_html", "admonition", "pymdownx.superfences"],
        extension_configs={"pymdownx.superfences": {"custom_fences": [
            {"name": "mermaid", "class": "mermaid", "format": fence_code_format}]}},
    )


def parse(path):
    lines = open(path, encoding="utf-8").read().split("\n")
    h1 = ""
    for ln in lines:
        if ln.startswith("# "):
            h1 = ln[2:].strip()
            break
    res, cur = [], None
    for ln in lines:
        m = re.match(r"^## (\d+)\.\s*(.+)$", ln)
        if m:
            if cur:
                res.append(cur)
            cur = {"num": int(m.group(1)), "title": m.group(2).strip(), "body": []}
        elif ln.startswith("## "):
            if cur:
                res.append(cur)
                cur = None
            cur = {"num": None, "title": ln[3:].strip(), "body": []}
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
    return h1, out


CSS = """
:root{--fg:#1b1b1f;--bg:#fff;--muted:#5b5b66;--line:#e2e2e8;--accent:#3f51b5;--card:#fafafe}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;font:16px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:var(--fg);background:var(--bg);-webkit-text-size-adjust:100%}
header{position:sticky;top:0;z-index:20;display:flex;gap:8px;align-items:center;padding:8px 12px;background:var(--accent);color:#fff;box-shadow:0 1px 4px rgba(0,0,0,.2);flex-wrap:wrap}
header h1{font-size:15px;margin:0;flex:1 1 auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
header input{flex:0 1 240px;padding:6px 10px;border-radius:6px;border:none;font-size:14px;min-width:120px}
header button{padding:6px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.6);background:transparent;color:#fff;font-size:13px;cursor:pointer;white-space:nowrap}
header select{padding:6px 8px;border-radius:6px;border:none;font-size:13px;max-width:180px}
main{max-width:900px;margin:0 auto;padding:16px}
h1.topic{font-size:22px;margin:28px 0 10px;padding-top:8px;border-top:2px solid var(--line)}
.qa{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin:12px 0}
.qa>h2{font-size:17px;margin:0 0 6px;cursor:pointer;color:var(--accent)}
h2{font-size:17px}
.qa-answer{display:block}
body.study .qa-answer{display:none}
body.study .qa.revealed .qa-answer{display:block}
.qa .hint{display:none;color:var(--muted);font-size:13px}
body.study .qa:not(.revealed) .hint{display:block}
a{color:var(--accent)}
code{background:#f0f0f4;padding:1px 4px;border-radius:4px;font-size:.9em}
pre{background:#f6f8fa;padding:10px;border-radius:8px;overflow:auto}
pre.mermaid{background:transparent;text-align:center}
table{border-collapse:collapse;width:100%;font-size:14px}
th,td{border:1px solid var(--line);padding:5px 7px;text-align:left}
sub{color:var(--muted)}
mark{background:#ffe680}
.mermaid svg{max-width:100%;height:auto}
.mermaid-svg{text-align:center;margin:10px 0;overflow:auto}
.mermaid-svg svg{max-width:100%;height:auto}
.top-link{display:block;text-align:right;font-size:12px;color:var(--muted);text-decoration:none}
@media(max-width:600px){header input{flex:1 1 100%}main{padding:10px}.qa{padding:10px}}
"""


def build():
    files = sorted(glob.glob(os.path.join(BASE, "[01][0-9]-*.md"))) + \
            sorted(glob.glob(os.path.join(BASE, "[9][0-9]-*.md")))
    body_parts = []
    toc_opts = []
    for i, f in enumerate(files):
        tid = f"t{i}"
        h1, blocks = parse(f)
        toc_opts.append(f'<option value="{tid}">{html.escape(h1)}</option>')
        body_parts.append(f'<h1 class="topic" id="{tid}">{html.escape(h1)}</h1>')
        for b in blocks:
            body_md = render_mermaid.transform(b["body"])
            md = make_md()
            inner = md.convert(body_md) if HAVE_MD else "<pre>" + html.escape(body_md) + "</pre>"
            is_qa = "**General:**" in b["body"] or "General:" in b["body"]
            label = f'{b["num"]}. {b["title"]}' if b["num"] else b["title"]
            if is_qa:
                body_parts.append(
                    f'<section class="qa"><h2>{html.escape(label)}</h2>'
                    f'<div class="hint">tap the question to reveal</div>'
                    f'<div class="qa-answer">{inner}</div></section>')
            else:
                body_parts.append(
                    f'<section class="ref"><h2>{html.escape(label)}</h2>{inner}</section>')

    mermaid_js = ""
    toc = "".join(toc_opts)

    doc = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Jiuwen Interview Prep - offline</title>
<style>{CSS}</style></head>
<body>
<header>
  <h1>Jiuwen Interview Prep</h1>
  <select id="jump" aria-label="Jump to topic"><option value="">Jump to...</option>{toc}</select>
  <input id="q" type="search" placeholder="search questions...">
  <button id="toggle" type="button">Study mode: OFF</button>
</header>
<main id="main">
{''.join(body_parts)}
</main>
<script>{mermaid_js}</script>
<script>
(function(){{
  var body=document.body, KEY='jq-offline-study';
  function mode(){{return localStorage.getItem(KEY)==='1';}}
  function setMode(v){{localStorage.setItem(KEY,v?'1':'0');body.classList.toggle('study',v);var b=document.getElementById('toggle');if(b)b.textContent='Study mode: '+(v?'ON':'OFF');}}
  document.getElementById('toggle').addEventListener('click',function(){{setMode(!mode());}});
  setMode(mode());
  document.querySelectorAll('.qa>h2').forEach(function(h){{h.addEventListener('click',function(){{h.parentElement.classList.toggle('revealed');}});}});
  var q=document.getElementById('q');
  q.addEventListener('input',function(){{
    var t=q.value.trim().toLowerCase();
    document.querySelectorAll('.qa,.ref').forEach(function(c){{
      var hit=!t||c.textContent.toLowerCase().indexOf(t)>=0;
      c.style.display=hit?'':'none';
    }});
    document.querySelectorAll('h1.topic').forEach(function(h){{
      var vis=false,n=h.nextElementSibling;
      while(n&&n.tagName!=='H1'){{if(n.style.display!=='none'){{vis=true;break;}}n=n.nextElementSibling;}}
      h.style.display=vis?'':'none';
    }});
  }});
  document.getElementById('jump').addEventListener('change',function(e){{if(e.target.value)location.hash=e.target.value;}});
}})();
</script>
</body></html>"""
    os.makedirs(DIST, exist_ok=True)
    out = os.path.join(DIST, "jiuwenswarm-interview-offline.html")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(doc)
    print("wrote", out, f"({len(doc)//1024} KB, {sum(1 for _ in re.finditer('<section class=.qa.', doc))} questions)")


if __name__ == "__main__":
    build()
