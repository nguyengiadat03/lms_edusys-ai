/*
  Minimal sanity checks for log sanitization utility.
  This script runs in plain Node and does not require building the app.
*/

function truncateValue(v) {
  const MAX_LOG_BYTES = 2 * 1024;
  if (typeof v === 'string') {
    return v.length > MAX_LOG_BYTES ? v.slice(0, MAX_LOG_BYTES) + '…[truncated]' : v;
  }
  try {
    const s = JSON.stringify(v);
    if (s.length > MAX_LOG_BYTES) return s.slice(0, MAX_LOG_BYTES) + '…[truncated]';
  } catch (_) {}
  return v;
}

function sanitizeForLog(data) {
  const REDACT_KEYS = new Set([
    'password','pass','pwd','newpassword','oldpassword','token','access_token','refresh_token',
    'authorization','auth','apikey','apiKey','api_key','key','secret','client_secret','clientsecret'
  ]);
  const seen = new WeakSet();
  const helper = (val) => {
    if (val === null || val === undefined) return val;
    if (typeof val !== 'object') return truncateValue(val);
    if (seen.has(val)) return '[circular]';
    seen.add(val);
    if (Array.isArray(val)) return val.map(helper);
    const obj = {};
    for (const [k,v] of Object.entries(val)) {
      obj[k] = REDACT_KEYS.has(k.toLowerCase()) ? '[redacted]' : helper(v);
    }
    return obj;
  };
  return helper(data);
}

// Tests
const assert = (cond, msg) => { if (!cond) throw new Error('Assertion failed: ' + msg); };

// Redaction test
const input = { email: 'user@example.com', password: 'secret', token: 'abc', nested: { clientSecret: 'x' } };
const out = sanitizeForLog(input);
assert(out.password === '[redacted]', 'password should be redacted');
assert(out.token === '[redacted]', 'token should be redacted');
assert(out.nested.clientSecret === '[redacted]', 'clientSecret should be redacted');

// Truncation test
const long = 'a'.repeat(4096);
const t = sanitizeForLog({ long });
assert(typeof t.long === 'string' && t.long.includes('[truncated]'), 'long string should be truncated');

console.log('Security sanity tests passed.');

