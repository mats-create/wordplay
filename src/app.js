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
  const [kevinMessages, setKevinMessages] = useState(null);
  const [tmCache,     setTmCache]     = useState({});
  const [shoutoutFolders, setShoutoutFolders] = useState([]);
  const [borderFolders,   setBorderFolders]   = useState([]);
  const [activeShoutoutFolder, setActiveShoutoutFolder] = useState(null);
  const [activeBorderFolder,   setActiveBorderFolder]   = useState(null);
  const fb = window.__firebase;

  // Kevin context — what Kevin knows about the current state
  const kevinContext = useMemo(function() {
    return {
      tab,
      shoutoutCount: shoutouts.length,
      shoutoutNames: shoutouts.map(function(s) { return s.name; }).join(', ') || 'none',
      borderNames: borders.map(function(b) { return b.name; }).join(', ') || 'none',
      shoutoutFolders: shoutoutFolders.join(', ') || 'none',
      borderFolders: borderFolders.join(', ') || 'none',
    };
  }, [tab, shoutouts, borders, shoutoutFolders, borderFolders]);

  // ── Auth ──
  useEffect(function(){
    const unsub = fb.onAuthStateChanged(fb.auth, function(u) {
      setAuthUser(u||null);
      if (u) {
        loadKevinKeyFromFirestore(u.uid);
        loadFolders(u.uid);
      } else {
        setKevinApiKey('');
        setShoutoutFolders([]); setBorderFolders([]);
      }
    });
    return function(){ unsub(); };
  },[]);

  // ── Folders — load/save ──
  async function loadFolders(uid) {
    try {
      const snap = await fb.getDoc(fb.doc(fb.db,'users',uid,'settings','folders'));
      if (snap.exists()) {
        const d = snap.data();
        setShoutoutFolders(d.shoutoutFolders || []);
        setBorderFolders(d.borderFolders || []);
      }
    } catch(e) { console.warn('Folder load failed:', e); }
  }

  async function saveFolders(uid, sf, bf) {
    try {
      await fb.setDoc(fb.doc(fb.db,'users',uid,'settings','folders'),
        { shoutoutFolders: sf, borderFolders: bf });
    } catch(e) { console.warn('Folder save failed:', e); }
  }

  function handleFolderCreate(type, name) {
    if (type === 'shoutouts') {
      if (shoutoutFolders.includes(name)) return;
      const next = [...shoutoutFolders, name];
      setShoutoutFolders(next);
      saveFolders(authUser.uid, next, borderFolders);
    } else {
      if (borderFolders.includes(name)) return;
      const next = [...borderFolders, name];
      setBorderFolders(next);
      saveFolders(authUser.uid, shoutoutFolders, next);
    }
  }

  async function handleFolderRename(type, oldName, newName) {
    if (type === 'shoutouts') {
      const next = shoutoutFolders.map(function(f) { return f === oldName ? newName : f; });
      setShoutoutFolders(next);
      saveFolders(authUser.uid, next, borderFolders);
      if (activeShoutoutFolder === oldName) setActiveShoutoutFolder(newName);
      // Update all shoutouts in that folder
      const batch = shoutouts.filter(function(s) { return s.folder === oldName; });
      for (const s of batch) {
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'shoutouts',s.id), { folder: newName });
      }
    } else {
      const next = borderFolders.map(function(f) { return f === oldName ? newName : f; });
      setBorderFolders(next);
      saveFolders(authUser.uid, shoutoutFolders, next);
      if (activeBorderFolder === oldName) setActiveBorderFolder(newName);
      const batch = borders.filter(function(b) { return b.folder === oldName; });
      for (const b of batch) {
        await fb.updateDoc(fb.doc(fb.db,'borders',b.id), { folder: newName });
      }
    }
  }

  async function handleFolderDelete(type, name) {
    if (type === 'shoutouts') {
      const next = shoutoutFolders.filter(function(f) { return f !== name; });
      setShoutoutFolders(next);
      saveFolders(authUser.uid, next, borderFolders);
      if (activeShoutoutFolder === name) setActiveShoutoutFolder(null);
      // Unfile all shoutouts in that folder
      const batch = shoutouts.filter(function(s) { return s.folder === name; });
      for (const s of batch) {
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'shoutouts',s.id), { folder: null });
      }
    } else {
      const next = borderFolders.filter(function(f) { return f !== name; });
      setBorderFolders(next);
      saveFolders(authUser.uid, shoutoutFolders, next);
      if (activeBorderFolder === name) setActiveBorderFolder(null);
      const batch = borders.filter(function(b) { return b.folder === name; });
      for (const b of batch) {
        await fb.updateDoc(fb.doc(fb.db,'borders',b.id), { folder: null });
      }
    }
  }

  async function handleMoveToFolder(type, itemId, folder) {
    try {
      if (type === 'shoutout') {
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'shoutouts',itemId), { folder: folder || null });
      } else {
        await fb.updateDoc(fb.doc(fb.db,'borders',itemId), { folder: folder || null });
      }
      showToast(folder ? 'Moved to ' + folder : 'Removed from folder');
    } catch(e) { showToast('Move failed — try again'); }
  }

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

  const kevinMobileActive = tab === 'kevin';

  return (
    <div className="app-layout">

      {/* ── Left column ── */}
      <div className="app-main">

        {/* TopBar — contains nav on desktop */}
        <TopBar user={authUser} onSignOut={handleSignOut}
          tab={tab} onTabChange={setTab}
          kevinVisible={kevinVisible}
          onToggleKevin={function() { setKevinVisible(function(v) { return !v; }); }}
          tmCache={tmCache}/>

        {/* Scrollable content */}
        <div className="screen-wrap">
          {tab === 'shoutouts' && (
            <ShoutoutsScreen shoutouts={shoutouts} borders={borders}
              tmCache={tmCache}
              onSelect={function(s) { setSelShoutout(s); }}
              folders={shoutoutFolders}
              activeFolder={activeShoutoutFolder}
              onFolderChange={setActiveShoutoutFolder}
              onFolderCreate={handleFolderCreate}
              onFolderRename={handleFolderRename}
              onFolderDelete={handleFolderDelete}/>
          )}
          {tab === 'borders' && (
            <BordersScreen borders={borders}
              onSelect={function(b) { setSelBorder(b); }}
              folders={borderFolders}
              activeFolder={activeBorderFolder}
              onFolderChange={setActiveBorderFolder}
              onFolderCreate={handleFolderCreate}
              onFolderRename={handleFolderRename}
              onFolderDelete={handleFolderDelete}/>
          )}
        </div>

        {/* Bottom nav — mobile only */}
        <nav className="bottom-nav">
          <button className={'nav-tab' + (tab==='shoutouts' ? ' active' : '')}
            onClick={function() { setTab('shoutouts'); }}>
            <Ico.Shout/>
            <span className="nav-tab-label">Shoutouts</span>
          </button>
          <button className={'nav-tab' + (tab==='borders' ? ' active' : '')}
            onClick={function() { setTab('borders'); }}>
            <Ico.Border/>
            <span className="nav-tab-label">Borders</span>
          </button>
          <button className={'nav-tab nav-tab-kevin' + (kevinMobileActive ? ' active' : '')}
            style={{position:'relative'}}
            onClick={function() {
              if (kevinMobileActive) { setTab('shoutouts'); setKevinVisible(false); }
              else { setTab('kevin'); setKevinVisible(true); }
            }}>
            <span className="nav-kevin-icon">CK</span>
            <span className="nav-tab-label">Kevin</span>
            {Object.values(tmCache).some(function(r) { return r && r.risk !== 'none'; }) && (
              <div className="kevin-badge-nav"/>
            )}
          </button>
          {!kevinMobileActive && (
            <button className="fab-mobile"
              title={tab==='shoutouts' ? 'New shoutout' : 'New border'}
              onClick={function() {
                tab === 'shoutouts' ? setEditShoutout('new') : setEditBorder('new');
              }}>
              <Ico.Plus/>
            </button>
          )}
        </nav>

        {/* FAB — desktop only, fixed bottom-right of content area */}
        {!kevinMobileActive && (
          <button className="fab"
            title={tab==='shoutouts' ? 'New shoutout' : 'New border'}
            onClick={function() {
              tab === 'shoutouts' ? setEditShoutout('new') : setEditBorder('new');
            }}>
            <Ico.Plus/>
          </button>
        )}
      </div>

      {/* ── Right column: Kevin panel ── */}
      <div className={'kevin-backdrop' + (kevinMobileActive ? ' visible' : '')}
        onClick={function() { setTab('shoutouts'); setKevinVisible(false); }}/>

      <div className={'app-kevin'
        + (kevinVisible ? ' kevin-visible' : '')
        + (kevinMobileActive ? ' kevin-mobile-active' : '')}>
        <KevinChat
          context={kevinContext}
          uid={authUser.uid}
          appData={{ shoutouts, borders, fb: window.__firebase, uid: authUser.uid }}
          messages={kevinMessages}
          setMessages={setKevinMessages}
          onClose={function() {
            setKevinVisible(false);
            if (kevinMobileActive) setTab('shoutouts');
          }}
        />
      </div>

      {/* ── Modals ── */}
      {selShoutout && !editShoutout && (
        <ShoutoutDetail shoutout={selShoutout}
          onClose={function() { setSelShoutout(null); }}
          onEdit={function() { setEditShoutout(selShoutout); }}
          onDelete={function() { setConfirmDel({type:'shoutout',id:selShoutout.id}); }}
          folders={shoutoutFolders}
          onMoveToFolder={function(folder) { handleMoveToFolder('shoutout', selShoutout.id, folder); }}/>
      )}
      {editShoutout && (
        <ShoutoutForm
          initial={editShoutout==='new' ? null : editShoutout}
          borders={borders}
          onSave={saveShoutout}
          onClose={function() { setEditShoutout(null); }}
          saving={saving}/>
      )}
      {selBorder && !editBorder && (
        <BorderDetail border={selBorder}
          onClose={function() { setSelBorder(null); }}
          onEdit={function() { setEditBorder(selBorder); }}
          onDelete={function() { setConfirmDel({type:'border',id:selBorder.id}); }}
          folders={borderFolders}
          onMoveToFolder={function(folder) { handleMoveToFolder('border', selBorder.id, folder); }}/>
      )}
      {editBorder && (
        <BorderForm
          initial={editBorder==='new' ? null : editBorder}
          onSave={saveBorder}
          onClose={function() { setEditBorder(null); }}
          saving={saving}/>
      )}
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