type GrowiPageResponse = {
  page?: {
    path?: string;
    updatedAt?: string;
    createdAt?: string;
    isEmpty?: boolean;
    wip?: boolean;
  };
  path?: string;
  updatedAt?: string;
  createdAt?: string;
  isEmpty?: boolean;
  wip?: boolean;
};

type PageDate = {
  date: Date;
  source: 'api' | 'dom';
};

type InsertPosition = {
  parent: Element;
  before: Node | null;
};

export {};

const PLUGIN_NAME = 'growi-plugin-page-age-warning';
const RENDER_DELAY_MS = 300;
const RETRY_DELAY_MS = 500;
const MAX_RENDER_RETRIES = 20;
const SIDEBAR_SELECTOR = [
  'aside',
  'nav[aria-label*="sidebar" i]',
  '[id="grw-sidebar"]',
  '[id="grw-custom-sidebar"]',
  '[id="custom-sidebar"]',
  '[class~="grw-sidebar"]',
  '[class~="grw-sidebar-content"]',
  '[class~="grw-custom-sidebar"]',
  '[class~="custom-sidebar"]',
  '[data-testid="grw-sidebar"]',
  '[data-testid="custom-sidebar"]',
  '[data-testid="sidebar"]',
].join(',');
const SECONDARY_PANEL_SELECTOR = [
  SIDEBAR_SELECTOR,
  '[class~="toc"]',
  '[class~="grw-toc"]',
  '[class~="page-tags"]',
  '[data-testid*="toc" i]',
  '[aria-label*="目次"]',
  '[aria-label*="table of contents" i]',
].join(',');

const CONFIG = {
  // 'updatedAt' にすると「最終更新日」基準
  // 'createdAt' にすると「作成日」基準
  dateField: 'updatedAt' as 'updatedAt' | 'createdAt',

  // 1年以内も青色で表示したいなら true
  showFreshMessage: false,

  firstThresholdDays: 365,
  secondThresholdDays: 730,

  ignoredPagePaths: [
    '/',
    '/Sidebar',
  ],

  ignoredPagePathPatterns: [
    /(^|\/)__?Template(\/|$)/,
  ],
};

function debugLog(...args: unknown[]): void {
  if (window.localStorage.getItem(`${PLUGIN_NAME}:debug`) !== 'true') return;
  console.info(`[${PLUGIN_NAME}]`, ...args);
}

let timer: number | undefined;
let retryCount = 0;
let isActive = false;
let originalPushState: History['pushState'] | undefined;
let originalReplaceState: History['replaceState'] | undefined;

function normalizePagePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

