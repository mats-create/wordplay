"""
GOAL! Cross-stitch pattern — Nutmeg&Needle branded layout v3
- Linen header + footer bars, black text/logo, coral ampersand
- Grid vertically centred in content area
- Legend with generous row spacing
"""

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── Fonts ─────────────────────────────────────────────────────────────────────
pdfmetrics.registerFont(TTFont('Inter-Bold',   'assets/fonts/Inter-Bold.ttf'))
pdfmetrics.registerFont(TTFont('Inter',        'assets/fonts/Inter-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Inter-Medium', 'assets/fonts/Inter-Medium.ttf'))

# ── Palette ───────────────────────────────────────────────────────────────────
C_BLACK  = HexColor("#1A1A1A")
C_CORAL  = HexColor("#CC3300")
C_GREEN  = HexColor("#4A6741")
C_LINEN  = HexColor("#F0E6D3")
C_OFFWHT = HexColor("#F5F5F5")
C_GREY   = HexColor("#666666")
C_LGREY  = HexColor("#CCCCCC")
C_MGREY  = HexColor("#999999")

# ── Page geometry ─────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4

HEADER_H = 16 * mm
FOOTER_H = 12 * mm
MARGIN_X = 14 * mm

# Content band between header and footer
CONTENT_TOP    = PAGE_H - HEADER_H
CONTENT_BOTTOM = FOOTER_H
CONTENT_H      = CONTENT_TOP - CONTENT_BOTTOM   # ~273mm

# ── Grid sizing ───────────────────────────────────────────────────────────────
COLS, ROWS = 110, 110
MAX_GRID   = PAGE_W - 2 * MARGIN_X              # ~182mm — full width
GRID_SIZE  = MAX_GRID
CELL       = GRID_SIZE / COLS
GRID_X     = (PAGE_W - GRID_SIZE) / 2

# Legend block height (generous)
LEGEND_H   = 28 * mm
AXIS_H     = 5 * mm                             # room for axis labels below grid
SUB_H      = 7 * mm                             # subtitle line above grid

# Total content block to centre
BLOCK_H    = SUB_H + GRID_SIZE + AXIS_H + LEGEND_H
PAD        = (CONTENT_H - BLOCK_H) / 2         # equal space above and below

# Y coordinates (reportlab: 0 = bottom of page)
LEGEND_Y_BOTTOM = CONTENT_BOTTOM + PAD                        # bottom of legend
GRID_Y          = LEGEND_Y_BOTTOM + LEGEND_H + AXIS_H         # bottom of grid
SUBTITLE_Y      = GRID_Y + GRID_SIZE + 3 * mm                 # subtitle baseline

# ── Letter bitmaps (7 tall, 2x scale) ─────────────────────────────────────────
G    = ["011110","100000","100111","100001","100001","100011","011110"]
O    = ["01110","10001","10001","10001","10001","10001","01110"]
A    = ["01110","10001","10001","11111","10001","10001","10001"]
L_   = ["10000","10000","10000","10000","10000","10000","11111"]
EXCL = ["1","1","1","1","0","0","1"]
LETTERS = [G, O, A, L_, EXCL]
SCALE = 2
GAP   = 4

def letter_width(letter): return len(letter[0]) * SCALE
def letter_height(): return 7 * SCALE

def total_text_width():
    return sum(letter_width(l) for l in LETTERS) + GAP * (len(LETTERS) - 1)

def render_text(grid):
    tw = total_text_width()
    th = letter_height()
    start_col = (COLS - tw) // 2
    start_row = (ROWS - th) // 2
    x = start_col
    for letter in LETTERS:
        for r, row_str in enumerate(letter):
            for c, ch in enumerate(row_str):
                if ch == "1":
                    for dr in range(SCALE):
                        for dc in range(SCALE):
                            gr = start_row + r * SCALE + dr
                            gc = x + c * SCALE + dc
                            if 0 <= gr < ROWS and 0 <= gc < COLS:
                                grid[gr][gc] = "T"
        x += letter_width(letter) + GAP
    return grid

def set_border_cell(grid, r, c, kind):
    if 0 <= r < ROWS and 0 <= c < COLS:
        if grid[r][c] == " ":
            grid[r][c] = kind

