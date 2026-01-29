# 키워드 마스터 - 기술 스펙 명세서

> **디자인 참조**: `keywordinsight-pro/` 폴더의 레이아웃을 기준으로 함

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | KeywordPro (키워드 마스터) |
| 목적 | 구글/네이버 검색 키워드 통합 분석 도구 |
| 형태 | 웹 애플리케이션 (SPA) |
| 주요 기능 | 4분할 비교 분석, 연관검색어, 자동완성, CSV 내보내기 |

---

## 2. 기술 스택

### 2.1 프론트엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 14.x | 풀스택 프레임워크 (App Router) |
| React | 18.x | UI 라이브러리 |
| TypeScript | 5.x | 타입 안정성 |
| Tailwind CSS | 3.x | 스타일링 (다크 테마) |
| Lucide React | latest | 아이콘 |
| React Query | 5.x | 서버 상태 관리 |

### 2.2 백엔드 (Next.js API Routes)
| 기술 | 용도 |
|------|------|
| Next.js API Routes | API 엔드포인트 |
| Axios | HTTP 클라이언트 |
| Zod | 스키마 검증 |

### 2.3 외부 API
| API | 용도 | 인증 방식 |
|-----|------|----------|
| DataForSEO | 구글 검색량, 연관검색어, 자동완성 | API Login/Password (Basic Auth) |
| 네이버 검색광고 API | 네이버 검색량, 연관검색어 | API Key + Secret + HMAC-SHA256 |

### 2.4 배포/인프라
| 서비스 | 용도 |
|--------|------|
| Vercel | 호스팅 및 배포 |
| Environment Variables | API 키 관리 |

---

## 3. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client (Browser)                               │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        Next.js Frontend                            │  │
│  │                                                                    │  │
│  │   ┌─────────────┐  ┌────────────────────────────────────────────┐ │  │
│  │   │  Sidebar    │  │              Main Content                   │ │  │
│  │   │  - Logo     │  │  ┌──────────────────────────────────────┐  │ │  │
│  │   │  - Nav      │  │  │            Header                     │  │ │  │
│  │   │  - Profile  │  │  │  버전 | 알림 | 도움말 | 내보내기      │  │ │  │
│  │   │             │  │  └──────────────────────────────────────┘  │ │  │
│  │   │             │  │  ┌──────────────────────────────────────┐  │ │  │
│  │   │  대시보드   │  │  │        View Content Area              │  │ │  │
│  │   │  로그/설정  │  │  │  - DashboardView (키워드 리스트)      │  │ │  │
│  │   │             │  │  │  - ComparisonView (4분할 비교)        │  │ │  │
│  │   │             │  │  │  - SettingsView (콘솔 + 설정)         │  │ │  │
│  │   │             │  │  └──────────────────────────────────────┘  │ │  │
│  │   └─────────────┘  └────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Next.js API Routes                               │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐   │
│  │ /api/google   │  │ /api/naver    │  │ /api/export               │   │
│  │ - volume      │  │ - volume      │  │ - csv                     │   │
│  │ - autocomplete│  │ - autocomplete│  │                           │   │
│  │ - related     │  │ - related     │  │                           │   │
│  └───────┬───────┘  └───────┬───────┘  └───────────────────────────┘   │
└──────────┼──────────────────┼───────────────────────────────────────────┘
           │                  │
           ▼                  ▼
    ┌─────────────┐    ┌─────────────┐
    │ DataForSEO  │    │ 네이버 광고  │
    │    API      │    │    API      │
    └─────────────┘    └─────────────┘
```

---

## 4. UI/UX 명세 (디자인 기준)

### 4.1 전체 레이아웃 구조

```
┌──────────────────────────────────────────────────────────────┐
│  SIDEBAR (w-64)  │           MAIN CONTENT                    │
│  ┌────────────┐  │  ┌─────────────────────────────────────┐  │
│  │   LOGO     │  │  │  HEADER (h-16)                      │  │
│  │ KeywordPro │  │  │  - 버전 정보                        │  │
│  │ Analysis   │  │  │  - 알림/도움말 아이콘               │  │
│  │ Suite      │  │  │  - 결과 내보내기 버튼               │  │
│  └────────────┘  │  └─────────────────────────────────────┘  │
│                  │                                           │
│  ┌────────────┐  │  ┌─────────────────────────────────────┐  │
│  │ 대시보드   │  │  │                                     │  │
│  │ 로그/설정  │  │  │         CONTENT AREA                │  │
│  └────────────┘  │  │       (View에 따라 변경)            │  │
│                  │  │                                     │  │
│  ┌────────────┐  │  │                                     │  │
│  │  PROFILE   │  │  │                                     │  │
│  │  Admin     │  │  │                                     │  │
│  │  Pro Plan  │  │  │                                     │  │
│  └────────────┘  │  └─────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 View 구성

