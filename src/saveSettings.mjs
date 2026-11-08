import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { SETTINGS_COLUMNS, SETTINGS_SHEET, SETTING_KEYS } from './parseWorkbook.mjs';

// 어드민에서 바꾼 설정을 `_설정` 시트에 쓴다. 메뉴 시트는 건드리지 않는다.
export async function saveSettings(filePath, patch) {
  const workbook = XLSX.read(readFileSync(filePath));
  const rows = upsertSettingRows(readSettingRows(workbook.Sheets[SETTINGS_SHEET]), patch);
  replaceSettingsSheet(workbook, XLSX.utils.aoa_to_sheet(rows));
  writeWorkbookAtomically(filePath, workbook);
}

// `항목 | 값` 두 열 시트를 2차원 배열로 읽는다. 시트가 없으면 헤더만 있는 배열.
function readSettingRows(sheet) {
  if (!sheet) return [[SETTINGS_COLUMNS.key, SETTINGS_COLUMNS.value]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1 });
}

// 같은 항목 행이 있으면 값을 바꾸고, 없으면 맨 아래에 행을 붙인다.
function upsertSettingRows(rows, patch) {
  for (const [field, value] of Object.entries(patch)) {
    const label = SETTING_KEYS[field];
    const row = rows.find(([key]) => key === label);
    if (row) row[1] = value;
    else rows.push([label, value]);
  }
  return rows;
}

function replaceSettingsSheet(workbook, sheet) {
  if (workbook.Sheets[SETTINGS_SHEET]) workbook.Sheets[SETTINGS_SHEET] = sheet;
  else XLSX.utils.book_append_sheet(workbook, sheet, SETTINGS_SHEET);
}

// 임시 파일에 다 쓴 뒤 rename 한다. 감시자와 서버가 반쯤 쓰인 파일을 읽지 않는다.
function writeWorkbookAtomically(filePath, workbook) {
  const tmp = path.join(path.dirname(filePath), `.${path.basename(filePath)}.tmp`);
  writeFileSync(tmp, XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  renameSync(tmp, filePath);
}
