import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { parseWorkbook } from '../src/parseWorkbook.mjs';

// 시트명 → 2차원 배열(aoa)을 받아 SheetJS 워크북을 만든다. 키 순서 = 시트 순서.
function makeWorkbook(sheets) {
  const workbook = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), name);
  }
  return workbook;
}

const HEADER = ['메뉴명', '가격', '설명', '품절', '카테고리'];
const AMERICANO = ['아메리카노', 4500, '깔끔한 산미', '', '에스프레소'];
const LATTE = ['카페라떼', 5000, '고소한 우유', '', '에스프레소'];

const firstItemOf = (sheets) => parseWorkbook(makeWorkbook(sheets)).pages[0].items[0];
const itemNamesOf = (page) => page.items.map((item) => item.name);

// M0
test('shouldExportParseWorkbookFunction', () => {
  assert.equal(typeof parseWorkbook, 'function');
});

// M1 — Excel 파서
test('shouldParseMenuNameFromFirstDataRow', () => {
  const item = firstItemOf({ 커피: [HEADER, AMERICANO] });
  assert.equal(item.name, '아메리카노');
});

test('shouldKeepPriceAsNumber', () => {
  const item = firstItemOf({ 커피: [HEADER, AMERICANO] });
  assert.equal(typeof item.price, 'number', 'price는 숫자 타입이어야 한다');
  assert.equal(item.price, 4500);
});

test('shouldParseDescriptionAndCategory', () => {
  const item = firstItemOf({ 커피: [HEADER, AMERICANO] });
  assert.equal(item.desc, '깔끔한 산미');
  assert.equal(item.category, '에스프레소');
});

test('shouldMarkSoldOutWhenCellIsY', () => {
  const item = firstItemOf({ 커피: [HEADER, ['아메리카노', 4500, '깔끔한 산미', 'Y', '에스프레소']] });
  assert.equal(item.soldOut, true);
});

test('shouldNotMarkSoldOutWhenCellIsBlank', () => {
  const item = firstItemOf({ 커피: [HEADER, AMERICANO] });
  assert.equal(item.soldOut, false, '빈칸은 undefined가 아니라 false로 정규화한다');
});

test('shouldParseEveryDataRowInOrder', () => {
  const [page] = parseWorkbook(makeWorkbook({ 커피: [HEADER, AMERICANO, LATTE] })).pages;
  assert.deepEqual(itemNamesOf(page), ['아메리카노', '카페라떼']);
});

test('shouldMapColumnsByHeaderName', () => {
  const item = firstItemOf({
    커피: [
      ['카테고리', '메뉴명', '품절', '가격', '설명'],
      ['에스프레소', '아메리카노', '', 4500, '깔끔한 산미'],
    ],
  });
  assert.deepEqual(item, {
    name: '아메리카노',
    price: 4500,
    desc: '깔끔한 산미',
    soldOut: false,
    category: '에스프레소',
  });
});

test('shouldExcludeUnderscorePrefixedSheets', () => {
  const { pages } = parseWorkbook(
    makeWorkbook({
      커피: [HEADER, AMERICANO],
      _설정: [['항목', '값'], ['매장명', '빌런 커피']],
    }),
  );
  assert.equal(pages.length, 1, '`_` 접두사 시트는 페이지가 아니다');
});

test('shouldCreateOnePagePerMenuSheetInSheetOrder', () => {
  const { pages } = parseWorkbook(
    makeWorkbook({
      커피: [HEADER, AMERICANO],
      디저트: [HEADER, ['치즈케이크', 6000, '', '', '케이크']],
      _설정: [['항목', '값'], ['매장명', '빌런 커피']],
      음료: [HEADER, ['레몬에이드', 5500, '', '', '에이드']],
    }),
  );
  assert.deepEqual(
    pages.map((page) => page.title),
    ['커피', '디저트', '음료'],
  );
});

test('shouldSkipBlankRows', () => {
  const [page] = parseWorkbook(
    makeWorkbook({ 커피: [HEADER, AMERICANO, ['', '', '', '', ''], LATTE] }),
  ).pages;
  assert.deepEqual(itemNamesOf(page), ['아메리카노', '카페라떼']);
});

test('shouldSkipRowsWithoutMenuName', () => {
  const [page] = parseWorkbook(
    makeWorkbook({ 커피: [HEADER, AMERICANO, ['', 3000, '설명만 있음', '', '기타'], LATTE] }),
  ).pages;
  assert.deepEqual(itemNamesOf(page), ['아메리카노', '카페라떼']);
});

