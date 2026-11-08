import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as render from '../public/render.mjs';
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

// M7 — 결함: 자동전환초 0이면 첫 페이지만 보이고 넘길 수단이 없었다
const SHEET_PAGES = [{ title: '커피' }, { title: '디저트' }, { title: '음료' }];

test('shouldRenderOneTabPerPageInSheetOrder', () => {
  const html = render.renderPageTabs(SHEET_PAGES, 0);
  const tabs = [...html.matchAll(/data-page-index="(\d+)"[^>]*>([^<]+)</g)].map(([, index, title]) => [Number(index), title]);
  assert.deepEqual(tabs, [
    [0, '커피'],
    [1, '디저트'],
    [2, '음료'],
  ]);
});

test('shouldMarkOnlyActiveTabAsCurrent', () => {
  const html = render.renderPageTabs(SHEET_PAGES, 1);
  const current = [...html.matchAll(/<button[^>]*aria-current="page"[^>]*>([^<]+)</g)].map(([, title]) => title);
  assert.deepEqual(current, ['디저트']);
});

test('shouldRotateFromGivenStartIndex', (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const onChange = t.mock.fn();
  const rotation = startRotation({ autoRotateSec: 5, pageCount: 3, startIndex: 2, onChange });
  t.mock.timers.tick(5000);
  rotation.stop();
  assert.deepEqual(
    onChange.mock.calls.map((call) => call.arguments[0]),
    [0],
    '수동으로 고른 페이지(2) 다음부터 순환한다',
  );
});

// M8 — 디자인 적용 (design/project/메뉴판 템플릿 시스템.dc.html 기준)
test('shouldDescribeDeviceCanvas', () => {
  assert.deepEqual(render.deviceSpec('tablet-land'), { width: 1920, height: 1440, columns: 2 });
  assert.deepEqual(render.deviceSpec('tablet-port'), { width: 1440, height: 1920, columns: 1 });
  assert.deepEqual(render.deviceSpec('mobile'), { width: 1080, height: 2160, columns: 1 });
  assert.deepEqual(render.deviceSpec('unknown'), { width: 1080, height: 1920, columns: 1 }, '미지원 값은 사이니지');
});

test('shouldBuildThemeAssetUrls', () => {
  assert.deepEqual(render.assetUrls('deep-green', 'tablet-port'), {
    background: '/assets/deep-green/bg-tablet-port.png',
    frame: '/assets/deep-green/frame-tablet-port.png',
  });
});

test('shouldFitCanvasInsideViewport', () => {
  assert.equal(render.fitScale({ width: 1080, height: 1920 }, { width: 540, height: 1200 }), 0.5);
  assert.equal(render.fitScale({ width: 1920, height: 1440 }, { width: 3840, height: 1440 }), 1);
});

test('shouldRenderBoardHeaderWithTaglineStoreAndPageMeta', () => {
  const menu = {
    store: '빌런 커피',
    tagline: 'SPECIALTY COFFEE',
    pages: [
      pageOf(item()),
      {
        title: '디저트',
        items: [],
        groups: [
          { category: '케이크', items: [item({ name: '티라미수', price: 6500 })] },
          { category: '베이커리', items: [item({ name: '크루아상', price: 4000 })] },
        ],
      },
    ],
  };
  const html = render.renderBoard(menu, 1);
  assert.match(html, /SPECIALTY COFFEE/);
  assert.match(html, /빌런 커피/);
  assert.match(html, /디저트/);
  assert.match(html, /케이크 · 베이커리/, '페이지 메타 = 카테고리 목록');
  assert.match(html, /티라미수/);
  assert.match(html, /class="item-leader"/, '메뉴명과 가격 사이 점선 리더');
  assert.doesNotMatch(html, /아메리카노/, '다른 페이지 항목은 그리지 않는다');
});

// M13 — 프론트 키오스크: 어드민에서 고른 표시시트부터 보여 준다
test('shouldStartAtDisplaySheet', () => {
  assert.equal(render.initialPageIndex(SHEET_PAGES, '디저트'), 1);
  assert.equal(render.initialPageIndex(SHEET_PAGES, '없는 시트'), 0);
  assert.equal(render.initialPageIndex(SHEET_PAGES, ''), 0);
});
