/* =====================================================================
   Prep Desk — app logic
   Load order:  quotes.js  →  script.js

   Features: no-repeat quote engine · consistency heatmap · dark mode ·
             flashcard quiz with light spaced repetition · streak milestones

   NOTE ON SAFETY
   --------------
   Every DOM lookup goes through el() / on() / setText() below. If an
   element is ever missing from the HTML, that one line quietly does
   nothing instead of throwing — which would otherwise stop the whole
   script and leave you stuck on the welcome screen.
   ===================================================================== */

/* ---------- safe DOM helpers ---------- */
function el(id) { return document.getElementById(id); }
function on(id, ev, fn) { const n = el(id); if (n) n.addEventListener(ev, fn); return n; }
function setText(id, txt) { const n = el(id); if (n) n.textContent = txt; }
function show(id) { const n = el(id); if (n) n.classList.remove('hidden'); }
function hide(id) { const n = el(id); if (n) n.classList.add('hidden'); }

/* =====================================================================
   Content
   ===================================================================== */
const DEFAULT_QUOTES = [
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Unknown" },
  { text: "A goal without a plan is just a wish.", author: "Antoine de Saint-Exupéry" },
  { text: "Progress, not perfection.", author: "Unknown" }
];

const QUOTE_BANK = (typeof MOTIVATION_QUOTES !== 'undefined' && MOTIVATION_QUOTES.length)
  ? MOTIVATION_QUOTES : DEFAULT_QUOTES;

const CASE_STUDIES = [
  "A mid-size FMCG brand's market share has dropped 8% in two quarters after a competitor launched a cheaper private-label alternative. As the marketing lead, how do you diagnose the cause and respond — price, positioning, or something else?",
  "A fast-growing startup is seeing 30% annual attrition in its first-year sales hires. As the HR Business Partner, what would you investigate first, and what's your 90-day fix?",
  "A company's new product launch got strong pre-orders but weak repeat purchase. Walk through how you'd use the AARRR funnel to figure out where the drop-off is happening.",
  "Two departments are in conflict over hiring priorities — Sales wants 5 new reps, Finance wants to freeze headcount. As HR, how do you mediate and what data would you bring to the table?",
  "A D2C brand wants to expand from Instagram-led marketing into offline retail. What's your go-to-market plan, and what changes in the marketing mix (4Ps)?",
  "Employee engagement scores dropped sharply after a return-to-office mandate. Design a 3-step intervention plan as the HR lead.",
  "A brand's Net Promoter Score is high, but revenue growth is flat. What could explain the gap, and how would you investigate it?",
  "You're asked to build a compensation structure for a new tech team in a company that has always paid on seniority. What factors do you weigh?",
  "A campaign performed brilliantly on social media metrics (likes, shares) but sales didn't move. What's your hypothesis, and how do you test it?",
  "Leadership wants to cut the L&D budget by 40% this year. As HR, how do you make the case for what to protect and what to cut?"
];

const MARKETING_FRAMEWORKS = [
  { title: "STP — Segmentation, Targeting, Positioning", text: "Break the market into meaningful segments, choose which to serve, then decide how the brand should be perceived relative to competitors in that segment's mind." },
  { title: "The 4 Ps", text: "Product, Price, Place, Promotion — the classic marketing mix. Good for stress-testing whether a strategy is coherent across all four levers." },
  { title: "SWOT Analysis", text: "Strengths and Weaknesses look inward; Opportunities and Threats look outward. Use it to structure, not to list everything — pick what actually changes the decision." },
  { title: "AIDA", text: "Attention, Interest, Desire, Action — a simple funnel for mapping how a piece of communication should move a customer toward buying." },
  { title: "BCG Growth-Share Matrix", text: "Plots products by market growth vs relative market share into Stars, Cash Cows, Question Marks, and Dogs — useful for portfolio decisions." },
  { title: "Customer Lifetime Value (CLV)", text: "The total revenue a business can expect from one customer. Anchors decisions on how much you can afford to spend to acquire them." },
  { title: "Porter's Five Forces", text: "Competitive rivalry, supplier power, buyer power, threat of substitution, threat of new entry — a lens for how attractive an industry really is." },
  { title: "Brand Positioning Statement", text: "For [target], [brand] is the [category] that [key benefit] because [reason to believe]. A one-line discipline check for any campaign." }
];

