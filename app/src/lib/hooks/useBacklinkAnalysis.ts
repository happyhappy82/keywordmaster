'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import type {
  BacklinkSummary,
  BacklinkItem,
  ReferringDomain,
  AnchorItem,
  BacklinkHistoryItem,
  NewLostItem,
  CompetitorItem,
  BulkRankItem,
} from '@/types/backlinks';

// API fetch 헬퍼
async function postApi<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

// 백링크 요약 훅
export function useBacklinkSummary(target: string | null) {
  return useQuery({
    queryKey: ['backlinkSummary', target],
    queryFn: async () => {
      const res = await postApi<{ success: boolean; data: BacklinkSummary }>(
        '/api/backlinks/summary',
        { target: target! }
      );
      return res.data;
    },
    enabled: !!target,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// 백링크 목록 훅
export function useBacklinkList(
  target: string | null,
  limit: number = 50,
  offset: number = 0,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['backlinkList', target, limit, offset],
    queryFn: async () => {
      const res = await postApi<{ success: boolean; items: BacklinkItem[]; total_count: number }>(
        '/api/backlinks/list',
        { target: target!, limit, offset }
      );
      return { items: res.items, total_count: res.total_count };
    },
    enabled: !!target && enabled,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// 참조 도메인 훅
export function useReferringDomains(
  target: string | null,
  limit: number = 50,
  offset: number = 0,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['referringDomains', target, limit, offset],
    queryFn: async () => {
      const res = await postApi<{ success: boolean; items: ReferringDomain[]; total_count: number }>(
        '/api/backlinks/referring-domains',
        { target: target!, limit, offset }
      );
      return { items: res.items, total_count: res.total_count };
    },
    enabled: !!target && enabled,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// 앵커 텍스트 훅
export function useAnchorTexts(
  target: string | null,
  limit: number = 50,
  offset: number = 0,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['anchorTexts', target, limit, offset],
    queryFn: async () => {
      const res = await postApi<{ success: boolean; items: AnchorItem[]; total_count: number }>(
        '/api/backlinks/anchors',
        { target: target!, limit, offset }
      );
      return { items: res.items, total_count: res.total_count };
    },
    enabled: !!target && enabled,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// 백링크 히스토리 훅
export function useBacklinkHistory(target: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['backlinkHistory', target],
    queryFn: async () => {
      const res = await postApi<{ success: boolean; data: BacklinkHistoryItem[] }>(
        '/api/backlinks/history',
        { target: target! }
      );
      return res.data;
    },
    enabled: !!target && enabled,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// 신규/손실 백링크 훅
export function useNewLostBacklinks(target: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['newLostBacklinks', target],
    queryFn: async () => {
      const res = await postApi<{ success: boolean; data: NewLostItem[] }>(
        '/api/backlinks/new-lost',
        { target: target! }
      );
      return res.data;
    },
    enabled: !!target && enabled,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// 경쟁사 분석 훅
export function useBacklinkCompetitors(target: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['backlinkCompetitors', target],
    queryFn: async () => {
      const res = await postApi<{ success: boolean; data: CompetitorItem[] }>(
        '/api/backlinks/competitors',
        { target: target! }
      );
      return res.data;
    },
    enabled: !!target && enabled,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// 대량 분석 훅 (useMutation)
export function useBulkRanks() {
  return useMutation({
    mutationFn: async (targets: string[]) => {
      const res = await postApi<{ success: boolean; data: BulkRankItem[] }>(
        '/api/backlinks/bulk',
        { targets }
      );
      return res.data;
    },
  });
}
