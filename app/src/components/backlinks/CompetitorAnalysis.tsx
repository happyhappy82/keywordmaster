'use client';

import React from 'react';
import { Loader2, AlertCircle, Users, ExternalLink } from 'lucide-react';
import { useBacklinkCompetitors } from '@/lib/hooks/useBacklinkAnalysis';
import { RankBadge } from './DomainOverview';
import InfoTooltip from './InfoTooltip';

interface CompetitorAnalysisProps {
  target: string | null;
}

export default function CompetitorAnalysis({ target }: CompetitorAnalysisProps) {
  const { data, isLoading, error } = useBacklinkCompetitors(target);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
        <span className="ml-3 text-[var(--text-secondary)]">경쟁사 분석 중...</span>
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

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-20 text-[var(--text-secondary)]">
        경쟁사 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users size={18} className="text-[var(--primary)]" />
          백링크 경쟁사 ({data.length}개)
          <InfoTooltip text="백링크 경쟁사란, 이 도메인과 비슷한 사이트들로부터 백링크를 받고 있는 다른 도메인들입니다. 같은 소스에서 링크를 받는 도메인은 검색엔진 관점에서 같은 주제/분야의 경쟁자로 간주됩니다. 경쟁사의 백링크 소스를 분석하면 새로운 링크 빌딩 기회를 발견할 수 있습니다." />
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          {target}와 유사한 백링크 프로필을 가진 도메인들입니다. 이 도메인들의 백링크 소스를 참고하여 새로운 링크 빌딩 전략을 수립할 수 있습니다.
        </p>
      </div>

      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <th className="text-left px-4 py-3 font-medium">#</th>
                <th className="text-left px-4 py-3 font-medium"><div className="flex items-center">도메인<InfoTooltip text="이 도메인과 백링크 프로필이 유사한 경쟁 도메인입니다. 유사도가 높은 순서로 정렬됩니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium"><div className="flex items-center justify-center">Rank<InfoTooltip text="경쟁 도메인의 권위 점수입니다 (0~1,000). 내 도메인보다 Rank가 높은 경쟁사의 백링크 전략을 벤치마킹하면 도움이 됩니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium"><div className="flex items-center justify-center">백링크<InfoTooltip text="경쟁 도메인이 보유한 총 백링크 수입니다. 내 사이트와 비교하여 백링크 격차를 파악할 수 있습니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium"><div className="flex items-center justify-center">참조 도메인<InfoTooltip text="경쟁 도메인에 백링크를 보내는 고유 도메인 수입니다. 참조 도메인 수가 많을수록 다양한 곳에서 인정받는 사이트입니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium"><div className="flex items-center justify-center">교차점<InfoTooltip text="이 도메인과 경쟁 도메인이 공통으로 백링크를 받고 있는 참조 도메인 수입니다. 교차점이 높을수록 동일한 소스에서 인용되는 직접적인 경쟁자입니다. 내가 아직 링크를 받지 못한 경쟁사의 참조 도메인이 새로운 링크 빌딩 타겟이 됩니다." /></div></th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={i} className="border-b border-[var(--border)]/50 hover:bg-[var(--border)]/30 transition-colors">
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ExternalLink size={12} className="text-[var(--text-secondary)] shrink-0" />
                      <span className="font-medium">{item.target}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <RankBadge rank={item.rank || 0} />
                  </td>
                  <td className="px-4 py-3 text-center">{item.backlinks?.toLocaleString() || 0}</td>
                  <td className="px-4 py-3 text-center">{item.referring_domains?.toLocaleString() || 0}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 bg-[var(--primary)]/20 text-[var(--primary)] rounded text-xs font-medium">
                      {item.intersections?.toLocaleString() || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