const HR_TOPICS = [
  { title: "Recruitment Funnel", text: "Sourcing → Screening → Interviews → Offer → Onboarding. Track conversion at each stage to find where good candidates are being lost." },
  { title: "Performance Appraisal Methods", text: "360-degree feedback, MBO (management by objectives), and forced ranking are the classics — each trades off fairness against simplicity differently." },
  { title: "Employee Engagement Models", text: "Gallup's Q12 and the Job Demands-Resources model both argue engagement comes from a mix of clear expectations, growth, and manageable workload." },
  { title: "Compensation & Benefits Basics", text: "Pay should generally balance internal equity (fairness within the company) with external competitiveness (fairness against the market)." },
  { title: "Maslow's Hierarchy at Work", text: "Physiological and safety needs map to salary and job security; esteem and self-actualization map to recognition and growth — useful for diagnosing motivation gaps." },
  { title: "Onboarding & the 90-Day Plan", text: "The first 90 days set retention odds for the next 3 years. Strong onboarding blends role clarity, relationship-building, and early wins." },
  { title: "HR Business Partner Model", text: "Splits HR into Business Partners (strategy), Centers of Excellence (specialist design), and Shared Services (transactional support) — Ulrich's classic framework." },
  { title: "Diversity, Equity & Inclusion (DEI)", text: "Diversity is representation, equity is fair access to opportunity, inclusion is whether people actually feel they belong once they're in the room." }
];

/* =====================================================================
   Storage
   ===================================================================== */
const USERS_KEY = 'prepdesk_users';
const SESSION_KEY = 'prepdesk_session';
const THEME_KEY = 'prepdesk_theme';

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch (e) { return {}; }
}
function saveUsers(u) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(u)); } catch (e) {}
}
function getSession() { try { return localStorage.getItem(SESSION_KEY); } catch (e) { return null; } }
function setSession(n) { try { localStorage.setItem(SESSION_KEY, n); } catch (e) {} }
function clearSession() { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} }

let users = loadUsers();
let currentUsername = null;
function currentUser() { return users[currentUsername]; }
function persist() { saveUsers(users); }

