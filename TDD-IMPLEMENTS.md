# TDD-IMPLEMENTS.md — 마일스톤 단위 Red · Green · Refactor

> `plan.md` 백로그를 **마일스톤 단위**로 실행합니다. 마일스톤 하나가 Red → Green →
> Refactor 한 사이클이고, 마일스톤 안에서는 체크리스트 순서대로 테스트를 하나씩 쌓습니다.
>
> | 명령                  | 하는 일                                                         | 상태 변화        |
> | --------------------- | --------------------------------------------------------------- | ---------------- |
> | `/tdd-red [M번호]`    | 다음 `TODO` 마일스톤의 체크리스트 전체를 실패하는 테스트로 씁니다 | `TODO` → `RED`   |
> | `/tdd-green [M번호]`  | `RED` 마일스톤의 테스트를 위에서부터 하나씩 최소 구현으로 통과시킵니다 | `RED` → `GREEN`  |
> | `/tdd-refactor [M번호]` | `GREEN` 마일스톤의 하드코딩·중복·원칙 위반을 행위 변경 없이 정리합니다 | `GREEN` → `DONE` |
>
> 규칙: `RED`·`GREEN` 마일스톤이 있는 동안 다음 마일스톤의 `/tdd-red`를 실행하지 않습니다.
> 마일스톤 상태는 아래 인덱스 표에, 테스트별 진행은 각 절의 체크리스트(`[ ]`/`[x]`)에 적습니다.
>
> 2026-11-08: 커밋 `88d54a0`의 이 문서는 M0~M18을 `DONE`으로 표시했지만 저장소 어느 브랜치에도
> `package.json`·`src/`·`test/`가 없었습니다. 코드 상태에 맞춰 M0~M5를 `TODO`로 되돌렸습니다.

## 입력 데이터 계약 (`data/menu.xlsx` 실측)

- 시트 순서: `커피`, `디저트`, `음료`, `_설정`
- 메뉴 시트 1행 헤더: `메뉴명 | 가격 | 설명 | 품절 | 카테고리` (가격은 숫자 셀, 품절은 `Y` 또는 빈칸)
- `_설정` 시트: 1행 헤더 `항목 | 값`, 이후 키-값 행 — `매장명=빌런 커피`, `테마=deep-green`,
  `디바이스=tablet-port`, `영문태그=SPECIALTY COFFEE`, `자동전환초=0`
- 테스트 fixture는 실제 파일 대신 `XLSX.utils.aoa_to_sheet`로 만든 워크북 객체를 씁니다.

## 출력 계약 (M2 완료 시점)

```js
{
  store: '빌런 커피',
  theme: 'deep-green',          // 없으면 'cafe-dark'
  autoRotateSec: 0,             // 없거나 비숫자면 0
  pages: [
    {
      title: '커피',
      items: [{ name, price, desc, soldOut, category }],
      groups: [{ category: '에스프레소', items: [/* ... */] }],
    },
  ],
}
```

---

## 인덱스

| ID | 마일스톤                  | 테스트 수 | 테스트 파일 | 상태 |
| -- | ------------------------- | --------- | ----------- | ---- |
| M0 | 프로젝트 골격             | 2         | `test/parseWorkbook.test.mjs` | DONE |
| M1 | Excel 파서 (순수 함수)    | 13        | `test/parseWorkbook.test.mjs` | DONE |
| M2 | `_설정` 파싱              | 6         | `test/parseWorkbook.test.mjs` | DONE |
| M3 | HTTP API                  | 6         | `test/app.test.mjs`, `test/loadMenuFromFile.test.mjs`, `test/server.test.mjs` | DONE |
| M4 | 파일 감시 + SSE           | 7         | `test/debounce.test.mjs`, `test/app.test.mjs`, `test/watchWorkbook.test.mjs`, `test/server.test.mjs` | DONE |
| M5 | 클라이언트 렌더링 (선택)  | 6         | `test/render.test.mjs` | DONE |
| M6 | 결함: 메뉴 헤더 없는 시트 제외 | 1   | `test/parseWorkbook.test.mjs` (+ API 수준 `test/loadMenuFromFile.test.mjs`, `test/server.test.mjs`) | DONE |
| M7 | 결함: 시트별 페이지 네비게이션 | 4   | `test/render.test.mjs` | DONE |
| M8 | 결함: 디자인 적용 (테마·디바이스·PNG) | 8 | `test/parseWorkbook.test.mjs`, `test/render.test.mjs`, `test/app.test.mjs`, `test/style.test.mjs` | DONE |
| M9 | Excel 설정 저장 (`_설정` 쓰기) | 5 | `test/saveSettings.test.mjs`, `test/parseWorkbook.test.mjs` | DONE |
| M10 | 어드민 인증 (`/admin`, admin/1234) | 5 | `test/admin.test.mjs` | DONE |
| M11 | 어드민 설정 API (검증 → Excel 저장) | 6 | `test/admin.test.mjs`, `test/validateSettings.test.mjs` | DONE |
| M12 | 어드민 화면 (디자인 프로토타입 방식) | 4 | `test/adminView.test.mjs`, `test/admin.test.mjs` | DONE |
| M13 | 프론트 키오스크화 (메뉴판만 전체 크기) | 3 | `test/render.test.mjs`, `test/front.test.mjs`, `test/parseWorkbook.test.mjs` | DONE |

---

## M0 — 프로젝트 골격

- plan.md: 마일스톤 0 (2항목). `plan.md`는 첫 항목을 `[x]`로 표시하지만 `package.json`이 없습니다(2026-11-08 `ls` 확인).
- 준비(Red): 없음. 의존성은 필요한 마일스톤에서 설치합니다.
- 예상 Red: `npm error enoent Could not read package.json` → `package.json` 생성 후 `ERR_MODULE_NOT_FOUND: src/parseWorkbook.mjs`
  - `package.json`이 없으면 `npm test`가 실행되지 않으므로, Red 확인은 `node --test`로 합니다.

### 세부 테스트 체크리스트

