import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatPrice, renderPage, themeClass, nextPageIndex, startRotation } from '../public/render.mjs';

const item = (overrides = {}) => ({
  name: '아메리카노',
  price: 4500,
  desc: '깔끔한 산미',
  soldOut: false,
  category: '에스프레소',
  ...overrides,
});
const pageOf = (...items) => ({
  title: '커피',
  items,
  groups: [{ category: '에스프레소', items }],
});

// M5 — 클라이언트 렌더링 (DOM 없이 HTML 문자열로 검증)
test('shouldFormatPriceWithThousandsSeparatorAndWon', () => {
  assert.equal(formatPrice(4500), '4,500원');
  assert.equal(formatPrice(12000), '12,000원');
});

test('shouldRenderCategoryHeadingsAndItems', () => {
  const html = renderPage(pageOf(item(), item({ name: '<script>신메뉴</script>' })));
  assert.match(html, /에스프레소/, '카테고리 소제목');
  assert.match(html, /아메리카노/);
  assert.match(html, /4,500원/);
  assert.match(html, /&lt;script&gt;신메뉴/, '메뉴명은 HTML 이스케이프한다');
  assert.doesNotMatch(html, /<script>/);
});

test('shouldMarkSoldOutItemWithClassAndLabel', () => {
  const soldOutHtml = renderPage(pageOf(item({ soldOut: true })));
  assert.match(soldOutHtml, /is-sold-out/);
  assert.match(soldOutHtml, /품절/);

  const availableHtml = renderPage(pageOf(item({ soldOut: false })));
  assert.doesNotMatch(availableHtml, /is-sold-out/);
  assert.doesNotMatch(availableHtml, /품절/);
});

test('shouldBuildThemeClassName', () => {
  assert.equal(themeClass('deep-green'), 'theme-deep-green');
});

test('shouldWrapToFirstPageAfterLast', () => {
  assert.equal(nextPageIndex(0, 3), 1);
  assert.equal(nextPageIndex(2, 3), 0);
});

test('shouldRotatePagesOnlyWhenAutoRotateIsPositive', (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });

  const onChange = t.mock.fn();
  const rotation = startRotation({ autoRotateSec: 5, pageCount: 3, onChange });
  t.mock.timers.tick(10000);
  assert.deepEqual(
    onChange.mock.calls.map((call) => call.arguments[0]),
    [1, 2],
    '5초마다 다음 페이지 인덱스로 넘어간다',
  );
  rotation.stop();

  const idle = t.mock.fn();
  startRotation({ autoRotateSec: 0, pageCount: 3, onChange: idle }).stop();
  t.mock.timers.tick(10000);
  assert.equal(idle.mock.callCount(), 0, 'autoRotateSec 0이면 순환하지 않는다');
});
