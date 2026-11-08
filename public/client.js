import { renderBoard, renderPageTabs, clampPageIndex, themeClass, startRotation, deviceSpec, assetUrls, fitScale } from './render.mjs';

const stageViewport = document.getElementById('viewport');
const canvas = document.getElementById('canvas');
const board = document.getElementById('board');
const tabsRoot = document.getElementById('tabs');
const bgLayer = document.getElementById('bg-layer');
const frameLayer = document.getElementById('frame-layer');
let menu = { pages: [] };
let pageIndex = 0;
let rotation = { stop() {} };

function showPage(index) {
  pageIndex = index;
  board.innerHTML = menu.pages[index] ? renderBoard(menu, index) : '';
  tabsRoot.innerHTML = menu.pages.length > 1 ? renderPageTabs(menu.pages, index) : '';
  fitCanvas();
}

function restartRotation() {
  rotation.stop();
  rotation = startRotation({
    autoRotateSec: menu.autoRotateSec,
    pageCount: menu.pages.length,
    startIndex: pageIndex,
    onChange: showPage,
  });
}

// 디바이스 해상도 그대로의 캔버스를 화면 안에 비율 유지로 맞춘다.
function fitCanvas() {
  const spec = deviceSpec(menu.device);
  const scale = fitScale(spec, { width: stageViewport.clientWidth, height: stageViewport.clientHeight });
  canvas.style.setProperty('--scale', scale);
}

function applyDesign() {
  const spec = deviceSpec(menu.device);
  const urls = assetUrls(menu.theme, menu.device);
  document.body.className = themeClass(menu.theme);
  canvas.style.setProperty('--w', `${spec.width}px`);
  canvas.style.setProperty('--h', `${spec.height}px`);
  canvas.style.setProperty('--u', `${Math.min(spec.width, spec.height)}px`);
  canvas.style.setProperty('--cols', spec.columns);
  bgLayer.style.backgroundImage = `url("${urls.background}")`;
  frameLayer.style.backgroundImage = `url("${urls.frame}")`;
}

async function refresh() {
  menu = await (await fetch('/api/menu')).json();
  document.title = menu.store || '메뉴판';
  applyDesign();
  showPage(clampPageIndex(pageIndex, menu.pages.length));
  restartRotation();
}

tabsRoot.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-page-index]');
  if (!tab) return;
  showPage(Number(tab.dataset.pageIndex));
  restartRotation();
});

window.addEventListener('resize', fitCanvas);
new EventSource('/events').addEventListener('menu-updated', refresh);
refresh();