- [x] T-00-01 `test/smoke.test.mjs` › `shouldRunNodeTestRunner` — `npm test`가 `node:test`로 실행되고 0으로 끝난다
- [x] T-00-02 `test/parseWorkbook.test.mjs` › `shouldExportParseWorkbookFunction` — `typeof parseWorkbook === 'function'`

### Green 힌트

- `package.json`: `"type": "module"`, `"scripts": { "test": "node --test", "start": "node server.mjs" }`
- `src/parseWorkbook.mjs`: `export function parseWorkbook(workbook) {}`

### Refactor 점검

- T-00-02가 생긴 뒤 `test/smoke.test.mjs`가 더 필요한지 확인합니다.

### 기록

- Red: `npm test` → `npm error enoent Could not read package.json` (T-00-01) · `node --test` → pass 1 / fail 1, `ERR_MODULE_NOT_FOUND: src/parseWorkbook.mjs` (T-00-02)
- Green: T-00-01 — `package.json`(`type: module`, `test: node --test`) 생성, `npm test -- test/smoke.test.mjs` pass 1 / fail 0 · T-00-02 — `src/parseWorkbook.mjs` 빈 함수 export. `npm test` pass 2 / fail 0, exit 0
- Refactor: Remove Dead Code — `test/smoke.test.mjs` 삭제(`parseWorkbook.test.mjs`가 러너 동작을 함께 증명). `npm test` 전 pass 2 / 후 pass 1, fail 0

---

## M1 — Excel 파서 (순수 함수)

- plan.md: 마일스톤 1 (7항목) + 빈 워크북 1항목(plan.md M3-3의 파서 부분)
- 입력은 SheetJS 워크북 객체이고 출력은 plain object입니다. 파일 시스템을 읽지 않습니다.
- 준비(Red):
  - `npm i "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"` (npm `xlsx` 0.18.5 금지)
  - `makeWorkbook({ 커피: [[...헤더], [...행]] })` — `XLSX.utils.book_new` + `aoa_to_sheet`로 워크북을 반환. 테스트 파일 안에 둡니다
    (`test/` 아래 별도 `.mjs`는 `node --test` 기본 패턴 `**/test/**/*.mjs`에 걸려 테스트 파일로 실행됩니다)
- 기본 fixture: `커피` 시트 `[['메뉴명','가격','설명','품절','카테고리'], ['아메리카노',4500,'깔끔한 산미','','에스프레소']]`
- 예상 Red: `TypeError: Cannot read properties of undefined (reading 'pages')`

### 세부 테스트 체크리스트

순서는 Green에서 하드코딩(Fake It)한 값을 다음 테스트가 일반화하도록 짰습니다(삼각측량).

- [x] T-01-01 `shouldParseMenuNameFromFirstDataRow` — `pages[0].items[0].name === '아메리카노'`
- [x] T-01-02 `shouldKeepPriceAsNumber` — `item.price === 4500`, `typeof` `'number'`
- [x] T-01-03 `shouldParseDescriptionAndCategory` — `desc === '깔끔한 산미'`, `category === '에스프레소'`
- [x] T-01-04 `shouldMarkSoldOutWhenCellIsY` — 품절 `'Y'` → `soldOut === true`
- [x] T-01-05 `shouldNotMarkSoldOutWhenCellIsBlank` — 품절 `''` → `soldOut === false` (`undefined` 불허)
- [x] T-01-06 `shouldParseEveryDataRowInOrder` — 행 `아메리카노`, `카페라떼` → 이름 배열 `['아메리카노','카페라떼']`
- [x] T-01-07 `shouldMapColumnsByHeaderName` — 헤더 순서 `['카테고리','메뉴명','품절','가격','설명']`여도 같은 항목 객체
- [x] T-01-08 `shouldExcludeUnderscorePrefixedSheets` — `커피` + `_설정` → `pages.length === 1`
- [x] T-01-09 `shouldCreateOnePagePerMenuSheetInSheetOrder` — 시트 `커피`,`디저트`,`_설정`,`음료` → 제목 `['커피','디저트','음료']`
- [x] T-01-10 `shouldSkipBlankRows` — 데이터 행 사이 `['','','','','']` → 항목 2개
- [x] T-01-11 `shouldSkipRowsWithoutMenuName` — `['',3000,'설명만 있음','','기타']` 행이 `items`에 없음
- [x] T-01-12 `shouldGroupItemsByCategoryInFirstAppearanceOrder` — 카테고리 `에스프레소`,`브루잉`,`에스프레소` → `groups` `[{ category:'에스프레소', items:[1행,3행] }, { category:'브루잉', items:[2행] }]`
- [x] T-01-13 `shouldReturnEmptyPagesForWorkbookWithoutSheets` — `XLSX.utils.book_new()`(시트 0개) → `pages` `[]`, 예외 없음

### Green 힌트

- `XLSX.utils.sheet_to_json(sheet, { defval: '' })`로 헤더 키 객체를 얻으면 T-01-07이 함께 해결됩니다.
- 품절 정규화는 `cell === 'Y'`입니다. T-01-04를 `true`로 하드코딩하면 T-01-05가 일반화를 강제합니다.

### Refactor 점검

- 헤더 문자열(`'메뉴명'` 등)을 `{ 메뉴명: 'name', 가격: 'price', ... }` 열 매핑 상수 하나로 모읍니다.
- 품절 표식 `'Y'`, 설정 시트 접두사 `'_'`를 이름 있는 상수로 바꿉니다.
- `toMenuItem(row)`, `toPage(name, sheet)`, `groupByCategory(items)`를 추출합니다.
- T-01-10과 T-01-11의 행 제외 판정이 "메뉴명 없음" 하나로 합쳐지는지 확인합니다.
- 테스트 코드의 반복 fixture를 헬퍼로 뽑습니다.

### 기록

