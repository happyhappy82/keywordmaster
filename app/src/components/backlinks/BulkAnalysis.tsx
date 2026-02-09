'use client';

import React, { useState } from 'react';
import { Loader2, AlertCircle, Search, BarChart3 } from 'lucide-react';
import { useBulkRanks } from '@/lib/hooks/useBacklinkAnalysis';
import { RankBadge, SpamBadge } from './DomainOverview';

export default function BulkAnalysis() {
  const [input, setInput] = useState('');
  const bulkMutation = useBulkRanks();

  const handleAnalyze = () => {
    const targets = input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (targets.length === 0) return;
    if (targets.length > 1000) {
      alert('최대 1000개까지 분석 가능합니다.');
      return;
    }

    bulkMutation.mutate(targets);
  };

  return (
    <div className="space-y-6">
      {/* 입력 영역 */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-[var(--primary)]" />
          대량 도메인 분석
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          여러 도메인을 한 번에 분석합니다. 줄바꿈으로 구분하세요. (최대 1000개)
        </p>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={'example.com\ngoogle.com\nnaver.com'}
          rows={6}
          className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
        />
        <button
          onClick={handleAnalyze}
          disabled={bulkMutation.isPending || !input.trim()}
          className="mt-3 px-6 py-2.5 bg-[var(--primary)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {bulkMutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              분석 중...
            </>
          ) : (
            <>
              <Search size={16} />
              분석 시작
            </>
          )}
        </button>
      </div>

      {/* 에러 */}
      {bulkMutation.error && (
        <div className="flex items-center justify-center py-8 text-red-400 gap-2">
          <AlertCircle size={20} />
          <span>{bulkMutation.error.message}</span>
        </div>
      )}

      {/* 결과 테이블 */}
      {bulkMutation.data && bulkMutation.data.length > 0 && (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <span className="text-sm text-[var(--text-secondary)]">
              {bulkMutation.data.length}개 도메인 분석 완료
            </span>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                  <th className="text-left px-4 py-3 font-medium">#</th>
                  <th className="text-left px-4 py-3 font-medium">도메인</th>
                  <th className="text-center px-4 py-3 font-medium">Rank</th>
                  <th className="text-center px-4 py-3 font-medium">백링크</th>
                  <th className="text-center px-4 py-3 font-medium">참조 도메인</th>
                  <th className="text-center px-4 py-3 font-medium">참조 IP</th>
                  <th className="text-center px-4 py-3 font-medium">스팸 점수</th>
                </tr>
              </thead>
              <tbody>
                {bulkMutation.data
                  .sort((a, b) => (b.rank || 0) - (a.rank || 0))
                  .map((item, i) => (
                    <tr key={i} className="border-b border-[var(--border)]/50 hover:bg-[var(--border)]/30 transition-colors">
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">{item.target}</td>
                      <td className="px-4 py-3 text-center">
                        <RankBadge rank={item.rank || 0} />
                      </td>
                      <td className="px-4 py-3 text-center">{item.backlinks?.toLocaleString() || 0}</td>
                      <td className="px-4 py-3 text-center">{item.referring_domains?.toLocaleString() || 0}</td>
                      <td className="px-4 py-3 text-center">{item.referring_ips?.toLocaleString() || 0}</td>
                      <td className="px-4 py-3 text-center">
                        <SpamBadge score={item.backlinks_spam_score || 0} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
