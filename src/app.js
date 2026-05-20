function App() {
  const [authUser,    setAuthUser]    = useState(undefined);
  const [authError,   setAuthError]   = useState(null);
  const [tab,         setTab]         = useState('shoutouts');
  const [shoutouts,   setShoutouts]   = useState([]);
  const [borders,     setBorders]     = useState([]);
  const [selShoutout, setSelShoutout] = useState(null);
  const [selBorder,   setSelBorder]   = useState(null);
  const [editShoutout,setEditShoutout]= useState(null);
  const [editBorder,  setEditBorder]  = useState(null);
  const [confirmDel,  setConfirmDel]  = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [toast,       showToast]      = useToast();
  const [kevinVisible, setKevinVisible] = useState(function() { return window.innerWidth >= 768; });
  const [kevinMessages, setKevinMessages] = useState(null); // null = not yet initialised
  const [tmCache,     setTmCache]     = useState({});
  const fb = window.__firebase;

  // Kevin context — what Kevin knows about the current state
  const kevinContext = useMemo(function() {
    return {
      tab,
      shoutoutCount: shoutouts.length,
      shoutoutNames: shoutouts.map(function(s) { return s.name; }).join(', ') || 'none',
      borderNames: borders.map(function(b) { return b.name; }).join(', ') || 'none',
    };
  }, [tab, shoutouts, borders]);

  // ── Auth ──
  useEffect(function(){
    const unsub = fb.onAuthStateChanged(fb.auth, function(u) {
      setAuthUser(u||null);
      if (u) loadKevinKeyFromFirestore(u.uid);
      else setKevinApiKey('');
    });
    return function(){ unsub(); };
  },[]);

  // ── Seed built-in borders once ──
  async function seedBorders() {
    try {
      const snap = await fb.getDocs(fb.collection(fb.db,'borders'));
      const existing = {};
      snap.docs.forEach(function(d) { existing[d.id] = d.data(); });
      for (const b of BUILTIN_BORDERS) {
        const spec = BORDER_SPECS[b.style] || null;
        if (!existing[b.id]) {
          // New — create
          await fb.setDoc(fb.doc(fb.db,'borders',b.id), {
            name:b.name, style:b.style, description:b.description,
            traits:b.traits, builtIn:true, createdBy:null,
            spec: spec, createdAt: fb.serverTimestamp()
          });
        } else if (!existing[b.id].spec) {
          // Exists but missing spec — update
          await fb.updateDoc(fb.doc(fb.db,'borders',b.id), { spec: spec });
        }
      }
    } catch(e) { console.warn('Border seed failed:', e); }
  }

  // ── Borders listener (shared collection) ──
  useEffect(()=>{
    if (!authUser) { setBorders([]); return; }
    seedBorders();
    const q = fb.query(fb.collection(fb.db,'borders'), fb.orderBy('createdAt','asc'));
    const unsub = fb.onSnapshot(q, snap=>{
      setBorders(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return ()=>unsub();
  },[authUser]);

  // ── Shoutouts listener (per-user) ──
  useEffect(()=>{
    if (!authUser) { setShoutouts([]); return; }
    const q = fb.query(
      fb.collection(fb.db,'users',authUser.uid,'shoutouts'),
      fb.orderBy('createdAt','desc')
    );
    const unsub = fb.onSnapshot(q, snap=>{
      setShoutouts(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return ()=>unsub();
  },[authUser]);

  // ── Sign in/out ──
  async function handleSignIn() {
    setAuthError(null);
    try {
      await fb.signInWithPopup(fb.auth, new fb.GoogleAuthProvider());
    } catch(e) { setAuthError('Sign-in failed. Please try again.'); }
  }
  async function handleSignOut() { await fb.signOut(fb.auth); }

  // ── Save shoutout ──
  async function saveShoutout(data) {
    setSaving(true);
    try {
      const border = borders.find(function(b) { return b.id === data.borderId; });
      const borderSpec = (border && border.spec) ? border.spec
                       : (BORDER_SPECS[border && border.style] || null);
      const fullData = {
        ...data,
        borderStyle: border ? border.style : 'british',
        borderSpec:  borderSpec,
      };
      if (editShoutout && editShoutout !== 'new') {
        await fb.updateDoc(
          fb.doc(fb.db,'users',authUser.uid,'shoutouts',editShoutout.id),
          {...fullData, updatedAt: fb.serverTimestamp()}
        );
        showToast('Shoutout updated');
      } else {
        await fb.addDoc(
          fb.collection(fb.db,'users',authUser.uid,'shoutouts'),
          {...fullData, createdAt: fb.serverTimestamp(), updatedAt: fb.serverTimestamp()}
        );
        showToast('Shoutout created');
      }
      setEditShoutout(null); setSelShoutout(null);
      const word = data.name;
      if (word && !tmCache[word]) {
        checkTrademark(word, kevinContext).then(function(result) {
          if (result) setTmCache(function(prev) { return {...prev, [word]: result}; });
        }).catch(function() {});
      }
    } catch(e) { showToast('Something went wrong — try again'); }
    finally { setSaving(false); }
  }

  // ── Save border ──
  async function saveBorder(data) {
    setSaving(true);
    try {
      // If no spec provided but style matches a built-in, use that spec
      const spec = data.spec || BORDER_SPECS[data.style] || null;
      const fullData = { ...data, spec };
      if (editBorder && editBorder !== 'new') {
        await fb.updateDoc(
          fb.doc(fb.db,'borders',editBorder.id),
          {...fullData, updatedAt: fb.serverTimestamp()}
        );
        showToast('Border updated');
      } else {
        await fb.addDoc(fb.collection(fb.db,'borders'), {
          ...fullData, builtIn: false, createdBy: authUser.uid,
          createdAt: fb.serverTimestamp(), updatedAt: fb.serverTimestamp()
        });
        showToast('Border created');
      }
      setEditBorder(null); setSelBorder(null);
    } catch(e) { showToast('Something went wrong — try again'); }
    finally { setSaving(false); }
  }

  // ── Delete ──
  async function handleDelete() {
    if (!confirmDel) return;
    try {
      if (confirmDel.type==='shoutout') {
        await fb.deleteDoc(fb.doc(fb.db,'users',authUser.uid,'shoutouts',confirmDel.id));
        showToast('Shoutout deleted'); setSelShoutout(null);
      } else {
        await fb.deleteDoc(fb.doc(fb.db,'borders',confirmDel.id));
        showToast('Border deleted'); setSelBorder(null);
      }
      setConfirmDel(null);
    } catch(e) { showToast('Delete failed — try again'); }
  }

  // ── Loading ──
  if (authUser===undefined) return (
    <div className="loading-screen">
      <div className="spinner"/>
      <div className="loading-text">Loading Wordplay…</div>
    </div>
  );

  if (!authUser) return <SignInScreen onSignIn={handleSignIn} error={authError}/>;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="app-layout">

      {/* ── Main column ── */}
      <div className={'app-main' + (kevinVisible && !isMobile ? ' panel-open' : '')}>
        <TopBar user={authUser} onSignOut={handleSignOut}
          kevinVisible={kevinVisible}
          onToggleKevin={function() { setKevinVisible(function(v) { return !v; }); }}/>

        {/* Screens — hidden on mobile when Kevin tab is active */}
        <div className={tab === 'kevin' ? 'screen-hidden' : 'screen-wrapper'}>
          {tab==='shoutouts' && (
            <ShoutoutsScreen shoutouts={shoutouts} borders={borders}
              tmCache={tmCache}
              onSelect={function(s) { setSelShoutout(s); }}/>
          )}
          {tab==='borders' && (
            <BordersScreen borders={borders} onSelect={function(b) { setSelBorder(b); }}/>
          )}
        </div>

        {/* Bottom nav */}
        <nav className="bottom-nav">
          <button className={'nav-tab'+(tab==='shoutouts'?' active':'')}
            onClick={function() { setTab('shoutouts'); }}>
            <Ico.Shout/>
            <span className="nav-tab-label">Shoutouts</span>
          </button>
          <button className={'nav-tab'+(tab==='borders'?' active':'')}
            onClick={function() { setTab('borders'); }}>
            <Ico.Border/>
            <span className="nav-tab-label">Borders</span>
          </button>
          {/* Kevin tab — mobile only */}
          <button className={'nav-tab nav-tab-kevin'+(tab==='kevin'?' active':'')}
            onClick={function() { setTab('kevin'); setKevinVisible(true); }}>
            <span className="nav-kevin-icon">CK</span>
            <span className="nav-tab-label">Kevin</span>
            {Object.values(tmCache).some(function(r) { return r && r.risk !== 'none'; }) && (
              <div className="kevin-badge kevin-badge-nav"/>
            )}
          </button>
        </nav>

        {/* FAB — hide on Kevin tab */}
        {tab !== 'kevin' && (
          <button className="fab" title={tab==='shoutouts'?'New shoutout':'New border'}
            onClick={function() { tab==='shoutouts' ? setEditShoutout('new') : setEditBorder('new'); }}>
            <Ico.Plus/>
          </button>
        )}
      </div>

      {/* ── Kevin panel column ── */}
      <div className={'app-kevin' + (kevinVisible ? ' kevin-visible' : '') + (tab === 'kevin' ? ' kevin-mobile-active' : '')}>
        <KevinChat
          context={kevinContext}
          uid={authUser.uid}
          appData={{ shoutouts, borders, fb: window.__firebase, uid: authUser.uid }}
          messages={kevinMessages}
          setMessages={setKevinMessages}
          onClose={function() { setKevinVisible(false); if (tab === 'kevin') setTab('shoutouts'); }}
          kevinVisible={kevinVisible}
          onToggle={function() { setKevinVisible(function(v) { return !v; }); }}
        />
      </div>

      {/* Shoutout detail */}
      {selShoutout && !editShoutout && (
        <ShoutoutDetail shoutout={selShoutout}
          onClose={function() { setSelShoutout(null); }}
          onEdit={function() { setEditShoutout(selShoutout); }}
          onDelete={function() { setConfirmDel({type:'shoutout',id:selShoutout.id}); }}/>
      )}

      {/* Shoutout form */}
      {editShoutout && (
        <ShoutoutForm
          initial={editShoutout==='new'?null:editShoutout}
          borders={borders}
          onSave={saveShoutout}
          onClose={function() { setEditShoutout(null); }}
          saving={saving}/>
      )}

      {/* Border detail */}
      {selBorder && !editBorder && (
        <BorderDetail border={selBorder}
          onClose={function() { setSelBorder(null); }}
          onEdit={function() { setEditBorder(selBorder); }}
          onDelete={function() { setConfirmDel({type:'border',id:selBorder.id}); }}/>
      )}

      {/* Border form */}
      {editBorder && (
        <BorderForm
          initial={editBorder==='new'?null:editBorder}
          onSave={saveBorder}
          onClose={function() { setEditBorder(null); }}
          saving={saving}/>
      )}

      {/* Confirm delete */}
      {confirmDel && (
        <ConfirmDialog
          title={'Delete ' + confirmDel.type}
          message="This cannot be undone."
          onConfirm={handleDelete}
          onCancel={function() { setConfirmDel(null); }}/>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
</script>
