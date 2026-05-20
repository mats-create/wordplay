/* ═══════════════════════════════════════════════════════════════════
   PDF ENGINE
═══════════════════════════════════════════════════════════════════ */

// PT per mm (jsPDF uses pt internally, 1mm = 2.8346pt)
const MM = 2.8346;
const A4W = 210 * MM;   // 595pt
const A4H = 297 * MM;   // 841pt

// Stitch colour lookup (same as canvas)
function pdfStitchColor(kind, threads) {
  // Find threads by role — fall back to brand defaults so colours never drop
  const black = (threads && threads.find(function(t) { return t.hex && t.hex.toLowerCase().startsWith('#1'); }))
    ? threads.find(function(t) { return t.hex && t.hex.toLowerCase().startsWith('#1'); }).hex
    : '#1A1A1A';
  const green = (threads && threads.find(function(t) { return t.hex && (t.hex.toLowerCase().startsWith('#4') || t.hex.toLowerCase().startsWith('#3')); }))
    ? threads.find(function(t) { return t.hex && (t.hex.toLowerCase().startsWith('#4') || t.hex.toLowerCase().startsWith('#3')); }).hex
    : '#4A6741';
  const coral = (threads && threads.find(function(t) { return t.hex && t.hex.toLowerCase().startsWith('#c'); }))
    ? threads.find(function(t) { return t.hex && t.hex.toLowerCase().startsWith('#c'); }).hex
    : '#CC3300';
  const map = {
    'T': black, 'B': black, 'A': black, 'F': black,
    'D': green, 'G': green,
    'E': coral, 'S': coral,
  };
  return map[kind] || black; // never return null — default to black
}

function hexToRgb(hex) {
  const h = hex.replace('#','');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

// Draw the stitch grid onto a jsPDF doc at given origin/cellSize
function drawGridOnPDF(doc, grid, cols, rows, originX, originY, cellPt, threads, showBg) {
  // Background
  if (showBg) {
    doc.setFillColor(240, 230, 211); // linen #F0E6D3
    doc.rect(originX, originY, cols*cellPt, rows*cellPt, 'F');
  }

  // Stitches
  const pad = cellPt * 0.1;
  grid.forEach(function(rowArr, row) {
    rowArr.forEach(function(kind, col) {
      if (kind === ' ') return;
      const cv = pdfStitchColor(kind, threads);
      if (!cv) return;
      const rgb = hexToRgb(cv);
      const x = originX + col * cellPt;
      const y = originY + row * cellPt;
      doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
      doc.setLineWidth(Math.max(cellPt * 0.22, 0.3));
      doc.line(x+pad, y+pad, x+cellPt-pad, y+cellPt-pad);
      doc.line(x+cellPt-pad, y+pad, x+pad, y+cellPt-pad);
    });
  });

  // Minor grid lines
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.1);
  for (let i=0; i<=cols; i++) {
    doc.line(originX+i*cellPt, originY, originX+i*cellPt, originY+rows*cellPt);
  }
  for (let i=0; i<=rows; i++) {
    doc.line(originX, originY+i*cellPt, originX+cols*cellPt, originY+i*cellPt);
  }

  // Every-10 lines
  doc.setDrawColor(160, 160, 160);
  doc.setLineWidth(0.4);
  for (let i=0; i<=cols; i+=10) {
    doc.line(originX+i*cellPt, originY, originX+i*cellPt, originY+rows*cellPt);
  }
  for (let i=0; i<=rows; i+=10) {
    doc.line(originX, originY+i*cellPt, originX+cols*cellPt, originY+i*cellPt);
  }

  // Outer frame
  doc.setDrawColor(26, 26, 26);
  doc.setLineWidth(1.2);
  doc.rect(originX, originY, cols*cellPt, rows*cellPt, 'S');
}

