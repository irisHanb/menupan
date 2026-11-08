# TDD-IMPLEMENTS.md — TDD 실행 추적 (마일스톤 단위)

> [plan.md](plan.md)의 백로그를 **마일스톤 단위**로 진행한다. 각 마일스톤을 Kent
> Beck TDD 사이클로 하나씩 닫는다: **`/tdd-red M1`** (마일스톤의 실패 테스트들)
> → **`/tdd-green M1`** (전부 통과 최소 구현) → **`/tdd-refactor M1`** (구조
> 정리).
>
> 한 번에 **한 마일스톤**만. 마일스톤 내부의 세부 테스트는 체크리스트로 두고, 그
> 안에서는 "한 번에 한 테스트"를 지킨다.

## 상태 표기

| 상태    | 의미                                           |
| ------- | ---------------------------------------------- |
| `TODO`  | 아직 시작 안 함                                |
| `RED`   | 마일스톤의 실패 테스트들 작성됨, 구현 전       |
| `GREEN` | 마일스톤의 모든 테스트 통과하는 최소 구현 완료 |
| `DONE`  | 리팩터링까지 끝, 마일스톤 종료                 |

타입: `(S)` 구조적 변경 중심 · `(B)` 행위적 변경 중심

---

## 마일스톤 현황

| ID  | 타입 | 마일스톤                                       | 상태   | 테스트 파일                                           |
| --- | ---- | ---------------------------------------------- | ------ | ----------------------------------------------------- |
| M0  | (S)  | 프로젝트 골격 (러너 + 파서 모듈 골격)          | `DONE` | `test/sanity.test.mjs`, `test/parseWorkbook.test.mjs` |
| M1  | (B)  | Excel 파서 (순수 함수)                         | `DONE` | `test/parseWorkbook.test.mjs`                         |
| M2  | (B)  | `_설정` 파싱                                   | `DONE` | `test/parseWorkbook.test.mjs`                         |
| M3  | (B)  | HTTP API                                       | `DONE` | `test/createApp.test.mjs`                             |
| M4  | (B)  | 파일 감시 + SSE                                | `DONE` | `test/debounce.test.mjs`, `test/sse.test.mjs`         |
| M5  | (B)  | 클라이언트 렌더링 (선택)                       | `DONE` | `test/render.test.mjs`                                |
| M6  | (B)  | 다중 페이지 네비게이션 (시트별 페이지 전환)    | `DONE` | `test/render.test.mjs`                                |
| M7  | (B)  | Excel 원자적 저장 감시 (수정 즉시 반영)        | `DONE` | `test/watchMenuFile.test.mjs`                         |
| M8  | (B)  | 디자인 적용 (테마색·PNG·레이아웃)              | `DONE` | `test/render.test.mjs`, `test/createApp.test.mjs`     |
| M9  | (B)  | 디바이스 캔버스 최적화 (종횡비·contain·반응형) | `DONE` | `test/render.test.mjs`                                |
| M10 | (B)  | 디바이스 선택 미리보기 뷰어 (해상도 토글)      | `DONE` | `test/render.test.mjs`                                |
| M11 | (B)  | `_설정` 확장 파싱 (디바이스·영문태그)          | `DONE` | `test/parseWorkbook.test.mjs`, `test/render.test.mjs` |
| M12 | (B)  | Excel 쓰기 (설정 저장)                         | `DONE` | `test/saveSettings.test.mjs`                          |
| M13 | (B)  | 어드민 인증 (admin/1234)                       | `DONE` | `test/auth.test.mjs`, `test/createApp.test.mjs`       |
| M14 | (B)  | 어드민 설정 API (GET/POST → Excel)             | `DONE` | `test/createApp.test.mjs`                             |
| M15 | (B)  | 어드민 UI (/admin 화면)                        | `DONE` | `test/render.test.mjs`, `test/createApp.test.mjs`     |
| M16 | (B)  | 프론트 키오스크화 (설정대로 단일 캔버스)       | `DONE` | (결선 + 端到端 검증)                                  |
| M17 | (B)  | 캔버스 오버플로우 fit (폰트·리스트 자동 축소)  | `DONE` | `test/render.test.mjs`                                |
| M18 | (B)  | 페이지 캐러셀 (시트별 자동 순환 + 인디케이터)  | `DONE` | `test/render.test.mjs`                                |

