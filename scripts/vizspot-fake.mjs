// Stand-ins for either side of vizSpot pairing, plus a contract test for the relay.
//   node scripts/vizspot-fake.mjs contract <base>                         full state sequence + error codes
//   node scripts/vizspot-fake.mjs board    <base> <S>                     poll like a board, decrypt, ack ok
//   node scripts/vizspot-fake.mjs wizard   <base> <S> <client_id> <refresh>   seal + PUT like the phone, watch state
// <base> is e.g. http://localhost:5000 or https://kpow.xyz. The board must poll before the wizard can PUT.
import { derive, seal, open } from '../client/public/vizspot/crypto.js';

const [, , mode, base, ...rest] = process.argv;
if (!mode || !base) { console.error('usage: contract|board|wizard <base> ...'); process.exit(2); }

const api = (id) => `${base.replace(/\/$/, '')}/api/vizspot/pair/${id}`;
const j = async (r) => ({ status: r.status, body: await r.json().catch(() => null) });
const post = (id, body) => fetch(api(id), { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'ESP32HTTPClient' }, body: JSON.stringify(body) }).then(j);
const get = (id) => fetch(api(id)).then(j);
const put = (id, body) => fetch(api(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(j);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';   // Crockford base32, same as the board
const randomSecret = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => ALPHA[b & 31]).join('');

if (mode === 'contract') {
  let failed = 0;
  const expect = (label, got, want) => {
    const ok = got === want;
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${JSON.stringify(got)}${ok ? '' : `  (want ${JSON.stringify(want)})`}`);
  };
  const S = randomSecret(); const { id, key } = await derive(S);
  const env = await seal(key, 'creds', id, { c: '0123456789abcdef0123456789abcdef', r: 'fake-refresh', t: Math.floor(Date.now() / 1000) });

  expect('GET unknown id -> 404', (await get(id)).status, 404);
  expect('board POST creates row', (await post(id, {})).status, 200);
  expect('wizard GET -> waiting', (await get(id)).body?.state, 'waiting');
  expect('wizard PUT -> 200', (await put(id, { payload: env })).status, 200);
  expect('GET -> sent', (await get(id)).body?.state, 'sent');
  const claim = await post(id, {});
  expect('board POST gets payload', typeof claim.body?.payload, 'string');
  expect('payload decrypts on board side', claim.body?.payload ? (await open(key, 'creds', id, claim.body.payload)).r : null, 'fake-refresh');
  expect('fast flag (phone seen)', claim.body?.fast, true);
  expect('GET -> checking', (await get(id)).body?.state, 'checking');
  expect('payload handed over only once', (await post(id, {})).body?.payload, null);
  expect('board ack ok -> 200', (await post(id, { ack: 'ok' })).status, 200);
  expect('GET -> done', (await get(id)).body?.state, 'done');
  expect('PUT after done -> 409', (await put(id, { payload: env })).status, 409);

  const S2 = randomSecret(); const d2 = await derive(S2);
  await post(d2.id, {}); await put(d2.id, { payload: env }); await post(d2.id, {});
  expect('board ack err -> 200', (await post(d2.id, { ack: 'err:test failure' })).status, 200);
  const f = await get(d2.id);
  expect('GET -> failed', f.body?.state, 'failed');
  expect('failed carries board error', f.body?.error, 'test failure');
  expect('retry PUT after failure -> 200', (await put(d2.id, { payload: env })).status, 200);
  expect('GET -> sent again', (await get(d2.id)).body?.state, 'sent');

  expect('bad id -> 400', (await get('not-an-id')).status, 400);
  expect('bad payload -> 400', (await put(id, { payload: 'short' })).status, 400);
  expect('bad ack -> 400', (await post(id, { ack: 'nope' })).status, 400);
  const big = await fetch(api(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payload: 'A'.repeat(5000) }) });
  expect('oversize body -> 413', big.status, 413);
  const nc = await get(id);
  expect('no-store on responses', (await fetch(api(id))).headers.get('cache-control'), 'no-store');
  console.log(failed ? `\n${failed} FAILED` : '\nall passed');
  process.exitCode = failed ? 1 : 0;
} else if (mode === 'board') {
  const [S] = rest; const { id, key } = await derive(S);
  console.log(`board id ${id}  (QR: https://kpow.xyz/vizspot/#${S})`);
  for (;;) {
    const r = await post(id, {});
    if (r.body?.payload) {
      const creds = await open(key, 'creds', id, r.body.payload);
      console.log('received credentials for client', creds.c);
      console.log('ack ->', (await post(id, { ack: 'ok' })).status);
      break;
    }
    await sleep(r.body?.fast ? 2000 : 3000);
  }
} else if (mode === 'wizard') {
  const [S, c, r] = rest; const { id, key } = await derive(S);
  console.log('status', (await get(id)).body);
  const env = await seal(key, 'creds', id, { c, r, t: Math.floor(Date.now() / 1000) });
  console.log('PUT ->', (await put(id, { payload: env })).status);
  for (let i = 0; i < 60; i++) {
    const s = (await get(id)).body;
    console.log('state', s?.state, s?.error || '');
    if (s?.state === 'done' || s?.state === 'failed') break;
    await sleep(2000);
  }
} else {
  console.error('unknown mode'); process.exit(2);
}
