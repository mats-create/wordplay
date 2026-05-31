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
  const [shoutoutTags, setShoutoutTags] = useState([]);
  const [borderTags,   setBorderTags]   = useState([]);
  const [objectTags,   setObjectTags]   = useState([]);
  const [activeShoutoutTags, setActiveShoutoutTags] = useState([]);
  const [activeBorderTags,   setActiveBorderTags]   = useState([]);
  const [activeObjectTags,   setActiveObjectTags]   = useState([]);
  const [objects,       setObjects]       = useState([]);
  const [editObject,    setEditObject]    = useState(null);
  const [composeShoutout, setComposeShoutout] = useState(null);
  const [composeContext,  setComposeContext]  = useState(null);

  // Keep composeShoutout in sync with live Firestore updates
  // so Kevin's external changes (object placements etc) flow into the Composer
  useEffect(function() {
    if (composeShoutout && composeShoutout !== 'new') {
      const updated = shoutouts.find(function(s) { return s.id === composeShoutout.id; });
      if (updated) setComposeShoutout(updated);
    }
  }, [shoutouts]);
  const fb = window.__firebase;

  // Kevin context — what Kevin knows about the current state
  const kevinContext = useMemo(function() {
    return {
      tab: composeShoutout ? 'compose' : tab,
      shoutoutCount: shoutouts.length,
      shoutoutNames: shoutouts.map(function(s) { return s.designName || s.name; }).join(', ') || 'none',
      borderNames: borders.map(function(b) { return b.name; }).join(', ') || 'none',
      shoutoutTags: shoutoutTags.join(', ') || 'none',
      borderTags: borderTags.join(', ') || 'none',
      objectTags: objectTags.join(', ') || 'none',
      objectCount: objects.length,
      objectNames: objects.map(function(o) { return o.name; }).join(', ') || 'none',
      compose: composeContext,
    };
  }, [tab, composeShoutout, composeContext, shoutouts, borders, shoutoutTags, borderTags, objectTags, objects]);

  // ── Auth ──
  useEffect(function(){
    const unsub = fb.onAuthStateChanged(fb.auth, function(u) {
      setAuthUser(u||null);
      if (u) {
        loadKevinKeyFromFirestore(u.uid);
        loadTags(u.uid);
      } else {
        setKevinApiKey('');
        setShoutoutTags([]); setBorderTags([]); setObjectTags([]);
      }
    });
    return function(){ unsub(); };
  },[]);

  // ── Folders — load/save ──
  async function loadTags(uid) {
    try {
      const snap = await fb.getDoc(fb.doc(fb.db,'users',uid,'settings','folders'));
      if (snap.exists()) {
        const d = snap.data();
        // Support both old (shoutoutFolders) and new (shoutoutTags) field names
        setShoutoutTags(d.shoutoutTags || d.shoutoutFolders || []);
        setBorderTags(d.borderTags || d.borderFolders || []);
        setObjectTags(d.objectTags || d.objectFolders || []);
      }
    } catch(e) { console.warn('Tags load failed:', e); }
  }

  async function saveTags(uid, st, bt, ot) {
    try {
      await fb.setDoc(fb.doc(fb.db,'users',uid,'settings','folders'),
        { shoutoutTags: st, borderTags: bt, objectTags: ot || objectTags,
          // Keep legacy fields for backward compat
          shoutoutFolders: st, borderFolders: bt, objectFolders: ot || objectTags });
    } catch(e) { console.warn('Tags save failed:', e); }
  }

  function handleTagCreate(type, name) {
    if (type === 'shoutouts') {
      if (shoutoutTags.includes(name)) return;
      const next = [...shoutoutTags, name];
      setShoutoutTags(next);
      saveTags(authUser.uid, next, borderTags, objectTags);
    } else if (type === 'borders') {
      if (borderTags.includes(name)) return;
      const next = [...borderTags, name];
      setBorderTags(next);
      saveTags(authUser.uid, shoutoutTags, next, objectTags);
    } else {
      if (objectTags.includes(name)) return;
      const next = [...objectTags, name];
      setObjectTags(next);
      saveTags(authUser.uid, shoutoutTags, borderTags, next);
    }
  }

  async function handleFolderRename(type, oldName, newName) {
    function replaceTag(tags, folder) {
      var t = tags && tags.length ? tags : (folder ? [folder] : []);
      return t.map(function(x) { return x === oldName ? newName : x; });
    }
    if (type === 'shoutouts') {
      const next = shoutoutTags.map(function(f) { return f === oldName ? newName : f; });
      setShoutoutTags(next);
      saveTags(authUser.uid, next, borderTags, objectTags);
      if (activeShoutoutTags.includes(oldName)) {
        setActiveShoutoutTags(activeShoutoutTags.map(function(t) { return t === oldName ? newName : t; }));
      }
      const batch = shoutouts.filter(function(s) {
        var t = s.tags && s.tags.length ? s.tags : (s.folder ? [s.folder] : []);
        return t.includes(oldName);
      });
      for (const s of batch) {
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'shoutouts',s.id),
          { tags: replaceTag(s.tags, s.folder), folder: null });
      }
    } else if (type === 'borders') {
      const next = borderTags.map(function(f) { return f === oldName ? newName : f; });
      setBorderTags(next);
      saveTags(authUser.uid, shoutoutTags, next, objectTags);
      if (activeBorderTags.includes(oldName)) {
        setActiveBorderTags(activeBorderTags.map(function(t) { return t === oldName ? newName : t; }));
      }
      const batch = borders.filter(function(b) {
        var t = b.tags && b.tags.length ? b.tags : (b.folder ? [b.folder] : []);
        return t.includes(oldName) && !b.builtIn;
      });
      for (const b of batch) {
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'borders',b.id),
          { tags: replaceTag(b.tags, b.folder), folder: null });
      }
    } else {
      const next = objectTags.map(function(f) { return f === oldName ? newName : f; });
      setObjectTags(next);
      saveTags(authUser.uid, shoutoutTags, borderTags, next);
      if (activeObjectTags.includes(oldName)) {
        setActiveObjectTags(activeObjectTags.map(function(t) { return t === oldName ? newName : t; }));
      }
      const batch = objects.filter(function(o) {
        var t = o.tags && o.tags.length ? o.tags : (o.folder ? [o.folder] : []);
        return t.includes(oldName);
      });
      for (const o of batch) {
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'objects',o.id),
          { tags: replaceTag(o.tags, o.folder), folder: null });
      }
    }
  }

  async function handleFolderDelete(type, name) {
    function removeTag(tags, folder) {
      var t = tags && tags.length ? tags : (folder ? [folder] : []);
      return t.filter(function(x) { return x !== name; });
    }
    if (type === 'shoutouts') {
      const next = shoutoutTags.filter(function(f) { return f !== name; });
      setShoutoutTags(next);
      saveTags(authUser.uid, next, borderTags, objectTags);
      setActiveShoutoutTags(activeShoutoutTags.filter(function(t) { return t !== name; }));
      const batch = shoutouts.filter(function(s) {
        var t = s.tags && s.tags.length ? s.tags : (s.folder ? [s.folder] : []);
        return t.includes(name);
      });
      for (const s of batch) {
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'shoutouts',s.id),
          { tags: removeTag(s.tags, s.folder), folder: null });
      }
    } else if (type === 'borders') {
      const next = borderTags.filter(function(f) { return f !== name; });
      setBorderTags(next);
      saveTags(authUser.uid, shoutoutTags, next, objectTags);
      setActiveBorderTags(activeBorderTags.filter(function(t) { return t !== name; }));
      const batch = borders.filter(function(b) {
        var t = b.tags && b.tags.length ? b.tags : (b.folder ? [b.folder] : []);
        return t.includes(name) && !b.builtIn;
      });
      for (const b of batch) {
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'borders',b.id),
          { tags: removeTag(b.tags, b.folder), folder: null });
      }
    } else {
      const next = objectTags.filter(function(f) { return f !== name; });
      setObjectTags(next);
      saveTags(authUser.uid, shoutoutTags, borderTags, next);
      setActiveObjectTags(activeObjectTags.filter(function(t) { return t !== name; }));
      const batch = objects.filter(function(o) {
        var t = o.tags && o.tags.length ? o.tags : (o.folder ? [o.folder] : []);
        return t.includes(name);
      });
      for (const o of batch) {
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'objects',o.id),
          { tags: removeTag(o.tags, o.folder), folder: null });
      }
    }
  }

  async function handleSetTags(type, itemId, tags) {
    // tags is the new complete tags array for the item
    try {
      if (type === 'shoutout') {
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'shoutouts',itemId),
          { tags: tags, folder: null });
      } else if (type === 'border') {
        const border = borders.find(function(b) { return b.id === itemId; });
        if (border && border.builtIn) { showToast('Cannot tag built-in borders — copy to library first'); return; }
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'borders',itemId),
          { tags: tags, folder: null });
      } else {
        await fb.updateDoc(fb.doc(fb.db,'users',authUser.uid,'objects',itemId),
          { tags: tags, folder: null });
      }
      showToast(tags.length > 0 ? 'Tags updated' : 'Tags cleared');
    } catch(e) { showToast('Tag update failed — try again'); }
  }

  // Legacy alias — kept for any remaining callers
  async function handleMoveToFolder(type, itemId, folder) {
    const item = type === 'shoutout'
      ? shoutouts.find(function(s) { return s.id === itemId; })
      : type === 'border'
        ? borders.find(function(b) { return b.id === itemId; })
        : objects.find(function(o) { return o.id === itemId; });
    const currentTags = item && item.tags && item.tags.length ? item.tags
      : (item && item.folder ? [item.folder] : []);
    if (!folder) {
      // Clear all tags
      return handleSetTags(type, itemId, []);
    } else if (!currentTags.includes(folder)) {
      return handleSetTags(type, itemId, [...currentTags, folder]);
    }
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
      const fullData = sanitiseForFirestore(Object.assign({}, data));
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

  // ── Shared deep sanitise for Firestore writes ──
  function sanitiseForFirestore(val) {
    if (val === undefined) return null;
    if (val === null) return null;
    if (Array.isArray(val)) return val.map(sanitiseForFirestore);
    if (typeof val === 'object' && val.constructor === Object) {
      var out = {};
      Object.keys(val).forEach(function(k) { out[k] = sanitiseForFirestore(val[k]); });
      return out;
    }
    return val;
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

  // ── Copy handlers ──
  async function handleCopyShoutout(item) {
    try {
      const copy = sanitiseForFirestore(Object.assign({}, item, {
        name: item.name + ' (Copy)',
        designName: item.designName ? item.designName + ' (Copy)' : '',
        locked: false,
        createdAt: fb.serverTimestamp(),
        updatedAt: fb.serverTimestamp(),
      }));
      delete copy.id;
      await fb.addDoc(fb.collection(fb.db,'users',authUser.uid,'shoutouts'), copy);
      showToast('"' + (item.designName||item.name) + '" copied');
    } catch(e) { showToast('Copy failed: ' + e.message); }
  }

  async function handleCopyBorder(item) {
    try {
      const spec = item.spec || BORDER_SPECS[item.style] || null;
      const copy = sanitiseForFirestore(Object.assign({}, item, {
        name: item.name + ' (Copy)',
        locked: false, builtIn: false,
        createdBy: authUser.uid,
        createdAt: fb.serverTimestamp(),
        updatedAt: fb.serverTimestamp(),
        spec: spec,
      }));
      delete copy.id;
      await fb.addDoc(fb.collection(fb.db,'users',authUser.uid,'borders'), copy);
      showToast('"' + item.name + '" copied');
    } catch(e) { showToast('Copy failed: ' + e.message); }
  }

  async function handleCopyObject(item) {
    try {
      const copy = sanitiseForFirestore(Object.assign({}, item, {
        name: item.name + ' (Copy)',
        createdAt: fb.serverTimestamp(),
        updatedAt: fb.serverTimestamp(),
      }));
      delete copy.id;
      await fb.addDoc(fb.collection(fb.db,'users',authUser.uid,'objects'), copy);
      showToast('"' + item.name + '" copied');
    } catch(e) { showToast('Copy failed: ' + e.message); }
  }

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

      // Deep sanitise — recursively replace undefined with null
      // Firestore rejects undefined at any nesting level
      const fullData = sanitiseForFirestore(Object.assign({}, data, {spec: spec}));

      if (editBorder && editBorder !== 'new') {
        const path = fb.doc(fb.db,'users',authUser.uid,'borders',editBorder.id);
        await fb.updateDoc(path, Object.assign({}, fullData, {updatedAt: fb.serverTimestamp()}));
        showToast('Border updated');
      } else {
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
        showToast('Shoutout deleted');
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
    } catch(e) { showToast('Delete failed — try again'); setConfirmDel(null); }
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
              onCopy={handleCopyShoutout}
              onExportChart={function(s) {
                setTimeout(function() { generateChartPDF(s); }, 50);
              }}
              onExportAida={function(s) { setAidaShoutout(s); }}
              onDelete={function(s) { setConfirmDel({type:'shoutout', id:s.id}); }}
              onMoveToFolder={function(type, id, folder) { handleMoveToFolder(type, id, folder); }}
              tags={shoutoutTags}
              activeTags={activeShoutoutTags}
              onTagChange={setActiveShoutoutTags}
              onTagCreate={function(name) { handleTagCreate('shoutouts', name); }}
              onFolderRename={handleFolderRename}
              onFolderDelete={handleFolderDelete}
              onSetTags={function(id, tags) { handleSetTags('shoutout', id, tags); }}/>
          )}
          {tab === 'borders' && (
            <BordersScreen borders={borders}
              onEdit={function(b) { setEditBorder(b); }}
              onDelete={function(b) { setConfirmDel({type:'border', id:b.id}); }}
              onToggleLock={handleToggleBorderLock}
              onCopy={handleCopyBorder}
              onMoveToFolder={function(type, id, folder) { handleMoveToFolder(type, id, folder); }}
              tags={borderTags}
              activeTags={activeBorderTags}
              onTagChange={setActiveBorderTags}
              onTagCreate={function(name) { handleTagCreate('borders', name); }}
              onFolderRename={handleFolderRename}
              onFolderDelete={handleFolderDelete}
              onSetTags={function(id, tags) { handleSetTags('border', id, tags); }}/>
          )}
          {tab === 'objects' && (
            <ObjectsScreen objects={objects}
              onEdit={function(o) { setEditObject(o); }}
              onDelete={function(o) { setConfirmDel({type:'object', id:o.id}); }}
              onCopy={handleCopyObject}
              onMoveToFolder={function(type, id, folder) { handleMoveToFolder(type, id, folder); }}
              tags={objectTags}
              activeTags={activeObjectTags}
              onTagChange={setActiveObjectTags}
              onTagCreate={function(name) { handleTagCreate('objects', name); }}
              onFolderRename={handleFolderRename}
              onFolderDelete={handleFolderDelete}
              onSetTags={function(id, tags) { handleSetTags('object', id, tags); }}/>
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