- Red: `npm test` → tests 14 / pass 1 / fail 13. 13개 모두 `TypeError: Cannot read properties of undefined (reading 'pages')` (`parseWorkbook`이 `undefined` 반환). xlsx 0.20.3 CDN 설치
- Green: 3단계 — ① Fake It(`name: '아메리카노'` 하드코딩) pass 3 → ② 첫 시트 행→항목 매핑 pass 9 → ③ `_` 시트 제외·메뉴명 빈 행 제외·`groups` pass 14 / fail 0. 실제 `data/menu.xlsx`: 커피 6개·디저트 5개·음료 4개
- Refactor: 4단계, 단계마다 pass 14 / fail 0 — ① Replace Magic Literal with Symbolic Constant(`COLUMNS`, `SOLD_OUT_MARK`, `NON_PAGE_PREFIX`) ② Extract Function `toMenuItem` ③ Extract Function `groupByCategory`(`find` 반복 → `Map`) ④ Extract Function `isPageSheet`·`toPage`·`hasMenuName`(T-01-10/11 판정이 `hasMenuName` 하나로 합쳐짐)

---

## M2 — `_설정` 파싱

- plan.md: 마일스톤 2 (4항목)
- `_설정`은 `항목 | 값` 키-값 시트입니다. `디바이스`, `영문태그`는 `plan.md`에 없어서 이번 범위에서 읽지 않습니다.
- 기본 fixture: `커피` 시트 + `_설정` `[['항목','값'],['매장명','빌런 커피'],['테마','deep-green'],['자동전환초',8]]`
- 예상 Red: `AssertionError: undefined !== '빌런 커피'`

### 세부 테스트 체크리스트

- [x] T-02-01 `shouldReadStoreNameFromSettings` — `store === '빌런 커피'`
- [x] T-02-02 `shouldReadThemeFromSettings` — `theme === 'deep-green'`
- [x] T-02-03 `shouldDefaultThemeToCafeDark` — `테마` 행 없음 → `theme === 'cafe-dark'`
- [x] T-02-04 `shouldReadAutoRotateSecondsAsNumber` — `autoRotateSec === 8`
- [x] T-02-05 `shouldDefaultAutoRotateToZeroWhenMissingOrNotNumeric` — 행 없음 / `'빠르게'` → 두 경우 모두 `0`
- [x] T-02-06 `shouldAssembleFinalShapeWithDefaultsWhenSettingsSheetMissing` — `커피` 시트만 → 키 `['autoRotateSec','pages','store','theme']`, `store === ''`, `theme === 'cafe-dark'`, `autoRotateSec === 0`

### Refactor 점검

- 키-값 행을 객체로 바꾸는 `readSettings(sheet)`를 추출합니다.
- 기본값(`''`, `'cafe-dark'`, `0`)을 `DEFAULT_SETTINGS` 상수 하나로 모읍니다.
- `parseWorkbook`이 "시트 분류 → 페이지 변환 → 설정 변환 → 조립" 단계로 읽히는지 확인합니다(Split Phase).

### 기록

- Red: `npm test` → tests 20 / pass 14 / fail 6. 대표 실패 `AssertionError: undefined !== 8` (설정 필드 없음)
- Green: `_설정`을 `{ 항목: 값 }`으로 읽어 `store`·`theme`·`autoRotateSec` 조립(기본값 리터럴 인라인). pass 20 / fail 0
- Refactor: 3단계, 단계마다 pass 20 / fail 0 — ① Extract Function `readSettings` ② Replace Magic Literal with Symbolic Constant(`SETTINGS_SHEET`, `SETTINGS_COLUMNS`, `SETTING_KEYS`, `DEFAULT_SETTINGS`) ③ Split Phase `toSettings`(읽기와 기본값 적용 분리)

---

## M3 — HTTP API

- plan.md: 마일스톤 3 (4항목) + 실행 진입점 2항목 추가(T-03-05, T-03-06). 추가한 이유는 테스트 없이 작성되는 연결 코드를 없애기 위해서입니다.
- 준비(Red): `npm i express` · `npm i -D supertest`
- 앱은 `createApp({ loadMenu, publicDir })`로 의존성을 주입받습니다. `listen`은 `server.mjs`에서만 합니다.
- 예상 Red: `ERR_MODULE_NOT_FOUND: src/app.mjs`

### 세부 테스트 체크리스트

- [x] T-03-01 `test/app.test.mjs` › `shouldCreateExpressAppWithoutListening` — `typeof createApp().listen === 'function'`
- [x] T-03-02 `shouldServeMenuJsonFromInjectedLoader` — `createApp({ loadMenu: () => menuFixture })` → `GET /api/menu` `200`, `application/json`, body deepEqual `menuFixture`
- [x] T-03-03 `shouldRespondWithEmptyPagesWhenLoaderThrows` — `loadMenu`가 `throw` → `200`, body `{ store:'', theme:'cafe-dark', autoRotateSec:0, pages:[] }`
- [x] T-03-04 `shouldServeStaticFilesFromPublicDir` — 임시 디렉터리(`fs.mkdtemp`)의 `index.html` → `GET /` `200`, `text/html`, 본문 일치
- [x] T-03-05 `test/loadMenuFromFile.test.mjs` › `shouldLoadSampleWorkbookFromDisk` — `loadMenuFromFile('data/menu.xlsx')` → 제목 `['커피','디저트','음료']`, `store === '빌런 커피'`
- [x] T-03-06 `test/server.test.mjs` › `shouldStartServerAndServeMenu` — `spawn('node', ['server.mjs'])`(`PORT=0`), stdout `listening on <port>` 대기 후 `GET /api/menu` `200`, `pages.length === 3`, 끝나면 프로세스 종료

### Green 힌트

- `loadMenuFromFile`: `XLSX.read(fs.readFileSync(path))` → `parseWorkbook`. 파일 I/O는 이 함수에만 둡니다.
  ESM 빌드의 `XLSX.readFile`은 `XLSX.set_fs(fs)` 없이 `Cannot access file`을 던집니다(M1 Green에서 확인).
- `server.mjs`: `createApp({ loadMenu: () => loadMenuFromFile(DATA_PATH), publicDir: 'public' })` + `listen(process.env.PORT ?? 3000)`

### Refactor 점검

- T-03-03의 빈 메뉴 기본값이 M2의 `DEFAULT_SETTINGS`와 중복되지 않게 공유합니다.
- 앱 내부에서 파일을 직접 읽지 않는지(의존성 명시) 확인합니다.