#### View 1: DashboardView (대시보드)
```
┌─────────────────────────────────────────────────────────────┐
│  분석 키워드 리스트                      [검색창]           │
│  분석할 키워드를 선택하여...                                │
├─────────────────────────────────────────────────────────────┤
│  키워드        │ 구글 검색량 │ 네이버 검색량 │    액션      │
├─────────────────────────────────────────────────────────────┤
│  단백질 보충제 │   135,000   │    85,400     │ [상세보기]   │
│  유청 단백질   │    90,000   │    42,100     │ [상세보기]   │
│  ...           │    ...      │    ...        │    ...       │
└─────────────────────────────────────────────────────────────┘
```

**기능:**
- [ ] 키워드 입력/추가 기능
- [ ] 테이블 렌더링 (키워드, 구글 검색량, 네이버 검색량)
- [ ] 목록 내 검색 필터
- [ ] 상세보기 버튼 → ComparisonView 이동

#### View 2: ComparisonView (4분할 비교 분석) ⭐핵심 기능
```
┌─────────────────────────────────────────────────────────────┐
│  ← 목록으로 돌아가기                                        │
│                                                             │
│  ⚡ "단백질 보충제" 통합 비교 분석                          │
│  소스당 30개 수집 • 총 120개 분석 데이터                    │
├───────────────┬───────────────┬───────────────┬─────────────┤
│ 구글 연관검색어│ 구글 자동완성 │네이버 연관검색│네이버 자동완성│
│ ───────────── │ ───────────── │ ───────────── │ ───────────── │
│ 키워드    검색량│ 키워드    검색량│ 키워드    검색량│ 키워드    검색량│
│ ───────────── │ ───────────── │ ───────────── │ ───────────── │
│ 단백질 추천   │ 단백질 가격   │ 단백질 후기   │ 단백질 순위   │
│ [GOOGLE 검색] │ [GOOGLE 검색] │ [NAVER 검색]  │ [NAVER 검색]  │
│ ...          │ ...          │ ...          │ ...          │
│              │              │              │              │
│ (스크롤 가능) │ (스크롤 가능) │ (스크롤 가능) │ (스크롤 가능) │
└───────────────┴───────────────┴───────────────┴─────────────┘
```

**4개 섹션:**
| 섹션 | 소스 | 데이터 타입 | 아이콘 |
|------|------|-------------|--------|
| 구글 연관 검색어 | Google | Related Keywords | Search |
| 구글 자동완성 | Google | Autocomplete | Keyboard |
| 네이버 연관 검색어 | Naver | Related Keywords | Search |
| 네이버 자동완성 | Naver | Autocomplete | Keyboard |

**기능:**
- [ ] 4분할 그리드 레이아웃 (반응형)
- [ ] 각 섹션별 스크롤 가능한 테이블 (h-[850px])
- [ ] 키워드별 검색 바로가기 링크 (Google/Naver)
- [ ] 검색량 표시
- [ ] 수집 키워드 수 동적 설정 (소스당 N개)

#### View 3: SettingsView (로그 및 설정)
```
┌─────────────────────────────────────────────────────────────┐
│  [수량 설정] ═══════════●══════ 30  [설정 적용]  │ CPU: 2% │
├─────────────────────────────────────────────────────────────┤
│  SYSTEM EXECUTION LOGS (DETAILED)                [휴지통]  │
│ ─────────────────────────────────────────────────────────── │
│  12:00:01  [KERNEL]   System core online...                 │
│  12:00:02  [AUTH]     Environment variables verified...     │
│  12:00:03  [MODULE]   DataForSEO Parser initialized...      │
│  12:00:04  [NETWORK]  Establishing encrypted tunnels...     │
│  12:00:05  [READY]    Analysis ready. Batch size: 30        │
│  _                                                          │
├─────────────────────────────────────────────────────────────┤
│  Network Throughput: 420 KB/s    UPTIME: 03:22:14  V2.5.0   │
└─────────────────────────────────────────────────────────────┘
```

**기능:**
- [ ] 수량 설정 슬라이더 (10-100)
- [ ] 설정 적용 버튼
- [ ] 실시간 콘솔 로그 표시
- [ ] 로그 타입별 색상 (system/info/success/error)
- [ ] 로그 초기화 버튼
- [ ] 상태 표시 (CPU, Secure, Network, Uptime, Version)

### 4.3 공통 컴포넌트

| 컴포넌트 | 설명 | 위치 |
|---------|------|------|
| Sidebar | 사이드바 (로고, 네비게이션, 프로필) | App.tsx |
| Header | 상단 헤더 (버전, 알림, 내보내기) | App.tsx |
| KeywordTable | 키워드 테이블 (정렬, 필터) | DashboardView |
| ComparisonGrid | 4분할 그리드 | ComparisonView |
| ComparisonCard | 개별 비교 카드 | ComparisonView |
| ConsoleLog | 터미널 스타일 로그 | SettingsView |
| ConfigBar | 설정 바 (슬라이더) | SettingsView |

