'use client';

import React from 'react';
import { Globe, Link2, Shield, Server, Loader2, AlertCircle } from 'lucide-react';
import type { BacklinkSummary } from '@/types/backlinks';
import InfoTooltip from './InfoTooltip';

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

  const statCards: Array<{
    label: string;
    value: number;
    icon: React.ComponentType<{ size?: number }>;
    tooltip: string;
    renderValue?: () => React.ReactNode;
  }> = [
    {
      label: 'Domain Rank',
      value: data.rank,
      icon: Globe,
      renderValue: () => <RankBadge rank={data.rank} />,
      tooltip: 'DataForSEO가 산정하는 도메인 권위 점수입니다. 0~1,000점 척도로, 해당 도메인을 가리키는 백링크의 양과 질을 기반으로 계산됩니다. 점수가 높을수록 검색엔진에서 더 신뢰받는 도메인입니다. (Ahrefs DR 0~100점과는 다른 척도)'
    },
    {
      label: '총 백링크',
      value: data.backlinks,
      icon: Link2,
      tooltip: '다른 웹사이트에서 이 도메인으로 연결되는 링크의 총 개수입니다. 같은 페이지에서 여러 링크가 있으면 각각 1개로 카운트합니다. 많을수록 좋지만 스팸 링크가 아닌 품질 높은 백링크가 중요합니다.'
    },
    {
      label: '참조 도메인',
      value: data.referring_domains,
      icon: Server,
      tooltip: '이 도메인에 백링크를 보내는 고유 도메인 수입니다. 예를 들어 naver.com에서 링크 10개를 보내도 참조 도메인은 1개입니다. 검색엔진은 다양한 도메인에서 오는 백링크를 더 높이 평가합니다.'
    },
    {
      label: '스팸 점수',
      value: data.backlinks_spam_score,
      icon: Shield,
      renderValue: () => <SpamBadge score={data.backlinks_spam_score} />,
      tooltip: '백링크의 스팸 가능성을 0~100으로 나타낸 점수입니다. 0~30: Low(안전), 31~60: Medium(주의 필요), 61~100: High(위험). 스팸성 백링크가 많으면 구글 검색 순위에 악영향을 줄 수 있습니다.'
    },
  ];

  // API 응답에서 실제 필드 매핑
  const nofollowCount = data.nofollow ?? data.referring_links_attributes?.['nofollow'] ?? 0;
  const dofollowCount = data.dofollow ?? (data.backlinks - nofollowCount);

  const followDistribution = [
    { label: 'Dofollow', value: Math.max(dofollowCount, 0), color: '#10b981' },
    { label: 'Nofollow', value: nofollowCount, color: '#ef4444' },
  ];

  const types = data.referring_links_types || {};
  const typeDistribution = [
    { label: 'Anchor', value: data.anchor ?? types['anchor'] ?? 0, color: '#6366f1' },
    { label: 'Image', value: data.image ?? types['image'] ?? 0, color: '#f59e0b' },
    { label: 'Canonical', value: data.canonical ?? types['canonical'] ?? 0, color: '#3b82f6' },
    { label: 'Redirect', value: data.redirect ?? types['redirect'] ?? 0, color: '#8b5cf6' },
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
              <InfoTooltip text={card.tooltip} />
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
          <div className="text-[var(--text-secondary)] text-sm mb-2 flex items-center gap-1">
            참조 메인 도메인
            <InfoTooltip text="서브도메인(blog.example.com, shop.example.com 등)을 하나로 합산한 메인 도메인(example.com) 수입니다. 실질적으로 몇 개의 독립된 사이트에서 링크를 받는지 보여줍니다." />
          </div>
          <div className="text-xl font-bold">{data.referring_main_domains?.toLocaleString() || 0}</div>
        </div>
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
          <div className="text-[var(--text-secondary)] text-sm mb-2 flex items-center gap-1">
            참조 IP
            <InfoTooltip text="백링크가 오는 서버들의 고유 IP 주소 수입니다. 다양한 IP에서 링크가 올수록 자연스러운 백링크 프로필입니다. 같은 IP에서 대량 링크가 오면 PBN(사설 블로그 네트워크) 의심을 받을 수 있습니다." />
          </div>
          <div className="text-xl font-bold">{data.referring_ips?.toLocaleString() || 0}</div>
        </div>
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
          <div className="text-[var(--text-secondary)] text-sm mb-2 flex items-center gap-1">
            참조 서브넷
            <InfoTooltip text="백링크가 오는 서버들의 고유 C-class 서브넷(/24) 수입니다. 같은 호스팅 업체의 사이트들은 같은 서브넷에 속할 수 있어, 서브넷 다양성이 높을수록 자연스러운 백링크입니다." />
          </div>
          <div className="text-xl font-bold">{data.referring_subnets?.toLocaleString() || 0}</div>
        </div>
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
          <div className="text-[var(--text-secondary)] text-sm mb-2 flex items-center gap-1">
            참조 페이지
            <InfoTooltip text="백링크가 실제로 위치한 개별 웹페이지 수입니다. 하나의 도메인 안에서도 여러 페이지에 백링크가 있을 수 있습니다." />
          </div>
          <div className="text-xl font-bold">{data.referring_pages?.toLocaleString() || 0}</div>
        </div>
      </div>

      {/* Dofollow/Nofollow 분포 */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Follow 분포
          <InfoTooltip text="Dofollow: 검색엔진(구글)이 이 링크를 따라가며 SEO 가치(링크 주스)를 전달합니다. 검색 순위 향상에 직접 기여합니다. Nofollow: 검색엔진에게 '이 링크를 따라가지 마세요'라고 알려주는 속성입니다. 직접적 SEO 효과는 제한적이지만 트래픽 유입에는 도움됩니다. 자연스러운 백링크 프로필은 dofollow와 nofollow가 적절히 섞여 있습니다." />
        </h3>
        <DistributionBar items={followDistribution} total={data.backlinks} />
      </div>

      {/* 링크 타입 분포 */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          링크 타입 분포
          <InfoTooltip text="Anchor: 텍스트에 걸린 하이퍼링크로, 가장 일반적인 백링크 형태입니다. Image: 이미지에 걸린 링크로, 이미지의 alt 태그가 앵커 텍스트 역할을 합니다. Canonical: 페이지의 대표 URL을 지정하는 태그에 포함된 링크입니다. Redirect: 리다이렉트(301/302)를 통해 연결되는 링크입니다." />
        </h3>
        <DistributionBar items={typeDistribution} total={data.backlinks} />
      </div>

      {/* TLD + 국가 분포 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 상위 TLD */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            상위 TLD
            <InfoTooltip text="TLD(Top-Level Domain)는 도메인 주소의 마지막 부분입니다. 예: .com, .org, .co.kr 등. 백링크를 보내는 도메인들의 TLD 분포를 보여줍니다. 다양한 TLD에서 링크가 오면 자연스러운 백링크 프로필입니다." />
          </h3>
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
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            상위 국가
            <InfoTooltip text="백링크를 보내는 웹사이트들의 서버 소재 국가입니다. 한국 대상 사이트라면 한국(KR)에서 오는 백링크 비중이 높을수록 자연스럽습니다. 관련 없는 국가에서 대량의 백링크가 오면 스팸 가능성이 있습니다." />
          </h3>
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
