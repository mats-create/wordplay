function buildGrid(word, cols, rows, borderStyle, scale, gap) {
  // scale=0 means auto; gap defaults to 1 (will be scaled internally)
  const GAP_BASE = (gap != null && gap > 0) ? gap : 1;
  cols  = cols  || 94;
  rows  = rows  || 94;
  const grid = [];
  for (let r = 0; r < rows; r++) grid.push(new Array(cols).fill(' '));

  function setCell(r, c, kind) {
    if (r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c] === ' ')
      grid[r][c] = kind;
  }

  const N = cols;

  // Resolve spec
  const spec = (typeof borderStyle === 'object' && borderStyle !== null)
    ? borderStyle
    : (BORDER_SPECS[borderStyle] || BORDER_SPECS['minimal']);

  renderBorderSpec(spec, N, setCell);

  // ── Text ──
  if (!word || !word.trim()) return grid;

  const normWord = word.normalize ? word.normalize('NFC') : word;
  const upperWord = normWord.toUpperCase();

  // Build char list — resolve each char to a bitmap + optional diacritic
  const charList = upperWord.split('').map(function(ch) {
    // Check DIACRITIC_MAP first (before LETTERS, which has string redirects)
    if (ch in DIACRITIC_MAP) {
      const dm = DIACRITIC_MAP[ch];
      const bitmap = LETTERS[dm.base];
      if (Array.isArray(bitmap)) {
        return { letter: bitmap, hasDiac: true, mark: dm.mark };
      }
    }
    // Direct LETTERS lookup
    const direct = LETTERS[ch];
    if (Array.isArray(direct)) {
      return { letter: direct, hasDiac: false };
    }
    // normaliseChar fallback (handles Æ, Ø, ß, Ç which have unique bitmaps)
    const norm = normaliseChar(ch);
    const normed = LETTERS[norm];
    if (Array.isArray(normed)) {
      return { letter: normed, hasDiac: false };
    }
    return { letter: LETTERS['?'], hasDiac: false };
  });

  const hasDiacritics = charList.some(function(c) { return c.hasDiac; });
  const LETTER_H = 7;
  const DIAC_H   = hasDiacritics ? 2 : 0;
  const TEXT_H   = LETTER_H + DIAC_H;

  // ── Auto-scale ──
  // Compute true interior: must clear border layers AND side motifs
  const borderWeight = (spec && spec.borderWeight) ? spec.borderWeight : 1;
  const borderDepth = (spec && spec.layers) ? spec.layers.length * borderWeight : 2;
  const cornerInset = (spec && spec.cornerInset) ? spec.cornerInset : borderDepth + 2;

  // Find the deepest side motif extent from the edge
  // left-right motifs sit at column cornerInset, width = motif pattern width
  let sideMotifW = 0;
  if (spec && spec.sideMotifs) {
    spec.sideMotifs.forEach(function(m) {
      const pos = m.position || 'all';
      if (pos === 'left-right' || pos === 'all') {
        const mw = m.pattern ? m.pattern[0].length : 0;
        sideMotifW = Math.max(sideMotifW, mw);
      }
    });
  }
  // Interior must clear: cornerInset + sideMotifWidth + 1 stitch padding
  const edgeClear = sideMotifW > 0
    ? cornerInset + sideMotifW + 1
    : cornerInset + 2;

  const interiorW = cols - edgeClear * 2;
  const interiorH = rows - edgeClear * 2;

  const nChars = charList.length;
  const totalLetterW = charList.reduce(function(s, c) { return s + c.letter[0].length; }, 0);

  // Text width at given scale (gap is fixed, not scaled)
  function textWidth(s) {
    return totalLetterW * s + GAP_BASE * (nChars - 1);
  }

  // Maximum scale where text fits
  const maxScaleW = totalLetterW > 0
    ? Math.floor((interiorW - GAP_BASE * (nChars - 1)) / totalLetterW)
    : 1;
  const maxScaleH = Math.floor(interiorH / Math.max(TEXT_H, 1));
  const maxFits   = Math.min(maxScaleW, maxScaleH);

  // Scale preference: 2 by default.
  // Scale down to 1 if word too long for scale 2.
  // Scale up to 3 only for very short words (≤3 visible chars, e.g. "OLE").
  let autoScale;
  if (maxFits < 1) {
    autoScale = 1;
  } else if (maxFits < 2) {
    autoScale = 1;
  } else {
    const visibleChars = charList.filter(function(c) {
      return c.letter && c.letter !== LETTERS[' '];
    }).length;
    autoScale = (maxFits >= 3 && visibleChars <= 3) ? 3 : 2;
  }

  const S  = (scale && scale > 0) ? scale : autoScale;
  const tw = textWidth(S);
  const th = TEXT_H * S;

  let x          = Math.floor((cols - tw) / 2);
  const startRow = Math.floor((rows - th) / 2);

  charList.forEach(function(charEntry) {
    const letter = charEntry.letter;
    const lw     = letter[0].length;

    // Draw diacritic mark above letter
    if (charEntry.hasDiac && hasDiacritics) {
      const markRows = DIACRITICS[charEntry.mark](lw);
      markRows.forEach(function(rs, dr) {
        rs.split('').forEach(function(ch, dc) {
          if (ch === '1') {
            for (let sy = 0; sy < S; sy++) {
              for (let sx = 0; sx < S; sx++) {
                setCell(startRow + dr * S + sy, x + dc * S + sx, 'T');
              }
            }
          }
        });
      });
    }

    // Draw letter body below diacritic rows
    const letterRow = startRow + DIAC_H * S;
    letter.forEach(function(rs, r) {
      rs.split('').forEach(function(ch, c) {
        if (ch === '1') {
          for (let dr = 0; dr < S; dr++) {
            for (let dc = 0; dc < S; dc++) {
              setCell(letterRow + r * S + dr, x + c * S + dc, 'T');
            }
          }
        }
      });
    });

    // Advance x by scaled letter width + fixed gap
    x += lw * S + GAP_BASE;
  });

  return grid;
}

