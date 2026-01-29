# 키워드 마스터 - 개발 계획서 (Plan)

> **디자인 참조**: `keywordinsight-pro/` 폴더의 레이아웃을 기준으로 개발

---

## 진행 상황 요약

| 단계 | 상태 | 완료 항목 |
|------|------|----------|
| Phase 1: 초기 설정 | 완료 | 8/8 |
| Phase 2: 레이아웃 개발 | 완료 | 15/15 |
| Phase 3: API 연동 | 완료 | 14/14 |
| Phase 4: 뷰 개발 | 완료 | 18/18 |
| Phase 5: 기능 통합 | 완료 | 10/10 |
| Phase 6: 최적화/배포 | 대기 | 0/8 |

**총 진행률: 65/73**

---

## Phase 1: 프로젝트 초기 설정

### 1.1 프로젝트 생성
- [o] Next.js 14 프로젝트 생성 (App Router)
- [o] TypeScript 설정 확인
- [o] ESLint + Prettier 설정

### 1.2 의존성 설치
- [o] Tailwind CSS 설정 (다크 테마)
- [o] Lucide React 아이콘 설치
- [o] 필수 패키지 설치
  - axios
  - zod
  - @tanstack/react-query

### 1.3 프로젝트 구조 설정
- [o] 폴더 구조 생성
  ```
  src/
  ├── app/
  │   ├── api/
  │   │   ├── google/
  │   │   │   ├── volume/route.ts
  │   │   │   ├── autocomplete/route.ts
  │   │   │   └── related/route.ts
  │   │   ├── naver/
  │   │   │   ├── volume/route.ts
  │   │   │   ├── autocomplete/route.ts
  │   │   │   └── related/route.ts
  │   │   └── export/
  │   │       └── csv/route.ts
  │   ├── page.tsx
  │   ├── layout.tsx
  │   └── globals.css
  ├── components/
  │   ├── layout/
  │   │   ├── Sidebar.tsx
  │   │   └── Header.tsx
  │   ├── views/
  │   │   ├── DashboardView.tsx
  │   │   ├── ComparisonView.tsx
  │   │   └── SettingsView.tsx
  │   └── ui/
  │       ├── KeywordTable.tsx
  │       ├── ComparisonCard.tsx
  │       └── ConsoleLog.tsx
  ├── lib/
  │   ├── api/
  │   │   ├── dataforseo.ts
  │   │   └── naver.ts
  │   └── utils/
  │       └── format.ts
  ├── hooks/
  │   ├── useGoogleApi.ts
  │   └── useNaverApi.ts
  └── types/
      └── index.ts
  ```

### 1.4 환경 변수 설정
- [o] .env.local 파일 생성
- [o] .env.example 파일 생성 (템플릿)

---

## Phase 2: 레이아웃 개발 (디자인 참조)

### 2.1 전역 스타일 설정
- [o] globals.css 다크 테마 변수 설정
  ```css
  --background: #0a0d12;
  --surface: #12161d;
  --border: #1e2430;
  --primary: #6366f1;
  --google: #4285f4;
  --naver: #03c75a;
  ```
- [o] Tailwind config 커스텀 컬러 추가
- [o] 커스텀 스크롤바 스타일 (.custom-scrollbar)

### 2.2 타입 정의 (types/index.ts)
- [o] View enum 정의 (DASHBOARD, COMPARISON, SETTINGS)
- [o] KeywordData interface
- [o] ConsoleLog interface
- [o] DashboardRow interface
- [o] ComparisonSection interface

### 2.3 메인 레이아웃 (App.tsx / page.tsx)
- [o] 전체 레이아웃 구조 (flex h-screen)
- [o] 상태 관리 설정
  - [o] activeView 상태
  - [o] selectedKeyword 상태
  - [o] keywordsPerSource 상태
- [o] View 라우팅 로직

### 2.4 Sidebar 컴포넌트
- [o] 로고 영역 (KeywordPro / Analysis Suite)
- [o] 네비게이션 버튼
  - [o] 대시보드 (LayoutDashboard 아이콘)
  - [o] 로그 및 설정 (Terminal 아이콘)
- [o] 활성 상태 스타일링
- [o] 프로필 영역 (하단)
  - [o] 프로필 이미지
  - [o] 사용자명 / 플랜
  - [o] 로그아웃 아이콘
- [o] 반응형: md 이하에서 숨김

