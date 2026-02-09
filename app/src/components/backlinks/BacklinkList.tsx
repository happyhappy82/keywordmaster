'use client';

import React, { useState } from 'react';
import { ExternalLink, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBacklinkList } from '@/lib/hooks/useBacklinkAnalysis';
import { RankBadge } from './DomainOverview';

interface BacklinkListProps {
  target: string | null;
}

const PAGE_SIZE = 50;

export default function BacklinkList({ target }: BacklinkListProps) {
  const [page, setPage] = useState(0);
  const offset = page * PAGE_SIZE;

  const { data, isLoading, error } = useBacklinkList(target, PAGE_SIZE, offset);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
        <span className="ml-3 text-[var(--text-secondary)]">백링크 목록 로딩 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-red-400 gap-2">
        <AlertCircle size={20} />
        <span>{error.message}</span>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="text-center py-20 text-[var(--text-secondary)]">
        백링크 데이터가 없습니다.
      </div>
    );
  }

  const totalPages = Math.ceil(data.total_count / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* 상단 정보 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--text-secondary)]">
          총 {data.total_count.toLocaleString()}개 백링크
        </span>
        <span className="text-sm text-[var(--text-secondary)]">
          페이지 {page + 1} / {totalPages}
        </span>
      </div>

      {/* 테이블 */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <th className="text-left px-4 py-3 font-medium">출처 페이지</th>
                <th className="text-left px-4 py-3 font-medium">앵커</th>
                <th className="text-center px-4 py-3 font-medium">Rank</th>
                <th className="text-center px-4 py-3 font-medium">타입</th>
                <th className="text-center px-4 py-3 font-medium">Follow</th>
                <th className="text-left px-4 py-3 font-medium">첫 발견</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} className="border-b border-[var(--border)]/50 hover:bg-[var(--border)]/30 transition-colors">
                  <td className="px-4 py-3 max-w-xs">
                    <div className="flex items-center gap-2">
                      <a
                        href={item.url_from}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--primary)] hover:underline truncate flex items-center gap-1"
                      >
                        <ExternalLink size={12} className="shrink-0" />
                        <span className="truncate">{item.domain_from}</span>
                      </a>
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                      {item.page_from_title || item.url_from}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <span className="truncate block">{item.anchor || '(no anchor)'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <RankBadge rank={item.rank || item.domain_from_rank || 0} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded text-xs bg-[var(--border)] text-[var(--text-secondary)]">
                      {item.item_type || 'anchor'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      item.dofollow
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {item.dofollow ? 'dofollow' : 'nofollow'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] text-xs whitespace-nowrap">
                    {item.first_seen ? new Date(item.first_seen).toLocaleDateString('ko-KR') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] disabled:opacity-30 hover:bg-[var(--border)] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
            if (pageNum >= totalPages) return null;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  pageNum === page
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--border)]'
                }`}
              >
                {pageNum + 1}
              </button>
            );
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] disabled:opacity-30 hover:bg-[var(--border)] transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