// ── Border spec renderer ──────────────────────────────────────────────────────
function renderBorderSpec(spec, N, setCell) {
  if (!spec) return;
  const layers = spec.layers || [];
  const borderWeight = spec.borderWeight || 1;
  const cornerFillColor = spec.cornerFill || null;

  // Helper: resolve colour name to grid kind
  function colorKind(color, fallback) {
    return color === 'secondary' ? 'D'
      : color === 'accent'   ? 'E'
      : color === 'border3'  ? 'H'
      : color === 'accent1'  ? 'J'
      : color === 'accent2'  ? 'L'
      : fallback || 'B';
  }

  // Compute corner inset — how many rows the full border occupies
  const totalBorderRows = layers.length * borderWeight;
  const inset = spec.cornerInset || totalBorderRows + 2;

  // Corner fill kind
  const cfKind = cornerFillColor ? colorKind(cornerFillColor, 'B') : null;

  layers.forEach(function(layer, li) {
    const k = colorKind(layer.color, 'B');
    const kA = colorKind(layer.colorA, 'A');
    const kB = layer.colorB === 'secondary' ? 'D' : layer.colorB === 'accent' ? 'E' : layer.colorB === 'border3' ? 'I' : layer.colorB === 'accent1' ? 'K' : layer.colorB === 'accent2' ? 'M' : 'A';
    const tile = layer.tile || null; // 8-char binary string e.g. "10001000"

    for (let w = 0; w < borderWeight; w++) {
      const ln = li * borderWeight + w;
      if (ln >= Math.floor(N / 2)) return;

      if (layer.type === 'empty') continue;

      for (let i = ln; i < N - ln; i++) {
        const inCorner = cfKind && (i < inset || i >= N - inset);

        if (inCorner && layer.type !== 'empty') {
          // Corner zone — solid in cornerFill colour, only for active layers
          setCell(ln,     i, cfKind); setCell(N-1-ln, i, cfKind);
          setCell(i,     ln, cfKind); setCell(i, N-1-ln, cfKind);
        } else if (!inCorner) {
          if (tile) {
            if (tile[i % tile.length] === '1') {
              setCell(ln, i, k); setCell(N-1-ln, i, k);
              setCell(i, ln, k); setCell(i, N-1-ln, k);
            }
          } else if (layer.type === 'solid') {
            setCell(ln, i, k); setCell(N-1-ln, i, k);
            setCell(i, ln, k); setCell(i, N-1-ln, k);
          } else if (layer.type === 'check') {
            setCell(ln,     i, i%2===0?kA:kB); setCell(N-1-ln, i, i%2===1?kA:kB);
            setCell(i,     ln, i%2===0?kA:kB); setCell(i, N-1-ln, i%2===1?kA:kB);
          }
        }
      }
    }
  });

  // Helper: draw a motif pattern at a given top-left position
  function drawMotif(motif, sr, sc) {
    if (!motif || !motif.pattern) return;
    const k = colorKind(motif.color, 'F');
    motif.pattern.forEach(function(rs, dr) {
      rs.split('').forEach(function(ch, dc) {
        if (ch === '1') setCell(sr + dr, sc + dc, k);
      });
    });
  }

  // ── Corner motifs — per-position overrides take precedence ──
  // Positions: topLeft, topRight, bottomLeft, bottomRight
  const co = spec.cornerOverrides || {};
  const globalCorner = spec.cornerMotif || null;

  // Each corner: [row offset, col offset], position name
  const cornerDefs = [
    { name: 'topLeft',     getPos: function(w,h) { return [inset, inset]; } },
    { name: 'topRight',    getPos: function(w,h) { return [inset, N-inset-w]; } },
    { name: 'bottomLeft',  getPos: function(w,h) { return [N-inset-h, inset]; } },
    { name: 'bottomRight', getPos: function(w,h) { return [N-inset-h, N-inset-w]; } },
  ];

  cornerDefs.forEach(function(def) {
    const motif = co[def.name] || globalCorner;
    if (!motif || !motif.pattern) return;
    const w = motif.pattern[0].length;
    const h = motif.pattern.length;
    const pos = def.getPos(w, h);
    drawMotif(motif, pos[0], pos[1]);
  });

  // ── Side motifs — per-position overrides take precedence ──
  // Positions: top, bottom, left, right
  const so = spec.sideOverrides || {};

  // Build a map of what the global sideMotifs cover
  const globalSide = { top: null, bottom: null, left: null, right: null };
  if (spec.sideMotifs) {
    spec.sideMotifs.forEach(function(motif) {
      const pos = motif.position || 'all';
      if (pos === 'top-bottom' || pos === 'all') {
        globalSide.top    = globalSide.top    || motif;
        globalSide.bottom = globalSide.bottom || motif;
      }
      if (pos === 'left-right' || pos === 'all') {
        globalSide.left  = globalSide.left  || motif;
        globalSide.right = globalSide.right || motif;
      }
    });
  }

  // Draw each side — override wins over global
  function drawSide(sideName, getPos) {
    const motif = so[sideName] || globalSide[sideName];
    if (!motif || !motif.pattern) return;
    const mw = motif.pattern[0].length;
    const mh = motif.pattern.length;
    const pos = getPos(mw, mh);
    drawMotif(motif, pos[0], pos[1]);
  }

  drawSide('top',    function(mw,mh) { return [inset,              Math.floor((N-mw)/2)]; });
  drawSide('bottom', function(mw,mh) { return [N-inset-mh,         Math.floor((N-mw)/2)]; });
  drawSide('left',   function(mw,mh) { return [Math.floor((N-mh)/2), inset             ]; });
  drawSide('right',  function(mw,mh) { return [Math.floor((N-mh)/2), N-inset-mw        ]; });
}

