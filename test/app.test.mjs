import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import http from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.mjs';

const menuFixture = {
  store: '빌런 커피',
  theme: 'deep-green',
  autoRotateSec: 0,
  pages: [{ title: '커피', items: [], groups: [] }],
};

// M3 — HTTP API
test('shouldCreateExpressAppWithoutListening', () => {
  const app = createApp({ loadMenu: () => menuFixture });
  assert.equal(typeof app.listen, 'function');
});

test('shouldServeMenuJsonFromInjectedLoader', async () => {
  const app = createApp({ loadMenu: () => menuFixture });
  const response = await request(app).get('/api/menu');
  assert.equal(response.status, 200);
  assert.match(response.headers['content-type'], /application\/json/);
  assert.deepEqual(response.body, menuFixture);
});

test('shouldRespondWithEmptyPagesWhenLoaderThrows', async () => {
  const app = createApp({
    loadMenu: () => {
      throw new Error('corrupt');
    },
  });
  const response = await request(app).get('/api/menu');
  assert.equal(response.status, 200, '워크북이 깨져도 500이 아니라 빈 메뉴를 준다');
  assert.deepEqual(response.body, {
    store: '',
    theme: 'cafe-dark',
    autoRotateSec: 0,
    device: 'signage',
    tagline: '',
    displaySheet: '',
    pages: [],
  });
});

test('shouldServeStaticFilesFromPublicDir', async () => {
  const publicDir = await mkdtemp(path.join(tmpdir(), 'menupan-public-'));
  await writeFile(path.join(publicDir, 'index.html'), '<h1>메뉴판</h1>');
  const app = createApp({ loadMenu: () => menuFixture, publicDir });
  const response = await request(app).get('/');
  assert.equal(response.status, 200);
  assert.match(response.headers['content-type'], /text\/html/);
  assert.equal(response.text, '<h1>메뉴판</h1>');
});

// M4 — SSE
// SSE 응답은 끝나지 않으므로 실제 포트로 열고, 필요한 만큼 읽은 뒤 연결을 끊는다.
async function openEventStream(app) {
  const server = app.listen(0);
  await once(server, 'listening');
  const request = http.get(`http://127.0.0.1:${server.address().port}/events`);
  const [response] = await once(request, 'response');
  response.setEncoding('utf8');
  const close = () => {
    request.destroy();
    server.closeAllConnections();
    server.close();
  };
  return { response, close };
}

function readUntil(stream, text, timeoutMs = 1000) {
  return new Promise((resolve, reject) => {
    let received = '';
    const timer = setTimeout(() => reject(new Error(`${timeoutMs}ms 안에 "${text}" 수신 못 함. 받은 내용: ${JSON.stringify(received)}`)), timeoutMs);
    stream.on('data', (chunk) => {
      received += chunk;
      if (received.includes(text)) {
        clearTimeout(timer);
        resolve(received);
      }
    });
  });
}

test('shouldOpenSseStreamOnEvents', async () => {
  const { response, close } = await openEventStream(createApp({ loadMenu: () => menuFixture }));
  try {
    assert.equal(response.statusCode, 200);
    assert.match(response.headers['content-type'], /^text\/event-stream/);
  } finally {
    close();
  }
});

test('shouldPushMenuUpdatedEventToConnectedClients', async () => {
  const app = createApp({ loadMenu: () => menuFixture });
  const { response, close } = await openEventStream(app);
  try {
    const received = readUntil(response, 'event: menu-updated\n');
    app.notifyMenuUpdated();
    assert.match(await received, /event: menu-updated\n/);
  } finally {
    close();
  }
});

// M8 — 테마 PNG 에셋 서빙
test('shouldServeThemeAssetsFromAssetsDir', async () => {
  const assetsDir = await mkdtemp(path.join(tmpdir(), 'menupan-assets-'));
  await mkdir(path.join(assetsDir, 'deep-green'));
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  await writeFile(path.join(assetsDir, 'deep-green', 'bg-signage.png'), png);
  const app = createApp({ loadMenu: () => menuFixture, assetsDir });
  const response = await request(app).get('/assets/deep-green/bg-signage.png');
  assert.equal(response.status, 200);
  assert.match(response.headers['content-type'], /image\/png/);
});
