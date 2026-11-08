import * as XLSX from 'xlsx';

const COLUMNS = { name: '메뉴명', price: '가격', desc: '설명', soldOut: '품절', category: '카테고리' };
const SOLD_OUT_MARK = 'Y';
const NON_PAGE_PREFIX = '_';
export const SETTINGS_SHEET = '_설정';
export const SETTINGS_COLUMNS = { key: '항목', value: '값' };
export const SETTING_KEYS = {
  store: '매장명',
  theme: '테마',
  autoRotateSec: '자동전환초',
  device: '디바이스',
  tagline: '영문태그',
  displaySheet: '표시시트',
};
const DEFAULT_SETTINGS = { store: '', theme: 'cafe-dark', autoRotateSec: 0, device: 'signage', tagline: '', displaySheet: '' };
export const EMPTY_MENU = Object.freeze({ ...DEFAULT_SETTINGS, pages: [] });

export function parseWorkbook(workbook) {
  const pages = workbook.SheetNames.filter((name) => isMenuSheet(name, workbook.Sheets[name])).map((name) =>
    toPage(name, workbook.Sheets[name]),
  );
  const settings = toSettings(readSettings(workbook.Sheets[SETTINGS_SHEET]));
  return { ...settings, pages };
}

function toSettings(raw) {
  const autoRotateSec = Number(raw[SETTING_KEYS.autoRotateSec]);
  return {
    store: raw[SETTING_KEYS.store] ?? DEFAULT_SETTINGS.store,
    theme: normalizeKey(raw[SETTING_KEYS.theme] ?? DEFAULT_SETTINGS.theme),
    autoRotateSec: Number.isFinite(autoRotateSec) ? autoRotateSec : DEFAULT_SETTINGS.autoRotateSec,
    device: normalizeKey(raw[SETTING_KEYS.device] ?? DEFAULT_SETTINGS.device),
    tagline: raw[SETTING_KEYS.tagline] ?? DEFAULT_SETTINGS.tagline,
    displaySheet: raw[SETTING_KEYS.displaySheet] ?? DEFAULT_SETTINGS.displaySheet,
  };
}

// 테마·디바이스는 폴더명·CSS 클래스와 맞춰야 하므로 소문자로 정리한다(Numbers가 `Cream`처럼 저장).
function normalizeKey(value) {
  return String(value).trim().toLowerCase();
}

// `항목 | 값` 키-값 시트를 객체로 바꾼다. 시트가 없으면 빈 객체.
function readSettings(sheet) {
  if (!sheet) return {};
  const rows = XLSX.utils.sheet_to_json(sheet);
  return Object.fromEntries(rows.map((row) => [row[SETTINGS_COLUMNS.key], row[SETTINGS_COLUMNS.value]]));
}

// 메뉴 페이지 = `_`로 시작하지 않고 첫 행에 `메뉴명` 헤더가 있는 시트.
// Numbers가 붙이는 `내보내기 요약` 같은 시트는 헤더가 없어 제외된다.
function isMenuSheet(sheetName, sheet) {
  return !sheetName.startsWith(NON_PAGE_PREFIX) && hasMenuHeader(sheet);
}

function hasMenuHeader(sheet) {
  const [headerRow = []] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  return headerRow.includes(COLUMNS.name);
}

function toPage(title, sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const items = rows.filter(hasMenuName).map(toMenuItem);
  return { title, items, groups: groupByCategory(items) };
}

// 완전히 빈 행도 메뉴명이 빈칸이므로 이 판정 하나로 함께 제외된다.
function hasMenuName(row) {
  return row[COLUMNS.name] !== '';
}

function toMenuItem(row) {
  return {
    name: row[COLUMNS.name],
    price: row[COLUMNS.price],
    desc: row[COLUMNS.desc],
    soldOut: row[COLUMNS.soldOut] === SOLD_OUT_MARK,
    category: row[COLUMNS.category],
  };
}

// Map은 삽입 순서를 지키므로 카테고리가 처음 등장한 순서대로 그룹이 나온다.
function groupByCategory(items) {
  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.category)) groups.set(item.category, []);
    groups.get(item.category).push(item);
  }
  return [...groups].map(([category, groupItems]) => ({ category, items: groupItems }));
}
