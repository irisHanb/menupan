import { test } from 'node:test';
import assert from 'node:assert/strict';
import { debounce } from '../src/debounce.mjs';

// M4 — 디바운스 (가짜 타이머로 결정적으로 검증)
test('shouldReturnFunctionFromDebounce', () => {
  assert.equal(typeof debounce(() => {}, 300), 'function');
});

test('shouldInvokeOnceForBurstWithinWindow', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const callback = t.mock.fn();
  const debounced = debounce(callback, 300);
  debounced();
  t.mock.timers.tick(100);
  debounced();
  t.mock.timers.tick(100);
  debounced();
  t.mock.timers.tick(300);
  assert.equal(callback.mock.callCount(), 1, '300ms 안의 연속 호출 3회는 1회로 합쳐진다');
});

test('shouldInvokeEachTimeWhenCallsAreFartherApartThanWindow', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const callback = t.mock.fn();
  const debounced = debounce(callback, 300);
  debounced();
  t.mock.timers.tick(300);
  debounced();
  t.mock.timers.tick(300);
  assert.equal(callback.mock.callCount(), 2);
});
