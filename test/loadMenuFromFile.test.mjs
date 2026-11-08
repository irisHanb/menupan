import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadMenuFromFile } from '../src/loadMenuFromFile.mjs';

test('shouldLoadSampleWorkbookFromDisk', () => {
  const menu = loadMenuFromFile('data/menu.xlsx');
  assert.deepEqual(
    menu.pages.map((page) => page.title),
    ['커피', '디저트', '음료'],
  );
  assert.equal(menu.store, '빌런 커피');
});
