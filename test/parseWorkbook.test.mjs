import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseWorkbook } from '../src/parseWorkbook.mjs';

test('shouldExportParseWorkbookFunction', () => {
  assert.equal(typeof parseWorkbook, 'function');
});
