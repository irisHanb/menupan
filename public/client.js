import { renderPage, themeClass, startRotation } from './render.mjs';

const menuRoot = document.getElementById('menu');
const storeName = document.getElementById('store-name');
let rotation = { stop() {} };

async function refresh() {
  const menu = await (await fetch('/api/menu')).json();
  storeName.textContent = menu.store;
  document.title = menu.store || '메뉴판';
  document.body.className = themeClass(menu.theme);

  const showPage = (index) => {
    menuRoot.innerHTML = menu.pages[index] ? renderPage(menu.pages[index]) : '';
  };
  rotation.stop();
  showPage(0);
  rotation = startRotation({ autoRotateSec: menu.autoRotateSec, pageCount: menu.pages.length, onChange: showPage });
}

new EventSource('/events').addEventListener('menu-updated', refresh);
refresh();
