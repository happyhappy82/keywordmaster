'use client';

import React, { useState } from 'react';
import { ExternalLink, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBacklinkList } from '@/lib/hooks/useBacklinkAnalysis';
import { RankBadge } from './DomainOverview';
import InfoTooltip from './InfoTooltip';

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
                <th className="text-left px-4 py-3 font-medium"><div className="flex items-center">출처 페이지<InfoTooltip text="이 도메인으로의 백링크가 있는 외부 웹페이지입니다. 상단: 도메인명(클릭 시 해당 페이지로 이동), 하단: 페이지 제목. 권위 있는 사이트(뉴스, 정부기관, 교육기관 등)에서 오는 백링크일수록 SEO 가치가 높습니다." /></div></th>
                <th className="text-left px-4 py-3 font-medium"><div className="flex items-center">앵커<InfoTooltip text="백링크에 사용된 클릭 가능한 텍스트입니다. 예: '<a href=...>이 텍스트</a>'에서 '이 텍스트'가 앵커입니다. 타겟 키워드와 관련된 앵커 텍스트는 SEO에 유리합니다. '(no anchor)'는 이미지 링크 등 텍스트가 없는 경우입니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium"><div className="flex items-center justify-center">Rank<InfoTooltip text="출처 도메인의 권위 점수입니다 (0~1,000). DataForSEO 기준으로 산정됩니다. 높은 Rank의 도메인에서 오는 백링크일수록 SEO 효과가 큽니다. 색상 기준 — 빨강(0~30): 낮음, 노랑(31~50): 보통, 초록(51~70): 양호, 보라(71+): 우수." /></div></th>
                <th className="text-center px-4 py-3 font-medium"><div className="flex items-center justify-center">타입<InfoTooltip text="백링크의 HTML 유형입니다. anchor: 텍스트에 걸린 일반 하이퍼링크(가장 흔함). image: 이미지에 걸린 링크(alt 텍스트가 앵커 역할). canonical: 정규화 태그의 링크. redirect: 리다이렉트를 통한 링크." /></div></th>
                <th className="text-center px-4 py-3 font-medium"><div className="flex items-center justify-center">Follow<InfoTooltip text="dofollow: 검색엔진이 이 링크를 따라가며 SEO 가치(링크 주스)를 전달합니다. 검색 순위 향상에 직접 기여합니다. nofollow: 검색엔진에 '따라가지 말 것'을 요청하는 속성입니다. 직접적 SEO 효과는 제한적이지만 트래픽 유입에는 도움됩니다." /></div></th>
                <th className="text-left px-4 py-3 font-medium"><div className="flex items-center">첫 발견<InfoTooltip text="DataForSEO 크롤러가 이 백링크를 처음 발견한 날짜입니다. 오래된 백링크일수록 안정적이고 신뢰할 수 있는 링크로 평가됩니다. 최근에 갑자기 대량 생성된 백링크는 스팸 의심을 받을 수 있습니다." /></div></th>
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
