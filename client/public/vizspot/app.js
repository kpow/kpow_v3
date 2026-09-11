// vizSpot phone wizard: connect a board to the user's own Spotify app.
// Flow: code (QR fragment or typed) -> find board via relay -> create Spotify app
// -> Client ID -> PKCE sign-in -> check account -> encrypt for the board -> relay.
// The refresh token lives in memory only; nothing readable ever reaches the server.
import { derive, seal, open, pkce, SECRET_RE, normalizeSecret } from './crypto.js';

const REDIRECT = location.hostname === '127.0.0.1' ? `${location.origin}/vizspot/` : 'https://kpow.xyz/vizspot/';
const SCOPES = 'user-read-currently-playing user-read-playback-state user-read-recently-played user-modify-playback-state';
const CID_RE = /^[0-9a-f]{32}$/;
const LS = { pair: 'vizspot.pair', pkce: 'vizspot.pkce', cid: 'vizspot.cid' };
const PAIR_MAX_AGE = 2 * 3600e3;
const PKCE_MAX_AGE = 15 * 60e3;

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

let S = null;        // pairing secret
let ids = null;      // { id, key } derived from S
let tokens = null;   // { access, refresh, cid } in memory only
let timer = null;

function show(screen) {
  clearTimeout(timer);
  document.querySelectorAll('[data-screen]').forEach((el) => { el.hidden = el.dataset.screen !== screen; });
  window.scrollTo(0, 0);
}
function msg(id, text, kind = '') { const el = $(id); el.textContent = text || ''; el.className = `msg ${kind}`; }
function step(name, state) { $(`step-${name}`).className = state; }
const grouped = (s) => `${s.slice(0, 4)} ${s.slice(4, 8)} ${s.slice(8, 12)} ${s.slice(12)}`;