### 기록

- Red: `npm test` → fail 3(파일 단위). `ERR_MODULE_NOT_FOUND: src/app.mjs`(T-03-01~04), `src/loadMenuFromFile.mjs`(T-03-05), 서버 `code 1` 종료 — `server.mjs` 없음(T-03-06). express 5.3.0·supertest 7.3.2 설치
- Green: `src/app.mjs`(`createApp({ loadMenu, publicDir })`, 예외 시 빈 메뉴 리터럴 하드코딩) → `src/loadMenuFromFile.mjs`(`XLSX.read(readFileSync)`) → `server.mjs`(`PORT`·`DATA_PATH` 환경변수, `npm start` 추가). pass 26 / fail 0
- Refactor: 2단계, 단계마다 pass 26 / fail 0 — ① Remove Duplication: 빈 메뉴 리터럴을 `DEFAULT_SETTINGS`에서 파생한 `EMPTY_MENU`(`src/parseWorkbook.mjs`)로 교체 ② Extract Function `loadMenuOrEmpty`

---

## M4 — 파일 감시 + SSE

- plan.md: 마일스톤 4 (4항목) + 디바운스 삼각측량 1항목, 감시·통합 2항목 추가
- 준비(Red): `npm i chokidar`
- 디바운스는 `mock.timers`로 결정적으로 테스트합니다. fs 이벤트는 임시 파일로 테스트합니다.
- SSE 응답은 끝나지 않으므로 `app.listen(0)` + `http.get`으로 받은 뒤 `req.destroy()`합니다.
- 예상 Red: `ERR_MODULE_NOT_FOUND: src/debounce.mjs`

### 세부 테스트 체크리스트

- [x] T-04-01 `test/debounce.test.mjs` › `shouldReturnFunctionFromDebounce` — `typeof debounce(fn, 300) === 'function'`
- [x] T-04-02 `shouldInvokeOnceForBurstWithinWindow` — 100ms 간격 3회 호출 + `tick(300)` → `callCount === 1`
- [x] T-04-03 `shouldInvokeEachTimeWhenCallsAreFartherApartThanWindow` — 호출 → `tick(300)` → 호출 → `tick(300)` → `callCount === 2`
- [x] T-04-04 `test/app.test.mjs` › `shouldOpenSseStreamOnEvents` — `GET /events` `200`, `content-type`이 `text/event-stream`으로 시작
- [x] T-04-05 `shouldPushMenuUpdatedEventToConnectedClients` — 연결된 클라이언트 1개, `notifyMenuUpdated()` 호출 → 수신 데이터에 `event: menu-updated\n`
- [x] T-04-06 `test/watchWorkbook.test.mjs` › `shouldCallOnChangeOnceForRapidWrites` — `watchWorkbook(path, onChange, { debounceMs: 200 })`, 10ms 간격 2회 쓰기, 500ms 대기 (chokidar `change` 간격 ~50ms보다 넓은 창) → `onChange` 1회, `close()`로 종료
- [x] T-04-07 `test/server.test.mjs` › `shouldPushMenuUpdatedWhenWorkbookChanges` — `data/menu.xlsx`를 임시 디렉터리에 복사, `DATA_PATH`로 서버 실행, `/events` 연결 후 파일 재작성 → 2초 안에 `event: menu-updated`

### Green 힌트

- `watchWorkbook`: chokidar `change` 이벤트 → T-04-02의 `debounce`
- `server.mjs`: `watchWorkbook(DATA_PATH, notifyMenuUpdated, { debounceMs: 300 })`

### Refactor 점검

- 클라이언트 목록 관리(추가, `close` 시 제거)를 `createSseHub()`로 추출합니다.
- 디바운스 시간 `300`을 이름 있는 상수로 둡니다.

### 기록

- Red: `npm test` → tests 31 / pass 26 / fail 5. `ERR_MODULE_NOT_FOUND: src/debounce.mjs`(T-04-01~03)·`src/watchWorkbook.mjs`(T-04-06), `404 !== 200`(T-04-04), `TypeError: app.notifyMenuUpdated is not a function`(T-04-05), `Cannot GET /events`(T-04-07). chokidar 6.0.0 설치. `notifyMenuUpdated`는 `createApp`이 반환한 앱의 메서드로 정함(T-03-01의 `app.listen` 계약 유지)
- Green: `src/debounce.mjs` → `/events` SSE + `app.notifyMenuUpdated`(`event: menu-updated` + `data: {}` — EventSource는 data 없는 이벤트를 발생시키지 않음) → `src/watchWorkbook.mjs`(chokidar `change` + debounce) → `server.mjs` 결선. T-04-06은 `debounceMs: 50`에서 실패: chokidar가 10ms 간격 쓰기 2회를 51ms 간격 `change` 2회로 냄(이벤트 추적으로 확인) → 단언 유지, 창만 200ms로 조정. pass 33 / fail 0 (3회 연속)
- Refactor: 2단계, 단계마다 pass 33 / fail 0 — ① Extract Module `createSseHub`(`src/sseHub.mjs`, 클라이언트 추가·`close` 시 제거·broadcast) + 이벤트명 상수 `MENU_UPDATED_EVENT` ② Replace Magic Literal `WATCH_DEBOUNCE_MS`(`server.mjs`)

---

## M5 — 클라이언트 렌더링 (선택, 강의 진도에 따라)

- plan.md: 마일스톤 5 (4항목)
- DOM 없이 테스트하려고 렌더링을 **HTML 문자열을 반환하는 순수 함수**(`public/render.mjs`)로 둡니다.
- `public/client.js`는 `fetch('/api/menu')` + `EventSource('/events')` + `innerHTML` 연결만 합니다.
  이 연결 코드는 브라우저에서 확인합니다(`npm start` 후 1080×1920, 1920×1440, 1440×1920, 1080×2160).
- CSS·HTML은 `.claude/rules/anti-ai-slop.md`를 따릅니다. 취소선·흐림은 CSS `.is-sold-out`에서만 정의합니다.
- 예상 Red: `ERR_MODULE_NOT_FOUND: public/render.mjs`

### 세부 테스트 체크리스트

