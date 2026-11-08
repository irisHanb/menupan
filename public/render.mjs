export function formatPrice(price) {
  return `${price.toLocaleString('ko-KR')}원`;
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Excel에서 온 문자열은 innerHTML로 들어가므로 반드시 이스케이프한다.
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

export function renderPage(page) {
  return `<section class="page"><h1 class="page-title">${escapeHtml(page.title)}</h1>${page.groups.map(renderGroup).join('')}</section>`;
}

function renderGroup(group) {
  return `<section class="menu-group"><h2 class="group-title">${escapeHtml(group.category)}</h2><ul class="menu-list">${group.items.map(renderItem).join('')}</ul></section>`;
}

function renderItem(item) {
  const soldOutClass = item.soldOut ? ' is-sold-out' : '';
  const soldOutLabel = item.soldOut ? '<span class="sold-out-label">품절</span>' : '';
  return `<li class="menu-item${soldOutClass}"><span class="item-name">${escapeHtml(item.name)}</span>${soldOutLabel}<span class="item-price">${formatPrice(item.price)}</span><p class="item-desc">${escapeHtml(item.desc)}</p></li>`;
}

export function themeClass(theme) {
  return `theme-${theme}`;
}

export function nextPageIndex(current, total) {
  return (current + 1) % total;
}

// autoRotateSec이 0 이하면 타이머를 만들지 않는다. SSE로 다시 그릴 때 stop()으로 이전 타이머를 정리한다.
export function startRotation({ autoRotateSec, pageCount, onChange }) {
  if (autoRotateSec <= 0) return { stop() {} };
  let index = 0;
  const timer = setInterval(() => {
    index = nextPageIndex(index, pageCount);
    onChange(index);
  }, autoRotateSec * 1000);
  return { stop: () => clearInterval(timer) };
}
