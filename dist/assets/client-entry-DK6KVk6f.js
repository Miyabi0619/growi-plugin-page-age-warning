const f="growi-plugin-page-age-warning";const S=["aside",'nav[aria-label*="sidebar" i]','[id="grw-sidebar"]','[id="grw-custom-sidebar"]','[id="custom-sidebar"]','[class~="grw-sidebar"]','[class~="grw-sidebar-content"]','[class~="grw-custom-sidebar"]','[class~="custom-sidebar"]','[data-testid="grw-sidebar"]','[data-testid="custom-sidebar"]','[data-testid="sidebar"]'].join(","),s={dateField:"createdAt",showFreshMessage:!1,firstThresholdDays:365,secondThresholdDays:730,ignoredPagePaths:["/","/Sidebar"],ignoredPagePathPatterns:[/(^|\/)__?Template(\/|$)/]};function d(...e){window.localStorage.getItem(`${f}:debug`)==="true"&&console.info(`[${f}]`,...e)}let p,o=0,m=!1,c,u;function h(e){return e.replace(/\/+$/,"")||"/"}function v(e){const t=h(e);return s.ignoredPagePaths.includes(t)||s.ignoredPagePathPatterns.some(n=>n.test(t))?!0:/^\/(_api|admin|login|logout|me|trash|in-app-notification|installer|search|tags)(\/|$)/.test(t)}function w(){document.querySelectorAll(".growi-page-age-warning").forEach(e=>e.remove())}function T(){if(document.getElementById("growi-page-age-warning-style")!=null)return;const e=document.createElement("style");e.id="growi-page-age-warning-style",e.textContent=`
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
  `,document.head.appendChild(e)}function N(){return document.querySelector('main, [role="main"]')}function b(e){return e.closest(S)!=null}function $(e){const t=e.getBoundingClientRect();return t.width>0&&t.height>0}function P(e){const t=Array.from(e.querySelectorAll('[data-testid="page-title"], .grw-page-title, h1'));return t.find(n=>!b(n)&&$(n))??t.find(n=>!b(n))??null}function A(e){const t=P(e);if(t!=null){const a=t.closest('[data-testid="page-header"], .grw-page-header, .page-header, .grw-page-title-container, .page-title-container, header')??t,r=a.parentElement;if(r!=null)return{parent:r,before:a.nextSibling}}const n=[".grw-page-content",'[data-testid="page-content"]',".page-content",".page-content-preview",".revision-body",".markdown-body",".markdown-preview",".wiki"];for(const a of n){const r=Array.from(e.querySelectorAll(a)).find(i=>!b(i));if(r!=null)return{parent:r.parentElement??e,before:r.parentElement==null?e.firstChild:r}}return{parent:e,before:e.firstChild}}function E(e){return new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"long",day:"numeric"}).format(e)}function R(e){const t=e.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?/);if(t==null)return null;const[,n,a,r,i="0",l="0"]=t,y=new Date(Number(n),Number(a)-1,Number(r),Number(i),Number(l));return Number.isNaN(y.getTime())?null:y}function _(e){var n;const t=e.cloneNode(!0);return t.querySelectorAll(S).forEach(a=>a.remove()),((n=t.textContent)==null?void 0:n.replace(/\s+/g," "))??""}function L(e){const t="作成日",n=_(e),a=t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),r=n.match(new RegExp(`${a}\\s+(\\d{4}/\\d{1,2}/\\d{1,2}(?:\\s+\\d{1,2}:\\d{1,2})?)`));if(r==null)return null;const i=R(r[1]);return i==null?null:{date:i,source:"dom"}}async function I(e){try{const t=new URLSearchParams({path:e}),n=await fetch(`/_api/v3/page?${t.toString()}`,{method:"GET",credentials:"same-origin"});if(!n.ok)return d("failed to fetch page data",n.status,n.statusText),null;const a=await n.json(),r=a.page??a;if(r.path!=null&&h(r.path)!==h(e))return d("page path mismatch",{requested:e,actual:r.path}),null;const i=r[s.dateField];if(i==null)return d(`${s.dateField} is missing in page data`,a),null;const l=new Date(i);return Number.isNaN(l.getTime())?(d(`${s.dateField} is invalid`,i),null):{date:l,source:"api"}}catch(t){return d("failed to fetch page data",t),null}}async function F(e,t){return await I(e)??L(t)}function M(e,t){const n="作成";return e<s.firstThresholdDays?null:e<s.secondThresholdDays?{className:"stale",title:`${n}から1年以上経過しています`,body:`${n}日: ${E(t)}。内容が現在の運用と異なる可能性があります。`}:{className:"very-stale",title:`${n}から2年以上経過しています`,body:`${n}日: ${E(t)}。内容が古い可能性が高いため、参照時は注意してください。`}}async function x(){const e=decodeURIComponent(window.location.pathname);if(v(e))return w(),!0;const t=N();if(t==null)return!1;const n=A(t);if(n==null)return!1;w(),T();const a=await F(e,t);if(a==null)return d(`could not find ${s.dateField}`),!0;const r=Math.floor((Date.now()-a.date.getTime())/864e5);d("date resolved",{field:s.dateField,source:a.source,date:a.date.toISOString(),days:r});const i=M(r,a.date);if(i==null)return d("message hidden because page age is under threshold",r),!0;const l=document.createElement("div");return l.className=`growi-page-age-warning ${i.className}`,l.innerHTML=`
    <strong>${i.title}</strong>
    <span>${i.body}</span>
  `,n.parent.insertBefore(l,n.before),!0}function g(){window.clearTimeout(p),p=window.setTimeout(()=>{x().then(e=>{if(e){o=0;return}if(!m||o>=20){console.debug(`[${f}] insert target was not found`),o=0;return}o+=1,window.setTimeout(g,500)}).catch(e=>{o=0,console.debug(`[${f}] failed to render warning`,e)})},300)}function C(){m||(m=!0,o=0,g(),c=history.pushState,u=history.replaceState,history.pushState=function(...e){c==null||c.apply(this,e),o=0,g()},history.replaceState=function(...e){u==null||u.apply(this,e),o=0,g()},window.addEventListener("popstate",D))}function k(){m=!1,o=0,window.clearTimeout(p),w(),window.removeEventListener("popstate",D),c!=null&&(history.pushState=c,c=void 0),u!=null&&(history.replaceState=u,u=void 0)}function D(){o=0,g()}window.pluginActivators==null&&(window.pluginActivators={});window.pluginActivators[f]={activate:C,deactivate:k};