- [x] T-05-01 `test/render.test.mjs` › `shouldFormatPriceWithThousandsSeparatorAndWon` — `formatPrice(4500) === '4,500원'`, `formatPrice(12000) === '12,000원'`
- [x] T-05-02 `shouldRenderCategoryHeadingsAndItems` — 그룹 `에스프레소`, 항목 `아메리카노` 4500 → 소제목·메뉴명·`4,500원` 포함, 메뉴명의 `<`는 `&lt;`
- [x] T-05-03 `shouldMarkSoldOutItemWithClassAndLabel` — `soldOut: true` 항목에만 `is-sold-out` 클래스와 `품절` 텍스트
- [x] T-05-04 `shouldBuildThemeClassName` — `themeClass('deep-green') === 'theme-deep-green'`
- [x] T-05-05 `shouldWrapToFirstPageAfterLast` — `nextPageIndex(0, 3) === 1`, `nextPageIndex(2, 3) === 0`
- [x] T-05-06 `shouldRotatePagesOnlyWhenAutoRotateIsPositive` — `mock.timers`, `startRotation({ autoRotateSec: 5, pageCount: 3, onChange })` + `tick(10000)` → `onChange` 2회(1, 2). `autoRotateSec: 0` → 0회

### Refactor 점검

- 가격 서식(`원`)이 렌더 계층에만 있는지 확인합니다(데이터/표현 분리).
- `startRotation`이 `stop()`을 반환해 SSE 재렌더 때 타이머를 정리하는지 확인합니다.

### 기록

- Red: `npm test` → tests 34 / pass 33 / fail 1(파일 단위, 테스트 6개). `ERR_MODULE_NOT_FOUND: public/render.mjs`. T-05-06은 `startRotation`이 `stop()`을 반환하는 것까지 요구
- Green: `public/render.mjs`(렌더 순수 함수 5개, `renderPage`는 중첩 템플릿 한 덩어리) → pass 39 / fail 0. 연결 코드 `public/index.html`·`client.js`·`style.css` 추가: `node --check` 통과, `PORT=3123` 서버에서 `/`·`/client.js`·`/render.mjs`·`/style.css`·`/api/menu` 모두 200. anti-ai-slop 금지 패턴 grep 0건. 브라우저 4개 해상도 육안 확인은 하지 않음
- Refactor: 2단계, 단계마다 pass 39 / fail 0 — ① Extract Function `renderGroup`·`renderItem`(중첩 템플릿 해체) ② Extract Constant `HTML_ESCAPES` + `escapeHtml` 함수화

---

## 결함 분석 (2026-11-08, M5 완료 후 결과물 검토)

| 증상 | 관찰한 값 | 원인 |
| --- | --- | --- |
| 시트별 페이지가 아니라 한 페이지만 보임 | `data/menu.xlsx`(23:06 저장)의 시트 순서가 `내보내기 요약, 커피, 디저트, 음료, _설정` | Numbers로 저장하면 `내보내기 요약` 시트가 맨 앞에 추가됩니다. 파서는 `_`로 시작하지 않는 시트를 모두 페이지로 만들어 이 시트가 0번 페이지가 됩니다(`src/parseWorkbook.mjs` `isPageSheet`). 클라이언트는 `자동전환초=0`이면 0번 페이지만 그리고 페이지를 넘길 수단이 없습니다(`public/client.js` `showPage(0)`) |
| Excel 수정이 화면에 반영되지 않음 | 서버 경로 정상: 파일 저장 후 SSE `menu-updated` 305ms 만에 도착, `/api/menu`의 `theme` 값 변경 확인. 직접 쓰기·rename·`RENAME_SWAP` 저장 모두 chokidar `change` 발생 | 화면은 0번 페이지(`내보내기 요약`)만 그립니다. 커피·디저트·음료 값을 바꿔도 보이는 곳이 없습니다. `메뉴명` 열이 없는 행은 `hasMenuName`이 `undefined !== ''`로 통과시켜 이름 없는 항목 9개가 표시됩니다. `테마`를 `beige`·`cream` 등으로 바꿔도 CSS가 `cafe-dark`·`deep-green` 2종만 있어 화면이 그대로입니다. `디바이스`·`영문태그`는 파싱하지 않습니다 |
| `design/project` 디자인 미적용 | 프로토타입: 디바이스 캔버스 4종(1080×1920 등) + `assets/<테마>/{bg,frame}-<디바이스>.png` 레이어 + 영문태그·매장명·구분선·시트명/카테고리 메타·점선 리더 가격 행. 현재 `public/style.css`는 단일 흐름 레이아웃, PNG 0개 사용 | M5 체크리스트에 디자인 항목이 없어 구현 범위에서 빠졌습니다 |
| 기존 테스트 2개 실패 | `shouldLoadSampleWorkbookFromDisk`, `shouldStartServerAndServeMenu` (pass 37 / fail 2) | 위 첫 번째 원인을 API 수준에서 잡은 회귀입니다. 결함 수정의 API 수준 실패 테스트로 씁니다 |

TDD 스펙에서 빠진 것: 메뉴 헤더가 없는 시트, 메뉴명 셀이 아예 없는 행, 수동 페이지 전환, 디바이스·영문태그 설정, 테마 8종 CSS, PNG 레이어.

---

## M6 — 결함: 메뉴 헤더 없는 시트 제외

- API 수준 실패 테스트(이미 Red): T-03-05 `shouldLoadSampleWorkbookFromDisk`, T-03-06 `shouldStartServerAndServeMenu`
- 가장 작은 재현 테스트는 아래 2개입니다.
- 예상 Red: `deepEqual` 실패 `['내보내기 요약', '커피']` vs `['커피']`

### 세부 테스트 체크리스트

- [x] T-06-01 `shouldExcludeSheetsWithoutMenuNameHeader` — Numbers `내보내기 요약` 시트(헤더에 `메뉴명` 없음) + `커피` → 제목 `['커피']`
- ~~T-06-02 `shouldSkipRowsWhoseMenuNameCellIsMissing`~~ — Red에서 바로 통과해 삭제: `sheet_to_json(defval: '')`이 빈 셀을 `''`로 채워 이미 제외됨. `undefined`는 `메뉴명` 열이 없을 때만 생기며 T-06-01이 다룸

