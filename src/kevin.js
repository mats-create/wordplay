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
- Border spec: layers [{line, type, color}], cornerMotif {color, pattern[]}, sideMotifs [{position, color, pattern}], cornerInset.
  Colour names: primary (slot 1), secondary (slot 2), accent (slot 3), border3 (slot 4), accent1 (slot 5), accent2 (slot 6).
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

Corner motif sizes — two options, always use one or the other:
- Standard: 9x9 pattern, cornerInset 7. For clean/minimal borders or when the motif is simple.
- Enlarged: 11x11 pattern, cornerInset 8. For detailed/traditional borders with complex motifs.
When updating a border to change motif size, redraw the full pattern at the new dimensions — don't just pad or trim the existing one. listBorders returns cornerMotifSizeLabel (standard/enlarged/none) so you can see the current state before editing.
Example standard 9x9 (diamond lattice): ["011101110","101010101","110101011","001111100","011101110","001111100","110101011","101010101","011101110"]
Example enlarged 11x11 (expanded lattice): ["00000000000","00111010110","01010101010","01101010101","00011111100","00111010110","00011111100","01101010101","01010101010","00111010110","00000000000"]

Expertise: cross-stitch and border traditions (British, Scandinavian, Hardanger, Blackwork, folk); DMC threads; football vocabulary from all cultures and languages; trademark risks (flag club/competition names, generic football vocab is fine).

Context: screen=${context.tab} | shoutouts=${context.shoutoutCount} (${context.shoutoutNames}) | borders=${context.borderNames} | shoutout folders=${context.shoutoutFolders} | border folders=${context.borderFolders} | default hoop 280x250mm, 14-count Aida, 94x94 stitches.

Folders: shoutouts and borders can be assigned to a folder (a string tag). When creating or updating, you can set the folder field to any existing folder name, or null for unfiled. Always use an existing folder name from context unless the user asks to create a new one.`;
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
      return {
        id: s.id, name: s.name,
        stitches: s.stitchesW + 'x' + s.stitchesH,
        hoop: s.hoopW + 'x' + s.hoopH + 'mm',
        border: s.borderName || 'none',
        threads: (s.threads || []).map(function(t) { return t.name + ' (' + t.dmc + ')'; }),
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
        await fb.deleteDoc(fb.doc(fb.db, 'borders', last.id));
        return 'Undone — border removed.';
      }
      if (last.action === 'updateBorder' && last.previous) {
        const prev = Object.assign({}, last.previous); delete prev.id;
        await fb.updateDoc(fb.doc(fb.db, 'borders', last.id), prev);
        return 'Undone — border restored to previous state.';
      }
      if (last.action === 'deleteBorder' && last.previous) {
        const prev = Object.assign({}, last.previous); delete prev.id;
        await fb.setDoc(fb.doc(fb.db, 'borders', last.id), prev);
        return 'Undone — border restored.';
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
      const ref = await fb.addDoc(fb.collection(fb.db, 'borders'), data);
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
      await fb.updateDoc(fb.doc(fb.db, 'borders', id), fields);
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
      await fb.deleteDoc(fb.doc(fb.db, 'borders', id));
      kevinLogUndo({ action: 'deleteBorder', id, previous: current });
      return 'Border ' + id + ' deleted.';
    } catch(e) { return 'Error deleting border: ' + e.message; }
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
    const result = [];
    for (const m of msgs) {
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
      if (m.role === 'kevin') result.push({ role: 'assistant', content: m.text });
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
        max_tokens: 4096,
        system:     kevinSystemPrompt(context),
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

