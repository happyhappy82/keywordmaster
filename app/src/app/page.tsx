'use client';

import { useState, useCallback } from 'react';
import DashboardView from '@/components/views/DashboardView';
import ComparisonView from '@/components/views/ComparisonView';
import BacklinkView from '@/components/views/BacklinkView';
import { KeywordItem } from '@/lib/hooks/useKeywordAnalysis';
import { Sparkles, Search, Link2 } from 'lucide-react';

type ActiveTab = 'keyword' | 'backlink';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('keyword');
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [selectedCount, setSelectedCount] = useState<number>(30);
  const [analysisData, setAnalysisData] = useState<KeywordItem[] | null>(null);

  const handleViewDetails = (keyword: string, count: number) => {
    setSelectedKeyword(keyword);
    setSelectedCount(count);
  };

  const handleBackToDashboard = () => {
    setSelectedKeyword(null);
    setAnalysisData(null);
  };

  const handleDataLoaded = useCallback((data: KeywordItem[]) => {
    setAnalysisData(data);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[var(--background)] text-white font-sans">
      {/* Header - 항상 표시 */}
      <header className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--primary)]/20 rounded-xl">
              <Sparkles size={20} className="text-[var(--primary)]" />
            </div>
            <h1 className="text-xl font-bold">키워드 마스터</h1>
          </div>

          {/* 탭 버튼 */}
          <div className="flex items-center gap-1 bg-[var(--surface)] rounded-xl p-1 border border-[var(--border)]">
            <button
              onClick={() => setActiveTab('keyword')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'keyword'
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              <Search size={14} />
              키워드 분석
            </button>
            <button
              onClick={() => setActiveTab('backlink')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'backlink'
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              <Link2 size={14} />
              백링크 분석
            </button>
          </div>
        </div>
      </header>

      {/* 키워드 분석 - hidden으로 상태 유지 */}
      <main className={activeTab === 'keyword' ? '' : 'hidden'}>
        <div className={selectedKeyword ? "w-full px-2 py-2" : "max-w-7xl mx-auto px-6 py-8"}>
          {!selectedKeyword ? (
            <DashboardView onDetail={handleViewDetails} />
          ) : (
            <ComparisonView
              keyword={selectedKeyword}
              count={selectedCount}
              onDataLoaded={handleDataLoaded}
              onBack={handleBackToDashboard}
            />
          )}
        </div>
      </main>

      {/* 백링크 분석 - hidden으로 상태 유지 */}
      <main className={activeTab === 'backlink' ? '' : 'hidden'}>
        <BacklinkView />
      </main>
    </div>
  );
}