async function relay(method, body) {
  const r = await fetch(`/api/vizspot/pair/${ids.id}`, {
    method, cache: 'no-store',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, ...(await r.json().catch(() => ({}))) };
}

async function setPair(secret) {
  S = secret;
  ids = await derive(S);
  store.set(LS.pair, { s: S, at: Date.now() });
  $('code-shown').textContent = grouped(S);
}

// ---------------------------------------------------------------- entry --

async function boot() {
  if (location.hostname === 'www.kpow.xyz') {
    location.replace(`https://kpow.xyz${location.pathname}${location.search}${location.hash}`);
    return;
  }
  $('redirect-uri').textContent = REDIRECT;
  const q = new URLSearchParams(location.search);
  if (q.has('code') || q.has('error')) {
    const code = q.get('code'), err = q.get('error'), state = q.get('state');
    history.replaceState(null, '', '/vizspot/');
    return callback(code, err, state);
  }
  const fromHash = normalizeSecret(decodeURIComponent(location.hash.slice(1)));
  if (SECRET_RE.test(fromHash)) {
    history.replaceState(null, '', '/vizspot/');   // keep the secret out of history and screenshots
    await setPair(fromHash);
    return landing();
  }
  const saved = store.get(LS.pair);
  if (saved && SECRET_RE.test(saved.s) && Date.now() - saved.at < PAIR_MAX_AGE) {
    await setPair(saved.s);
    return landing();
  }
  show('enter');
}

$('enter-go').onclick = async () => {
  const s = normalizeSecret($('enter-code').value);
  if (!SECRET_RE.test(s)) {
    return msg('enter-msg', "That doesn't look right. The code is 16 letters and numbers, shown in two lines on the board.", 'err');
  }
  msg('enter-msg', '');
  await setPair(s);
  landing();
};
$('enter-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('enter-go').click(); });

async function landing() {
  show('landing');
  let r;
  try { r = await relay('GET'); } catch {
    msg('landing-msg', 'No connection. Retrying…', 'err');
    timer = setTimeout(landing, 5000);
    return;
  }
  if (r.status === 404) {
    msg('landing-msg', "Waiting for your board to check in… Make sure it's plugged in and showing this code. If it has been showing the code for a long time, unplug it and plug it back in.");
    timer = setTimeout(landing, 5000);
    return;
  }
  if (r.status !== 200) {
    msg('landing-msg', `Couldn't reach the relay (${r.status}). Retrying…`, 'err');
    timer = setTimeout(landing, 5000);
    return;
  }
  if (r.state === 'done') return show('already');
  if (tokens) return sendToBoard();   // rescanned in this tab after a failure: no need to sign in again
  let cid = store.get(LS.cid);
  if (r.hint) {
    try { const h = await open(ids.key, 'hint', ids.id, r.hint); if (CID_RE.test(h.c)) { cid = h.c; store.set(LS.cid, cid); } } catch {}
  }
  if (cid) return show('welcome');
  show('premium');
}

// --------------------------------------------------------------- set up --

$('welcome-go').onclick = () => connect(store.get(LS.cid));
$('welcome-other').onclick = () => show('premium');
$('premium-go').onclick = () => show('create');
$('create-go').onclick = () => { $('cid-input').value = store.get(LS.cid) || ''; show('cid'); };
$('connect-back').onclick = () => { $('cid-input').value = store.get(LS.cid) || ''; show('cid'); };
$('connect-go').onclick = () => connect(store.get(LS.cid));

$('copy-redirect').onclick = async () => {
  const btn = $('copy-redirect');
  try {
    await navigator.clipboard.writeText(REDIRECT);
    btn.textContent = 'Copied';
  } catch {
    const range = document.createRange(); range.selectNodeContents($('redirect-uri'));
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
    btn.textContent = 'Selected: tap Copy in the menu';
  }
  setTimeout(() => { btn.textContent = 'Copy'; }, 2500);
};

$('cid-paste').onclick = async () => {
  try { $('cid-input').value = (await navigator.clipboard.readText()).trim(); validateCid(); }
  catch { msg('cid-msg', 'Your browser blocked pasting. Long-press the box and choose Paste.', 'err'); }
};
$('cid-input').addEventListener('input', validateCid);
function validateCid() {
  const v = $('cid-input').value.trim().toLowerCase();
  if (!v) return msg('cid-msg', '');
  msg('cid-msg', CID_RE.test(v) ? 'Looks right.' : "That doesn't look like a Client ID yet: it's 32 letters and numbers.", CID_RE.test(v) ? '' : 'err');
}
$('cid-go').onclick = () => {
  const v = $('cid-input').value.trim().toLowerCase();
  if (!CID_RE.test(v)) return msg('cid-msg', "That doesn't look like a Client ID: it's 32 letters and numbers, from your app's Settings.", 'err');
  store.set(LS.cid, v);
  show('connect');
};

// -------------------------------------------------------------- sign in --

async function connect(cid, forceDialog = false) {
  if (!CID_RE.test(cid || '')) { $('cid-input').value = ''; return show('cid'); }
  const p = await pkce();
  store.set(LS.pkce, { state: p.state, verifier: p.verifier, cid, s: S, at: Date.now() });
  const u = new URL('https://accounts.spotify.com/authorize');
  u.search = new URLSearchParams({
    client_id: cid, response_type: 'code', redirect_uri: REDIRECT, scope: SCOPES,
    code_challenge_method: 'S256', code_challenge: p.challenge, state: p.state,
    ...(forceDialog ? { show_dialog: 'true' } : {}),
  }).toString();
  location.assign(u.toString());
}

async function callback(code, err, state) {
  show('progress');
  ['signin', 'check', 'send', 'board'].forEach((n) => step(n, ''));
  step('signin', 'doing');
  const saved = store.get(LS.pkce);
  if (err) return fail(err === 'access_denied' ? 'You tapped Cancel on Spotify.' : `Spotify said: ${err}`, 'connect-again', saved?.cid);
  if (!saved || saved.state !== state || Date.now() - saved.at > PKCE_MAX_AGE) {
    return fail("Spotify sent you back to a different browser than the one you started in. Open your camera, scan the board again, and tap Connect. You're already signed in to Spotify, so it only takes a few seconds.", 'enter');
  }
  store.del(LS.pkce);
  await setPair(saved.s);

  let t;
  try {
    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT, client_id: saved.cid, code_verifier: saved.verifier }),
    });
    t = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (t.error === 'invalid_client') return fail("Spotify doesn't recognise that Client ID. Check it against your app's Settings.", 'fix-cid');
      if (/redirect/i.test(t.error_description || '')) return fail(`Spotify says the Redirect URI doesn't match. In your app's settings it must be exactly ${REDIRECT}`, 'fix-redirect');
      if (t.error === 'invalid_grant') return fail('That sign-in was already used or took too long. Tap Connect again.', 'connect-again', saved.cid);
      return fail(`Spotify refused the sign-in (${t.error || r.status}). Tap Connect again.`, 'connect-again', saved.cid);
    }
  } catch {
    return fail('No connection. Check your internet, then tap Connect again.', 'connect-again', saved.cid);
  }
  if (!t.refresh_token) return fail("Spotify didn't send everything the board needs. Tap Connect again.", 'connect-again', saved.cid);
  tokens = { access: t.access_token, refresh: t.refresh_token, cid: saved.cid };
  store.set(LS.cid, saved.cid);
  step('signin', 'done');
  step('check', 'doing');

  let ok = await checkAccount();
  if (ok === 429) { await sleep(2500); ok = await checkAccount(); }
  if (ok !== true) return;
  step('check', 'done');
  sendToBoard();
}

