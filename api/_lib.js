// 공통 도구: Upstash Redis(REST) 연결, 관리자 확인
const crypto = require('crypto');
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

exports.dbReady = () => !!(URL_ && TOKEN);

// cmds: [["SET","k","v"],["LPUSH",...]]  -> 결과 배열
exports.redis = async (cmds) => {
  if (!URL_ || !TOKEN) throw new Error('db-not-configured');
  const r = await fetch(URL_ + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds)
  });
  if (!r.ok) throw new Error('db-' + r.status);
  const j = await r.json();
  return j.map(x => { if (x.error) throw new Error(x.error); return x.result; });
};

const sig = (exp) => crypto.createHmac('sha256', process.env.ADMIN_PASSWORD || '').update('ryusang-admin-v2|' + exp).digest('hex');
exports.makeCookie = () => { const exp = Date.now() + 12 * 3600e3; return 'adm=' + exp + '.' + sig(exp) + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200'; };
exports.isBot = (req) => { const ua = String((req.headers || {})['user-agent'] || ''); return !ua || /bot|crawl|spider|slurp|vercel|preview|headless|lighthouse/i.test(ua); };
exports.isAdmin = (req) => {
  if (!process.env.ADMIN_PASSWORD) return false;
  const m = /(?:^|;\s*)adm=(\d+)\.([0-9a-f]+)/.exec(req.headers.cookie || '');
  if (!m || Number(m[1]) < Date.now()) return false;
  const a = Buffer.from(m[2]), b = Buffer.from(sig(m[1]));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
exports.checkPassword = (p) => {
  const w = process.env.ADMIN_PASSWORD || '';
  if (!w || typeof p !== 'string') return false;
  const a = crypto.createHash('sha256').update(p).digest(), b = crypto.createHash('sha256').update(w).digest();
  return crypto.timingSafeEqual(a, b);
};
exports.body = (req) => {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b && typeof b === 'object' ? b : {};
};
// 접속 장소는 시·도 코드만, IP는 저장하지 않음
exports.region = (req) => (req.headers['x-vercel-ip-country'] || '') + '-' + (req.headers['x-vercel-ip-country-region'] || '');
exports.browser = (ua) => {
  ua = ua || '';
  const dev = /Mobi|Android|iPhone/i.test(ua) ? '모바일' : '컴퓨터';
  let b = '기타';
  if (/KAKAOTALK/i.test(ua)) b = '카카오톡'; else if (/Instagram/i.test(ua)) b = '인스타 앱'; else if (/FBAN|FBAV/i.test(ua)) b = '페이스북 앱';
  else if (/NAVER/i.test(ua)) b = '네이버 앱'; else if (/SamsungBrowser/i.test(ua)) b = '삼성 인터넷'; else if (/Edg\//.test(ua)) b = 'Edge';
  else if (/Chrome|CriOS/.test(ua)) b = 'Chrome'; else if (/Safari/.test(ua)) b = 'Safari'; else if (/Firefox/.test(ua)) b = 'Firefox';
  return dev + ' ' + b;
};
exports.clip = (s, n) => String(s == null ? '' : s).slice(0, n);
