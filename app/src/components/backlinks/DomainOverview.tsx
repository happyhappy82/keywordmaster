'use client';

import React from 'react';
import { Globe, Link2, Shield, Server, Loader2, AlertCircle } from 'lucide-react';
import type { BacklinkSummary } from '@/types/backlinks';

// Rank Badge 컴포넌트
function RankBadge({ rank }: { rank: number }) {
  let color = '';
  if (rank <= 30) color = 'bg-red-500/20 text-red-400 border-red-500/30';
  else if (rank <= 50) color = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  else if (rank <= 70) color = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  else color = 'bg-purple-500/20 text-purple-400 border-purple-500/30';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold border ${color}`}>
      {rank}
    </span>
  );
}

// Spam Badge 컴포넌트
function SpamBadge({ score }: { score: number }) {
  let color = '';
  let label = '';
  if (score <= 30) { color = 'bg-emerald-500/20 text-emerald-400'; label = 'Low'; }
  else if (score <= 60) { color = 'bg-yellow-500/20 text-yellow-400'; label = 'Medium'; }
  else { color = 'bg-red-500/20 text-red-400'; label = 'High'; }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${color}`}>
      {label} ({score})
    </span>
  );
}

// 분포 바 컴포넌트
function DistributionBar({ items, total }: { items: { label: string; value: number; color: string }[]; total: number }) {
  if (total === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex rounded-full overflow-hidden h-3 bg-[var(--border)]">
        {items.map((item, i) => {
          const pct = (item.value / total) * 100;
          if (pct < 0.5) return null;
          return (
            <div
              key={i}
              className="h-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: item.color }}
              title={`${item.label}: ${item.value.toLocaleString()} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.label}: {item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface DomainOverviewProps {
  data: BacklinkSummary | undefined;
  isLoading: boolean;
  error: Error | null;
}

export default function DomainOverview({ data, isLoading, error }: DomainOverviewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
        <span className="ml-3 text-[var(--text-secondary)]">도메인 분석 중...</span>
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

  if (!data) return null;

  const statCards = [
    { label: 'Domain Rank', value: data.rank, icon: Globe, renderValue: () => <RankBadge rank={data.rank} /> },
    { label: '총 백링크', value: data.backlinks, icon: Link2 },
    { label: '참조 도메인', value: data.referring_domains, icon: Server },
    { label: '스팸 점수', value: data.backlinks_spam_score, icon: Shield, renderValue: () => <SpamBadge score={data.backlinks_spam_score} /> },
  ];

  const followDistribution = [
    { label: 'Dofollow', value: data.dofollow, color: '#10b981' },
    { label: 'Nofollow', value: data.nofollow, color: '#ef4444' },
  ];

  const typeDistribution = [
    { label: 'Anchor', value: data.anchor, color: '#6366f1' },
    { label: 'Image', value: data.image, color: '#f59e0b' },
    { label: 'Canonical', value: data.canonical, color: '#3b82f6' },
    { label: 'Redirect', value: data.redirect, color: '#8b5cf6' },
  ];

  const topTlds = Object.entries(data.referring_links_tld || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const topCountries = Object.entries(data.referring_links_countries || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mb-3">
              <card.icon size={16} />
              <span>{card.label}</span>
            </div>
            <div className="text-2xl font-bold">
              {card.renderValue ? card.renderValue() : card.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* 추가 통계 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
          <div className="text-[var(--text-secondary)] text-sm mb-2">참조 메인 도메인</div>
          <div className="text-xl font-bold">{data.referring_main_domains?.toLocaleString() || 0}</div>
        </div>
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
          <div className="text-[var(--text-secondary)] text-sm mb-2">참조 IP</div>
          <div className="text-xl font-bold">{data.referring_ips?.toLocaleString() || 0}</div>
        </div>
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
          <div className="text-[var(--text-secondary)] text-sm mb-2">참조 서브넷</div>
          <div className="text-xl font-bold">{data.referring_subnets?.toLocaleString() || 0}</div>
        </div>
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
          <div className="text-[var(--text-secondary)] text-sm mb-2">참조 페이지</div>
          <div className="text-xl font-bold">{data.referring_pages?.toLocaleString() || 0}</div>
        </div>
      </div>

      {/* Dofollow/Nofollow 분포 */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6">
        <h3 className="text-lg font-semibold mb-4">Follow 분포</h3>
        <DistributionBar items={followDistribution} total={data.backlinks} />
      </div>

      {/* 링크 타입 분포 */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6">
        <h3 className="text-lg font-semibold mb-4">링크 타입 분포</h3>
        <DistributionBar items={typeDistribution} total={data.backlinks} />
      </div>

      {/* TLD + 국가 분포 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 상위 TLD */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6">
          <h3 className="text-lg font-semibold mb-4">상위 TLD</h3>
          <div className="space-y-2">
            {topTlds.map(([tld, count]) => {
              const pct = data.backlinks > 0 ? (count / data.backlinks) * 100 : 0;
              return (
                <div key={tld} className="flex items-center gap-3">
                  <span className="text-sm w-16 text-[var(--text-secondary)]">{tld}</span>
                  <div className="flex-1 bg-[var(--border)] rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] w-20 text-right">
                    {count.toLocaleString()} ({pct.toFixed(1)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 상위 국가 */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6">
          <h3 className="text-lg font-semibold mb-4">상위 국가</h3>
          <div className="space-y-2">
            {topCountries.map(([country, count]) => {
              const pct = data.backlinks > 0 ? (count / data.backlinks) * 100 : 0;
              return (
                <div key={country} className="flex items-center gap-3">
                  <span className="text-sm w-16 text-[var(--text-secondary)] uppercase">{country}</span>
                  <div className="flex-1 bg-[var(--border)] rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-[var(--naver)] rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] w-20 text-right">
                    {count.toLocaleString()} ({pct.toFixed(1)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export { RankBadge, SpamBadge };
