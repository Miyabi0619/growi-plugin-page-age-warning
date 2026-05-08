const f="growi-plugin-page-age-warning";const s={dateField:"createdAt",firstThresholdDays:365,secondThresholdDays:730,ignoredPagePaths:["/","/Sidebar"]};function u(...e){window.localStorage.getItem(`${f}:debug`)==="true"&&console.info(`[${f}]`,...e)}let p,l=0,m=!1,d,c;function v(e){const n=e.replace(/\/+$/,"")||"/";return s.ignoredPagePaths.includes(n)?!0:/^\/(_api|admin|login|logout|me|trash|in-app-notification|installer)(\/|$)/.test(e)}function w(){document.querySelectorAll(".growi-page-age-warning").forEach(e=>e.remove())}function S(){if(document.getElementById("growi-page-age-warning-style")!=null)return;const e=document.createElement("style");e.id="growi-page-age-warning-style",e.textContent=`
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
  `,document.head.appendChild(e)}function D(){return document.querySelector('main, [role="main"]')}function h(e){return e.closest('aside, nav, [id*="sidebar" i], [class*="sidebar" i], [data-testid*="sidebar" i]')!=null}function N(e){const n=e.getBoundingClientRect();return n.width>0&&n.height>0}function T(e){const n=Array.from(e.querySelectorAll('[data-testid="page-title"], .grw-page-title, h1'));return n.find(t=>!h(t)&&N(t))??n.find(t=>!h(t))??null}function $(e){const n=T(e);if(n!=null){const a=n.closest('[data-testid="page-header"], .grw-page-header, .page-header, .grw-page-title-container, .page-title-container, header')??n,r=a.parentElement;if(r!=null)return{parent:r,before:a.nextSibling,dateRoot:r}}const t=[".grw-page-content",'[data-testid="page-content"]',".page-content",".page-content-preview",".revision-body",".markdown-body",".markdown-preview",".wiki"];for(const a of t){const r=Array.from(e.querySelectorAll(a)).find(o=>!h(o));if(r!=null)return{parent:r.parentElement??e,before:r.parentElement==null?e.firstChild:r,dateRoot:r.parentElement??r}}return{parent:e,before:e.firstChild,dateRoot:e}}function y(e){return new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"long",day:"numeric"}).format(e)}function R(e){const n=e.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?/);if(n==null)return null;const[,t,a,r,o="0",i="0"]=n,b=new Date(Number(t),Number(a)-1,Number(r),Number(o),Number(i));return Number.isNaN(b.getTime())?null:b}function A(e){var i;const n="作成日",t=((i=e.textContent)==null?void 0:i.replace(/\s+/g," "))??"",a=n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),r=t.match(new RegExp(`${a}\\s+(\\d{4}/\\d{1,2}/\\d{1,2}(?:\\s+\\d{1,2}:\\d{1,2})?)`));if(r==null)return null;const o=R(r[1]);return o==null?null:{date:o,source:"dom"}}async function _(e){const n=new URLSearchParams({path:e}),t=await fetch(`/_api/v3/page?${n.toString()}`,{method:"GET",credentials:"same-origin"});if(!t.ok)return u("failed to fetch page data",t.status,t.statusText),null;const a=await t.json(),o=(a.page??a)[s.dateField];if(o==null)return u(`${s.dateField} is missing in page data`,a),null;const i=new Date(o);return Number.isNaN(i.getTime())?(u(`${s.dateField} is invalid`,o),null):{date:i,source:"api"}}function L(e,n){const t="作成";return e<s.firstThresholdDays?null:e<s.secondThresholdDays?{className:"stale",title:`${t}から1年以上経過しています`,body:`${t}日: ${y(n)}。内容が現在の運用と異なる可能性があります。`}:{className:"very-stale",title:`${t}から2年以上経過しています`,body:`${t}日: ${y(n)}。内容が古い可能性が高いため、参照時は注意してください。`}}async function I(){const e=decodeURIComponent(window.location.pathname);if(v(e))return w(),!0;const n=D();if(n==null)return!1;const t=$(n);if(t==null)return!1;w(),S();const a=await _(e)??A(t.dateRoot);if(a==null)return u(`could not find ${s.dateField}`),!0;const r=Math.floor((Date.now()-a.date.getTime())/864e5);u("date resolved",{field:s.dateField,source:a.source,date:a.date.toISOString(),days:r});const o=L(r,a.date);if(o==null)return u("message hidden because page age is under threshold",r),!0;const i=document.createElement("div");return i.className=`growi-page-age-warning ${o.className}`,i.innerHTML=`
    <strong>${o.title}</strong>
    <span>${o.body}</span>
  `,t.parent.insertBefore(i,t.before),!0}function g(){window.clearTimeout(p),p=window.setTimeout(()=>{I().then(e=>{if(e){l=0;return}if(!m||l>=20){console.debug(`[${f}] insert target was not found`),l=0;return}l+=1,window.setTimeout(g,500)}).catch(e=>{l=0,console.debug(`[${f}] failed to render warning`,e)})},300)}function P(){m||(m=!0,l=0,g(),d=history.pushState,c=history.replaceState,history.pushState=function(...e){d==null||d.apply(this,e),l=0,g()},history.replaceState=function(...e){c==null||c.apply(this,e),l=0,g()},window.addEventListener("popstate",E))}function F(){m=!1,l=0,window.clearTimeout(p),w(),window.removeEventListener("popstate",E),d!=null&&(history.pushState=d,d=void 0),c!=null&&(history.replaceState=c,c=void 0)}function E(){l=0,g()}window.pluginActivators==null&&(window.pluginActivators={});window.pluginActivators[f]={activate:P,deactivate:F};
