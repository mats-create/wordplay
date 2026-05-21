# Wordplay — Nutmeg&Needle

Cross-stitch embroidery pattern tool for football words, terms and exclamations.
Part of the [Nutmeg&Needle](https://nutmegneedle.com) brand — "Handcrafted football moves".

**Live app:** https://mats-create.github.io/wordplay

---

## What it does

- Create and manage **Football Shoutouts** — embroidery designs built from football words
- Choose from a **Border Library** of decorative perimeter patterns
- Live cross-stitch canvas preview with accurate stitch rendering
- Generate print-ready **Chart PDFs** and **Aida Print PDFs**
- **DMC colour picker** — 324 authentic thread colours
- **Thread length calculator** — estimated centimetres per colour per design
- **Text size control** — Small, Normal (auto), or Large
- **Folder organisation** — tag-based folders for shoutouts and borders
- **Search and filter** — live client-side search across both libraries
- **Claude-Kevin** — AI embroidery specialist and football expert, built in

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (CDN), Babel standalone |
| Database | Firebase Firestore |
| Auth | Firebase Auth (Google sign-in) |
| Hosting | GitHub Pages |
| PDF | jsPDF |
| AI | Anthropic API (claude-sonnet-4-6) |
| Build | Python (`build.py`) + GitHub Actions |

No local build tooling required. Push to `src/` → GitHub Actions assembles and deploys automatically.

---

## Project structure

```
src/
  constants.js   Letter bitmaps, diacritics, built-in border definitions
  grid.js        Grid engine, canvas component, thread length calculator
  utils.js       Hooks, icons, validation
  dmc.js         DMC colour dataset (324 colours)
  components.js  DMC picker, thread rows, shoutout form
  pdf.js         PDF generation
  sheets.js      Detail panels, forms, TopBar, SignIn
  screens.js     Shoutouts and borders list screens
  kevin.js       Claude-Kevin API engine
  kevin-chat.js  Kevin chat panel component
  app.js         Root App component
  style.css      All styles
build.py         Assembles src/ → index.html
backlog.md       Feature backlog
handover.md      Developer handover notes
```

---

## Development

No local setup needed. To make changes:

1. Edit the relevant file in `src/`
2. Push to `main`
3. GitHub Actions runs `build.py` and updates `index.html`
4. GitHub Pages serves the updated app within ~60 seconds

To run the build locally (optional):
```bash
python3 build.py
```

---

## Claude-Kevin

Kevin is an in-app AI assistant — embroidery specialist and football expert.
He can create, edit and delete shoutouts and borders directly from the chat.

**Setup:** Enter your Anthropic API key in the Kevin panel. It's saved to your
Firebase account and never stored in code.

**Tools available:** listShoutouts, listBorders, getBorderSpec, createShoutout,
updateShoutout, deleteShoutout, createBorder, updateBorder, deleteBorder, undoLastAction

---

## Brand

| Colour | Hex | DMC |
|--------|-----|-----|
| Pitch black | #1A1A1A | DMC 310 |
| Coral | #CC3300 | DMC 350 |
| Pitch green | #4A6741 | DMC 3362 |
| Linen | #F0E6D3 | — |

---

## Backlog

See [backlog.md](backlog.md) for prioritised feature list.
