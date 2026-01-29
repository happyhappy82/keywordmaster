// 키워드 데이터
export interface KeywordData {
  keyword: string;
  volume: string;
  trend?: string;
}

// 대시보드 행
export interface DashboardRow {
  keyword: string;
  google: string;
  naver: string;
}

// 비교 분석 섹션 데이터
export interface ComparisonItem {
  keyword: string;
  vol: string;
}

// 비교 분석 섹션
export interface ComparisonSection {
  title: string;
  color: string;
  bgColor: string;
  source: 'google' | 'naver';
  type: 'related' | 'autocomplete';
  data: ComparisonItem[];
}

// API 응답
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
    details?: unknown;
  };
}

// 구글 검색량 응답
export interface GoogleVolumeData {
  keyword: string;
  search_volume: number;
  competition: string;
  cpc: number;
}

// 구글 자동완성 응답
export interface GoogleAutocompleteData {
  keyword: string;
  suggestions: string[];
}

// 구글 연관검색어 응답
export interface GoogleRelatedData {
  keyword: string;
  related_keywords: {
    keyword: string;
    search_volume?: number;
  }[];
}

// 네이버 검색량 응답
export interface NaverVolumeData {
  keyword: string;
  monthlyPcQcCnt: number;
  monthlyMobileQcCnt: number;
  totalQcCnt: number;
  compIdx: string;
}

// 네이버 자동완성 응답
export interface NaverAutocompleteData {
  keyword: string;
  suggestions: string[];
}

// 네이버 연관검색어 응답
export interface NaverRelatedData {
  keyword: string;
  related_keywords: string[];
}

// 통합 분석 결과
export interface AnalysisResult {
  keyword: string;
  google: {
    volume: number;
    related: ComparisonItem[];
    autocomplete: ComparisonItem[];
  };
  naver: {
    volume: {
      pc: number;
      mobile: number;
      total: number;
    };
    related: ComparisonItem[];
    autocomplete: ComparisonItem[];
  };
}

