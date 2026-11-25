#!/usr/bin/env python3
"""quiz/index.html 을 고친 뒤 이 파일을 실행하면 quiz/ad/index.html 이 같은 내용으로 다시 만들어집니다.
(광고 방문자를 따로 세기 위한 같은 내용의 복사본. 검색에는 잡히지 않게 noindex)
사용: python3 scripts/sync-quiz-ad.py"""
import pathlib
r=pathlib.Path(__file__).resolve().parent.parent
s=(r/'quiz/index.html').read_text()
c='<link rel="canonical" href="https://www.ryusanglab.com/quiz/">'
assert c in s
(r/'quiz/ad').mkdir(exist_ok=True)
(r/'quiz/ad/index.html').write_text(s.replace(c,c+'<meta name="robots" content="noindex">',1))
print('quiz/ad/index.html updated')
