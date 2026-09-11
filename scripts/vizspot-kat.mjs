// Known-answer vectors for vizSpot pairing crypto. The board's
// pair_crypto_selftest() embeds this output, so both sides provably agree.
//   node scripts/vizspot-kat.mjs                          print vectors + self-checks
//   node scripts/vizspot-kat.mjs open <S> <kind> <env>    decrypt a board-sealed envelope
import { derive, seal, open } from '../client/public/vizspot/crypto.js';

const [, , cmd, ...args] = process.argv;

if (cmd === 'open') {
  const [S, kind, env] = args;
  const { key, id } = await derive(S);
  console.log(JSON.stringify(await open(key, kind, id, env)));
} else {
  const S = 'AAAAAAAAAAAAAAAA';
  const IV = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const { id, keyHex, key } = await derive(S);
  const creds = { c: '0123456789abcdef0123456789abcdef', r: 'test-refresh-token', t: 1 };
  const hint = { c: '0123456789abcdef0123456789abcdef' };
  const credsEnv = await seal(key, 'creds', id, creds, IV);
  const hintEnv = await seal(key, 'hint', id, hint, IV);

  const back = await open(key, 'creds', id, credsEnv);
  if (back.r !== creds.r) throw new Error('round trip failed');
  const bad = Buffer.from(credsEnv, 'base64'); bad[20] ^= 1;
  let tamper = false; try { await open(key, 'creds', id, bad.toString('base64')); } catch { tamper = true; }
  if (!tamper) throw new Error('tampered envelope accepted');
  let swap = false; try { await open(key, 'creds', id, hintEnv); } catch { swap = true; }
  if (!swap) throw new Error('hint accepted as credentials');

  console.log(JSON.stringify({
    S, iv_hex: Buffer.from(IV).toString('hex'), id, key_hex: keyHex,
    creds_plain: JSON.stringify(creds), creds_env: credsEnv,
    hint_plain: JSON.stringify(hint), hint_env: hintEnv,
  }, null, 2));
  console.log('checks: round trip ok, tamper rejected, hint-as-credentials rejected');
}
