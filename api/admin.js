// 관리자: POST {password} 로그인 / GET 자료 / GET ?q= 결과 검색
const L = require('./_lib');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  try {
    if (req.method === 'POST') {
      if (!process.env.ADMIN_PASSWORD) return res.status(503).json({ error: 'no-password-set' });
      const hr = new Date().toISOString().slice(0, 13);
      let n = 0; try { n = (await L.redis([['INCR', 'lf:' + hr], ['EXPIRE', 'lf:' + hr, 3700]]))[0]; } catch (e) { /* 진행 */ }
      if (n > 30) return res.status(429).json({ error: 'too-many' });
      const b = L.body(req);
      if (!L.checkPassword(b.password)) { await new Promise(r => setTimeout(r, 1200)); return res.status(401).json({ error: 'bad-password' }); }
      res.setHeader('Set-Cookie', L.makeCookie());
      return res.status(200).json({ ok: true });
    }
    if (req.method !== 'GET') return res.status(405).end();
    if (!L.isAdmin(req)) return res.status(401).json({ error: 'login' });
    if (req.query.out) { res.setHeader('Set-Cookie', 'adm=; Path=/; Max-Age=0'); return res.status(200).json({ ok: true }); }
    // 번호/ID 검색
    if (req.query.q) {
      let q = String(req.query.q).trim();
      let id = q;
      if (/^r?-?\d{3,6}$/i.test(q)) { const n = q.replace(/\D/g, ''); id = (await L.redis([['GET', 'num:R-' + n]]))[0] || ''; }
      else id = q.replace(/^.*\/r\//, '').toLowerCase();
      const v = id ? (await L.redis([['GET', 'res:' + id]]))[0] : null;
      return res.status(200).json({ result: v ? JSON.parse(v) : null });
    }
    const [evs, ids] = await L.redis([['LRANGE', 'ev', 0, 9999], ['LRANGE', 'reslist', 0, 199]]);
    const results = ids.length ? (await L.redis([['MGET'].concat(ids.map(i => 'res:' + i))]))[0].filter(Boolean).map(x => JSON.parse(x)) : [];
    const all = evs.map(x => JSON.parse(x));
    const live = new Set(all.filter(e => e.t >= Date.now() - 300000).map(e => e.vid)).size;
    res.status(200).json({ events: all, results, now: Date.now(), live });
  } catch (e) {
    res.status(e.message === 'db-not-configured' ? 503 : 500).json({ error: e.message });
  }
};