// ── Built-in border specs ─────────────────────────────────────────────────────
const BORDER_SPECS = {
  british: {
    layers: [
      { line:0, type:'solid',  color:'primary' },
      { line:1, type:'check',  colorA:'secondary', colorB:'accent' },
      { line:2, type:'solid',  color:'primary' },
      { line:3, type:'check',  colorA:'accent',    colorB:'secondary' },
      { line:4, type:'solid',  color:'primary' },
    ],
    cornerInset: 7,
    cornerMotif: {
      color: 'primary',
      pattern: [
        "011101110","101010101","110101011","001111100",
        "011101110","001111100","110101011","101010101","011101110",
      ]
    },
    sideMotifs: [
      {
        position:'top-bottom', color:'secondary',
        pattern: [
          "11000000000000000000000000000000000000011",
          "11000000000000000000000000000000000000011",
          "11000000000000000000000000000000000000011",
          "11000000000000000000000000000000000000011",
          "11000000000000000000000000000000000000011",
          "11000000000000000000000000000000000000011",
          "11111111111111111111111111111111111111111",
          "00000000000000000000000000000000000000000",
          "00000000000000000000000000000000000000000",
        ]
      },
      {
        position:'left-right', color:'accent',
        pattern: [
          "000010000","000111000","001111100","011111110","111111111",
          "011111110","001111100","000111000","000010000",
        ]
      }
    ]
  },

  scandinavian: {
    layers: [
      { line:0, type:'solid', color:'primary' },
      { line:1, type:'empty' },
      { line:2, type:'solid', color:'primary' },
    ],
    cornerInset: 5,
    cornerMotif: {
      color: 'secondary',
      pattern: ["00100","01110","11111","01110","00100"]
    },
    sideMotifs: [{
      position:'all', color:'accent',
      pattern: ["01010","11111","01010","11111","01010"]
    }]
  },

  minimal: {
    layers: [
      { line:0, type:'solid', color:'primary' },
      { line:1, type:'solid', color:'secondary' },
    ]
  },
};

