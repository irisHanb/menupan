# plan.md — TDD 백로그

> 이 파일은 [CLAUDE.md](CLAUDE.md)의 Kent Beck TDD 프로세스가 참조하는 작업
> 목록이다.
>
> **사용법**: 내가 "go"라고 말하면, 아래에서 **다음으로 체크되지 않은 `[ ]`
> 테스트**를 찾아 ① 실패하는 테스트를 먼저 쓰고 ② 통과시킬 최소 코드만 구현하고
> ③ Green 확인 후 필요하면 리팩터링(구조적 변경은 별도 커밋)한다. 한 번에
> **하나**만.
>
> 표기: `[ ]` 미완료 · `[x]` 완료 · `(S)` 구조적 변경 · `(B)` 행위적 변경

---

## 마일스톤 0 — 프로젝트 골격

- [x] (S) `package.json` + `node:test` 러너 동작 — `npm test`가 빈 스위트라도 0
      exit
- [x] (S) `src/parseWorkbook.mjs` 빈 모듈 + `test/parseWorkbook.test.mjs`
      골격(파서를 순수 함수로 분리하기 위한 자리)

## 마일스톤 1 — Excel 파서 (순수 함수, 핵심 로직)

> 파일 시스템·HTTP 없이 워크북 객체(또는 fixture)만 입력받아 JSON을 내는 순수
> 함수.

- [x] (B) 단일 메뉴 시트의 헤더+1행을
      `{ name, price, desc, soldOut, category }`로 파싱한다
- [x] (B) 가격을 **숫자 타입 그대로** 유지한다 (문자열로 바꾸지 않는다)
- [x] (B) 품절 셀이 `Y`면 `soldOut === true`, 빈칸이면 `false`로 정규화한다
- [x] (B) `_` 접두사 시트(`_설정`)는 페이지 목록에서 제외한다
- [x] (B) 여러 메뉴 시트를 시트 순서대로 `pages` 배열로 만든다 (시트명 =
      페이지명)
- [x] (B) 빈 행 / 메뉴명 없는 행은 건너뛴다
- [x] (B) `카테고리` 값으로 페이지 내 항목에 그룹 키를 부여한다

## 마일스톤 2 — `_설정` 파싱

- [ ] (B) `_설정`에서 `매장명`을 읽는다
- [ ] (B) `_설정`에서 `테마`를 읽는다 (없으면 기본값 `cafe-dark`)
- [ ] (B) `자동전환초`를 숫자로 읽는다 (없거나 비숫자면 `0`)
- [ ] (B) 최종 출력 형태 `{ store, theme, autoRotateSec, pages }`를 조립한다

## 마일스톤 3 — HTTP API

- [ ] (S) `server.mjs`에서 Express 앱 생성 로직을 `createApp()`로 분리
      (supertest로 listen 없이 테스트)
- [ ] (B) `GET /api/menu`가 파서 출력 JSON을 200으로 반환한다
- [ ] (B) `GET /api/menu`가 잘못된/빈 워크북에서도 깨지지 않고 빈 `pages`를
      반환한다
- [ ] (B) `public/` 정적 파일을 서빙한다

## 마일스톤 4 — 파일 감시 + SSE

> 실제 fs 이벤트는 임시 fixture 파일로. 디바운스는 타이머 주입으로 결정적이게.

- [ ] (S) 디바운스 로직을 `debounce(fn, ms)` 순수 유틸로 분리
- [ ] (B) 연속 N회 호출이 `ms` 내면 콜백은 1회만 실행된다
- [ ] (B) `GET /events`가 SSE 헤더(`text/event-stream`)로 연결을 연다
- [ ] (B) 워크북 변경 시 연결된 클라이언트에 `event: menu-updated`를 푸시한다

## 마일스톤 5 — 클라이언트 렌더링 (선택, 강의 진도에 따라)

- [ ] (B) `client.js`가 `/api/menu`를 받아 페이지/항목을 DOM에 렌더한다
- [ ] (B) `soldOut` 항목에 취소선 + "품절" 라벨을 적용한다
- [ ] (B) `theme` 값으로 `<body>` 테마 클래스를 스위치한다
- [ ] (B) `autoRotateSec > 0`이면 그 주기로 페이지를 순환한다

---

## 다음 한 수

다음 미완료: **마일스톤 0 — `package.json` + `node:test` 러너 동작**. (이미
골격이 잡혀 있으면 마일스톤 1 첫 항목으로 진행)