function isIgnoredPath(pathname: string): boolean {
  const normalizedPath = normalizePagePath(pathname);
  if (CONFIG.ignoredPagePaths.includes(normalizedPath)) return true;
  if (CONFIG.ignoredPagePathPatterns.some((pattern) => pattern.test(normalizedPath))) return true;

  return /^\/(_api|admin|login|logout|me|trash|in-app-notification|installer|search|tags)(\/|$)/.test(normalizedPath);
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
  `;
  document.head.appendChild(style);
}

function isInsideSidebar(element: Element): boolean {
  return element.closest(SECONDARY_PANEL_SELECTOR) != null;
}

function isVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function findPageRoot(): Element | null {
  const rootSelectors = [
    'main',
    '[role="main"]',
    '.grw-page-wrapper',
    '.grw-page',
    '.page-wrapper',
    '.page-content-wrapper',
    '#page-wrapper',
    '#page',
  ];

  for (const selector of rootSelectors) {
    const root = document.querySelector(selector);
    if (root != null && isVisible(root) && !isInsideSidebar(root)) {
      return root;
    }
  }

  return document.body;
}

function findPageTitle(pageRoot: Element): Element | null {
  const candidates = Array.from(pageRoot.querySelectorAll('[data-testid="page-title"], .grw-page-title, h1'))
    .filter((el) => !isInsideSidebar(el));

  const visibleCandidates = candidates
    .filter(isVisible)
    .map((el) => {
      const rect = el.getBoundingClientRect();
      const selectorScore = el.matches('[data-testid="page-title"], .grw-page-title') ? 100 : 0;
      return {
        el,
        score: selectorScore + rect.left + rect.width / 10,
      };
    })
    .sort((a, b) => b.score - a.score);

  return visibleCandidates[0]?.el ?? candidates[0] ?? null;
}

function findContentElement(pageRoot: Element): Element | null {
  const contentSelectors = [
    '.markdown-body',
    '.markdown-preview',
    '.wiki',
    '.revision-body',
    '[data-testid="page-content"]',
    '.grw-page-content',
    '.page-content-preview',
    '.page-content',
  ];

  const candidates = contentSelectors.flatMap((selector, index) => (
    Array.from(pageRoot.querySelectorAll(selector)).map((el) => ({ el, index }))
  ));

  const visibleCandidates = candidates
    .filter(({ el }) => isVisible(el) && !isInsideSidebar(el))
    .map(({ el, index }) => {
      const rect = el.getBoundingClientRect();
      return {
        el,
        selectorPriority: contentSelectors.length - index,
        top: rect.top,
        left: rect.left,
      };
    })
    .sort((a, b) => (
      b.selectorPriority - a.selectorPriority
      || a.top - b.top
      || b.left - a.left
    ));

  return visibleCandidates[0]?.el
    ?? candidates.find(({ el }) => !isInsideSidebar(el))?.el
    ?? null;
}

function findInsertPosition(pageRoot: Element): InsertPosition | null {
  const content = findContentElement(pageRoot);
  if (content != null) {
    return {
      parent: content,
      before: content.firstChild,
    };
  }

  const pageTitle = findPageTitle(pageRoot);
  if (pageTitle != null) {
    const titleBlock = pageTitle.closest('[data-testid="page-header"], .grw-page-header, .page-header, .grw-page-title-container, .page-title-container, header') ?? pageTitle;
    const parent = titleBlock.parentElement;
    if (parent != null) {
      return {
        parent,
        before: titleBlock.nextSibling,
      };
    }
  }

  return {
    parent: pageRoot,
    before: pageRoot.firstChild,
  };
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function parseLocalDateTime(value: string): Date | null {
  const match = value.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?/);
  if (match == null) return null;

  const [, year, month, day, hour = '0', minute = '0'] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function getTextWithoutSidebar(pageRoot: Element): string {
  const clonedPageRoot = pageRoot.cloneNode(true) as Element;
  clonedPageRoot
    .querySelectorAll(SIDEBAR_SELECTOR)
    .forEach((el) => el.remove());

  return clonedPageRoot.textContent?.replace(/\s+/g, ' ') ?? '';
}

function getDateFromDocument(pageRoot: Element): PageDate | null {
  const label = CONFIG.dateField === 'updatedAt' ? '最終更新日' : '作成日';
  const text = getTextWithoutSidebar(pageRoot);
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`${escapedLabel}\\s+(\\d{4}/\\d{1,2}/\\d{1,2}(?:\\s+\\d{1,2}:\\d{1,2})?)`));
  if (match == null) return null;

  const date = parseLocalDateTime(match[1]);
  return date == null ? null : { date, source: 'dom' };
}

async function getDateFromApi(pathname: string): Promise<PageDate | null> {
  try {
    const params = new URLSearchParams({ path: pathname });

    const res = await fetch(`/_api/v3/page?${params.toString()}`, {
      method: 'GET',
      credentials: 'same-origin',
    });

    if (!res.ok) {
      debugLog('failed to fetch page data', res.status, res.statusText);
      return null;
    }

    const data = (await res.json()) as GrowiPageResponse;
    const page = data.page ?? data;
    if (page.path != null && normalizePagePath(page.path) !== normalizePagePath(pathname)) {
      debugLog('page path mismatch', { requested: pathname, actual: page.path });
      return null;
    }

    const rawDate = page[CONFIG.dateField];
    if (rawDate == null) {
      debugLog(`${CONFIG.dateField} is missing in page data`, data);
      return null;
    }

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) {
      debugLog(`${CONFIG.dateField} is invalid`, rawDate);
      return null;
    }

    return { date, source: 'api' };
  }
  catch (err) {
    debugLog('failed to fetch page data', err);
    return null;
  }
}

async function resolvePageDate(pathname: string, pageRoot: Element): Promise<PageDate | null> {
  const apiDate = await getDateFromApi(pathname);
  return apiDate ?? getDateFromDocument(pageRoot);
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

  const pageRoot = findPageRoot();
  if (pageRoot == null) return false;

  const insertPosition = findInsertPosition(pageRoot);
  if (insertPosition == null) return false;

  removeBanner();
  ensureStyle();

  const pageDate = await resolvePageDate(pathname, pageRoot);
  if (pageDate == null) {
    debugLog(`could not find ${CONFIG.dateField}`);
    return true;
  }

  const days = Math.floor((Date.now() - pageDate.date.getTime()) / 86_400_000);
  debugLog('date resolved', { field: CONFIG.dateField, source: pageDate.source, date: pageDate.date.toISOString(), days });

  const message = buildMessage(days, pageDate.date);
  if (message == null) {
    debugLog('message hidden because page age is under threshold', days);
    return true;
  }

  const banner = document.createElement('div');
  banner.className = `growi-page-age-warning ${message.className}`;
  banner.innerHTML = `
    <strong>${message.title}</strong>
    <span>${message.body}</span>
  `;

  insertPosition.parent.insertBefore(banner, insertPosition.before);
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
