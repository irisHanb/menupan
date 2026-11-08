import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as view from '../public/admin-view.mjs';
import { THEMES } from '../public/themes.mjs';
import { DEVICE_OPTIONS } from '../public/render.mjs';

const buttonsOf = (html, attribute) =>
  [...html.matchAll(new RegExp(`<button[^>]*${attribute}="([^"]+)"[^>]*aria-pressed="(true|false)"`, 'g'))].map(
    ([, key, pressed]) => [key, pressed === 'true'],
  );

// M12 — 어드민 화면 (design/project 프로토타입의 테마·디바이스 버튼)
test('shouldMarkActiveThemeOption', () => {
  const html = view.renderThemeOptions(THEMES, 'cream');
  const buttons = buttonsOf(html, 'data-theme');
  assert.equal(buttons.length, 8);
  assert.deepEqual(
    buttons.filter(([, pressed]) => pressed).map(([key]) => key),
    ['cream'],
  );
  assert.match(html, /Cream/);
  assert.match(html, /크림/);
});

test('shouldListDeviceOptionsWithResolution', () => {
  const html = view.renderDeviceOptions(DEVICE_OPTIONS, 'mobile');
  const buttons = buttonsOf(html, 'data-device');
  assert.deepEqual(
    buttons.map(([key]) => key),
    ['signage', 'tablet-land', 'tablet-port', 'mobile'],
  );
  assert.deepEqual(
    buttons.filter(([, pressed]) => pressed).map(([key]) => key),
    ['mobile'],
  );
  assert.match(html, /모바일/);
  assert.match(html, /1080 × 2160/);
});

test('shouldOverlayDraftSettingsOnMenuForPreview', () => {
  const menu = { store: '빌런 커피', theme: 'deep-green', device: 'signage', pages: [{ title: '커피' }] };
  const snapshot = structuredClone(menu);
  const preview = view.previewMenu(menu, { store: '2호점', theme: 'cream' });
  assert.equal(preview.store, '2호점');
  assert.equal(preview.theme, 'cream');
  assert.equal(preview.device, 'signage');
  assert.deepEqual(preview.pages, menu.pages);
  assert.deepEqual(menu, snapshot, '원본 메뉴는 바뀌지 않는다');
});
