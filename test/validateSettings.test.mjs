import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { validateSettings } from '../src/validateSettings.mjs';
import * as themes from '../public/themes.mjs';

const choices = { themes: ['deep-green', 'cream'], devices: ['signage', 'mobile'], sheets: ['커피', '디저트'] };
const valid = { store: '빌런 커피', tagline: 'SPECIALTY COFFEE', theme: 'cream', device: 'mobile', autoRotateSec: 5, displaySheet: '' };

// M11 — 저장 전 검증
test('shouldValidateEachSettingField', () => {
  assert.deepEqual(validateSettings(valid, choices), { ok: true, value: valid });

  const result = validateSettings(
    { store: 'x'.repeat(101), tagline: 'ok', theme: 'cream', device: 'tv', autoRotateSec: -1, displaySheet: '음료' },
    choices,
  );
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.errors).sort(), ['autoRotateSec', 'device', 'displaySheet', 'store']);

  assert.equal(validateSettings({ ...valid, autoRotateSec: 2.5 }, choices).ok, false, '소수 초는 거부');
  assert.equal(validateSettings({ ...valid, autoRotateSec: '12' }, choices).value.autoRotateSec, 12, '숫자 문자열은 숫자로');
});

// M11 — 테마 목록의 출처 (API·검증·어드민 화면이 같이 쓴다)
test('shouldListEveryAssetThemeWithLabels', () => {
  const assetThemes = readdirSync('design/project/assets', { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(themes.THEMES?.map((theme) => theme.key).sort(), assetThemes);
  for (const theme of themes.THEMES) {
    assert.ok(theme.label && theme.ko && /^#[0-9a-f]{6}$/i.test(theme.accent), `${theme.key}: label·ko·accent 필요`);
  }
});
