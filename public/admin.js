import { renderBoard, renderPageTabs, deviceSpec, assetUrls, fitScale, themeClass } from './render.mjs';
import { renderThemeOptions, renderDeviceOptions, previewMenu } from './admin-view.mjs';

const $ = (id) => document.getElementById(id);
const fields = ['store', 'tagline', 'autoRotateSec'];
let menu = { pages: [] };
let choices = { themes: [], devices: [], sheets: [] };
let draft = {};

async function load() {
  const settingsResponse = await fetch('/admin/api/settings');
  if (settingsResponse.status === 401) return location.assign('/admin/login');
  const data = await settingsResponse.json();
  menu = await (await fetch('/api/menu')).json();
  choices = data;
  draft = { ...data.settings };
  for (const field of fields) $(`field-${field}`).value = draft[field];
  render();
}

function displayIndex() {
  return Math.max(0, menu.pages.findIndex((page) => page.title === draft.displaySheet));
}

function render() {
  $('theme-options').innerHTML = renderThemeOptions(choices.themes, draft.theme);
  $('device-options').innerHTML = renderDeviceOptions(choices.devices, draft.device);
  $('sheet-options').innerHTML = renderPageTabs(menu.pages, displayIndex());
  renderPreview();
}

// 프로토타입의 stage: 디바이스 해상도 캔버스를 무대 크기에 맞춰 축소해 보여 준다.
function renderPreview() {
  const preview = previewMenu(menu, draft);
  const spec = deviceSpec(preview.device);
  const urls = assetUrls(preview.theme, preview.device);
  const canvas = $('preview-canvas');
  canvas.className = `canvas ${themeClass(preview.theme)}`;
  canvas.style.setProperty('--w', `${spec.width}px`);
  canvas.style.setProperty('--h', `${spec.height}px`);
  canvas.style.setProperty('--u', `${Math.min(spec.width, spec.height)}px`);
  canvas.style.setProperty('--cols', spec.columns);
  const viewport = $('preview-viewport');
  canvas.style.setProperty('--scale', fitScale(spec, { width: viewport.clientWidth, height: viewport.clientHeight }));
  $('preview-bg').style.backgroundImage = `url("${urls.background}")`;
  $('preview-frame').style.backgroundImage = `url("${urls.frame}")`;
  $('preview-board').innerHTML = menu.pages.length > 0 ? renderBoard(preview, displayIndex()) : '';
  $('bg-url').textContent = urls.background;
  $('frame-url').textContent = urls.frame;
  $('dim-label').textContent = `${spec.width} × ${spec.height}px`;
}

function setStatus(text, isError = false) {
  $('save-status').textContent = text;
  $('save-status').classList.toggle('is-error', isError);
}

async function save() {
  $('save-button').disabled = true;
  setStatus('저장 중입니다.');
  try {
    const response = await fetch('/admin/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    if (response.status === 401) return location.assign('/admin/login');
    const body = await response.json();
    if (response.ok) setStatus('저장했습니다. menu.xlsx에 기록했고 메뉴판 화면에 반영됩니다.');
    else setStatus(body.errors ? Object.values(body.errors).join(' ') : body.error, true);
  } catch (error) {
    setStatus(`저장하지 못했습니다: ${error.message}`, true);
  } finally {
    $('save-button').disabled = false;
  }
}

$('theme-options').addEventListener('click', (event) => {
  const button = event.target.closest('[data-theme]');
  if (!button) return;
  draft.theme = button.dataset.theme;
  render();
});
$('device-options').addEventListener('click', (event) => {
  const button = event.target.closest('[data-device]');
  if (!button) return;
  draft.device = button.dataset.device;
  render();
});
$('sheet-options').addEventListener('click', (event) => {
  const button = event.target.closest('[data-page-index]');
  if (!button) return;
  draft.displaySheet = menu.pages[Number(button.dataset.pageIndex)].title;
  render();
});
for (const field of fields) {
  $(`field-${field}`).addEventListener('input', (event) => {
    draft[field] = event.target.value;
    renderPreview();
  });
}
$('save-button').addEventListener('click', save);
window.addEventListener('resize', renderPreview);
// 다른 곳(Excel 직접 수정)에서 메뉴가 바뀌면 메뉴 내용만 다시 읽는다. 편집 중인 초안은 유지한다.
new EventSource('/events').addEventListener('menu-updated', async () => {
  menu = await (await fetch('/api/menu')).json();
  render();
});
load();
