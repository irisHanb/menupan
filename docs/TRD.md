# TRD — 카페 메뉴판 (Excel 구동)

> Technical Requirements Document. **어떻게** 만드는가. 제품 요구사항은
> [PRD.md](PRD.md)를 본다.

## 1. 기술 스택

| 영역       | 선택                        | 이유                                        |
| ---------- | --------------------------- | ------------------------------------------- |
| 런타임     | Node.js (ESM, `.mjs`)       | 단일 프로세스로 파일 감시 + HTTP + SSE 처리 |
| 웹 서버    | Express                     | 정적 파일 + `/api/menu` + SSE 엔드포인트    |
| 파일 감시  | chokidar                    | `menu.xlsx` 저장 감지, 디바운스             |
| Excel 파싱 | xlsx (SheetJS)              | 시트→JSON 변환                              |
| 프론트     | 바닐라 HTML/CSS/JS          | 빌드 없는 단순 표현 계층                    |
| 폰트       | Nanum Myeongjo + Pretendard | 제목 명조(매장 감성) + 본문 산세리프(가독)  |

### SheetJS 설치 (중요)

npm 레지스트리의 `xlsx`는 0.18.5 구버전이다. **공식 CDN**을 쓴다.

```json
"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"
```

보안 스캐너(Snyk 등) 오탐은 알려진 이슈이며 공식적으로 무시 권장.

## 2. 목표 폴더 구조

```text
menupan/
├── package.json          # 의존성: express, chokidar, xlsx
├── server.mjs            # 파일 감시 + Excel 파싱 + SSE 푸시
├── data/
│   └── menu.xlsx         # 샘플 데이터 (커피/디저트/음료 + _설정)
├── docs/                 # PRD / TRD / 요구사항
├── design/               # 디자인 프로토타입 (테마·디바이스 PNG)
├── test/                 # TDD 테스트 (파서·API·SSE)
└── public/
    ├── index.html        # 메뉴판 화면
    ├── client.js         # SSE 수신 + 렌더링
    └── templates/
        ├── board-grid.css    # 공통 레이아웃(테마 변수 기반)
        ├── cafe-dark.css     # 테마별 CSS
        └── ...               # 테마 8종
```

## 3. 데이터 흐름

```text
점주 Excel 저장
   │
   ▼
data/menu.xlsx ──(chokidar 감시, 300ms 디바운스)──▶ server.mjs
   │                                                  │ 재파싱(JSON)
   │                                  SSE: event: menu-updated
   ▼                                                  ▼
GET /api/menu ◀──────────────────── 브라우저(client.js) ── 선택 테마로 재렌더
```

1. chokidar가 `menu.xlsx` 변경 감지 → 300ms 디바운스로 중복 이벤트 합침.
2. server가 워크북 재파싱 → 페이지 배열 + 설정 객체로 변환.
3. SSE로 `event: menu-updated` 푸시(데이터 본문 없이 신호만 보내도 됨).
4. 브라우저가 `GET /api/menu`로 최신 JSON을 가져와 재렌더.

> **SSE 선택 근거**: 메뉴판은 서버→클라이언트 단방향 읽기 전용. WebSocket의
> 양방향성이 불필요하므로 SSE로 충분하고 단순하다.

## 4. 서버 책임 (`server.mjs`)

- **시트 분류**: `_` 접두사 아닌 시트 = 페이지, `_설정` = 설정.
- **메뉴 행 파싱**: 헤더(`메뉴명/가격/설명/품절/카테고리`) 기준으로 행을 객체화.
  가격은 숫자 유지, 품절은 `Y`/빈칸 정규화.
- **설정 파싱**: `_설정`에서 `매장명/테마/자동전환초` 추출. 누락 시 기본값.
- **엔드포인트**:
  - `GET /api/menu` →
    `{ store, theme, autoRotateSec, pages: [{ name, items: [...] }] }`
  - `GET /events` (SSE) → 갱신 시 `menu-updated` 이벤트.
  - 정적: `public/` 서빙.

## 5. 클라이언트 책임 (`public/client.js`)

- 초기 `GET /api/menu`로 렌더.
- `EventSource('/events')`로 `menu-updated` 수신 → 재페치 후 재렌더.
- 테마: `_설정.테마` 값으로 `<body>` 클래스/CSS 변수 스위치 + 디바이스별 배경
  PNG 적용.
- `자동전환초 > 0`이면 해당 주기로 페이지 순환(타이머).

## 6. 테마 / 디바이스 매트릭스

- 테마 8종 × 디바이스 4종. 각 조합마다 `bg-*.png` + `frame-*.png` 자산
  존재(`design/project/assets/<theme>/`).
- 디바이스: `mobile`, `tablet-port`, `tablet-land`, `signage`.
- 데이터는 불변, **CSS 변수 + PNG 세트 교체**로만 디자인이 바뀐다(데이터/표현
  분리 원칙).

## 7. 테스트 전략 (Kent Beck TDD)

> 개발은 [CLAUDE.md](../CLAUDE.md)의 TDD + Tidy First 프로세스를 따른다. 모든
> 기능은 실패하는 테스트부터 시작한다.

권장 도구: Node 내장 `node:test`(또는 `vitest`) + HTTP/SSE 검증용 `supertest`.

테스트 우선순위(파서가 핵심 로직 → 먼저):

1. **Excel 파서** — 단위 테스트 (외부 의존 없는 순수 함수로 분리)
   - 헤더 정상 파싱 / `_` 접두사 시트 제외 / 가격 숫자 유지 / 품절 `Y` 정규화 /
     빈 셀 처리.
2. **설정 파싱** — `_설정` 누락 항목 기본값.
3. **API** — `GET /api/menu` 응답 형태(supertest).
4. **SSE** — 파일 변경 시 `menu-updated` 발생(파일 시스템은 fixture/임시
   파일로).
5. **디바운스** — 연속 이벤트가 1회로 합쳐지는지.

> **설계 함의**: 파싱 로직을 `server.mjs`에서 **순수 함수로 추출**해야 파일
> 시스템/HTTP 없이 단위 테스트가 쉽다. 이것이 TDD가 강제하는 좋은 구조다(부작용
> 격리).

## 8. 알려진 제약 / 결정

- 로컬 `.xlsx`는 **저장 시점에만** 디스크에 기록 → 입력 중에는 갱신 안 됨(의도된
  동작). OneDrive 자동저장이면 즉시.
- 디바운스 300ms: Excel 저장 시 발생하는 중복 파일 이벤트 흡수.
- 단일 파일·단일 매장 가정(다중 매장은 비목표).

## 9. 확장 아이디어 (강의용)

- 테마 CSS 추가만으로 디자인 확장.
- `카테고리` 열로 페이지 내 소제목 그룹화.
- HTTP 공유: 사내 파일서버에 `menu.xlsx`, 브라우저 폴링(ETag).
- 키오스크: 전체화면 + `자동전환초` 페이지 순환.
