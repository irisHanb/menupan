import { renderBoard, initialPageIndex, themeClass, startRotation, deviceSpec, assetUrls, fitScale } from './render.mjs';

// 키오스크 화면: 어드민에서 정한 테마·디바이스·표시시트대로 메뉴판만 그린다.
const stageViewport = document.getElementById('viewport');
const canvas = document.getElementById('canvas');
const board = document.getElementById('board');
const bgLayer = document.getElementById('bg-layer');
const frameLayer = document.getElementById('frame-layer');
let menu = { pages: [] };
let rotation = { stop() {} };

function showPage(index) {
  board.innerHTML = menu.pages[index] ? renderBoard(menu, index) : '';
}

// 디바이스 해상도 그대로의 캔버스를 화면 안에 비율 유지로 맞춘다.
function fitCanvas() {
  const scale = fitScale(deviceSpec(menu.device), { width: stageViewport.clientWidth, height: stageViewport.clientHeight });
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
  fitCanvas();
}

async function refresh() {
  menu = await (await fetch('/api/menu')).json();
  document.title = menu.store || '메뉴판';
  applyDesign();
  const startIndex = initialPageIndex(menu.pages, menu.displaySheet);
  showPage(startIndex);
  rotation.stop();
  rotation = startRotation({ autoRotateSec: menu.autoRotateSec, pageCount: menu.pages.length, startIndex, onChange: showPage });
}

window.addEventListener('resize', fitCanvas);
new EventSource('/events').addEventListener('menu-updated', refresh);
refresh();
