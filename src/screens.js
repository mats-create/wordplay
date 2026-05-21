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
                <div className="card-badge">{s.borderName||'No border'}</div>
                {s.folder && <div className="card-folder-tag">{s.folder}</div>}
                <CrossStitchCanvas word={s.name}
                  cols={s.stitchesW} rows={s.stitchesH}
                  borderStyle={s.borderSpec||s.borderStyle||'british'}
                  threads={s.threads} size={220}
                  className="canvas-thumb"/>
                <div className="card-title">{s.name}</div>
                <div className="card-sub">
                  {s.stitchesW}×{s.stitchesH} stitches · {s.hoopW}×{s.hoopH}mm
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
                <CrossStitchCanvas word="ABC" cols={60} rows={60}
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
   MAIN APP
═══════════════════════════════════════════════════════════════════ */