def render_border(grid):
    N = COLS
    for i in range(N):
        set_border_cell(grid, 0, i, "B")
        set_border_cell(grid, N-1, i, "B")
    for i in range(N):
        set_border_cell(grid, i, 0, "B")
        set_border_cell(grid, i, N-1, "B")
    for line in range(1, 5):
        for i in range(line, N-line):
            if line % 2 == 1:
                kt = "D" if i % 2 == 0 else "E"
                kb = "D" if i % 2 == 1 else "E"
                kl = "D" if i % 2 == 0 else "E"
                kr = "D" if i % 2 == 1 else "E"
            else:
                kt = kb = kl = kr = "A"
            set_border_cell(grid, line,     i, kt)
            set_border_cell(grid, N-1-line, i, kb)
            set_border_cell(grid, i, line,     kl)
            set_border_cell(grid, i, N-1-line, kr)
    ball_corners = [(7,7),(7,N-16),(N-16,7),(N-16,N-16)]
    ball = [
        "011101110","101010101","110101011","001111100",
        "011101110","001111100","110101011","101010101","011101110",
    ]
    for (br, bc) in ball_corners:
        for dr, row_str in enumerate(ball):
            for dc, ch in enumerate(row_str):
                if ch == "1":
                    set_border_cell(grid, br+dr, bc+dc, "F")
    gw, gh = 41, 9
    goal = []
    for row in range(gh):
        if row <= 5:   goal.append("11" + "0"*(gw-4) + "11")
        elif row == 6: goal.append("1" * gw)
        else:          goal.append("0" * gw)
    for side_row_start in [7, N-7-gh+1]:
        gc = (N - gw) // 2
        for dr, row_str in enumerate(goal):
            for dc, ch in enumerate(row_str):
                if ch == "1":
                    set_border_cell(grid, side_row_start+dr, gc+dc, "G")
    arrow = [
        "000010000","000111000","001111100","011111110","111111111",
        "011111110","001111100","000111000","000010000",
    ]
    for side_col_start in [7, N-16]:
        ar = (N - 9) // 2
        for dr, row_str in enumerate(arrow):
            for dc, ch in enumerate(row_str):
                if ch == "1":
                    set_border_cell(grid, ar+dr, side_col_start+dc, "S")
    return grid

def build_grid():
    grid = [[" "] * COLS for _ in range(ROWS)]
    render_border(grid)
    render_text(grid)
    return grid

def stitch_color(kind):
    return {
        "T": C_BLACK,  "B": C_BLACK,  "A": C_BLACK,  "F": C_BLACK,
        "D": C_GREEN,  "G": C_GREEN,
        "E": C_CORAL,  "S": C_CORAL,
    }.get(kind, None)

LEGEND_ITEMS = [
    ("Pitch black",  C_BLACK, "DMC 310",  "Text, border outlines, football"),
    ("Pitch green",  C_GREEN, "DMC 3362", "Goal post, diagonal check"),
    ("Coral",        C_CORAL, "DMC 350",  "Shot arrows, diagonal check"),
]

# ── Header ────────────────────────────────────────────────────────────────────
def draw_header(c):
    # Linen bar
    c.setFillColor(C_LINEN)
    c.rect(0, PAGE_H - HEADER_H, PAGE_W, HEADER_H, fill=1, stroke=0)

    # Thin black rule at bottom of header
    c.setStrokeColor(C_BLACK)
    c.setLineWidth(0.8)
    c.line(0, PAGE_H - HEADER_H, PAGE_W, PAGE_H - HEADER_H)

    mid_y = PAGE_H - HEADER_H / 2

    # Wordmark: Nutmeg (black) + & (coral) + Needle (black)
    c.setFont("Inter-Bold", 13)
    w_nutmeg = c.stringWidth("Nutmeg", "Inter-Bold", 13)
    w_amp    = c.stringWidth("&", "Inter-Bold", 13)
    w_needle = c.stringWidth("Needle", "Inter-Bold", 13)

    c.setFillColor(C_BLACK)
    c.drawString(MARGIN_X, mid_y - 4.5, "Nutmeg")
    c.setFillColor(C_CORAL)
    c.drawString(MARGIN_X + w_nutmeg, mid_y - 4.5, "&")
    c.setFillColor(C_BLACK)
    c.drawString(MARGIN_X + w_nutmeg + w_amp, mid_y - 4.5, "Needle")

    # Tagline (green, smaller)
    wm_total = w_nutmeg + w_amp + w_needle
    c.setFont("Inter", 7.5)
    c.setFillColor(C_GREEN)
    c.drawString(MARGIN_X + wm_total + 5*mm, mid_y - 2.8, "Handcrafted football moves")

    # Pattern name right-aligned (black)
    c.setFont("Inter-Bold", 9)
    c.setFillColor(C_BLACK)
    c.drawRightString(PAGE_W - MARGIN_X, mid_y - 3, "GOAL!  Cross-stitch pattern")

