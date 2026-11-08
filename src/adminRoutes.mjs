import { readFileSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createAdminAuth } from './adminAuth.mjs';
import { validateSettings } from './validateSettings.mjs';
import { THEMES } from '../public/themes.mjs';
import { DEVICE_OPTIONS } from '../public/render.mjs';

const VIEWS_DIR = path.join(import.meta.dirname, 'views');
const LOGIN_TEMPLATE = readFileSync(path.join(VIEWS_DIR, 'login.html'), 'utf8');
const loginPage = (error = '') => LOGIN_TEMPLATE.replace('{{error}}', error);

// /admin 아래 라우트. getMenu는 현재 Excel 내용을, admin.saveSettings는 Excel 쓰기를 맡는다.
export function adminRouter({ admin, getMenu }) {
  const auth = createAdminAuth(admin);
  const router = express.Router();
  const requireSession = (req, res, next) =>
    auth.isLoggedIn(req) ? next() : res.status(401).json({ error: '로그인이 필요합니다.' });

  router.use(express.urlencoded({ extended: false }));
  router.get('/admin', (req, res) => {
    if (!auth.isLoggedIn(req)) return res.redirect(302, '/admin/login');
    res.sendFile(path.join(VIEWS_DIR, 'admin.html'));
  });
  router.get('/admin/login', (_req, res) => {
    res.type('html').send(loginPage());
  });
  router.post('/admin/login', (req, res) => {
    if (auth.login(req, res)) return res.redirect(303, '/admin');
    res.status(401).type('html').send(loginPage('아이디 또는 비밀번호가 맞지 않습니다.'));
  });
  router.post('/admin/logout', (req, res) => {
    auth.logout(req, res);
    res.redirect(303, '/admin/login');
  });

  router.get('/admin/api/settings', requireSession, (_req, res) => {
    const menu = getMenu();
    res.json({ settings: settingsOf(menu), sheets: sheetTitlesOf(menu), themes: THEMES, devices: DEVICE_OPTIONS });
  });
  router.post('/admin/api/settings', requireSession, express.json(), async (req, res) => {
    const result = validateSettings(req.body ?? {}, choicesOf(getMenu()));
    if (!result.ok) return res.status(400).json({ errors: result.errors });
    try {
      await admin.saveSettings(result.value);
    } catch (error) {
      return res.status(500).json({ error: `Excel 저장 실패: ${error.message}` });
    }
    res.json({ ok: true, settings: result.value });
  });
  return router;
}

function settingsOf({ store, tagline, theme, device, autoRotateSec, displaySheet }) {
  return { store, tagline, theme, device, autoRotateSec, displaySheet };
}

const sheetTitlesOf = (menu) => menu.pages.map((page) => page.title);

function choicesOf(menu) {
  return {
    themes: THEMES.map((theme) => theme.key),
    devices: DEVICE_OPTIONS.map((device) => device.key),
    sheets: sheetTitlesOf(menu),
  };
}
