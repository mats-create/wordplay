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
function ShoutoutDetail({ shoutout, onEdit, onDelete, onClose, folders, onMoveToFolder }) {
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
            textScale={shoutout.textScale||0} size={550}/>
        </div>

        {shoutout.threads&&shoutout.threads.length>0 && (
          <div className="detail-section">
            <div className="detail-section-label">Threads</div>
            {shoutout.threads.map(function(t,i) {
              const lengthEntry = shoutout.threadLengths && shoutout.threadLengths[i];
              const cm = lengthEntry ? lengthEntry.cm : null;
              return (
                <div className="detail-thread-row" key={i}>
                  <div className="detail-swatch" style={{background:t.hex}}/>
                  <div style={{flex:1}}>
                    <div className="detail-thread-name">{t.name}</div>
                    <div className="detail-thread-dmc">{t.dmc}{t.usage?'  ·  '+t.usage:''}</div>
                  </div>
                  <div className="detail-thread-length">
                    {cm != null ? '~' + cm + ' cm' : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {shoutout.notes && (
          <div className="detail-section">
            <div className="detail-section-label">Notes</div>
            <div className="detail-notes">{shoutout.notes}</div>
          </div>
        )}

        <div className="detail-actions">
          {/* Primary action — top right */}
          <button className="btn btn-primary" onClick={onEdit}>
            <Ico.Edit/> Edit
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
const STYLE_OPTIONS = ['british','scandinavian','minimal','custom'];
const TRAIT_OPTIONS = ['diagonal-check','corner-footballs','goal-posts','shot-arrows',
  'geometric','diamond-repeat','two-line-frame','single-line','floral','folk-motifs'];

function BorderForm({ initial, onSave, onClose, saving }) {
  const isEdit = !!initial;
  const [name,   setName]   = useState(initial?initial.name:'');
  const [style,  setStyle]  = useState(initial?initial.style:'custom');
  const [desc,   setDesc]   = useState(initial?initial.description:'');
  const [traits, setTraits] = useState(initial?initial.traits:[]);
  const [errors, setErrors] = useState({});
  const [touched,setTouched]= useState({});

  function toggleTrait(t) {
    setTraits(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t]);
  }

  function handleSave() {
    const fields = {name,style,description:desc,traits};
    const errs = validateBorder(fields);
    setErrors(errs); setTouched({name:true,description:true});
    if (hasErrors(errs)) return;
    onSave(fields);
  }

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet">
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
            <label className="form-label">Style</label>
            <select className="form-input" value={style} onChange={e=>setStyle(e.target.value)}>
              {STYLE_OPTIONS.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
            <div className="form-hint">Drives the canvas rendering logic</div>
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

function ObjectEditor({ initial, onSave, onClose, saving }) {
  const isEdit = !!initial;
  const [name,    setName]    = useState(initial ? initial.name : '');
  const [pattern, setPattern] = useState(function() {
    if (initial && initial.pattern) return initial.pattern.map(function(r) { return r.split(''); });
    // Blank 9x9 grid
    return Array.from({length: OBJECT_DEFAULT_H}, function() {
      return Array(OBJECT_DEFAULT_W).fill('0');
    });
  });
  const [nameError, setNameError] = useState('');

  const h = pattern.length;
  const w = pattern[0] ? pattern[0].length : OBJECT_DEFAULT_W;

  function toggleCell(r, c) {
    setPattern(function(prev) {
      const next = prev.map(function(row) { return [...row]; });
      next[r][c] = next[r][c] === '1' ? '0' : '1';
      return next;
    });
  }

  function resizeGrid(newW, newH) {
    const clampW = Math.max(1, Math.min(OBJECT_MAX_W, newW));
    const clampH = Math.max(1, Math.min(OBJECT_MAX_H, newH));
    setPattern(function(prev) {
      return Array.from({length: clampH}, function(_, r) {
        return Array.from({length: clampW}, function(_, c) {
          return (prev[r] && prev[r][c]) ? prev[r][c] : '0';
        });
      });
    });
  }

  function handleSave() {
    if (!name.trim()) { setNameError('Name is required'); return; }
    setNameError('');
    const patternStrings = pattern.map(function(row) { return row.join(''); });
    onSave({ name: name.trim(), pattern: patternStrings, width: w, height: h });
  }

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

          {/* Stitch editor */}
          <div className="form-group">
            <label className="form-label">Stitch editor</label>
            <div className="form-hint" style={{marginBottom:8}}>Tap a cell to toggle a stitch on or off</div>
            <div className="stitch-editor-wrap">
              <div className="stitch-editor"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(' + w + ', ' + EDITOR_CELL + 'px)',
                  gridTemplateRows: 'repeat(' + h + ', ' + EDITOR_CELL + 'px)',
                }}>
                {pattern.map(function(row, r) {
                  return row.map(function(cell, c) {
                    const on = cell === '1';
                    return (
                      <div key={r + '-' + c}
                        className={'stitch-cell' + (on ? ' on' : '')}
                        onClick={function() { toggleCell(r, c); }}>
                        {on && (
                          <svg viewBox="0 0 32 32" width={EDITOR_CELL} height={EDITOR_CELL}>
                            <line x1="4" y1="4" x2="28" y2="28" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round"/>
                            <line x1="28" y1="4" x2="4" y2="28" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round"/>
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

function ObjectDetail({ object, onEdit, onDelete, onClose }) {
  const w = object.width || (object.pattern && object.pattern[0] ? object.pattern[0].length : 9);
  const h = object.height || (object.pattern ? object.pattern.length : 9);
  const previewCell = Math.min(Math.floor(300 / Math.max(w, h)), 28);
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
            {object.createdAt && <span> · {formatDate(object.createdAt)}</span>}
          </div>

          {/* Preview */}
          <div className="detail-section">
            <div className="detail-section-label">Pattern</div>
            <div className="object-detail-preview"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(' + w + ', ' + previewCell + 'px)',
                width: 'fit-content',
                gap: '1px',
                background: 'var(--lgrey)',
                border: '1px solid var(--lgrey)',
                borderRadius: 6,
                overflow: 'hidden',
              }}>
              {object.pattern && object.pattern.map(function(row, r) {
                return row.split('').map(function(ch, c) {
                  const on = ch === '1';
                  return (
                    <div key={r+'-'+c} style={{
                      width: previewCell, height: previewCell,
                      background: on ? 'var(--surface)' : 'var(--offwht)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {on && (
                        <svg viewBox="0 0 32 32" width={previewCell-4} height={previewCell-4}>
                          <line x1="4" y1="4" x2="28" y2="28" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round"/>
                          <line x1="28" y1="4" x2="4" y2="28" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round"/>
                        </svg>
                      )}
                    </div>
                  );
                });
              })}
            </div>
          </div>

          <div className="detail-actions">
            <button className="btn btn-primary" onClick={onEdit}><Ico.Edit/> Edit</button>
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
