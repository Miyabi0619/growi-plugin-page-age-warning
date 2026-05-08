const s="growi-plugin-page-age-warning";const l={dateField:"updatedAt",firstThresholdDays:365,secondThresholdDays:730};let m,t=0,u=!1,a,i;function v(e){return/^\/(_api|admin|login|logout|me|trash|in-app-notification|installer)(\/|$)/.test(e)}function w(){document.querySelectorAll(".growi-page-age-warning").forEach(e=>e.remove())}function R(){if(document.getElementById("growi-page-age-warning-style")!=null)return;const e=document.createElement("style");e.id="growi-page-age-warning-style",e.textContent=`
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
  `,document.head.appendChild(e)}function S(){const e=[".grw-page-content",'[data-testid="page-content"]',".page-content",".page-content-preview",".revision-body",".markdown-body",".markdown-preview",".wiki"];for(const r of e){const o=document.querySelector(r);if(o!=null)return o.parentElement??o}const n=document.querySelector('main h1, [data-testid="page-title"], .grw-page-title');return(n==null?void 0:n.parentElement)??document.querySelector("main")??null}function y(e){return new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"long",day:"numeric"}).format(e)}function T(e,n){const r="最終更新";return e<l.firstThresholdDays?null:e<l.secondThresholdDays?{className:"stale",title:`${r}から1年以上経過しています`,body:`${r}日: ${y(n)}。内容が現在の運用と異なる可能性があります。`}:{className:"very-stale",title:`${r}から2年以上経過しています`,body:`${r}日: ${y(n)}。内容が古い可能性が高いため、参照時は注意してください。`}}async function $(){const e=decodeURIComponent(window.location.pathname);if(v(e))return w(),!0;const n=S();if(n==null)return!1;w(),R();const r=new URLSearchParams({path:e}),o=await fetch(`/_api/v3/page?${r.toString()}`,{method:"GET",credentials:"same-origin"});if(!o.ok)return console.debug(`[${s}] failed to fetch page data`,o.status,o.statusText),!0;const h=await o.json(),g=(h.page??h)[l.dateField];if(g==null)return console.debug(`[${s}] ${l.dateField} is missing in page data`),!0;const f=new Date(g);if(Number.isNaN(f.getTime()))return console.debug(`[${s}] ${l.dateField} is invalid`,g),!0;const b=Math.floor((Date.now()-f.getTime())/864e5),d=T(b,f);if(d==null)return!0;const p=document.createElement("div");return p.className=`growi-page-age-warning ${d.className}`,p.innerHTML=`
    <strong>${d.title}</strong>
    <span>${d.body}</span>
  `,n.prepend(p),!0}function c(){window.clearTimeout(m),m=window.setTimeout(()=>{$().then(e=>{if(e){t=0;return}if(!u||t>=20){console.debug(`[${s}] insert target was not found`),t=0;return}t+=1,window.setTimeout(c,500)}).catch(e=>{t=0,console.debug(`[${s}] failed to render warning`,e)})},300)}function D(){u||(u=!0,t=0,c(),a=history.pushState,i=history.replaceState,history.pushState=function(...e){a==null||a.apply(this,e),t=0,c()},history.replaceState=function(...e){i==null||i.apply(this,e),t=0,c()},window.addEventListener("popstate",E))}function N(){u=!1,t=0,window.clearTimeout(m),w(),window.removeEventListener("popstate",E),a!=null&&(history.pushState=a,a=void 0),i!=null&&(history.replaceState=i,i=void 0)}function E(){t=0,c()}window.pluginActivators==null&&(window.pluginActivators={});window.pluginActivators[s]={activate:D,deactivate:N};
