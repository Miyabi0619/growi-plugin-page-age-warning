const f="growi-plugin-page-age-warning";const l={dateField:"createdAt",firstThresholdDays:365,secondThresholdDays:730,ignoredPagePaths:["/","/Sidebar"]};function u(...e){window.localStorage.getItem(`${f}:debug`)==="true"&&console.info(`[${f}]`,...e)}let p,s=0,m=!1,d,c;function E(e){const n=e.replace(/\/+$/,"")||"/";return l.ignoredPagePaths.includes(n)?!0:/^\/(_api|admin|login|logout|me|trash|in-app-notification|installer)(\/|$)/.test(e)}function w(){document.querySelectorAll(".growi-page-age-warning").forEach(e=>e.remove())}function v(){if(document.getElementById("growi-page-age-warning-style")!=null)return;const e=document.createElement("style");e.id="growi-page-age-warning-style",e.textContent=`
    .growi-page-age-warning {
      margin: 1rem 0;
      padding: 0.8rem 1rem;
      border-radius: 8px;
      border: 1px solid;
      font-size: 0.95rem;
      line-height: 1.6;
    }
    .growi-page-age-warning strong {
      display: block;
      margin-bottom: 0.2rem;
      font-weight: 700;
    }
    .growi-page-age-warning.fresh {
      color: #0d47a1;
      background: #e3f2fd;
      border-color: #90caf9;
    }
    .growi-page-age-warning.stale {
      color: #6d4c00;
      background: #fff8e1;
      border-color: #ffe082;
    }
    .growi-page-age-warning.very-stale {
      color: #7f1d1d;
      background: #ffebee;
      border-color: #ef9a9a;
    }
  `,document.head.appendChild(e)}function D(){return document.querySelector('main, [role="main"]')}function N(e){const n=[".grw-page-content",'[data-testid="page-content"]',".page-content",".page-content-preview",".revision-body",".markdown-body",".markdown-preview",".wiki"];for(const r of n){const a=e.querySelector(r);if(a!=null)return a.parentElement??a}const t=e.querySelector('h1, [data-testid="page-title"], .grw-page-title');return(t==null?void 0:t.parentElement)??e}function y(e){return new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"long",day:"numeric"}).format(e)}function S(e){const n=e.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?/);if(n==null)return null;const[,t,r,a,o="0",i="0"]=n,h=new Date(Number(t),Number(r)-1,Number(a),Number(o),Number(i));return Number.isNaN(h.getTime())?null:h}function $(e){var i;const n="作成日",t=((i=e.textContent)==null?void 0:i.replace(/\s+/g," "))??"",r=n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),a=t.match(new RegExp(`${r}\\s+(\\d{4}/\\d{1,2}/\\d{1,2}(?:\\s+\\d{1,2}:\\d{1,2})?)`));if(a==null)return null;const o=S(a[1]);return o==null?null:{date:o,source:"dom"}}async function T(e){const n=new URLSearchParams({path:e}),t=await fetch(`/_api/v3/page?${n.toString()}`,{method:"GET",credentials:"same-origin"});if(!t.ok)return u("failed to fetch page data",t.status,t.statusText),null;const r=await t.json(),o=(r.page??r)[l.dateField];if(o==null)return u(`${l.dateField} is missing in page data`,r),null;const i=new Date(o);return Number.isNaN(i.getTime())?(u(`${l.dateField} is invalid`,o),null):{date:i,source:"api"}}function R(e,n){const t="作成";return e<l.firstThresholdDays?null:e<l.secondThresholdDays?{className:"stale",title:`${t}から1年以上経過しています`,body:`${t}日: ${y(n)}。内容が現在の運用と異なる可能性があります。`}:{className:"very-stale",title:`${t}から2年以上経過しています`,body:`${t}日: ${y(n)}。内容が古い可能性が高いため、参照時は注意してください。`}}async function _(){const e=decodeURIComponent(window.location.pathname);if(E(e))return w(),!0;const n=D();if(n==null)return!1;const t=N(n);if(t==null)return!1;w(),v();const r=await T(e)??$(n);if(r==null)return u(`could not find ${l.dateField}`),!0;const a=Math.floor((Date.now()-r.date.getTime())/864e5);u("date resolved",{field:l.dateField,source:r.source,date:r.date.toISOString(),days:a});const o=R(a,r.date);if(o==null)return u("message hidden because page age is under threshold",a),!0;const i=document.createElement("div");return i.className=`growi-page-age-warning ${o.className}`,i.innerHTML=`
    <strong>${o.title}</strong>
    <span>${o.body}</span>
  `,t.prepend(i),!0}function g(){window.clearTimeout(p),p=window.setTimeout(()=>{_().then(e=>{if(e){s=0;return}if(!m||s>=20){console.debug(`[${f}] insert target was not found`),s=0;return}s+=1,window.setTimeout(g,500)}).catch(e=>{s=0,console.debug(`[${f}] failed to render warning`,e)})},300)}function A(){m||(m=!0,s=0,g(),d=history.pushState,c=history.replaceState,history.pushState=function(...e){d==null||d.apply(this,e),s=0,g()},history.replaceState=function(...e){c==null||c.apply(this,e),s=0,g()},window.addEventListener("popstate",b))}function L(){m=!1,s=0,window.clearTimeout(p),w(),window.removeEventListener("popstate",b),d!=null&&(history.pushState=d,d=void 0),c!=null&&(history.replaceState=c,c=void 0)}function b(){s=0,g()}window.pluginActivators==null&&(window.pluginActivators={});window.pluginActivators[f]={activate:A,deactivate:L};