# ── Footer ────────────────────────────────────────────────────────────────────
def draw_footer(c, page_num=1):
    # Linen bar
    c.setFillColor(C_LINEN)
    c.rect(0, 0, PAGE_W, FOOTER_H, fill=1, stroke=0)

    # Thin black rule at top of footer
    c.setStrokeColor(C_BLACK)
    c.setLineWidth(0.8)
    c.line(0, FOOTER_H, PAGE_W, FOOTER_H)

    mid_y = FOOTER_H / 2

    # Wordmark left
    c.setFont("Inter-Bold", 8)
    w_nutmeg = c.stringWidth("Nutmeg", "Inter-Bold", 8)
    w_amp    = c.stringWidth("&", "Inter-Bold", 8)
    c.setFillColor(C_BLACK)
    c.drawString(MARGIN_X, mid_y - 2.8, "Nutmeg")
    c.setFillColor(C_CORAL)
    c.drawString(MARGIN_X + w_nutmeg, mid_y - 2.8, "&")
    c.setFillColor(C_BLACK)
    c.drawString(MARGIN_X + w_nutmeg + w_amp, mid_y - 2.8, "Needle")

    # URL right (grey)
    c.setFont("Inter", 8)
    c.setFillColor(C_GREY)
    c.drawRightString(PAGE_W - MARGIN_X, mid_y - 2.8, "nutmegneedle.com")

    # Page number centre
    c.setFont("Inter", 7)
    c.setFillColor(C_MGREY)
    c.drawCentredString(PAGE_W / 2, mid_y - 2.5, str(page_num))

