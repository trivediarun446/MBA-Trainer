/* =====================================================================
   Prep Desk — app logic
   Requires quotes.js to be loaded BEFORE this file.
   ===================================================================== */

// Fallback bank — used only if quotes.js failed to load
const DEFAULT_QUOTES = [
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Unknown" },
  { text: "A goal without a plan is just a wish.", author: "Antoine de Saint-Exupéry" },
  { text: "Progress, not perfection.", author: "Unknown" }
];

// The real bank (300 quotes) comes from quotes.js
const QUOTE_BANK = (typeof MOTIVATION_QUOTES !== 'undefined' && MOTIVATION_QUOTES.length)
  ? MOTIVATION_QUOTES
  : DEFAULT_QUOTES;

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

// ---------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------
const USERS_KEY = 'prepdesk_users';
const SESSION_KEY = 'prepdesk_session';

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
  catch (e) { return {}; }
}
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
function getSession() { return localStorage.getItem(SESSION_KEY); }
function setSession(username) { localStorage.setItem(SESSION_KEY, username); }
function clearSession() { localStorage.removeItem(SESSION_KEY); }

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}
function daysBetween(a, b) {
  const A = new Date(a), B = new Date(b);
  return Math.round((B - A) / 86400000);
}

let users = loadUsers();
let currentUsername = null;

function currentUser() { return users[currentUsername]; }
function persist() { saveUsers(users); }

// ---------------------------------------------------------------
// Screen switching
// ---------------------------------------------------------------
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ---------------------------------------------------------------
// Toast / popup
// ---------------------------------------------------------------
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-message').textContent = message;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ---------------------------------------------------------------
// Auth
// ---------------------------------------------------------------
let mode = 'login';
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const authSubmit = document.getElementById('auth-submit');
const authError = document.getElementById('auth-error');

function setMode(m) {
  mode = m;
  authError.classList.add('hidden');
  if (m === 'login') {
    tabLogin.className = 'flex-1 py-2 rounded-full text-sm font-semibold transition bg-ink text-paper';
    tabSignup.className = 'flex-1 py-2 rounded-full text-sm font-semibold transition text-ink2';
    authSubmit.textContent = 'Log in';
  } else {
    tabSignup.className = 'flex-1 py-2 rounded-full text-sm font-semibold transition bg-ink text-paper';
    tabLogin.className = 'flex-1 py-2 rounded-full text-sm font-semibold transition text-ink2';
    authSubmit.textContent = 'Create account';
  }
}
tabLogin.addEventListener('click', () => setMode('login'));
tabSignup.addEventListener('click', () => setMode('signup'));

function showAuthError(msg) {
  authError.textContent = msg;
  authError.classList.remove('hidden');
}

document.getElementById('form-auth').addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;
  if (!username || !password) return;

  if (mode === 'signup') {
    if (users[username]) {
      showAuthError('That username is already taken — try logging in instead.');
      return;
    }
    users[username] = {
      password, name: '', streak: 0, lastVisit: null,
      customQuotes: [],
      quoteOrder: [], quotePointer: 0, quoteRounds: 0
    };
    persist();
    showToast('Account created successfully!');
    document.getElementById('form-auth').reset();
    setMode('login');
  } else {
    const u = users[username];
    if (!u || u.password !== password) {
      showAuthError('No match found. Check your username and password, or sign up.');
      return;
    }
    showToast('Login successful!');
    document.getElementById('form-auth').reset();
    setTimeout(() => loginAs(username), 700);
  }
});

function loginAs(username) {
  currentUsername = username;
  setSession(username);
  updateStreak();
  const u = currentUser();
  if (!u.name) showScreen('screen-name');
  else playWelcome(u.name);
}

document.getElementById('form-name').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('name-input').value.trim();
  if (!name) return;
  currentUser().name = name;
  persist();
  playWelcome(name);
});

function playWelcome(name) {
  document.getElementById('welcome-text').textContent = `Hello, ${name}`;
  showScreen('screen-welcome');
  setTimeout(() => enterDashboard(), 1400);
}

// ---------------------------------------------------------------
// Streak logic
// ---------------------------------------------------------------
function updateStreak() {
  const u = currentUser();
  const today = todayStr();
  if (!u.lastVisit) {
    u.streak = 1;
  } else if (u.lastVisit === today) {
    // already counted today
  } else {
    const gap = daysBetween(u.lastVisit, today);
    u.streak = (gap === 1) ? (u.streak || 0) + 1 : 1;
  }
  u.lastVisit = today;
  persist();
}

// ---------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------
function enterDashboard() {
  const u = currentUser();
  document.getElementById('dash-hello').textContent = `Hello, ${u.name}`;
  document.getElementById('streak-count').textContent = u.streak || 0;
  document.getElementById('streak-count-mobile').textContent = u.streak || 0;
  nextQuote();
  showScreen('screen-dashboard');
}

document.getElementById('btn-logout').addEventListener('click', () => {
  clearSession();
  currentUsername = null;
  document.getElementById('form-auth').reset();
  setMode('login');
  showScreen('screen-auth');
});

