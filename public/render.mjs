export function formatPrice(price) {
  return `${price.toLocaleString('ko-KR')}원`;
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Excel에서 온 문자열은 innerHTML로 들어가므로 반드시 이스케이프한다.
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

// 시트 한 장 = 시트명 + 카테고리 메타 + 카테고리별 메뉴 목록
export function renderPage(page) {
  const meta = page.groups.map((group) => group.category).filter(Boolean).join(' · ');
  return `<section class="page"><div class="board-sheet"><h2 class="sheet-title">${escapeHtml(page.title)}</h2><span class="sheet-meta">${escapeHtml(meta)}</span></div>${page.groups.map(renderGroup).join('')}</section>`;
}

function renderGroup(group) {
  return `<section class="menu-group"><h2 class="group-title">${escapeHtml(group.category)}</h2><ul class="menu-list">${group.items.map(renderItem).join('')}</ul></section>`;
}

function renderItem(item) {
  const soldOutClass = item.soldOut ? ' is-sold-out' : '';
  const soldOutLabel = item.soldOut ? '<span class="sold-out-label">품절</span>' : '';
  return `<li class="menu-item${soldOutClass}"><div class="item-row"><span class="item-name">${escapeHtml(item.name)}</span>${soldOutLabel}<span class="item-leader"></span><span class="item-price">${formatPrice(item.price)}</span></div><p class="item-desc">${escapeHtml(item.desc)}</p></li>`;
}

// 메뉴판 한 화면 = 매장 머리말(영문태그·매장명·구분선) + 선택한 시트 페이지
export function renderBoard(menu, pageIndex) {
  return `<header class="board-header"><p class="board-tagline">${escapeHtml(menu.tagline)}</p><h1 class="board-store">${escapeHtml(menu.store)}</h1><hr class="board-rule" /></header>${renderPage(menu.pages[pageIndex])}`;
}

// design/project 프로토타입의 DEVICES. 가로 태블릿만 2열.
const DEVICES = {
  signage: { width: 1080, height: 1920, columns: 1 },
  'tablet-land': { width: 1920, height: 1440, columns: 2 },
  'tablet-port': { width: 1440, height: 1920, columns: 1 },
  mobile: { width: 1080, height: 2160, columns: 1 },
};
const DEFAULT_DEVICE = 'signage';

export function deviceSpec(device) {
  return DEVICES[device] ?? DEVICES[DEFAULT_DEVICE];
}

export function assetUrls(theme, device) {
  return { background: `/assets/${theme}/bg-${device}.png`, frame: `/assets/${theme}/frame-${device}.png` };
}

export function fitScale(canvas, viewport) {
  return Math.min(viewport.width / canvas.width, viewport.height / canvas.height);
}

export function renderPageTabs(pages, activeIndex) {
  return `<nav class="page-tabs">${pages.map((page, index) => renderTab(page.title, index, index === activeIndex)).join('')}</nav>`;
}

function renderTab(title, index, isActive) {
  const current = isActive ? ' aria-current="page"' : '';
  return `<button type="button" class="page-tab" data-page-index="${index}"${current}>${escapeHtml(title)}</button>`;
}

export function clampPageIndex(index, pageCount) {
  return index < pageCount ? index : 0;
}

export function themeClass(theme) {
  return `theme-${theme}`;
}

export function nextPageIndex(current, total) {
  return (current + 1) % total;
}

// autoRotateSec이 0 이하면 타이머를 만들지 않는다. SSE로 다시 그릴 때 stop()으로 이전 타이머를 정리한다.
export function startRotation({ autoRotateSec, pageCount, onChange, startIndex = 0 }) {
  if (autoRotateSec <= 0) return { stop() {} };
  let index = startIndex;
  const timer = setInterval(() => {
    index = nextPageIndex(index, pageCount);
    onChange(index);
  }, autoRotateSec * 1000);
  return { stop: () => clearInterval(timer) };
}
