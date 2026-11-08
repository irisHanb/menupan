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
