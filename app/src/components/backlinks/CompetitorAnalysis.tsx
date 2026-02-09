'use client';

import React from 'react';
import { Loader2, AlertCircle, Users, ExternalLink } from 'lucide-react';
import { useBacklinkCompetitors } from '@/lib/hooks/useBacklinkAnalysis';
import { RankBadge } from './DomainOverview';

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
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          {target}와 유사한 백링크 프로필을 가진 도메인들
        </p>
      </div>

      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <th className="text-left px-4 py-3 font-medium">#</th>
                <th className="text-left px-4 py-3 font-medium">도메인</th>
                <th className="text-center px-4 py-3 font-medium">Rank</th>
                <th className="text-center px-4 py-3 font-medium">백링크</th>
                <th className="text-center px-4 py-3 font-medium">참조 도메인</th>
                <th className="text-center px-4 py-3 font-medium">교차점</th>
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
