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
function ShoutoutDetail({ shoutout, onEdit, onDelete, onClose }) {
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
          &nbsp;·&nbsp; 14-count Aida
          {shoutout.borderName && <span>&nbsp;·&nbsp; {shoutout.borderName} border</span>}
          {shoutout.createdAt && <span>&nbsp;·&nbsp; {formatDate(shoutout.createdAt)}</span>}
        </div>

        <div className="detail-section">
          <div className="detail-section-label">Pattern</div>
          <CrossStitchCanvas word={shoutout.name}
            cols={shoutout.stitchesW} rows={shoutout.stitchesH}
            borderStyle={bs} threads={shoutout.threads} size={550}/>
        </div>

        {shoutout.threads&&shoutout.threads.length>0 && (
          <div className="detail-section">
            <div className="detail-section-label">Threads</div>
            {shoutout.threads.map((t,i)=>(
              <div className="detail-thread-row" key={i}>
                <div className="detail-swatch" style={{background:t.hex}}/>
                <div>
                  <div className="detail-thread-name">{t.name}</div>
                  <div className="detail-thread-dmc">{t.dmc}{t.usage?'  ·  '+t.usage:''}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {shoutout.notes && (
          <div className="detail-section">
            <div className="detail-section-label">Notes</div>
            <div className="detail-notes">{shoutout.notes}</div>
          </div>
        )}

        <div className="detail-actions">
          <button className="btn btn-danger" onClick={onDelete}><Ico.Delete/> Delete</button>
          <button className="btn btn-primary" style={{marginLeft:'auto'}} onClick={onEdit}>
            <Ico.Edit/> Edit
          </button>
        </div>

        {/* Export row */}
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
function BorderDetail({ border, onEdit, onDelete, onClose }) {
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
          <CrossStitchCanvas word="ABC" cols={60} rows={60}
            borderStyle={border.style} threads={DEFAULT_THREADS} size={400}/>
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
          {!border.builtIn && (
            <button className="btn btn-danger" onClick={onDelete}><Ico.Delete/> Delete</button>
          )}
          <button className="btn btn-primary" style={{marginLeft:'auto'}} onClick={onEdit}
            disabled={border.builtIn}>
            {border.builtIn ? <><Ico.Lock/> Built-in</> : <><Ico.Edit/> Edit</>}
          </button>
        </div>
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
   TOP BAR + USER MENU
═══════════════════════════════════════════════════════════════════ */
function TopBar({ user, onSignOut }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="topbar">
      <div className="topbar-wordmark">Nutmeg<span>&</span>Needle</div>
      <div className="topbar-app-name">Wordplay</div>
      <div style={{position:'relative'}}>
        <img className="topbar-avatar"
          src={user.photoURL||'https://via.placeholder.com/32'}
          alt={user.displayName} onClick={()=>setOpen(o=>!o)}/>
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
              onClick={()=>{setOpen(false);onSignOut();}}>
              <Ico.SignOut/> Sign out
            </button>
          </div>
        )}
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
        <span className="signin-icon">🧵</span>
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
