function ShoutoutsScreen({ shoutouts, borders, tmCache, onSelect }) {
  return (
    <div className="screen">
      <div className="screen-header">
        <span className="screen-title">Football shoutouts</span>
        <span className="screen-count">{shoutouts.length} {shoutouts.length===1?'shoutout':'shoutouts'}</span>
      </div>
      {shoutouts.length===0 ? (
        <div className="empty">
          <span className="empty-icon">🧵</span>
          <h3>No shoutouts yet</h3>
          <p>Tap + to create your first football shoutout, or ask Claude-Kevin for ideas.</p>
        </div>
      ) : (
        <div className="card-grid">
          {shoutouts.map(function(s) {
            const tm = tmCache && tmCache[s.name];
            return (
              <div key={s.id} className="card" onClick={function() { onSelect(s); }}>
                <div className="card-badge">{s.borderName||'No border'}</div>
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
function BordersScreen({ borders, onSelect }) {
  return (
    <div className="screen">
      <div className="screen-header">
        <span className="screen-title">Border library</span>
        <span className="screen-count">{borders.length} {borders.length===1?'border':'borders'}</span>
      </div>
      {borders.length===0 ? (
        <div className="empty">
          <span className="empty-icon">🪡</span>
          <h3>No borders yet</h3>
          <p>Tap + to add a custom border style.</p>
        </div>
      ) : (
        <div className="card-grid">
          {borders.map(b=>(
            <div key={b.id} className="card" onClick={()=>onSelect(b)}>
              {b.builtIn && <div className="card-badge">Built-in</div>}
              <CrossStitchCanvas word="ABC" cols={60} rows={60}
                borderStyle={b.style} threads={DEFAULT_THREADS} size={220}
                className="canvas-thumb"/>
              <div className="card-title">{b.name}</div>
              {b.description && (
                <div className="card-desc">{b.description.slice(0,90)}{b.description.length>90?'…':''}</div>
              )}
              {b.traits&&b.traits.length>0 && (
                <div className="card-traits">
                  {b.traits.slice(0,4).map(t=><span key={t} className="trait-chip">{t}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════════ */
