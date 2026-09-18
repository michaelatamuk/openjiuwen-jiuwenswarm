# Offline study kit

Everything here is generated from the docs one level up. It is designed to be
read **offline / on a plane** on both Windows and Android.

## What's here

| Artifact | Path | Use |
|---|---|---|
| **Single-file HTML app** | `dist/jiuwenswarm-interview-offline.html` | The best phone/plane option: one file, no server, no internet. Search, tap-to-reveal, dark/light. |
| **Offline website** | `site/index.html` (after `build_study.py`) | Nice desktop reading (MkDocs Material): nav, search, dark mode, Mermaid. Fully local assets. |
| **Anki deck** | `dist/jiuwen-interview.apkg` | Spaced repetition. Import into Anki (Windows) / AnkiDroid (Android), sync free via AnkiWeb. |
| **Anki CSV** | `dist/jiuwen-interview-anki.csv` | Same cards if you prefer plain import. |

## Use it

**Windows**
- Read: open `dist/jiuwenswarm-interview-offline.html`, or the site at `site/index.html`.
- Spaced repetition: install Anki, `File -> Import` the `.apkg` (or the CSV).

**Android**
- Copy `dist/jiuwenswarm-interview-offline.html` to the phone and open it in Chrome
  (works with no network).
- Spaced repetition: install **AnkiDroid**, open the `.apkg` (transfer via USB,
  cloud drive, or `adb push`), sign in to AnkiWeb to sync with desktop.
- Alternative readers: **Obsidian** (open the parent folder as a vault) or **Markor**.

## Read the wiki on Android (offline)

The wiki is `site/` — one page per topic. Pick one of these:

1. **Local HTTP server (full search).** Build once, then:
   - Desktop: `python serve.py` and open `http://localhost:8000/`.
   - Phone on the same Wi-Fi: open the LAN URL `serve.py` prints.
   - Fully offline on the phone: install **Termux**, copy `dist/jiuwenswarm-site.zip`
     (or the `site/` folder) over, then `pkg install python` and
     `python -m http.server 8000`; open `http://localhost:8000/`.
   - *Why a server:* Android opens local HTML through `content://` URIs, which
     breaks the relative links between topic pages. A localhost server fixes
     navigation **and** makes search work.
2. **PWA (nicest phone feel).** Host `site/` once on any static host (GitHub
   Pages, Cloudflare Pages, Netlify), open it in Chrome, then
   *Add to Home screen* — it becomes an offline, app-like wiki with one page per
   topic.
3. **Obsidian (no build).** Copy the whole `interview_questions` folder to the
   phone and open it as a **vault**: separate notes per topic, links, search,
   fully offline, native Mermaid.

## Rebuild

```bash
# one-time toolchain (isolated venv)
uv venv .venv
uv pip install --python .venv/Scripts/python.exe mkdocs-material genanki

# website (also copies assets and runs the offline fix-up)
python build_study.py

# single-file HTML + Anki deck
.venv/Scripts/python.exe build_singlefile.py
.venv/Scripts/python.exe anki_export.py
```

`build_study.py` copies the `01-10` and `90-93` files into `docs/`, so the
generated `docs/` and `site/` folders are disposable.

## Study features

- **Study mode** toggles hiding of every answer; tap a question to reveal it.
- **Search** filters questions as you type.
- **Jump to topic** dropdown for quick navigation.
- Progress is not tracked (keep it stateless); use Anki for retention tracking.