/* ---------- dates (ISO, zero-padded, local time) ---------- */
function isoDate(d) {
  d = d || new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
function dateFromIso(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function daysBetween(a, b) { return Math.round((dateFromIso(b) - dateFromIso(a)) / 86400000); }
function shiftDays(d, n) { const c = new Date(d); c.setDate(c.getDate() + n); return c; }

/* ---------- make sure older accounts get the newer fields ---------- */
function migrate(u) {
  u = u || {};
  u.customQuotes = Array.isArray(u.customQuotes) ? u.customQuotes : [];
  u.quoteOrder = Array.isArray(u.quoteOrder) ? u.quoteOrder : [];
  u.quotePointer = u.quotePointer || 0;
  u.quoteRounds = u.quoteRounds || 0;
  u.activity = u.activity || {};
  u.cardStats = u.cardStats || {};
  u.milestones = Array.isArray(u.milestones) ? u.milestones : [];
  u.streak = u.streak || 0;
  u.name = u.name || '';
  u.theme = u.theme || localStorage.getItem(THEME_KEY) || 'light';
  if (u.lastVisit && u.lastVisit.length < 10) u.lastVisit = isoDate(new Date(u.lastVisit));
  if (!u.lastVisit) u.lastVisit = null;
  return u;
}

/* =====================================================================
   Screens & toast
   ===================================================================== */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const n = el(id);
  if (n) n.classList.add('active');
  window.scrollTo(0, 0);
}

let toastTimer = null;
function showToast(message) {
  const toast = el('toast');
  if (!toast) return;
  setText('toast-message', message);
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

/* =====================================================================
   DARK MODE
   ===================================================================== */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  document.querySelectorAll('.theme-icon').forEach(n => { n.textContent = theme === 'dark' ? '☀️' : '🌙'; });
  const meta = el('meta-theme-color');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#14161D' : '#FBF7EE');
}

function toggleTheme() {
  const now = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(now);
  const u = currentUser();
  if (u) { u.theme = now; persist(); }
  showToast(now === 'dark' ? 'Desk lamp on — dark mode.' : 'Back to paper — light mode.');
}

document.querySelectorAll('.btn-theme').forEach(b => b.addEventListener('click', toggleTheme));
applyTheme(localStorage.getItem(THEME_KEY) || 'light');

/* =====================================================================
   AUTH
   ===================================================================== */
let mode = 'login';

function setMode(m) {
  mode = m;
  hide('auth-error');
  const on_ = 'flex-1 py-2 rounded-full text-sm font-semibold transition btn-ink';
  const off = 'flex-1 py-2 rounded-full text-sm font-semibold transition text-ink2';
  const tl = el('tab-login'), ts = el('tab-signup'), sub = el('auth-submit');
  if (tl) tl.className = m === 'login' ? on_ : off;
  if (ts) ts.className = m === 'login' ? off : on_;
  if (sub) sub.textContent = m === 'login' ? 'Log in' : 'Create account';
}
on('tab-login', 'click', () => setMode('login'));
on('tab-signup', 'click', () => setMode('signup'));

function showAuthError(msg) {
  setText('auth-error', msg);
  show('auth-error');
}

on('form-auth', 'submit', (e) => {
  e.preventDefault();
  const uEl = el('auth-username'), pEl = el('auth-password');
  const username = uEl ? uEl.value.trim() : '';
  const password = pEl ? pEl.value : '';
  if (!username || !password) return;

  if (mode === 'signup') {
    if (users[username]) { showAuthError('That username is already taken — try logging in instead.'); return; }
    users[username] = migrate({ password });
    persist();
    showToast('Account created successfully!');
    const f = el('form-auth'); if (f) f.reset();
    setMode('login');
  } else {
    const u = users[username];
    if (!u || u.password !== password) {
      showAuthError('No match found. Check your username and password, or sign up.');
      return;
    }
    showToast('Login successful!');
    const f = el('form-auth'); if (f) f.reset();
    setTimeout(() => loginAs(username), 700);
  }
});

function loginAs(username) {
  currentUsername = username;
  users[username] = migrate(users[username]);
  setSession(username);
  applyTheme(currentUser().theme);
  updateStreak();
  if (!currentUser().name) showScreen('screen-name');
  else playWelcome(currentUser().name);
}

on('form-name', 'submit', (e) => {
  e.preventDefault();
  const n = el('name-input');
  const name = n ? n.value.trim() : '';
  if (!name) return;
  currentUser().name = name;
  persist();
  playWelcome(name);
});

function playWelcome(name) {
  setText('welcome-text', `Hello, ${name}`);
  showScreen('screen-welcome');
  setTimeout(enterDashboard, 1400);
}

on('btn-logout', 'click', () => {
  clearSession();
  currentUsername = null;
  const f = el('form-auth'); if (f) f.reset();
  setMode('login');
  showScreen('screen-auth');
});

/* =====================================================================
   STREAK + MILESTONES
   ===================================================================== */
function updateStreak() {
  const u = currentUser();
  if (!u) return;
  const today = isoDate();
  if (!u.lastVisit) u.streak = 1;
  else if (u.lastVisit !== today) {
    const gap = daysBetween(u.lastVisit, today);
    u.streak = (gap === 1) ? (u.streak || 0) + 1 : 1;
  }
  u.lastVisit = today;
  persist();
}

const MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];
function checkMilestone() {
  const u = currentUser();
  if (!u) return;
  const hit = MILESTONES.find(m => u.streak === m && !u.milestones.includes(m));
  if (!hit) return;
  u.milestones.push(hit);
  persist();
  setTimeout(() => {
    confetti();
    showToast(`${hit}-day streak. That is not luck — that is a habit.`);
  }, 900);
}

