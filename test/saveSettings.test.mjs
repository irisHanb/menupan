import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { saveSettings } from '../src/saveSettings.mjs';
import { loadMenuFromFile } from '../src/loadMenuFromFile.mjs';

const HEADER = ['메뉴명', '가격', '설명', '품절', '카테고리'];

// 시트명 → aoa 로 임시 .xlsx 파일을 만든다.
async function writeWorkbookFile(sheets) {
  const workbook = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), name);
  }
  const file = path.join(await mkdtemp(path.join(tmpdir(), 'menupan-save-')), 'menu.xlsx');
  await writeFile(file, XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  return file;
}

const SAMPLE = {
  커피: [HEADER, ['아메리카노', 4500, '깔끔한 산미', '', '에스프레소']],
  디저트: [HEADER, ['티라미수', 6500, '', 'Y', '케이크']],
  _설정: [
    ['항목', '값'],
    ['매장명', '빌런 커피'],
    ['테마', 'deep-green'],
    ['자동전환초', 0],
  ],
};

// M9 — 어드민 저장 값을 `_설정` 시트에 쓴다
test('shouldUpdateExistingSettingRowsInWorkbookFile', async () => {
  const file = await writeWorkbookFile(SAMPLE);
  await saveSettings(file, { theme: 'cream', autoRotateSec: 7 });
  const menu = loadMenuFromFile(file);
  assert.equal(menu.theme, 'cream');
  assert.equal(menu.autoRotateSec, 7);
  assert.equal(menu.store, '빌런 커피', '넘기지 않은 설정은 그대로');
});

test('shouldAppendSettingRowsThatDoNotExistYet', async () => {
  const file = await writeWorkbookFile(SAMPLE);
  await saveSettings(file, { displaySheet: '디저트' });
  assert.equal(loadMenuFromFile(file).displaySheet, '디저트');
});

test('shouldCreateSettingsSheetWhenMissing', async () => {
  const { _설정, ...menuOnly } = SAMPLE;
  const file = await writeWorkbookFile(menuOnly);
  await saveSettings(file, { store: '새 매장' });
  const menu = loadMenuFromFile(file);
  assert.equal(menu.store, '새 매장');
  assert.deepEqual(
    menu.pages.map((page) => page.title),
    ['커피', '디저트'],
    '`_설정` 시트는 페이지가 되지 않는다',
  );
});

test('shouldKeepMenuSheetsIntactAfterSave', async () => {
  const file = await writeWorkbookFile(SAMPLE);
  const before = loadMenuFromFile(file).pages;
  await saveSettings(file, { theme: 'beige', store: '다른 이름', tagline: 'ROASTERY', device: 'mobile' });
  assert.deepEqual(loadMenuFromFile(file).pages, before);
});