### 2.5 Header 컴포넌트
- [o] 좌측: 버전 정보 또는 뒤로가기 버튼
- [o] 우측: 알림/도움말 아이콘
- [o] 우측: 결과 내보내기 버튼 (Download 아이콘)
- [o] backdrop-blur 효과

---

## Phase 3: API 연동 개발

### 3.1 DataForSEO API 클라이언트 (lib/api/dataforseo.ts)
- [o] Basic Auth 인증 설정 (Base64 encoding)
- [o] API 요청 래퍼 함수 생성
- [o] 에러 핸들링 유틸리티

### 3.2 구글 API Routes
- [o] /api/google/volume/route.ts
  - [o] Zod 스키마 검증
  - [o] DataForSEO search_volume API 호출
  - [o] 응답 파싱 및 포맷팅
- [o] /api/google/autocomplete/route.ts
  - [o] DataForSEO autocomplete API 호출
  - [o] suggestions 배열 반환
- [o] /api/google/related/route.ts
  - [o] DataForSEO keywords_for_keywords API 호출
  - [o] limit 파라미터 처리

### 3.3 네이버 API 클라이언트 (lib/api/naver.ts)
- [o] HMAC-SHA256 시그니처 생성 함수
- [o] 타임스탬프 생성
- [o] API 요청 헤더 설정
- [o] API 요청 래퍼 함수 생성

### 3.4 네이버 API Routes
- [o] /api/naver/volume/route.ts
  - [o] keywordstool API 호출
  - [o] PC/모바일/총 검색량 파싱
- [o] /api/naver/autocomplete/route.ts
  - [o] 자동완성 데이터 수집
- [o] /api/naver/related/route.ts
  - [o] 연관검색어 조회

### 3.5 CSV 내보내기 API
- [o] /api/export/csv/route.ts
  - [o] 데이터 → CSV 변환
  - [o] 파일 다운로드 응답

---

## Phase 4: 뷰 개발 (디자인 참조)

### 4.1 DashboardView 컴포넌트
- [o] 헤더 영역
  - [o] 제목: "분석 키워드 리스트" (text-3xl font-black)
  - [o] 설명 텍스트
  - [o] 검색 입력창 (Search 아이콘)
- [o] 키워드 테이블 (KeywordTable)
  - [o] 테이블 컨테이너 (bg-surface rounded-3xl)
  - [o] 테이블 헤더 (uppercase tracking-widest)
    - [o] 키워드
    - [o] 구글 검색량
    - [o] 네이버 검색량
    - [o] 액션
  - [o] 테이블 행 렌더링
    - [o] hover 효과 (hover:bg-white/[0.03])
    - [o] 키워드 (font-bold text-lg)
    - [o] 검색량 (font-mono)
    - [o] 상세보기 버튼 (ChevronRight 아이콘)
- [o] 목록 내 검색 필터 기능
- [o] 상세보기 클릭 → ComparisonView 이동

### 4.2 ComparisonView 컴포넌트 (핵심)
- [o] 헤더 영역
  - [o] 뒤로가기 버튼 (ChevronLeft)
  - [o] 키워드 제목 (text-3xl font-black)
  - [o] 수집 통계 (소스당 N개 / 총 N개)
  - [o] Zap 아이콘 (animate-pulse)
- [o] 4분할 그리드 레이아웃
  - [o] grid-cols-1 md:grid-cols-2 xl:grid-cols-4
- [o] ComparisonCard 컴포넌트 (4개)
  - [o] 구글 연관 검색어 (Search 아이콘, text-google)
  - [o] 구글 자동완성 (Keyboard 아이콘, text-google)
  - [o] 네이버 연관 검색어 (Search 아이콘, text-naver)
  - [o] 네이버 자동완성 (Keyboard 아이콘, text-naver)
- [o] ComparisonCard 내부 구조
  - [o] 헤더 (아이콘 + 제목 + 결과 수)
  - [o] 스크롤 가능한 테이블 (h-[850px])
  - [o] 테이블 헤더 (sticky top-0)
  - [o] 키워드 행
    - [o] 키워드 텍스트
    - [o] 검색 바로가기 버튼 (GOOGLE/NAVER)
    - [o] 검색량 (font-mono)
- [o] 검색 바로가기 링크 동작
  - [o] 구글: google.com/search?q={keyword}
  - [o] 네이버: search.naver.com/search.naver?query={keyword}

### 4.3 SettingsView 컴포넌트
- [o] ConfigBar (설정 바)
  - [o] 수량 설정 라벨 (Sliders 아이콘)
  - [o] Range 슬라이더 (10-100)
  - [o] 현재 값 표시 (font-mono text-primary)
  - [o] 설정 적용 버튼 (Save 아이콘)
  - [o] 상태 표시 (CPU, Secure)
