import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

// M8 — 에셋이 있는 테마마다 색 토큰(CSS)이 있어야 `_설정.테마`를 바꿨을 때 화면이 바뀐다
test('shouldDefineStyleForEveryAssetTheme', () => {
  const themes = readdirSync('design/project/assets', { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const css = readFileSync('public/style.css', 'utf8');
  const missing = themes.filter((theme) => !css.includes(`.theme-${theme} `) && !css.includes(`.theme-${theme}{`));
  assert.equal(themes.length, 8);
  assert.deepEqual(missing, [], `CSS 토큰이 없는 테마: ${missing.join(', ')}`);
});
