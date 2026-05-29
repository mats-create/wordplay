/* ═══════════════════════════════════════════════════════════════════
   CLAUDE-KEVIN — API + ENGINE
   Key is entered by user, saved to Firestore — never in source code.
═══════════════════════════════════════════════════════════════════ */

// Global key state — loaded from Firestore on sign-in
let _kevinApiKey = '';

function setKevinApiKey(val) { _kevinApiKey = val; }
function getKevinApiKey()    { return _kevinApiKey; }
function hasKevinApiKey()    { return !!_kevinApiKey && _kevinApiKey.trim().length > 0; }

function kevinHeaders() {
  const h = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
    'anthropic-beta': 'prompt-caching-2024-07-31',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
  if (hasKevinApiKey()) h['x-api-key'] = _kevinApiKey.trim();
  return h;
}

async function loadKevinKeyFromFirestore(uid) {
  try {
    const fb  = window.__firebase;
    const ref = fb.doc(fb.db, 'users', uid, 'settings', 'kevin');
    const snap = await fb.getDoc(ref);
    if (snap.exists()) {
      const key = snap.data().apiKey;
      if (key) setKevinApiKey(key);
    }
  } catch(e) { console.warn('Could not load Kevin key:', e); }
}

async function saveKevinKeyToFirestore(uid, key) {
  try {
    const fb  = window.__firebase;
    const ref = fb.doc(fb.db, 'users', uid, 'settings', 'kevin');
    await fb.setDoc(ref, { apiKey: key }, { merge: true });
    setKevinApiKey(key);
  } catch(e) { console.warn('Could not save Kevin key:', e); }
}