- [o] ConsoleLog (터미널 영역)
  - [o] 헤더 (Terminal 아이콘 + 제목)
  - [o] 로그 삭제 버튼 (Trash2 아이콘)
  - [o] 로그 영역 (font-mono, 스크롤 가능)
  - [o] 로그 항목 렌더링
    - [o] timestamp (text-slate-700)
    - [o] tag (타입별 색상)
    - [o] message
  - [o] 커서 애니메이션 (animate-pulse)
  - [o] 하단 상태 바 (Network, Uptime, Version)
- [o] 로그 타입별 색상
  - [o] system: text-blue-500
  - [o] info: text-primary
  - [o] success: text-emerald-500
  - [o] error: text-red-500
- [o] 로그 자동 스크롤 (useEffect + scrollTop)
- [o] addLog 함수 구현

---

## Phase 5: 기능 통합

### 5.1 React Query 설정
- [o] QueryClientProvider 설정
- [o] 커스텀 훅 생성
  - [o] useKeywordAnalysis (통합 훅)
  - [o] useExportCsv

### 5.2 데이터 흐름 구현
- [o] DashboardView: 키워드 목록 API 연동
- [o] ComparisonView: 4개 API 동시 호출
  - [o] Promise.allSettled 사용
  - [o] 로딩 상태 처리
  - [o] 에러 상태 처리
- [o] SettingsView: 설정 저장 및 로그 연동

### 5.3 CSV 내보내기 기능
- [o] 내보내기 버튼 클릭 핸들러
- [o] 현재 뷰 데이터 수집
- [o] CSV API 호출 및 다운로드

### 5.4 콘솔 로그 연동
- [o] API 호출 시 로그 추가
- [o] 에러 발생 시 에러 로그 추가
- [o] 설정 변경 시 로그 추가

---

## Phase 6: 최적화 및 배포

### 6.1 성능 최적화
- [ ] 컴포넌트 메모이제이션 (React.memo)
- [ ] API 요청 디바운싱
- [ ] 테이블 가상화 (대량 데이터 시)

### 6.2 반응형 점검
- [ ] 모바일 레이아웃 테스트 (< 768px)
- [ ] 태블릿 레이아웃 테스트
- [ ] 와이드 스크린 테스트 (4분할 그리드)

### 6.3 코드 품질
- [ ] TypeScript 타입 점검
- [ ] ESLint 경고 해결
- [ ] 불필요한 코드 제거

### 6.4 배포
- [ ] Vercel 프로젝트 생성
- [ ] 환경 변수 설정 (Vercel Dashboard)
- [ ] 배포 및 테스트

### 6.5 최종 점검
- [ ] 전체 기능 테스트
- [ ] API 에러 케이스 테스트
- [ ] 브라우저 호환성 테스트

---

## 체크리스트 사용법

| 표시 | 의미 |
|------|------|
| `[ ]` | 미완료 |
| `[o]` | 완료 |
| `[~]` | 진행중 |
| `[x]` | 스킵/제외 |

---

## 디자인 참조 파일

| 파일 | 참조 내용 |
|------|----------|
| `keywordinsight-pro/App.tsx` | 전체 레이아웃, Sidebar, Header, View 라우팅 |
| `keywordinsight-pro/components/DashboardView.tsx` | 키워드 테이블 디자인 |
| `keywordinsight-pro/components/ComparisonView.tsx` | 4분할 비교 그리드 디자인 |
| `keywordinsight-pro/components/SettingsView.tsx` | 콘솔 로그, 설정 바 디자인 |
| `keywordinsight-pro/components/ResultsView.tsx` | 결과 테이블, 페이지네이션 (참고용) |
| `keywordinsight-pro/types.ts` | 타입 정의 |

---

## 변경 이력

| 날짜 | 내용 | 작성자 |
|------|------|--------|
| 2025-01-29 | 최초 작성 | - |
| 2025-01-29 | keywordinsight-pro 디자인 반영 | - |
| 2025-01-29 | Phase 1-5 개발 완료 | Claude |

---

## 참고 자료

- [DataForSEO API 문서](https://docs.dataforseo.com/)
- [네이버 검색광고 API 문서](https://developers.naver.com/docs/searchad/overview/)
- [Next.js 14 공식 문서](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/icons/)
- [React Query](https://tanstack.com/query/latest)
