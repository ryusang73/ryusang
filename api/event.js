// 방문·클릭 기록. 이름·전화번호·IP는 받지 않음. 방문자는 무작위 번호로만 구분.
const L = require('./_lib');
const OK = new Set(['pv', 'quiz_start', 'quiz_step', 'quiz_done', 'kakao_click', 'result_view', 'menu']);
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const b = L.body(req);
    if (L.isBot(req) || !OK.has(b.e)) return res.status(204).end();
    const ev = {
      t: Date.now(), e: b.e,
      p: L.clip(b.p, 80), s: Math.max(0, Math.min(20, +b.s || 0)),
      vid: L.clip(b.vid, 24), rid: L.clip(b.rid, 12),
      reg: L.region(req), br: L.browser(req.headers['user-agent']),
      m: L.clip(b.m, 40), ref: L.clip(b.ref, 60), src: L.clip(b.src, 12)
    };
    await L.redis([['LPUSH', 'ev', JSON.stringify(ev)], ['LTRIM', 'ev', 0, 9999]]);
    res.status(204).end();
  } catch (e) { res.status(204).end(); }
};