### 4.4 디자인 토큰

#### 컬러 팔레트 (다크 테마)
```css
:root {
  --background: #0a0d12;      /* 배경 */
  --surface: #12161d;         /* 카드/표면 */
  --border: #1e2430;          /* 테두리 */
  --primary: #6366f1;         /* 인디고 (주 색상) */
  --google: #4285f4;          /* 구글 블루 */
  --naver: #03c75a;           /* 네이버 그린 */
  --text-primary: #ffffff;    /* 흰색 텍스트 */
  --text-secondary: #64748b;  /* 회색 텍스트 */
  --success: #10b981;         /* 성공 그린 */
  --error: #ef4444;           /* 에러 레드 */
}
```

#### 타이포그래피
```css
/* 대제목 */
.heading-xl { font-size: 30px; font-weight: 900; }

/* 섹션 제목 */
.heading-lg { font-size: 20px; font-weight: 900; }

/* 테이블 헤더 */
.table-header { font-size: 10px; font-weight: 900; text-transform: uppercase; }

/* 본문 */
.body { font-size: 14px; font-weight: 500; }

/* 라벨/태그 */
.label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; }

/* 모노스페이스 (숫자, 로그) */
.mono { font-family: monospace; }
```

#### 간격/라운딩
```css
/* 라운딩 */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;

/* 간격 */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
```

### 4.5 반응형 브레이크포인트
| 화면 | 너비 | 레이아웃 변경 |
|------|------|--------------|
| Mobile | < 768px | 사이드바 숨김, 1열 그리드 |
| Tablet | 768px ~ 1024px | 2열 그리드 |
| Desktop | 1024px ~ 1280px | 2열 그리드 |
| Wide | > 1280px | 4열 그리드 (ComparisonView) |

---

## 5. API 명세

### 5.1 내부 API 엔드포인트

#### POST /api/keywords/analyze
키워드 분석 시작 (구글 + 네이버 통합)
```typescript
// Request
{
  keyword: string;
  count: number;  // 소스당 수집 개수 (10-100)
}

// Response
{
  success: boolean;
  data: {
    keyword: string;
    google: {
      volume: number;
      related: { keyword: string; volume: number }[];
      autocomplete: { keyword: string; volume: number }[];
    };
    naver: {
      volume: { pc: number; mobile: number; total: number };
      related: { keyword: string; volume: number }[];
      autocomplete: { keyword: string; volume: number }[];
    };
  };
}
```

#### GET /api/google/volume
```typescript
// Request
{
  keywords: string[];
  location?: string;  // default: "KR"
  language?: string;  // default: "ko"
}

// Response
{
  success: boolean;
  data: {
    keyword: string;
    search_volume: number;
    competition: string;
    cpc: number;
  }[];
}
```

#### GET /api/google/autocomplete
```typescript
// Request
{
  keyword: string;
  language?: string;
}

// Response
{
  success: boolean;
  data: {
    keyword: string;
    suggestions: string[];
  };
}
```

#### GET /api/google/related
```typescript
// Request
{
  keyword: string;
  limit?: number;  // default: 30
}

// Response
{
  success: boolean;
  data: {
    keyword: string;
    related_keywords: {
      keyword: string;
      search_volume?: number;
    }[];
  };
}
```

#### GET /api/naver/volume
```typescript
// Request
{
  keywords: string[];  // 최대 5개씩
}

// Response
{
  success: boolean;
  data: {
    keyword: string;
    monthlyPcQcCnt: number;
    monthlyMobileQcCnt: number;
    totalQcCnt: number;
    compIdx: string;
  }[];
}
```

#### GET /api/naver/autocomplete
```typescript
// Request
{
  keyword: string;
}

// Response
{
  success: boolean;
  data: {
    keyword: string;
    suggestions: string[];
  };
}
```

#### GET /api/naver/related
```typescript
// Request
{
  keyword: string;
  limit?: number;
}

// Response
{
  success: boolean;
  data: {
    keyword: string;
    related_keywords: string[];
  };
}
```

#### POST /api/export/csv
```typescript
// Request
{
  data: any[];
  filename?: string;
  columns?: string[];
}

// Response
Blob (CSV file download)
```

---

## 6. 외부 API 연동 상세

### 6.1 DataForSEO API

#### 인증
```
Base URL: https://api.dataforseo.com/v3
인증: Basic Auth
Header: Authorization: Basic {base64(login:password)}
```

