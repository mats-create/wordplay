/* ═══════════════════════════════════════════════════════════════════
   VALIDATION HELPERS
═══════════════════════════════════════════════════════════════════ */
function validateShoutout(fields) {
  const errors = {};
  if (!fields.name || !fields.name.trim()) errors.name = 'Word or phrase is required';
  if (!fields.stitchesW || fields.stitchesW < 10 || fields.stitchesW > 300) errors.stitchesW = '10–300';
  if (!fields.stitchesH || fields.stitchesH < 10 || fields.stitchesH > 300) errors.stitchesH = '10–300';
  if (!fields.hoopW || fields.hoopW < 50 || fields.hoopW > 600) errors.hoopW = '50–600mm';
  if (!fields.hoopH || fields.hoopH < 50 || fields.hoopH > 600) errors.hoopH = '50–600mm';
  if (!fields.borderId) errors.borderId = 'Select a border style';
  return errors;
}
function validateBorder(fields) {
  const errors = {};
  if (!fields.name || !fields.name.trim()) errors.name = 'Name is required';
  if (!fields.description || !fields.description.trim()) errors.description = 'Description is required';
  return errors;
}
function hasErrors(e) { return Object.keys(e).length > 0; }

/* ═══════════════════════════════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════════════════════════════ */
function useToast() {
  const [msg, setMsg] = useState(null);
  const show = useCallback(m => { setMsg(m); setTimeout(()=>setMsg(null),2500); }, []);
  return [msg, show];
}

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
}

/* ═══════════════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════════════ */
const Ico = {
  Plus:    ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Edit:    ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Delete:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  Close:   ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  SignOut: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Lock:    ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Shout:   ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Border:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>,
  Object:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  Google:  ()=><svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>,
};

/* ═══════════════════════════════════════════════════════════════════
   DEFAULT THREADS
═══════════════════════════════════════════════════════════════════ */
const DEFAULT_THREADS = [
  {id:1, name:'Pitch black', dmc:'DMC 310',  hex:'#1A1A1A', usage:'Main text'},
  {id:2, name:'Pitch green', dmc:'DMC 3362', hex:'#4A6741', usage:'Border accents'},
  {id:3, name:'Coral',       dmc:'DMC 350',  hex:'#CC3300', usage:'Highlights'},
];

// Named thread slot definitions — labels for UI and Kevin
const THREAD_SLOTS = [
  {index:0, label:'Shoutout', hint:'Word and text colour'},
  {index:1, label:'Border 1', hint:'Main border lines'},
  {index:2, label:'Border 2', hint:'Secondary border colour'},
  {index:3, label:'Border 3', hint:'Third border colour'},
  {index:4, label:'Accent 1', hint:'First accent / motif colour'},
  {index:5, label:'Accent 2', hint:'Second accent / motif colour'},
];

/* ═══════════════════════════════════════════════════════════════════
   DMC COLOUR DATA
   Source: DMC six-strand embroidery floss, ~454 colours
═══════════════════════════════════════════════════════════════════ */
