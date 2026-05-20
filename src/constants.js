const { useState, useEffect, useCallback, useRef, useMemo } = React;

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS — LETTER BITMAPS
═══════════════════════════════════════════════════════════════════ */
const LETTERS = {
  'A':["01110","10001","10001","11111","10001","10001","10001"],
  'B':["11110","10001","10001","11110","10001","10001","11110"],
  'C':["01110","10001","10000","10000","10000","10001","01110"],
  'D':["11110","10001","10001","10001","10001","10001","11110"],
  'E':["11111","10000","10000","11110","10000","10000","11111"],
  'F':["11111","10000","10000","11110","10000","10000","10000"],
  'G':["011110","100000","100111","100001","100001","100011","011110"],
  'H':["10001","10001","10001","11111","10001","10001","10001"],
  'I':["111","010","010","010","010","010","111"],
  'J':["00111","00010","00010","00010","00010","10010","01100"],
  'K':["10001","10010","10100","11000","10100","10010","10001"],
  'L':["10000","10000","10000","10000","10000","10000","11111"],
  'M':["10001","11011","10101","10001","10001","10001","10001"],
  'N':["10001","11001","10101","10011","10001","10001","10001"],
  'O':["01110","10001","10001","10001","10001","10001","01110"],
  'P':["11110","10001","10001","11110","10000","10000","10000"],
  'Q':["01110","10001","10001","10001","10101","10010","01101"],
  'R':["11110","10001","10001","11110","10100","10010","10001"],
  'S':["01110","10001","10000","01110","00001","10001","01110"],
  'T':["11111","00100","00100","00100","00100","00100","00100"],
  'U':["10001","10001","10001","10001","10001","10001","01110"],
  'V':["10001","10001","10001","10001","01010","01010","00100"],
  'W':["10001","10001","10001","10101","10101","11011","10001"],
  'X':["10001","10001","01010","00100","01010","10001","10001"],
  'Y':["10001","10001","01010","00100","00100","00100","00100"],
  'Z':["11111","00001","00010","00100","01000","10000","11111"],
  // Scandinavian/accented chars — base letter only, diacritics drawn separately
  // (see DIACRITICS map and buildGrid text renderer)
  '\u00C5':'A', // Å → A + ring above
  '\u00C4':'A', // Ä → A + umlaut
  '\u00D6':'O', // Ö → O + umlaut
  '\u00C6':["011111","100001","100000","111110","100000","100001","011111"], // Æ (unique shape)
  '\u00D8':["011110","100011","100101","101001","110001","100001","011110"], // Ø (unique shape)
  '\u00DC':'U', // Ü → U + umlaut
  '\u00DF':["01110","10001","10001","11110","10001","10001","11110"], // ß (unique shape)
  '\u00C9':'E', // É → E + acute
  '\u00C8':'E', // È → E + grave
  '\u00CA':'E', // Ê → E + circumflex
  '\u00CB':'E', // Ë → E + umlaut
  '\u00C0':'A', // À → A + grave
  '\u00C2':'A', // Â → A + circumflex
  '\u00C3':'A', // Ã → A + tilde
  '\u00C7':["01110","10001","10000","10000","10001","01110","00110"], // Ç (unique shape)
  '\u00CE':'I', // Î → I + circumflex
  '\u00D4':'O', // Ô → O + circumflex
  '\u00D5':'O', // Õ → O + tilde
  '\u00DB':'U', // Û → U + circumflex
  '\u00D9':'U', // Ù → U + grave
  '\u00D1':'N', // Ñ → N + tilde
  '\u00C1':'A', // Á → A + acute
  '\u00CD':'I', // Í → I + acute
  '\u00D3':'O', // Ó → O + acute
  '\u00DA':'U', // Ú → U + acute
  // Punctuation
  '!':["1","1","1","1","0","0","1"],
  '?':["01110","10001","00001","00110","00100","00000","00100"],
  '.':["0","0","0","0","0","0","1"],
  ',':["0","0","0","0","0","1","1"],
  '-':["000","000","000","111","000","000","000"],
  "'":["1","1","0","0","0","0","0"],
  ' ':["000","000","000","000","000","000","000"],
};