function kevinSystemPrompt(context) {
  return `You are Claude-Kevin — in-house embroidery specialist and football expert for Nutmeg&Needle, a Malmö brand making cross-stitch kits from football words and exclamations. Tagline: "Handcrafted football moves."

Voice: knowing, dry wit, craft-proud, inclusive. Never say "bespoke", "artisan", or "curated". No exclamation marks. Sentence case. Keep responses short — one or two paragraphs at most unless detail is genuinely needed.

Tools:
- SHOUTOUT = embroidery design (word + border + threads). Use createShoutout/updateShoutout/deleteShoutout.
- BORDER = reusable perimeter pattern. Use createBorder/updateBorder/deleteBorder.
- Always listBorders before createShoutout. Confirm before any delete. When creating, just do it — confirm after.
- Use getBorderSpec to read a border's full spec before adapting it into a new design.
- Default threads (slots 1–3): Pitch black DMC 310 #1A1A1A, Pitch green DMC 3362 #4A6741, Coral DMC 350 #CC3300.
- Thread slots are named and position-based — order matters:
  Slot 1 = Shoutout (word colour), Slot 2 = Border 1 (main lines), Slot 3 = Border 2 (secondary),
  Slot 4 = Border 3, Slot 5 = Accent 1, Slot 6 = Accent 2.
  Slots 4–6 are optional — only add them when the design needs extra colours.
  Any DMC colour can go in any slot.
- Border spec: layers [{line, type, color, tile?}], cornerMotif {color, pattern[]}, sideMotifs [{position, color, pattern}], cornerInset, borderWeight (1 or 2), cornerFill (colour name).
  Colour names: primary (slot 1), secondary (slot 2), accent (slot 3), border3 (slot 4), accent1 (slot 5), accent2 (slot 6).
- Tile patterns: each layer can have an optional 'tile' field — an 8-character binary string e.g. "10001000".
  Stitch is drawn at position i only if tile[i%8]==='1'. No tile or all-1s = solid line.
  Examples: "11001100"=dashed, "10001000"=sparse dots, "11110000"=long-short stripe.
- borderWeight: 1 (default, single stitch) or 2 (double stitch — max 3 layers, tiles should be "11111111" solid).
- cornerFill: colour name for the solid corner zones of the frame. If omitted, corners follow the tile pattern.
- Per-position overrides: to set individual corners or sides differently from the global motif, use:
  cornerOverrides: { topLeft, topRight, bottomLeft, bottomRight } — each with {color, pattern[]}
  sideOverrides: { top, bottom, left, right } — each with {color, pattern[]}
  Any position not in overrides falls back to the global cornerMotif/sideMotif.
  Use overrides for: asymmetric designs, pitch corner areas (triangles pointing different directions),
  home/away colour asymmetry (left=home colour, right=away colour), or any position-specific design.
  Example: to make top-left corner a triangle pointing inward, set cornerOverrides.topLeft with a
  suitable pattern while other corners use the global cornerMotif.
- Swatch convention: when listing or confirming thread colours in chat, include [swatch:#HEX] inline after each hex code so the user sees a colour preview. Example: "Pitch black DMC 310 [swatch:#1A1A1A]".

Image-to-motif: when the user uploads an image, analyse it and generate a cross-stitch bitmap pattern suitable for use as a border motif. Rules:
- Target size: 9×9 for standard, 11×11 for enlarged. Always state which size you chose.
- Output the pattern as a JSON array of binary strings, all the same length. Example: ["01110","10001","10001","01110"] 
- Simplify heavily — cross-stitch works at very low resolution. Capture the essence, not the detail.
- After generating, show a text preview using █ for 1 and · for 0 so the user can see it.
- Ask the user which position to place it (cornerMotif, or which sideOverride/cornerOverride position).
- Then call createBorder or updateBorder with the pattern embedded in the spec.
- Always confirm the result after applying it.

Corner motif sizes: Standard 9x9 cornerInset 7, Enlarged 11x11 cornerInset 8. listBorders returns cornerMotifSizeLabel. Redraw fully when resizing.

Expertise: cross-stitch and border traditions (British, Scandinavian, Hardanger, Blackwork, folk); DMC threads; football vocabulary from all cultures and languages; trademark risks (flag club/competition names, generic football vocab is fine).

Context: screen=${context.tab} | shoutouts=${context.shoutoutCount} (${context.shoutoutNames}) | borders=${context.borderNames} | objects=${context.objectCount} (${context.objectNames}) | shoutout folders=${context.shoutoutFolders} | border folders=${context.borderFolders} | default hoop 280x250mm, 14-count Aida, 94x94 stitches.

Object library: per-user collection of reusable binary stitch patterns. Objects have name, pattern (string[]), width, height. Max 42 wide, max 12 tall. Use listObjects/createObject/updateObject/deleteObject to manage them. When creating a border, you can use a saved object's pattern directly in cornerMotif, sideMotif, cornerOverrides, or sideOverrides — reference it by name from listObjects. When generating a pattern from an image, offer to save it as an object for reuse.

Layered objects: objects can have multiple colour layers instead of a single pattern. A layered object has layers:[{colorSlot, pattern[]}] instead of a top-level pattern field. Each layer's colorSlot maps to a thread slot (primary/secondary/accent/border3/accent1/accent2), so the object renders in the actual thread colours of whichever shoutout uses it. Max 4 layers per object. Use createObject/updateObject with the layers field to create or update layered objects.

Composition model: shoutouts now support a placedObjects field — a map of position IDs to object placements. Position IDs are: topLeft, topRight, bottomLeft, bottomRight (corners), top, bottom, left, right (sides). Each placed object overrides the border's default motif at that position and renders with the shoutout's thread colours via the object's colorSlot assignments. Use placeObject to place an object at a position, removeObject to clear one. listShoutouts returns placedObjects for each shoutout so you can see what is placed where. All 8 positions accept objects up to 42×42 stitches — the canvas is the visual guide for overlap or fit issues.

Folders: shoutouts, borders and objects can be assigned to a folder (a string tag). When creating or updating, you can set the folder field to any existing folder name, or null for unfiled. Always use an existing folder name from context unless the user asks to create a new one.

UI flow: tapping a card in the library selects it and reveals an action toolbar at the bottom of the screen. From there the user can Compose (open the full composition workspace), move to a folder, export PDFs, or delete. There are no detail sheets — the card thumbnail shows the full design. When the user says they want to edit or open a shoutout, they mean opening it in Compose.`;
}

