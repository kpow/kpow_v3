#!/usr/bin/env node
// Reset a site login's password from the terminal (no email flow exists).
//
//   node --env-file=.env scripts/set-password.mjs
//
// Lists the accounts, asks which one, then asks for the new password twice with
// typing hidden. Hashes it exactly like server/auth.ts (scrypt, 64 bytes,
// "<hex>.<salt>") and writes it to the users table in DATABASE_URL.
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import readline from "node:readline";
import pg from "pg";

const scryptAsync = promisify(scrypt);

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); }; // echo nothing you type
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Run it as: node --env-file=.env scripts/set-password.mjs");
  process.exit(1);
}
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // DigitalOcean managed Postgres (same as db/index.ts)
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

try {
  const { rows } = await pool.query("SELECT id, username, approved FROM users ORDER BY id");
  console.log("\nAccounts:");
  for (const u of rows) console.log(`  ${u.username}${u.approved ? "" : "  (not approved)"}`);
  const username = (await ask("\nUsername to reset: ")).trim();
  const user = rows.find((u) => u.username === username);
  if (!user) throw new Error(`no account called "${username}"`);

  const pw = await ask("New password: ", { hidden: true });
  if (pw.length < 8) throw new Error("use at least 8 characters");
  if ((await ask("Again: ", { hidden: true })) !== pw) throw new Error("the two didn't match; nothing changed");

  const salt = randomBytes(16).toString("hex");
  const hash = `${(await scryptAsync(pw, salt, 64)).toString("hex")}.${salt}`;
  await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hash, user.id]);
  console.log(`\nDone: ${username} can log in with the new password${user.approved ? "." : ", once approved."}`);
} catch (e) {
  console.error(`\n${e.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
