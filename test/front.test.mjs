import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// M13 — `/`는 어드민 설정대로 메뉴판만 전체 크기로 출력한다
test('shouldRenderOnlyMenuBoardOnFront', () => {
  const html = readFileSync('public/index.html', 'utf8');
  assert.match(html, /id="canvas"/);
  assert.doesNotMatch(html, /id="tabs"/, '탭·옵션 UI는 어드민으로 옮겼다');
});