function stitchColor(kind, threads) {
  const t = threads || [];
  // Named thread slots:
  // Slot 1 — Shoutout:  T, B, A, F
  // Slot 2 — Border 1:  D, G
  // Slot 3 — Border 2:  E, S
  // Slot 4 — Border 3:  H, I
  // Slot 5 — Accent 1:  J, K
  // Slot 6 — Accent 2:  L, M
  const s1 = (t[0] && t[0].hex) ? t[0].hex : '#1A1A1A';
  const s2 = (t[1] && t[1].hex) ? t[1].hex : '#4A6741';
  const s3 = (t[2] && t[2].hex) ? t[2].hex : '#CC3300';
  const s4 = (t[3] && t[3].hex) ? t[3].hex : '#4A6741';
  const s5 = (t[4] && t[4].hex) ? t[4].hex : '#CC3300';
  const s6 = (t[5] && t[5].hex) ? t[5].hex : '#1A1A1A';
  return {
    'T':s1,'B':s1,'A':s1,'F':s1,
    'D':s2,'G':s2,
    'E':s3,'S':s3,
    'H':s4,'I':s4,
    'J':s5,'K':s5,
    'L':s6,'M':s6,
  }[kind] || s1;
}

// ── Thread length calculator ──────────────────────────────────────────────────
// Builds the grid and counts stitches per thread slot.
// Formula: stitch_count × cm_per_stitch × 1.15 waste factor, rounded to 5cm.
// cm_per_stitch = 2.5cm × strands (default 2 strands on 14-count Aida = 5cm per stitch)
function calculateThreadLengths(word, cols, rows, borderStyle, threads, textScale, strands) {
  const strandsCount = strands || 2;
  const cmPerStitch = 2.5 * strandsCount;
  const grid = buildGrid(word, cols || 94, rows || 94, borderStyle, textScale || 0, 2);
  // Map cell kinds to thread slot index (0-based), extended to 6 slots
  const kindToSlot = {
    'T':0,'B':0,'A':0,'F':0,
    'D':1,'G':1,
    'E':2,'S':2,
    'H':3,'I':3,
    'J':4,'K':4,
    'L':5,'M':5,
  };
  const counts = [0, 0, 0, 0, 0, 0];
  grid.forEach(function(row) {
    row.forEach(function(kind) {
      if (kind in kindToSlot) counts[kindToSlot[kind]]++;
    });
  });
  const t = threads || [];
  return t.map(function(thread, i) {
    const cm = counts[i] !== undefined
      ? Math.round((counts[i] * cmPerStitch * 1.15) / 5) * 5
      : 0;
    return { dmc: thread.dmc, name: thread.name, hex: thread.hex, cm: cm };
  });
}