/* =====================================================================
   QUOTE ENGINE — guaranteed no repeats
   ---------------------------------------------------------------------
   How it works (the "shuffle bag" method):
     1. All quote indexes are shuffled once into a random order.
     2. That order + a pointer are saved per user in localStorage.
     3. Every "New quote" click moves the pointer forward by one.
     4. A quote can therefore NEVER reappear until all 300 are used.
     5. When the bag empties, it reshuffles for a fresh round and the
        user is told. The first quote of the new round is never the same
        as the last one of the old round.
     6. Quotes you add yourself are slipped into the unseen part of the
        bag, so they also obey the no-repeat rule.
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

// Make sure the bag exists and covers every quote currently in the pool
function syncBag(u, poolLen) {
  if (!Array.isArray(u.quoteOrder) || u.quoteOrder.length === 0) {
    u.quoteOrder = shuffled(poolLen);
    u.quotePointer = 0;
    u.quoteRounds = u.quoteRounds || 0;
    return;
  }
  // pool grew (new custom quotes) → drop the new indexes into the unseen part
  if (poolLen > u.quoteOrder.length) {
    for (let i = u.quoteOrder.length; i < poolLen; i++) {
      const from = Math.max(u.quotePointer, 0);
      const pos = from + Math.floor(Math.random() * (u.quoteOrder.length - from + 1));
      u.quoteOrder.splice(pos, 0, i);
    }
  }
  // pool shrank → strip out indexes that no longer exist
  if (poolLen < u.quoteOrder.length) {
    const before = u.quoteOrder.slice(0, u.quotePointer).filter(i => i < poolLen);
    const after = u.quoteOrder.slice(u.quotePointer).filter(i => i < poolLen);
    u.quoteOrder = before.concat(after);
    u.quotePointer = before.length;
  }
}

function renderQuote(q, seen, total) {
  document.getElementById('quote-text').textContent = `"${q.text}"`;
  document.getElementById('quote-author').textContent = `— ${q.author}`;
  const prog = document.getElementById('quote-progress');
  if (prog) prog.textContent = ` · ${seen}/${total}`;
}

function nextQuote() {
  const u = currentUser();
  if (!u) return;
  const pool = quotePool(u);
  syncBag(u, pool.length);

  // bag empty → reshuffle for a new round
  if (u.quotePointer >= u.quoteOrder.length) {
    const lastIdx = u.quoteOrder[u.quoteOrder.length - 1];
    u.quoteOrder = shuffled(pool.length);
    // don't let the new round open with the quote that just closed the old one
    if (pool.length > 1 && u.quoteOrder[0] === lastIdx) {
      [u.quoteOrder[0], u.quoteOrder[1]] = [u.quoteOrder[1], u.quoteOrder[0]];
    }
    u.quotePointer = 0;
    u.quoteRounds = (u.quoteRounds || 0) + 1;
    showToast(`All ${pool.length} quotes seen — starting round ${u.quoteRounds + 1}.`);
  }

  const q = pool[u.quoteOrder[u.quotePointer]];
  u.quotePointer++;
  persist();
  renderQuote(q, u.quotePointer, u.quoteOrder.length);
}

document.getElementById('btn-new-quote').addEventListener('click', nextQuote);

// Add your own quote → shown immediately, and marked as already seen
document.getElementById('form-quote').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('quote-input');
  const text = input.value.trim();
  if (!text) return;

  const u = currentUser();
  u.customQuotes = u.customQuotes || [];
  u.customQuotes.push(text);
  input.value = '';

  const pool = quotePool(u);
  const newIndex = pool.length - 1;
  syncBag(u, pool.length);
  // pull the brand-new quote to the front of the unseen section, then show it
  u.quoteOrder = u.quoteOrder.filter(i => i !== newIndex);
  u.quoteOrder.splice(u.quotePointer, 0, newIndex);
  persist();

  nextQuote();
  showToast('Saved to your personal quote bank.');
});

// ---------------------------------------------------------------
// Flip cards
// ---------------------------------------------------------------
document.querySelectorAll('.btn-flip-open').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.target;
    document.getElementById(id).classList.add('flipped');
    if (id === 'flip-case') showRandomCase();
    if (id === 'flip-marketing') showRandomMarketing();
    if (id === 'flip-hr') showRandomHr();
  });
});
document.querySelectorAll('.btn-flip-close').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById(btn.dataset.target).classList.remove('flipped');
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
  document.getElementById('case-text').textContent = CASE_STUDIES[lastCase];
}
function showRandomMarketing() {
  lastMkt = pickDifferent(MARKETING_FRAMEWORKS, lastMkt);
  const f = MARKETING_FRAMEWORKS[lastMkt];
  document.getElementById('marketing-title').textContent = f.title;
  document.getElementById('marketing-text').textContent = f.text;
}
function showRandomHr() {
  lastHr = pickDifferent(HR_TOPICS, lastHr);
  const h = HR_TOPICS[lastHr];
  document.getElementById('hr-title').textContent = h.title;
  document.getElementById('hr-text').textContent = h.text;
}

// ---------------------------------------------------------------
// Help desk
// ---------------------------------------------------------------
document.getElementById('form-helpdesk').addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = document.getElementById('helpdesk-msg').value.trim();
  if (!msg) return;
  const u = currentUser();
  const email = getComputedStyle(document.documentElement)
    .getPropertyValue('--help-desk-email').replace(/["']/g, '').trim();
  const subject = encodeURIComponent(`Prep Desk suggestion from ${u.name}`);
  const body = encodeURIComponent(`${msg}\n\n— sent from Prep Desk`);
  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  document.getElementById('helpdesk-status').classList.remove('hidden');
  document.getElementById('helpdesk-msg').value = '';
});

// ---------------------------------------------------------------
// Boot
// ---------------------------------------------------------------
(function init() {
  const session = getSession();
  if (session && users[session]) {
    currentUsername = session;
    updateStreak();
    enterDashboard();
  } else {
    showScreen('screen-auth');
  }
})();
