# Wordplay — Backlog

**App:** https://mats-create.github.io/wordplay
**Repo:** https://github.com/mats-create/wordplay
**Brand:** Nutmeg&Needle — nutmegneedle.com — "Handcrafted football moves"

---

## Active priorities (in order)

### 1. Border ownership full migration *(low priority)*
Proper migration of all existing shared custom borders to their respective
owner's `users/{uid}/borders/` collection. Requires a one-time admin script
that reads `createdBy` field and moves documents accordingly.

**Complexity:** Low (script) — but needs careful timing

---

### 2. Aida count selector

**User story:** As a user I want to choose the Aida fabric count for my design
so the app automatically suggests the correct stitch count and strand count to
maintain the target finished size and appropriate stitch coverage.

**Background:** The count refers to stitches per inch — lower = coarser/easier.
- 14-count: standard, 2 strands, 94×94 stitches ≈ 17×17cm
- 11-count: beginner-friendly, 3 strands, 82×82 stitches ≈ 19×19cm
- 18-count: fine/advanced, 1-2 strands, smaller finished size

**Target finished size: 19×19cm** (Nutmeg&Needle standard hoop).
Stitch count formula: `round(19 / 2.54 × count)` → 11-count = 82, 14-count = 104.
Current 94×94 default on 14-count gives 17.1cm — worth correcting to 104×104
for a true 19cm finish, or document as intentional.

**What changes:**
- Aida count selector in ShoutoutForm (11 / 14 / 18) — default 14
- Auto-suggests stitch count when count is changed (user can override)
- Auto-sets strand default (11→3, 14→2, 18→1)
- Detail view shows e.g. "11-count Aida · 3-strand" instead of hardcoded "14-count"
- Thread length calculation already adapts via strand count
- Kevin aware: knows count affects stitch count and strand recommendation

**Files:** `components.js`, `sheets.js`, `kevin.js`, `style.css`
**Complexity:** Low

---

### 3. Border tile pattern system

**Replaces:** Chunky border mode + Border row pattern editor (both retired)

**Summary:** A unified system for repeating tile patterns per border layer,
double-stitch width support, and a corner fill colour. Low rendering complexity,
medium UI complexity. Kevin-friendly from day one.

**New spec fields:**
- `borderWeight`: 1 (default) or 2 (double-stitch)
- Per layer: `tile` — 8-char binary string e.g. `"10001000"`. Stitch drawn at
  position i only if `tile[i%8] === '1'`. No tile = solid (backwards compatible).
- `cornerFill`: colour name. All 4 frame corners fill solid in this colour
  regardless of tile pattern on the sides.

**Double-stitch rules:**
- Max 3 layers, tiles locked to solid, beginner-friendly
- Corner fill still configurable
- Shoutout area still usable — auto-scale handles the reduced interior

**UI:**
- Tile editor: 8-cell row per layer, tap to toggle (32px cells)
- Single / Double stitch toggle
- Corner fill colour picker (6 slot options)
- Preview colour picker (all 6 thread slots, not saved — try-on only)

**renderBorderSpec changes:** ~10 lines. Tile check per stitch, corner zone
solid fill, layer loop multiplied by borderWeight.

**Kevin:** Tile strings are the same binary format Kevin already uses for motif
patterns. System prompt updated with tile, borderWeight, cornerFill fields.

**Files:** `grid.js`, `pdf.js`, `sheets.js`, `kevin.js`, `style.css`
**Complexity:** Low (rendering) + Medium (UI)

---

### 4. Border/object preview colour picker

**User story:** As a user I want to temporarily assign thread colours to a border
or object while designing it, so I can visualise how it will look in a specific
colour scheme without committing those colours permanently.

**Design:** "Try on" colour picker — UI only, nothing saved to the border/object.
- In BorderDetail and BorderForm: all 6 thread slot swatches with colour picker
- Canvas re-renders with temporary colours applied
- Reset button restores defaults
- Works for both border and object previews (shared component)
- Kevin-aware: can suggest "let me show you this in Liverpool colours"