/* ═══════════════════════════════════════════════════════════════════
   CANVAS COMPONENT
═══════════════════════════════════════════════════════════════════ */
function CrossStitchCanvas({ word, cols, rows, borderStyle, threads, size, className, textScale, lines }) {
  const canvasRef = useRef(null);
  cols = cols||110; rows = rows||110;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || (!word && !lines)) return;
    const px = size||440;
    canvas.width = px; canvas.height = px;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#F0E6D3';
    ctx.fillRect(0,0,px,px);

    // Use multi-row builder if lines provided, otherwise single-word builder
    const grid = lines && lines.length > 0
      ? buildGridMulti(lines, cols, rows, borderStyle, 2)
      : buildGrid(word, cols, rows, borderStyle, textScale || 0, 2);

    // Use actual grid dimensions (may differ if buildGridMulti auto-expanded)
    const actualCols = grid[0] ? grid[0].length : cols;
    const actualRows = grid.length || rows;
    const cell = px / actualCols;
    const pad = cell * 0.1;
    const lw  = Math.max(cell * 0.24, 0.5);

    grid.forEach((rowArr,row) => rowArr.forEach((kind,col) => {
      if (kind===' ') return;
      const c = stitchColor(kind, threads);
      if (!c) return;
      const x=col*cell, y=row*cell;
      ctx.strokeStyle=c; ctx.lineWidth=lw;
      ctx.beginPath();
      ctx.moveTo(x+pad,y+pad); ctx.lineTo(x+cell-pad,y+cell-pad);
      ctx.moveTo(x+cell-pad,y+pad); ctx.lineTo(x+pad,y+cell-pad);
      ctx.stroke();
    }));

    // minor grid
    ctx.strokeStyle='rgba(0,0,0,0.07)'; ctx.lineWidth=0.3;
    for(let i=0;i<=actualCols;i++){ctx.beginPath();ctx.moveTo(i*cell,0);ctx.lineTo(i*cell,px);ctx.stroke();}
    for(let i=0;i<=actualRows;i++){ctx.beginPath();ctx.moveTo(0,i*cell);ctx.lineTo(px,i*cell);ctx.stroke();}
    // every-10
    ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=0.5;
    for(let i=0;i<=actualCols;i+=10){ctx.beginPath();ctx.moveTo(i*cell,0);ctx.lineTo(i*cell,px);ctx.stroke();}
    for(let i=0;i<=actualRows;i+=10){ctx.beginPath();ctx.moveTo(0,i*cell);ctx.lineTo(px,i*cell);ctx.stroke();}
    // frame
    ctx.strokeStyle='#1A1A1A'; ctx.lineWidth=1.5;
    ctx.strokeRect(0,0,px,px);

  }, [word, cols, rows, borderStyle, size, JSON.stringify(threads), textScale, JSON.stringify(lines)]);

  return (
    <div className={className||'canvas-full'}>
      <canvas ref={canvasRef}/>
    </div>
  );
}