### Refactor 점검

- `isPageSheet`(시트 이름)와 메뉴 헤더 판정이 한 곳에서 읽히는지 확인합니다.

### 기록

- Red: `npm test` → tests 40 / pass 37 / fail 3. T-06-01 `actual: [ '내보내기 요약', '커피' ]` vs `expected: [ '커피' ]`, API 수준 T-03-05·T-03-06도 같은 원인으로 실패
- Green: 첫 행에 `메뉴명`이 없는 시트를 페이지에서 제외(인라인 filter). pass 40 / fail 0 — API 수준 T-03-05·T-03-06도 통과(실제 Numbers 저장 파일에서 `커피·디저트·음료`)
- Refactor: Extract Function `isMenuSheet`·`hasMenuHeader` — 시트 분류(접두사 + 헤더)를 한 함수로 합치고 `isPageSheet` 제거. pass 40 / fail 0

---

## M7 — 결함: 시트별 페이지 네비게이션

- 요구사항: `자동전환초=0`이면 수동 전환, 시트 이름 = 페이지(탭) 이름 (`docs/menu-project-requirement.md`)
- 예상 Red: `renderPageTabs is not a function`

### 세부 테스트 체크리스트

- [x] T-07-01 `shouldRenderOneTabPerPageInSheetOrder` — `renderPageTabs(pages, 0)` → `data-page-index` 0·1·2, 제목 `커피`·`디저트`·`음료` 순
- [x] T-07-02 `shouldMarkOnlyActiveTabAsCurrent` — `activeIndex 1` → `aria-current="page"` 1개, `디저트` 탭에만
- [x] ~~T-07-03 `shouldKeepPageIndexAfterRefreshWhenStillValid`~~ (M13 Refactor에서 삭제: 프론트 탭이 없어져 `clampPageIndex`를 쓰는 곳이 0곳, `initialPageIndex`가 대체) — `clampPageIndex(2, 3) === 2`, `clampPageIndex(2, 2) === 0`, `clampPageIndex(0, 0) === 0`
- [x] T-07-04 `shouldRotateFromGivenStartIndex` — `startRotation({ autoRotateSec: 5, pageCount: 3, startIndex: 2, onChange })` + `tick(5000)` → `onChange(0)`

### 기록

- Red: `npm test` → tests 44 / pass 40 / fail 4. `TypeError: render.renderPageTabs is not a function`(T-07-01·02), `render.clampPageIndex is not a function`(T-07-03), `actual: [ 1 ]` vs `[ 0 ]`(T-07-04, `startIndex` 무시)
- Green: `renderPageTabs`·`clampPageIndex`·`startRotation({ startIndex })` 추가. `client.js`: 탭 클릭으로 페이지 전환, SSE 갱신 시 보던 페이지 유지, 수동 전환 후 순환 재시작. 페이지 2개 이상일 때만 탭 표시. pass 44 / fail 0, `node --check` 통과
- Refactor: Extract Function `renderTab`(활성 표시 분리, `renderItem`과 같은 구조). pass 44 / fail 0

---

## M8 — 결함: 디자인 적용 (테마·디바이스·PNG)

- 근거: `design/project/메뉴판 템플릿 시스템.dc.html`의 `THEMES`·`DEVICES`·`renderVals()`
- 프로토타입에 색 토큰이 없는 테마 4종(`cafe-dark`, `bistro-light`, `forest-dark`, `forest-light`)은 배경 PNG 썸네일에서 색을 추정했습니다.
- `.claude/rules/anti-ai-slop.md` 우선 적용: 품절 배지 radius `999px` → `4px`, 사진 슬롯(`repeating-linear-gradient` 자리표시자)과 미리보기 무대 그림자 제외
- 에셋 71MB는 복사하지 않고 `design/project/assets`를 `/assets`로 서빙합니다.
- 스펙 확장: 최종 출력에 `device`·`tagline`이 추가되므로 T-02-06·T-03-03의 기대 키를 함께 갱신합니다.
- 예상 Red: `AssertionError: undefined !== 'tablet-port'`, `deviceSpec is not a function`

### 세부 테스트 체크리스트

- [x] T-08-01 `shouldReadDeviceAndTaglineFromSettings` — `디바이스=tablet-port`, `영문태그=SPECIALTY COFFEE` → `device`, `tagline`
- [x] T-08-02 `shouldDefaultDeviceToSignageAndTaglineToEmpty` — 행 없음 → `device === 'signage'`, `tagline === ''`
- [x] T-08-03 `shouldDescribeDeviceCanvas` — `deviceSpec('tablet-land')` → `{ width: 1920, height: 1440, columns: 2 }`, 미지원 값 → signage `{ 1080, 1920, 1 }`
- [x] T-08-04 `shouldBuildThemeAssetUrls` — `assetUrls('deep-green', 'tablet-port')` → `bg`·`frame` PNG 경로
- [x] T-08-05 `shouldFitCanvasInsideViewport` — `fitScale({ width: 1080, height: 1920 }, { width: 540, height: 1200 }) === 0.5`
- [x] T-08-06 `shouldRenderBoardHeaderWithTaglineStoreAndPageMeta` — `renderBoard(menu, 1)` → 영문태그·매장명·`디저트`·카테고리 메타(`케이크 · 베이커리`)·가격 리더 요소
- [x] T-08-07 `shouldServeThemeAssetsFromAssetsDir` — `createApp({ assetsDir })` → `GET /assets/deep-green/bg-signage.png` 200 `image/png`
- [x] T-08-08 `shouldDefineStyleForEveryAssetTheme` — `design/project/assets`의 테마 폴더 8개마다 `public/style.css`에 `.theme-<테마>` 규칙

### 기록