**Files:** `sheets.js`, `components.js`, `style.css`
**Complexity:** Low–medium

---

### 5. Aida print orientation selector *(low priority)*
Portrait/landscape toggle on the Aida Print PDF. Currently always portrait A4.
Low value while designs are square — revisit if rectangular formats introduced.

**Files:** `pdf.js`, `sheets.js`
**Complexity:** Low

---

## Completed

| Feature | Notes |
|---------|-------|
| Motif object library | Objects tab, stitch editor, Kevin tools, per-user Firestore |
| Border ownership migration | Custom borders moved to users/{uid}/borders/ |
| Kevin vision — image-to-motif | Image upload in Kevin chat, base64 to API, bitmap generation |
| Extended thread roles + swatch rendering | 6 named slots, Kevin swatches, border3/accent1/accent2 |
| Multi-row shoutouts | Up to 4 lines, per-line S/N/L size, auto-expanding grid, centred |
| Per-position border overrides | cornerOverrides + sideOverrides, 8 independent positions |
| Text size toggle | Small/Normal/Large segmented control, Normal=auto-scale default |
| Thread length calculation | Per-thread cm estimate in detail view and edit form |
| Search / filter | Live search bar in both screens, filters by name/style/traits |
| Folder structure | Tag-based, Firestore-backed, folder pills + move-to-folder |
| Infrastructure cleanup | Cloud Function deleted, Firebase downgraded to Spark |
| Kevin markdown rendering | marked.js CDN, system prompt tightened |
| Favicon | Cross-stitch X + coral L-bracket corners, all sizes |
| DMC colour picker | 324 colours, replaces native color input on thread rows |
| Thread colour rendering | Position-based mapping (slot 1=text, 2=border primary, 3=accent) |
| Digit bitmaps 0–9 | Added to LETTERS map, 7-row style consistent with alphabet |
| Two-size corner motifs | Standard (9×9/inset 7) and enlarged (11×11/inset 8), Kevin aware |
| getBorderSpec tool | Kevin can read full border spec before adapting it |
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
| `grid.js` | buildGrid, buildGridMulti, renderBorderSpec, BORDER_SPECS, stitchColor, calculateThreadLengths, CrossStitchCanvas |
| `utils.js` | useToast, formatDate, Ico icons, DEFAULT_THREADS, THREAD_SLOTS, validation |
| `dmc.js` | DMC_COLOURS dataset (324 colours) |
| `components.js` | DmcPickerSheet, ThreadRow, BorderPicker, ShoutoutForm |
| `pdf.js` | Chart PDF, Aida Print PDF, pdfStitchColor |
| `sheets.js` | ObjectEditor, ObjectDetail, AidaOptionsSheet, ShoutoutDetail, BorderForm, BorderDetail, ConfirmDialog, TopBar, SignInScreen |
| `screens.js` | ShoutoutsScreen, BordersScreen, ObjectsScreen, ObjectPreview |
| `kevin.js` | Kevin API engine, tools, executor, system prompt |
| `kevin-chat.js` | KevinChat component, KEVIN_SUGGESTIONS, TrademarkNotice |
| `app.js` | App component, ReactDOM.createRoot |
| `style.css` | All CSS |

**Thread slot naming:**
| Slot | Name | Grid kinds |
|------|------|-----------|
| 1 | Shoutout | T, B, A, F |
| 2 | Border 1 | D, G |
| 3 | Border 2 | E, S |
| 4 | Border 3 | H, I |
| 5 | Accent 1 | J, K |
| 6 | Accent 2 | L, M |

**Border spec format:**
```json
{
  "layers": [{"line": 0, "type": "solid|check|empty", "color": "primary|secondary|accent|border3|accent1|accent2", "tile": "10001000"}],
  "cornerMotif": {"color": "primary", "pattern": ["011...", ...]},
  "sideMotifs": [{"position": "top-bottom|left-right|all", "color": "accent", "pattern": [...]}],
  "cornerOverrides": {"topLeft": {color, pattern}, ...},
  "sideOverrides": {"top": {color, pattern}, ...},
  "cornerInset": 7,
  "borderWeight": 1,
  "cornerFill": "primary"
}
```