function confetti() {
  const colors = ['#E8A33D', '#7C9885', '#D96C6C', '#1E2749', '#C9832A'];
  const wrap = document.createElement('div');
  wrap.className = 'confetti';
  for (let i = 0; i < 70; i++) {
    const bit = document.createElement('i');
    bit.style.left = Math.random() * 100 + '%';
    bit.style.background = colors[Math.floor(Math.random() * colors.length)];
    bit.style.setProperty('--d', (1.8 + Math.random() * 1.6) + 's');
    bit.style.setProperty('--dl', (Math.random() * 0.7) + 's');
    bit.style.opacity = 0.75 + Math.random() * 0.25;
    wrap.appendChild(bit);
  }
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 4200);
}

/* =====================================================================
   ACTIVITY LOG + HEATMAP
   ===================================================================== */
function logActivity(points) {
  const u = currentUser();
  if (!u) return;
  const k = isoDate();
  u.activity[k] = (u.activity[k] || 0) + (points || 1);
  persist();
  renderHeatmap();
}

function levelFor(count) {
  if (!count) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

const HM_WEEKS = 26;
function renderHeatmap() {
  const u = currentUser();
  const grid = el('hm-grid');
  const months = el('hm-months');
  if (!u || !grid || !months) return;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  let start = shiftDays(today, -(HM_WEEKS - 1) * 7);
  start = shiftDays(start, -start.getDay());

  grid.innerHTML = '';
  months.innerHTML = '';
  const todayIso = isoDate(today);
  let activeDays = 0;
  const isoSeq = [];

  for (let w = 0; w < HM_WEEKS; w++) {
    let label = '';
    for (let d = 0; d < 7; d++) {
      const day = shiftDays(start, w * 7 + d);
      const cell = document.createElement('div');
      cell.className = 'hm-cell';
      if (day > today) {
        cell.classList.add('is-blank');
      } else {
        const iso = isoDate(day);
        const count = u.activity[iso] || 0;
        if (count > 0) { activeDays++; isoSeq.push(iso); }
        cell.dataset.level = levelFor(count);
        cell.title = count
          ? `${count} action${count > 1 ? 's' : ''} on ${iso}`
          : `Nothing logged on ${iso}`;
        if (iso === todayIso) cell.classList.add('is-today');
      }
      grid.appendChild(cell);
      if (d === 0 && day.getDate() <= 7) label = day.toLocaleString('en', { month: 'short' });
    }
    const m = document.createElement('span');
    m.textContent = label;
    months.appendChild(m);
  }

  let best = 0, run = 0, prev = null;
  isoSeq.sort();
  isoSeq.forEach(iso => {
    run = (prev && daysBetween(prev, iso) === 1) ? run + 1 : 1;
    if (run > best) best = run;
    prev = iso;
  });

  setText('hm-active', activeDays);
  setText('hm-best', best);
}

/* =====================================================================
   DASHBOARD
   ===================================================================== */
function enterDashboard() {
  const u = currentUser();
  if (!u) { showScreen('screen-auth'); return; }
  setText('dash-hello', `Hello, ${u.name}`);
  setText('streak-count', u.streak || 0);
  setText('streak-count-mobile', u.streak || 0);
  nextQuote();
  logActivity(1);
  renderHeatmap();
  renderMastery();
  showScreen('screen-dashboard');
  checkMilestone();
}

/* =====================================================================
   QUOTE ENGINE — shuffle bag, guaranteed no repeats
   ===================================================================== */
function shuffled(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function quotePool(u) {
  const custom = (u.customQuotes || []).map(t => ({ text: t, author: u.name || 'You' }));
  return QUOTE_BANK.concat(custom);
}

function syncBag(u, poolLen) {
  if (!u.quoteOrder.length) { u.quoteOrder = shuffled(poolLen); u.quotePointer = 0; return; }
  if (poolLen > u.quoteOrder.length) {
    for (let i = u.quoteOrder.length; i < poolLen; i++) {
      const from = Math.max(u.quotePointer, 0);
      const pos = from + Math.floor(Math.random() * (u.quoteOrder.length - from + 1));
      u.quoteOrder.splice(pos, 0, i);
    }
  }
  if (poolLen < u.quoteOrder.length) {
    const before = u.quoteOrder.slice(0, u.quotePointer).filter(i => i < poolLen);
    const after = u.quoteOrder.slice(u.quotePointer).filter(i => i < poolLen);
    u.quoteOrder = before.concat(after);
    u.quotePointer = before.length;
  }
}

function nextQuote() {
  const u = currentUser();
  if (!u) return;
  const pool = quotePool(u);
  syncBag(u, pool.length);

  if (u.quotePointer >= u.quoteOrder.length) {
    const last = u.quoteOrder[u.quoteOrder.length - 1];
    u.quoteOrder = shuffled(pool.length);
    if (pool.length > 1 && u.quoteOrder[0] === last) {
      [u.quoteOrder[0], u.quoteOrder[1]] = [u.quoteOrder[1], u.quoteOrder[0]];
    }
    u.quotePointer = 0;
    u.quoteRounds = (u.quoteRounds || 0) + 1;
    showToast(`All ${pool.length} quotes seen — starting round ${u.quoteRounds + 1}.`);
  }

  const q = pool[u.quoteOrder[u.quotePointer]];
  u.quotePointer++;
  persist();

  setText('quote-text', `"${q.text}"`);
  setText('quote-author', `— ${q.author}`);
  setText('quote-progress', ` · ${u.quotePointer}/${u.quoteOrder.length}`);
}

on('btn-new-quote', 'click', () => { nextQuote(); logActivity(1); });

on('form-quote', 'submit', (e) => {
  e.preventDefault();
  const input = el('quote-input');
  const text = input ? input.value.trim() : '';
  if (!text) return;

  const u = currentUser();
  u.customQuotes.push(text);
  input.value = '';

  const pool = quotePool(u);
  const newIndex = pool.length - 1;
  syncBag(u, pool.length);
  u.quoteOrder = u.quoteOrder.filter(i => i !== newIndex);
  u.quoteOrder.splice(u.quotePointer, 0, newIndex);
  persist();

  nextQuote();
  logActivity(1);
  showToast('Saved to your personal quote bank.');
});

/* =====================================================================
   FLIP CARDS
   ===================================================================== */
document.querySelectorAll('.btn-flip-open').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.target;
    const card = el(id);
    if (card) card.classList.add('flipped');
    if (id === 'flip-case') showRandomCase();
    if (id === 'flip-marketing') showRandomMarketing();
    if (id === 'flip-hr') showRandomHr();
    logActivity(1);
  });
});
document.querySelectorAll('.btn-flip-close').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = el(btn.dataset.target);
    if (card) card.classList.remove('flipped');
  });
});
document.querySelectorAll('.btn-new-case').forEach(b => b.addEventListener('click', showRandomCase));
document.querySelectorAll('.btn-new-marketing').forEach(b => b.addEventListener('click', showRandomMarketing));
document.querySelectorAll('.btn-new-hr').forEach(b => b.addEventListener('click', showRandomHr));

