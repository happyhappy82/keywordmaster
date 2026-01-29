'use client';

import { useState } from 'react';
import { Search, Sparkles, ArrowRight, Hash } from 'lucide-react';

interface DashboardViewProps {
  onDetail: (keyword: string, count: number) => void;
}

const KEYWORD_COUNT_OPTIONS = [10, 20, 30, 40, 50];

export default function DashboardView({ onDetail }: DashboardViewProps) {
  const [analyzeKeyword, setAnalyzeKeyword] = useState('');
  const [keywordCount, setKeywordCount] = useState(30);

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

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      {/* 키워드 분석 검색 섹션 */}
      <div className="w-full max-w-4xl bg-gradient-to-br from-[var(--primary)]/20 via-[var(--surface)] to-[var(--surface)] rounded-3xl border border-[var(--primary)]/30 p-12 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-[var(--primary)]/20 rounded-2xl">
            <Sparkles size={32} className="text-[var(--primary)]" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">키워드 분석</h2>
            <p className="text-slate-400 text-base mt-1">
              분석할 키워드를 입력하면 Google/Naver 연관검색어와 자동완성을 수집합니다.
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
            각 플랫폼(Google/Naver)별 연관검색어와 자동완성에서 최대 {keywordCount}개씩 가져옵니다.
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
