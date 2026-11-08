import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { watchWorkbook } from '../src/watchWorkbook.mjs';

// M4 — 실제 fs 이벤트. 감시 준비 시간을 두고 임시 파일을 연달아 쓴다.
// chokidar는 한 파일의 change를 ~50ms 간격으로 내보내므로 디바운스 창은 그보다 넓어야 한다.
test('shouldCallOnChangeOnceForRapidWrites', async (t) => {
  const dir = await mkdtemp(path.join(tmpdir(), 'menupan-watch-'));
  const file = path.join(dir, 'menu.xlsx');
  await writeFile(file, 'v0');
  const onChange = t.mock.fn();
  const watcher = watchWorkbook(file, onChange, { debounceMs: 200 });
  try {
    await delay(300);
    await writeFile(file, 'v1');
    await delay(10);
    await writeFile(file, 'v2');
    await delay(500);
    assert.equal(onChange.mock.callCount(), 1, '연속 저장 2회는 콜백 1회로 합쳐진다');
  } finally {
    await watcher.close();
  }
});
