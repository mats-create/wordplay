function DmcPickerSheet({ currentHex, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(function() {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const filtered = useMemo(function() {
    if (!query.trim()) return DMC_COLOURS;
    const q = query.toLowerCase();
    return DMC_COLOURS.filter(function(c) {
      return c.dmc.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
    });
  }, [query]);

  return (
    <div className="overlay" onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dmc-sheet">
        <div className="sheet-handle"/>
        <div className="sheet-header">
          <span className="sheet-title">DMC colours</span>
          <button className="btn-icon" onClick={onClose}><Ico.Close/></button>
        </div>
        <div className="dmc-search-row">
          <input
            ref={inputRef}
            className="dmc-search"
            placeholder="Search by name or DMC number…"
            value={query}
            onChange={function(e) { setQuery(e.target.value); }}
          />
        </div>
        <div className="dmc-grid">
          {filtered.length === 0 && (
            <div className="dmc-empty">No colours found for "{query}"</div>
          )}
          {filtered.map(function(c, i) {
            const isSelected = c.hex.toLowerCase() === currentHex.toLowerCase();
            return (
              <div
                key={c.dmc + '-' + i}
                className={'dmc-swatch' + (isSelected ? ' selected' : '')}
                style={{background: c.hex, border: c.hex === '#FFFFFF' || c.hex === '#FFFFF0' || c.hex === '#FFF8B0' ? '2px solid #e0e0e0' : undefined}}
                onClick={function() { onSelect(c); onClose(); }}
                title={c.dmc + ' — ' + c.name}
              >
                <div className="dmc-swatch-tip">{c.dmc} {c.name}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   THREAD ROW (form sub-component)
═══════════════════════════════════════════════════════════════════ */
function ThreadRow({ thread, onChange, onRemove, lengthCm, slotIndex }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const slot = THREAD_SLOTS[slotIndex] || null;
  return (
    <>
      {slot && (
        <div className="thread-slot-label">
          <span className="thread-slot-name">{slot.label}</span>
          <span className="thread-slot-hint">{slot.hint}</span>
        </div>
      )}
      <div className="thread-row">
        <button className="thread-color-btn" style={{background:thread.hex}}
          onClick={function() { setPickerOpen(true); }}
          title="Pick DMC colour"/>
        <input className="form-input" placeholder="Name" value={thread.name}
          onChange={function(e) { onChange({...thread, name:e.target.value}); }}/>
        <input className="form-input" placeholder="DMC code" value={thread.dmc}
          onChange={function(e) { onChange({...thread, dmc:e.target.value}); }}/>
        <div className="thread-length" title="Estimated thread length">
          {lengthCm != null ? '~' + lengthCm + ' cm' : '—'}
        </div>
        <button className="thread-remove" onClick={onRemove}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      {pickerOpen && (
        <DmcPickerSheet
          currentHex={thread.hex}
          onSelect={function(c) {
            onChange({...thread, hex:c.hex, dmc:'DMC '+c.dmc, name:thread.name || c.name});
          }}
          onClose={function() { setPickerOpen(false); }}
        />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BORDER PICKER (used inside shoutout form)
═══════════════════════════════════════════════════════════════════ */
function BorderPicker({ borders, selected, onSelect }) {
  return (
    <div className="border-picker">
      {borders.map(b => (
        <div key={b.id}
          className={'border-option' + (selected===b.id?' selected':'')}
          onClick={()=>onSelect(b.id, b.name)}>
          <div className="border-option-thumb">
            <CrossStitchCanvas word="ABC" cols={94} rows={94}
              borderStyle={b.spec || b.style} threads={DEFAULT_THREADS} size={88}/>
          </div>
          <div className="border-option-label">{b.name}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SHOUTOUT FORM
═══════════════════════════════════════════════════════════════════ */
function ShoutoutForm({ initial, borders, onSave, onClose, saving }) {
  const isEdit = !!initial;
  const [name,      setName]      = useState(initial?initial.name:'');
  const [stitchesW, setStitchesW] = useState(initial?initial.stitchesW:94);
  const [stitchesH, setStitchesH] = useState(initial?initial.stitchesH:94);
  const [hoopW,     setHoopW]     = useState(initial?initial.hoopW:280);
  const [hoopH,     setHoopH]     = useState(initial?initial.hoopH:250);
  const [notes,     setNotes]     = useState(initial?initial.notes:'');
  const [borderId,  setBorderId]  = useState(initial?initial.borderId:'');
  const [borderName,setBorderName]= useState(initial?initial.borderName:'');
  const [threads,   setThreads]   = useState(
    initial&&initial.threads&&initial.threads.length>0 ? initial.threads : DEFAULT_THREADS
  );
  const [threadLengths, setThreadLengths] = useState(initial&&initial.threadLengths ? initial.threadLengths : []);
  const [calculating,   setCalculating]   = useState(false);
  const [strands,       setStrands]       = useState(initial&&initial.strands ? initial.strands : 2);
  const [textScale,     setTextScale]     = useState(initial&&initial.textScale ? initial.textScale : 0);
  const [lineScales,    setLineScales]    = useState(initial&&initial.lineScales ? initial.lineScales : [0,0,0,0]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const MAX_LINES = 4;

  // Parse name into lines (split on newline, max 4)
  const parsedLines = name.split('\n').slice(0, MAX_LINES).map(function(text, i) {
    return { text: text, scale: lineScales[i] || 0 };
  });
  const isMultiRow = name.includes('\n') && parsedLines.length > 1;

  function setLineScale(i, val) {
    setLineScales(function(prev) {
      const next = [...prev]; next[i] = val; return next;
    });
  }

  function touch(field) { setTouched(p=>({...p,[field]:true})); }

  function updateThread(i,u) { setThreads(p=>p.map((t,idx)=>idx===i?u:t)); }
  function removeThread(i)   { setThreads(p=>p.filter((_,idx)=>idx!==i)); }
  function addThread()       { setThreads(p=>[...p,{id:Date.now(),name:'',dmc:'',hex:'#666666',usage:''}]); }

  function handleRecalculate() {
    if (!name.trim() || !borderId) return;
    setCalculating(true);
    const border = borders.find(function(b) { return b.id === borderId; });
    const borderSpec = border && (border.spec || BORDER_SPECS[border.style]);
    setTimeout(function() {
      const lengths = calculateThreadLengths(name, +stitchesW, +stitchesH, borderSpec, threads, textScale, strands);
      setThreadLengths(lengths);
      setCalculating(false);
    }, 0);
  }

  function getLengthCm(i) {
    const entry = threadLengths[i];
    return entry ? entry.cm : null;
  }

  function handleSave() {
    const fields = {name,stitchesW:+stitchesW,stitchesH:+stitchesH,
      hoopW:+hoopW,hoopH:+hoopH,notes,borderId,borderName,threads,
      textScale,strands,lineScales,
      lines: isMultiRow ? parsedLines : null};
    const errs = validateShoutout(fields);
    setErrors(errs);
    setTouched({name:true,stitchesW:true,stitchesH:true,hoopW:true,hoopH:true,borderId:true});
    if (hasErrors(errs)) return;
    const border = borders.find(function(b) { return b.id === borderId; });
    const borderSpec = border && (border.spec || BORDER_SPECS[border.style]);
    const lengths = calculateThreadLengths(name, +stitchesW, +stitchesH, borderSpec, threads, textScale, strands);
    setThreadLengths(lengths);
    onSave({...fields, threadLengths: lengths});
  }

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-header">
          <span className="sheet-title">{isEdit?'Edit shoutout':'New shoutout'}</span>
          <button className="btn-icon" onClick={onClose}><Ico.Close/></button>
        </div>
        <div className="sheet-body">

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">Word or phrase</label>
              {isMultiRow && <span className="multirow-count">{parsedLines.length}/{MAX_LINES} lines</span>}
            </div>
            <textarea
              className={'form-input form-textarea-word' + (touched.name&&errors.name?' error':'')}
              placeholder={'e.g. GOAL!\nPress Enter for multiple lines (max 4)'}
              value={name}
              rows={Math.max(2, parsedLines.length + 1)}
              onChange={function(e) {
                const ls = e.target.value.split('\n');
                if (ls.length > MAX_LINES) return;
                setName(e.target.value);
              }}
              onKeyDown={function(e) {
                if (e.key === 'Enter') {
                  const ls = name.split('\n');
                  if (ls.length >= MAX_LINES) e.preventDefault();
                }
              }}
              onBlur={function() { touch('name'); }}
              autoFocus
            />
            {touched.name&&errors.name && <div className="form-error">{errors.name}</div>}
            {isMultiRow && (
              <div className="multirow-scales">
                {parsedLines.map(function(line, i) {
                  return (
                    <div key={i} className="multirow-scale-row">
                      <span className="multirow-line-label">
                        {line.text.trim() ? '"' + line.text.trim().slice(0,18) + (line.text.trim().length>18?'…':'') + '"' : 'Line '+(i+1)}
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

          {/* Single-row text size — hidden when multi-row */}
          {!isMultiRow && (
          <div className="form-group">
            <label className="form-label">Text size</label>
            <div className="size-toggle">
              {[{label:'Small', value:1},{label:'Normal', value:0},{label:'Large', value:3}].map(function(opt) {
                return (
                  <button key={opt.label}
                    className={'size-btn' + (textScale === opt.value ? ' active' : '')}
                    onClick={function() { setTextScale(opt.value); }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="form-hint">
              {textScale === 0 ? 'Auto — best fit for the word' :
               textScale === 1 ? 'Small — fits longer words' :
               'Large — bold impact for short words'}
            </div>
          </div>
          )}

          <div className="form-group">
            <label className="form-label">Border style</label>
            <BorderPicker borders={borders} selected={borderId}
              onSelect={(id,nm)=>{setBorderId(id);setBorderName(nm);touch('borderId');}}/>
            {touched.borderId&&errors.borderId && <div className="form-error">{errors.borderId}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Stitch count</label>
            <div className="form-row">
              <div>
                <input type="number" className={'form-input'+(touched.stitchesW&&errors.stitchesW?' error':'')}
                  value={stitchesW} onChange={e=>setStitchesW(e.target.value)} onBlur={()=>touch('stitchesW')}/>
                <div className={touched.stitchesW&&errors.stitchesW?'form-error':'form-hint'}>
                  {touched.stitchesW&&errors.stitchesW?errors.stitchesW:'Width (stitches)'}
                </div>
              </div>
              <div>
                <input type="number" className={'form-input'+(touched.stitchesH&&errors.stitchesH?' error':'')}
                  value={stitchesH} onChange={e=>setStitchesH(e.target.value)} onBlur={()=>touch('stitchesH')}/>
                <div className={touched.stitchesH&&errors.stitchesH?'form-error':'form-hint'}>
                  {touched.stitchesH&&errors.stitchesH?errors.stitchesH:'Height (stitches)'}
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Hoop size (mm)</label>
            <div className="form-row">
              <div>
                <input type="number" className={'form-input'+(touched.hoopW&&errors.hoopW?' error':'')}
                  value={hoopW} onChange={e=>setHoopW(e.target.value)} onBlur={()=>touch('hoopW')}/>
                <div className={touched.hoopW&&errors.hoopW?'form-error':'form-hint'}>
                  {touched.hoopW&&errors.hoopW?errors.hoopW:'Width (mm)'}
                </div>
              </div>
              <div>
                <input type="number" className={'form-input'+(touched.hoopH&&errors.hoopH?' error':'')}
                  value={hoopH} onChange={e=>setHoopH(e.target.value)} onBlur={()=>touch('hoopH')}/>
                <div className={touched.hoopH&&errors.hoopH?'form-error':'form-hint'}>
                  {touched.hoopH&&errors.hoopH?errors.hoopH:'Height (mm)'}
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">Threads</label>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <div className="size-toggle" style={{fontSize:11}}>
                  {[1,2,3].map(function(n) {
                    return (
                      <button key={n}
                        className={'size-btn' + (strands === n ? ' active' : '')}
                        style={{padding:'4px 10px', fontSize:11}}
                        onClick={function() { setStrands(n); }}
                        title={n + ' strand' + (n > 1 ? 's' : '')}>
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
            <div className="thread-list">
              {threads.map((t,i)=>(
                <ThreadRow key={t.id||i} thread={t}
                  onChange={u=>updateThread(i,u)} onRemove={()=>removeThread(i)}
                  lengthCm={getLengthCm(i)} slotIndex={i}/>
              ))}
            </div>
            <button className="add-thread-btn" onClick={addThread}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add thread
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" placeholder="Any notes about this shoutout…"
              value={notes} onChange={e=>setNotes(e.target.value)}/>
          </div>

          <div className="form-actions">
            <button className="btn btn-outlined" onClick={onClose}>Cancel</button>
            <button className="btn btn-coral" onClick={handleSave} disabled={saving}>
              {saving?'Saving…':isEdit?'Save changes':'Create shoutout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

