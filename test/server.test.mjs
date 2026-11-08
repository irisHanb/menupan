import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { copyFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const LISTENING = /listening on (\d+)/;
// 운영 파일(data/menu.xlsx)은 어드민 저장으로 바뀌므로 고정 사본을 쓴다.
const FIXTURE = 'test/fixtures/menu.xlsx';

// server.mjs를 PORT=0으로 띄우고 stdout의 `listening on <port>`에서 포트를 얻는다.
async function startServer(env = {}) {
  const child = spawn(process.execPath, ['server.mjs'], {
    env: { ...process.env, PORT: '0', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`서버가 2초 안에 시작하지 않음:\n${output}`)), 2000);
    const onData = (chunk) => {
      output += chunk;
      const match = output.match(LISTENING);
      if (match) {
        clearTimeout(timer);
        resolve(Number(match[1]));
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', (chunk) => (output += chunk));
    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`서버가 종료됨(code ${code}):\n${output}`));
    });
  });
  return { child, port };
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  child.kill();
  await once(child, 'exit');
}

// M3 — 실행 진입점
test('shouldStartServerAndServeMenu', async () => {
  const { child, port } = await startServer({ DATA_PATH: FIXTURE });
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/menu`);
    assert.equal(response.status, 200);
    const menu = await response.json();
    assert.equal(menu.pages.length, 3);
  } finally {
    await stopServer(child);
  }
});

// M4 — 워크북 저장 → SSE 푸시 통합
test('shouldPushMenuUpdatedWhenWorkbookChanges', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'menupan-server-'));
  const dataPath = path.join(dir, 'menu.xlsx');
  await copyFile(FIXTURE, dataPath);
  const { child, port } = await startServer({ DATA_PATH: dataPath });
  const controller = new AbortController();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/events`, { signal: controller.signal });
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    await delay(300); // 감시 준비
    await copyFile(FIXTURE, dataPath);
    let received = '';
    const deadline = Date.now() + 2000;
    while (!received.includes('event: menu-updated') && Date.now() < deadline) {
      const { value, done } = await Promise.race([reader.read(), delay(deadline - Date.now()).then(() => ({ done: true }))]);
      if (done) break;
      received += value;
    }
    assert.match(received, /event: menu-updated/, '파일 저장 후 2초 안에 menu-updated를 받아야 한다');
  } finally {
    controller.abort();
    await stopServer(child);
  }
});
