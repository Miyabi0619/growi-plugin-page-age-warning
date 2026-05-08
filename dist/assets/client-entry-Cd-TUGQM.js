const f="growi-plugin-page-age-warning";const S=["aside",'nav[aria-label*="sidebar" i]','[id="grw-sidebar"]','[id="grw-custom-sidebar"]','[id="custom-sidebar"]','[class~="grw-sidebar"]','[class~="grw-sidebar-content"]','[class~="grw-custom-sidebar"]','[class~="custom-sidebar"]','[data-testid="grw-sidebar"]','[data-testid="custom-sidebar"]','[data-testid="sidebar"]'].join(","),l={dateField:"createdAt",showFreshMessage:!1,firstThresholdDays:365,secondThresholdDays:730,ignoredPagePaths:["/","/Sidebar"],ignoredPagePathPatterns:[/(^|\/)__?Template(\/|$)/]};function c(...e){window.localStorage.getItem(`${f}:debug`)==="true"&&console.info(`[${f}]`,...e)}let m,s=0,p=!1,d,u;function w(e){return e.replace(/\/+$/,"")||"/"}function T(e){const t=w(e);return l.ignoredPagePaths.includes(t)||l.ignoredPagePathPatterns.some(n=>n.test(t))?!0:/^\/(_api|admin|login|logout|me|trash|in-app-notification|installer|search|tags)(\/|$)/.test(t)}function h(){document.querySelectorAll(".growi-page-age-warning").forEach(e=>e.remove())}function N(){if(document.getElementById("growi-page-age-warning-style")!=null)return;const e=document.createElement("style");e.id="growi-page-age-warning-style",e.textContent=`
    .growi-page-age-warning {
      margin: 1rem 0 1.25rem;
      padding: 0.8rem 1rem;
      border-radius: 6px;
      border: 1px solid;
      border-left-width: 4px;
      color: inherit;
      font-size: 0.95rem;
      line-height: 1.6;
    }
    .growi-page-age-warning strong {
      display: block;
      margin-bottom: 0.2rem;
      font-weight: 700;
    }
    .growi-page-age-warning.fresh {
      background: rgba(66, 153, 225, 0.12);
      border-color: rgba(66, 153, 225, 0.28);
      border-left-color: rgba(66, 153, 225, 0.72);
    }
    .growi-page-age-warning.stale {
      background: rgba(180, 117, 25, 0.12);
      border-color: rgba(180, 117, 25, 0.28);
      border-left-color: rgba(180, 117, 25, 0.72);
    }
    .growi-page-age-warning.very-stale {
      background: rgba(185, 90, 83, 0.12);
      border-color: rgba(185, 90, 83, 0.28);
      border-left-color: rgba(185, 90, 83, 0.72);
    }
  `,document.head.appendChild(e)}function b(e){return e.closest(S)!=null}function v(e){const t=e.getBoundingClientRect();return t.width>0&&t.height>0}function $(){const e=["main",'[role="main"]',".grw-page-wrapper",".grw-page",".page-wrapper",".page-content-wrapper","#page-wrapper","#page"];for(const t of e){const n=document.querySelector(t);if(n!=null&&v(n)&&!b(n))return n}return document.body}function P(e){var a;const t=Array.from(e.querySelectorAll('[data-testid="page-title"], .grw-page-title, h1')).filter(r=>!b(r));return((a=t.filter(v).map(r=>{const o=r.getBoundingClientRect(),i=r.matches('[data-testid="page-title"], .grw-page-title')?100:0;return{el:r,score:i+o.left+o.width/10}}).sort((r,o)=>o.score-r.score)[0])==null?void 0:a.el)??t[0]??null}function R(e){const t=P(e);if(t!=null){const a=t.closest('[data-testid="page-header"], .grw-page-header, .page-header, .grw-page-title-container, .page-title-container, header')??t,r=a.parentElement;if(r!=null)return{parent:r,before:a.nextSibling}}const n=[".grw-page-content",'[data-testid="page-content"]',".page-content",".page-content-preview",".revision-body",".markdown-body",".markdown-preview",".wiki"];for(const a of n){const r=Array.from(e.querySelectorAll(a)).find(o=>!b(o));if(r!=null)return{parent:r.parentElement??e,before:r.parentElement==null?e.firstChild:r}}return{parent:e,before:e.firstChild}}function E(e){return new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"long",day:"numeric"}).format(e)}function A(e){const t=e.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?/);if(t==null)return null;const[,n,a,r,o="0",i="0"]=t,y=new Date(Number(n),Number(a)-1,Number(r),Number(o),Number(i));return Number.isNaN(y.getTime())?null:y}function _(e){var n;const t=e.cloneNode(!0);return t.querySelectorAll(S).forEach(a=>a.remove()),((n=t.textContent)==null?void 0:n.replace(/\s+/g," "))??""}function L(e){const t="作成日",n=_(e),a=t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),r=n.match(new RegExp(`${a}\\s+(\\d{4}/\\d{1,2}/\\d{1,2}(?:\\s+\\d{1,2}:\\d{1,2})?)`));if(r==null)return null;const o=A(r[1]);return o==null?null:{date:o,source:"dom"}}async function C(e){try{const t=new URLSearchParams({path:e}),n=await fetch(`/_api/v3/page?${t.toString()}`,{method:"GET",credentials:"same-origin"});if(!n.ok)return c("failed to fetch page data",n.status,n.statusText),null;const a=await n.json(),r=a.page??a;if(r.path!=null&&w(r.path)!==w(e))return c("page path mismatch",{requested:e,actual:r.path}),null;const o=r[l.dateField];if(o==null)return c(`${l.dateField} is missing in page data`,a),null;const i=new Date(o);return Number.isNaN(i.getTime())?(c(`${l.dateField} is invalid`,o),null):{date:i,source:"api"}}catch(t){return c("failed to fetch page data",t),null}}async function I(e,t){return await C(e)??L(t)}function F(e,t){const n="作成";return e<l.firstThresholdDays?null:e<l.secondThresholdDays?{className:"stale",title:`${n}から1年以上経過しています`,body:`${n}日: ${E(t)}。内容が現在の運用と異なる可能性があります。`}:{className:"very-stale",title:`${n}から2年以上経過しています`,body:`${n}日: ${E(t)}。内容が古い可能性が高いため、参照時は注意してください。`}}async function M(){const e=decodeURIComponent(window.location.pathname);if(T(e))return h(),!0;const t=$();if(t==null)return!1;const n=R(t);if(n==null)return!1;h(),N();const a=await I(e,t);if(a==null)return c(`could not find ${l.dateField}`),!0;const r=Math.floor((Date.now()-a.date.getTime())/864e5);c("date resolved",{field:l.dateField,source:a.source,date:a.date.toISOString(),days:r});const o=F(r,a.date);if(o==null)return c("message hidden because page age is under threshold",r),!0;const i=document.createElement("div");return i.className=`growi-page-age-warning ${o.className}`,i.innerHTML=`
    <strong>${o.title}</strong>
    <span>${o.body}</span>
  `,n.parent.insertBefore(i,n.before),!0}function g(){window.clearTimeout(m),m=window.setTimeout(()=>{M().then(e=>{if(e){s=0;return}if(!p||s>=20){console.debug(`[${f}] insert target was not found`),s=0;return}s+=1,window.setTimeout(g,500)}).catch(e=>{s=0,console.debug(`[${f}] failed to render warning`,e)})},300)}function x(){p||(p=!0,s=0,g(),d=history.pushState,u=history.replaceState,history.pushState=function(...e){d==null||d.apply(this,e),s=0,g()},history.replaceState=function(...e){u==null||u.apply(this,e),s=0,g()},window.addEventListener("popstate",D))}function k(){p=!1,s=0,window.clearTimeout(m),h(),window.removeEventListener("popstate",D),d!=null&&(history.pushState=d,d=void 0),u!=null&&(history.replaceState=u,u=void 0)}function D(){s=0,g()}window.pluginActivators==null&&(window.pluginActivators={});window.pluginActivators[f]={activate:x,deactivate:k};