// Diacritic marks drawn above the base letter (2 rows tall, same width as letter)
// Each entry is [top_row, bottom_row] as binary strings centred over the letter
// drawn at scale 1 (will be scaled in buildGrid)
const DIACRITICS = {
  // umlaut (Ä Ö Ü Ë) — two dots with breathing space above
  // row 0 = empty gap, row 1 = two dots
  'umlaut': function(w) {
    const mid = Math.floor(w / 2);
    const d1  = Math.max(0, mid - 1);
    const d2  = Math.min(w - 1, mid + 1);
    const dots = Array(w).fill('0');
    dots[d1] = '1'; dots[d2] = '1';
    return ['0'.repeat(w), dots.join('')];
  },
  // ring above (Å) — solid 3-pixel arc, clearly distinct from umlaut
  'ring': function(w) {
    const mid = Math.floor(w / 2);
    const arc = Array(w).fill('0');
    // Three pixels: left, centre, right — a solid small arc
    if (mid > 0) arc[mid - 1] = '1';
    arc[mid] = '1';
    if (mid < w - 1) arc[mid + 1] = '1';
    // empty row first (gap between arc and letter top), then arc
    return ['0'.repeat(w), arc.join('')];
  },
  // acute accent (Á É Í Ó Ú) — single pixel, right-leaning
  'acute': function(w) {
    const mid = Math.floor(w / 2);
    const r1  = Array(w).fill('0');
    const r2  = Array(w).fill('0');
    if (mid < w - 1) r1[mid + 1] = '1';
    r2[mid] = '1';
    return [r1.join(''), r2.join('')];
  },
  // grave accent (À È Ù) — single pixel, left-leaning
  'grave': function(w) {
    const mid = Math.floor(w / 2);
    const r1  = Array(w).fill('0');
    const r2  = Array(w).fill('0');
    if (mid > 0) r1[mid - 1] = '1';
    r2[mid] = '1';
    return [r1.join(''), r2.join('')];
  },
  // circumflex (Â Ê Î Ô Û) — caret shape
  'circumflex': function(w) {
    const mid = Math.floor(w / 2);
    const r1  = Array(w).fill('0');
    const r2  = Array(w).fill('0');
    if (mid > 0) r1[mid - 1] = '1';
    if (mid < w - 1) r1[mid + 1] = '1';
    r2[mid] = '1';
    return [r1.join(''), r2.join('')];
  },
  // tilde (Ã Ñ Õ) — wave
  'tilde': function(w) {
    const mid = Math.floor(w / 2);
    const r1  = Array(w).fill('0');
    const r2  = Array(w).fill('0');
    if (mid > 1) r1[mid - 2] = '1';
    r1[mid] = '1';
    if (mid < w - 1) r1[mid + 1] = '1';
    if (mid > 0) r2[mid - 1] = '1';
    r2[mid] = '1';
    if (mid < w - 2) r2[mid + 2] = '1';
    return [r1.join(''), r2.join('')];
  },
};

// Map each accented char to {base, diacritic}
const DIACRITIC_MAP = {
  '\u00C5': {base:'A', mark:'ring'},
  '\u00C4': {base:'A', mark:'umlaut'},
  '\u00D6': {base:'O', mark:'umlaut'},
  '\u00DC': {base:'U', mark:'umlaut'},
  '\u00CB': {base:'E', mark:'umlaut'},
  '\u00C9': {base:'E', mark:'acute'},
  '\u00C1': {base:'A', mark:'acute'},
  '\u00CD': {base:'I', mark:'acute'},
  '\u00D3': {base:'O', mark:'acute'},
  '\u00DA': {base:'U', mark:'acute'},
  '\u00C8': {base:'E', mark:'grave'},
  '\u00C0': {base:'A', mark:'grave'},
  '\u00D9': {base:'U', mark:'grave'},
  '\u00CA': {base:'E', mark:'circumflex'},
  '\u00C2': {base:'A', mark:'circumflex'},
  '\u00CE': {base:'I', mark:'circumflex'},
  '\u00D4': {base:'O', mark:'circumflex'},
  '\u00DB': {base:'U', mark:'circumflex'},
  '\u00C3': {base:'A', mark:'tilde'},
  '\u00D1': {base:'N', mark:'tilde'},
  '\u00D5': {base:'O', mark:'tilde'},
};

// Normalise a character — maps accented/special chars to their LETTERS key
function normaliseChar(ch) {
  ch = ch.toUpperCase();
  if (ch in LETTERS) return ch;
  // For chars with diacritics, return the base letter
  // (diacritic will be drawn separately in buildGrid)
  if (ch in DIACRITIC_MAP) return DIACRITIC_MAP[ch].base;
  const map = {
    '\u00CC':'I', '\u00CF':'I', '\u00D0':'D', '\u00D2':'O',
    '\u00DD':'Y', '\u00DE':'P',
  };
  return map[ch] || '?';
}

/* ═══════════════════════════════════════════════════════════════════
   BUILT-IN BORDERS — seeded to Firestore on first load
═══════════════════════════════════════════════════════════════════ */
const BUILTIN_BORDERS = [
  {
    id: 'classic-british',
    name: 'Classic British',
    style: 'british',
    description: 'Alternating diagonal check in two colours with corner football motifs, centred goal posts on top and bottom, and shot arrows on the sides. Rooted in traditional British cross-stitch samplers.',
    traits: ['diagonal-check','corner-footballs','goal-posts','shot-arrows'],
    builtIn: true,
    createdBy: null,
    get spec() { return BORDER_SPECS.british; },
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    style: 'scandinavian',
    description: 'Clean geometric border with repeating diamond motifs and a simple two-line frame. Inspired by Nordic folk embroidery traditions.',
    traits: ['geometric','diamond-repeat','two-line-frame'],
    builtIn: true,
    createdBy: null,
    get spec() { return BORDER_SPECS.scandinavian; },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    style: 'minimal',
    description: 'A solid border line with a secondary inner line and no motifs. Clean, modern. Lets the word do all the work.',
    traits: ['single-line'],
    builtIn: true,
    createdBy: null,
    get spec() { return BORDER_SPECS.minimal; },
  },
];

/* ═══════════════════════════════════════════════════════════════════
   GRID ENGINE — pure logic, no React, no Firebase
═══════════════════════════════════════════════════════════════════ */
