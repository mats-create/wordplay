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
   THREDITOR — shared thread palette component
   Props:
     threads        — array of thread objects
     threadLengths  — array of {cm} objects (indexed by slot)
     onChange(i, t) — called on colour/name/dmc change; null = readonly
     onRemove(i)    — called on remove; null = readonly
═══════════════════════════════════════════════════════════════════ */
function Threditor({ threads, threadLengths, onChange, onRemove }) {
  const [pickerIndex, setPickerIndex] = useState(null);
  const editable = typeof onChange === 'function';

  return (
    <div className="threditor">
      {threads.map(function(t, i) {
        const slot = THREAD_SLOTS[i] || null;
        const lengthEntry = threadLengths && threadLengths[i];
        const cm = lengthEntry ? lengthEntry.cm : null;
        const isLight = t.hex === '#FFFFFF' || t.hex === '#FFFFF0' || t.hex === '#FFF8B0' || t.hex === '#F5F5F5';

        return (
          <div key={t.id || i} className="threditor-slot">
            <button
              className={'threditor-swatch' + (editable ? ' threditor-swatch-btn' : '')}
              style={{
                background: t.hex,
                border: isLight ? '1.5px solid var(--lgrey)' : '1.5px solid transparent',
                cursor: editable ? 'pointer' : 'default'
              }}
              onClick={editable ? function() { setPickerIndex(i); } : undefined}
              title={editable ? 'Pick DMC colour' : t.name}
              disabled={!editable}
            />
            <div className="threditor-info">
              {slot && (
                <div className="threditor-slot-label">
                  <span className="threditor-slot-name">{slot.label}</span>
                  <span className="threditor-slot-hint">{slot.hint}</span>
                </div>
              )}
              <div className="threditor-colour-name">{t.name || <span className="threditor-empty">No name</span>}</div>
              <div className="threditor-dmc">{t.dmc || <span className="threditor-empty">No DMC code</span>}</div>
            </div>
            <div className="threditor-right">
              {cm != null && <div className="threditor-length">{'~' + cm + ' cm'}</div>}
              {editable && (
                <button className="thread-remove" onClick={function() { onRemove(i); }} title="Remove thread">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        );
      })}

      {pickerIndex !== null && (
        <DmcPickerSheet
          currentHex={threads[pickerIndex] ? threads[pickerIndex].hex : '#000000'}
          onSelect={function(c) {
            const t = threads[pickerIndex];
            onChange(pickerIndex, {...t, hex: c.hex, dmc: 'DMC ' + c.dmc, name: t.name || c.name});
          }}
          onClose={function() { setPickerIndex(null); }}
        />
      )}
    </div>
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