// ── Chart PDF (branded A4) ────────────────────────────────────────────────────
function generateChartPDF(shoutout) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'pt', format:'a4' });

  const cols = shoutout.stitchesW || 94;
  const rows = shoutout.stitchesH || 94;
  const threads = shoutout.threads || [];
  const bs = shoutout.borderSpec || shoutout.borderStyle || 'british';
  const grid = buildGrid(shoutout.name, cols, rows, bs, 0, 2); // 0 = auto-scale

  const MARGIN_X = 14 * MM;
  const HEADER_H = 16 * MM;
  const FOOTER_H = 12 * MM;
  const LEGEND_H = 28 * MM;
  const AXIS_H   = 5  * MM;
  const SUB_H    = 7  * MM;
  const CONTENT_TOP    = A4H - HEADER_H;
  const CONTENT_BOTTOM = FOOTER_H;
  const CONTENT_H = CONTENT_TOP - CONTENT_BOTTOM;
  const GRID_SIZE = A4W - 2 * MARGIN_X;
  const BLOCK_H   = SUB_H + GRID_SIZE + AXIS_H + LEGEND_H;
  const PAD       = (CONTENT_H - BLOCK_H) / 2;
  const GRID_X    = MARGIN_X;
  const GRID_Y    = CONTENT_BOTTOM + PAD + LEGEND_H + AXIS_H;
  const CELL      = GRID_SIZE / cols;

  // ── Page background ──
  doc.setFillColor(245, 245, 245);
  doc.rect(0, 0, A4W, A4H, 'F');

  // ── Header (linen bar) ──
  doc.setFillColor(240, 230, 211);
  doc.rect(0, 0, A4W, HEADER_H, 'F');
  doc.setDrawColor(26, 26, 26);
  doc.setLineWidth(0.8);
  doc.line(0, HEADER_H, A4W, HEADER_H);

  // Wordmark
  const midY = HEADER_H / 2;
  doc.setFontSize(13); doc.setTextColor(26, 26, 26);
  doc.setFont('helvetica','bold');
  const wNutmeg = doc.getTextWidth('Nutmeg');
  const wAmp    = doc.getTextWidth('&');
  doc.text('Nutmeg', MARGIN_X, midY + 4);
  doc.setTextColor(204, 51, 0);
  doc.text('&', MARGIN_X + wNutmeg, midY + 4);
  doc.setTextColor(26, 26, 26);
  doc.text('Needle', MARGIN_X + wNutmeg + wAmp, midY + 4);
  // Tagline
  doc.setFontSize(8); doc.setFont('helvetica','normal');
  doc.setTextColor(74, 103, 65);
  doc.text('Handcrafted football moves', MARGIN_X + wNutmeg + wAmp + doc.getTextWidth('Needle') + 5*MM, midY + 3);
  // Pattern title right
  doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(26,26,26);
  const titleStr = shoutout.name + '  —  Cross-stitch pattern';
  doc.text(titleStr, A4W - MARGIN_X - doc.getTextWidth(titleStr), midY + 3);

  // ── Footer ──
  doc.setFillColor(240, 230, 211);
  doc.rect(0, A4H - FOOTER_H, A4W, FOOTER_H, 'F');
  doc.setDrawColor(26, 26, 26); doc.setLineWidth(0.8);
  doc.line(0, A4H - FOOTER_H, A4W, A4H - FOOTER_H);
  const fMidY = A4H - FOOTER_H/2;
  doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(26,26,26);
  const wFN = doc.getTextWidth('Nutmeg');
  doc.text('Nutmeg', MARGIN_X, fMidY + 3);
  doc.setTextColor(204,51,0);
  doc.text('&', MARGIN_X + wFN, fMidY + 3);
  doc.setTextColor(26,26,26);
  doc.text('Needle', MARGIN_X + wFN + doc.getTextWidth('&'), fMidY + 3);
  doc.setFont('helvetica','normal'); doc.setTextColor(102,102,102);
  const urlStr = 'nutmegneedle.com';
  doc.text(urlStr, A4W - MARGIN_X - doc.getTextWidth(urlStr), fMidY + 3);
  doc.setFontSize(7); doc.setTextColor(153,153,153);
  doc.text('1', A4W/2 - doc.getTextWidth('1')/2, fMidY + 2.5);

  // ── Subtitle ──
  const subY = A4H - HEADER_H - PAD - BLOCK_H + SUB_H - 2;
  doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(102,102,102);
  const subStr = cols + ' × ' + rows + ' stitches  ·  14-count Aida  ·  ~' +
    Math.round(cols/5.51) + ' × ' + Math.round(rows/5.51) + 'mm finished  ·  fits ' +
    shoutout.hoopW + ' × ' + shoutout.hoopH + 'mm hoop';
  doc.text(subStr, GRID_X, subY);

  // ── Grid ──
  drawGridOnPDF(doc, grid, cols, rows, GRID_X, GRID_Y, CELL, threads, true);

  // ── Axis labels ──
  doc.setFontSize(5); doc.setTextColor(153,153,153);
  for (let i=0; i<=cols; i+=10) {
    doc.text(String(i), GRID_X + i*CELL, GRID_Y + rows*CELL + 4, {align:'center'});
  }

  // ── Legend ──
  const legTopY   = GRID_Y - AXIS_H - 2;
  const legLabelY = legTopY - 5;
  doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(26,26,26);
  doc.text('Thread key', GRID_X, legLabelY);
  doc.setDrawColor(204,204,204); doc.setLineWidth(0.4);
  doc.line(GRID_X, legLabelY + 2, GRID_X + 110*MM, legLabelY + 2);

  const box = 5 * MM;
  const colW = (A4W - 2*MARGIN_X) / threads.length;
  threads.forEach(function(t, idx) {
    const lx = GRID_X + idx * colW;
    const ly = legLabelY + 4;
    const rgb = hexToRgb(t.hex || '#1A1A1A');
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.rect(lx, ly, box, box, 'F');
    // X preview on swatch
    doc.setDrawColor(255,255,255); doc.setLineWidth(0.7);
    doc.line(lx+1, ly+1, lx+box-1, ly+box-1);
    doc.line(lx+box-1, ly+1, lx+1, ly+box-1);
    // Name
    doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(26,26,26);
    doc.text(t.name||'', lx + box + 2*MM, ly + 3.5);
    // DMC
    doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(74,103,65);
    doc.text(t.dmc||'', lx + box + 2*MM, ly + box - 1);
  });

  doc.save((shoutout.name||'shoutout').toLowerCase().replace(/[^a-z0-9]/g,'-') + '-chart.pdf');
}

