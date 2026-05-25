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
  const borderDepth = (spec && spec.layers) ? spec.layers.length : 2;
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
  layers.forEach(function(layer) {
    const ln = layer.line;
    if (layer.type === 'solid') {
      const k = layer.color === 'secondary' ? 'D' : layer.color === 'accent' ? 'E' : layer.color === 'border3' ? 'H' : layer.color === 'accent1' ? 'J' : layer.color === 'accent2' ? 'L' : 'B';
      for (let i=ln; i<N-ln; i++) {
        setCell(ln, i, k); setCell(N-1-ln, i, k);
        setCell(i, ln, k); setCell(i, N-1-ln, k);
      }
    } else if (layer.type === 'check') {
      const kA = layer.colorA === 'secondary' ? 'D' : layer.colorA === 'accent' ? 'E' : layer.colorA === 'border3' ? 'H' : layer.colorA === 'accent1' ? 'J' : layer.colorA === 'accent2' ? 'L' : 'A';
      const kB = layer.colorB === 'secondary' ? 'D' : layer.colorB === 'accent' ? 'E' : layer.colorB === 'border3' ? 'I' : layer.colorB === 'accent1' ? 'K' : layer.colorB === 'accent2' ? 'M' : 'A';
      for (let i=ln; i<N-ln; i++) {
        setCell(ln,     i, i%2===0?kA:kB); setCell(N-1-ln, i, i%2===1?kA:kB);
        setCell(i,     ln, i%2===0?kA:kB); setCell(i, N-1-ln, i%2===1?kA:kB);
      }
    }
    // 'empty' — skip
  });

  // Helper: resolve a colour name to a grid kind
  function colorKind(color, fallback) {
    return color === 'secondary' ? 'D'
      : color === 'accent'   ? 'E'
      : color === 'border3'  ? 'H'
      : color === 'accent1'  ? 'J'
      : color === 'accent2'  ? 'L'
      : fallback || 'F';
  }

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

  const inset = spec.cornerInset || layers.length + 2;

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
function CrossStitchCanvas({ word, cols, rows, borderStyle, threads, size, className, textScale }) {
  const canvasRef = useRef(null);
  cols = cols||110; rows = rows||110;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !word) return;
    const px = size||440;
    const cell = px/cols;
    canvas.width = px; canvas.height = px;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#F0E6D3';
    ctx.fillRect(0,0,px,px);

    const grid = buildGrid(word, cols, rows, borderStyle, textScale || 0, 2);
    const pad = cell*0.1;
    const lw  = Math.max(cell*0.24, 0.5);

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
    for(let i=0;i<=cols;i++){ctx.beginPath();ctx.moveTo(i*cell,0);ctx.lineTo(i*cell,px);ctx.stroke();}
    for(let i=0;i<=rows;i++){ctx.beginPath();ctx.moveTo(0,i*cell);ctx.lineTo(px,i*cell);ctx.stroke();}
    // every-10
    ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=0.5;
    for(let i=0;i<=cols;i+=10){ctx.beginPath();ctx.moveTo(i*cell,0);ctx.lineTo(i*cell,px);ctx.stroke();}
    for(let i=0;i<=rows;i+=10){ctx.beginPath();ctx.moveTo(0,i*cell);ctx.lineTo(px,i*cell);ctx.stroke();}
    // frame
    ctx.strokeStyle='#1A1A1A'; ctx.lineWidth=1.5;
    ctx.strokeRect(0,0,px,px);

  }, [word, cols, rows, borderStyle, size, JSON.stringify(threads)]);

  return (
    <div className={className||'canvas-full'}>
      <canvas ref={canvasRef}/>
    </div>
  );
}