- Red: `npm test` → tests 52 / pass 42 / fail 10. 신규 8개: `TypeError: render.deviceSpec is not a function` 등 함수 없음 4건, `device`·`tagline` `undefined` 2건, `/assets` 404 1건, `CSS 토큰이 없는 테마: beige, bistro-light, cream, forest-dark, forest-light, light-olive` 1건. 스펙 확장으로 기대값을 바꾼 기존 T-02-06·T-03-03 2건
- Green: `device`·`tagline` 파싱, `/assets` → `design/project/assets` 서빙, `renderBoard`·`deviceSpec`(if 분기)·`assetUrls`·`fitScale`, 디바이스 캔버스 + bg/frame PNG 레이어 + 테마 8종 토큰 CSS. pass 52 / fail 0. headless Chrome(DevTools)로 Numbers 저장 실데이터 확인: 탭 `커피·디저트·음료`, 디저트 탭 클릭 후 파일 저장 1.5초 안에 `theme-deep-green`→`theme-cream`, 가격 6,500원→7,700원, 보던 페이지 유지
- Refactor: 2단계, 단계마다 pass 52 / fail 0 — ① Replace Conditional with Lookup Table: `deviceSpec` if 분기 → `DEVICES` 표 + `DEFAULT_DEVICE` ② Remove Duplication: `renderBoard`가 시트명·메타·그룹을 다시 그리던 코드를 `renderPage` 조합으로 교체(클라이언트에서 쓰이지 않던 `renderPage`가 화면 경로에 들어옴). 리팩터링 후 headless Chrome 캡처로 화면 동일 확인

---

## 어드민 요구사항 (2026-11-08)

- `/admin`에 `admin/1234`로 로그인합니다. 환경변수 `ADMIN_USER`·`ADMIN_PASSWORD`로 바꿀 수 있습니다.
- `design/project/메뉴판 템플릿 시스템.dc.html`처럼 테마·디바이스 버튼과 미리보기 무대(stage)를 제공하고, `_설정` 값(매장명·영문태그·자동전환초·표시시트)을 편집합니다.
- 저장하면 `data/menu.xlsx`의 `_설정` 시트에 씁니다. 파일 감시와 SSE가 프론트를 갱신합니다. 설정 값의 출처는 Excel 하나입니다.
- `/`는 설정대로 메뉴판만 전체 크기로 출력합니다. 탭과 옵션 UI는 두지 않습니다.
- 새 `_설정` 키 `표시시트`: `자동전환초=0`일 때 보여 줄 시트입니다. 순환할 때는 이 시트에서 시작합니다.

## M9 — Excel 설정 저장

- 예상 Red: `ERR_MODULE_NOT_FOUND: src/saveSettings.mjs`

### 세부 테스트 체크리스트

- [x] T-09-01 `shouldReadDisplaySheetFromSettings` — `표시시트=디저트` → `displaySheet === '디저트'`, 행이 없으면 `''`
- [x] T-09-02 `shouldUpdateExistingSettingRowsInWorkbookFile` — `saveSettings(file, { theme: 'cream', autoRotateSec: 7 })` 후 다시 읽으면 `theme`·`autoRotateSec`만 바뀌고 `store`는 유지
- [x] T-09-03 `shouldAppendSettingRowsThatDoNotExistYet` — `표시시트` 행이 없을 때 `{ displaySheet: '디저트' }` 저장 → 다시 읽으면 `'디저트'`
- [x] T-09-04 `shouldCreateSettingsSheetWhenMissing` — `_설정` 시트가 없는 파일에 저장 → `store` 반영, 페이지 목록 불변
- [x] T-09-05 `shouldKeepMenuSheetsIntactAfterSave` — 저장 전후 `pages` deepEqual

### 기록

- Red: `npm test` → tests 54 / pass 50 / fail 4. `ERR_MODULE_NOT_FOUND: src/saveSettings.mjs`(T-09-02~05), `displaySheet` `undefined`(T-09-01), 스펙 확장으로 기대 키를 바꾼 T-02-06·T-03-03
- Green: `표시시트` 파싱, `src/saveSettings.mjs`(읽기 → `_설정` 행 갱신/추가/시트 생성 → 같은 폴더 임시 파일에 쓰고 rename). pass 57 / fail 0. 실제 Numbers 저장 파일 사본에서 시트 5개·페이지 3개 유지 확인
- Refactor: Extract Function `readSettingRows`·`upsertSettingRows`·`replaceSettingsSheet`·`writeWorkbookAtomically`(각 단계 의도를 주석 한 줄로). pass 57 / fail 0

## M10 — 어드민 인증

- 예상 Red: `expected 302, got 404`

### 세부 테스트 체크리스트

- [x] T-10-01 `shouldRedirectAnonymousAdminToLogin` — `GET /admin` → `302 Location: /admin/login`
- [x] T-10-02 `shouldServeLoginForm` — `GET /admin/login` → `200`, `<form` + `password` 입력
- [x] T-10-03 `shouldRejectWrongCredentials` — `POST /admin/login` `admin/0000` → `401`, `Set-Cookie` 없음
- [x] T-10-04 `shouldStartSessionWithCorrectCredentials` — `admin/1234` → `303 /admin`, 쿠키 `HttpOnly; SameSite=Strict`, 그 쿠키로 `GET /admin` → `200`
- [x] T-10-05 `shouldEndSessionOnLogout` — `POST /admin/logout` 후 같은 쿠키로 `GET /admin` → `302`

### 기록

- Red: `npm test` → tests 62 / pass 57 / fail 5. 5개 모두 `404 !== 302`·`404 !== 200` 등 라우트 없음
- Green: `createApp({ admin })`일 때 `/admin`(세션 없으면 302), `/admin/login` GET/POST, `/admin/logout`. 세션은 메모리 `Set` + `randomUUID` 쿠키(`HttpOnly; SameSite=Strict; Path=/admin`). 화면 HTML은 임시 문자열. pass 62 / fail 0
- Refactor: Extract Module `src/adminAuth.mjs`(`createAdminAuth`: `isLoggedIn`·`login`·`logout`, 쿠키 이름·속성 상수). 계정 비교를 SHA-256 + `timingSafeEqual`로 교체(출력 동일, 비교 시간 일정). pass 62 / fail 0

## M11 — 어드민 설정 API

- 예상 Red: `validateSettings is not a function`, `expected 401, got 404`