// ── Kevin tool definitions ────────────────────────────────────────────────────
const KEVIN_TOOLS = [
  {
    name: 'listShoutouts',
    description: 'List all football shoutouts in the library with their key details.',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'listBorders',
    description: 'List all border styles in the border library.',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'createShoutout',
    description: 'Create a new football shoutout and add it to the library. Use listBorders first to pick a valid borderId.',
    input_schema: {
      type: 'object',
      properties: {
        name:      { type: 'string',  description: 'The word or phrase, e.g. "WORLDIE"' },
        stitchesW: { type: 'number',  description: 'Width in stitches, default 94' },
        stitchesH: { type: 'number',  description: 'Height in stitches, default 94' },
        hoopW:     { type: 'number',  description: 'Hoop width in mm, default 280' },
        hoopH:     { type: 'number',  description: 'Hoop height in mm, default 250' },
        borderId:  { type: 'string',  description: 'ID of the border to use' },
        borderName:{ type: 'string',  description: 'Display name of the border' },
        threads:   { type: 'array',   description: 'Thread list: [{name, dmc, hex, usage}]',
          items: { type: 'object', properties: {
            name:  { type: 'string' }, dmc:   { type: 'string' },
            hex:   { type: 'string' }, usage: { type: 'string' }
          }}
        },
        notes:     { type: 'string',  description: 'Optional notes' },
      },
      required: ['name', 'borderId', 'borderName']
    }
  },
  {
    name: 'updateShoutout',
    description: 'Update an existing shoutout by its id. Use listShoutouts to find the id. Only provide fields to change.',
    input_schema: {
      type: 'object',
      properties: {
        id:        { type: 'string', description: 'Shoutout id from listShoutouts' },
        name:      { type: 'string' },
        stitchesW: { type: 'number' },
        stitchesH: { type: 'number' },
        hoopW:     { type: 'number' },
        hoopH:     { type: 'number' },
        borderId:  { type: 'string' },
        borderName:{ type: 'string' },
        threads:   { type: 'array', items: { type: 'object' } },
        notes:     { type: 'string' },
      },
      required: ['id']
    }
  },
  {
    name: 'deleteShoutout',
    description: 'Delete a shoutout by its id. Use listShoutouts to confirm the id first.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Shoutout id to delete' },
      },
      required: ['id']
    }
  },
  {
    name: 'undoLastAction',
    description: 'Undo the last create, update, or delete action Kevin performed in this session.',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'createBorder',
    description: 'Create a new border style and add it to the border library. Provide a full border spec with layers, cornerMotif and sideMotifs.',
    input_schema: {
      type: 'object',
      properties: {
        name:        { type: 'string', description: 'Border name, e.g. "Nordic Stars"' },
        style:       { type: 'string', description: 'Unique style key, lowercase-hyphen, e.g. "nordic-stars"' },
        description: { type: 'string', description: 'What tradition/style this draws from' },
        traits:      { type: 'array',  items: { type: 'string' }, description: 'Style traits, e.g. ["geometric","stars","folk"]' },
        spec: {
          type: 'object',
          description: 'Full border spec. Must include layers array. Optional cornerMotif and sideMotifs.',
          properties: {
            cornerInset: { type: 'number', description: 'How many stitches from edge to place corner motifs' },
            layers: {
              type: 'array',
              description: 'Border lines from outside in. Each layer has: line (0=outermost), type (solid/check/empty), color (primary/secondary/accent), colorA+colorB for check.',
              items: { type: 'object' }
            },
            cornerMotif: {
              type: 'object',
              description: 'Global motif placed at all corners (unless overridden). Has color and pattern (array of binary strings).',
              properties: {
                color:   { type: 'string' },
                pattern: { type: 'array', items: { type: 'string' } }
              }
            },
            sideMotifs: {
              type: 'array',
              description: 'Global motifs placed at side centres (unless overridden). Each has position (top-bottom/left-right/all), color, and pattern.',
              items: { type: 'object' }
            },
            cornerOverrides: {
              type: 'object',
              description: 'Per-corner overrides. Keys: topLeft, topRight, bottomLeft, bottomRight. Each has {color, pattern[]}. Overrides the global cornerMotif for that corner only.',
              properties: {
                topLeft:     { type: 'object' },
                topRight:    { type: 'object' },
                bottomLeft:  { type: 'object' },
                bottomRight: { type: 'object' },
              }
            },
            sideOverrides: {
              type: 'object',
              description: 'Per-side overrides. Keys: top, bottom, left, right. Each has {color, pattern[]}. Overrides the global sideMotif for that side only.',
              properties: {
                top:    { type: 'object' },
                bottom: { type: 'object' },
                left:   { type: 'object' },
                right:  { type: 'object' },
              }
            }
          },
          required: ['layers']
        }
      },
      required: ['name', 'style', 'description', 'spec']
    }
  },
  {
    name: 'updateBorder',
    description: 'Update an existing custom border by its id. Use listBorders to find the id. Cannot update built-in borders.',
    input_schema: {
      type: 'object',
      properties: {
        id:          { type: 'string', description: 'Border id from listBorders' },
        name:        { type: 'string' },
        description: { type: 'string' },
        traits:      { type: 'array', items: { type: 'string' } },
        spec:        { type: 'object' },
      },
      required: ['id']
    }
  },
  {
    name: 'getBorderSpec',
    description: 'Get the full spec (layers, cornerMotif, sideMotifs) for a specific border by its id. Use this before creating a new border based on an existing one.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Border id from listBorders' },
      },
      required: ['id']
    }
  },
  {
    name: 'deleteBorder',
    description: 'Delete a custom border by its id. Cannot delete built-in borders.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Border id to delete' },
      },
      required: ['id']
    }
  },
  {
    name: 'listObjects',
    description: 'List all motif objects in the user\'s object library.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'createObject',
    description: 'Create a new motif object and save it to the object library. Objects are reusable binary stitch patterns for use in border designs.',
    input_schema: {
      type: 'object',
      properties: {
        name:    { type: 'string', description: 'Name for this object' },
        pattern: { type: 'array', items: { type: 'string' }, description: 'Array of binary strings (0=empty, 1=stitch). All strings must be the same length. Max 41 wide, max 11 tall.' },
        width:   { type: 'number', description: 'Pattern width in stitches' },
        height:  { type: 'number', description: 'Pattern height in stitches' },
      },
      required: ['name', 'pattern']
    }
  },
  {
    name: 'updateObject',
    description: 'Update an existing motif object by its id.',
    input_schema: {
      type: 'object',
      properties: {
        id:      { type: 'string', description: 'Object id from listObjects' },
        name:    { type: 'string', description: 'New name' },
        pattern: { type: 'array', items: { type: 'string' }, description: 'New pattern array' },
        width:   { type: 'number' },
        height:  { type: 'number' },
      },
      required: ['id']
    }
  },
  {
    name: 'deleteObject',
    description: 'Delete a motif object by its id.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Object id to delete' },
      },
      required: ['id']
    }
  },
  {
    name: 'placeObject',
    description: 'Place an object from the object library at a specific position on a shoutout. The object renders using the shoutout thread palette via its colorSlot assignments. Corner positions (topLeft/topRight/bottomLeft/bottomRight) accept max 9x9 objects. Side positions top/bottom accept max 41 wide x 9 tall; left/right accept max 9 wide x 41 tall.',
    input_schema: {
      type: 'object',
      properties: {
        shoutoutId: { type: 'string', description: 'Shoutout id from listShoutouts' },
        positionId: { type: 'string', description: 'Position: topLeft, topRight, bottomLeft, bottomRight, top, bottom, left, right' },
        objectId:   { type: 'string', description: 'Object id from listObjects' },
      },
      required: ['shoutoutId', 'positionId', 'objectId']
    }
  },
  {
    name: 'removeObject',
    description: 'Remove a placed object from a specific position on a shoutout, restoring the border default motif at that position.',
    input_schema: {
      type: 'object',
      properties: {
        shoutoutId: { type: 'string', description: 'Shoutout id from listShoutouts' },
        positionId: { type: 'string', description: 'Position to clear: topLeft, topRight, bottomLeft, bottomRight, top, bottom, left, right' },
      },
      required: ['shoutoutId', 'positionId']
    }
  },
];