**Firestore collections:**
- `borders/{id}` — built-in borders only (shared)
- `users/{uid}/borders/{id}` — custom borders (per-user)
- `users/{uid}/shoutouts/{id}` — shoutouts (per-user)
- `users/{uid}/objects/{id}` — motif objects (per-user)
- `users/{uid}/settings/kevin` — API key
- `users/{uid}/settings/folders` — folder lists

**Brand palette:**
- Pitch black #1A1A1A · Coral #CC3300 · Pitch green #4A6741 · Linen #F0E6D3 · Off white #F5F5F5 · Mid grey #666666

**Design principle:** Always optimise for beginner/introductory level embroiderers.
DMC thread = 6 strands; use 2 strands on 14-count Aida (standard).
DMC Perlé #5 = ready-to-use alternative (no separation needed).
Thread length formula: `stitch_count × 5cm × 1.15 waste`, rounded to 5cm.

---

### 6. Composite (multi-layer) objects *(high priority)*

**Summary:** Extend the object system to support multi-colour designs — flags,
emblems, complex motifs — as a stack of binary layers, each mapped to a thread
slot colour. Fully backwards compatible with existing single-colour objects.

**Use case:** World Cup flag objects, creative multi-colour corner motifs.
Symmetry convention: 2-colour flags → 10×12, 3-colour → 9×12, cross flags → 9×9 or 12×12.

**Data model:**
Objects gain an optional `layers` array. If present, the object is composite:
```
{
  name: "Brazil flag",
  width: 9, height: 9,
  layers: [
    { colorSlot: "secondary", pattern: ["111111111", ...] },
    { colorSlot: "accent",    pattern: ["000000000", ...] },
    { colorSlot: "border3",   pattern: ["000000000", ...] }
  ]
}
```
Single-colour objects unchanged (no layers field). Max 4 layers per composite object.
Layer colours must map to existing thread slots (primary/secondary/accent/border3/accent1/accent2).

**Object editor changes:**
- Layer tabs across top of stitch editor (Layer 1, 2, 3... with colour dot)
- Edit one layer at a time — same 32px cell grid as today
- Compound view tab — renders all layers together with actual slot colours.
  Overlapping cells highlighted in coral as a placement warning.
- Add/remove layer buttons (max 4)
- Each layer has a colour slot selector

**Border renderer:** composite objects iterate layers, draw each with its slot colour.
Same renderBorderSpec logic, one extra loop.

**Kevin:** understands composite objects, can generate flag patterns as layered binary
arrays. Knows symmetry conventions. Can identify overlap conflicts in compound view.

**Files:** `constants.js` (or grid.js), `sheets.js`, `screens.js`, `kevin.js`, `style.css`
**Complexity:** Medium

---

### 7. Thread colour editor for shoutout designs *(high priority)*

**Summary:** Replace the abstract slot name system in ShoutoutDetail and ShoutoutForm
with a visual, swatch-first colour editor. Slot names ("Accent 1") become secondary
labels — the colour swatch is the primary UI element.

**Problem today:** Users see "Shoutout · Border 1 · Accent 1" as labels with small
colour dots. No intuitive way to understand which colour is which while designing.
Memory required to connect slot names to visual output.

**Design:**
- Each thread slot shown as a large colour swatch (32×32px minimum) with the DMC
  number and a short role description below ("Shoutout text", "Border outer", etc.)
- Tap swatch → opens DMC colour picker (already exists as DmcPickerSheet)
- Slot name shown small below the swatch as secondary info
- Thread lengths update automatically when colour changes
- Works in both ShoutoutForm (editing) and ShoutoutDetail (viewing)
- Potentially a shared ThreadPalette component reused across both

**Kevin integration:** Kevin can describe colour choices visually ("warm red for
the text, dark green for the border") rather than by slot name.

**Files:** `components.js`, `sheets.js`, `style.css`
**Complexity:** Low–medium

