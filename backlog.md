# Wordplay — Backlog

**App:** https://mats-create.github.io/wordplay  
**Repo:** https://github.com/mats-create/wordplay  
**Brand:** Nutmeg&Needle — nutmegneedle.com — "Handcrafted football moves"

---

## Active priorities (in order)


**User story:** As a producing user, I want to see the estimated length of thread required per colour to complete a shoutout embroidery (border and words), so I can efficiently assemble kits and monitor stock.

**Calculation method:**
- Count stitches per thread slot from the rendered grid (same grid as canvas)
- Formula per thread: `stitch_count × 2.5cm × 1.15` (2.5cm per stitch, 15% waste factor for tying off)
- Result rounded to nearest 5cm
- Calculation is grid-agnostic — works correctly for any design regardless of bold/normal, single/multi-row, or border style

**Triggers:**
- Runs automatically on shoutout save (create or update)
- Stored as `threadLengths: [{dmc, cm}]` on the Firestore document
- Manual "Recalculate" button in the edit form triggers against current unsaved state
- Recalculate button shows brief "Calculating…" state

**Display — detail view:**
- Read-only length shown per thread row: e.g. `~145 cm`
- Shows `—` if no calculation has been run yet

**Display — edit form:**
- Same read-only field per thread row, from last saved calculation
- Updates after manual recalculate, not live while editing

**Out of scope:** total combined length, low-stock warnings, per-section breakdown (border vs words)

**Files:** `grid.js`, `components.js`, `sheets.js`, `app.js`  
**Complexity:** Medium

---

### 1. Border ownership migration (quick fix)
Move custom (non-built-in) borders from shared `borders/` collection to
`users/{uid}/borders/` so each user has their own private border library.
Built-in borders remain in the shared collection.

**Approach (straightforward):** Update border listeners and CRUD in `app.js`
to read/write custom borders from `users/{uid}/borders/`. Built-in borders
still seeded/read from shared `borders/`. Kevin tools updated to write to the
correct collection based on `builtIn` flag. Existing shared custom borders
grandfathered — they remain visible to all users until a proper migration
is done (see low-priority migration item below).

**Files:** `app.js`, `kevin.js`
**Complexity:** Medium

---

### 2. Motif object library

**User story:** As a user I want a library of reusable stitch motif objects
created by me or Kevin, with a visual stitch editor, so I can build up a
personal collection of patterns for use in border designs.

**Scope:**
- Per-user Firestore collection: `users/{uid}/objects/{objectId}`
  Fields: `name`, `pattern` (string[]), `width`, `height`, `createdAt`, `updatedAt`
- Third tab in app: Objects — list view with search, similar to Shoutouts/Borders
- Add, edit, rename, delete objects
- No colour management — patterns are pure binary (0/1)

**Stitch editor:**
- Grid where each cell = one stitch, rendered at ~32px per cell
- Tap/click to toggle stitch on/off (rendered as X cross-stitch symbol)
- Shown in isolation (not in border context)
- Resize option: change width and height independently
- Max dimensions based on British Classic border limits:
  - Top/bottom motifs: max 41 stitches wide
  - Left/right motifs: max 9 stitches tall
  - Corner motifs: max 11×11 (enlarged standard)
- New object starts as a blank 9×9 grid

**Kevin integration:**
- New tools: `listObjects`, `createObject`, `updateObject`, `deleteObject`
- Kevin can generate a pattern (from vision or from scratch) and save it
  directly to the object library
- Kevin can retrieve objects by name and use them in border specs
- Kevin context includes object count and names

**TopBar update (item 5 from UX list):**
- Order: Logo+Appname | [Shoutouts] [Borders] [Objects] | [CK] | Avatar
- Consistent spacing, nav tabs visually grouped
- Objects tab uses a suitable icon (e.g. grid/pattern icon)

**Files:** `app.js`, `screens.js`, `sheets.js`, `kevin.js`, `style.css`, `utils.js`
**Complexity:** High

---

### 3. Border ownership full migration *(low priority)*
Proper migration of all existing shared custom borders to their respective
owner's `users/{uid}/borders/` collection. Requires a one-time admin script
that reads `createdBy` field and moves documents accordingly. Only needed
after item 1 is shipped and users have been using the app for a while.