function pickDifferent(arr, lastIndex) {
  if (arr.length === 1) return 0;
  let i;
  do { i = Math.floor(Math.random() * arr.length); } while (i === lastIndex);
  return i;
}
let lastCase = -1, lastMkt = -1, lastHr = -1;
function showRandomCase() {
  lastCase = pickDifferent(CASE_STUDIES, lastCase);
  setText('case-text', CASE_STUDIES[lastCase]);
}
function showRandomMarketing() {
  lastMkt = pickDifferent(MARKETING_FRAMEWORKS, lastMkt);
  const f = MARKETING_FRAMEWORKS[lastMkt];
  setText('marketing-title', f.title);
  setText('marketing-text', f.text);
}
function showRandomHr() {
  lastHr = pickDifferent(HR_TOPICS, lastHr);
  const h = HR_TOPICS[lastHr];
  setText('hr-title', h.title);
  setText('hr-text', h.text);
}

/* =====================================================================
   FLASHCARD QUIZ
   Light spaced repetition: a missed card returns 3 places later,
   at most twice, so the round always ends.
   ===================================================================== */
const ALL_CARDS = [
  ...MARKETING_FRAMEWORKS.map((c, i) => ({ id: 'M' + i, deck: 'marketing', label: 'Marketing', ...c })),
  ...HR_TOPICS.map((c, i) => ({ id: 'H' + i, deck: 'hr', label: 'HR', ...c }))
];

