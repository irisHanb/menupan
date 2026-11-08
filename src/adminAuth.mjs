import { randomUUID, timingSafeEqual, createHash } from 'node:crypto';

const SESSION_COOKIE = 'menupan_admin';
const COOKIE_ATTRIBUTES = 'HttpOnly; SameSite=Strict; Path=/admin';

// 어드민 세션. 세션은 서버 메모리에만 있으므로 서버를 다시 켜면 다시 로그인한다.
export function createAdminAuth({ username, password }) {
  const sessions = new Set();
  const isLoggedIn = (req) => sessions.has(readSessionCookie(req));
  return {
    isLoggedIn,
    // 계정이 맞으면 새 세션 쿠키를 붙이고 true
    login(req, res) {
      // `&`(비트 AND)로 두 비교를 모두 실행한다. `&&`면 아이디가 틀릴 때 비밀번호 비교를 건너뛰어 응답 시간이 달라진다.
      if (!(sameSecret(req.body?.username, username) & sameSecret(req.body?.password, password))) return false;
      const token = randomUUID();
      sessions.add(token);
      res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; ${COOKIE_ATTRIBUTES}`);
      return true;
    },
    logout(req, res) {
      sessions.delete(readSessionCookie(req));
      res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; ${COOKIE_ATTRIBUTES}; Max-Age=0`);
    },
  };
}

function readSessionCookie(req) {
  const prefix = `${SESSION_COOKIE}=`;
  return (req.headers.cookie ?? '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

// 길이가 달라도 비교 시간이 같도록 해시를 비교한다.
function sameSecret(given, expected) {
  const digest = (value) => createHash('sha256').update(String(value ?? '')).digest();
  return timingSafeEqual(digest(given), digest(expected));
}
