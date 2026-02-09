'use client';

import React, { useState } from 'react';
import { Globe, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useReferringDomains } from '@/lib/hooks/useBacklinkAnalysis';
import { RankBadge, SpamBadge } from './DomainOverview';

interface ReferringDomainsProps {
  target: string | null;
}

const PAGE_SIZE = 50;

export default function ReferringDomains({ target }: ReferringDomainsProps) {
  const [page, setPage] = useState(0);
  const offset = page * PAGE_SIZE;

  const { data, isLoading, error } = useReferringDomains(target, PAGE_SIZE, offset);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
        <span className="ml-3 text-[var(--text-secondary)]">참조 도메인 로딩 중...</span>
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
        참조 도메인 데이터가 없습니다.
      </div>
    );
  }

  const totalPages = Math.ceil(data.total_count / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--text-secondary)]">
          총 {data.total_count.toLocaleString()}개 참조 도메인
        </span>
        <span className="text-sm text-[var(--text-secondary)]">
          페이지 {page + 1} / {totalPages}
        </span>
      </div>

      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <th className="text-left px-4 py-3 font-medium">도메인</th>
                <th className="text-center px-4 py-3 font-medium">Rank</th>
                <th className="text-center px-4 py-3 font-medium">백링크</th>
                <th className="text-center px-4 py-3 font-medium">스팸 점수</th>
                <th className="text-left px-4 py-3 font-medium">첫 발견</th>
                <th className="text-left px-4 py-3 font-medium">마지막 확인</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} className="border-b border-[var(--border)]/50 hover:bg-[var(--border)]/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-[var(--text-secondary)] shrink-0" />
                      <span className="font-medium">{item.domain}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <RankBadge rank={item.rank || 0} />
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    {item.backlinks?.toLocaleString() || 0}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <SpamBadge score={item.backlinks_spam_score || 0} />
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] text-xs whitespace-nowrap">
                    {item.first_seen ? new Date(item.first_seen).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] text-xs whitespace-nowrap">
                    {item.last_seen ? new Date(item.last_seen).toLocaleDateString('ko-KR') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