# ── Main ──────────────────────────────────────────────────────────────────────
def make_pdf(filename):
    grid = build_grid()

    print(f"Grid size: {GRID_SIZE/mm:.1f}mm sq  |  Cell: {CELL:.2f}pt")
    print(f"Block height: {(SUB_H + GRID_SIZE + AXIS_H + LEGEND_H)/mm:.1f}mm")
    print(f"Content height: {CONTENT_H/mm:.1f}mm  |  Padding each side: {PAD/mm:.1f}mm")
    print(f"Grid bottom Y: {GRID_Y/mm:.1f}mm  |  Grid top Y: {(GRID_Y+GRID_SIZE)/mm:.1f}mm")

    c = rl_canvas.Canvas(filename, pagesize=A4)
    c.setTitle("GOAL! Cross-Stitch Pattern - Nutmeg&Needle")

    # Page bg (off-white)
    c.setFillColor(C_OFFWHT)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    draw_header(c)
    draw_footer(c, 1)

    # ── Subtitle (spec line above grid) ──
    c.setFont("Inter", 7)
    c.setFillColor(C_GREY)
    c.drawString(MARGIN_X, SUBTITLE_Y,
        "110 × 110 stitches  ·  14-count Aida  ·  ~197 × 197mm finished  ·  fits 280 × 250mm hoop")

    # ── Grid linen background ──
    c.setFillColor(C_LINEN)
    c.rect(GRID_X, GRID_Y, GRID_SIZE, GRID_SIZE, fill=1, stroke=0)

    # ── Stitches ──
    for row in range(ROWS):
        for col in range(COLS):
            kind = grid[row][col]
            if kind == " ":
                continue
            x = GRID_X + col * CELL
            y = GRID_Y + (ROWS - 1 - row) * CELL
            pad = CELL * 0.1
            col_val = stitch_color(kind)
            if col_val is None:
                continue
            c.setStrokeColor(col_val)
            c.setLineWidth(max(CELL * 0.24, 0.3))
            c.line(x+pad, y+pad, x+CELL-pad, y+CELL-pad)
            c.line(x+CELL-pad, y+pad, x+pad, y+CELL-pad)

    # ── Minor grid lines ──
    c.setStrokeColor(C_LGREY)
    c.setLineWidth(0.1)
    for i in range(COLS + 1):
        x = GRID_X + i * CELL
        c.line(x, GRID_Y, x, GRID_Y + GRID_SIZE)
    for i in range(ROWS + 1):
        y = GRID_Y + i * CELL
        c.line(GRID_X, y, GRID_X + GRID_SIZE, y)

    # ── Every-10 lines ──
    c.setStrokeColor(C_MGREY)
    c.setLineWidth(0.4)
    for i in range(0, COLS + 1, 10):
        x = GRID_X + i * CELL
        c.line(x, GRID_Y, x, GRID_Y + GRID_SIZE)
    for i in range(0, ROWS + 1, 10):
        y = GRID_Y + i * CELL
        c.line(GRID_X, y, GRID_X + GRID_SIZE, y)

    # ── Outer frame ──
    c.setStrokeColor(C_BLACK)
    c.setLineWidth(1.2)
    c.rect(GRID_X, GRID_Y, GRID_SIZE, GRID_SIZE, fill=0, stroke=1)

    # ── Axis labels every 10 ──
    c.setFont("Inter", 5)
    c.setFillColor(C_MGREY)
    for i in range(0, COLS+1, 10):
        x = GRID_X + i * CELL
        c.drawCentredString(x, GRID_Y - 4, str(i))
    for i in range(0, ROWS+1, 10):
        y = GRID_Y + (ROWS - i) * CELL
        c.drawRightString(GRID_X - 2, y - 2, str(i))

    # ── Legend ──────────────────────────────────────────────────────────────
    # Three items laid out horizontally with generous row height
    # Legend block sits just below axis labels
    LEG_BLOCK_TOP = GRID_Y - AXIS_H          # top of legend block
    LEG_ITEM_H    = 8.5 * mm                 # height per item row
    LEG_LABEL_Y   = LEG_BLOCK_TOP - 5        # "Thread key" label baseline

    # Section heading
    c.setFont("Inter-Bold", 8)
    c.setFillColor(C_BLACK)
    c.drawString(MARGIN_X, LEG_LABEL_Y, "Thread key")

    # Rule under heading
    c.setStrokeColor(C_LGREY)
    c.setLineWidth(0.5)
    rule_y = LEG_LABEL_Y - 2.5
    c.line(MARGIN_X, rule_y, PAGE_W - MARGIN_X, rule_y)

    box = 6 * mm
    col_w = (PAGE_W - 2 * MARGIN_X) / len(LEGEND_ITEMS)

    for idx, (name, col, dmc, used_for) in enumerate(LEGEND_ITEMS):
        lx  = MARGIN_X + idx * col_w
        # vertical centre of this item row
        item_y = rule_y - LEG_ITEM_H / 2 - 1

        # Colour swatch
        c.setFillColor(col)
        c.rect(lx, item_y - box/2, box, box, fill=1, stroke=0)
        # X stitch preview on swatch
        c.setStrokeColor(white)
        c.setLineWidth(0.9)
        c.line(lx+1, item_y-box/2+1, lx+box-1, item_y+box/2-1)
        c.line(lx+box-1, item_y-box/2+1, lx+1, item_y+box/2-1)
        # Swatch border
        c.setStrokeColor(C_LGREY)
        c.setLineWidth(0.3)
        c.rect(lx, item_y - box/2, box, box, fill=0, stroke=1)

        tx = lx + box + 3 * mm
        # Colour name
        c.setFont("Inter-Bold", 8)
        c.setFillColor(C_BLACK)
        c.drawString(tx, item_y + 1.5, name)
        # DMC code
        c.setFont("Inter-Medium", 7.5)
        c.setFillColor(C_GREEN)
        c.drawString(tx, item_y - 5, dmc)
        # Usage
        c.setFont("Inter", 7)
        c.setFillColor(C_GREY)
        w_dmc = c.stringWidth(dmc, "Inter-Medium", 7.5)
        c.drawString(tx + w_dmc + 2*mm, item_y - 5, f"·  {used_for}")

    c.save()
    print(f"Saved: {filename}")

make_pdf("/mnt/user-data/outputs/goal_crossstitch_pattern_branded.pdf")
