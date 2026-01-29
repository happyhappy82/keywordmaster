'use client';

import { useQuery, useMutation } from '@tanstack/react-query';

interface KeywordItem {
  keyword: string;
  volume: number;
  source: 'google' | 'naver';
  type: 'related' | 'autocomplete';
}

interface AnalysisResult {
  success: boolean;
  keyword: string;
  data: {
    googleRelated: KeywordItem[];
    googleAutocomplete: KeywordItem[];
    naverRelated: KeywordItem[];
    naverAutocomplete: KeywordItem[];
  };
  allData: KeywordItem[];
  summary: {
    googleRelated: number;
    googleAutocomplete: number;
    naverRelated: number;
    naverAutocomplete: number;
    total: number;
  };
}

// 키워드 분석 API 호출
async function analyzeKeyword(keyword: string, limit: number): Promise<AnalysisResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword, limit }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze keyword');
  }

  return response.json();
}

// CSV 내보내기
async function exportToCsv(data: KeywordItem[], filename: string): Promise<Blob> {
  const response = await fetch('/api/export/csv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, filename }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to export CSV');
  }

  return response.blob();
}

// 키워드 분석 훅
export function useKeywordAnalysis(keyword: string | null, limit: number = 30) {
  return useQuery({
    queryKey: ['keywordAnalysis', keyword, limit],
    queryFn: () => analyzeKeyword(keyword!, limit),
    enabled: !!keyword,
    staleTime: 5 * 60 * 1000, // 5분간 캐시
    retry: 1,
  });
}

// CSV 내보내기 훅
export function useExportCsv() {
  return useMutation({
    mutationFn: ({ data, filename }: { data: KeywordItem[]; filename: string }) =>
      exportToCsv(data, filename),
    onSuccess: (blob, { filename }) => {
      // 파일 다운로드 트리거
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onError: (error) => {
      console.error('CSV export error:', error);
      alert('CSV 내보내기에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    },
  });
}

// 확장 자동완성 API 호출 (ㄱ~ㅎ)
interface ExpandedItem {
  keyword: string;
  volume: number;
  source: string;
}

async function fetchExpandedAutocomplete(
  keyword: string,
  platform: 'google' | 'naver'
): Promise<ExpandedItem[]> {
  const response = await fetch(`/api/${platform}/autocomplete-expand`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch expanded autocomplete');
  }

  const result = await response.json();
  return result.data || [];
}

// 확장 자동완성 훅
export function useExpandedAutocomplete() {
  return useMutation({
    mutationFn: ({ keyword, platform }: { keyword: string; platform: 'google' | 'naver' }) =>
      fetchExpandedAutocomplete(keyword, platform),
  });
}

// 검색량 일괄 조회 API 호출
interface VolumeResult {
  volumeMap: Record<string, number>;
  stats: {
    googleRequested: number;
    naverRequested: number;
    totalMapped: number;
  };
}

async function fetchBulkVolumes(
  keywords: { keyword: string; source: 'google' | 'naver' }[]
): Promise<VolumeResult> {
  const response = await fetch('/api/volume/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch volumes');
  }

  return response.json();
}

// 검색량 일괄 조회 훅
export function useBulkVolumeQuery() {
  return useMutation({
    mutationFn: (keywords: { keyword: string; source: 'google' | 'naver' }[]) =>
      fetchBulkVolumes(keywords),
  });
}

// Gemini 수식어 생성 API 호출
async function fetchModifiers(keyword: string): Promise<string[]> {
  const response = await fetch('/api/gemini/modifiers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate modifiers');
  }

  const result = await response.json();
  return result.modifiers || [];
}

// 수식어 생성 훅
export function useGenerateModifiers() {
  return useMutation({
    mutationFn: (keyword: string) => fetchModifiers(keyword),
  });
}

// 수식어 + 키워드로 자동완성 조회
interface PrefixAutocompleteResult {
  modifier: string;
  suggestions: string[];
}

async function fetchPrefixAutocomplete(
  keyword: string,
  modifiers: string[],
  platform: 'google' | 'naver'
): Promise<PrefixAutocompleteResult[]> {
  const results: PrefixAutocompleteResult[] = [];

  // 각 수식어에 대해 자동완성 조회 (병렬 처리)
  const promises = modifiers.map(async (modifier) => {
    const query = `${modifier} ${keyword}`;
    try {
      const response = await fetch(`/api/${platform}/autocomplete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: query }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          modifier,
          suggestions: data.data?.map((item: { keyword: string }) => item.keyword) || [],
        };
      }
    } catch (err) {
      console.error(`Autocomplete error for "${modifier}":`, err);
    }
    return { modifier, suggestions: [] };
  });

  const resolved = await Promise.all(promises);
  return resolved.filter(r => r.suggestions.length > 0);
}

// 수식어 자동완성 훅
export function usePrefixAutocomplete() {
  return useMutation({
    mutationFn: ({
      keyword,
      modifiers,
      platform,
    }: {
      keyword: string;
      modifiers: string[];
      platform: 'google' | 'naver';
    }) => fetchPrefixAutocomplete(keyword, modifiers, platform),
  });
}

export type { KeywordItem, AnalysisResult, ExpandedItem, VolumeResult, PrefixAutocompleteResult };