**Complexity:** Low (script) — but needs careful timing

---

### 4. Aida count selector

**User story:** As a user I want to choose the Aida fabric count for my design
so the app automatically suggests the correct stitch count and strand count to
maintain the target finished size and appropriate stitch coverage.

**Background:** The count refers to stitches per inch — lower = coarser/easier.
- 14-count: standard, 2 strands, 94×94 stitches ≈ 17×17cm
- 11-count: beginner-friendly, 3 strands, 82×82 stitches ≈ 19×19cm
- 18-count: fine/advanced, 1-2 strands, smaller finished size

**Target finished size: 19×19cm** (Nutmeg&Needle standard hoop).
Stitch count formula: `round(19 / 2.54 × count)` → 11-count = 82, 14-count = 104, etc.
Current 94×94 default on 14-count gives 17.1cm — worth correcting to 104×104
for a true 19cm finish, or document as intentional.

**What changes:**
- Aida count selector in ShoutoutForm (11 / 14 / 18) — default 14
- Auto-suggests stitch count when count is changed (user can override)
- Auto-sets strand default (11→3, 14→2, 18→1)
- Detail view shows e.g. "11-count Aida · 3-strand" instead of hardcoded "14-count"
- Thread length calculation already adapts via strand count
- Kevin aware: knows count affects stitch count and strand recommendation

**Kevin awareness:**
- Kevin knows the three counts, their stitch counts and strand defaults
- Can recommend 11-count for beginners ("easier to stitch, larger holes")
- Can recommend 14-count as the standard
- When creating/updating a shoutout, Kevin sets `stitchesW`, `stitchesH`
  and `strands` correctly for the chosen count
- Kevin context includes the shoutout's current Aida count so he can
  reference it in conversation

**Files:** `components.js`, `sheets.js`, `kevin.js`, `style.css`
**Complexity:** Low

---

### 5. Chunky border mode (beginner-friendly)

**User story:** As a beginner stitcher I want an option for thicker border
lines that are easier to follow and count, making the design more approachable.

**Design:** A `borderWeight` field on the shoutout — `normal` (default, 1 stitch
wide) or `chunky` (2 stitches wide). When chunky is selected, `renderBorderSpec`
draws every border layer 2 stitches wide instead of 1. Corner and side motifs
are also scaled up (or shifted) to account for the extra width. All border
designs work in chunky mode — simplification of motifs is a design decision
left to the user or Kevin, not enforced by the system.

**UI:** Simple toggle in ShoutoutForm alongside the border picker —
Normal / Chunky. Kevin aware: can set borderWeight when creating/updating
shoutouts. Kevin can recommend chunky + simplified motifs for beginner designs.

**Scope:** Border rendering only. Text/word rendering unchanged.

**Canvas + PDF:** Both paths respect borderWeight via renderBorderSpec.

**Files:** `grid.js`, `pdf.js`, `components.js`, `kevin.js`, `style.css`  
**Complexity:** Medium

---

### 6. Aida print orientation selector *(low priority)*
Portrait/landscape toggle on the Aida Print PDF. Currently always portrait A4. Low value while designs are square — revisit if rectangular formats are introduced.

**Files:** `pdf.js`, `sheets.js`  
**Complexity:** Low

---

## Completed (May 2026)

| Feature | Notes |
|---------|-------|
| Kevin vision — image-to-motif | Image upload in Kevin chat, base64 to API, bitmap generation |
| Extended thread roles + swatch rendering | 6 named slots, Kevin swatches, border3/accent1/accent2 colour names |
| Multi-row shoutouts | Up to 4 lines, per-line S/N/L size, auto-expanding grid, centred |
| Per-position border overrides | cornerOverrides + sideOverrides, 8 independent positions, Kevin-aware |
| Text size toggle | Small/Normal/Large segmented control, Normal=auto-scale default |
| Thread length calculation | Per-thread cm estimate in detail view and edit form, auto-calc on save |
| Infrastructure cleanup | Cloud Function deleted, Firebase downgraded to Spark, repo cleaned |
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