> M11~M16: 어드민에서 테마·디바이스·시트 설정 조정 → Excel 저장 → SSE로 프론트
> 반영. 프론트는 옵션 UI 제거.

> M6~M8: 결과물 검토에서 드러난 결선 누락 3건의 보강. 근본원인은 분석 리포트
> 참조.

---

## M0 — 프로젝트 골격 · `DONE`

- [x] `package.json` + `node:test` 러너 동작 (`npm test` 통과)
- [x] `src/parseWorkbook.mjs` 빈 모듈 + `test/parseWorkbook.test.mjs` 골격
      (`parseWorkbook` 호출 가능)

## M1 — Excel 파서 (순수 함수) · `DONE`

> 파일 시스템·HTTP 없이 워크북 객체(또는 fixture)만 입력받아 JSON을 내는 순수
> 함수.

- [x] 단일 메뉴 시트의 헤더+1행을 `{ name, price, desc, soldOut, category }`로
      파싱
- [x] 가격을 **숫자 타입 그대로** 유지 (문자열로 바꾸지 않음)
- [x] 품절 셀 `Y` → `soldOut === true`, 빈칸 → `false` 정규화
- [x] `_` 접두사 시트(`_설정`)를 페이지 목록에서 제외
- [x] 여러 메뉴 시트를 시트 순서대로 `pages` 배열로 (시트명 = 페이지명)
- [x] 빈 행 / 메뉴명 없는 행은 건너뜀
- [x] `카테고리` 값으로 페이지 내 항목에 그룹 키 부여

## M2 — `_설정` 파싱 · `DONE`

- [x] `_설정`에서 `매장명` 읽기
- [x] `_설정`에서 `테마` 읽기 (없으면 기본값 `cafe-dark`)
- [x] `자동전환초`를 숫자로 읽기 (없거나 비숫자면 `0`)
- [x] 최종 출력 `{ store, theme, autoRotateSec, pages }` 조립

## M3 — HTTP API · `DONE`

- [x] Express 앱 생성 로직을 `createApp()`로 분리 (supertest, listen 없이) —
      구조적
- [x] `GET /api/menu`가 파서 출력 JSON을 200으로 반환
- [x] `GET /api/menu`가 빈/잘못된 워크북에서도 빈 `pages`로 안전 반환
- [x] `public/` 정적 파일 서빙

## M4 — 파일 감시 + SSE · `DONE`

> 실제 fs 이벤트는 임시 fixture 파일로. 디바운스는 타이머 주입으로 결정적이게.

- [x] 디바운스 로직을 `debounce(fn, ms)` 순수 유틸로 분리 — 구조적
- [x] 연속 N회 호출이 `ms` 내면 콜백 1회만 실행
- [x] `GET /events`가 SSE 헤더(`text/event-stream`)로 연결 오픈
      (`createHub().subscribe`)
- [x] 워크북 변경 시 클라이언트에 `event: menu-updated` 푸시
      (`createHub().broadcast`)

## M5 — 클라이언트 렌더링 (선택, 강의 진도에 따라) · `DONE`

- [x] `client.js`가 `/api/menu`를 받아 페이지/항목을 DOM에 렌더 (`renderPage`
      순수 함수 + client.js 결선)
- [x] `soldOut` 항목에 취소선 + "품절" 라벨 적용 (`sold-out` 클래스 +
      `board.css`)
