import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.mjs';

const menuFixture = {
  store: '빌런 커피',
  theme: 'deep-green',
  autoRotateSec: 0,
  device: 'signage',
  tagline: 'SPECIALTY COFFEE',
  displaySheet: '',
  pages: [
    { title: '커피', items: [], groups: [] },
    { title: '디저트', items: [], groups: [] },
  ],
};

const makeApp = (overrides = {}) =>
  createApp({
    loadMenu: () => menuFixture,
    admin: { username: 'admin', password: '1234', saveSettings: async () => {}, ...overrides },
  });

async function login(app, username = 'admin', password = '1234') {
  return request(app).post('/admin/login').type('form').send({ username, password });
}

const sessionCookieOf = (response) => response.headers['set-cookie']?.[0]?.split(';')[0];

// M10 — 어드민 인증
test('shouldRedirectAnonymousAdminToLogin', async () => {
  const response = await request(makeApp()).get('/admin');
  assert.equal(response.status, 302);
  assert.equal(response.headers.location, '/admin/login');
});

test('shouldServeLoginForm', async () => {
  const response = await request(makeApp()).get('/admin/login');
  assert.equal(response.status, 200);
  assert.match(response.text, /<form[^>]*method="post"/i);
  assert.match(response.text, /type="password"/);
});

test('shouldRejectWrongCredentials', async () => {
  const response = await login(makeApp(), 'admin', '0000');
  assert.equal(response.status, 401);
  assert.equal(response.headers['set-cookie'], undefined, '실패하면 세션 쿠키를 주지 않는다');
});

test('shouldStartSessionWithCorrectCredentials', async () => {
  const app = makeApp();
  const response = await login(app);
  assert.equal(response.status, 303);
  assert.equal(response.headers.location, '/admin');
  const setCookie = response.headers['set-cookie'][0];
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  const admin = await request(app).get('/admin').set('Cookie', sessionCookieOf(response));
  assert.equal(admin.status, 200);
});

test('shouldEndSessionOnLogout', async () => {
  const app = makeApp();
  const cookie = sessionCookieOf(await login(app));
  await request(app).post('/admin/logout').set('Cookie', cookie);
  const response = await request(app).get('/admin').set('Cookie', cookie);
  assert.equal(response.status, 302, '로그아웃한 세션은 다시 쓸 수 없다');
});

// M11 — 어드민 설정 API
const validPayload = {
  store: '빌런 커피 2호점',
  tagline: 'ROASTERY',
  theme: 'cream',
  device: 'tablet-land',
  autoRotateSec: '8',
  displaySheet: '디저트',
};

test('shouldRejectSettingsApiWithoutSession', async () => {
  const response = await request(makeApp()).get('/admin/api/settings');
  assert.equal(response.status, 401);
});

test('shouldReturnCurrentSettingsWithChoices', async () => {
  const app = makeApp();
  const cookie = sessionCookieOf(await login(app));
  const response = await request(app).get('/admin/api/settings').set('Cookie', cookie);
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.settings, {
    store: '빌런 커피',
    tagline: 'SPECIALTY COFFEE',
    theme: 'deep-green',
    device: 'signage',
    autoRotateSec: 0,
    displaySheet: '',
  });
  assert.deepEqual(response.body.sheets, ['커피', '디저트']);
  assert.equal(response.body.themes.length, 8);
  assert.deepEqual(
    response.body.devices.map((device) => device.key),
    ['signage', 'tablet-land', 'tablet-port', 'mobile'],
  );
});

test('shouldSaveValidSettingsToWorkbook', async () => {
  const saved = [];
  const app = makeApp({ saveSettings: async (settings) => saved.push(settings) });
  const cookie = sessionCookieOf(await login(app));
  const response = await request(app).post('/admin/api/settings').set('Cookie', cookie).send(validPayload);
  assert.equal(response.status, 200);
  assert.deepEqual(saved, [{ ...validPayload, autoRotateSec: 8 }], '자동전환초는 숫자로 바꿔 저장한다');
});

test('shouldRejectInvalidSettingsWithoutSaving', async () => {
  const saved = [];
  const app = makeApp({ saveSettings: async (settings) => saved.push(settings) });
  const cookie = sessionCookieOf(await login(app));
  const response = await request(app)
    .post('/admin/api/settings')
    .set('Cookie', cookie)
    .send({ ...validPayload, theme: 'neon-pink' });
  assert.equal(response.status, 400);
  assert.ok(response.body.errors.theme, 'theme 오류 메시지');
  assert.equal(saved.length, 0);
});

// M12 — 로그인 후 어드민 화면
test('shouldServeAdminScreenAfterLogin', async () => {
  const app = createApp({
    loadMenu: () => menuFixture,
    publicDir: 'public',
    admin: { username: 'admin', password: '1234', saveSettings: async () => {} },
  });
  const cookie = sessionCookieOf(await login(app));
  const page = await request(app).get('/admin').set('Cookie', cookie);
  assert.equal(page.status, 200);
  assert.match(page.text, /<script type="module" src="\/admin\.js">/);
  assert.match(page.text, /id="stage"/);
  const script = await request(app).get('/admin.js');
  assert.equal(script.status, 200);
});