const MAX_REQUEUE = 2;
let quizDeck = 'both', quizSize = 6;
let queue = [], results = {}, currentCard = null, totalToDeal = 0;

function openQuizSetup() {
  show('quiz-setup');
  hide('quiz-play');
  hide('quiz-result');
  const o = el('quiz-overlay'); if (o) o.classList.add('open');
}
function closeQuiz() {
  const o = el('quiz-overlay'); if (o) o.classList.remove('open');
  renderMastery();
  renderHeatmap();
}

on('btn-quiz-start', 'click', openQuizSetup);
on('btn-quiz-repeat', 'click', openQuizSetup);
document.querySelectorAll('.btn-quiz-exit').forEach(b => b.addEventListener('click', closeQuiz));

const overlayEl = el('quiz-overlay');
if (overlayEl) overlayEl.addEventListener('click', e => { if (e.target === overlayEl) closeQuiz(); });
document.addEventListener('keydown', e => {
  const o = el('quiz-overlay');
  if (e.key === 'Escape' && o && o.classList.contains('open')) closeQuiz();
});

document.querySelectorAll('.deck-chip').forEach(c => c.addEventListener('click', () => {
  document.querySelectorAll('.deck-chip').forEach(x => x.classList.remove('active'));
  c.classList.add('active');
  quizDeck = c.dataset.deck;
}));
document.querySelectorAll('.size-chip').forEach(c => c.addEventListener('click', () => {
  document.querySelectorAll('.size-chip').forEach(x => x.classList.remove('active'));
  c.classList.add('active');
  quizSize = Number(c.dataset.size);
}));

on('btn-quiz-go', 'click', startQuiz);

function startQuiz() {
  const u = currentUser();
  if (!u) return;
  let pool = ALL_CARDS.filter(c => quizDeck === 'both' || c.deck === quizDeck);

  // weakest cards first, random inside each tier
  pool = pool
    .map(c => ({ c, score: (u.cardStats[c.id] && u.cardStats[c.id].streak) || 0, r: Math.random() }))
    .sort((a, b) => a.score - b.score || a.r - b.r)
    .map(x => x.c);

  const n = quizSize === 0 ? pool.length : Math.min(quizSize, pool.length);
  queue = pool.slice(0, n).map(c => Object.assign({}, c, { rq: 0 }));
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }

  results = {};
  totalToDeal = n;
  hide('quiz-setup');
  hide('quiz-result');
  show('quiz-play');
  nextCard();
}

function nextCard() {
  if (!queue.length) return finishQuiz();
  currentCard = queue.shift();

  setText('quiz-deck-tag', currentCard.label);
  setText('quiz-front', currentCard.title);
  setText('quiz-answer', currentCard.text);
  hide('quiz-back');
  hide('quiz-grade');
  const g = el('quiz-grade'); if (g) g.classList.remove('grid');
  show('btn-reveal');

  const seen = Object.keys(results).length;
  setText('quiz-counter', `Card ${seen + 1} · ${totalToDeal} in this round`);
  const bar = el('quiz-bar');
  if (bar) bar.style.width = Math.round((seen / totalToDeal) * 100) + '%';
}

on('btn-reveal', 'click', () => {
  show('quiz-back');
  hide('btn-reveal');
  show('quiz-grade');
  const g = el('quiz-grade'); if (g) g.classList.add('grid');
});

