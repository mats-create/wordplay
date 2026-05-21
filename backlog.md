# Wordplay — Backlog

**App:** https://mats-create.github.io/wordplay  
**Repo:** https://github.com/mats-create/wordplay  
**Brand:** Nutmeg&Needle — nutmegneedle.com — "Handcrafted football moves"

---

## Active priorities (in order)

### 1. Infrastructure cleanup
Remove leftover Cloud Function infrastructure from a failed earlier attempt.

**Steps:**
1. Delete `askKevin` Cloud Function in Firebase Console
2. Downgrade Firebase project from Blaze to Spark plan
3. Delete `functions/` folder from repo
4. Delete `firebase.json` from repo
5. Confirm `deploy.yml` workflow is already deleted

**Complexity:** Low (manual steps in Firebase Console + repo)

---

### 2. Bold / normal font toggle
Add a second letter bitmap map (`LETTERS_BOLD`) with thickened strokes. Toggle stored on the shoutout, passed into `buildGrid`, which selects the right map.

**Scope:**
- Design 26+ bold bitmaps (7 rows tall, consistent with existing style)
- Add `bold` boolean field to shoutout form (toggle: Normal / Bold)
- `buildGrid` accepts `bold` param, selects `LETTERS` or `LETTERS_BOLD`
- Canvas and all export paths (SVG, PDF) pick it up automatically

**Files:** `constants.js`, `grid.js`, `components.js`  
**Complexity:** Low–medium (code is simple; bitmap design takes care)

---

### 3. Thread roles 4–6
Extend the thread system from 3 to 6 slots. Threads 4–6 are border-only extras.

**Scope:**
- Add new grid cell kinds `H`, `I`, `J` for threads 4, 5, 6
- Add `color4`, `color5`, `color6` colour names in border spec system
- Update `stitchColor` (grid.js) and `pdfStitchColor` (pdf.js)
- Update Kevin system prompt with new colour names and thread slots
- Default threads stay at 3; threads 4–6 are optional extras

**Files:** `grid.js`, `pdf.js`, `kevin.js`  
**Complexity:** Medium

---

### 4. Multi-row shoutouts
User enters text with explicit line breaks. Each line independently scaled to fill available width.

**Scope:**
- Input accepts newline-separated lines
- `buildGrid` rewritten to accept a line array
- Each line independently auto-scaled
- Short lines scale up, long lines scale down

**Files:** `grid.js`, `components.js`  
**Complexity:** High (buildGrid rewrite)

---

### 5. Aida print orientation selector *(low priority)*
Portrait/landscape toggle on the Aida Print PDF. Currently always portrait A4. Low value while designs are square — revisit if rectangular formats are introduced.

**Files:** `pdf.js`, `sheets.js`  
**Complexity:** Low

---

## Completed (May 2026)

| Feature | Notes |
|---------|-------|
| Search / filter | Live search bar in both screens, filters by name/style/traits |
| Folder structure | Tag-based, Firestore-backed, folder pills + move-to-folder in detail |
| Kevin markdown rendering | marked.js CDN, system prompt tightened |
| Favicon | Cross-stitch X + coral L-bracket corners, all sizes |
| DMC colour picker | 324 colours, replaces native color input on thread rows |
| Thread colour rendering | Position-based mapping (slot 1=text, 2=border primary, 3=accent) |
| Digit bitmaps 0–9 | Added to LETTERS map, 7-row style consistent with alphabet |
| Two-size corner motifs | Standard (9×9/inset 7) and enlarged (11×11/inset 8), Kevin aware |
| `getBorderSpec` tool | Kevin can read full border spec before adapting it |
| `listBorders` enhancement | Returns `cornerMotifSizeLabel` (standard/enlarged/none) |
| App restructure | Single index.html → src/ files, GitHub Actions build pipeline |
| Layout reboot | Desktop two-column (topbar nav + Kevin panel), mobile bottom sheet |

---

## Architecture notes

**Stack:** React 18 (CDN), Babel standalone, Firebase Auth + Firestore, jsPDF, marked.js, Anthropic API  
**Build:** `python3 build.py` assembles `src/` into `index.html`; GitHub Actions triggers on `src/**` push  
**Hosting:** GitHub Pages (`main` branch)

**src/ file map:**
| File | Contents |
|------|----------|
| `constants.js` | React hooks destructure, LETTERS bitmaps, DIACRITICS, BUILTIN_BORDERS |
| `grid.js` | buildGrid, renderBorderSpec, BORDER_SPECS, stitchColor, CrossStitchCanvas |
| `utils.js` | useToast, formatDate, Ico icons, DEFAULT_THREADS, validation helpers |
| `dmc.js` | DMC_COLOURS dataset (324 colours) |
| `components.js` | DmcPickerSheet, ThreadRow, BorderPicker, ShoutoutForm |
| `pdf.js` | Chart PDF, Aida Print PDF, pdfStitchColor |
| `sheets.js` | AidaOptionsSheet, ShoutoutDetail, BorderForm, BorderDetail, ConfirmDialog, TopBar, SignInScreen |
| `screens.js` | ShoutoutsScreen, BordersScreen |
| `kevin.js` | Kevin API engine, tools, executor, system prompt, checkTrademark |
| `kevin-chat.js` | KevinChat component, KEVIN_SUGGESTIONS, TrademarkNotice |
| `app.js` | App component, ReactDOM.createRoot |
| `style.css` | All CSS |

**Thread role system (position-based):**
- Thread 1 → text colour (kinds T, B, A, F)
- Thread 2 → border primary (kinds D, G)
- Thread 3 → border accent (kinds E, S)
- Threads 4–6 → planned (kinds H, I, J / color4, color5, color6)

**Kevin tools:** listShoutouts, listBorders, getBorderSpec, createShoutout, updateShoutout, deleteShoutout, createBorder, updateBorder, deleteBorder, undoLastAction

**Corner motif sizes:**
- Standard: 9×9 pattern, cornerInset 7
- Enlarged: 11×11 pattern, cornerInset 8

**Brand palette:**
- Pitch black #1A1A1A · Coral #CC3300 · Pitch green #4A6741 · Linen #F0E6D3 · Off white #F5F5F5 · Mid grey #666666

**DMC threads (defaults):**
- DMC 310 Pitch black · DMC 3362 Pitch green · DMC 350 Coral
