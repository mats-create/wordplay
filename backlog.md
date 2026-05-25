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

### 1. Extended thread roles + swatch rendering

**Scope:** Extend thread system from 3 to 6 named slots, rename existing slots
for clarity, and add colour swatch rendering in both edit mode and Kevin chat.

**Thread slot naming (replaces positional numbering):**

| Slot | Name | Grid kinds | Notes |
|------|------|-----------|-------|
| 1 | Shoutout | T, B, A, F | Word/text colour — exists |
| 2 | Border 1 | D, G | Main border lines — exists |
| 3 | Border 2 | E, S | Secondary border — exists (was "accent") |
| 4 | Border 3 | H, I | Third border colour — new |
| 5 | Accent 1 | J, K | Decorative extras — new |
| 6 | Accent 2 | L, M | Decorative extras — new |

Names are human/Kevin labels only. Rendering is driven by grid kind mapping.
Naming does not restrict usage — Kevin assigns kinds when writing border specs.
Slots 4–6 are optional; designs with 3 threads continue to work unchanged.

**Colour names in border specs:**
Extend from `primary/secondary/accent` to also support
`border3`, `accent1`, `accent2` as colour names in layer and motif definitions.
`renderBorderSpec` and `pdfStitchColor` updated to map new kinds.

**Swatch rendering — edit mode:**
Thread rows already show colour swatches. Improvements:
- Display slot name ("Shoutout", "Border 1" etc.) as a small label above each row
- Swatch slightly larger and more prominent
- DMC name shown clearly alongside code

**Swatch rendering — Kevin chat:**
Kevin outputs a special inline marker `[swatch:#HEXCODE]` alongside thread
references. The markdown renderer in `kevin-chat.js` converts this to a small
inline coloured circle (12px, border-radius 50%, inline-block).
Kevin system prompt updated with the convention and instructed to use it
whenever listing or confirming thread colours.

**Kevin system prompt updates:**
- New slot names and grid kinds
- `border3`, `accent1`, `accent2` colour names in spec format
- Swatch marker convention `[swatch:#HEX]`
- Slots 4–6 are optional — only include when the design calls for them

**Files:** `grid.js`, `pdf.js`, `components.js`, `kevin.js`, `kevin-chat.js`, `style.css`  
**Complexity:** Medium

---

### 2. Multi-row shoutouts
User enters text with explicit line breaks. Each line independently scaled to fill available width.

**Scope:**
- Input accepts newline-separated lines
- `buildGrid` rewritten to accept a line array
- Each line independently auto-scaled
- Short lines scale up, long lines scale down

**Files:** `grid.js`, `components.js`  
**Complexity:** High (buildGrid rewrite)

---

### 3. Advanced border object overrides

**User story:** As a user I want to define the specs for individual objects in
a border design — changing thread colour, pattern shape, or orientation per
object. Use cases include emulating pitch corner areas (triangles pointing in
different directions), home/away colour asymmetry (left motif = home colour,
right motif = away colour), and other creative layouts.

**Scope:** Border objects only (corner motifs, side motifs). Not text.  
**Who sets it:** Both user (via UI) and Kevin (via tools).

**Design approach — per-object spec overrides:**
The current border spec defines corners and side motifs globally. This feature
adds an optional `overrides` map to the spec:
- `cornerOverrides`: topLeft, topRight, bottomLeft, bottomRight — each with
  optional `{color, pattern}` that overrides the global cornerMotif
- `sideOverrides`: top, bottom, left, right — each with optional `{color, pattern}`
  that overrides the global sideMotif for that position
- Positions without overrides use the global spec as normal
- Backwards compatible — existing specs unaffected

**Kevin:** Can set overrides when creating/updating a border. System prompt
updated with override format and position names.

**UI:** Advanced section in BorderForm — collapsible grid of 4 corner + 4 side
slots, each showing current pattern/colour with an edit option.

**renderBorderSpec:** Checks for override at each position before rendering
the global motif.

**Files:** `grid.js`, `sheets.js`, `kevin.js`, `style.css`  
**Complexity:** High

---

### 4. Kevin vision — image-to-motif conversion

**User story:** As a user I want to upload a reference image to Kevin so he
can interpret it and generate a cross-stitch bitmap pattern for use as a border
motif (corner or side). This lets me create custom motifs from real-world
references — football objects, pitch markings, symbols, sketches — without
needing to hand-craft binary strings.

**Flow:**
1. User uploads an image in the Kevin chat (photo, sketch, PNG/JPG)
2. Kevin analyses the image via Anthropic vision API
3. Kevin generates a simplified binary bitmap pattern at the target size
   (9×9 for standard, 11×11 for enlarged) — abstracting/simplifying as needed
4. Kevin shows the pattern as a preview in chat (rendered as a small grid)
5. User confirms or asks for adjustments
6. Kevin calls `createBorder` or `updateBorder` with the pattern embedded
   in the spec as a cornerMotif or sideMotif

**Known constraint — simplification:**
Cross-stitch motifs work at very small resolutions. Kevin must interpret the
essence of the source image rather than convert it literally. Complex images
will be heavily abstracted. This is by design and should be communicated to
the user ("I've simplified this to work at 9×9 stitches").

**Scope:** Border motifs only (corner and side). Not text, not full designs.

**Technical approach:**
- Anthropic API already supports base64 image input — used elsewhere in the app
- Kevin chat needs a file upload input (image only, PNG/JPG)
- Image sent to API alongside a prompt instructing Kevin to generate a bitmap
- Kevin renders a text-based preview of the pattern in chat before applying it
- No new tools needed — uses existing `createBorder`/`updateBorder`

**Files:** `kevin.js`, `kevin-chat.js`, `style.css`  
**Complexity:** Medium (vision API integration is straightforward; the hard
part is prompt engineering for reliable bitmap output)

---

### 5. Aida count selector

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

### 6. Chunky border mode (beginner-friendly)

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

### 7. Aida print orientation selector *(low priority)*
Portrait/landscape toggle on the Aida Print PDF. Currently always portrait A4. Low value while designs are square — revisit if rectangular formats are introduced.

**Files:** `pdf.js`, `sheets.js`  
**Complexity:** Low

---

## Completed (May 2026)

| Feature | Notes |
|---------|-------|
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