### 세부 테스트 체크리스트

- [x] T-11-01 `shouldRejectSettingsApiWithoutSession` — `GET /admin/api/settings` → `401`
- [x] T-11-02 `shouldReturnCurrentSettingsWithChoices` — 로그인 후 → `settings`·`sheets`·`themes`(8)·`devices`(4)
- [x] T-11-03 `shouldSaveValidSettingsToWorkbook` — `POST` 유효 값 → `200`, 주입한 `saveSettings`가 정규화된 값(`autoRotateSec` 숫자)으로 1회 호출
- [x] T-11-04 `shouldRejectInvalidSettingsWithoutSaving` — 없는 테마 → `400` + `errors.theme`, `saveSettings` 0회
- [x] T-11-05 `shouldValidateEachSettingField` — `validateSettings` 단위: 음수·소수 `autoRotateSec`, 없는 디바이스, 없는 표시시트, 100자 넘는 매장명 → 각 필드 오류
- [x] T-11-06 `shouldListEveryAssetThemeWithLabels` — `public/themes.mjs`의 `THEMES` 키 = `design/project/assets` 폴더 8개, 각 항목에 `label`·`ko`·`accent` (API·검증의 테마 목록 출처라 M12에서 앞당김)

### 기록

- Red: `npm test` → tests 67 / pass 62 / fail 5(파일 단위, 테스트 6개). API 4개 `404 !== 401`·`404 !== 200`·`404 !== 400`, `ERR_MODULE_NOT_FOUND: src/validateSettings.mjs`(T-11-05·06)
- Green: `public/themes.mjs`(8종 라벨·accent), `DEVICE_OPTIONS`(라벨·해상도), `src/validateSettings.mjs`, `GET/POST /admin/api/settings`(세션 없으면 401, 검증 실패 400, 저장 실패 500), `server.mjs`에 `ADMIN_USER`·`ADMIN_PASSWORD`(기본 admin/1234) + `saveSettings(DATA_PATH)` 결선. pass 68 / fail 0
- Refactor: Extract Module `src/adminRoutes.mjs`(`adminRouter({ admin, getMenu })`) — `app.mjs`는 조립만 담당. 두 API의 401 검사 중복을 `requireSession` 미들웨어로 합침. Extract Function `settingsOf`·`sheetTitlesOf`·`choicesOf`. pass 68 / fail 0

## M12 — 어드민 화면

- 프로토타입 컨트롤(테마 버튼: 색 점 + 영문/한글 이름, 디바이스 버튼, 미리보기 무대, PNG 경로·해상도 캡션)을 옮깁니다. 색 그림자·`transition: all`은 규칙상 뺍니다.
- 예상 Red: `ERR_MODULE_NOT_FOUND: public/admin-view.mjs`

### 세부 테스트 체크리스트

- [x] T-12-02 `shouldMarkActiveThemeOption` — `renderThemeOptions(THEMES, 'cream')` → 버튼 8개, `aria-pressed="true"`는 `cream`만
- [x] T-12-03 `shouldListDeviceOptionsWithResolution` — `renderDeviceOptions('mobile')` → 4개, `1080 × 2160` 표기, `mobile`만 활성
- [x] T-12-04 `shouldOverlayDraftSettingsOnMenuForPreview` — `previewMenu(menu, draft)` → 초안 값 반영, 원본 `menu` 불변
- [x] T-12-05 `shouldServeAdminScreenAfterLogin` — 로그인 후 `GET /admin` HTML에 `admin.js`·`stage`, `GET /admin.js` `200`

### 기록

- Red: `npm test` → tests 70 / pass 68 / fail 2(파일 단위, 테스트 4개). `ERR_MODULE_NOT_FOUND: public/admin-view.mjs`(T-12-02~04), `/admin` HTML에 `admin.js` 없음(T-12-05)
- Green: `public/admin-view.mjs`(테마·디바이스 버튼, `previewMenu`), `src/views/admin.html`·`login.html`, `public/admin.js`(초안 편집 → 무대 미리보기, 저장 POST, 401이면 로그인으로), `public/admin.css`. 테마 토큰 선택자를 `body.theme-*` → `.theme-*`로 바꿔 미리보기 캔버스에도 적용. pass 72 / fail 0
- Refactor: 2단계, 단계마다 pass 72 / fail 0 — ① Extract Function `renderOption`(테마·디바이스 버튼 템플릿 중복 제거, `aria-pressed` 한 곳) ② Extract Constant `LOGIN_TEMPLATE`(요청마다 파일 읽던 것을 모듈 로드 시 1회로)

## M13 — 프론트 키오스크화

- 예상 Red: `initialPageIndex is not a function`

### 세부 테스트 체크리스트

- [x] T-13-01 `shouldStartAtDisplaySheet` — `initialPageIndex(pages, '디저트') === 1`, 없는 이름·빈 값 → `0`
- [x] T-13-02 `shouldRenderOnlyMenuBoardOnFront` — `public/index.html`에 탭·옵션 UI(`id="tabs"`) 없음, `canvas`만
- [x] T-13-03 `shouldNormalizeThemeAndDeviceCase` — Numbers에서 `테마=Cream`, `디바이스= Tablet-Port `로 저장된 값 → `cream`, `tablet-port` (실제 `data/menu.xlsx`가 `Cream`이라 PNG 404·CSS 미적용)

### 기록

- Red: `npm test` → tests 75 / pass 72 / fail 3. `render.initialPageIndex is not a function`, `index.html`에 `id="tabs"` 있음, `'Cream' !== 'cream'`
- Green: `initialPageIndex`, 테마·디바이스 `trim().toLowerCase()`, `index.html`에서 탭 제거, `client.js`는 설정대로 캔버스만 그리고 표시시트부터 순환. pass 75 / fail 0
- Refactor: 3단계, 단계마다 fail 0 — ① Remove Dead Code `clampPageIndex` + T-07-03(사용처 0곳) tests 75→74 ② 프론트 탭 CSS 삭제(어드민 `.option-row` 규칙만 유지) ③ Extract Function `normalizeKey`. pass 74 / fail 0

