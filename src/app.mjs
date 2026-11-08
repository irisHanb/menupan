import express from 'express';
import { EMPTY_MENU } from './parseWorkbook.mjs';
import { createSseHub } from './sseHub.mjs';

const MENU_UPDATED_EVENT = 'menu-updated';

export function createApp({ loadMenu, publicDir }) {
  const app = express();
  app.get('/api/menu', (_req, res) => res.json(loadMenuOrEmpty(loadMenu)));
  const hub = createSseHub();
  app.get('/events', (req, res) => hub.connect(req, res));
  app.notifyMenuUpdated = () => hub.broadcast(MENU_UPDATED_EVENT);
  if (publicDir) app.use(express.static(publicDir));
  return app;
}

// 워크북이 깨졌거나 저장 중이어도 화면이 비어 있을 뿐 500을 내지 않는다.
function loadMenuOrEmpty(loadMenu) {
  try {
    return loadMenu();
  } catch {
    return EMPTY_MENU;
  }
}