// ── Kevin undo stack (session only) ──────────────────────────────────────────
const _kevinUndoStack = [];

function kevinLogUndo(entry) { _kevinUndoStack.push(entry); }

// Execute a tool call — returns result string
async function executeKevinTool(toolName, toolInput, appData) {
  const fb  = appData.fb;
  const uid = appData.uid;

  // ── Read tools ──
  if (toolName === 'listShoutouts') {
    const shoutouts = appData.shoutouts || [];
    if (shoutouts.length === 0) return 'No shoutouts in library yet.';
    return JSON.stringify(shoutouts.map(function(s) {
      const placed = s.placedObjects || {};
      const placedSummary = Object.keys(placed).length > 0
        ? Object.keys(placed).map(function(pos) {
            return pos + ': ' + (placed[pos].name || placed[pos].id || 'object');
          }).join(', ')
        : 'none';
      return {
        id: s.id, name: s.name,
        stitches: s.stitchesW + 'x' + s.stitchesH,
        hoop: s.hoopW + 'x' + s.hoopH + 'mm',
        border: s.borderName || 'none',
        threads: (s.threads || []).map(function(t) { return t.name + ' (' + t.dmc + ')'; }),
        placedObjects: placedSummary,
        notes: s.notes || '',
      };
    }), null, 2);
  }

  if (toolName === 'listBorders') {
    const borders = appData.borders || [];
    if (borders.length === 0) return 'No borders in library yet.';
    return JSON.stringify(borders.map(function(b) {
      const motif = b.spec && b.spec.cornerMotif;
      const motifSize = motif && motif.pattern
        ? motif.pattern.length + 'x' + motif.pattern[0].length
        : 'none';
      const inset = b.spec && b.spec.cornerInset ? b.spec.cornerInset : null;
      const sizeLabel = motif
        ? (inset >= 8 ? 'enlarged' : 'standard')
        : 'none';
      return {
        id: b.id, name: b.name, style: b.style,
        description: b.description, traits: b.traits || [],
        builtIn: b.builtIn || false, hasSpec: !!b.spec,
        cornerMotifSize: motifSize, cornerMotifSizeLabel: sizeLabel,
      };
    }), null, 2);
  }

  // ── Write tools ──
  if (toolName === 'createShoutout') {
    try {
      const border = (appData.borders || []).find(function(b) { return b.id === toolInput.borderId; });
      const borderSpec = (border && border.spec) ? border.spec
                       : (BORDER_SPECS[border && border.style] || null);
      const data = {
        name:        toolInput.name || '',
        stitchesW:   toolInput.stitchesW || 94,
        stitchesH:   toolInput.stitchesH || 94,
        hoopW:       toolInput.hoopW || 280,
        hoopH:       toolInput.hoopH || 250,
        borderId:    toolInput.borderId || '',
        borderName:  toolInput.borderName || '',
        borderStyle: border ? border.style : 'british',
        borderSpec:  borderSpec,
        threads:     toolInput.threads || [
          { name:'Pitch black', dmc:'DMC 310',  hex:'#1A1A1A', usage:'Main text' },
          { name:'Pitch green', dmc:'DMC 3362', hex:'#4A6741', usage:'Border accents' },
          { name:'Coral',       dmc:'DMC 350',  hex:'#CC3300', usage:'Highlights' },
        ],
        notes: toolInput.notes || '',
        createdAt: fb.serverTimestamp(),
        updatedAt: fb.serverTimestamp(),
      };
      const ref = await fb.addDoc(
        fb.collection(fb.db, 'users', uid, 'shoutouts'), data
      );
      kevinLogUndo({ action: 'createShoutout', id: ref.id, uid });
      return 'Shoutout created with id: ' + ref.id;
    } catch(e) { return 'Error creating shoutout: ' + e.message; }
  }

  if (toolName === 'updateShoutout') {
    try {
      const id = toolInput.id;
      if (!id) return 'Error: id is required.';
      // Snapshot current state for undo
      const current = (appData.shoutouts || []).find(function(s) { return s.id === id; });
      const fields = Object.assign({}, toolInput);
      delete fields.id;
      // If border changed, update borderStyle and borderSpec too
      if (fields.borderId) {
        const border = (appData.borders || []).find(function(b) { return b.id === fields.borderId; });
        if (border) {
          fields.borderStyle = border.style;
          fields.borderSpec  = border.spec || BORDER_SPECS[border.style] || null;
          if (!fields.borderName) fields.borderName = border.name;
        }
      }
      fields.updatedAt = fb.serverTimestamp();
      await fb.updateDoc(
        fb.doc(fb.db, 'users', uid, 'shoutouts', id), fields
      );
      kevinLogUndo({ action: 'updateShoutout', id, uid, previous: current });
      return 'Shoutout ' + id + ' updated.';
    } catch(e) { return 'Error updating shoutout: ' + e.message; }
  }

  if (toolName === 'deleteShoutout') {
    try {
      const id = toolInput.id;
      if (!id) return 'Error: id is required.';
      const current = (appData.shoutouts || []).find(function(s) { return s.id === id; });
      await fb.deleteDoc(fb.doc(fb.db, 'users', uid, 'shoutouts', id));
      kevinLogUndo({ action: 'deleteShoutout', id, uid, previous: current });
      return 'Shoutout ' + id + ' deleted.';
    } catch(e) { return 'Error deleting shoutout: ' + e.message; }
  }

  if (toolName === 'undoLastAction') {
    const last = _kevinUndoStack.pop();
    if (!last) return 'Nothing to undo.';
    try {
      if (last.action === 'createShoutout') {
        await fb.deleteDoc(fb.doc(fb.db, 'users', last.uid, 'shoutouts', last.id));
        return 'Undone — shoutout removed.';
      }
      if (last.action === 'updateShoutout' && last.previous) {
        const prev = Object.assign({}, last.previous); delete prev.id;
        await fb.updateDoc(fb.doc(fb.db, 'users', last.uid, 'shoutouts', last.id), prev);
        return 'Undone — shoutout restored to previous state.';
      }
      if (last.action === 'deleteShoutout' && last.previous) {
        const prev = Object.assign({}, last.previous); delete prev.id;
        await fb.setDoc(fb.doc(fb.db, 'users', last.uid, 'shoutouts', last.id), prev);
        return 'Undone — shoutout restored.';
      }
      if (last.action === 'createBorder') {
        await fb.deleteDoc(fb.doc(fb.db, 'users', uid, 'borders', last.id));
        return 'Undone — border removed.';
      }
      if (last.action === 'updateBorder' && last.previous) {
        const prev = Object.assign({}, last.previous); delete prev.id;
        await fb.updateDoc(fb.doc(fb.db, 'users', uid, 'borders', last.id), prev);
        return 'Undone — border restored to previous state.';
      }
      if (last.action === 'deleteBorder' && last.previous) {
        const prev = Object.assign({}, last.previous); delete prev.id;
        await fb.setDoc(fb.doc(fb.db, 'users', uid, 'borders', last.id), prev);
        return 'Undone — border restored.';
      }
      if (last.action === 'createObject') {
        await fb.deleteDoc(fb.doc(fb.db, 'users', uid, 'objects', last.id));
        return 'Undone — object removed.';
      }
      if (last.action === 'updateObject' && last.previous) {
        const prev = Object.assign({}, last.previous); delete prev.id;
        await fb.updateDoc(fb.doc(fb.db, 'users', uid, 'objects', last.id), prev);
        return 'Undone — object restored to previous state.';
      }
      if (last.action === 'deleteObject' && last.previous) {
        const prev = Object.assign({}, last.previous); delete prev.id;
        await fb.setDoc(fb.doc(fb.db, 'users', uid, 'objects', last.id), prev);
        return 'Undone — object restored.';
      }
      return 'Could not undo — previous state unavailable.';
    } catch(e) { return 'Undo failed: ' + e.message; }
  }

  if (toolName === 'getBorderSpec') {
    const id = toolInput.id;
    if (!id) return 'Error: id is required.';
    const border = (appData.borders || []).find(function(b) { return b.id === id; });
    if (!border) return 'Border not found with id: ' + id;
    const spec = border.spec || BORDER_SPECS[border.style] || null;
    if (!spec) return 'Border "' + border.name + '" has no spec stored.';
    return JSON.stringify({
      id: border.id,
      name: border.name,
      style: border.style,
      description: border.description,
      spec: spec,
    }, null, 2);
  }

  if (toolName === 'createBorder') {
    try {
      const style = toolInput.style || toolInput.name.toLowerCase().replace(/\s+/g,'-');
      const spec  = toolInput.spec || null;
      if (!spec || !spec.layers) return 'Error: spec.layers is required.';
      const data = {
        name:        toolInput.name,
        style:       style,
        description: toolInput.description || '',
        traits:      toolInput.traits || [],
        spec:        spec,
        builtIn:     false,
        createdBy:   uid,
        createdAt:   fb.serverTimestamp(),
        updatedAt:   fb.serverTimestamp(),
      };
      const ref = await fb.addDoc(fb.collection(fb.db, 'users', uid, 'borders'), data);
      kevinLogUndo({ action: 'createBorder', id: ref.id });
      return 'Border created with id: ' + ref.id + '. It is now available in the border library.';
    } catch(e) { return 'Error creating border: ' + e.message; }
  }

  if (toolName === 'updateBorder') {
    try {
      const id = toolInput.id;
      if (!id) return 'Error: id is required.';
      const current = (appData.borders || []).find(function(b) { return b.id === id; });
      if (current && current.builtIn) return 'Error: cannot update built-in borders.';
      const fields = Object.assign({}, toolInput);
      delete fields.id;
      fields.updatedAt = fb.serverTimestamp();
      await fb.updateDoc(fb.doc(fb.db, 'users', uid, 'borders', id), fields);
      kevinLogUndo({ action: 'updateBorder', id, previous: current });
      return 'Border ' + id + ' updated.';
    } catch(e) { return 'Error updating border: ' + e.message; }
  }

  if (toolName === 'deleteBorder') {
    try {
      const id = toolInput.id;
      if (!id) return 'Error: id is required.';
      const current = (appData.borders || []).find(function(b) { return b.id === id; });
      if (current && current.builtIn) return 'Error: cannot delete built-in borders.';
      await fb.deleteDoc(fb.doc(fb.db, 'users', uid, 'borders', id));
      kevinLogUndo({ action: 'deleteBorder', id, previous: current });
      return 'Border ' + id + ' deleted.';
    } catch(e) { return 'Error deleting border: ' + e.message; }
  }

  if (toolName === 'listObjects') {
    const objs = appData.objects || [];
    if (objs.length === 0) return 'No objects in library yet.';
    return JSON.stringify(objs.map(function(o) {
      return { id: o.id, name: o.name, width: o.width, height: o.height, pattern: o.pattern || [] };
    }), null, 2);
  }

  if (toolName === 'createObject') {
    try {
      const pattern = toolInput.pattern;
      if (!pattern || !Array.isArray(pattern) || pattern.length === 0) return 'Error: pattern array is required.';
      const h = pattern.length;
      const w = pattern[0].length;
      const data = {
        name:    toolInput.name,
        pattern: pattern,
        width:   toolInput.width  || w,
        height:  toolInput.height || h,
        createdAt: fb.serverTimestamp(),
        updatedAt: fb.serverTimestamp(),
      };
      const ref = await fb.addDoc(fb.collection(fb.db, 'users', uid, 'objects'), data);
      kevinLogUndo({ action: 'createObject', id: ref.id });
      return 'Object "' + toolInput.name + '" created with id: ' + ref.id;
    } catch(e) { return 'Error creating object: ' + e.message; }
  }

  if (toolName === 'updateObject') {
    try {
      const id = toolInput.id;
      if (!id) return 'Error: id is required.';
      const current = (appData.objects || []).find(function(o) { return o.id === id; });
      const fields = Object.assign({}, toolInput);
      delete fields.id;
      if (fields.pattern) {
        fields.width  = fields.pattern[0] ? fields.pattern[0].length : (fields.width || 9);
        fields.height = fields.pattern.length;
      }
      fields.updatedAt = fb.serverTimestamp();
      await fb.updateDoc(fb.doc(fb.db, 'users', uid, 'objects', id), fields);
      kevinLogUndo({ action: 'updateObject', id, previous: current });
      return 'Object ' + id + ' updated.';
    } catch(e) { return 'Error updating object: ' + e.message; }
  }

  if (toolName === 'deleteObject') {
    try {
      const id = toolInput.id;
      if (!id) return 'Error: id is required.';
      const current = (appData.objects || []).find(function(o) { return o.id === id; });
      await fb.deleteDoc(fb.doc(fb.db, 'users', uid, 'objects', id));
      kevinLogUndo({ action: 'deleteObject', id, previous: current });
      return 'Object ' + id + ' deleted.';
    } catch(e) { return 'Error deleting object: ' + e.message; }
  }

  if (toolName === 'placeObject') {
    try {
      const { shoutoutId, positionId, objectId } = toolInput;
      if (!shoutoutId || !positionId || !objectId) return 'Error: shoutoutId, positionId, and objectId are all required.';
      const validPositions = ['topLeft','topRight','bottomLeft','bottomRight','top','bottom','left','right'];
      if (!validPositions.includes(positionId)) return 'Error: invalid positionId. Must be one of: ' + validPositions.join(', ');
      const shoutout = (appData.shoutouts || []).find(function(s) { return s.id === shoutoutId; });
      if (!shoutout) return 'Error: shoutout not found with id: ' + shoutoutId;
      const obj = (appData.objects || []).find(function(o) { return o.id === objectId; });
      if (!obj) return 'Error: object not found with id: ' + objectId;
      const current = shoutout;
      const currentPlaced = Object.assign({}, shoutout.placedObjects || {});
      // Normalise legacy pattern-only objects to layers format before storing
      const normObj = obj.layers ? obj : { ...obj, layers: [{ colorSlot: 'primary', pattern: obj.pattern || [] }] };
      currentPlaced[positionId] = normObj;
      await fb.updateDoc(
        fb.doc(fb.db, 'users', uid, 'shoutouts', shoutoutId),
        { placedObjects: currentPlaced, updatedAt: fb.serverTimestamp() }
      );
      kevinLogUndo({ action: 'updateShoutout', id: shoutoutId, uid, previous: current });
      return 'Placed "' + obj.name + '" at ' + positionId + ' on shoutout "' + shoutout.name + '".';
    } catch(e) { return 'Error placing object: ' + e.message; }
  }

  if (toolName === 'removeObject') {
    try {
      const { shoutoutId, positionId } = toolInput;
      if (!shoutoutId || !positionId) return 'Error: shoutoutId and positionId are required.';
      const shoutout = (appData.shoutouts || []).find(function(s) { return s.id === shoutoutId; });
      if (!shoutout) return 'Error: shoutout not found with id: ' + shoutoutId;
      const current = shoutout;
      const currentPlaced = Object.assign({}, shoutout.placedObjects || {});
      if (!currentPlaced[positionId]) return 'No object placed at ' + positionId + ' on this shoutout.';
      delete currentPlaced[positionId];
      await fb.updateDoc(
        fb.doc(fb.db, 'users', uid, 'shoutouts', shoutoutId),
        { placedObjects: currentPlaced, updatedAt: fb.serverTimestamp() }
      );
      kevinLogUndo({ action: 'updateShoutout', id: shoutoutId, uid, previous: current });
      return 'Removed object from ' + positionId + ' on shoutout "' + shoutout.name + '".';
    } catch(e) { return 'Error removing object: ' + e.message; }
  }

  return 'Unknown tool: ' + toolName;
}