- [x] `theme` 값으로 `<body>` 테마 클래스 스위치 (`themeClass`)
- [x] `autoRotateSec > 0`이면 그 주기로 페이지 순환 (`nextPageIndex` +
      setInterval)

---

## M6 — 다중 페이지 네비게이션 · `DONE`

> 문제3: 시트 3개인데 첫 페이지만 노출. 전체 페이지 접근 수단 부재.

- [x] `renderNav(pages, currentIndex)`가 모든 페이지 이름을 탭으로 렌더
- [x] 현재 페이지 탭에 `active` 표시
- [x] `client.js`가 탭 클릭으로 페이지 전환 (수동 네비)

## M7 — Excel 원자적 저장 감시 · `DONE`

> 문제2: 단일 파일 watch라 Excel의 temp→rename 저장에서 change 유실.

- [x] `watchMenuFile(chokidar, file, onChange)`가 **포함 디렉토리**를 감시 (단일
      파일 X)
- [x] `awaitWriteFinish` 옵션으로 쓰기 완료 후 읽음
- [x] 대상 파일의 `add`/`change` 이벤트에 `onChange` 연결

## M8 — 디자인 적용 · `DONE`

> 문제1: design/project 디자인(테마색·PNG·레이아웃) 미반영.

- [x] `renderBoard(menu, currentIndex)`가 매장명 + eyebrow + 현재 페이지를 렌더
- [x] `renderItem`이 desc와 dotted leader를 포함
- [x] 테마별 `text/sub/accent` 색을 CSS 변수로 적용 (8종, `board.css`)
- [x] `design/project/assets`를 `/assets`로 정적 노출, 테마×디바이스 PNG
      배경/프레임 (`assetUrl` + `currentDevice`)

---

## M9 — 디바이스 캔버스 최적화 · `DONE`

> 추가 문제: 전체화면 cover라 PNG·프레임이 잘림. design은 디바이스별 고정 종횡비
> 캔버스를 contain.

- [x] `DEVICE_DIMENSIONS` + `deviceAspectRatio(device)`로 디바이스 종횡비 제공
      (순수 함수)
- [x] `.stage` 캔버스를 `aspect-ratio` + contain으로 letterbox (잘림 제거)
- [x] 내부 타이포·여백을 `cqmin`으로 캔버스 비례 스케일
- [x] `client.js`가 화면 비율로 디바이스 판단 → 종횡비·PNG 세트 적용 (resize
      반응)

---

## M10 — 디바이스 선택 미리보기 뷰어 · `DONE`

> CLAUDE.md 해상도 스펙(사이니지 1080×1920 / 태블릿가로 1920×1440 / 태블릿세로
> 1440×1920 / 모바일 1080×2160)을 토글로 골라 미리본다.

- [x] `DEVICE_DIMENSIONS`에 한글 `label` 추가 (해상도 스펙 단일 출처)
- [x] `deviceLabel(device)` / `deviceResolution(device)` 순수 함수
- [x] `renderDevicePicker(currentDevice)`가 4종 토글 + active 표시
- [x] `client.js`가 토글로 디바이스 전환 + 해상도 라벨 표시

---

## 진행 현황

- 완료: **M0~M10** (11 / 11 마일스톤).
- 테스트: 42 pass / 0 fail.

## 사이클 규칙 (요약)

1. `/tdd-red M1` → 마일스톤의 세부 테스트들을 실패 테스트로 작성, 마일스톤 상태
   `RED`.
2. `/tdd-green M1` → 그 테스트들을 전부 통과시키는 최소 구현, 상태 `GREEN`.
3. `/tdd-refactor M1` → 하드코딩·중복 정리(행위 불변), 상태 `DONE`.
4. 마일스톤 내부에서는 "한 번에 한 테스트" 미니 사이클을 지킨다(체크리스트를
   위에서 아래로).
5. 구조적(`S`)·행위적(`B`) 변경은 커밋을 분리한다. ([CLAUDE.md](CLAUDE.md) 커밋
   규율)