// ── Multi-row grid builder ────────────────────────────────────────────────────
// lines: array of {text, scale} — max 4
// Each line independently scaled and centred horizontally.
// Lines distributed evenly in available vertical space.
function buildGridMulti(lines, cols, rows, borderStyle, gap, placedObjects) {
  const GAP_BASE = (gap != null && gap > 0) ? gap : 1;
  const LINE_GAP = 2; // vertical gap between lines in stitches
  cols = cols || 94;
  rows = rows || 94;

  // Auto-expand grid based on line count so lines render at scale 2 comfortably
  // Transparent to user — stored stitch count is unchanged
  const lineCount = (lines || []).slice(0, 4).filter(function(l) { return l.text && l.text.trim(); }).length;
  if      (lineCount >= 4) { cols = Math.max(cols, 104); rows = Math.max(rows, 104); }
  else if (lineCount === 3) { cols = Math.max(cols, 100); rows = Math.max(rows, 100); }
  else if (lineCount === 2) { cols = Math.max(cols, 100); rows = Math.max(rows, 100); }

  const grid = [];
  for (let r = 0; r < rows; r++) grid.push(new Array(cols).fill(' '));

  function setCell(r, c, kind) {
    if (r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c] === ' ')
      grid[r][c] = kind;
  }

  const N = cols;
  const spec = (typeof borderStyle === 'object' && borderStyle !== null)
    ? borderStyle
    : (BORDER_SPECS[borderStyle] || BORDER_SPECS['minimal']);

  renderBorderSpec(spec, N, setCell);

  // ── Placed objects (same logic as buildGrid) ──
  if (placedObjects && typeof placedObjects === 'object') {
    const borderDepthPO = (spec && spec.layers) ? spec.layers.length : 2;
    const insetPO = (spec && spec.cornerInset) ? spec.cornerInset : borderDepthPO + 2;
    const COLOR_SLOT_KINDS_PO = {
      primary:'T', secondary:'D', accent:'E', border3:'H', accent1:'J', accent2:'L'
    };
    function forceCellMG(r, c, kind) {
      if (r >= 0 && r < rows && c >= 0 && c < cols) grid[r][c] = kind;
    }
    Object.keys(placedObjects).forEach(function(posId) {
      const obj = placedObjects[posId];
      if (!obj) return;
      const layers = obj.layers
        ? obj.layers
        : [{ colorSlot: 'primary', pattern: obj.pattern || [] }];
      if (!layers.length || !layers[0].pattern || !layers[0].pattern.length) return;
      const ph = layers[0].pattern.length;
      const firstRow = typeof layers[0].pattern[0] === 'string'
        ? layers[0].pattern[0] : layers[0].pattern[0].join('');
      const pw = firstRow.length;
      let sr, sc;
      if      (posId === 'topLeft')     { sr = insetPO;             sc = insetPO; }
      else if (posId === 'topRight')    { sr = insetPO;             sc = cols - insetPO - pw; }
      else if (posId === 'bottomLeft')  { sr = rows - insetPO - ph; sc = insetPO; }
      else if (posId === 'bottomRight') { sr = rows - insetPO - ph; sc = cols - insetPO - pw; }
      else if (posId === 'top')         { sr = insetPO;             sc = Math.floor((cols - pw) / 2); }
      else if (posId === 'bottom')      { sr = rows - insetPO - ph; sc = Math.floor((cols - pw) / 2); }
      else if (posId === 'left')        { sr = Math.floor((rows - ph) / 2); sc = insetPO; }
      else if (posId === 'right')       { sr = Math.floor((rows - ph) / 2); sc = cols - insetPO - pw; }
      else return;
      layers.forEach(function(layer) {
        const kind = COLOR_SLOT_KINDS_PO[layer.colorSlot] || 'F';
        (layer.pattern || []).forEach(function(rowData, dr) {
          const rs = typeof rowData === 'string' ? rowData : rowData.join('');
          rs.split('').forEach(function(ch, dc) {
            if (ch === '1') forceCellMG(sr + dr, sc + dc, kind);
          });
        });
      });
    });
  }

  // Clamp to 4 lines
  const activeLines = (lines || []).slice(0, 4).filter(function(l) {
    return l.text && l.text.trim();
  });
  if (activeLines.length === 0) return grid;

  // Compute interior bounds
  const borderDepth = (spec && spec.layers) ? spec.layers.length : 2;
  const cornerInset = (spec && spec.cornerInset) ? spec.cornerInset : borderDepth + 2;
  let sideMotifW = 0;
  if (spec && spec.sideMotifs) {
    spec.sideMotifs.forEach(function(m) {
      const pos = m.position || 'all';
      if (pos === 'left-right' || pos === 'all') {
        const mw = m.pattern ? m.pattern[0].length : 0;
        sideMotifW = Math.max(sideMotifW, mw);
      }
    });
  }
  const edgeClear = sideMotifW > 0 ? cornerInset + sideMotifW + 1 : cornerInset + 2;
  const interiorW = cols - edgeClear * 2;
  const interiorH = rows - edgeClear * 2;

  // For each line, build char list and compute best scale
  const LETTER_H = 7;
  const lineData = activeLines.map(function(line) {
    const normText = (line.text.normalize ? line.text.normalize('NFC') : line.text).toUpperCase();
    const charList = normText.split('').map(function(ch) {
      if (ch in DIACRITIC_MAP) {
        const dm = DIACRITIC_MAP[ch];
        const bitmap = LETTERS[dm.base];
        if (Array.isArray(bitmap)) return { letter: bitmap, hasDiac: true, mark: dm.mark };
      }
      const direct = LETTERS[ch];
      if (Array.isArray(direct)) return { letter: direct, hasDiac: false };
      const norm = normaliseChar(ch);
      const normed = LETTERS[norm];
      if (Array.isArray(normed)) return { letter: normed, hasDiac: false };
      return { letter: LETTERS['?'], hasDiac: false };
    });
    const hasDiac = charList.some(function(c) { return c.hasDiac; });
    const diacH   = hasDiac ? 2 : 0;
    const textH   = LETTER_H + diacH;
    const totalW  = charList.reduce(function(s, c) { return s + c.letter[0].length; }, 0);
    const nChars  = charList.length;

    // Per-line available height = interiorH split across lines with gaps
    const totalLineH = activeLines.length * textH + (activeLines.length - 1) * LINE_GAP;
    const maxScaleW = totalW > 0 ? Math.floor((interiorW - GAP_BASE * (nChars - 1)) / totalW) : 1;
    // Max scale fitting vertically — each line gets equal share
    const shareH    = Math.floor((interiorH - (activeLines.length - 1) * LINE_GAP) / activeLines.length);
    const maxScaleH = Math.floor(shareH / Math.max(textH, 1));
    const maxFits   = Math.min(maxScaleW, maxScaleH);

    // Resolve scale: user setting (1=S, 0=auto, 3=L) or auto
    let S = line.scale && line.scale > 0 ? line.scale : 0;
    if (S === 0) {
      // Auto: prefer 2, drop to 1, rise to 3 for short words
      if (maxFits < 1) S = 1;
      else if (maxFits < 2) S = 1;
      else {
        const vis = charList.filter(function(c) { return c.letter !== LETTERS[' ']; }).length;
        S = (maxFits >= 3 && vis <= 3) ? 3 : 2;
      }
    }
    // Cap at what fits
    S = Math.min(S, Math.max(maxFits, 1));

    return { charList, hasDiac, diacH, textH, totalW, nChars, S };
  });

  // Total height of all rendered lines + gaps
  const totalRenderedH = lineData.reduce(function(s, d) {
    return s + d.textH * d.S;
  }, 0) + (lineData.length - 1) * LINE_GAP;

  // Start row: centre the block vertically
  let currentRow = edgeClear + Math.floor((interiorH - totalRenderedH) / 2);

  // Draw each line
  lineData.forEach(function(d) {
    const tw = d.totalW * d.S + GAP_BASE * (d.nChars - 1);
    let x = Math.floor((cols - tw) / 2);
    const letterRow = currentRow + d.diacH * d.S;

    d.charList.forEach(function(charEntry) {
      const letter = charEntry.letter;
      const lw = letter[0].length;

      // Diacritic
      if (charEntry.hasDiac && d.hasDiac) {
        const markRows = DIACRITICS[charEntry.mark](lw);
        markRows.forEach(function(rs, dr) {
          rs.split('').forEach(function(ch, dc) {
            if (ch === '1') {
              for (let sy = 0; sy < d.S; sy++)
                for (let sx = 0; sx < d.S; sx++)
                  setCell(currentRow + dr * d.S + sy, x + dc * d.S + sx, 'T');
            }
          });
        });
      }

      // Letter body
      letter.forEach(function(rs, r) {
        rs.split('').forEach(function(ch, c) {
          if (ch === '1') {
            for (let dr = 0; dr < d.S; dr++)
              for (let dc = 0; dc < d.S; dc++)
                setCell(letterRow + r * d.S + dr, x + c * d.S + dc, 'T');
          }
        });
      });

      x += lw * d.S + GAP_BASE;
    });

    currentRow += d.textH * d.S + LINE_GAP;
  });

  return grid;
}