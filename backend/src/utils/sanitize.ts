type PlainObject = Record<string, any>;

const REDACT_KEYS = new Set([
  'password', 'pass', 'pwd', 'newPassword', 'oldPassword',
  'token', 'access_token', 'refresh_token', 'authorization', 'auth',
  'apiKey', 'apikey', 'api_key', 'key', 'secret', 'client_secret', 'clientSecret'
]);

const MAX_LOG_BYTES = 2 * 1024; // 2KB

export const truncateValue = (v: unknown): unknown => {
  if (typeof v === 'string') {
    if (v.length > MAX_LOG_BYTES) return `${v.slice(0, MAX_LOG_BYTES)}…[truncated]`;
    return v;
  }
  try {
    const s = JSON.stringify(v);
    if (s.length > MAX_LOG_BYTES) {
      return `${s.slice(0, MAX_LOG_BYTES)}…[truncated]`;
    }
  } catch {
    // ignore
  }
  return v;
};

export const sanitizeForLog = (data: any): any => {
  const seen = new WeakSet();
  const helper = (val: any): any => {
    if (val === null || val === undefined) return val;
    if (typeof val !== 'object') return truncateValue(val);
    if (seen.has(val)) return '[circular]';
    seen.add(val);

    if (Array.isArray(val)) {
      return val.map((item) => helper(item));
    }

    const obj: PlainObject = {};
    for (const [k, v] of Object.entries(val as PlainObject)) {
      if (REDACT_KEYS.has(k.toLowerCase())) {
        obj[k] = '[redacted]';
      } else {
        obj[k] = helper(v);
      }
    }
    return obj;
  };

  return helper(data);
};

