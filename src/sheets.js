/* ═══════════════════════════════════════════════════════════════════
   AIDA PRINT OPTIONS SHEET
═══════════════════════════════════════════════════════════════════ */
function AidaOptionsSheet({ shoutout, onClose }) {
  const [showBg,    setShowBg]    = useState(true);
  const [generating,setGenerating]= useState(false);

  // Always prints at 94×94 — fixed production format
  const gridW = (94 * 25.4 / 14).toFixed(1); // 170.5mm
  const gridH = (94 * 25.4 / 14).toFixed(1);

  function handleGenerate() {
    setGenerating(true);
    setTimeout(function() {
      generateAidaPDF(shoutout, showBg);
      setGenerating(false);
      onClose();
    }, 50);
  }

  return (
    <div className="overlay overlay-center"
      onClick={function(e){ if(e.target===e.currentTarget) onClose(); }}>
      <div className="sheet" style={{maxWidth:420}}>
        <div className="sheet-handle"/>
        <div className="sheet-header">
          <span className="sheet-title">Aida print options</span>
          <button className="btn-icon" onClick={onClose}><Ico.Close/></button>
        </div>
        <div className="sheet-body">

          <div className="aida-size-note">
            <strong>Print size:</strong> {gridW} × {gridH}mm at 1:1 scale<br/>
            14-count Aida · 94 × 94 stitches · portrait A4<br/>
            Load A4 Aida sheet in printer and print at 100% — do not scale to fit.
          </div>

          <div className="aida-option-row">
            <div>
              <div className="aida-option-label">Fabric background</div>
              <div className="aida-option-hint">Linen colour fill behind stitches. Turn off to print stitch lines only on bare Aida.</div>
            </div>
            <button className={'toggle'+(showBg?' on':'')}
              onClick={function(){ setShowBg(function(v){ return !v; }); }}>
              <div className="toggle-knob"/>
            </button>
          </div>

          <div className="form-actions" style={{paddingTop:16}}>
            <button className="btn btn-outlined" onClick={onClose}>Cancel</button>
            <button className="btn btn-coral" onClick={handleGenerate} disabled={generating}>
              {generating ? 'Generating…' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SHOUTOUT DETAIL
═══════════════════════════════════════════════════════════════════ */
function ShoutoutDetail({ shoutout, onEdit, onDelete, onClose, onCompose, folders, onMoveToFolder }) {
  const [showAidaOptions, setShowAidaOptions] = useState(false);
  const [chartGenerating, setChartGenerating] = useState(false);

  function handleChartPDF() {
    setChartGenerating(true);
    setTimeout(function() {
      generateChartPDF(shoutout);
      setChartGenerating(false);
    }, 50);
  }
  const bs = shoutout.borderSpec || shoutout.borderStyle || 'british';
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-header">
          <span className="sheet-title">Football shoutout</span>
          <button className="btn-icon" onClick={onClose}><Ico.Close/></button>
        </div>
        <div className="detail-title">{shoutout.name}</div>
        <div className="detail-meta">
          {shoutout.stitchesW} × {shoutout.stitchesH} stitches
          &nbsp;·&nbsp; {shoutout.hoopW} × {shoutout.hoopH}mm hoop
          &nbsp;·&nbsp; {shoutout.strands || 2}-strand · 14-count Aida
          {shoutout.textScale === 1 && <span>&nbsp;·&nbsp; Small text</span>}
          {shoutout.textScale === 3 && <span>&nbsp;·&nbsp; Large text</span>}
          {shoutout.borderName && <span>&nbsp;·&nbsp; {shoutout.borderName} border</span>}
          {shoutout.createdAt && <span>&nbsp;·&nbsp; {formatDate(shoutout.createdAt)}</span>}
        </div>

        <div className="detail-section">
          <div className="detail-section-label">Pattern</div>
          <CrossStitchCanvas word={shoutout.name}
            cols={shoutout.stitchesW} rows={shoutout.stitchesH}
            borderStyle={bs} threads={shoutout.threads}
            textScale={shoutout.textScale||0}
            lines={shoutout.lines||null}
            placedObjects={shoutout.placedObjects||null}
            size={550}/>
        </div>

        {shoutout.threads&&shoutout.threads.length>0 && (
          <div className="detail-section">
            <div className="detail-section-label">Threads</div>
            <Threditor
              threads={shoutout.threads}
              threadLengths={shoutout.threadLengths || []}
              onChange={null}
              onRemove={null}
            />
          </div>
        )}

        {shoutout.notes && (
          <div className="detail-section">
            <div className="detail-section-label">Notes</div>
            <div className="detail-notes">{shoutout.notes}</div>
          </div>
        )}

        <div className="detail-actions">
          <button className="btn btn-primary" onClick={onEdit}>
            <Ico.Edit/> Edit
          </button>
          <button className="btn btn-tonal" onClick={onCompose}
            title="Open the composition workspace">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 3v18"/>
            </svg>
            Compose
          </button>
        </div>

        {/* Export + folder row */}
        <div className="export-actions">
          <button className="btn-export btn-export-primary"
            onClick={handleChartPDF} disabled={chartGenerating}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <polyline points="9 15 12 18 15 15"/>
            </svg>
            {chartGenerating ? 'Generating…' : 'Chart PDF'}
          </button>
          <button className="btn-export"
            onClick={function(){ setShowAidaOptions(true); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
            </svg>
            Aida print
          </button>
          {folders && folders.length > 0 && (
            <select className="folder-select" style={{marginLeft:'auto'}}
              value={shoutout.folder || ''}
              onChange={function(e) { onMoveToFolder(e.target.value || null); }}>
              <option value="">No folder</option>
              {folders.map(function(f) { return <option key={f} value={f}>{f}</option>; })}
            </select>
          )}
        </div>

        {/* Destructive action — separated at bottom */}
        <div className="detail-actions" style={{paddingTop:0, borderTop:'1px solid var(--offwht)', marginTop:4}}>
          <button className="btn btn-ghost" style={{color:'var(--coral)', fontSize:12}}
            onClick={onDelete}>
            <Ico.Delete/> Delete shoutout
          </button>
        </div>

        {showAidaOptions && (
          <AidaOptionsSheet shoutout={shoutout}
            onClose={function(){ setShowAidaOptions(false); }}/>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BORDER FORM
═══════════════════════════════════════════════════════════════════ */
// Corner crop preview for BorderForm — renders top-left ~24x24 area enlarged
function BorderCornerPreview({ layers, borderWeight, cornerFill, initSpec }) {
  const canvasRef = useRef(null);
  const CROP = 24; // stitches to show
  const SIZE = 280; // canvas px
  const cell = SIZE / CROP;

  useEffect(function() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = SIZE; canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#F0E6D3';
    ctx.fillRect(0, 0, SIZE, SIZE);

    const spec = {
      layers: layers.map(function(l, i) {
        const tile = (l.tile && l.tile !== '00000000') ? l.tile : undefined;
        return { line: i, type: l.type || 'solid', color: l.color || 'primary', tile };
      }),
      borderWeight: borderWeight,
      cornerFill: cornerFill,
      cornerInset: initSpec && initSpec.cornerInset ? initSpec.cornerInset : layers.length * borderWeight + 2,
      cornerMotif: initSpec && initSpec.cornerMotif ? initSpec.cornerMotif : undefined,
      sideMotifs: initSpec && initSpec.sideMotifs ? initSpec.sideMotifs : undefined,
    };

    // Build a full 94x94 grid, then crop top-left CROP×CROP
    const N = 94;
    const grid = [];
    for (let r = 0; r < N; r++) grid.push(new Array(N).fill(' '));
    function setCell(r, c, kind) {
      if (r >= 0 && r < N && c >= 0 && c < N && grid[r][c] === ' ') grid[r][c] = kind;
    }
    renderBorderSpec(spec, N, setCell);

    const pad = cell * 0.1;
    const lw = Math.max(cell * 0.24, 0.5);
    for (let r = 0; r < CROP; r++) {
      for (let c = 0; c < CROP; c++) {
        const kind = grid[r][c];
        if (kind === ' ') continue;
        const col = stitchColor(kind, DEFAULT_THREADS);
        const x = c * cell, y = r * cell;
        ctx.strokeStyle = col; ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(x+pad, y+pad); ctx.lineTo(x+cell-pad, y+cell-pad);
        ctx.moveTo(x+cell-pad, y+pad); ctx.lineTo(x+pad, y+cell-pad);
        ctx.stroke();
      }
    }
    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 0.3;
    for (let i = 0; i <= CROP; i++) {
      ctx.beginPath(); ctx.moveTo(i*cell,0); ctx.lineTo(i*cell,SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i*cell); ctx.lineTo(SIZE,i*cell); ctx.stroke();
    }
    ctx.strokeStyle = '#1A1A1A'; ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, SIZE, SIZE);
  }, [JSON.stringify(layers), borderWeight, cornerFill, JSON.stringify(initSpec)]);

  return (
    <div style={{background:'#F0E6D3', borderRadius:8, overflow:'hidden', width:SIZE, height:SIZE}}>
      <canvas ref={canvasRef}/>
    </div>
  );
}

const STYLE_OPTIONS = ['british','scandinavian','minimal','custom'];
const TRAIT_OPTIONS = ['diagonal-check','corner-footballs','goal-posts','shot-arrows',
  'geometric','diamond-repeat','two-line-frame','single-line','floral','folk-motifs'];

// Helper: get a representative hex colour for a slot name (for tile cell preview)
function threadColorForSlot(slotName) {
  const map = {
    'primary':'#1A1A1A','secondary':'#4A6741','accent':'#CC3300',
    'border3':'#2255AA','accent1':'#AA8800','accent2':'#AA3388',
  };
  return map[slotName] || '#1A1A1A';
}

function BorderForm({ initial, onSave, onClose, saving }) {
  const isEdit = !!initial;
  const [name,   setName]   = useState(initial?initial.name:'');
  const [style,  setStyle]  = useState(initial?initial.style:'custom');
  const [desc,   setDesc]   = useState(initial?initial.description:'');
  const [traits, setTraits] = useState(initial?initial.traits:[]);
  const [errors, setErrors] = useState({});
  const [touched,setTouched]= useState({});

  // Tile pattern state — derived from existing spec or defaults
  const initSpec = (initial && initial.spec) ? initial.spec
    : (initial && initial.style && BORDER_SPECS && BORDER_SPECS[initial.style]) ? BORDER_SPECS[initial.style]
    : null;
  const initWeight = initSpec && initSpec.borderWeight ? initSpec.borderWeight : 1;
  const initCornerFill = initSpec && initSpec.cornerFill ? initSpec.cornerFill : 'primary';

  // Always show 5 layer rows — pad with defaults if fewer exist
  const specLayers = initSpec && initSpec.layers ? initSpec.layers : [];
  const initLayers = Array.from({length: 5}, function(_, i) {
    const l = specLayers[i];
    if (!l) return {line:i, type:'solid', color:'primary', tile:null};
    // For check layers, use colorA as the display colour
    const color = l.color || l.colorA || 'primary';
    return { ...l, color, tile: l.tile || null };
  });

  const [borderWeight, setBorderWeight] = useState(initWeight);
  const [cornerFill,   setCornerFill]   = useState(initCornerFill);
  const [layers,       setLayers]       = useState(initLayers);

  const COLOR_NAMES = ['primary','secondary','accent','border3','accent1','accent2'];
  const COLOR_LABELS = ['Shoutout','Border 1','Border 2','Border 3','Accent 1','Accent 2'];
  const maxLayers = borderWeight === 2 ? 3 : 5;
  const TILE_SIZE = 8;

  function toggleTile(li, ci) {
    setLayers(function(prev) {
      return prev.map(function(layer, idx) {
        if (idx !== li) return layer;
        const current = layer.tile || '00000000';
        const arr = current.split('');
        arr[ci] = arr[ci] === '1' ? '0' : '1';
        return { ...layer, tile: arr.join('') };
      });
    });
  }

  function setLayerColor(li, color) {
    setLayers(function(prev) {
      return prev.map(function(layer, idx) {
        return idx === li ? { ...layer, color } : layer;
      });
    });
  }

  function setWeightMode(w) {
    setBorderWeight(w);
    if (w === 2) {
      // Lock all tiles to solid in double mode
      setLayers(function(prev) {
        return prev.map(function(l) { return { ...l, tile: '11111111' }; });
      });
    }
  }

  function toggleTrait(t) {
    setTraits(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t]);
  }

  function handleSave() {
    const fields = {name, style, description:desc, traits};
    const errs = validateBorder(fields);
    setErrors(errs); setTouched({name:true, description:true});
    if (hasErrors(errs)) return;
    const baseSpec = initSpec || {};
    // Only include layers that have at least one tile cell on, or are defined as solid/check
    const activeLayers = layers.slice(0, maxLayers).map(function(l, i) {
      const tile = (l.tile && l.tile !== '00000000' && l.tile !== '11111111') ? l.tile : undefined;
      return { line: i, type: l.type || 'solid', color: l.color || 'primary', tile };
    });
    // cornerInset = number of physical rows used + 2 padding
    const usedRows = maxLayers * borderWeight;
    const newCornerInset = (baseSpec.cornerInset && baseSpec.cornerInset > usedRows + 2)
      ? baseSpec.cornerInset
      : usedRows + 2;
    const newSpec = {
      ...baseSpec,
      layers: activeLayers,
      borderWeight,
      cornerFill,
      cornerInset: newCornerInset,
    };
    onSave({ ...fields, spec: newSpec });
  }

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet sheet-wide">
        <div className="sheet-handle"/>
        <div className="sheet-header">
          <span className="sheet-title">{isEdit?'Edit border':'New border'}</span>
          <button className="btn-icon" onClick={onClose}><Ico.Close/></button>
        </div>
        <div className="sheet-body">

          <div className="form-group">
            <label className="form-label">Border name</label>
            <input className={'form-input'+(touched.name&&errors.name?' error':'')}
              placeholder="e.g. Nordic Diamonds" value={name}
              onChange={e=>setName(e.target.value)} onBlur={()=>setTouched(p=>({...p,name:true}))}
              autoFocus/>
            {touched.name&&errors.name && <div className="form-error">{errors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className={'form-textarea'+(touched.description&&errors.description?' error':'')}
              placeholder="Describe the visual character and tradition of this border…"
              value={desc} onChange={e=>setDesc(e.target.value)}
              onBlur={()=>setTouched(p=>({...p,description:true}))}/>
            {touched.description&&errors.description &&
              <div className="form-error">{errors.description}</div>}
          </div>

          {/* Stitch width toggle */}
          <div className="form-group">
            <label className="form-label">Stitch width</label>
            <div className="size-toggle">
              {[{label:'Single', value:1},{label:'Double', value:2}].map(function(opt) {
                return (
                  <button key={opt.label}
                    className={'size-btn' + (borderWeight === opt.value ? ' active' : '')}
                    onClick={function() { setWeightMode(opt.value); }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="form-hint">
              {borderWeight === 2 ? 'Double stitch — max 3 layers, beginner friendly' : 'Single stitch — up to 5 layers, full pattern control'}
            </div>
          </div>

          {/* Tile pattern editor */}
          <div className="form-group">
            <label className="form-label">Layer patterns</label>
            <div className="form-hint" style={{marginBottom:8}}>
              Each row = one border layer. Tap cells to create a repeating 8-stitch tile pattern.
              {borderWeight === 2 && ' Locked to solid in double-stitch mode.'}
            </div>
            <div className="tile-layer-editor">
              {layers.map(function(layer, li) {
                const muted = li >= maxLayers;
                const tile = layer.tile || '00000000';
                const locked = borderWeight === 2;
                return (
                  <div key={li} className={'tile-layer-row' + (muted ? ' layer-muted' : '')}>
                    <span className="tile-layer-num">{li+1}</span>
                    <div className="tile-editor-cells">
                      {Array.from({length: TILE_SIZE}).map(function(_, ci) {
                        const on = tile[ci] === '1';
                        const col = threadColorForSlot(layer.color);
                        return (
                          <div key={ci}
                            className={'tile-edit-cell' + (on ? ' on' : '') + (locked || muted ? ' locked' : '')}
                            style={{background: on ? col : ''}}
                            onClick={function() { if (!locked && !muted) toggleTile(li, ci); }}>
                            {on && (
                              <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                                <line x1="2" y1="2" x2="14" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                <line x1="14" y1="2" x2="2" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Colour slot selector */}
                    {!muted && (
                      <div className="tile-layer-color">
                        <select className="tile-color-select"
                          value={layer.color || 'primary'}
                          onChange={function(e) { setLayerColor(li, e.target.value); }}>
                          {COLOR_NAMES.map(function(c, ci2) {
                            return <option key={c} value={c}>{COLOR_LABELS[ci2]}</option>;
                          })}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Corner fill */}
          <div className="form-group">
            <label className="form-label">Corner fill colour</label>
            <select className="form-input" style={{maxWidth:200}}
              value={cornerFill}
              onChange={function(e) { setCornerFill(e.target.value); }}>
              {COLOR_NAMES.map(function(c, i) {
                return <option key={c} value={c}>{COLOR_LABELS[i]}</option>;
              })}
            </select>
            <div className="form-hint">All 4 frame corners fill solid in this colour</div>
          </div>

          {/* Live preview — corner crop */}
          <div className="form-group">
            <label className="form-label">Preview</label>
            <div className="form-hint" style={{marginBottom:8}}>Top-left corner with side sections — default thread colours</div>
            <BorderCornerPreview
              layers={layers.slice(0, maxLayers)}
              borderWeight={borderWeight}
              cornerFill={cornerFill}
              initSpec={initSpec}/>
          </div>

          <div className="form-group">
            <label className="form-label">Traits</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
              {TRAIT_OPTIONS.map(t=>(
                <button key={t}
                  className="btn btn-outlined"
                  style={{
                    fontSize:11,padding:'4px 10px',
                    background:traits.includes(t)?'var(--black)':'',
                    color:traits.includes(t)?'var(--white)':'',
                    borderColor:traits.includes(t)?'var(--black)':''
                  }}
                  onClick={()=>toggleTrait(t)}>{t}
                </button>
              ))}
            </div>
            <div className="form-hint">Select all that apply</div>
          </div>

          <div className="form-actions">
            <button className="btn btn-outlined" onClick={onClose}>Cancel</button>
            <button className="btn btn-coral" onClick={handleSave} disabled={saving}>
              {saving?'Saving…':isEdit?'Save changes':'Create border'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BORDER DETAIL
═══════════════════════════════════════════════════════════════════ */
function BorderDetail({ border, onEdit, onDelete, onClose, folders, onMoveToFolder }) {
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-header">
          <span className="sheet-title">Border style</span>
          <button className="btn-icon" onClick={onClose}><Ico.Close/></button>
        </div>
        <div className="detail-title">{border.name}</div>
        <div className="detail-meta">
          Style: {border.style}
          {border.builtIn && <span>&nbsp;·&nbsp; Built-in</span>}
          {border.createdAt && <span>&nbsp;·&nbsp; {formatDate(border.createdAt)}</span>}
        </div>

        {border.builtIn &&
          <div className="detail-builtin-note">
            This is a built-in border. The description and traits are read-only and will be refined by the AI.
          </div>
        }

        <div className="detail-section">
          <div className="detail-section-label">Preview</div>
          <CrossStitchCanvas word="ABC" cols={94} rows={94}
            borderStyle={border.spec || border.style} threads={DEFAULT_THREADS} size={400}/>
        </div>

        {border.description && (
          <div className="detail-section">
            <div className="detail-section-label">Description</div>
            <div className="detail-notes">{border.description}</div>
          </div>
        )}

        {border.traits&&border.traits.length>0 && (
          <div className="detail-section">
            <div className="detail-section-label">Traits</div>
            <div className="card-traits" style={{paddingTop:2}}>
              {border.traits.map(t=><span key={t} className="trait-chip">{t}</span>)}
            </div>
          </div>
        )}

        <div className="detail-actions">
          <button className="btn btn-primary" onClick={onEdit}
            disabled={border.builtIn}>
            {border.builtIn ? <><Ico.Lock/> Built-in</> : <><Ico.Edit/> Edit</>}
          </button>
          {folders && folders.length > 0 && (
            <select className="folder-select" style={{marginLeft:'auto'}}
              value={border.folder || ''}
              onChange={function(e) { onMoveToFolder(e.target.value || null); }}>
              <option value="">No folder</option>
              {folders.map(function(f) { return <option key={f} value={f}>{f}</option>; })}
            </select>
          )}
        </div>
        {!border.builtIn && (
          <div className="detail-actions" style={{paddingTop:0, borderTop:'1px solid var(--offwht)', marginTop:4}}>
            <button className="btn btn-ghost" style={{color:'var(--coral)', fontSize:12}}
              onClick={onDelete}>
              <Ico.Delete/> Delete border
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONFIRM DIALOG
═══════════════════════════════════════════════════════════════════ */
function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="overlay overlay-center" onClick={e=>e.target===e.currentTarget&&onCancel()}>
      <div className="dialog">
        <h3>{title}</h3><p>{message}</p>
        <div className="dialog-actions">
          <button className="btn btn-outlined" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger"   onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   OBJECT DETAIL + STITCH EDITOR
═══════════════════════════════════════════════════════════════════ */

// Max dimensions based on British Classic border limits
const OBJECT_MAX_W = 41; // top/bottom side motif max width
const OBJECT_MAX_H = 11; // corner motif max height (enlarged)
const OBJECT_DEFAULT_W = 9;
const OBJECT_DEFAULT_H = 9;
const EDITOR_CELL = 32; // px per stitch cell in editor

// Neutral greys per slot index — distinguishable without implying actual thread colours
const LAYER_SLOT_GREYS = ['#111111','#404040','#707070','#999999','#C0C0C0','#E4E4E4'];

// Returns white or black mark colour depending on cell brightness
function markColour(hex) {
  var r = parseInt(hex.slice(1,3),16);
  var g = parseInt(hex.slice(3,5),16);
  var b = parseInt(hex.slice(5,7),16);
  return (r*0.299 + g*0.587 + b*0.114) > 160 ? '#1A1A1A' : '#FFFFFF';
}

// colorSlot string -> THREAD_SLOTS index
const COLOR_SLOT_VALUES = ['primary','secondary','accent','border3','accent1','accent2'];

function layerSlotGrey(colorSlot) {
  const i = COLOR_SLOT_VALUES.indexOf(colorSlot);
  return LAYER_SLOT_GREYS[i >= 0 ? i : 0];
}

function blankPattern(w, h) {
  return Array.from({length: h}, function() { return Array(w).fill('0'); });
}

function patternToArrays(strings) {
  return strings.map(function(r) { return r.split(''); });
}

function arrayToStrings(arrays) {
  return arrays.map(function(row) { return row.join(''); });
}

// Shared compound grid renderer — used in editor and detail
// Returns a 2D array of {colorSlot, overlap} per cell, or null for empty
function buildCompoundGrid(layers, w, h) {
  // count how many layers have a stitch at each cell
  var counts = Array.from({length: h}, function() { return Array(w).fill(0); });
  layers.forEach(function(layer) {
    if (!layer.pattern) return;
    layer.pattern.forEach(function(row, r) {
      if (r >= h) return;
      row.forEach(function(ch, c) {
        if (c >= w && ch === '1') return;
        if (ch === '1') counts[r][c]++;
      });
    });
  });
  // build result grid — last layer wins for colour, overlap flagged
  var result = Array.from({length: h}, function() { return Array(w).fill(null); });
  layers.forEach(function(layer) {
    if (!layer.pattern) return;
    layer.pattern.forEach(function(row, r) {
      if (r >= h) return;
      row.forEach(function(ch, c) {
        if (c >= w) return;
        if (ch === '1') {
          result[r][c] = { colorSlot: layer.colorSlot, overlap: counts[r][c] > 1 };
        }
      });
    });
  });
  return result;
}

// Small slot palette shown in ObjectDetail — only slots used by this object
function ObjectSlotPalette({ layers }) {
  if (!layers || layers.length === 0) return null;
  var usedSlots = [];
  var seen = {};
  layers.forEach(function(layer) {
    var hasStitch = layer.pattern && layer.pattern.some(function(row) {
      return row.some ? row.some(function(ch) { return ch === '1'; })
                      : row.indexOf('1') >= 0;
    });
    if (hasStitch && !seen[layer.colorSlot]) {
      seen[layer.colorSlot] = true;
      var slotIdx = COLOR_SLOT_VALUES.indexOf(layer.colorSlot);
      var slot = THREAD_SLOTS[slotIdx >= 0 ? slotIdx : 0];
      usedSlots.push({ colorSlot: layer.colorSlot, slot: slot, grey: LAYER_SLOT_GREYS[slotIdx >= 0 ? slotIdx : 0] });
    }
  });
  if (usedSlots.length === 0) return null;
  return (
    <div className="detail-section">
      <div className="detail-section-label">Colour slots</div>
      <div className="form-hint" style={{marginBottom:8}}>Actual colours depend on the shoutout this object is used in.</div>
      <div className="object-slot-palette">
        {usedSlots.map(function(entry) {
          return (
            <div key={entry.colorSlot} className="object-slot-row">
              <div className="object-slot-swatch" style={{background: entry.grey}}/>
              <div className="object-slot-info">
                <span className="object-slot-name">{entry.slot ? entry.slot.label : entry.colorSlot}</span>
                <span className="object-slot-hint">{entry.slot ? entry.slot.hint : ''}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ObjectEditor({ initial, onSave, onClose, saving }) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial ? initial.name : '');
  const [nameError, setNameError] = useState('');
  const [activeLayer, setActiveLayer] = useState(0);
  const [viewMode, setViewMode] = useState('edit'); // 'edit' | 'compound'

  // Initialise layers — support legacy (pattern only) and new (layers array)
  const [layers, setLayers] = useState(function() {
    if (initial && initial.layers && initial.layers.length > 0) {
      return initial.layers.map(function(l) {
        return {
          colorSlot: l.colorSlot || 'primary',
          pattern: patternToArrays(l.pattern),
        };
      });
    }
    if (initial && initial.pattern) {
      return [{ colorSlot: 'primary', pattern: patternToArrays(initial.pattern) }];
    }
    return [{ colorSlot: 'primary', pattern: blankPattern(OBJECT_DEFAULT_W, OBJECT_DEFAULT_H) }];
  });

  const h = layers[0] && layers[0].pattern ? layers[0].pattern.length : OBJECT_DEFAULT_H;
  const w = layers[0] && layers[0].pattern && layers[0].pattern[0] ? layers[0].pattern[0].length : OBJECT_DEFAULT_W;

  function toggleCell(r, c) {
    setLayers(function(prev) {
      return prev.map(function(layer, li) {
        if (li !== activeLayer) return layer;
        var next = layer.pattern.map(function(row) { return [...row]; });
        next[r][c] = next[r][c] === '1' ? '0' : '1';
        return { colorSlot: layer.colorSlot, pattern: next };
      });
    });
  }

  function resizeGrid(newW, newH) {
    const clampW = Math.max(1, Math.min(OBJECT_MAX_W, newW));
    const clampH = Math.max(1, Math.min(OBJECT_MAX_H, newH));
    setLayers(function(prev) {
      return prev.map(function(layer) {
        return {
          colorSlot: layer.colorSlot,
          pattern: Array.from({length: clampH}, function(_, r) {
            return Array.from({length: clampW}, function(_, c) {
              return (layer.pattern[r] && layer.pattern[r][c]) ? layer.pattern[r][c] : '0';
            });
          }),
        };
      });
    });
  }

  function addLayer() {
    if (layers.length >= 4) return;
    var nextSlot = COLOR_SLOT_VALUES[layers.length] || 'accent';
    setLayers(function(prev) {
      return prev.concat([{ colorSlot: nextSlot, pattern: blankPattern(w, h) }]);
    });
    setActiveLayer(layers.length);
    setViewMode('edit');
  }

  function removeLayer(li) {
    if (layers.length <= 1) return;
    setLayers(function(prev) { return prev.filter(function(_, i) { return i !== li; }); });
    setActiveLayer(function(prev) { return Math.min(prev, layers.length - 2); });
  }

  function setLayerSlot(li, colorSlot) {
    setLayers(function(prev) {
      return prev.map(function(layer, i) {
        return i === li ? { colorSlot: colorSlot, pattern: layer.pattern } : layer;
      });
    });
  }

  function handleSave() {
    if (!name.trim()) { setNameError('Name is required'); return; }
    setNameError('');
    const savedLayers = layers.map(function(layer) {
      return { colorSlot: layer.colorSlot, pattern: arrayToStrings(layer.pattern) };
    });
    onSave({ name: name.trim(), layers: savedLayers, width: w, height: h });
  }

  const compoundGrid = viewMode === 'compound' ? buildCompoundGrid(layers, w, h) : null;
  const activeLayerGrey = layerSlotGrey(layers[activeLayer] && layers[activeLayer].colorSlot);

  return (
    <div className="overlay" onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet sheet-wide">
        <div className="sheet-handle"/>
        <div className="sheet-header">
          <span className="sheet-title">{isEdit ? 'Edit object' : 'New object'}</span>
          <button className="btn-icon" onClick={onClose}><Ico.Close/></button>
        </div>
        <div className="sheet-body">

          <div className="form-group">
            <label className="form-label">Name</label>
            <input className={'form-input' + (nameError ? ' error' : '')}
              placeholder="e.g. Corner diamond" value={name}
              onChange={function(e) { setName(e.target.value); }} autoFocus/>
            {nameError && <div className="form-error">{nameError}</div>}
          </div>

          {/* Resize controls */}
          <div className="form-group">
            <label className="form-label">Size</label>
            <div className="object-size-row">
              <div className="object-size-field">
                <label className="form-hint">Width</label>
                <div className="object-size-stepper">
                  <button onClick={function() { resizeGrid(w-1, h); }} disabled={w <= 1}>−</button>
                  <span>{w}</span>
                  <button onClick={function() { resizeGrid(w+1, h); }} disabled={w >= OBJECT_MAX_W}>+</button>
                </div>
              </div>
              <div className="object-size-field">
                <label className="form-hint">Height</label>
                <div className="object-size-stepper">
                  <button onClick={function() { resizeGrid(w, h-1); }} disabled={h <= 1}>−</button>
                  <span>{h}</span>
                  <button onClick={function() { resizeGrid(w, h+1); }} disabled={h >= OBJECT_MAX_H}>+</button>
                </div>
              </div>
              <div className="form-hint" style={{alignSelf:'flex-end', paddingBottom:4}}>
                Max {OBJECT_MAX_W}×{OBJECT_MAX_H}
              </div>
            </div>
          </div>

          {/* Layer tabs + stitch editor */}
          <div className="form-group">
            <label className="form-label">Stitch editor</label>

            {/* Layer tab row */}
            <div className="object-layer-tabs">
              {layers.map(function(layer, li) {
                var grey = layerSlotGrey(layer.colorSlot);
                var slotIdx = COLOR_SLOT_VALUES.indexOf(layer.colorSlot);
                var slotLabel = THREAD_SLOTS[slotIdx >= 0 ? slotIdx : 0] ? THREAD_SLOTS[slotIdx >= 0 ? slotIdx : 0].label : layer.colorSlot;
                return (
                  <button key={li}
                    className={'object-layer-tab' + (viewMode === 'edit' && activeLayer === li ? ' active' : '')}
                    onClick={function() { setActiveLayer(li); setViewMode('edit'); }}>
                    <span className="object-layer-dot" style={{background: grey}}/>
                    {slotLabel}
                  </button>
                );
              })}
              <button
                className={'object-layer-tab object-layer-tab-compound' + (viewMode === 'compound' ? ' active' : '')}
                onClick={function() { setViewMode('compound'); }}>
                All layers
              </button>
              {layers.length < 4 && (
                <button className="object-layer-add" onClick={addLayer} title="Add layer">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Active layer controls (slot selector + remove) — edit mode only */}
            {viewMode === 'edit' && (
              <div className="object-layer-controls">
                <label className="form-hint" style={{marginBottom:0, lineHeight:'28px'}}>Colour slot:</label>
                <select className="tile-color-select"
                  value={layers[activeLayer] ? layers[activeLayer].colorSlot : 'primary'}
                  onChange={function(e) { setLayerSlot(activeLayer, e.target.value); }}>
                  {COLOR_SLOT_VALUES.map(function(val, i) {
                    var slot = THREAD_SLOTS[i];
                    return <option key={val} value={val}>{slot ? slot.label : val}</option>;
                  })}
                </select>
                {layers.length > 1 && (
                  <button className="thread-remove" onClick={function() { removeLayer(activeLayer); }} title="Remove this layer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
                <span className="form-hint" style={{marginLeft:'auto', marginBottom:0}}>Tap a cell to toggle on/off</span>
              </div>
            )}

            {viewMode === 'compound' && (
              <div className="object-layer-controls">
                <span className="form-hint" style={{marginBottom:0}}>All layers composited. Coral = overlapping stitches.</span>
              </div>
            )}

            {/* Grid */}
            <div className="stitch-editor-wrap">
              <div className="stitch-editor"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(' + w + ', ' + EDITOR_CELL + 'px)',
                  gridTemplateRows: 'repeat(' + h + ', ' + EDITOR_CELL + 'px)',
                }}>

                {viewMode === 'edit' && layers[activeLayer] && layers[activeLayer].pattern.map(function(row, r) {
                  return row.map(function(cell, c) {
                    const on = cell === '1';
                    const mk = on ? markColour(activeLayerGrey) : '#1A1A1A';
                    return (
                      <div key={r + '-' + c}
                        className={'stitch-cell' + (on ? ' on' : '')}
                        style={on ? {background: activeLayerGrey} : {}}
                        onClick={function() { toggleCell(r, c); }}>
                        {on && (
                          <svg viewBox="0 0 32 32" width={EDITOR_CELL} height={EDITOR_CELL}>
                            <line x1="4" y1="4" x2="28" y2="28" stroke={mk} strokeWidth="3.5" strokeLinecap="round"/>
                            <line x1="28" y1="4" x2="4" y2="28" stroke={mk} strokeWidth="3.5" strokeLinecap="round"/>
                          </svg>
                        )}
                      </div>
                    );
                  });
                })}

                {viewMode === 'compound' && compoundGrid && compoundGrid.map(function(row, r) {
                  return row.map(function(cell, c) {
                    const colour = cell ? (cell.overlap ? '#CC3300' : layerSlotGrey(cell.colorSlot)) : null;
                    const mk = colour ? markColour(colour) : '#1A1A1A';
                    return (
                      <div key={r + '-' + c}
                        className="stitch-cell"
                        style={colour ? {background: colour, cursor:'default'} : {cursor:'default'}}>
                        {colour && (
                          <svg viewBox="0 0 32 32" width={EDITOR_CELL} height={EDITOR_CELL}>
                            <line x1="4" y1="4" x2="28" y2="28" stroke={mk} strokeWidth="3.5" strokeLinecap="round"/>
                            <line x1="28" y1="4" x2="4" y2="28" stroke={mk} strokeWidth="3.5" strokeLinecap="round"/>
                          </svg>
                        )}
                      </div>
                    );
                  });
                })}

              </div>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-outlined" onClick={onClose}>Cancel</button>
            <button className="btn btn-coral" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create object'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ObjectDetail({ object, onEdit, onDelete, onClose, folders, onMoveToFolder }) {
  const w = object.width || (object.layers && object.layers[0] && object.layers[0].pattern ? object.layers[0].pattern[0].length : (object.pattern && object.pattern[0] ? object.pattern[0].length : 9));
  const h = object.height || (object.layers && object.layers[0] ? object.layers[0].pattern.length : (object.pattern ? object.pattern.length : 9));
  const previewCell = Math.min(Math.floor(300 / Math.max(w, h)), 28);
  const isLayered = object.layers && object.layers.length > 0;

  // Build layers array for compound rendering — support legacy pattern
  const layers = isLayered
    ? object.layers.map(function(l) {
        return {
          colorSlot: l.colorSlot || 'primary',
          pattern: l.pattern.map(function(r) { return r.split ? r.split('') : r; }),
        };
      })
    : (object.pattern ? [{ colorSlot: 'primary', pattern: object.pattern.map(function(r) { return r.split(''); }) }] : []);

  const compoundGrid = buildCompoundGrid(layers, w, h);

  return (
    <div className="overlay" onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-header">
          <span className="sheet-title">{object.name}</span>
          <button className="btn-icon" onClick={onClose}><Ico.Close/></button>
        </div>
        <div className="sheet-body">
          <div className="detail-meta">
            {w}×{h} stitches
            {isLayered && object.layers.length > 1 && <span> · {object.layers.length} layers</span>}
            {object.createdAt && <span> · {formatDate(object.createdAt)}</span>}
          </div>

          {/* Pattern preview */}
          <div className="detail-section">
            <div className="detail-section-label">Pattern</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(' + w + ', ' + previewCell + 'px)',
              width: 'fit-content',
              gap: '1px',
              background: 'var(--lgrey)',
              border: '1px solid var(--lgrey)',
              borderRadius: 6,
              overflow: 'hidden',
            }}>
              {compoundGrid.map(function(row, r) {
                return row.map(function(cell, c) {
                  const colour = cell ? (cell.overlap ? '#CC3300' : layerSlotGrey(cell.colorSlot)) : null;
                  const mk = colour ? markColour(colour) : '#1A1A1A';
                  return (
                    <div key={r+'-'+c} style={{
                      width: previewCell, height: previewCell,
                      background: colour || 'var(--offwht)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {colour && (
                        <svg viewBox="0 0 32 32" width={previewCell-4} height={previewCell-4}>
                          <line x1="4" y1="4" x2="28" y2="28" stroke={mk} strokeWidth="4" strokeLinecap="round"/>
                          <line x1="28" y1="4" x2="4" y2="28" stroke={mk} strokeWidth="4" strokeLinecap="round"/>
                        </svg>
                      )}
                    </div>
                  );
                });
              })}
            </div>
          </div>

          {/* Slot palette — only for layered objects */}
          {isLayered && <ObjectSlotPalette layers={object.layers}/>}

          <div className="detail-actions">
            <button className="btn btn-primary" onClick={onEdit}><Ico.Edit/> Edit</button>
            {folders && folders.length > 0 && (
              <select className="folder-select" style={{marginLeft:'auto'}}
                value={object.folder || ''}
                onChange={function(e) { onMoveToFolder(e.target.value || null); }}>
                <option value="">No folder</option>
                {folders.map(function(f) { return <option key={f} value={f}>{f}</option>; })}
              </select>
            )}
          </div>
          <div className="detail-actions" style={{paddingTop:0, borderTop:'1px solid var(--offwht)', marginTop:4}}>
            <button className="btn btn-ghost" style={{color:'var(--coral)', fontSize:12}} onClick={onDelete}>
              <Ico.Delete/> Delete object
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TOP BAR + USER MENU
═══════════════════════════════════════════════════════════════════ */
function TopBar({ user, onSignOut, tab, onTabChange, kevinVisible, onToggleKevin, tmCache }) {
  const [open, setOpen] = useState(false);
  const hasTmWarning = tmCache && Object.values(tmCache).some(function(r) { return r && r.risk !== 'none'; });
  return (
    <div className="topbar">
      {/* Logo + app name — left anchor */}
      <div className="topbar-brand">
        <svg className="topbar-logo" viewBox="0 0 24 24" width="22" height="22" fill="none">
          <line x1="3" y1="3" x2="21" y2="21" stroke="#4A6741" strokeWidth="3" strokeLinecap="round"/>
          <line x1="21" y1="3" x2="3" y2="21" stroke="#4A6741" strokeWidth="3" strokeLinecap="round"/>
          <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="#CC3300" strokeWidth="1.5" fill="none"/>
          <rect x="17" y="1" width="6" height="6" rx="1.5" stroke="#CC3300" strokeWidth="1.5" fill="none"/>
          <rect x="1" y="17" width="6" height="6" rx="1.5" stroke="#CC3300" strokeWidth="1.5" fill="none"/>
          <rect x="17" y="17" width="6" height="6" rx="1.5" stroke="#CC3300" strokeWidth="1.5" fill="none"/>
        </svg>
        <span className="topbar-appname">Cross<span>Pass</span></span>
      </div>

      {/* Nav tabs — desktop only, left-aligned after logo */}
      <div className="topbar-nav">
        <button className={'topbar-tab' + (tab==='shoutouts' ? ' active' : '')}
          onClick={function() { onTabChange('shoutouts'); }}>
          <Ico.Shout/> Shoutouts
        </button>
        <button className={'topbar-tab' + (tab==='borders' ? ' active' : '')}
          onClick={function() { onTabChange('borders'); }}>
          <Ico.Border/> Borders
        </button>
        <button className={'topbar-tab' + (tab==='objects' ? ' active' : '')}
          onClick={function() { onTabChange('objects'); }}>
          <Ico.Object/> Objects
        </button>
      </div>

      {/* Right side — CK toggle + avatar */}
      <div className="topbar-right">
        <button className={'kevin-toggle-btn' + (kevinVisible ? ' active' : '')}
          onClick={onToggleKevin} style={{position:'relative'}}>
          CK
          {hasTmWarning && <span className="kevin-badge"/>}
        </button>
        <div style={{position:'relative'}}>
          <img className="topbar-avatar"
            src={user.photoURL||'https://via.placeholder.com/32'}
            alt={user.displayName} onClick={function() { setOpen(function(o) { return !o; }); }}/>
          {open && (
            <div style={{position:'absolute',top:40,right:0,background:'var(--surface)',
              border:'1px solid var(--lgrey)',borderRadius:10,padding:'4px 0',minWidth:180,
              boxShadow:'0 4px 16px rgba(0,0,0,0.12)',zIndex:200}}>
              <div style={{padding:'7px 13px 5px',fontSize:11,color:'var(--grey)',
                borderBottom:'1px solid var(--offwht)',marginBottom:3}}>
                {user.displayName||user.email}
              </div>
              <button className="btn btn-ghost"
                style={{width:'100%',justifyContent:'flex-start',gap:7,padding:'7px 13px',
                  borderRadius:0,fontSize:12}}
                onClick={function() { setOpen(false); onSignOut(); }}>
                <Ico.SignOut/> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SIGN-IN SCREEN
═══════════════════════════════════════════════════════════════════ */
function SignInScreen({ onSignIn, error }) {
  return (
    <div className="signin-screen">
      <div className="signin-wordmark">Nutmeg<span>&</span>Needle</div>
      <div className="signin-tagline">Handcrafted football moves</div>
      <div className="signin-card">
        <span className="signin-icon">
          <svg viewBox="0 0 32 32" width="48" height="48" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="6" fill="#F0E6D3"/>
            <line x1="3.5" y1="3.5" x2="9" y2="3.5" stroke="#CC3300" strokeWidth="2" strokeLinecap="round"/>
            <line x1="3.5" y1="3.5" x2="3.5" y2="9" stroke="#CC3300" strokeWidth="2" strokeLinecap="round"/>
            <line x1="28.5" y1="3.5" x2="23" y2="3.5" stroke="#CC3300" strokeWidth="2" strokeLinecap="round"/>
            <line x1="28.5" y1="3.5" x2="28.5" y2="9" stroke="#CC3300" strokeWidth="2" strokeLinecap="round"/>
            <line x1="3.5" y1="28.5" x2="3.5" y2="23" stroke="#CC3300" strokeWidth="2" strokeLinecap="round"/>
            <line x1="3.5" y1="28.5" x2="9" y2="28.5" stroke="#CC3300" strokeWidth="2" strokeLinecap="round"/>
            <line x1="28.5" y1="28.5" x2="28.5" y2="23" stroke="#CC3300" strokeWidth="2" strokeLinecap="round"/>
            <line x1="28.5" y1="28.5" x2="23" y2="28.5" stroke="#CC3300" strokeWidth="2" strokeLinecap="round"/>
            <line x1="9" y1="9" x2="23" y2="23" stroke="#4A6741" strokeWidth="3.5" strokeLinecap="round"/>
            <line x1="23" y1="9" x2="9" y2="23" stroke="#4A6741" strokeWidth="3.5" strokeLinecap="round"/>
            <circle cx="9" cy="9" r="1.8" fill="#F0E6D3"/>
            <circle cx="23" cy="9" r="1.8" fill="#F0E6D3"/>
            <circle cx="9" cy="23" r="1.8" fill="#F0E6D3"/>
            <circle cx="23" cy="23" r="1.8" fill="#F0E6D3"/>
          </svg>
        </span>
        <h2>Wordplay</h2>
        <p>Your library of football shoutouts in cross-stitch.</p>
        {error && <p style={{color:'var(--coral)',fontSize:12,marginBottom:10}}>{error}</p>}
        <button className="btn btn-google" onClick={onSignIn}>
          <Ico.Google/> Sign in with Google
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SHOUTOUTS SCREEN
═══════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════
   COMPOSE SHEET
   Full-screen composition UI — word, border, colour, objects.
   Entry point: "Compose" button in ShoutoutDetail.
   Saves placedObjects (and all existing fields) back to Firestore
   via the same onSave handler as ShoutoutForm.
═══════════════════════════════════════════════════════════════════ */

// Position definitions for the 8 placement zones
const COMPOSE_POSITIONS = [
  {id:'topLeft',    label:'Top left',    isCorner:true,  maxW:9,  maxH:9},
  {id:'top',        label:'Top',         isCorner:false, maxW:41, maxH:9},
  {id:'topRight',   label:'Top right',   isCorner:true,  maxW:9,  maxH:9},
  {id:'left',       label:'Left',        isCorner:false, maxW:9,  maxH:41},
  {id:'centre',     label:'',            isCorner:false, maxW:0,  maxH:0},
  {id:'right',      label:'Right',       isCorner:false, maxW:9,  maxH:41},
  {id:'bottomLeft', label:'Bottom left', isCorner:true,  maxW:9,  maxH:9},
  {id:'bottom',     label:'Bottom',      isCorner:false, maxW:41, maxH:9},
  {id:'bottomRight',label:'Bottom right',isCorner:true,  maxW:9,  maxH:9},
];

// Render a small compound preview canvas for a layered object
// Uses actual thread colours from the threads array
function objectPreviewCanvas(obj, size, threads) {
  const cv = document.createElement('canvas');
  cv.width = size; cv.height = size;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#F0E6D3';
  ctx.fillRect(0, 0, size, size);
  if (!obj || !obj.layers || !obj.layers[0]) return cv;
  const ph = obj.layers[0].pattern.length;
  const pw = obj.layers[0].pattern[0] ? obj.layers[0].pattern[0].length : 0;
  if (!ph || !pw) return cv;
  const cell = Math.min(size / Math.max(ph, pw), size);
  const offX = Math.floor((size - pw * cell) / 2);
  const offY = Math.floor((size - ph * cell) / 2);
  const pad  = cell * 0.1;
  const lw   = Math.max(cell * 0.22, 0.5);
  // Build compound — last layer wins per cell
  const compound = [];
  for (let r = 0; r < ph; r++) { compound.push([]); for (let c = 0; c < pw; c++) compound[r].push(null); }
  obj.layers.forEach(function(layer) {
    const kind = layer.colorSlot === 'secondary' ? 'D'
               : layer.colorSlot === 'accent'    ? 'E'
               : layer.colorSlot === 'border3'   ? 'H'
               : layer.colorSlot === 'accent1'   ? 'J'
               : layer.colorSlot === 'accent2'   ? 'L' : 'T';
    (layer.pattern || []).forEach(function(rs, dr) {
      const row = typeof rs === 'string' ? rs : rs.join('');
      row.split('').forEach(function(ch, dc) {
        if (ch === '1' && dr < ph && dc < pw) compound[dr][dc] = kind;
      });
    });
  });
  compound.forEach(function(row, r) {
    row.forEach(function(kind, c) {
      if (!kind) return;
      const colour = stitchColor(kind, threads);
      if (!colour) return;
      const x = offX + c * cell;
      const y = offY + r * cell;
      ctx.strokeStyle = colour;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(x + pad, y + pad);
      ctx.lineTo(x + cell - pad, y + cell - pad);
      ctx.moveTo(x + cell - pad, y + pad);
      ctx.lineTo(x + pad, y + cell - pad);
      ctx.stroke();
    });
  });
  return cv;
}

// Position grid cell component
function PosCell({ pos, placed, threads, onClick, onClear }) {
  const canvasRef = useRef(null);

  useEffect(function() {
    if (!placed || !canvasRef.current) return;
    const cv = objectPreviewCanvas(placed, 56, threads);
    const el = canvasRef.current;
    el.width = cv.width; el.height = cv.height;
    el.getContext('2d').drawImage(cv, 0, 0);
  }, [placed, threads]);

  if (pos.id === 'centre') {
    return (
      <div className="pos-wrap">
        <div className="pos-cell centre">
          <span style={{fontSize:9, color:'#ccc'}}>word</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pos-wrap">
      <div className={'pos-cell' + (placed ? ' occupied' : '')} onClick={onClick}>
        {placed
          ? <>
              <canvas ref={canvasRef} style={{width:'100%',height:'100%',objectFit:'contain'}}/>
              <button className="pos-cell-clear"
                onClick={function(e) { e.stopPropagation(); onClear(); }}
                title="Remove object">
                &#x2715;
              </button>
            </>
          : <span className="pos-cell-plus">+</span>
        }
      </div>
      {pos.label && <div className="pos-label">{pos.label}</div>}
    </div>
  );
}

// Object picker sheet — slides in to show the object library for a position
function ObjPickerSheet({ position, objects, threads, placed, onSelect, onClear, onClose }) {
  return (
    <div className="obj-picker-overlay open"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div className="obj-picker-sheet">
        <div className="obj-picker-header">
          <span className="obj-picker-title">
            Place object — {position.label}
          </span>
          <button className="btn-icon" onClick={onClose}><Ico.Close/></button>
        </div>
        <div className="obj-picker-hint">
          Max {position.maxW} wide &times; {position.maxH} tall stitches
        </div>
        <div className="obj-list">
          {objects.length === 0 && (
            <div style={{gridColumn:'1/-1',fontSize:12,color:'var(--grey)',padding:'8px 0'}}>
              No objects in your library yet. Create some in the Objects tab.
            </div>
          )}
          {objects.map(function(obj) {
            const ph = obj.layers && obj.layers[0] ? obj.layers[0].pattern.length : (obj.pattern ? obj.pattern.length : 0);
            const pw = obj.layers && obj.layers[0] && obj.layers[0].pattern[0]
              ? obj.layers[0].pattern[0].length
              : (obj.pattern && obj.pattern[0] ? obj.pattern[0].length : 0);
            const fits = pw <= position.maxW && ph <= position.maxH;
            // Normalise legacy (pattern-only) objects to layers format for preview
            const normObj = obj.layers ? obj : { ...obj, layers: [{ colorSlot: 'primary', pattern: obj.pattern || [] }] };
            const cv = objectPreviewCanvas(normObj, 64, threads);
            const layerCount = normObj.layers.length;
            return (
              <div key={obj.id}
                className={'obj-card' + (!fits ? ' disabled' : '')}
                title={!fits ? 'Too large for this position' : ''}
                onClick={fits ? function() { onSelect(normObj); } : undefined}>
                <canvas width={64} height={64} ref={function(el) {
                  if (el) { el.width = cv.width; el.height = cv.height; el.getContext('2d').drawImage(cv, 0, 0); }
                }}/>
                <div className="obj-card-name">{obj.name}</div>
                <div className="obj-card-slots">
                  {layerCount === 1 ? '1 colour slot' : layerCount + ' colour slots'}
                  {!fits && <span> &middot; too large</span>}
                </div>
              </div>
            );
          })}
        </div>
        {placed && (
          <div className="obj-picker-clear">
            <button onClick={onClear}>Remove object from this position</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Main ComposeSheet component
function ComposeSheet({ initial, borders, objects, onSave, onClose, saving, kevinVisible, onToggleKevin }) {
  const isEdit = !!initial;
  const initName = (initial && initial.lines && initial.lines.length > 1)
    ? initial.lines.map(function(l) { return l.text || ''; }).join('\n')
    : (initial ? initial.name : '');

  const [name,          setName]          = useState(initName);
  const [stitchesW,     setStitchesW]     = useState(initial ? initial.stitchesW : 94);
  const [stitchesH,     setStitchesH]     = useState(initial ? initial.stitchesH : 94);
  const [hoopW,         setHoopW]         = useState(initial ? initial.hoopW : 280);
  const [hoopH,         setHoopH]         = useState(initial ? initial.hoopH : 250);
  const [notes,         setNotes]         = useState(initial ? initial.notes : '');
  const [borderId,      setBorderId]      = useState(initial ? initial.borderId : '');
  const [borderName,    setBorderName]    = useState(initial ? initial.borderName : '');
  const [threads,       setThreads]       = useState(
    initial && initial.threads && initial.threads.length > 0 ? initial.threads : DEFAULT_THREADS
  );
  const [threadLengths, setThreadLengths] = useState(initial && initial.threadLengths ? initial.threadLengths : []);
  const [strands,       setStrands]       = useState(initial && initial.strands ? initial.strands : 2);
  const [textScale,     setTextScale]     = useState(initial && initial.textScale ? initial.textScale : 0);
  const [lineScales,    setLineScales]    = useState(initial && initial.lineScales ? initial.lineScales : [0,0,0,0]);
  const [placedObjects, setPlacedObjects] = useState(initial && initial.placedObjects ? initial.placedObjects : {});
  const [activeTab,     setActiveTab]     = useState('word');
  const [settingsOpen,  setSettingsOpen]  = useState(false);
  const [pickerPos,     setPickerPos]     = useState(null);
  const [dmcPickerIdx,  setDmcPickerIdx]  = useState(null);
  const [calculating,   setCalculating]   = useState(false);
  const [errors,        setErrors]        = useState({});

  const MAX_LINES = 4;
  const parsedLines = name.split('\n').slice(0, MAX_LINES).map(function(text, i) {
    return { text: text, scale: lineScales[i] || 0 };
  });
  const isMultiRow = name.includes('\n') && parsedLines.length > 1;

  const activeBorder = borders.find(function(b) { return b.id === borderId; }) || null;
  const activeBorderSpec = activeBorder
    ? (activeBorder.spec || BORDER_SPECS[activeBorder.style] || null)
    : null;

  const canvasContainerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(function() {
    const canvas = canvasRef.current;
    const container = canvasContainerRef.current;
    if (!canvas || !container) return;
    const avail = Math.min(container.clientWidth - 40, container.clientHeight - 48);
    const px = Math.max(160, Math.min(avail, 560));
    canvas.width = px; canvas.height = px;
    canvas.style.width = px + 'px'; canvas.style.height = px + 'px';
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#F0E6D3'; ctx.fillRect(0, 0, px, px);
    const cols = +stitchesW || 94;
    const rows = +stitchesH || 94;
    const grid = isMultiRow
      ? buildGridMulti(parsedLines, cols, rows, activeBorderSpec, 2)
      : buildGrid(name.replace(/\n/g, ' '), cols, rows, activeBorderSpec, textScale, 2, placedObjects);
    const actualCols = grid[0] ? grid[0].length : cols;
    const actualRows = grid.length || rows;
    const cell = px / actualCols;
    const pad = cell * 0.1;
    const lw = Math.max(cell * 0.24, 0.5);
    grid.forEach(function(rowArr, row) {
      rowArr.forEach(function(kind, col) {
        if (kind === ' ') return;
        const c = stitchColor(kind, threads);
        if (!c) return;
        const x = col * cell, y = row * cell;
        ctx.strokeStyle = c; ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(x + pad, y + pad); ctx.lineTo(x + cell - pad, y + cell - pad);
        ctx.moveTo(x + cell - pad, y + pad); ctx.lineTo(x + pad, y + cell - pad);
        ctx.stroke();
      });
    });
    ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 0.3;
    for (var i = 0; i <= actualCols; i++) { ctx.beginPath(); ctx.moveTo(i*cell,0); ctx.lineTo(i*cell,px); ctx.stroke(); }
    for (var i = 0; i <= actualRows; i++) { ctx.beginPath(); ctx.moveTo(0,i*cell); ctx.lineTo(px,i*cell); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 0.5;
    for (var i = 0; i <= actualCols; i+=10) { ctx.beginPath(); ctx.moveTo(i*cell,0); ctx.lineTo(i*cell,px); ctx.stroke(); }
    for (var i = 0; i <= actualRows; i+=10) { ctx.beginPath(); ctx.moveTo(0,i*cell); ctx.lineTo(px,i*cell); ctx.stroke(); }
    ctx.strokeStyle = '#1A1A1A'; ctx.lineWidth = 1.5; ctx.strokeRect(0, 0, px, px);
  }, [name, stitchesW, stitchesH, borderId, threads, textScale, lineScales, placedObjects, isMultiRow, activeBorderSpec]);

  function updateThread(i, u) {
    setThreads(function(p) { return p.map(function(t, idx) { return idx === i ? u : t; }); });
  }
  function removeThread(i) {
    setThreads(function(p) { return p.filter(function(_, idx) { return idx !== i; }); });
  }
  function addThread() {
    if (threads.length >= 6) return;
    setThreads(function(p) { return [...p, {id:Date.now(), name:'', dmc:'', hex:'#666666', usage:''}]; });
  }
  function setLineScale(i, val) {
    setLineScales(function(prev) { var next = [...prev]; next[i] = val; return next; });
  }
  function handleRecalculate() {
    if (!name.trim() || !borderId) return;
    setCalculating(true);
    setTimeout(function() {
      var lengths = calculateThreadLengths(name, +stitchesW, +stitchesH, activeBorderSpec, threads, textScale, strands);
      setThreadLengths(lengths);
      setCalculating(false);
    }, 0);
  }
  function handleSave() {
    var fields = {
      name: name, stitchesW: +stitchesW, stitchesH: +stitchesH,
      hoopW: +hoopW, hoopH: +hoopH, notes: notes,
      borderId: borderId, borderName: borderName,
      threads: threads, textScale: textScale, strands: strands,
      lineScales: lineScales, lines: isMultiRow ? parsedLines : null,
      placedObjects: placedObjects,
    };
    var errs = validateShoutout(fields);
    setErrors(errs);
    if (hasErrors(errs)) { setActiveTab('word'); return; }
    var lengths = calculateThreadLengths(name, +stitchesW, +stitchesH, activeBorderSpec, threads, textScale, strands);
    setThreadLengths(lengths);
    onSave(Object.assign({}, fields, {threadLengths: lengths}));
  }
  function openObjPicker(posId) { setPickerPos(posId); }
  function closeObjPicker() { setPickerPos(null); }
  function placeObject(posId, obj) {
    // Normalise to plain layers format so canvas renders immediately
    // and Firestore serialisation works cleanly
    const layers = obj.layers
      ? obj.layers.map(function(l) {
          return {
            colorSlot: l.colorSlot || 'primary',
            pattern: (l.pattern || []).map(function(r) {
              return typeof r === 'string' ? r : r.join('');
            }),
          };
        })
      : [{ colorSlot: 'primary', pattern: (obj.pattern || []).map(function(r) {
          return typeof r === 'string' ? r : r.join('');
        }) }];
    const normObj = {
      id: obj.id || posId,
      name: obj.name || '',
      width: obj.width || (layers[0] && layers[0].pattern[0] ? layers[0].pattern[0].length : 0),
      height: obj.height || (layers[0] ? layers[0].pattern.length : 0),
      layers: layers,
    };
    setPlacedObjects(function(prev) { return Object.assign({}, prev, {[posId]: normObj}); });
    setPickerPos(null);
  }
  function clearPosition(posId) {
    setPlacedObjects(function(prev) { var next = Object.assign({}, prev); delete next[posId]; return next; });
    setPickerPos(null);
  }

  var activePosition = pickerPos ? COMPOSE_POSITIONS.find(function(p) { return p.id === pickerPos; }) : null;

  return (
    <div>
      <div className="sheet-fullscreen">

        <div className="compose-topbar">
          <button className="btn-icon" onClick={onClose} title="Close">
            <Ico.Close/>
          </button>
          <span className="compose-topbar-title">
            {isEdit ? 'Compose' : 'New shoutout'}
            {name.trim() && (
              <span className="compose-topbar-word"> — {name.replace(/\n/g,' ')}</span>
            )}
          </span>
          <div className="compose-actions">
            {onToggleKevin && (
              <button
                className={'btn btn-ghost btn-sm' + (kevinVisible ? ' active' : '')}
                onClick={onToggleKevin}
                title={kevinVisible ? 'Hide Kevin' : 'Open Kevin'}
                style={{fontWeight:700, letterSpacing:'0.3px'}}>
                CK
              </button>
            )}
            {hasErrors(errors) && (
              <span style={{fontSize:11, color:'var(--coral)'}}>Fix errors first</span>
            )}
            <button className="btn btn-outlined btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-coral btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create shoutout'}
            </button>
          </div>
        </div>

        <div className="compose-canvas-area" ref={canvasContainerRef}>
          <div className="compose-canvas-wrap">
            <canvas ref={canvasRef}
              style={{borderRadius:6, border:'1.5px solid var(--black)', display:'block'}}/>
            <div className="compose-canvas-label">
              {(+stitchesW||94)} x {(+stitchesH||94)} stitches
            </div>
          </div>
        </div>

        <div className="compose-panel">
          <div className="compose-tabs">
            {['word','border','colour','objects'].map(function(tab) {
              var labels = {word:'Word', border:'Border', colour:'Colour', objects:'Objects'};
              return (
                <button key={tab}
                  className={'compose-tab' + (activeTab === tab ? ' active' : '')}
                  onClick={function() { setActiveTab(tab); }}>
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          <div className="compose-panel-body">

            {activeTab === 'word' && (
              <div>
                <div className="form-group">
                  <div className="form-label-row">
                    <label className="form-label">Word or phrase</label>
                    {isMultiRow && (
                      <span className="multirow-count">{parsedLines.length}/{MAX_LINES} lines</span>
                    )}
                  </div>
                  <textarea
                    className={'form-input form-textarea-word' + (errors.name ? ' error' : '')}
                    placeholder="e.g. GOAL"
                    value={name}
                    rows={Math.max(2, parsedLines.length + 1)}
                    onChange={function(e) {
                      if (e.target.value.split('\n').length <= MAX_LINES) setName(e.target.value);
                    }}
                    onKeyDown={function(e) {
                      if (e.key === 'Enter' && name.split('\n').length >= MAX_LINES) e.preventDefault();
                    }}
                    autoFocus
                  />
                  {errors.name && <div className="form-error">{errors.name}</div>}
                  {isMultiRow && (
                    <div className="multirow-scales">
                      {parsedLines.map(function(line, i) {
                        return (
                          <div key={i} className="multirow-scale-row">
                            <span className="multirow-line-label">
                              {line.text.trim()
                                ? '"' + line.text.trim().slice(0,18) + (line.text.trim().length>18?'...':'') + '"'
                                : 'Line '+(i+1)}
                            </span>
                            <div className="size-toggle">
                              {[{label:'S',value:1},{label:'N',value:0},{label:'L',value:3}].map(function(opt) {
                                return (
                                  <button key={opt.label}
                                    className={'size-btn' + ((lineScales[i]||0)===opt.value?' active':'')}
                                    style={{padding:'3px 10px',fontSize:11}}
                                    onClick={function() { setLineScale(i, opt.value); }}>
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {!isMultiRow && (
                  <div className="form-group">
                    <label className="form-label">Text size</label>
                    <div className="size-toggle">
                      {[{label:'Small',value:1},{label:'Normal',value:0},{label:'Large',value:3}].map(function(opt) {
                        return (
                          <button key={opt.label}
                            className={'size-btn' + (textScale === opt.value ? ' active' : '')}
                            onClick={function() { setTextScale(opt.value); }}>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button className="compose-settings-toggle"
                  onClick={function() { setSettingsOpen(function(v) { return !v; }); }}>
                  Settings {settingsOpen ? '▲' : '▼'}
                </button>
                {settingsOpen && (
                  <div className="compose-settings-body">
                    <div className="form-group">
                      <label className="form-label">Stitch count</label>
                      <div className="form-row">
                        <div>
                          <input type="number" className="form-input" value={stitchesW}
                            onChange={function(e){setStitchesW(e.target.value);}}/>
                          <div className="form-hint">Width</div>
                        </div>
                        <div>
                          <input type="number" className="form-input" value={stitchesH}
                            onChange={function(e){setStitchesH(e.target.value);}}/>
                          <div className="form-hint">Height</div>
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Hoop size (mm)</label>
                      <div className="form-row">
                        <div>
                          <input type="number" className="form-input" value={hoopW}
                            onChange={function(e){setHoopW(e.target.value);}}/>
                          <div className="form-hint">Width</div>
                        </div>
                        <div>
                          <input type="number" className="form-input" value={hoopH}
                            onChange={function(e){setHoopH(e.target.value);}}/>
                          <div className="form-hint">Height</div>
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Notes</label>
                      <textarea className="form-textarea" placeholder="Any notes…"
                        value={notes} onChange={function(e){setNotes(e.target.value);}}/>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'border' && (
              <div>
                {errors.borderId && (
                  <div className="form-error" style={{marginBottom:8}}>{errors.borderId}</div>
                )}
                <BorderPicker borders={borders} selected={borderId}
                  onSelect={function(id,nm) { setBorderId(id); setBorderName(nm); }}/>
              </div>
            )}

            {activeTab === 'colour' && (
              <div>
                <div className="form-group">
                  <div className="form-label-row">
                    <label className="form-label">Threads</label>
                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                      <div className="size-toggle">
                        {[1,2,3].map(function(n) {
                          return (
                            <button key={n}
                              className={'size-btn' + (strands === n ? ' active' : '')}
                              style={{padding:'4px 10px', fontSize:11}}
                              onClick={function() { setStrands(n); }}>
                              {n}
                            </button>
                          );
                        })}
                      </div>
                      <span style={{fontSize:11, color:'var(--grey)'}}>strands</span>
                      <button className="btn btn-ghost btn-sm" onClick={handleRecalculate}
                        disabled={calculating || !name.trim() || !borderId}>
                        {calculating ? 'Calculating…' : 'Recalculate'}
                      </button>
                    </div>
                  </div>
                  <div className="threditor">
                    {threads.map(function(t, i) {
                      var slot = THREAD_SLOTS[i] || null;
                      var lengthEntry = threadLengths && threadLengths[i];
                      var cm = lengthEntry ? lengthEntry.cm : null;
                      var lightBorder = t.hex === '#FFFFFF' || t.hex === '#F5F5F5' || t.hex === '#F0E6D3';
                      return (
                        <div key={t.id || i} className="threditor-slot">
                          <button
                            className="threditor-swatch threditor-swatch-btn"
                            style={{
                              background: t.hex,
                              border: lightBorder ? '1.5px solid var(--lgrey)' : '1.5px solid transparent',
                              cursor: 'pointer'
                            }}
                            onClick={function() { setDmcPickerIdx(i); }}
                            title="Pick DMC colour"
                          />
                          <div className="threditor-info">
                            {slot && (
                              <div className="threditor-slot-label">
                                <span className="threditor-slot-name">{slot.label}</span>
                                <span className="threditor-slot-hint">{slot.hint}</span>
                              </div>
                            )}
                            <div className="threditor-colour-name">
                              {t.name || <span className="threditor-empty">No name</span>}
                            </div>
                            <div className="threditor-dmc">
                              {t.dmc || <span className="threditor-empty">No DMC code</span>}
                            </div>
                          </div>
                          <div className="threditor-right">
                            {cm != null && (
                              <div className="threditor-length">{'~' + cm + ' cm'}</div>
                            )}
                            {threads.length > 1 && (
                              <button className="thread-remove"
                                onClick={function() { removeThread(i); }}
                                title="Remove thread">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                  <line x1="18" y1="6" x2="6" y2="18"/>
                                  <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {threads.length < 6 && (
                    <button className="add-thread-btn" onClick={addThread}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add thread
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'objects' && (
              <div>
                <div className="form-hint" style={{marginBottom:10}}>
                  Tap a position to place an object. Layer colours follow your thread palette.
                </div>
                <div className="pos-grid">
                  {COMPOSE_POSITIONS.map(function(pos) {
                    return (
                      <PosCell key={pos.id}
                        pos={pos}
                        placed={placedObjects[pos.id] || null}
                        threads={threads}
                        onClick={pos.id !== 'centre' ? function() { openObjPicker(pos.id); } : undefined}
                        onClear={function() { clearPosition(pos.id); }}
                      />
                    );
                  })}
                </div>
                {Object.keys(placedObjects).length > 0 && (
                  <button className="btn btn-ghost btn-sm"
                    style={{color:'var(--coral)', fontSize:11, marginTop:4}}
                    onClick={function() { setPlacedObjects({}); }}>
                    Clear all positions
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {dmcPickerIdx !== null && (
        <DmcPickerSheet
          currentHex={threads[dmcPickerIdx] ? threads[dmcPickerIdx].hex : '#000000'}
          onSelect={function(c) {
            updateThread(dmcPickerIdx, Object.assign({}, threads[dmcPickerIdx], {
              hex: c.hex, dmc: 'DMC ' + c.dmc,
              name: (threads[dmcPickerIdx] && threads[dmcPickerIdx].name) || c.name
            }));
            setDmcPickerIdx(null);
          }}
          onClose={function() { setDmcPickerIdx(null); }}
        />
      )}

      {pickerPos && activePosition && (
        <ObjPickerSheet
          position={activePosition}
          objects={objects}
          threads={threads}
          placed={placedObjects[pickerPos] || null}
          onSelect={function(obj) { placeObject(pickerPos, obj); }}
          onClear={function() { clearPosition(pickerPos); }}
          onClose={closeObjPicker}
        />
      )}

    </div>
  );
}
