/* ═══════════════════════════════════════════════════════════════════
   SHOUTOUTS SCREEN
═══════════════════════════════════════════════════════════════════ */
function ShoutoutsScreen({ shoutouts, borders, tmCache, onSelect, folders, activeFolder, onFolderChange, onFolderCreate, onFolderRename, onFolderDelete }) {
  const [query, setQuery] = useState('');
  const [folderMenu, setFolderMenu] = useState(null); // folder name with open menu

  const filtered = useMemo(function() {
    let list = shoutouts;
    if (activeFolder) {
      list = list.filter(function(s) { return s.folder === activeFolder; });
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(function(s) { return s.name && s.name.toLowerCase().includes(q); });
    }
    return list;
  }, [shoutouts, activeFolder, query]);

  const total = activeFolder ? shoutouts.filter(function(s) { return s.folder === activeFolder; }).length : shoutouts.length;
  const showCount = query.trim() && filtered.length !== total
    ? filtered.length + ' of ' + total
    : total;
  const noun = total === 1 ? 'shoutout' : 'shoutouts';

  return (
    <div className="screen">
      {/* Header row */}
      <div className="screen-header">
        <span className="screen-title">Football shoutouts</span>
        <span className="screen-count">{showCount} {noun}</span>
        <div className="search-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="search-input" placeholder="Search…" value={query}
            onChange={function(e) { setQuery(e.target.value); }}/>
          {query && (
            <button className="search-clear" onClick={function() { setQuery(''); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Folder pills */}
      <div className="folder-bar">
        <button className={'folder-pill' + (!activeFolder ? ' active' : '')}
          onClick={function() { onFolderChange(null); }}>All</button>
        {folders.map(function(f) {
          return (
            <div key={f} className="folder-pill-wrap">
              <button className={'folder-pill' + (activeFolder === f ? ' active' : '')}
                onClick={function() { onFolderChange(f); }}>{f}</button>
              <button className="folder-pill-menu" onClick={function(e) {
                e.stopPropagation();
                setFolderMenu(folderMenu === f ? null : f);
              }}>⋯</button>
              {folderMenu === f && (
                <div className="folder-dropdown">
                  <button onClick={function() {
                    const name = window.prompt('Rename folder:', f);
                    if (name && name.trim() && name.trim() !== f) {
                      onFolderRename('shoutouts', f, name.trim());
                    }
                    setFolderMenu(null);
                  }}>Rename</button>
                  <button className="danger" onClick={function() {
                    if (window.confirm('Delete folder "' + f + '"? Shoutouts will become unfiled.')) {
                      onFolderDelete('shoutouts', f);
                    }
                    setFolderMenu(null);
                  }}>Delete</button>
                </div>
              )}
            </div>
          );
        })}
        <button className="folder-add" onClick={function() {
          const name = window.prompt('New folder name:');
          if (name && name.trim()) onFolderCreate('shoutouts', name.trim());
        }}>+ Folder</button>
      </div>

      {/* Cards */}
      {shoutouts.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">🧵</span>
          <h3>No shoutouts yet</h3>
          <p>Tap + to create your first football shoutout, or ask Claude-Kevin for ideas.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">🔍</span>
          <h3>No results</h3>
          <p>{query ? 'No shoutouts match "' + query + '".' : 'No shoutouts in this folder.'}</p>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map(function(s) {
            const tm = tmCache && tmCache[s.name];
            return (
              <div key={s.id} className="card" onClick={function() { onSelect(s); }}>
                {s.folder && <div className="card-folder-tag">{s.folder}</div>}
                <CrossStitchCanvas word={s.name}
                  cols={s.stitchesW} rows={s.stitchesH}
                  borderStyle={s.borderSpec||s.borderStyle||'british'}
                  threads={s.threads} size={220}
                  textScale={s.textScale||0}
                  lines={s.lines||null}
                  className="canvas-thumb"/>
                <div className="card-title">{s.name}</div>
                <div className="card-sub">
                  {s.stitchesW}×{s.stitchesH} stitches · {s.hoopW}×{s.hoopH}mm
                  {s.borderName && <span> · {s.borderName}</span>}
                </div>
                {s.threads&&s.threads.length>0 && (
                  <div className="thread-chips">
                    {s.threads.slice(0,3).map(function(t,i) {
                      return (
                        <span key={i} className="thread-chip">
                          <span className="thread-dot" style={{background:t.hex}}/>
                          {t.dmc||t.name}
                        </span>
                      );
                    })}
                  </div>
                )}
                {tm && tm.risk !== 'none' && <TrademarkNotice result={tm}/>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BORDERS SCREEN
═══════════════════════════════════════════════════════════════════ */
function BordersScreen({ borders, onSelect, folders, activeFolder, onFolderChange, onFolderCreate, onFolderRename, onFolderDelete }) {
  const [query, setQuery] = useState('');
  const [folderMenu, setFolderMenu] = useState(null);

  const filtered = useMemo(function() {
    let list = borders;
    if (activeFolder) {
      list = list.filter(function(b) { return b.folder === activeFolder; });
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(function(b) {
        return (b.name && b.name.toLowerCase().includes(q))
          || (b.style && b.style.toLowerCase().includes(q))
          || (b.traits && b.traits.some(function(t) { return t.toLowerCase().includes(q); }));
      });
    }
    return list;
  }, [borders, activeFolder, query]);

  const total = activeFolder ? borders.filter(function(b) { return b.folder === activeFolder; }).length : borders.length;
  const showCount = query.trim() && filtered.length !== total
    ? filtered.length + ' of ' + total
    : total;
  const noun = total === 1 ? 'border' : 'borders';

  return (
    <div className="screen">
      <div className="screen-header">
        <span className="screen-title">Border library</span>
        <span className="screen-count">{showCount} {noun}</span>
        <div className="search-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="search-input" placeholder="Search…" value={query}
            onChange={function(e) { setQuery(e.target.value); }}/>
          {query && (
            <button className="search-clear" onClick={function() { setQuery(''); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Folder pills */}
      <div className="folder-bar">
        <button className={'folder-pill' + (!activeFolder ? ' active' : '')}
          onClick={function() { onFolderChange(null); }}>All</button>
        {folders.map(function(f) {
          return (
            <div key={f} className="folder-pill-wrap">
              <button className={'folder-pill' + (activeFolder === f ? ' active' : '')}
                onClick={function() { onFolderChange(f); }}>{f}</button>
              <button className="folder-pill-menu" onClick={function(e) {
                e.stopPropagation();
                setFolderMenu(folderMenu === f ? null : f);
              }}>⋯</button>
              {folderMenu === f && (
                <div className="folder-dropdown">
                  <button onClick={function() {
                    const name = window.prompt('Rename folder:', f);
                    if (name && name.trim() && name.trim() !== f) {
                      onFolderRename('borders', f, name.trim());
                    }
                    setFolderMenu(null);
                  }}>Rename</button>
                  <button className="danger" onClick={function() {
                    if (window.confirm('Delete folder "' + f + '"? Borders will become unfiled.')) {
                      onFolderDelete('borders', f);
                    }
                    setFolderMenu(null);
                  }}>Delete</button>
                </div>
              )}
            </div>
          );
        })}
        <button className="folder-add" onClick={function() {
          const name = window.prompt('New folder name:');
          if (name && name.trim()) onFolderCreate('borders', name.trim());
        }}>+ Folder</button>
      </div>

      {borders.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">🪡</span>
          <h3>No borders yet</h3>
          <p>Tap + to add a custom border style.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">🔍</span>
          <h3>No results</h3>
          <p>{query ? 'No borders match "' + query + '".' : 'No borders in this folder.'}</p>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map(function(b) {
            return (
              <div key={b.id} className="card" onClick={function() { onSelect(b); }}>
                {b.builtIn && <div className="card-badge">Built-in</div>}
                {b.folder && <div className="card-folder-tag">{b.folder}</div>}
                <CrossStitchCanvas word="ABC" cols={94} rows={94}
                  borderStyle={b.spec || b.style} threads={DEFAULT_THREADS} size={220}
                  className="canvas-thumb"/>
                <div className="card-title">{b.name}</div>
                {b.description && (
                  <div className="card-desc">{b.description.slice(0,90)}{b.description.length>90?'…':''}</div>
                )}
                {b.traits&&b.traits.length>0 && (
                  <div className="card-traits">
                    {b.traits.slice(0,4).map(function(t) { return <span key={t} className="trait-chip">{t}</span>; })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   OBJECTS SCREEN
═══════════════════════════════════════════════════════════════════ */
function ObjectsScreen({ objects, onSelect, folders, activeFolder, onFolderChange, onFolderCreate, onFolderRename, onFolderDelete }) {
  const [query, setQuery] = useState('');
  const [folderMenu, setFolderMenu] = useState(null);

  const filtered = useMemo(function() {
    let list = objects;
    if (activeFolder) list = list.filter(function(o) { return o.folder === activeFolder; });
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(function(o) { return o.name && o.name.toLowerCase().includes(q); });
    }
    return list;
  }, [objects, activeFolder, query]);

  const total = activeFolder ? objects.filter(function(o) { return o.folder === activeFolder; }).length : objects.length;
  const showCount = query.trim() && filtered.length !== total ? filtered.length + ' of ' + total : total;
  const noun = total === 1 ? 'object' : 'objects';

  return (
    <div className="screen">
      <div className="screen-header">
        <span className="screen-title">Motif objects</span>
        <span className="screen-count">{showCount} {noun}</span>
        <div className="search-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="search-input" placeholder="Search…" value={query}
            onChange={function(e) { setQuery(e.target.value); }}/>
          {query && (
            <button className="search-clear" onClick={function() { setQuery(''); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="folder-bar">
        <button className={'folder-pill' + (!activeFolder ? ' active' : '')}
          onClick={function() { onFolderChange(null); }}>All</button>
        {(folders||[]).map(function(f) {
          return (
            <div key={f} className="folder-pill-wrap">
              <button className={'folder-pill' + (activeFolder === f ? ' active' : '')}
                onClick={function() { onFolderChange(f); }}>{f}</button>
              <button className="folder-pill-menu" onClick={function(e) {
                e.stopPropagation();
                setFolderMenu(folderMenu === f ? null : f);
              }}>⋯</button>
              {folderMenu === f && (
                <div className="folder-dropdown">
                  <button onClick={function() {
                    const name = window.prompt('Rename folder:', f);
                    if (name && name.trim() && name.trim() !== f) onFolderRename('objects', f, name.trim());
                    setFolderMenu(null);
                  }}>Rename</button>
                  <button className="danger" onClick={function() {
                    if (window.confirm('Delete folder "' + f + '"? Objects will become unfiled.')) onFolderDelete('objects', f);
                    setFolderMenu(null);
                  }}>Delete</button>
                </div>
              )}
            </div>
          );
        })}
        <button className="folder-add" onClick={function() {
          const name = window.prompt('New folder name:');
          if (name && name.trim()) onFolderCreate('objects', name.trim());
        }}>+ Folder</button>
      </div>

      {objects.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">✦</span>
          <h3>No objects yet</h3>
          <p>Tap + to create a motif object, or ask Claude-Kevin to generate one from an image.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">🔍</span>
          <h3>No results</h3>
          <p>{query ? 'No objects match "' + query + '".' : 'No objects in this folder.'}</p>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map(function(o) {
            return (
              <div key={o.id} className="card object-card" onClick={function() { onSelect(o); }}>
                {o.folder && <div className="card-folder-tag">{o.folder}</div>}
                <ObjectPreview pattern={o.pattern} layers={o.layers} size={120}/>
                <div className="card-title">{o.name}</div>
                <div className="card-sub">{o.width}×{o.height} stitches</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Small read-only stitch preview for cards — handles both legacy (pattern) and layered objects
function ObjectPreview({ pattern, layers, size }) {
  // Normalise to a layers array for compound rendering
  var normLayers;
  if (layers && layers.length > 0) {
    normLayers = layers.map(function(l) {
      return {
        colorSlot: l.colorSlot || 'primary',
        pattern: l.pattern.map(function(r) { return typeof r === 'string' ? r.split('') : r; }),
      };
    });
  } else if (pattern && pattern.length > 0) {
    normLayers = [{ colorSlot: 'primary', pattern: pattern.map(function(r) { return r.split(''); }) }];
  } else {
    return <div className="object-preview-empty"/>;
  }

  const h = normLayers[0].pattern.length;
  const w = normLayers[0].pattern[0] ? normLayers[0].pattern[0].length : 0;
  if (!w || !h) return <div className="object-preview-empty"/>;

  const cell = Math.min(Math.floor(size / Math.max(w, h)), 20);
  const pw = w * cell;
  const ph = h * cell;
  const compoundGrid = buildCompoundGrid(normLayers, w, h);

  return (
    <div className="object-preview" style={{width: pw, height: ph}}>
      {compoundGrid.map(function(row, r) {
        return row.map(function(cell_data, c) {
          if (!cell_data) return null;
          const colour = cell_data.overlap ? '#CC3300' : layerSlotGrey(cell_data.colorSlot);
          const mk = markColour(colour);
          const x = c * cell;
          const y = r * cell;
          const pad = cell * 0.1;
          return (
            <svg key={r + '-' + c} style={{position:'absolute', left:x, top:y, width:cell, height:cell}}
              viewBox={'0 0 ' + cell + ' ' + cell}>
              <rect x="0" y="0" width={cell} height={cell} fill={colour}/>
              <line x1={pad} y1={pad} x2={cell-pad} y2={cell-pad} stroke={mk} strokeWidth={Math.max(cell*0.2,1)} strokeLinecap="round"/>
              <line x1={cell-pad} y1={pad} x2={pad} y2={cell-pad} stroke={mk} strokeWidth={Math.max(cell*0.2,1)} strokeLinecap="round"/>
            </svg>
          );
        });
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════════ */