#### 사용 엔드포인트
| 엔드포인트 | 용도 |
|-----------|------|
| POST /keywords_data/google_ads/search_volume/live | 검색량 조회 |
| POST /serp/google/autocomplete/live | 자동완성 |
| POST /keywords_data/google_ads/keywords_for_keywords/live | 연관 키워드 |

### 6.2 네이버 검색광고 API

#### 인증
```
Base URL: https://api.naver.com
Headers:
  X-API-KEY: {API_KEY}
  X-Customer: {CUSTOMER_ID}
  X-Timestamp: {timestamp} (밀리초)
  X-Signature: {HMAC-SHA256 signature}
```

#### 시그니처 생성
```typescript
const timestamp = Date.now().toString();
const method = 'GET';
const path = '/keywordstool';

const signature = crypto
  .createHmac('sha256', secretKey)
  .update(`${timestamp}.${method}.${path}`)
  .digest('base64');
```

#### 사용 엔드포인트
| 엔드포인트 | 용도 |
|-----------|------|
| GET /keywordstool | 키워드 검색량 및 연관키워드 |

---

## 7. 데이터 모델

### 7.1 Types (types.ts 기준)

```typescript
// View 상태
export enum View {
  DASHBOARD = 'DASHBOARD',
  COMPARISON = 'COMPARISON',
  SETTINGS = 'SETTINGS'
}

// 키워드 데이터
export interface KeywordData {
  keyword: string;
  volume: string;
  trend?: string;
}

// 분석 설정
export interface AnalysisConfig {
  keywordsPerSource: number;  // 10-100
}

// 콘솔 로그
export interface ConsoleLog {
  timestamp: string;
  tag: string;
  message: string;
  type: 'system' | 'info' | 'success' | 'error';
}

// 대시보드 행
export interface DashboardRow {
  keyword: string;
  google: string;    // 포맷된 검색량
  naver: string;     // 포맷된 검색량
}

// 비교 분석 섹션
export interface ComparisonSection {
  title: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  source: 'google' | 'naver';
  data: {
    keyword: string;
    vol: string;
  }[];
}

// API 응답
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
  };
}
```

---

## 8. 상태 관리

### 8.1 전역 상태 (App.tsx)
```typescript
const [activeView, setActiveView] = useState<View>(View.DASHBOARD);
const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
const [keywordsPerSource, setKeywordsPerSource] = useState(30);
```

### 8.2 React Query 키
```typescript
const queryKeys = {
  googleVolume: (keywords: string[]) => ['google', 'volume', keywords],
  googleAutocomplete: (keyword: string) => ['google', 'autocomplete', keyword],
  googleRelated: (keyword: string) => ['google', 'related', keyword],
  naverVolume: (keywords: string[]) => ['naver', 'volume', keywords],
  naverAutocomplete: (keyword: string) => ['naver', 'autocomplete', keyword],
  naverRelated: (keyword: string) => ['naver', 'related', keyword],
};
```

---

## 9. 보안 요구사항

### 9.1 API 키 관리
- [ ] 모든 API 키는 서버 사이드에서만 사용
- [ ] 환경 변수로 관리 (.env.local)
- [ ] 클라이언트에 절대 노출 금지

### 9.2 환경 변수
```env
# DataForSEO
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=

# Naver Ads API
NAVER_API_KEY=
NAVER_SECRET_KEY=
NAVER_CUSTOMER_ID=
```

### 9.3 보안 체크리스트
- [ ] API Route에서만 외부 API 호출
- [ ] 입력값 검증 (Zod)
- [ ] Rate Limiting 구현
- [ ] CORS 설정

---

## 10. 성능 요구사항

| 항목 | 목표 |
|------|------|
| 첫 페이지 로딩 | < 2초 |
| API 응답 시간 | < 5초 |
| 4분할 렌더링 | < 1초 |
| 동시 키워드 분석 | 소스당 최대 100개 |
| CSV 내보내기 | 10,000행까지 지원 |

---

## 11. 에러 처리

### 11.1 에러 코드
| 코드 | 설명 |
|------|------|
| 400 | 잘못된 요청 (파라미터 오류) |
| 401 | 인증 실패 (API 키 오류) |
| 429 | Rate Limit 초과 |
| 500 | 서버 내부 오류 |
| 502 | 외부 API 오류 |

### 11.2 콘솔 로그 에러 표시
```typescript
// SettingsView 콘솔에 에러 출력
addLog('[ERROR]', 'DataForSEO API rate limit exceeded', 'error');
```

---

## 12. 향후 확장 고려사항

- [ ] 사용자 인증 시스템
- [ ] 검색 기록 저장 (DB 연동)
- [ ] 키워드 모니터링 (스케줄러)
- [ ] 경쟁사 분석 기능
- [ ] 다국어 지원
- [ ] 검색량 트렌드 차트
