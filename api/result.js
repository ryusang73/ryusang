// 퀴즈 결과 저장(POST) / 결과 불러오기(GET ?id=)
const L = require('./_lib');
const ALPHA = 'abcdefghjkmnpqrstuvwxyz23456789';
const rid = () => { let s = ''; const b = require('crypto').randomBytes(8); for (let i = 0; i < 7; i++) s += ALPHA[b[i] % ALPHA.length]; return s; };

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'POST') {
      return res.status(410).json({ error: 'disabled' }); // 2026-11-25 결과 저장 중단
      const b = L.body(req);
      const r = b.r || {};
      const clean = {
        total: L.clip(r.total, 20),
        areas: Array.isArray(r.areas) ? r.areas.slice(0, 5).map(a => ({ k: L.clip(a.k, 12), name: L.clip(a.name, 20), pct: Math.max(0, Math.min(100, +a.pct || 0)), label: L.clip(a.label, 20), weak: !!a.weak })) : [],
        weak: Array.isArray(r.weak) ? r.weak.slice(0, 3).map(x => L.clip(x, 30)) : [],
        rec: L.clip(r.rec, 40), recwhy: L.clip(r.recwhy, 400),
        who: L.clip(r.who, 12), when: L.clip(r.when, 12),
        ans: Array.isArray(r.ans) ? r.ans.slice(0, 12) : [],
        qa: Array.isArray(r.qa) ? r.qa.slice(0, 12).map(x => [L.clip(x && x[0], 120), L.clip(x && x[1], 200)]) : [],
        src: b.src === 'ad' ? 'ad' : 'quiz'
      };
      let id = rid();
      const seq = (await L.redis([['INCR', 'seq']]))[0];
      const num = 'R-' + (1000 + seq);
      const rec = Object.assign({}, clean, { id, num, t: Date.now(), reg: L.region(req), br: L.browser(req.headers['user-agent']), v: L.clip(b.v, 40) });
      await L.redis([
        ['SET', 'res:' + id, JSON.stringify(rec), 'EX', 31536000],
        ['SET', 'num:' + num, id, 'EX', 31536000],
        ['LPUSH', 'reslist', id],
        ['LTRIM', 'reslist', 0, 4999]
      ]);
      return res.status(200).json({ id, num });
    }
    if (req.method === 'GET') {
      const id = L.clip(req.query.id, 12);
      if (!/^[a-z0-9]+$/.test(id)) return res.status(400).json({ error: 'bad-id' });
      const v = (await L.redis([['GET', 'res:' + id]]))[0];
      if (!v) return res.status(404).json({ error: 'not-found' });
      const o = JSON.parse(v);
      // 공개 화면에는 접속 정보 제외
      delete o.reg; delete o.br; delete o.v; delete o.src;
      return res.status(200).json(o);
    }
    res.status(405).end();
  } catch (e) {
    res.status(e.message === 'db-not-configured' ? 503 : 500).json({ error: e.message });
  }
};
