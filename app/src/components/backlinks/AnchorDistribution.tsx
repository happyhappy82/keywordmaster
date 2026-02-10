'use client';

import React from 'react';
import { Loader2, AlertCircle, Anchor } from 'lucide-react';
import { useAnchorTexts } from '@/lib/hooks/useBacklinkAnalysis';

interface AnchorDistributionProps {
  target: string | null;
}

export default function AnchorDistribution({ target }: AnchorDistributionProps) {
  const { data, isLoading, error } = useAnchorTexts(target, 30, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
        <span className="ml-3 text-[var(--text-secondary)]">앵커 텍스트 로딩 중...</span>
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
        앵커 텍스트 데이터가 없습니다.
      </div>
    );
  }

  const maxBacklinks = Math.max(...data.items.map(a => a.backlinks ?? 0));
  const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--text-secondary)]">
          총 {data.total_count.toLocaleString()}개 앵커 텍스트 (상위 30개)
        </span>
      </div>

      {/* 바 차트 */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Anchor size={18} className="text-[var(--primary)]" />
          앵커 텍스트 분포
        </h3>
        <div className="space-y-3">
          {data.items.map((item, i) => {
            const pct = maxBacklinks > 0 ? ((item.backlinks ?? 0) / maxBacklinks) * 100 : 0;
            return (
              <div key={i} className="group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm truncate max-w-[60%]">{item.anchor || '(empty)'}</span>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                    <span>{(item.backlinks ?? 0).toLocaleString()} 백링크</span>
                    <span>{item.domains?.toLocaleString() || item.referring_domains?.toLocaleString() || 0} 도메인</span>
                  </div>
                </div>
                <div className="h-6 bg-[var(--border)] rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500 flex items-center px-2"
                    style={{
                      width: `${Math.max(pct, 2)}%`,
                      backgroundColor: colors[i % colors.length],
                    }}
                  >
                    {pct > 15 && (
                      <span className="text-xs font-medium text-white">
                        {item.dofollow !== undefined ? `${item.dofollow} df` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 앵커 테이블 */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <th className="text-left px-4 py-3 font-medium">앵커 텍스트</th>
                <th className="text-center px-4 py-3 font-medium">백링크</th>
                <th className="text-center px-4 py-3 font-medium">참조 도메인</th>
                <th className="text-center px-4 py-3 font-medium">Dofollow</th>
                <th className="text-center px-4 py-3 font-medium">Nofollow</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} className="border-b border-[var(--border)]/50 hover:bg-[var(--border)]/30 transition-colors">
                  <td className="px-4 py-3 max-w-xs truncate">{item.anchor || '(empty)'}</td>
                  <td className="px-4 py-3 text-center font-medium">{(item.backlinks ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">{item.referring_domains?.toLocaleString() || 0}</td>
                  <td className="px-4 py-3 text-center text-emerald-400">{item.dofollow?.toLocaleString() || 0}</td>
                  <td className="px-4 py-3 text-center text-red-400">{item.nofollow?.toLocaleString() || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
