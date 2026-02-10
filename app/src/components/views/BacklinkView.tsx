'use client';

import React, { useState, useEffect } from 'react';
import { Search, Globe, Link2, Anchor, TrendingUp, ArrowUpDown, Users, BarChart3, Loader2, AlertTriangle } from 'lucide-react';
import { useBacklinkSummary } from '@/lib/hooks/useBacklinkAnalysis';
import type { BacklinkSubTab } from '@/types/backlinks';
import DomainOverview from '@/components/backlinks/DomainOverview';
import BacklinkList from '@/components/backlinks/BacklinkList';
import ReferringDomains from '@/components/backlinks/ReferringDomains';
import AnchorDistribution from '@/components/backlinks/AnchorDistribution';
import HistoryChart from '@/components/backlinks/HistoryChart';
import NewLostBacklinks from '@/components/backlinks/NewLostBacklinks';
import CompetitorAnalysis from '@/components/backlinks/CompetitorAnalysis';
import BulkAnalysis from '@/components/backlinks/BulkAnalysis';

const SUB_TABS: { key: BacklinkSubTab; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: '개요', icon: Globe },
  { key: 'backlinks', label: '백링크', icon: Link2 },
  { key: 'referring-domains', label: '참조도메인', icon: Globe },
  { key: 'anchors', label: '앵커', icon: Anchor },
  { key: 'history', label: '히스토리', icon: TrendingUp },
  { key: 'new-lost', label: 'New/Lost', icon: ArrowUpDown },
  { key: 'competitors', label: '경쟁사', icon: Users },
  { key: 'bulk', label: '대량분석', icon: BarChart3 },
];

export default function BacklinkView() {
  const [domain, setDomain] = useState('');
  const [analyzedDomain, setAnalyzedDomain] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<BacklinkSubTab>('overview');
  const [activatedTabs, setActivatedTabs] = useState<Set<BacklinkSubTab>>(new Set());

  // 도메인 변경 시 활성화된 탭 초기화 (개요는 자동, 나머지는 수동)
  useEffect(() => {
    setActivatedTabs(new Set());
  }, [analyzedDomain]);

  const { data: summaryData, isLoading: summaryLoading, error: summaryError } = useBacklinkSummary(analyzedDomain);

  const handleAnalyze = () => {
    const trimmed = domain.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (!trimmed) return;
    setAnalyzedDomain(trimmed);
    setActiveSubTab('overview');
  };

  const activateTab = () => {
    setActivatedTabs(prev => new Set([...prev, activeSubTab]));
  };

  const renderAnalysisPrompt = (tabLabel: string, cost: string) => (
    <div className="flex flex-col items-center justify-center py-20 gap-5">
      <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
        <Search size={28} className="text-[var(--primary)]" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">{tabLabel} 분석</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          {analyzedDomain}의 {tabLabel} 데이터를 조회합니다.
        </p>
      </div>
      <button
        onClick={activateTab}
        className="px-8 py-3 bg-[var(--primary)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
      >
        <Search size={16} />
        분석 시작
      </button>
      <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
        <AlertTriangle size={12} />
        <span>API 호출 비용: {cost}</span>
      </div>
    </div>
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAnalyze();
  };

  const renderContent = () => {
    if (activeSubTab === 'bulk') {
      return <BulkAnalysis />;
    }

    if (!analyzedDomain) {
      return (
        <div className="text-center py-20 text-[var(--text-secondary)]">
          도메인을 입력하고 분석을 시작하세요.
        </div>
      );
    }

    switch (activeSubTab) {
      case 'overview':
        return <DomainOverview data={summaryData} isLoading={summaryLoading} error={summaryError} />;
      case 'backlinks':
        if (!activatedTabs.has('backlinks')) return renderAnalysisPrompt('백링크', '$0.02+');
        return <BacklinkList target={analyzedDomain} />;
      case 'referring-domains':
        if (!activatedTabs.has('referring-domains')) return renderAnalysisPrompt('참조도메인', '$0.02+');
        return <ReferringDomains target={analyzedDomain} />;
      case 'anchors':
        if (!activatedTabs.has('anchors')) return renderAnalysisPrompt('앵커', '$0.02+');
        return <AnchorDistribution target={analyzedDomain} />;
      case 'history':
        if (!activatedTabs.has('history')) return renderAnalysisPrompt('히스토리', '$0.02+');
        return <HistoryChart target={analyzedDomain} />;
      case 'new-lost':
        if (!activatedTabs.has('new-lost')) return renderAnalysisPrompt('New/Lost', '$0.02+');
        return <NewLostBacklinks target={analyzedDomain} />;
      case 'competitors':
        if (!activatedTabs.has('competitors')) return renderAnalysisPrompt('경쟁사', '$0.02+');
        return <CompetitorAnalysis target={analyzedDomain} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* 도메인 입력 */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6">
        <h2 className="text-xl font-bold mb-4">백링크 분석</h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="도메인 입력 (예: example.com)"
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl pl-11 pr-4 py-3 text-sm placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={!domain.trim() || summaryLoading}
            className="px-6 py-3 bg-[var(--primary)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {summaryLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            분석
          </button>
        </div>
        {analyzedDomain && (
          <div className="mt-3 text-sm text-[var(--text-secondary)]">
            분석 대상: <span className="text-[var(--primary)] font-medium">{analyzedDomain}</span>
          </div>
        )}
      </div>

      {/* 서브탭 */}
      <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeSubTab === tab.key
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--border)]'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 콘텐츠 영역 */}
      {renderContent()}
    </div>
  );
}
