type GrowiPageResponse = {
  page?: {
    path?: string;
    updatedAt?: string;
    createdAt?: string;
  };
  updatedAt?: string;
  createdAt?: string;
};

export {};

const PLUGIN_NAME = 'growi-plugin-page-age-warning';
const RENDER_DELAY_MS = 300;
const RETRY_DELAY_MS = 500;
const MAX_RENDER_RETRIES = 20;

const CONFIG = {
  // 'updatedAt' にすると「最終更新日」基準
  // 'createdAt' にすると「作成日」基準
  dateField: 'createdAt' as 'updatedAt' | 'createdAt',

  // 1年以内も青色で表示したいなら true
  showFreshMessage: false,

  firstThresholdDays: 365,
  secondThresholdDays: 730,
};

let timer: number | undefined;
let retryCount = 0;
let isActive = false;
let originalPushState: History['pushState'] | undefined;
let originalReplaceState: History['replaceState'] | undefined;

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
  const contentSelectors = [
    '.grw-page-content',
    '[data-testid="page-content"]',
    '.page-content',
    '.page-content-preview',
    '.revision-body',
    '.markdown-body',
    '.markdown-preview',
    '.wiki',
  ];

  for (const selector of contentSelectors) {
    const content = document.querySelector(selector);
    if (content != null) {
      return content.parentElement ?? content;
    }
  }

  const pageTitle = document.querySelector('main h1, [data-testid="page-title"], .grw-page-title');
  return pageTitle?.parentElement ?? document.querySelector('main') ?? null;
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

async function renderWarning(): Promise<boolean> {
  const pathname = decodeURIComponent(window.location.pathname);

  if (isIgnoredPath(pathname)) {
    removeBanner();
    return true;
  }

  const target = findInsertTarget();
  if (target == null) return false;

  removeBanner();
  ensureStyle();

  const params = new URLSearchParams({ path: pathname });

  const res = await fetch(`/_api/v3/page?${params.toString()}`, {
    method: 'GET',
    credentials: 'same-origin',
  });

  if (!res.ok) {
    console.debug(`[${PLUGIN_NAME}] failed to fetch page data`, res.status, res.statusText);
    return true;
  }

  const data = (await res.json()) as GrowiPageResponse;
  const page = data.page ?? data;

  const rawDate = page[CONFIG.dateField];
  if (rawDate == null) {
    console.debug(`[${PLUGIN_NAME}] ${CONFIG.dateField} is missing in page data`);
    return true;
  }

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    console.debug(`[${PLUGIN_NAME}] ${CONFIG.dateField} is invalid`, rawDate);
    return true;
  }

  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  const message = buildMessage(days, date);
  if (message == null) return true;

  const banner = document.createElement('div');
  banner.className = `growi-page-age-warning ${message.className}`;
  banner.innerHTML = `
    <strong>${message.title}</strong>
    <span>${message.body}</span>
  `;

  target.prepend(banner);
  return true;
}

function scheduleRender(): void {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    renderWarning()
      .then((completed) => {
        if (completed) {
          retryCount = 0;
          return;
        }

        if (!isActive || retryCount >= MAX_RENDER_RETRIES) {
          console.debug(`[${PLUGIN_NAME}] insert target was not found`);
          retryCount = 0;
          return;
        }

        retryCount += 1;
        window.setTimeout(scheduleRender, RETRY_DELAY_MS);
      })
      .catch((err) => {
        retryCount = 0;
        console.debug(`[${PLUGIN_NAME}] failed to render warning`, err);
      });
  }, RENDER_DELAY_MS);
}

function activate(): void {
  if (isActive) return;

  isActive = true;
  retryCount = 0;
  scheduleRender();

  originalPushState = history.pushState;
  originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState?.apply(this, args);
    retryCount = 0;
    scheduleRender();
  };

  history.replaceState = function (...args) {
    originalReplaceState?.apply(this, args);
    retryCount = 0;
    scheduleRender();
  };

  window.addEventListener('popstate', handleNavigation);
}

function deactivate(): void {
  isActive = false;
  retryCount = 0;
  window.clearTimeout(timer);
  removeBanner();
  window.removeEventListener('popstate', handleNavigation);

  if (originalPushState != null) {
    history.pushState = originalPushState;
    originalPushState = undefined;
  }

  if (originalReplaceState != null) {
    history.replaceState = originalReplaceState;
    originalReplaceState = undefined;
  }
}

function handleNavigation(): void {
  retryCount = 0;
  scheduleRender();
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
