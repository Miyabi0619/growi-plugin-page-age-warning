const f="growi-plugin-page-age-warning";const l={dateField:"createdAt",firstThresholdDays:365,secondThresholdDays:730,ignoredPagePaths:["/","/Sidebar"]};function u(...e){window.localStorage.getItem(`${f}:debug`)==="true"&&console.info(`[${f}]`,...e)}let p,o=0,m=!1,d,c;function v(e){const t=e.replace(/\/+$/,"")||"/";return l.ignoredPagePaths.includes(t)?!0:/^\/(_api|admin|login|logout|me|trash|in-app-notification|installer)(\/|$)/.test(e)}function w(){document.querySelectorAll(".growi-page-age-warning").forEach(e=>e.remove())}function S(){if(document.getElementById("growi-page-age-warning-style")!=null)return;const e=document.createElement("style");e.id="growi-page-age-warning-style",e.textContent=`
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
  `,document.head.appendChild(e)}function N(){return document.querySelector('main, [role="main"]')}function h(e){return e.closest('aside, nav, [id*="sidebar" i], [class*="sidebar" i], [data-testid*="sidebar" i]')!=null}function D(e){const t=e.getBoundingClientRect();return t.width>0&&t.height>0}function T(e){const t=Array.from(e.querySelectorAll('[data-testid="page-title"], .grw-page-title, h1'));return t.find(n=>!h(n)&&D(n))??t.find(n=>!h(n))??null}function $(e){const t=T(e);if(t!=null){const r=t.closest('[data-testid="page-header"], .grw-page-header, .page-header, .grw-page-title-container, .page-title-container, header')??t,a=r.parentElement;if(a!=null)return{parent:a,before:r.nextSibling}}const n=[".grw-page-content",'[data-testid="page-content"]',".page-content",".page-content-preview",".revision-body",".markdown-body",".markdown-preview",".wiki"];for(const r of n){const a=Array.from(e.querySelectorAll(r)).find(i=>!h(i));if(a!=null)return{parent:a.parentElement??e,before:a.parentElement==null?e.firstChild:a}}return{parent:e,before:e.firstChild}}function y(e){return new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"long",day:"numeric"}).format(e)}function A(e){const t=e.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?/);if(t==null)return null;const[,n,r,a,i="0",s="0"]=t,b=new Date(Number(n),Number(r)-1,Number(a),Number(i),Number(s));return Number.isNaN(b.getTime())?null:b}function R(e){var n;const t=e.cloneNode(!0);return t.querySelectorAll('aside, nav, [id*="sidebar" i], [class*="sidebar" i], [data-testid*="sidebar" i]').forEach(r=>r.remove()),((n=t.textContent)==null?void 0:n.replace(/\s+/g," "))??""}function _(e){const t="作成日",n=R(e),r=t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),a=n.match(new RegExp(`${r}\\s+(\\d{4}/\\d{1,2}/\\d{1,2}(?:\\s+\\d{1,2}:\\d{1,2})?)`));if(a==null)return null;const i=A(a[1]);return i==null?null:{date:i,source:"dom"}}async function L(e){const t=new URLSearchParams({path:e}),n=await fetch(`/_api/v3/page?${t.toString()}`,{method:"GET",credentials:"same-origin"});if(!n.ok)return u("failed to fetch page data",n.status,n.statusText),null;const r=await n.json(),i=(r.page??r)[l.dateField];if(i==null)return u(`${l.dateField} is missing in page data`,r),null;const s=new Date(i);return Number.isNaN(s.getTime())?(u(`${l.dateField} is invalid`,i),null):{date:s,source:"api"}}function P(e,t){const n="作成";return e<l.firstThresholdDays?null:e<l.secondThresholdDays?{className:"stale",title:`${n}から1年以上経過しています`,body:`${n}日: ${y(t)}。内容が現在の運用と異なる可能性があります。`}:{className:"very-stale",title:`${n}から2年以上経過しています`,body:`${n}日: ${y(t)}。内容が古い可能性が高いため、参照時は注意してください。`}}async function I(){const e=decodeURIComponent(window.location.pathname);if(v(e))return w(),!0;const t=N();if(t==null)return!1;const n=$(t);if(n==null)return!1;w(),S();const r=await L(e)??_(t);if(r==null)return u(`could not find ${l.dateField}`),!0;const a=Math.floor((Date.now()-r.date.getTime())/864e5);u("date resolved",{field:l.dateField,source:r.source,date:r.date.toISOString(),days:a});const i=P(a,r.date);if(i==null)return u("message hidden because page age is under threshold",a),!0;const s=document.createElement("div");return s.className=`growi-page-age-warning ${i.className}`,s.innerHTML=`
    <strong>${i.title}</strong>
    <span>${i.body}</span>
  `,n.parent.insertBefore(s,n.before),!0}function g(){window.clearTimeout(p),p=window.setTimeout(()=>{I().then(e=>{if(e){o=0;return}if(!m||o>=20){console.debug(`[${f}] insert target was not found`),o=0;return}o+=1,window.setTimeout(g,500)}).catch(e=>{o=0,console.debug(`[${f}] failed to render warning`,e)})},300)}function x(){m||(m=!0,o=0,g(),d=history.pushState,c=history.replaceState,history.pushState=function(...e){d==null||d.apply(this,e),o=0,g()},history.replaceState=function(...e){c==null||c.apply(this,e),o=0,g()},window.addEventListener("popstate",E))}function F(){m=!1,o=0,window.clearTimeout(p),w(),window.removeEventListener("popstate",E),d!=null&&(history.pushState=d,d=void 0),c!=null&&(history.replaceState=c,c=void 0)}function E(){o=0,g()}window.pluginActivators==null&&(window.pluginActivators={});window.pluginActivators[f]={activate:x,deactivate:F};