// ── Aida Print PDF (physically accurate, centred, no branding) ───────────────
function generateAidaPDF(shoutout, showBg) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'pt', format:'a4' });

  // Always print at 94×94 for consistent 1:1 sizing on A4 Aida fabric
  // 94 stitches × 1.814mm = 170.5mm → 20mm margins each side on 210mm A4
  const PRINT_COLS = 94;
  const PRINT_ROWS = 94;

  const threads = shoutout.threads || [];
  const bs      = shoutout.borderSpec || shoutout.borderStyle || 'british';
  const grid    = buildGrid(shoutout.name, PRINT_COLS, PRINT_ROWS, bs, 0, 2);

  // Exact 1:1 physical size
  const CELL   = (25.4 / 14) * MM;        // 1.814mm per stitch in points
  const GRID_W = PRINT_COLS * CELL;        // 170.5mm
  const GRID_H = PRINT_ROWS * CELL;

  // Centre on portrait A4 — gives exactly 20mm side margins, 63mm top/bottom
  const OX = (A4W - GRID_W) / 2;
  const OY = (A4H - GRID_H) / 2;

  // White page
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, A4W, A4H, 'F');

  // Draw grid at exact 1:1 size
  drawGridOnPDF(doc, grid, PRINT_COLS, PRINT_ROWS, OX, OY, CELL, threads, showBg);

  // ── Brand strip — just below the design ──────────────────────────────────
  const BRAND_Y = OY + GRID_H + 8 * MM;

  const WM_SIZE = 9;
  doc.setFontSize(WM_SIZE);
  doc.setFont('helvetica', 'bold');
  const wNutmeg = doc.getTextWidth('Nutmeg');
  const wAmp    = doc.getTextWidth('&');
  const wNeedle = doc.getTextWidth('Needle');
  const wWM     = wNutmeg + wAmp + wNeedle;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  const wUrl = doc.getTextWidth('nutmegneedle.com');
  const wDot = doc.getTextWidth('  \u00b7  ');
  const wTag = doc.getTextWidth('Handcrafted football moves');
  const wTotal = wWM + wDot + wUrl + wDot + wTag;
  let bx = A4W / 2 - wTotal / 2;

  doc.setFontSize(WM_SIZE);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 26);   doc.text('Nutmeg', bx, BRAND_Y); bx += wNutmeg;
  doc.setTextColor(204, 51, 0);   doc.text('&', bx, BRAND_Y);      bx += wAmp;
  doc.setTextColor(26, 26, 26);   doc.text('Needle', bx, BRAND_Y); bx += wNeedle;
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 180); doc.text('  \u00b7  ', bx, BRAND_Y); bx += wDot;
  doc.setTextColor(100, 100, 100); doc.text('nutmegneedle.com', bx, BRAND_Y); bx += wUrl;
  doc.setTextColor(180, 180, 180); doc.text('  \u00b7  ', bx, BRAND_Y); bx += wDot;
  doc.setTextColor(74, 103, 65);   doc.text('Handcrafted football moves', bx, BRAND_Y);

  doc.setFontSize(5.5); doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  const spec2 = shoutout.name + '  \u00b7  14-count Aida  \u00b7  ' +
    (PRINT_COLS * 25.4 / 14).toFixed(1) + '\u00d7' +
    (PRINT_ROWS * 25.4 / 14).toFixed(1) + 'mm  \u00b7  print at 100%';
  doc.text(spec2, A4W / 2 - doc.getTextWidth(spec2) / 2, BRAND_Y + 5 * MM);

  doc.save((shoutout.name || 'shoutout').toLowerCase().replace(/[^a-z0-9]/g, '-') + '-aida-print.pdf');
}

