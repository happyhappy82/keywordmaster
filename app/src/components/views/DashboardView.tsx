'use client';

import { useState } from 'react';
import { Search, Sparkles, ArrowRight, Hash, BarChart3, Loader2 } from 'lucide-react';

interface DashboardViewProps {
  onDetail: (keyword: string, count: number) => void;
}

const KEYWORD_COUNT_OPTIONS = [10, 20, 30, 40, 50];

interface VolumeResult {
  keyword: string;
  google: number;
  naver: number;
}

export default function DashboardView({ onDetail }: DashboardViewProps) {
  const [analyzeKeyword, setAnalyzeKeyword] = useState('');
  const [keywordCount, setKeywordCount] = useState(30);

  // 검색량 조회 상태
  const [volumeKeyword, setVolumeKeyword] = useState('');
  const [volumeResult, setVolumeResult] = useState<VolumeResult | null>(null);
  const [isLoadingVolume, setIsLoadingVolume] = useState(false);

  const handleAnalyze = () => {
    if (analyzeKeyword.trim()) {
      onDetail(analyzeKeyword.trim(), keywordCount);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  // 단일 키워드 검색량 조회
  const handleVolumeSearch = async () => {
    if (!volumeKeyword.trim()) return;

    setIsLoadingVolume(true);
    setVolumeResult(null);

    try {
      const response = await fetch('/api/volume/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: [
            { keyword: volumeKeyword.trim(), source: 'google' },
            { keyword: volumeKeyword.trim(), source: 'naver' },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const cleanKeyword = volumeKeyword.trim().toLowerCase().replace(/\s+/g, '');
        setVolumeResult({
          keyword: volumeKeyword.trim(),
          google: data.volumeMap[`google:${cleanKeyword}`] || 0,
          naver: data.volumeMap[`naver:${cleanKeyword}`] || 0,
        });
      }
    } catch (error) {
      console.error('Volume search error:', error);
    } finally {
      setIsLoadingVolume(false);
    }
  };

  const handleVolumeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVolumeSearch();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] gap-6">
      {/* 단일 키워드 검색량 조회 */}
      <div className="w-full max-w-4xl bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-500/20 rounded-xl">
            <BarChart3 size={20} className="text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">검색량 조회</h3>
            <p className="text-slate-500 text-xs">키워드 1개의 Google/Naver 월간 검색량을 확인합니다.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />
            <input
              type="text"
              value={volumeKeyword}
              onChange={(e) => setVolumeKeyword(e.target.value)}
              onKeyDown={handleVolumeKeyDown}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl pl-11 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder:text-slate-600"
              placeholder="검색량 조회할 키워드 입력"
            />
          </div>
          <button
            onClick={handleVolumeSearch}
            disabled={!volumeKeyword.trim() || isLoadingVolume}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2"
          >
            {isLoadingVolume ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                조회 중...
              </>
            ) : (
              <>
                <BarChart3 size={16} />
                검색량 조회
              </>
            )}
          </button>
        </div>

        {/* 검색량 결과 */}
        {volumeResult && (
          <div className="mt-4 p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
            <div className="text-sm font-bold text-white mb-3">
              &quot;{volumeResult.keyword}&quot; 월간 검색량
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="text-xs text-blue-400 font-bold mb-1">Google</div>
                <div className="text-2xl font-black text-white">
                  {volumeResult.google > 0 ? volumeResult.google.toLocaleString() : '-'}
                </div>
              </div>
              <div className="p-3 bg-[var(--naver)]/10 rounded-lg border border-[var(--naver)]/20">
                <div className="text-xs text-[var(--naver)] font-bold mb-1">Naver</div>
                <div className="text-2xl font-black text-white">
                  {volumeResult.naver > 0 ? volumeResult.naver.toLocaleString() : '-'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 키워드 분석 검색 섹션 */}
      <div className="w-full max-w-4xl bg-gradient-to-br from-[var(--primary)]/20 via-[var(--surface)] to-[var(--surface)] rounded-3xl border border-[var(--primary)]/30 p-12 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-[var(--primary)]/20 rounded-2xl">
            <Sparkles size={32} className="text-[var(--primary)]" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">키워드 분석</h2>
            <p className="text-slate-400 text-base mt-1">
              분석할 키워드를 입력하면 Google/Naver 자동완성 키워드를 수집합니다.
            </p>
          </div>
        </div>

        {/* 검색 입력 */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
              size={24}
            />
            <input
              type="text"
              value={analyzeKeyword}
              onChange={(e) => setAnalyzeKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl pl-14 pr-6 py-5 text-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all placeholder:text-slate-600"
              placeholder="분석할 키워드를 입력하세요 (예: 단백질 보충제)"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={!analyzeKeyword.trim()}
            className="px-10 py-5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-2xl font-black text-base uppercase tracking-wider transition-all shadow-lg shadow-[var(--primary)]/30 flex items-center gap-3"
          >
            분석 시작 <ArrowRight size={20} />
          </button>
        </div>

        {/* 키워드 개수 선택 */}
        <div className="bg-[var(--background)]/50 rounded-2xl p-6 border border-[var(--border)]">
          <div className="flex items-center gap-3 mb-4">
            <Hash size={18} className="text-[var(--primary)]" />
            <span className="text-sm font-bold text-slate-300">불러올 키워드 개수</span>
          </div>
          <div className="flex gap-3">
            {KEYWORD_COUNT_OPTIONS.map((count) => (
              <button
                key={count}
                onClick={() => setKeywordCount(count)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                  keywordCount === count
                    ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                {count}개
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            각 플랫폼(Google/Naver)별 자동완성에서 최대 {keywordCount}개씩 가져옵니다.
          </p>
        </div>

        {/* 추천 키워드 */}
        <div className="mt-6 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-slate-500 font-bold">추천:</span>
          {['비타민', '다이어트 식품', '헬스 보충제', 'AI 프로그램', '메이플스토리'].map((keyword) => (
            <button
              key={keyword}
              onClick={() => setAnalyzeKeyword(keyword)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-slate-300 hover:text-white transition-all"
            >
              {keyword}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
