import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadMenuFromFile } from '../src/loadMenuFromFile.mjs';

test('shouldLoadSampleWorkbookFromDisk', () => {
  // 운영 파일(data/menu.xlsx)은 점주·어드민이 바꾸므로 고정 사본으로 검증한다(Numbers 저장본: `내보내기 요약` 시트 포함).
  const menu = loadMenuFromFile('test/fixtures/menu.xlsx');
  assert.deepEqual(
    menu.pages.map((page) => page.title),
    ['커피', '디저트', '음료'],
  );
  assert.equal(menu.store, '빌런 커피');
});