// ── askKevin — tool-aware, multi-turn ─────────────────────────────────────────
async function askKevin(messages, context, appData) {

  // Build clean API messages from internal format
  // Each turn is stored as {role, text} internally but the API needs proper structure
  // We rebuild from the internal log, ignoring any previous tool-turn details
  // (tool calls happen inside askKevin and are transparent to the UI)
  function buildApiMessages(msgs) {
    // Cap history to last 8 exchanges and trim large kevin responses
    const recent = msgs.slice(-8);
    const result = [];
    for (const m of recent) {
      if (m.role === 'kevin') {
        // Trim very long Kevin responses (tool result summaries can be huge)
        const text = m.text && m.text.length > 800 ? m.text.slice(0, 800) + '...[trimmed]' : m.text;
        result.push({ role: 'assistant', content: text });
        continue;
      }
      if (m.role === 'user') {
        if (m.image) {
          // Message with image attachment
          result.push({
            role: 'user',
            content: [
              { type: 'text', text: m.text || 'Please analyse this image and generate a cross-stitch border motif pattern from it.' },
              { type: 'image', source: { type: 'base64', media_type: m.image.mediaType, data: m.image.data } }
            ]
          });
        } else {
          result.push({ role: 'user', content: m.text });
        }
      }
      // kevin role handled above
    }
    return result;
  }

  let apiMessages = buildApiMessages(messages);
  let finalText   = '';
  let iterations  = 0;
  const MAX_ITER  = 6;

  while (iterations < MAX_ITER) {
    iterations++;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: kevinHeaders(),
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 1500,
        system: [{ type: 'text', text: kevinSystemPrompt(context), cache_control: { type: 'ephemeral' } }],
        tools:      KEVIN_TOOLS,
        messages:   apiMessages,
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error('Kevin unavailable — ' + response.status + ': ' + errText.slice(0, 200));
    }
    const data = await response.json();

    // Collect any text blocks
    const textBlocks = (data.content || []).filter(function(b) { return b.type === 'text'; });
    if (textBlocks.length > 0) {
      finalText = textBlocks.map(function(b) { return b.text; }).join('\n');
    }

    // Check for tool use blocks
    const toolUseBlocks = (data.content || []).filter(function(b) { return b.type === 'tool_use'; });

    // If no tool calls, we're done
    if (toolUseBlocks.length === 0) break;

    // Execute each tool call
    const toolResults = [];
    for (const toolUse of toolUseBlocks) {
      const result = await executeKevinTool(toolUse.name, toolUse.input, appData);
      toolResults.push({
        type:        'tool_result',
        tool_use_id: toolUse.id,
        content:     String(result),
      });
    }

    // Append assistant turn (with tool_use blocks) + tool results, then loop
    apiMessages = [
      ...apiMessages,
      { role: 'assistant', content: data.content },
      { role: 'user',      content: toolResults  },
    ];
  }

  return finalText || 'Done.';
}

async function checkTrademark(word, context) {
  if (!hasKevinApiKey()) return null;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: kevinHeaders(),
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 200,
        system:     'You are a trademark and copyright advisor for a commercial embroidery brand. Reply only in the JSON format requested.',
        messages:   [{
          role:    'user',
          content: `Quick trademark/copyright check for a commercial embroidery product. The word or phrase is: "${word}". Reply in JSON only: {"risk": "none"|"low"|"medium"|"high", "reason": "one sentence", "suggestion": "safe alternative or null"}. No other text.`
        }],
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return JSON.parse(data.content[0].text.trim());
  } catch(e) { return null; }
}

