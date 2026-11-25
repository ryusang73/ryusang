/* 방문 기록(이름·전화·IP 없이 무작위 방문자 번호만). 관리자 페이지 통계용 */
(function(){
  if(navigator.doNotTrack==='1'||/^\/admin/.test(location.pathname))return;
  var vid='';try{vid=localStorage.getItem('rv')||'';if(!vid){vid=Math.random().toString(36).slice(2,10)+Date.now().toString(36);localStorage.setItem('rv',vid)}}catch(e){vid='x'+Math.random().toString(36).slice(2,8)}
  var src=/^\/quiz\/ad/.test(location.pathname)?'ad':'';
  var ref='';try{ref=document.referrer?new URL(document.referrer).hostname:''}catch(e){}
  window.RT=function(e,o){o=o||{};var d=JSON.stringify({e:e,p:location.pathname.slice(0,80),s:o.s||0,m:o.m||'',rid:o.rid||'',vid:vid,ref:ref,src:src});
    try{if(navigator.sendBeacon&&navigator.sendBeacon('/api/event',new Blob([d],{type:'application/json'})))return}catch(x){}
    try{fetch('/api/event',{method:'POST',headers:{'Content-Type':'application/json'},body:d,keepalive:true})}catch(x){}};
  window.RT_VID=vid;
  if(!/^\/r\//.test(location.pathname))window.RT('pv');
  document.addEventListener('click',function(ev){var a=ev.target.closest&&ev.target.closest('a[href*="pf.kakao.com"]');
    if(a)window.RT('kakao_click',{rid:window.RT_RID||''});
    var m=ev.target.closest&&ev.target.closest('a[href]');if(m&&!a){var h=m.getAttribute('href')||'';if(/^(\/)?#[a-z]/i.test(h)||/^\/(quiz|academy|privacy|terms)/.test(h))window.RT('menu',{m:h.slice(0,40)})}},true);
})();
