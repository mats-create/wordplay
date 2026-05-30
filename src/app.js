function App() {
  const [authUser,    setAuthUser]    = useState(undefined);
  const [authError,   setAuthError]   = useState(null);
  const [tab,         setTab]         = useState('shoutouts');
  const [shoutouts,   setShoutouts]   = useState([]);
  const [borders,     setBorders]     = useState([]);
  const [aidaShoutout, setAidaShoutout] = useState(null);
  const [editBorder,  setEditBorder]  = useState(null);
  const [confirmDel,  setConfirmDel]  = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [toast,       showToast]      = useToast();
  const [kevinVisible, setKevinVisible] = useState(function() { return window.innerWidth >= 768; });
  const [kevinMessages, setKevinMessages] = useState(null);
  const [tmCache,     setTmCache]     = useState({});
  const [shoutoutFolders, setShoutoutFolders] = useState([]);
  const [borderFolders,   setBorderFolders]   = useState([]);
  const [objectFolders,   setObjectFolders]   = useState([]);
  const [activeShoutoutFolder, setActiveShoutoutFolder] = useState(null);
  const [activeBorderFolder,   setActiveBorderFolder]   = useState(null);
  const [activeObjectFolder,   setActiveObjectFolder]   = useState(null);
  const [objects,       setObjects]       = useState([]);
  const [editObject,    setEditObject]    = useState(null);
  const [composeShoutout, setComposeShoutout] = useState(null);
  const [composeContext,  setComposeContext]  = useState(null);
  const fb = window.__firebase;

  // Kevin context — what Kevin knows about the current state
  const kevinContext = useMemo(function() {
    return {
      tab: composeShoutout ? 'compose' : tab,
      shoutoutCount: shoutouts.length,
      shoutoutNames: shoutouts.map(function(s) { return s.designName || s.name; }).join(', ') || 'none',
      borderNames: borders.map(function(b) { return b.name; }).join(', ') || 'none',
      shoutoutFolders: shoutoutFolders.join(', ') || 'none',
      borderFolders: borderFolders.join(', ') || 'none',
      objectFolders: objectFolders.join(', ') || 'none',
      objectCount: objects.length,
      objectNames: objects.map(function(o) { return o.name; }).join(', ') || 'none',
      compose: composeContext,
    };
  }, [tab, composeShoutout, composeContext, shoutouts, borders, shoutoutFolders, borderFolders, objectFolders, objects]);

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
        setObjectFolders(d.objectFolders || []);
      }
    } catch(e) { console.warn('Folder load failed:', e); }
  }

  async function saveFolders(uid, sf, bf, of2) {
    try {
      await fb.setDoc(fb.doc(fb.db,'users',uid,'settings','folders'),
        { shoutoutFolders: sf, borderFolders: bf, objectFolders: of2 || objectFolders });
    } catch(e) { console.warn('Folder save failed:', e); }
  }

  function handleFolderCreate(type, name) {
    if (type === 'shoutouts') {
      if (shoutoutFolders.includes(name)) return;
      const next = [...shoutoutFolders, name];
      setShoutoutFolders(next);
      saveFolders(authUser.uid, next, borderFolders, objectFolders);
    } else if (type === 'borders') {
      if (borderFolders.includes(name)) return;
      const next = [...borderFolders, name];
      setBorderFolders(next);
      saveFolders(authUser.uid, shoutoutFolders, next, objectFolders);
    } else {
      if (objectFolders.includes(name)) return;
      const next = [...objectFolders, name];
      setObjectFolders(next);
      saveFolders(authUser.uid, shoutoutFolders, borderFolders, next);
    }
  }

  async function handleFolderRename(type, oldName, newName) {
    if (type === 'shoutouts') {
      const next = shoutoutFolders.map(function(f) { return f === oldName ? newName : f; });
      setShoutoutFolders(next);
      saveFolders(authUser.uid, next, borderFolders, objectFolders);
      if (activeShoutoutFolder === oldName) setActiveShoutoutFolder(newName);
      const batch = shoutouts.filter(function(s) { return s.folder === oldName; });
      for (const s of batch) {
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'shoutouts',s.id), { folder: newName });
      }
    } else if (type === 'borders') {
      const next = borderFolders.map(function(f) { return f === oldName ? newName : f; });
      setBorderFolders(next);
      saveFolders(authUser.uid, shoutoutFolders, next, objectFolders);
      if (activeBorderFolder === oldName) setActiveBorderFolder(newName);
      const batch = borders.filter(function(b) { return b.folder === oldName && !b.builtIn; });
      for (const b of batch) {
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'borders',b.id), { folder: newName });
      }
    } else {
      const next = objectFolders.map(function(f) { return f === oldName ? newName : f; });
      setObjectFolders(next);
      saveFolders(authUser.uid, shoutoutFolders, borderFolders, next);
      if (activeObjectFolder === oldName) setActiveObjectFolder(newName);
      const batch = objects.filter(function(o) { return o.folder === oldName; });
      for (const o of batch) {
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'objects',o.id), { folder: newName });
      }
    }
  }

  async function handleFolderDelete(type, name) {
    if (type === 'shoutouts') {
      const next = shoutoutFolders.filter(function(f) { return f !== name; });
      setShoutoutFolders(next);
      saveFolders(authUser.uid, next, borderFolders, objectFolders);
      if (activeShoutoutFolder === name) setActiveShoutoutFolder(null);
      const batch = shoutouts.filter(function(s) { return s.folder === name; });
      for (const s of batch) {
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'shoutouts',s.id), { folder: null });
      }
    } else if (type === 'borders') {
      const next = borderFolders.filter(function(f) { return f !== name; });
      setBorderFolders(next);
      saveFolders(authUser.uid, shoutoutFolders, next, objectFolders);
      if (activeBorderFolder === name) setActiveBorderFolder(null);
      const batch = borders.filter(function(b) { return b.folder === name && !b.builtIn; });
      for (const b of batch) {
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'borders',b.id), { folder: null });
      }
    } else {
      const next = objectFolders.filter(function(f) { return f !== name; });
      setObjectFolders(next);
      saveFolders(authUser.uid, shoutoutFolders, borderFolders, next);
      if (activeObjectFolder === name) setActiveObjectFolder(null);
      const batch = objects.filter(function(o) { return o.folder === name; });
      for (const o of batch) {
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'objects',o.id), { folder: null });
      }
    }
  }

  async function handleMoveToFolder(type, itemId, folder) {
    try {
      if (type === 'shoutout') {
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'shoutouts',itemId), { folder: folder || null });
      } else if (type === 'border') {
        const border = borders.find(function(b) { return b.id === itemId; });
        if (border && border.builtIn) { showToast('Cannot move built-in borders'); return; }
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'borders',itemId), { folder: folder || null });
      } else {
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'objects',itemId), { folder: folder || null });
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

  // ── Borders listener — built-ins (shared) + custom (per-user) ──
  useEffect(()=>{
    if (!authUser) { setBorders([]); return; }
    seedBorders();
    // Listen to shared built-in borders
    const qBuiltin = fb.query(fb.collection(fb.db,'borders'), fb.orderBy('createdAt','asc'));
    // Listen to per-user custom borders
    const qCustom  = fb.query(fb.collection(fb.db,'users',authUser.uid,'borders'), fb.orderBy('createdAt','asc'));

    let builtinBorders = [];
    let customBorders  = [];

    function merge() {
      // Built-ins first, then custom
      // Hide built-in borders that the user has already copied to their library
      const customNames = new Set(customBorders.map(function(b) { return b.name.replace(' (Copy)', ''); }));
      const visibleBuiltins = builtinBorders.filter(function(b) { return !customNames.has(b.name); });
      setBorders([...visibleBuiltins, ...customBorders]);
    }

    const unsubBuiltin = fb.onSnapshot(qBuiltin, snap=>{
      builtinBorders = snap.docs.map(d=>({id:d.id,...d.data(),builtIn:true}));
      merge();
    });
    const unsubCustom = fb.onSnapshot(qCustom, snap=>{
      customBorders = snap.docs.map(d=>({id:d.id,...d.data(),builtIn:false}));
      merge();
    });
    return ()=>{ unsubBuiltin(); unsubCustom(); };
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

  // ── Objects listener (per-user) ──
  useEffect(()=>{
    if (!authUser) { setObjects([]); return; }
    const q = fb.query(
      fb.collection(fb.db,'users',authUser.uid,'objects'),
      fb.orderBy('createdAt','desc')
    );
    const unsub = fb.onSnapshot(q, snap=>{
      setObjects(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return ()=>unsub();
  },[authUser]);

  // ── Save object ──
  async function saveObject(data) {
    setSaving(true);
    try {
      const fullData = {};
      Object.keys(data).forEach(function(k) { fullData[k] = data[k] === undefined ? null : data[k]; });
      if (editObject && editObject !== 'new') {
        await fb.updateDoc(
          fb.doc(fb.db,'users',authUser.uid,'objects',editObject.id),
          Object.assign({}, fullData, {updatedAt: fb.serverTimestamp()})
        );
        showToast('Object updated');
      } else {
        await fb.addDoc(
          fb.collection(fb.db,'users',authUser.uid,'objects'),
          Object.assign({}, fullData, {createdAt: fb.serverTimestamp(), updatedAt: fb.serverTimestamp()})
        );
        showToast('Object created');
      }
      setEditObject(null);
    } catch(e) { showToast('Could not save object: ' + e.message); }
    finally { setSaving(false); }
  }

  // ── Sign in/out ──
  async function handleSignIn() {
    setAuthError(null);
    try {
      await fb.signInWithPopup(fb.auth, new fb.GoogleAuthProvider());
    } catch(e) { setAuthError('Sign-in failed. Please try again.'); }
  }
  async function handleSignOut() { await fb.signOut(fb.auth); }

  // ── Save from ComposeSheet ──
  async function saveCompose(data) {
    setSaving(true);
    try {
      const border = borders.find(function(b) { return b.id === data.borderId; });
      const borderSpec = (border && border.spec) ? border.spec
                       : (BORDER_SPECS[border && border.style] || null);
      // Serialise placedObjects to plain format Firestore can store
      const safePlacedObjects = {};
      if (data.placedObjects) {
        Object.keys(data.placedObjects).forEach(function(posId) {
          const obj = data.placedObjects[posId];
          if (!obj) return;
          const layers = obj.layers
            ? obj.layers.map(function(l) {
                return {
                  colorSlot: l.colorSlot || 'primary',
                  pattern: (l.pattern || []).map(function(r) {
                    return typeof r === 'string' ? r : r.join('');
                  }),
                };
              })
            : [{ colorSlot: 'primary', pattern: (obj.pattern || []).map(function(r) {
                return typeof r === 'string' ? r : r.join('');
              }) }];
          safePlacedObjects[posId] = {
            id: obj.id || posId,
            name: obj.name || '',
            width: obj.width || (layers[0] && layers[0].pattern[0] ? layers[0].pattern[0].length : 0),
            height: obj.height || (layers[0] ? layers[0].pattern.length : 0),
            layers: layers,
          };
        });
      }
      const fullData = {
        ...data,
        placedObjects: safePlacedObjects,
        borderStyle: border ? border.style : 'british',
        borderSpec:  borderSpec,
      };
      if (composeShoutout && composeShoutout !== 'new') {
        await fb.updateDoc(
          fb.doc(fb.db,'users',authUser.uid,'shoutouts',composeShoutout.id),
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
      setComposeShoutout(null);
    } catch(e) {
      console.error('saveCompose error:', e);
      showToast('Save failed: ' + e.message);
    }
    finally { setSaving(false); }
  }

  // ── Save shoutout ──

  // ── Toggle lock ──
  async function handleToggleLock(item) {
    try {
      const newLocked = !item.locked;
      await fb.updateDoc(
        fb.doc(fb.db, 'users', authUser.uid, 'shoutouts', item.id),
        { locked: newLocked, updatedAt: fb.serverTimestamp() }
      );
      showToast(newLocked ? 'Design locked' : 'Design unlocked');
    } catch(e) { showToast('Could not update lock: ' + e.message); }
  }

  // ── Toggle border lock ──
  async function handleToggleBorderLock(border) {
    try {
      if (border.builtIn) {
        // Check if a user copy already exists (same name, not builtIn)
        const existingCopy = borders.find(function(b) {
          return !b.builtIn && b.name === border.name;
        });
        if (existingCopy) {
          showToast('"' + border.name + '" is already in your library — find it in your custom borders');
          return;
        }
        // Copy to user collection as unlocked — ready to edit
        const spec = border.spec || BORDER_SPECS[border.style] || null;
        await fb.addDoc(
          fb.collection(fb.db, 'users', authUser.uid, 'borders'), {
            name: border.name + ' (Copy)', style: border.style,
            description: border.description || '',
            traits: border.traits || [],
            spec: spec, builtIn: false,
            locked: false,
            createdBy: authUser.uid,
            folder: border.folder || null,
            createdAt: fb.serverTimestamp(),
            updatedAt: fb.serverTimestamp(),
          }
        );
        showToast('"' + border.name + ' (Copy)" added to your library — ready to edit');
      } else {
        const newLocked = !border.locked;
        await fb.updateDoc(
          fb.doc(fb.db, 'users', authUser.uid, 'borders', border.id),
          { locked: newLocked, updatedAt: fb.serverTimestamp() }
        );
        showToast(newLocked ? 'Border locked' : 'Border unlocked');
      }
    } catch(e) { showToast('Could not update lock: ' + e.message); }
  }

  // ── Save border ──
  async function saveBorder(data) {
    setSaving(true);
    try {
      const spec = data.spec || BORDER_SPECS[data.style] || null;
      // Sanitise — Firestore rejects undefined values, replace with null
      const raw = Object.assign({}, data, {spec: spec});
      const fullData = {};
      Object.keys(raw).forEach(function(k) {
        fullData[k] = raw[k] === undefined ? null : raw[k];
      });
      if (editBorder && editBorder !== 'new') {
        // Update — always write to user collection
        const path = fb.doc(fb.db,'users',authUser.uid,'borders',editBorder.id);
        await fb.updateDoc(path, Object.assign({}, fullData, {updatedAt: fb.serverTimestamp()}));
        showToast('Border updated');
      } else {
        // Create — always per-user
        await fb.addDoc(
          fb.collection(fb.db,'users',authUser.uid,'borders'),
          Object.assign({}, fullData, {
            builtIn: false, createdBy: authUser.uid,
            createdAt: fb.serverTimestamp(), updatedAt: fb.serverTimestamp()
          })
        );
        showToast('Border created');
      }
      setEditBorder(null);
    } catch(e) { showToast('Border save failed: ' + e.message); }
    finally { setSaving(false); }
  }

  // ── Delete ──
  async function handleDelete() {
    if (!confirmDel) return;
    try {
      if (confirmDel.type==='shoutout') {
        await fb.deleteDoc(fb.doc(fb.db,'users',authUser.uid,'shoutouts',confirmDel.id));
        showToast('Shoutout deleted'); setSelShoutout(null);
      } else if (confirmDel.type==='object') {
        await fb.deleteDoc(fb.doc(fb.db,'users',authUser.uid,'objects',confirmDel.id));
        showToast('Object deleted');
      } else {
        const border = borders.find(function(b) { return b.id === confirmDel.id; });
        if (border && border.builtIn) {
          showToast('Cannot delete built-in borders — unlock first to copy to your library');
          setConfirmDel(null); return;
        }
        await fb.deleteDoc(fb.doc(fb.db,'users',authUser.uid,'borders',confirmDel.id));
        showToast('Border deleted');
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
              onCompose={function(s) { setComposeShoutout(s); }}
              onToggleLock={handleToggleLock}
              onExportChart={function(s) {
                setTimeout(function() { generateChartPDF(s); }, 50);
              }}
              onExportAida={function(s) { setAidaShoutout(s); }}
              onDelete={function(s) { setConfirmDel({type:'shoutout', id:s.id}); }}
              onMoveToFolder={function(type, id, folder) { handleMoveToFolder(type, id, folder); }}
              folders={shoutoutFolders}
              activeFolder={activeShoutoutFolder}
              onFolderChange={setActiveShoutoutFolder}
              onFolderCreate={handleFolderCreate}
              onFolderRename={handleFolderRename}
              onFolderDelete={handleFolderDelete}/>
          )}
          {tab === 'borders' && (
            <BordersScreen borders={borders}
              onEdit={function(b) { setEditBorder(b); }}
              onDelete={function(b) { setConfirmDel({type:'border', id:b.id}); }}
              onToggleLock={handleToggleBorderLock}
              onMoveToFolder={function(type, id, folder) { handleMoveToFolder(type, id, folder); }}
              folders={borderFolders}
              activeFolder={activeBorderFolder}
              onFolderChange={setActiveBorderFolder}
              onFolderCreate={handleFolderCreate}
              onFolderRename={handleFolderRename}
              onFolderDelete={handleFolderDelete}/>
          )}
          {tab === 'objects' && (
            <ObjectsScreen objects={objects}
              onEdit={function(o) { setEditObject(o); }}
              onDelete={function(o) { setConfirmDel({type:'object', id:o.id}); }}
              onMoveToFolder={function(type, id, folder) { handleMoveToFolder(type, id, folder); }}
              folders={objectFolders}
              activeFolder={activeObjectFolder}
              onFolderChange={setActiveObjectFolder}
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
          <button className={'nav-tab' + (tab==='objects' ? ' active' : '')}
            onClick={function() { setTab('objects'); }}>
            <Ico.Object/>
            <span className="nav-tab-label">Objects</span>
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
              title={tab==='shoutouts' ? 'New shoutout' : tab==='borders' ? 'New border' : 'New object'}
              onClick={function() {
                if (tab === 'shoutouts') setComposeShoutout('new');
                else if (tab === 'borders') setEditBorder('new');
                else setEditObject('new');
              }}>
              <Ico.Plus/>
            </button>
          )}
        </nav>

        {/* FAB — desktop only */}
        {!kevinMobileActive && (
          <button className="fab"
            title={tab==='shoutouts' ? 'New shoutout' : tab==='borders' ? 'New border' : 'New object'}
            onClick={function() {
              if (tab === 'shoutouts') setComposeShoutout('new');
              else if (tab === 'borders') setEditBorder('new');
              else setEditObject('new');
            }}>
            <Ico.Plus/>
          </button>
        )}

        {composeShoutout && (
          <ComposeSheet
            initial={composeShoutout === 'new' ? null : composeShoutout}
            borders={borders}
            objects={objects}
            onSave={saveCompose}
            onClose={function() { setComposeShoutout(null); setComposeContext(null); }}
            saving={saving}
            kevinVisible={kevinVisible}
            onToggleKevin={function() { setKevinVisible(function(v) { return !v; }); }}
            onStateChange={setComposeContext}/>
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
          appData={{ shoutouts, borders, objects, fb: window.__firebase, uid: authUser.uid }}
          messages={kevinMessages}
          setMessages={setKevinMessages}
          onClose={function() {
            setKevinVisible(false);
            if (kevinMobileActive) setTab('shoutouts');
          }}
        />
      </div>

      {/* ── Modals ── */}



      {editBorder && (
        <BorderForm
          initial={editBorder==='new' ? null : editBorder}
          onSave={saveBorder}
          onClose={function() { setEditBorder(null); }}
          saving={saving}/>
      )}

      {editObject && (
        <ObjectEditor
          initial={editObject === 'new' ? null : editObject}
          onSave={saveObject}
          onClose={function() { setEditObject(null); }}
          saving={saving}/>
      )}
      {aidaShoutout && (
        <AidaOptionsSheet shoutout={aidaShoutout}
          onClose={function() { setAidaShoutout(null); }}/>
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