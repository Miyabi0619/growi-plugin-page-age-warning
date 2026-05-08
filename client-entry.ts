type GrowiPageResponse = {
  page?: {
    path?: string;
    updatedAt?: string;
    createdAt?: string;
  };
  updatedAt?: string;
  createdAt?: string;
};

const PLUGIN_NAME = 'growi-plugin-page-age-warning';

const CONFIG = {
  // 'updatedAt' にすると「最終更新日」基準
  // 'createdAt' にすると「投稿日」基準
  dateField: 'updatedAt' as 'updatedAt' | 'createdAt',

  // 1年以内も青色で表示したいなら true
  showFreshMessage: false,

  firstThresholdDays: 365,
  secondThresholdDays: 730,
};

let lastPath = '';
let timer: number | undefined;

function isIgnoredPath(pathname: string): boolean {
  return /^\/(_api|admin|login|logout|me|trash|in-app-notification|installer)(\/|$)/.test(pathname);
}

function removeBanner(): void {
  document.querySelectorAll('.growi-page-age-warning').forEach((el) => el.remove());
}

function ensureStyle(): void {
  if (document.getElementById('growi-page-age-warning-style') != null) return;

  const style = document.createElement('style');
  style.id = 'growi-page-age-warning-style';
  style.textContent = `
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
  `;
  document.head.appendChild(style);
}

function findInsertTarget(): Element | null {
  return (
    document.querySelector('.grw-page-content')?.parentElement ??
    document.querySelector('.wiki')?.parentElement ??
    document.querySelector('main') ??
    null
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function buildMessage(days: number, date: Date): { className: string; title: string; body: string } | null {
  const fieldLabel = CONFIG.dateField === 'updatedAt' ? '最終更新' : '作成';

  if (days < CONFIG.firstThresholdDays) {
    if (!CONFIG.showFreshMessage) return null;

    return {
      className: 'fresh',
      title: `${fieldLabel}から1年以内です`,
      body: `${fieldLabel}日: ${formatDate(date)}`,
    };
  }

  if (days < CONFIG.secondThresholdDays) {
    return {
      className: 'stale',
      title: `${fieldLabel}から1年以上経過しています`,
      body: `${fieldLabel}日: ${formatDate(date)}。内容が現在の運用と異なる可能性があります。`,
    };
  }

  return {
    className: 'very-stale',
    title: `${fieldLabel}から2年以上経過しています`,
    body: `${fieldLabel}日: ${formatDate(date)}。内容が古い可能性が高いため、参照時は注意してください。`,
  };
}

async function renderWarning(): Promise<void> {
  const pathname = decodeURIComponent(window.location.pathname);

  if (isIgnoredPath(pathname)) {
    removeBanner();
    return;
  }

  const target = findInsertTarget();
  if (target == null) return;

  removeBanner();
  ensureStyle();

  const params = new URLSearchParams({ path: pathname });

  const res = await fetch(`/_api/v3/page?${params.toString()}`, {
    method: 'GET',
    credentials: 'same-origin',
  });

  if (!res.ok) return;

  const data = (await res.json()) as GrowiPageResponse;
  const page = data.page ?? data;

  const rawDate = page[CONFIG.dateField];
  if (rawDate == null) return;

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return;

  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  const message = buildMessage(days, date);
  if (message == null) return;

  const banner = document.createElement('div');
  banner.className = `growi-page-age-warning ${message.className}`;
  banner.innerHTML = `
    <strong>${message.title}</strong>
    <span>${message.body}</span>
  `;

  target.prepend(banner);
}

function scheduleRender(): void {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    const pathname = window.location.pathname;
    if (pathname === lastPath) return;

    lastPath = pathname;
    renderWarning().catch((err) => {
      console.debug(`[${PLUGIN_NAME}] failed to render warning`, err);
    });
  }, 300);
}

function activate(): void {
  lastPath = '';
  scheduleRender();

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    scheduleRender();
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    scheduleRender();
  };

  window.addEventListener('popstate', scheduleRender);
}

function deactivate(): void {
  removeBanner();
  window.removeEventListener('popstate', scheduleRender);
}

declare global {
  interface Window {
    pluginActivators?: Record<string, { activate: () => void; deactivate: () => void }>;
  }
}

if (window.pluginActivators == null) {
  window.pluginActivators = {};
}

window.pluginActivators[PLUGIN_NAME] = {
  activate,
  deactivate,
};