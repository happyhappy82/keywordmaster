'use client';

import React from 'react';
import { Loader2, AlertCircle, Anchor } from 'lucide-react';
import { useAnchorTexts } from '@/lib/hooks/useBacklinkAnalysis';
import InfoTooltip from './InfoTooltip';

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
          <InfoTooltip text="앵커 텍스트란 백링크에 사용된 클릭 가능한 텍스트입니다. 예를 들어 '여기를 클릭'이라는 텍스트에 링크가 걸려있다면 '여기를 클릭'이 앵커 텍스트입니다. 타겟 키워드가 앵커에 포함되면 SEO에 유리하지만, 동일한 앵커가 너무 많으면 오히려 구글이 조작으로 판단할 수 있습니다. 자연스러운 앵커 텍스트 분포가 중요합니다." />
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
                <th className="text-left px-4 py-3 font-medium"><div className="flex items-center">앵커 텍스트<InfoTooltip text="백링크에 사용된 클릭 가능한 텍스트입니다. 같은 앵커 텍스트를 사용하는 백링크가 많을수록 해당 키워드로 인식됩니다. '(empty)'는 앵커 텍스트가 비어있는 경우입니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium"><div className="flex items-center justify-center">백링크<InfoTooltip text="이 앵커 텍스트를 사용한 백링크의 총 개수입니다. 동일 앵커가 많을수록 해당 키워드와의 연관성이 강해지지만, 과도하게 많으면 비자연스러운 링크로 판단될 수 있습니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium"><div className="flex items-center justify-center">참조 도메인<InfoTooltip text="이 앵커 텍스트로 백링크를 보내는 고유 도메인 수입니다. 다양한 도메인에서 같은 앵커를 사용할수록 자연스러운 링크입니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium"><div className="flex items-center justify-center">Dofollow<InfoTooltip text="검색엔진이 따라가는(SEO 가치가 전달되는) 링크 중 이 앵커를 사용한 개수입니다. Dofollow 백링크가 많을수록 SEO 효과가 큽니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium"><div className="flex items-center justify-center">Nofollow<InfoTooltip text="검색엔진에게 '따라가지 말 것'을 요청하는 링크 중 이 앵커를 사용한 개수입니다. 직접적 SEO 효과는 제한적이지만 트래픽 유입에는 도움됩니다." /></div></th>
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
