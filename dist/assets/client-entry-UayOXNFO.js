const g="growi-plugin-page-age-warning";const s={dateField:"createdAt",firstThresholdDays:365,secondThresholdDays:730,ignoredPagePaths:["/","/Sidebar"]};function c(...e){window.localStorage.getItem(`${g}:debug`)==="true"&&console.info(`[${g}]`,...e)}let p,i=0,f=!1,l,d;function E(e){const n=e.replace(/\/+$/,"")||"/";return s.ignoredPagePaths.includes(n)?!0:/^\/(_api|admin|login|logout|me|trash|in-app-notification|installer)(\/|$)/.test(e)}function w(){document.querySelectorAll(".growi-page-age-warning").forEach(e=>e.remove())}function v(){if(document.getElementById("growi-page-age-warning-style")!=null)return;const e=document.createElement("style");e.id="growi-page-age-warning-style",e.textContent=`
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
  `,document.head.appendChild(e)}function D(){const e=[".grw-page-content",'[data-testid="page-content"]',".page-content",".page-content-preview",".revision-body",".markdown-body",".markdown-preview",".wiki"];for(const t of e){const r=document.querySelector(t);if(r!=null)return r.parentElement??r}const n=document.querySelector('main h1, [data-testid="page-title"], .grw-page-title');return(n==null?void 0:n.parentElement)??document.querySelector("main")??null}function y(e){return new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"long",day:"numeric"}).format(e)}function N(e){const n=e.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?/);if(n==null)return null;const[,t,r,o,a="0",m="0"]=n,h=new Date(Number(t),Number(r)-1,Number(o),Number(a),Number(m));return Number.isNaN(h.getTime())?null:h}function S(){var a;const e="作成日",n=((a=document.body.textContent)==null?void 0:a.replace(/\s+/g," "))??"",t=e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),r=n.match(new RegExp(`${t}\\s+(\\d{4}/\\d{1,2}/\\d{1,2}(?:\\s+\\d{1,2}:\\d{1,2})?)`));if(r==null)return null;const o=N(r[1]);return o==null?null:{date:o,source:"dom"}}async function $(e){const n=new URLSearchParams({path:e}),t=await fetch(`/_api/v3/page?${n.toString()}`,{method:"GET",credentials:"same-origin"});if(!t.ok)return c("failed to fetch page data",t.status,t.statusText),null;const r=await t.json(),a=(r.page??r)[s.dateField];if(a==null)return c(`${s.dateField} is missing in page data`,r),null;const m=new Date(a);return Number.isNaN(m.getTime())?(c(`${s.dateField} is invalid`,a),null):{date:m,source:"api"}}function T(e,n){const t="作成";return e<s.firstThresholdDays?null:e<s.secondThresholdDays?{className:"stale",title:`${t}から1年以上経過しています`,body:`${t}日: ${y(n)}。内容が現在の運用と異なる可能性があります。`}:{className:"very-stale",title:`${t}から2年以上経過しています`,body:`${t}日: ${y(n)}。内容が古い可能性が高いため、参照時は注意してください。`}}async function R(){const e=decodeURIComponent(window.location.pathname);if(E(e))return w(),!0;const n=D();if(n==null)return!1;w(),v();const t=await $(e)??S();if(t==null)return c(`could not find ${s.dateField}`),!0;const r=Math.floor((Date.now()-t.date.getTime())/864e5);c("date resolved",{field:s.dateField,source:t.source,date:t.date.toISOString(),days:r});const o=T(r,t.date);if(o==null)return c("message hidden because page age is under threshold",r),!0;const a=document.createElement("div");return a.className=`growi-page-age-warning ${o.className}`,a.innerHTML=`
    <strong>${o.title}</strong>
    <span>${o.body}</span>
  `,n.prepend(a),!0}function u(){window.clearTimeout(p),p=window.setTimeout(()=>{R().then(e=>{if(e){i=0;return}if(!f||i>=20){console.debug(`[${g}] insert target was not found`),i=0;return}i+=1,window.setTimeout(u,500)}).catch(e=>{i=0,console.debug(`[${g}] failed to render warning`,e)})},300)}function _(){f||(f=!0,i=0,u(),l=history.pushState,d=history.replaceState,history.pushState=function(...e){l==null||l.apply(this,e),i=0,u()},history.replaceState=function(...e){d==null||d.apply(this,e),i=0,u()},window.addEventListener("popstate",b))}function A(){f=!1,i=0,window.clearTimeout(p),w(),window.removeEventListener("popstate",b),l!=null&&(history.pushState=l,l=void 0),d!=null&&(history.replaceState=d,d=void 0)}function b(){i=0,u()}window.pluginActivators==null&&(window.pluginActivators={});window.pluginActivators[g]={activate:_,deactivate:A};
