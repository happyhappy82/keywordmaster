'use client';

import React, { useState } from 'react';
import { Globe, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useReferringDomains } from '@/lib/hooks/useBacklinkAnalysis';
import { RankBadge, SpamBadge } from './DomainOverview';
import InfoTooltip from './InfoTooltip';

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
                <th className="text-left px-4 py-3 font-medium"><div className="flex items-center">도메인<InfoTooltip text="이 사이트에 백링크를 보내는 외부 도메인입니다. 하나의 도메인에서 여러 페이지를 통해 다수의 백링크를 보낼 수 있습니다. 참조 도메인 수가 많고 다양할수록 SEO에 유리합니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium"><div className="flex items-center justify-center">Rank<InfoTooltip text="해당 참조 도메인의 권위 점수입니다 (0~1,000). DataForSEO 기준. 높은 Rank의 도메인에서 오는 백링크가 SEO에 더 큰 영향을 미칩니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium"><div className="flex items-center justify-center">백링크<InfoTooltip text="해당 도메인에서 이 사이트로 보내는 백링크의 총 개수입니다. 하나의 도메인이 여러 페이지에서 링크를 걸 수 있습니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium"><div className="flex items-center justify-center">스팸 점수<InfoTooltip text="해당 도메인의 스팸 가능성을 나타내는 점수입니다 (0~100). Low(0~30): 안전한 도메인. Medium(31~60): 주의가 필요한 도메인. High(61~100): 스팸 위험이 높아 Google Search Console에서 disavow(거부) 신청을 고려해야 합니다." /></div></th>
                <th className="text-left px-4 py-3 font-medium"><div className="flex items-center">첫 발견<InfoTooltip text="이 도메인에서의 백링크가 처음 발견된 날짜입니다. 오래 전부터 링크를 보내온 도메인은 안정적인 관계로 평가됩니다." /></div></th>
                <th className="text-left px-4 py-3 font-medium"><div className="flex items-center">마지막 확인<InfoTooltip text="이 도메인의 백링크가 가장 최근에 확인(크롤링)된 날짜입니다. 오래 전이라면 해당 링크가 이미 삭제되었을 수 있습니다." /></div></th>
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
