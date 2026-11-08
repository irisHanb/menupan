import path from 'node:path';
import { createApp } from './src/app.mjs';
import { loadMenuFromFile } from './src/loadMenuFromFile.mjs';
import { watchWorkbook } from './src/watchWorkbook.mjs';

const DATA_PATH = process.env.DATA_PATH ?? path.join(import.meta.dirname, 'data/menu.xlsx');
const PORT = Number(process.env.PORT ?? 3000);
// Excel 저장 한 번에 생기는 여러 파일 이벤트를 한 번의 갱신으로 합친다.
const WATCH_DEBOUNCE_MS = 300;

const app = createApp({
  loadMenu: () => loadMenuFromFile(DATA_PATH),
  publicDir: path.join(import.meta.dirname, 'public'),
});
const server = app.listen(PORT, () => console.log(`listening on ${server.address().port}`));
watchWorkbook(DATA_PATH, app.notifyMenuUpdated, { debounceMs: WATCH_DEBOUNCE_MS });