function grade(knew) {
  const u = currentUser();
  const id = currentCard.id;
  const st = u.cardStats[id] || { seen: 0, correct: 0, streak: 0 };
  st.seen++;
  if (knew) { st.correct++; st.streak++; } else { st.streak = 0; }
  u.cardStats[id] = st;
  persist();

  if (!(id in results)) results[id] = knew;

  if (!knew && currentCard.rq < MAX_REQUEUE) {
    currentCard.rq++;
    queue.splice(Math.min(3, queue.length), 0, currentCard);
  }

  logActivity(1);
  nextCard();
}
on('btn-knew', 'click', () => grade(true));
on('btn-again', 'click', () => grade(false));

function finishQuiz() {
  const ids = Object.keys(results);
  const got = ids.filter(id => results[id]).length;
  const total = ids.length;
  const pct = total ? got / total : 0;

  hide('quiz-play');
  show('quiz-result');
  setText('result-score', `${got} / ${total}`);

  let emoji = '📘', line = "Every miss you just found is a mark you won't lose later.";
  if (pct === 1) { emoji = '🏆'; line = 'Clean sweep. These are yours now.'; confetti(); }
  else if (pct >= 0.75) { emoji = '🎯'; line = 'Strong recall. Just a couple of soft spots left.'; }
  else if (pct >= 0.5) { emoji = '📈'; line = 'Halfway solid. Run the same deck again tomorrow.'; }

  setText('result-emoji', emoji);
  setText('result-line', line);

  const weak = ids.filter(id => !results[id]).map(id => ALL_CARDS.find(c => c.id === id).title);
  const list = el('result-weak-list');
  if (list) {
    list.innerHTML = '';
    weak.forEach(t => { const li = document.createElement('li'); li.textContent = t; list.appendChild(li); });
  }
  if (weak.length) show('result-weak'); else hide('result-weak');

  renderMastery();
  renderHeatmap();
}

function renderMastery() {
  const u = currentUser();
  if (!u) return;
  const mastered = ALL_CARDS.filter(c => (u.cardStats[c.id] || {}).streak >= 2).length;
  const pct = Math.round((mastered / ALL_CARDS.length) * 100);
  setText('mastery-label', `${mastered} / ${ALL_CARDS.length} topics`);
  const bar = el('mastery-bar');
  if (bar) bar.style.width = pct + '%';
}

/* =====================================================================
   HELP DESK
   ===================================================================== */
on('form-helpdesk', 'submit', (e) => {
  e.preventDefault();
  const box = el('helpdesk-msg');
  const msg = box ? box.value.trim() : '';
  if (!msg) return;
  const u = currentUser();
  const email = getComputedStyle(document.documentElement)
    .getPropertyValue('--help-desk-email').replace(/["']/g, '').trim();
  const subject = encodeURIComponent(`Prep Desk suggestion from ${u ? u.name : 'a user'}`);
  const body = encodeURIComponent(`${msg}\n\n— sent from Prep Desk`);
  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  show('helpdesk-status');
  box.value = '';
});

/* =====================================================================
   ONE-TIME CLEANUP
   The app used to register a service worker. If you ever opened the
   hosted version before, that old worker is STILL installed in the
   browser and will keep serving stale files. This removes it.
   Safe to delete this block after a few days.
   ===================================================================== */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(rs => rs.forEach(r => r.unregister()))
    .catch(() => {});
  if (window.caches && caches.keys) {
    caches.keys().then(ks => ks.forEach(k => caches.delete(k))).catch(() => {});
  }
}

/* =====================================================================
   BOOT
   ===================================================================== */
(function init() {
  setMode('login');
  const session = getSession();
  if (session && users[session]) {
    currentUsername = session;
    users[session] = migrate(users[session]);
    applyTheme(currentUser().theme);
    updateStreak();
    enterDashboard();
  } else {
    clearSession();
    showScreen('screen-auth');
  }
})();