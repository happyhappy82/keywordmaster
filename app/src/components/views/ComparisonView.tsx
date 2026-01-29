'use client';

import { useEffect, useState } from 'react';
import { Search, Keyboard, Globe, Zap, Loader2, AlertCircle, ChevronDown, ChevronUp, Sparkles, BarChart3 } from 'lucide-react';
import { useKeywordAnalysis, useExpandedAutocomplete, useBulkVolumeQuery, KeywordItem, ExpandedItem } from '@/lib/hooks/useKeywordAnalysis';

interface ComparisonViewProps {
  keyword: string;
  count: number;
  onDataLoaded?: (data: KeywordItem[]) => void;
}

interface ComparisonSection {
  title: string;
  color: string;
  bgColor: string;
  source: 'google' | 'naver';
  type: 'related' | 'autocomplete';
  data: KeywordItem[];
}

export default function ComparisonView({ keyword, count, onDataLoaded }: ComparisonViewProps) {
  const { data: analysisData, isLoading, error } = useKeywordAnalysis(keyword, count);

  // 확장 자동완성 상태
  const [expandedGoogle, setExpandedGoogle] = useState<ExpandedItem[]>([]);
  const [expandedNaver, setExpandedNaver] = useState<ExpandedItem[]>([]);
  const [showExpandedGoogle, setShowExpandedGoogle] = useState(false);
  const [showExpandedNaver, setShowExpandedNaver] = useState(false);

  // 검색량 상태
  const [volumeMap, setVolumeMap] = useState<Record<string, number>>({});
  const [volumesFetched, setVolumesFetched] = useState(false);

  const googleExpandMutation = useExpandedAutocomplete();
  const naverExpandMutation = useExpandedAutocomplete();
  const bulkVolumeMutation = useBulkVolumeQuery();

  // 확장 자동완성 호출
  const handleExpandGoogle = async () => {
    if (expandedGoogle.length > 0) {
      setShowExpandedGoogle(!showExpandedGoogle);
      return;
    }
    try {
      const result = await googleExpandMutation.mutateAsync({ keyword, platform: 'google' });
      setExpandedGoogle(result);
      setShowExpandedGoogle(true);
    } catch (err) {
      console.error('Google expand error:', err);
    }
  };

  const handleExpandNaver = async () => {
    if (expandedNaver.length > 0) {
      setShowExpandedNaver(!showExpandedNaver);
      return;
    }
    try {
      const result = await naverExpandMutation.mutateAsync({ keyword, platform: 'naver' });
      setExpandedNaver(result);
      setShowExpandedNaver(true);
    } catch (err) {
      console.error('Naver expand error:', err);
    }
  };

  // 데이터가 로드되면 상위 컴포넌트에 전달
  useEffect(() => {
    if (analysisData?.allData && onDataLoaded) {
      onDataLoaded(analysisData.allData);
    }
  }, [analysisData, onDataLoaded]);

  // 키워드 변경 시 확장 데이터 및 검색량 초기화
  useEffect(() => {
    setExpandedGoogle([]);
    setExpandedNaver([]);
    setShowExpandedGoogle(false);
    setShowExpandedNaver(false);
    setVolumeMap({});
    setVolumesFetched(false);
  }, [keyword]);

  // 검색량 일괄 조회
  const handleFetchVolumes = async () => {
    if (!analysisData) return;

    const allKeywords: { keyword: string; source: 'google' | 'naver' }[] = [];

    // 기본 키워드 추가
    for (const item of analysisData.allData) {
      allKeywords.push({ keyword: item.keyword, source: item.source });
    }

    // 확장 자동완성 키워드 추가
    for (const item of expandedGoogle) {
      allKeywords.push({ keyword: item.keyword, source: 'google' });
    }
    for (const item of expandedNaver) {
      allKeywords.push({ keyword: item.keyword, source: 'naver' });
    }

    try {
      const result = await bulkVolumeMutation.mutateAsync(allKeywords);
      setVolumeMap(result.volumeMap);
      setVolumesFetched(true);
    } catch (err) {
      console.error('Volume fetch error:', err);
    }
  };

  // 검색량 가져오기 헬퍼 함수
  const getVolume = (kw: string, source: 'google' | 'naver') => {
    const key = `${source}:${kw.toLowerCase().replace(/\s+/g, '')}`;
    return volumeMap[key] || 0;
  };

  const getIcon = (type: 'related' | 'autocomplete') => {
    return type === 'related' ? Search : Keyboard;
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
        <Loader2 size={48} className="text-[var(--primary)] animate-spin" />
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-2">데이터 수집 중...</h3>
          <p className="text-slate-500 text-sm">
            Google 및 Naver에서 &quot;{keyword}&quot; 키워드 데이터를 가져오고 있습니다.
          </p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
        <AlertCircle size={48} className="text-red-500" />
        <div className="text-center">
          <h3 className="text-xl font-bold text-red-400 mb-2">오류 발생</h3>
          <p className="text-slate-500 text-sm max-w-md">
            {error instanceof Error ? error.message : '데이터를 가져오는 중 오류가 발생했습니다.'}
          </p>
          <p className="text-slate-600 text-xs mt-2">
            API 키가 올바르게 설정되었는지 확인해주세요.
          </p>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!analysisData) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
        <Search size={48} className="text-slate-600" />
        <p className="text-slate-500">키워드를 선택해주세요.</p>
      </div>
    );
  }

  const sections: ComparisonSection[] = [
    {
      title: '구글 자동완성',
      color: 'text-[var(--google)]',
      bgColor: 'bg-blue-500/10',
      source: 'google',
      type: 'autocomplete',
      data: analysisData.data.googleAutocomplete,
    },
    {
      title: '구글 연관 검색어',
      color: 'text-[var(--google)]',
      bgColor: 'bg-blue-500/10',
      source: 'google',
      type: 'related',
      data: analysisData.data.googleRelated,
    },
    {
      title: '네이버 자동완성',
      color: 'text-[var(--naver)]',
      bgColor: 'bg-[var(--naver)]/10',
      source: 'naver',
      type: 'autocomplete',
      data: analysisData.data.naverAutocomplete,
    },
    {
      title: '네이버 연관 검색어',
      color: 'text-[var(--naver)]',
      bgColor: 'bg-[var(--naver)]/10',
      source: 'naver',
      type: 'related',
      data: analysisData.data.naverRelated,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[var(--primary)]/20 rounded-2xl text-[var(--primary)] animate-pulse">
            <Zap size={24} className="fill-current" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white leading-tight">
              &quot;{keyword}&quot; 통합 비교 분석
            </h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              총 {analysisData.summary.total}개 키워드 수집 완료
              {volumesFetched && ' · 검색량 조회 완료'}
            </p>
          </div>
        </div>

        {/* 검색량 조회 버튼 */}
        <button
          onClick={handleFetchVolumes}
          disabled={bulkVolumeMutation.isPending}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
            bulkVolumeMutation.isPending
              ? 'bg-slate-700 text-slate-400 cursor-wait'
              : volumesFetched
              ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
              : 'bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 shadow-lg shadow-[var(--primary)]/30'
          }`}
        >
          {bulkVolumeMutation.isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              검색량 조회 중...
            </>
          ) : volumesFetched ? (
            <>
              <BarChart3 size={18} />
              검색량 다시 조회
            </>
          ) : (
            <>
              <BarChart3 size={18} />
              검색량 조회하기
            </>
          )}
        </button>
      </div>

      {/* 4-Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {sections.map((section, sIdx) => {
          const Icon = getIcon(section.type);
          const isAutocomplete = section.type === 'autocomplete';
          const isGoogle = section.source === 'google';

          // 확장 관련 상태
          const expandedData = isGoogle ? expandedGoogle : expandedNaver;
          const showExpanded = isGoogle ? showExpandedGoogle : showExpandedNaver;
          const handleExpand = isGoogle ? handleExpandGoogle : handleExpandNaver;
          const isExpanding = isGoogle ? googleExpandMutation.isPending : naverExpandMutation.isPending;

          return (
            <div
              key={sIdx}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl flex flex-col h-[850px] shadow-2xl overflow-hidden group/card"
            >
              {/* Section Header */}
              <div
                className={`p-5 border-b border-[var(--border)] flex items-center justify-between ${section.bgColor} transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--background)] rounded-xl border border-[var(--border)] shadow-inner">
                    <Icon className={section.color} size={18} />
                  </div>
                  <h3 className="text-sm font-black text-white">{section.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {isAutocomplete && (
                    <button
                      onClick={handleExpand}
                      disabled={isExpanding}
                      className={`text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded transition-all flex items-center gap-1 ${
                        showExpanded
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                      }`}
                    >
                      {isExpanding ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Sparkles size={10} />
                      )}
                      {expandedData.length > 0
                        ? `확장 ${expandedData.length}개`
                        : '확장 ㄱ~ㅎ'}
                      {showExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                  )}
                  <span className="text-[10px] font-black bg-white/5 px-2 py-1 rounded-md text-slate-400 border border-white/5">
                    {section.data.length} Results
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {section.data.length === 0 && (!isAutocomplete || expandedData.length === 0) ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600">
                    <AlertCircle size={24} className="mb-2" />
                    <p className="text-sm">데이터 없음</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900/80 text-[10px] uppercase text-slate-500 font-black sticky top-0 z-10 backdrop-blur-md">
                      <tr>
                        <th className="px-5 py-3 border-b border-[var(--border)]">
                          키워드 및 바로가기
                        </th>
                        <th className="px-5 py-3 border-b border-[var(--border)] text-right">
                          검색량
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-[var(--border)]/20">
                      {/* 기본 자동완성 데이터 */}
                      {section.data.map((item, kIdx) => (
                        <tr
                          key={kIdx}
                          className="hover:bg-white/[0.04] group transition-all"
                        >
                          <td className="px-5 py-3">
                            <div className="flex flex-col gap-1.5">
                              <span className="font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                                {item.keyword}
                              </span>
                              <div className="flex items-center gap-2">
                                {section.source === 'google' ? (
                                  <a
                                    href={`https://www.google.com/search?q=${encodeURIComponent(item.keyword)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[9px] font-black uppercase tracking-tighter px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all flex items-center gap-1.5"
                                  >
                                    <Globe size={10} /> GOOGLE 검색
                                  </a>
                                ) : (
                                  <a
                                    href={`https://search.naver.com/search.naver?query=${encodeURIComponent(item.keyword)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[9px] font-black uppercase tracking-tighter px-2.5 py-1 rounded bg-[var(--naver)]/10 text-[var(--naver)] border border-[var(--naver)]/20 hover:bg-[var(--naver)] hover:text-white transition-all flex items-center gap-1.5"
                                  >
                                    <Zap size={10} /> NAVER 검색
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-slate-500 text-xs font-medium">
                            {volumesFetched
                              ? (getVolume(item.keyword, section.source) > 0
                                  ? getVolume(item.keyword, section.source).toLocaleString()
                                  : '-')
                              : <span className="text-slate-600">-</span>
                            }
                          </td>
                        </tr>
                      ))}

                      {/* 확장 자동완성 데이터 (ㄱ~ㅎ) */}
                      {isAutocomplete && showExpanded && expandedData.length > 0 && (
                        <>
                          <tr className="bg-[var(--primary)]/10">
                            <td colSpan={2} className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">
                              확장 자동완성 (ㄱ~ㅎ) - {expandedData.length}개
                            </td>
                          </tr>
                          {expandedData.map((item, kIdx) => (
                            <tr
                              key={`expanded-${kIdx}`}
                              className="hover:bg-white/[0.04] group transition-all bg-[var(--primary)]/5"
                            >
                              <td className="px-5 py-3">
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--primary)]/20 text-[var(--primary)]">
                                      {item.source}
                                    </span>
                                    <span className="font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                                      {item.keyword}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isGoogle ? (
                                      <a
                                        href={`https://www.google.com/search?q=${encodeURIComponent(item.keyword)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[9px] font-black uppercase tracking-tighter px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all flex items-center gap-1.5"
                                      >
                                        <Globe size={10} /> GOOGLE 검색
                                      </a>
                                    ) : (
                                      <a
                                        href={`https://search.naver.com/search.naver?query=${encodeURIComponent(item.keyword)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[9px] font-black uppercase tracking-tighter px-2.5 py-1 rounded bg-[var(--naver)]/10 text-[var(--naver)] border border-[var(--naver)]/20 hover:bg-[var(--naver)] hover:text-white transition-all flex items-center gap-1.5"
                                      >
                                        <Zap size={10} /> NAVER 검색
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right font-mono text-slate-500 text-xs font-medium">
                                {volumesFetched
                                  ? (getVolume(item.keyword, isGoogle ? 'google' : 'naver') > 0
                                      ? getVolume(item.keyword, isGoogle ? 'google' : 'naver').toLocaleString()
                                      : '-')
                                  : <span className="text-slate-600">-</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