test('shouldGroupItemsByCategoryInFirstAppearanceOrder', () => {
  const [page] = parseWorkbook(
    makeWorkbook({
      커피: [
        HEADER,
        ['아메리카노', 4500, '', '', '에스프레소'],
        ['핸드드립', 6000, '', '', '브루잉'],
        ['카페라떼', 5000, '', '', '에스프레소'],
      ],
    }),
  ).pages;
  assert.deepEqual(
    page.groups.map((group) => ({ category: group.category, names: itemNamesOf(group) })),
    [
      { category: '에스프레소', names: ['아메리카노', '카페라떼'] },
      { category: '브루잉', names: ['핸드드립'] },
    ],
  );
});

test('shouldReturnEmptyPagesForWorkbookWithoutSheets', () => {
  const result = parseWorkbook(XLSX.utils.book_new());
  assert.deepEqual(result.pages, []);
});

// M2 — _설정 파싱
const SETTINGS_HEADER = ['항목', '값'];
const parseWithSettings = (settingsRows) =>
  parseWorkbook(makeWorkbook({ 커피: [HEADER, AMERICANO], _설정: [SETTINGS_HEADER, ...settingsRows] }));

test('shouldReadStoreNameFromSettings', () => {
  const result = parseWithSettings([['매장명', '빌런 커피']]);
  assert.equal(result.store, '빌런 커피');
});

test('shouldReadThemeFromSettings', () => {
  const result = parseWithSettings([['매장명', '빌런 커피'], ['테마', 'deep-green']]);
  assert.equal(result.theme, 'deep-green');
});

test('shouldDefaultThemeToCafeDark', () => {
  const result = parseWithSettings([['매장명', '빌런 커피']]);
  assert.equal(result.theme, 'cafe-dark', '`테마` 행이 없으면 기본 테마를 쓴다');
});

test('shouldReadAutoRotateSecondsAsNumber', () => {
  const result = parseWithSettings([['자동전환초', 8]]);
  assert.equal(result.autoRotateSec, 8);
});

test('shouldDefaultAutoRotateToZeroWhenMissingOrNotNumeric', () => {
  assert.equal(parseWithSettings([['매장명', '빌런 커피']]).autoRotateSec, 0, '행이 없으면 0');
  assert.equal(parseWithSettings([['자동전환초', '빠르게']]).autoRotateSec, 0, '비숫자면 0');
});

test('shouldAssembleFinalShapeWithDefaultsWhenSettingsSheetMissing', () => {
  const result = parseWorkbook(makeWorkbook({ 커피: [HEADER, AMERICANO] }));
  assert.deepEqual(Object.keys(result).sort(), ['autoRotateSec', 'device', 'pages', 'store', 'tagline', 'theme']);
  assert.equal(result.store, '');
  assert.equal(result.theme, 'cafe-dark');
  assert.equal(result.autoRotateSec, 0);
});

// M6 — 결함: Numbers로 저장하면 `내보내기 요약` 시트가 맨 앞에 붙는다(헤더에 메뉴명 없음)
const NUMBERS_EXPORT_SUMMARY = [
  ['이 문서는 Numbers에서 내보낸 문서입니다.'],
  [],
  ['Numbers 시트 이름', 'Numbers 표 이름', 'Excel 워크시트 이름'],
  ['커피'],
  [null, '표 1', '커피'],
];

test('shouldExcludeSheetsWithoutMenuNameHeader', () => {
  const { pages } = parseWorkbook(makeWorkbook({ '내보내기 요약': NUMBERS_EXPORT_SUMMARY, 커피: [HEADER, AMERICANO] }));
  assert.deepEqual(
    pages.map((page) => page.title),
    ['커피'],
    '헤더에 `메뉴명`이 없는 시트는 메뉴 페이지가 아니다',
  );
});

// M8 — 디자인 적용: 디바이스·영문태그 설정
test('shouldReadDeviceAndTaglineFromSettings', () => {
  const result = parseWithSettings([['디바이스', 'tablet-port'], ['영문태그', 'SPECIALTY COFFEE']]);
  assert.equal(result.device, 'tablet-port');
  assert.equal(result.tagline, 'SPECIALTY COFFEE');
});

test('shouldDefaultDeviceToSignageAndTaglineToEmpty', () => {
  const result = parseWithSettings([['매장명', '빌런 커피']]);
  assert.equal(result.device, 'signage');
  assert.equal(result.tagline, '');
});
