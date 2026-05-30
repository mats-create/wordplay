/* ═══════════════════════════════════════════════════════════════════
   FOLDER PILL — with rename/delete menu
═══════════════════════════════════════════════════════════════════ */
function FolderPill({ name, active, count, onClick, onRename, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);

  function handleRename(e) {
    e.stopPropagation();
    setMenuOpen(false);
    const newName = prompt('Rename folder:', name);
    if (newName && newName.trim() && newName.trim() !== name) {
      onRename(name, newName.trim());
    }
  }

  function handleDelete(e) {
    e.stopPropagation();
    setMenuOpen(false);
    if (window.confirm('Delete folder "' + name + '"? Items in this folder will become unfiled.')) {
      onDelete(name);
    }
  }

  return (
    <div className="folder-pill-wrap">
      <button className={'folder-pill' + (active ? ' active' : '')} onClick={onClick}>
        {name} ({count})
      </button>
      <button className="folder-pill-menu-btn"
        onClick={function(e) { e.stopPropagation(); setMenuOpen(function(v) { return !v; }); }}
        title="Rename or delete folder">
        &#xB7;&#xB7;&#xB7;
      </button>
      {menuOpen && (
        <div className="folder-pill-menu">
          <button className="folder-pill-menu-item" onClick={handleRename}>
            Rename
          </button>
          <button className="folder-pill-menu-item folder-pill-menu-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SHOUTOUTS SCREEN
═══════════════════════════════════════════════════════════════════ */
function ShoutoutsScreen({ shoutouts, borders, tmCache, onCompose, onExportChart, onExportAida, onDelete, onToggleLock, onMoveToFolder, folders, activeFolder, onFolderChange, onFolderCreate, onFolderRename, onFolderDelete }) {
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [lockedMsg,  setLockedMsg]  = useState(false);
  const [sortOrder,  setSortOrder]  = useState('newest');

  function showLockedMessage() {
    setLockedMsg(true);
    setTimeout(function() { setLockedMsg(false); }, 3000);
  }

  const filtered = useMemo(function() {
    var list = shoutouts;
    if (activeFolder) {
      list = list.filter(function(s) { return s.folder === activeFolder; });
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(function(s) { return (s.designName||s.name).toLowerCase().includes(q); });
    }
    list = list.slice().sort(function(a,b) {
      if (sortOrder === 'nameAsc')  return (a.designName||a.name).localeCompare(b.designName||b.name);
      if (sortOrder === 'nameDesc') return (b.designName||b.name).localeCompare(a.designName||a.name);
      // newest first — use createdAt timestamp, fall back to id order
      const ta = (a.createdAt && a.createdAt.seconds) ? a.createdAt.seconds : 0;
      const tb = (b.createdAt && b.createdAt.seconds) ? b.createdAt.seconds : 0;
      return tb - ta;
    });
    return list;
  }, [shoutouts, activeFolder, query, sortOrder]);

  const total = activeFolder ? shoutouts.filter(function(s) { return s.folder === activeFolder; }).length : shoutouts.length;

  function select(s) {
    setSelected(function(prev) { return prev && prev.id === s.id ? null : s; });
    setExportOpen(false); setFolderOpen(false);
  }
  function deselect() { setSelected(null); setExportOpen(false); setFolderOpen(false); }

  // Keep selected in sync if shoutouts list updates
  useEffect(function() {
    if (selected) {
      const updated = shoutouts.find(function(s) { return s.id === selected.id; });
      if (updated) setSelected(updated); else setSelected(null);
    }
  }, [shoutouts]);

  return (
    <>
    <div className="screen">
      {/* Folder bar */}
      <div className="folder-bar">
        <button className={'folder-pill' + (!activeFolder ? ' active' : '')}
          onClick={function() { onFolderChange(null); }}>All ({total})</button>
        {folders.map(function(f) {
          const count = shoutouts.filter(function(s) { return s.folder === f; }).length;
          return (
            <FolderPill key={f} name={f} count={count} active={activeFolder===f}
              onClick={function() { onFolderChange(f); }}
              onRename={function(old, nw) { onFolderRename('shoutouts', old, nw); }}
              onDelete={function(n) { onFolderDelete('shoutouts', n); }}/>
          );
        })}
        <button className="folder-pill folder-pill-add"
          onClick={function() {
            const name = prompt('New folder name:');
            if (name && name.trim()) onFolderCreate(name.trim());
          }}>+</button>
      </div>

      {/* Search */}
      <div className="search-wrap">
        <input className="search-input" type="text" placeholder={'Search ' + shoutouts.length + ' shoutouts…'}
          value={query} onChange={function(e) { setQuery(e.target.value); }}/>
        <select className="sort-select" value={sortOrder}
          onChange={function(e) { setSortOrder(e.target.value); }}>
          <option value="newest">Newest first</option>
          <option value="nameAsc">Name A→Z</option>
          <option value="nameDesc">Name Z→A</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>{query ? 'No shoutouts match your search.' : 'No shoutouts yet.'}</p>
          <p>Tap + to create your first shoutout.</p>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map(function(s) {
            const tm = tmCache && tmCache[s.name];
            const isSelected = selected && selected.id === s.id;
            return (
              <div key={s.id}
                className={'card' + (isSelected ? ' card-selected' : '')}
                onClick={function() { select(s); }}>
                {s.folder && <div className="card-folder-tag">{s.folder}</div>}
                {s.locked && (
                  <div className="card-locked-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                )}
                <div className="card-select-ring">
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <CrossStitchCanvas word={s.name}
                  cols={s.stitchesW} rows={s.stitchesH}
                  borderStyle={s.borderSpec||s.borderStyle||'british'}
                  threads={s.threads} size={220}
                  textScale={s.textScale||0}
                  lines={s.lines||null}
                  placedObjects={s.placedObjects||null}
                  className="canvas-thumb"/>
                <div className="card-title">{s.designName || s.name}</div>
                <div className="card-sub">
                  {s.stitchesW}x{s.stitchesH} stitches · {s.hoopW}x{s.hoopH}mm
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

    {/* Selection toolbar — anchored to screen-wrap, not constrained by screen max-width */}
    {selected && (
      <div className="sel-toolbar">
          <div className="sel-toolbar-inner">
            <div className="sel-toolbar-label">
              <div className="sel-toolbar-swatches">
                {(selected.threads||[]).slice(0,4).map(function(t,i) {
                  return <div key={i} className="sel-swatch-dot" style={{background:t.hex}}/>;
                })}
              </div>
              <div className="sel-toolbar-info">
                <div className="sel-toolbar-name">{selected.designName || selected.name}</div>
                <div className="sel-toolbar-sub">
                  {selected.stitchesW}x{selected.stitchesH}
                  {selected.borderName ? ' · '+selected.borderName : ''}
                  {selected.folder ? ' · '+selected.folder : ''}
                </div>
              </div>
              <button className="sel-toolbar-close" onClick={deselect}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="sel-toolbar-actions">
              {lockedMsg && (
                <div className="sel-locked-msg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Design is locked. Click Unlock to open for editing.
                </div>
              )}
              <button className={'sel-btn sel-btn-primary' + (selected.locked ? ' sel-btn-locked' : '')}
                onClick={function() {
                  if (selected.locked) {
                    showLockedMessage();
                  } else {
                    onCompose(selected); deselect();
                  }
                }}>
                {selected.locked
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>
                }
                Compose
              </button>

              <div style={{position:'relative'}}>
                <button className="sel-btn"
                  onClick={function() { setFolderOpen(function(v){return !v;}); setExportOpen(false); }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  Folder
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {folderOpen && (
                  <div className="sel-dropdown">
                    <button className={'sel-dropdown-item'+((!selected.folder)?' sel-dropdown-active':'')}
                      onClick={function() { onMoveToFolder('shoutout', selected.id, null); setFolderOpen(false); }}>
                      No folder
                    </button>
                    {folders.map(function(f) {
                      return (
                        <button key={f}
                          className={'sel-dropdown-item'+(selected.folder===f?' sel-dropdown-active':'')}
                          onClick={function() { onMoveToFolder('shoutout', selected.id, f); setFolderOpen(false); }}>
                          {f}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{position:'relative'}}>
                <button className="sel-btn"
                  onClick={function() { setExportOpen(function(v){return !v;}); setFolderOpen(false); }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Export
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {exportOpen && (
                  <div className="sel-dropdown">
                    <button className="sel-dropdown-item"
                      onClick={function() { onExportChart(selected); setExportOpen(false); }}>
                      Stitch guide (PDF)
                    </button>
                    <button className="sel-dropdown-item"
                      onClick={function() { onExportAida(selected); setExportOpen(false); }}>
                      Aida print (PDF)
                    </button>
                  </div>
                )}
              </div>

              <div style={{flex:1}}/>

              <button className="sel-btn"
                onClick={function() { onToggleLock(selected); }}
                title={selected.locked ? 'Unlock design' : 'Lock design'}>
                {selected.locked
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                }
                {selected.locked ? 'Unlock' : 'Lock'}
              </button>

              <button className="sel-btn sel-btn-danger"
                onClick={function() { onDelete(selected); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BORDERS SCREEN
═══════════════════════════════════════════════════════════════════ */
function BordersScreen({ borders, onEdit, onDelete, onToggleLock, onMoveToFolder, folders, activeFolder, onFolderChange, onFolderCreate, onFolderRename, onFolderDelete }) {
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState(null);
  const [folderOpen, setFolderOpen] = useState(false);
  const [lockedMsg,  setLockedMsg]  = useState(false);
  const [sortOrder,  setSortOrder]  = useState('newest');

  function showLockedMessage() {
    setLockedMsg(true);
    setTimeout(function() { setLockedMsg(false); }, 3000);
  }

  const filtered = useMemo(function() {
    var list = borders;
    if (activeFolder) list = list.filter(function(b) { return b.folder === activeFolder; });
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(function(b) { return b.name.toLowerCase().includes(q); });
    }
    list = list.slice().sort(function(a,b) {
      if (sortOrder === 'nameAsc')  return a.name.localeCompare(b.name);
      if (sortOrder === 'nameDesc') return b.name.localeCompare(a.name);
      const ta = (a.createdAt && a.createdAt.seconds) ? a.createdAt.seconds : 0;
      const tb = (b.createdAt && b.createdAt.seconds) ? b.createdAt.seconds : 0;
      return tb - ta;
    });
    return list;
  }, [borders, activeFolder, query, sortOrder]);

  const total = activeFolder ? borders.filter(function(b) { return b.folder === activeFolder; }).length : borders.length;

  function select(b) {
    setSelected(function(prev) { return prev && prev.id === b.id ? null : b; });
    setFolderOpen(false);
  }
  function deselect() { setSelected(null); setFolderOpen(false); }

  useEffect(function() {
    if (selected) {
      const updated = borders.find(function(b) { return b.id === selected.id; });
      if (updated) setSelected(updated); else setSelected(null);
    }
  }, [borders]);

  return (
    <>
    <div className="screen">
      <div className="folder-bar">
        <button className={'folder-pill' + (!activeFolder ? ' active' : '')}
          onClick={function() { onFolderChange(null); }}>All ({total})</button>
        {folders.map(function(f) {
          const count = borders.filter(function(b) { return b.folder === f; }).length;
          return (
            <FolderPill key={f} name={f} count={count} active={activeFolder===f}
              onClick={function() { onFolderChange(f); }}
              onRename={function(old, nw) { onFolderRename('borders', old, nw); }}
              onDelete={function(n) { onFolderDelete('borders', n); }}/>
          );
        })}
        <button className="folder-pill folder-pill-add"
          onClick={function() {
            const name = prompt('New folder name:');
            if (name && name.trim()) onFolderCreate(name.trim());
          }}>+</button>
      </div>

      <div className="search-wrap">
        <input className="search-input" type="text" placeholder={'Search ' + borders.length + ' borders…'}
          value={query} onChange={function(e) { setQuery(e.target.value); }}/>
        <select className="sort-select" value={sortOrder}
          onChange={function(e) { setSortOrder(e.target.value); }}>
          <option value="newest">Newest first</option>
          <option value="nameAsc">Name A→Z</option>
          <option value="nameDesc">Name Z→A</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>{query ? 'No borders match your search.' : 'No borders yet.'}</p>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map(function(b) {
            const isSelected = selected && selected.id === b.id;
            const spec = b.spec || BORDER_SPECS[b.style] || BORDER_SPECS['minimal'];
            return (
              <div key={b.id}
                className={'card' + (isSelected ? ' card-selected' : '')}
                onClick={function() { select(b); }}>
                {b.folder && <div className="card-folder-tag">{b.folder}</div>}
                {(b.locked || b.builtIn) && (
                  <div className="card-locked-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                )}
                <div className="card-select-ring">
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <div className="canvas-thumb border-preview-thumb">
                  <CrossStitchCanvas word="ABC" cols={94} rows={94}
                    borderStyle={spec} size={220}
                    threads={BORDER_GREY_THREADS} className="canvas-thumb"/>
                </div>
                <div className="card-title">{b.name}</div>
                {b.description && <div className="card-desc">{b.description}</div>}
                {b.traits && b.traits.length > 0 && (
                  <div className="card-traits">
                    {b.traits.slice(0,3).map(function(t,i) {
                      return <span key={i} className="card-trait">{t}</span>;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
    {selected && (
      <div className="sel-toolbar">
          <div className="sel-toolbar-inner">
            <div className="sel-toolbar-label">
              <div className="sel-toolbar-info">
                <div className="sel-toolbar-name">{selected.name}</div>
                <div className="sel-toolbar-sub">
                  {selected.builtIn ? 'Built-in border' : 'Custom border'}
                  {(selected.locked || selected.builtIn) ? ' · Locked' : ''}
                  {selected.folder ? ' · '+selected.folder : ''}
                </div>
              </div>
              <button className="sel-toolbar-close" onClick={deselect}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="sel-toolbar-actions">
              {lockedMsg && (
                <div className="sel-locked-msg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Border is locked. Click Unlock to edit.
                </div>
              )}
              <button className={'sel-btn sel-btn-primary' + ((selected.locked || selected.builtIn) ? ' sel-btn-locked' : '')}
                onClick={function() {
                  if (selected.locked || selected.builtIn) { showLockedMessage(); }
                  else { onEdit(selected); deselect(); }
                }}>
                {(selected.locked || selected.builtIn)
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  : <Ico.Edit/>
                }
                Edit
              </button>

              <div style={{position:'relative'}}>
                  <button className="sel-btn"
                    onClick={function() { setFolderOpen(function(v){return !v;}); }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    Folder
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {folderOpen && (
                    <div className="sel-dropdown">
                      <button className={'sel-dropdown-item'+((!selected.folder)?' sel-dropdown-active':'')}
                        onClick={function() { onMoveToFolder('border', selected.id, null); setFolderOpen(false); }}>
                        No folder
                      </button>
                      {folders.map(function(f) {
                        return (
                          <button key={f}
                            className={'sel-dropdown-item'+(selected.folder===f?' sel-dropdown-active':'')}
                            onClick={function() { onMoveToFolder('border', selected.id, f); setFolderOpen(false); }}>
                            {f}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

              <div style={{flex:1}}/>

              <button className="sel-btn"
                onClick={function() { onToggleLock(selected); }}
                title={(selected.locked || selected.builtIn) ? 'Unlock border' : 'Lock border'}>
                {(selected.locked || selected.builtIn)
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                }
                {selected.builtIn ? 'Copy to library' : selected.locked ? 'Unlock' : 'Lock'}
              </button>

              {!selected.builtIn && !selected.locked && (
                <button className="sel-btn sel-btn-danger"
                  onClick={function() { onDelete(selected); }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                  </svg>
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   OBJECTS SCREEN
═══════════════════════════════════════════════════════════════════ */
function ObjectsScreen({ objects, onEdit, onDelete, onMoveToFolder, folders, activeFolder, onFolderChange, onFolderCreate, onFolderRename, onFolderDelete }) {
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState(null);
  const [folderOpen, setFolderOpen] = useState(false);
  const [sortOrder,  setSortOrder]  = useState('newest');

  const filtered = useMemo(function() {
    var list = objects;
    if (activeFolder) list = list.filter(function(o) { return o.folder === activeFolder; });
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(function(o) { return o.name.toLowerCase().includes(q); });
    }
    list = list.slice().sort(function(a,b) {
      if (sortOrder === 'nameAsc')  return a.name.localeCompare(b.name);
      if (sortOrder === 'nameDesc') return b.name.localeCompare(a.name);
      const ta = (a.createdAt && a.createdAt.seconds) ? a.createdAt.seconds : 0;
      const tb = (b.createdAt && b.createdAt.seconds) ? b.createdAt.seconds : 0;
      return tb - ta;
    });
    return list;
  }, [objects, activeFolder, query, sortOrder]);

  const total = activeFolder ? objects.filter(function(o) { return o.folder === activeFolder; }).length : objects.length;

  function select(o) {
    setSelected(function(prev) { return prev && prev.id === o.id ? null : o; });
    setFolderOpen(false);
  }
  function deselect() { setSelected(null); setFolderOpen(false); }

  useEffect(function() {
    if (selected) {
      const updated = objects.find(function(o) { return o.id === selected.id; });
      if (updated) setSelected(updated); else setSelected(null);
    }
  }, [objects]);

  return (
    <>
    <div className="screen">
      <div className="folder-bar">
        <button className={'folder-pill' + (!activeFolder ? ' active' : '')}
          onClick={function() { onFolderChange(null); }}>All ({total})</button>
        {(folders||[]).map(function(f) {
          const count = objects.filter(function(o) { return o.folder === f; }).length;
          return (
            <FolderPill key={f} name={f} count={count} active={activeFolder===f}
              onClick={function() { onFolderChange(f); }}
              onRename={function(old, nw) { onFolderRename('objects', old, nw); }}
              onDelete={function(n) { onFolderDelete('objects', n); }}/>
          );
        })}
        <button className="folder-pill folder-pill-add"
          onClick={function() {
            const name = prompt('New folder name:');
            if (name && name.trim()) onFolderCreate(name.trim());
          }}>+</button>
      </div>

      <div className="search-wrap">
        <input className="search-input" type="text" placeholder={'Search ' + objects.length + ' objects…'}
          value={query} onChange={function(e) { setQuery(e.target.value); }}/>
        <select className="sort-select" value={sortOrder}
          onChange={function(e) { setSortOrder(e.target.value); }}>
          <option value="newest">Newest first</option>
          <option value="nameAsc">Name A→Z</option>
          <option value="nameDesc">Name Z→A</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>{query ? 'No objects match.' : 'No objects yet.'}</p>
          <p>Tap + to create a motif object, or ask Claude-Kevin to generate one from an image.</p>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map(function(o) {
            const isSelected = selected && selected.id === o.id;
            return (
              <div key={o.id}
                className={'card object-card' + (isSelected ? ' card-selected' : '')}
                onClick={function() { select(o); }}>
                {o.folder && <div className="card-folder-tag">{o.folder}</div>}
                <div className="card-select-ring">
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <ObjectPreview pattern={o.pattern} layers={o.layers} size={120}/>
                <div className="card-title">{o.name}</div>
                <div className="card-sub">
                  {o.width}x{o.height} stitches
                  {o.layers && o.layers.length > 1 && <span> · {o.layers.length} layers</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
    {selected && (
      <div className="sel-toolbar">
          <div className="sel-toolbar-inner">
            <div className="sel-toolbar-label">
              <div className="sel-toolbar-info">
                <div className="sel-toolbar-name">{selected.name}</div>
                <div className="sel-toolbar-sub">
                  {selected.width}x{selected.height} stitches
                  {selected.layers && selected.layers.length > 1 ? ' · '+selected.layers.length+' layers' : ''}
                  {selected.folder ? ' · '+selected.folder : ''}
                </div>
              </div>
              <button className="sel-toolbar-close" onClick={deselect}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="sel-toolbar-actions">
              <button className="sel-btn sel-btn-primary"
                onClick={function() { onEdit(selected); deselect(); }}>
                <Ico.Edit/> Edit
              </button>

              <div style={{position:'relative'}}>
                <button className="sel-btn"
                  onClick={function() { setFolderOpen(function(v){return !v;}); }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  Folder
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {folderOpen && (
                  <div className="sel-dropdown">
                    <button className={'sel-dropdown-item'+((!selected.folder)?' sel-dropdown-active':'')}
                      onClick={function() { onMoveToFolder('object', selected.id, null); setFolderOpen(false); }}>
                      No folder
                    </button>
                    {(folders||[]).map(function(f) {
                      return (
                        <button key={f}
                          className={'sel-dropdown-item'+(selected.folder===f?' sel-dropdown-active':'')}
                          onClick={function() { onMoveToFolder('object', selected.id, f); setFolderOpen(false); }}>
                          {f}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{flex:1}}/>

              <button className="sel-btn sel-btn-danger"
                onClick={function() { onDelete(selected); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   OBJECT PREVIEW (card thumbnail)
═══════════════════════════════════════════════════════════════════ */
function ObjectPreview({ pattern, layers, size }) {
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
