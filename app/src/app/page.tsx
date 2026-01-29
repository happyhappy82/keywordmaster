'use client';

import { useState, useCallback } from 'react';
import DashboardView from '@/components/views/DashboardView';
import ComparisonView from '@/components/views/ComparisonView';
import { useExportCsv, KeywordItem } from '@/lib/hooks/useKeywordAnalysis';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [selectedCount, setSelectedCount] = useState<number>(30);
  const [analysisData, setAnalysisData] = useState<KeywordItem[] | null>(null);

  const exportCsv = useExportCsv();

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

  const handleExport = useCallback(() => {
    console.log('[CSV Export] Button clicked');
    console.log('[CSV Export] analysisData:', analysisData);
    console.log('[CSV Export] selectedKeyword:', selectedKeyword);

    if (analysisData && selectedKeyword) {
      console.log('[CSV Export] Calling mutate with', analysisData.length, 'items');
      exportCsv.mutate({
        data: analysisData,
        filename: `키워드분석_${selectedKeyword}`,
      });
    } else {
      console.log('[CSV Export] Condition not met - analysisData or selectedKeyword is missing');
      alert('내보낼 데이터가 없습니다.');
    }
  }, [analysisData, selectedKeyword, exportCsv]);

  return (
    <div className="min-h-screen w-full bg-[var(--background)] text-white font-sans">
      {/* Simple Header - 대시보드에서만 표시 */}
      {!selectedKeyword && (
        <header className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--primary)]/20 rounded-xl">
                <Sparkles size={20} className="text-[var(--primary)]" />
              </div>
              <h1 className="text-xl font-bold">키워드 마스터</h1>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={selectedKeyword ? "w-full px-2 py-2" : "max-w-7xl mx-auto px-6 py-8"}>
        {!selectedKeyword ? (
          <DashboardView onDetail={handleViewDetails} />
        ) : (
          <ComparisonView
            keyword={selectedKeyword}
            count={selectedCount}
            onDataLoaded={handleDataLoaded}
            onExport={handleExport}
            isExporting={exportCsv.isPending}
            onBack={handleBackToDashboard}
          />
        )}
      </main>
    </div>
  );
}
