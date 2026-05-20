/* ═══════════════════════════════════════════════════════════════════
   KEVIN CHAT PANEL
═══════════════════════════════════════════════════════════════════ */
const KEVIN_SUGGESTIONS = {
  shoutouts: [
    "Suggest new shoutouts",
    "How do thread colours work in the designs?",
    "Any trademark risks I should know about?",
    "What's a Worldie?",
  ],
  borders: [
    "Tell me about Scandinavian embroidery",
    "What is Hardanger?",
    "Describe a Nordic border I could add",
    "How do thread colours work in the designs?",
  ],
};

function KevinChat({ onClose, context, uid, appData, messages: extMessages, setMessages: setExtMessages }) {
  // Use lifted messages from App — persists across open/close
  // extMessages=null means not yet initialised
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [keyInput, setKeyInput] = useState(getKevinApiKey());
  const [showKey,  setShowKey]  = useState(false);
  const [keySaved, setKeySaved] = useState(hasKevinApiKey());
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // Local alias — always use extMessages via setExtMessages
  const messages = extMessages || [];
  function setMessages(valOrFn) {
    if (typeof valOrFn === 'function') {
      setExtMessages(function(prev) { return valOrFn(prev || []); });
    } else {
      setExtMessages(valOrFn);
    }
  }

  // Scroll to bottom
  useEffect(function() {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Welcome — only on first ever open (extMessages === null)
  useEffect(function() {
    if (extMessages !== null) return; // already has history
    if (!hasKevinApiKey() && !keySaved) {
      setMessages([{ role: 'kevin', text: "Add your Anthropic API key below to get started. You only need to do this once." }]);
      return;
    }
    const count = context.shoutoutCount;
    const welcome = count === 0
      ? "Right then. Library's empty — let's fix that. Tell me what you're after: a shoutout word, a football moment, a language. I'll sort the rest."
      : count + ' shoutout' + (count > 1 ? 's' : '') + ' in. What are we working on — new words, border ideas, or something else?';
    setMessages([{ role: 'kevin', text: welcome }]);
  }, []);

  function newConversation() {
    const count = context.shoutoutCount;
    const welcome = count === 0
      ? "Fresh start. What are we making?"
      : "New conversation. " + count + " shoutout" + (count > 1 ? 's' : '') + " in the library. What's next?";
    setMessages([{ role: 'kevin', text: welcome }]);
  }

  async function handleSaveKey() {
    if (!keyInput.trim()) return;
    await saveKevinKeyToFirestore(uid, keyInput.trim());
    setKeySaved(true);
    setMessages([{ role: 'kevin', text: "Key saved. Right then — what are we working on?" }]);
  }

  async function send(text) {
    if (!text.trim() || loading || !hasKevinApiKey()) return;
    const userMsg = { role: 'user', text: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const reply = await askKevin(next, context, appData);
      setMessages(function(prev) { return [...prev, { role: 'kevin', text: reply }]; });
    } catch(e) {
      setMessages(function(prev) { return [...prev, { role: 'kevin', text: "Error: " + e.message }]; });
    } finally { setLoading(false); }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  const suggestions = KEVIN_SUGGESTIONS[context.tab] || KEVIN_SUGGESTIONS.shoutouts;
  const hasKey = keySaved || hasKevinApiKey();

  return (
    <div className="kevin-panel">
        {/* Header */}
        <div className="kevin-header">
          <div className="kevin-avatar">CK</div>
          <div className="kevin-header-info">
            <div className="kevin-header-name">Claude-Kevin</div>
            <div className="kevin-header-sub">
              <span className="kevin-status-dot"/>
              Embroidery specialist · Football expert
            </div>
          </div>
          <button className="btn btn-ghost" style={{fontSize:11,padding:'4px 8px',color:'var(--grey)'}}
            onClick={newConversation} title="Start new conversation">
            New chat
          </button>
          {/* Hide button — desktop only */}
          <button className="btn-icon kevin-hide-btn" onClick={onClose} title="Hide Kevin">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="kevin-messages">
          {messages.map(function(m, i) {
            const isKevin = m.role === 'kevin';
            return (
              <div key={i} className={'msg ' + (isKevin ? 'msg-kevin' : 'msg-user')}>
                <div className={'msg-avatar ' + (isKevin ? 'msg-avatar-kevin' : 'msg-avatar-user')}>
                  {isKevin ? 'CK' : 'M'}
                </div>
                <div className={'msg-bubble ' + (isKevin ? 'msg-bubble-kevin' : 'msg-bubble-user')}>
                  {isKevin
                    ? <div dangerouslySetInnerHTML={{__html: (typeof marked !== 'undefined' ? marked.parse(m.text) : m.text)}}/>
                    : m.text
                  }
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="msg msg-kevin">
              <div className="msg-avatar msg-avatar-kevin">CK</div>
              <div className="kevin-typing"><span/><span/><span/></div>
            </div>
          )}
          <div ref={messagesEndRef}/>
        </div>

        {/* Suggestion chips — only when key set and no conversation yet */}
        {hasKey && messages.length <= 1 && !loading && (
          <div className="kevin-suggestions">
            {suggestions.map(function(s) {
              return (
                <button key={s} className="kevin-chip" onClick={function() { send(s); }}>
                  {s}
                </button>
              );
            })}
          </div>
        )}

        {/* API key input — shown when no key set */}
        {!hasKey && (
          <div style={{padding:'12px 16px', borderTop:'1px solid var(--offwht)'}}>
            <div style={{fontSize:12, color:'var(--grey)', marginBottom:8}}>
              Anthropic API key — saved to your account, never stored in code.{' '}
              <a href="https://console.anthropic.com" target="_blank"
                style={{color:'var(--coral)'}}>Get one here →</a>
            </div>
            <div style={{display:'flex', gap:8}}>
              <input
                type={showKey ? 'text' : 'password'}
                className="kevin-input"
                placeholder="sk-ant-..."
                value={keyInput}
                onChange={function(e) { setKeyInput(e.target.value); }}
                style={{borderRadius:'var(--radius-sm)'}}
              />
              <button className="btn btn-outlined" style={{flexShrink:0, fontSize:12, padding:'0 10px'}}
                onClick={function() { setShowKey(function(v) { return !v; }); }}>
                {showKey ? 'Hide' : 'Show'}
              </button>
              <button className="btn btn-coral" style={{flexShrink:0, fontSize:12, padding:'0 14px'}}
                onClick={handleSaveKey} disabled={!keyInput.trim()}>
                Save
              </button>
            </div>
          </div>
        )}

        {/* Input — only when key is set */}
        {hasKey && (
          <div className="kevin-input-row">
            <textarea
              ref={inputRef}
              className="kevin-input"
              placeholder="Ask Claude-Kevin…"
              value={input}
              onChange={function(e) { setInput(e.target.value); }}
              onKeyDown={handleKey}
              rows={1}
            />
            <button className="kevin-send" onClick={function() { send(input); }}
              disabled={!input.trim() || loading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TRADEMARK NOTICE COMPONENT
═══════════════════════════════════════════════════════════════════ */
function TrademarkNotice({ result }) {
  if (!result || result.risk === 'none') return null;
  const colours = { low: '#F59E0B', medium: '#CC3300', high: '#CC3300' };
  const labels  = { low: 'Low risk', medium: 'Worth checking', high: 'Likely protected' };
  return (
    <div className="trademark-notice">
      <span className="trademark-notice-icon">⚠</span>
      <div>
        <strong style={{color: colours[result.risk] || 'var(--coral)'}}>{labels[result.risk] || 'Check this'}: </strong>
        {result.reason}
        {result.suggestion && <span style={{color:'var(--grey)'}}> Try: <em>{result.suggestion}</em></span>}
      </div>
    </div>
  );
}

