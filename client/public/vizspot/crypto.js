// vizSpot pairing crypto. Shared by the phone wizard (browser) and the Node test
// scripts. Must stay byte-compatible with src/net/pair_crypto.cpp on the board.
//
//   S         16-char base64url secret shown in the board's QR (https://kpow.xyz/vizspot/#S)
//   key       SHA-256("vizspot1/key/" + S)                  AES-256-GCM key
//   id        hex(SHA-256("vizspot1/id/" + S)).slice(0, 24)  relay row id; the only thing the server sees
//   envelope  base64( 0x01 | IV[12] | ciphertext | tag[16] )
//   AAD       "vizspot1/creds/" + id  or  "vizspot1/hint/" + id

const te = new TextEncoder();
const td = new TextDecoder();
const subtle = globalThis.crypto.subtle;

export const SECRET_RE = /^[A-Za-z0-9_-]{16}$/;

const sha256 = async (s) => new Uint8Array(await subtle.digest('SHA-256', te.encode(s)));
const hex = (u8) => Array.from(u8, (b) => b.toString(16).padStart(2, '0')).join('');

export function b64(u8) { let s = ''; for (const b of u8) s += String.fromCharCode(b); return btoa(s); }
export function unb64(str) { const s = atob(str); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
export function b64url(u8) { return b64(u8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }

export async function derive(S) {
  if (!SECRET_RE.test(S)) throw new Error('bad pairing secret');
  const keyBytes = await sha256('vizspot1/key/' + S);
  const id = hex(await sha256('vizspot1/id/' + S)).slice(0, 24);
  const key = await subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  return { id, key, keyHex: hex(keyBytes) };
}

const aadFor = (kind, id) => te.encode(`vizspot1/${kind}/${id}`);   // kind: 'creds' | 'hint'

// `iv` is only passed by tests; production always uses a fresh random IV.
export async function seal(key, kind, id, obj, iv) {
  iv = iv || globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ctTag = new Uint8Array(await subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aadFor(kind, id), tagLength: 128 }, key, te.encode(JSON.stringify(obj))));
  const out = new Uint8Array(1 + 12 + ctTag.length);
  out[0] = 1; out.set(iv, 1); out.set(ctTag, 13);
  return b64(out);
}

export async function open(key, kind, id, envelope) {
  const u = unb64(envelope);
  if (u.length < 1 + 12 + 16 + 2 || u[0] !== 1) throw new Error('bad envelope');
  const pt = await subtle.decrypt(
    { name: 'AES-GCM', iv: u.slice(1, 13), additionalData: aadFor(kind, id), tagLength: 128 }, key, u.slice(13));
  return JSON.parse(td.decode(pt));
}

// PKCE, RFC 7636 S256.
export async function pkce() {
  const verifier = b64url(globalThis.crypto.getRandomValues(new Uint8Array(64)));
  const challenge = b64url(new Uint8Array(await subtle.digest('SHA-256', te.encode(verifier))));
  const state = b64url(globalThis.crypto.getRandomValues(new Uint8Array(16)));
  return { verifier, challenge, state };
}