// Spotify returns 403 when this account can't use the app (not the owner, or no
// Premium). Catch it here so the board never receives credentials that won't work.
async function checkAccount() {
  try {
    const r = await fetch('https://api.spotify.com/v1/me/player/currently-playing', { headers: { Authorization: `Bearer ${tokens.access}` } });
    if (r.status === 200 || r.status === 204) return true;
    if (r.status === 429) return 429;
    const m = ((await r.json().catch(() => ({}))).error || {}).message || '';
    const cid = tokens.cid;
    tokens = null;
    if (r.status === 403 && /premium/i.test(m)) { fail('The Spotify account that created the app needs Premium.', 'none'); return false; }
    if (r.status === 403) { fail('Spotify only lets the account that created the app use it. Sign in with the same account you used on Spotify for Developers.', 'switch-account', cid); return false; }
    fail(`Spotify rejected the sign-in (${r.status}${m ? `: ${m}` : ''}). Try again.`, 'connect-again', cid);
    return false;
  } catch {
    fail('No connection. Tap Connect again.', 'connect-again', tokens?.cid);
    return false;
  }
}

// --------------------------------------------------------------- handoff --

async function sendToBoard() {
  show('progress');
  step('signin', 'done'); step('check', 'done'); step('send', 'doing'); step('board', '');
  let envelope;
  try { envelope = await seal(ids.key, 'creds', ids.id, { c: tokens.cid, r: tokens.refresh, t: Math.floor(Date.now() / 1000) }); }
  catch { return fail('Could not encrypt the sign-in for your board.', 'enter'); }
  let r;
  try { r = await relay('PUT', { payload: envelope }); } catch { return fail('No connection. Tap Try again.', 'retry-send'); }
  if (r.status === 404) return fail("This code expired, or the board went offline. Check it's showing a code, then scan it again. You won't have to sign in again in this tab.", 'enter');
  if (r.status === 409) { tokens = null; return show('already'); }
  if (r.status !== 200) return fail(`The relay had a problem (${r.status}). Tap Try again.`, 'retry-send');
  step('send', 'done');
  step('board', 'doing');
  pollBoard(Date.now());
}

async function pollBoard(started) {
  let r;
  try { r = await relay('GET'); } catch { timer = setTimeout(() => pollBoard(started), 3000); return; }
  if (r.status === 404) return fail('The code expired before the board picked it up. Scan the board again.', 'enter');
  if (r.state === 'done') { tokens = null; store.del(LS.pair); step('board', 'done'); return show('done'); }
  if (r.state === 'failed') return fail(`Your board couldn't connect: ${r.error || 'unknown error'}.`, 'connect-again', tokens?.cid);
  // The board stops checking in once it has connected. If its final "ok" got lost,
  // "checking" plus a board that has been silent longer than its worst case (60 s
  // verify + ~15 s of ack retries) almost always means it worked. Say so instead of hanging.
  if (r.state === 'checking' && r.board_age_s > 75) return show('likely-done');
  if (Date.now() - started > 15 * 60e3) return fail("Still waiting after 15 minutes. Check the board is on and showing the code, then tap Try again.", 'retry-send');
  msg('progress-msg',
    r.state === 'checking' ? 'Your board has the sign-in and is contacting Spotify…'
      : r.board_age_s > 60 ? 'Your board checks in less often after it has waited a while. Unplug it and plug it back in to hurry it up.'
        : 'Waiting for your board to pick it up…');
  timer = setTimeout(() => pollBoard(started), 2000);
}

// ---------------------------------------------------------------- errors --

function fail(text, action, cid) {
  show('error');
  msg('error-msg', text, 'err');
  const actions = {
    'connect-again': ['Connect again', () => connect(cid || store.get(LS.cid))],
    'switch-account': ['Sign in with a different account', () => connect(cid || store.get(LS.cid), true)],
    'fix-cid': ['Fix the Client ID', () => { $('cid-input').value = store.get(LS.cid) || ''; show('cid'); }],
    'fix-redirect': ['Show the setup steps', () => show('create')],
    'retry-send': ['Try again', () => (tokens ? sendToBoard() : landing())],
    'enter': ['Enter the board code', () => show('enter')],
  };
  const btn = $('error-action');
  const a = actions[action];
  btn.hidden = !a;
  if (a) { btn.textContent = a[0]; btn.onclick = a[1]; }
}

window.addEventListener('hashchange', boot);
boot();
