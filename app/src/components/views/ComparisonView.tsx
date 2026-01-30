'use client';

import React, { useEffect, useState } from 'react';
import { Keyboard, Globe, Zap, Loader2, AlertCircle, ChevronDown, ChevronUp, Sparkles, BarChart3, Download, Wand2, ArrowLeft, Search, Copy, Check } from 'lucide-react';
import { useKeywordAnalysis, useExpandedAutocomplete, useBulkVolumeQuery, useGenerateModifiers, KeywordItem, ExpandedItem } from '@/lib/hooks/useKeywordAnalysis';

interface ComparisonViewProps {
  keyword: string;
  count: number;
  onDataLoaded?: (data: KeywordItem[]) => void;
  onBack?: () => void;
}

interface ComparisonSection {
  title: string;
  color: string;
  bgColor: string;
  source: 'google' | 'naver';
  data: KeywordItem[];
}

export default function ComparisonView({ keyword, count, onDataLoaded, onBack }: ComparisonViewProps) {
  const { data: analysisData, isLoading, error } = useKeywordAnalysis(keyword, count);

  // 확장 자동완성 상태
  const [expandedGoogle, setExpandedGoogle] = useState<ExpandedItem[]>([]);
  const [expandedNaver, setExpandedNaver] = useState<ExpandedItem[]>([]);
  const [showExpandedGoogle, setShowExpandedGoogle] = useState(false);
  const [showExpandedNaver, setShowExpandedNaver] = useState(false);

  // 네이버 심층 확장 상태
  const [deepExpandedNaver, setDeepExpandedNaver] = useState<ExpandedItem[]>([]);
  const [showDeepExpandedNaver, setShowDeepExpandedNaver] = useState(false);
  const [isDeepExpandingNaver, setIsDeepExpandingNaver] = useState(false);
  // 개별 키워드 심층 확장 상태
  const [expandingKeywords, setExpandingKeywords] = useState<Set<string>>(new Set()); // 현재 확장 중인 키워드
  const [expandedKeywords, setExpandedKeywords] = useState<Set<string>>(new Set()); // 확장 완료된 키워드
  const [perKeywordResults, setPerKeywordResults] = useState<Record<string, ExpandedItem[]>>({}); // 키워드별 결과
  const [perKeywordPlatform, setPerKeywordPlatform] = useState<Record<string, 'google' | 'naver'>>({}); // 키워드별 플랫폼

  // 검색량 상태
  const [volumeMap, setVolumeMap] = useState<Record<string, number>>({});
  const [volumesFetched, setVolumesFetched] = useState(false);

  // 복사 상태
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // 수식어 상태
  const [modifiers, setModifiers] = useState<string[]>([]);
  const [showModifiers, setShowModifiers] = useState(false);

  // 수식어 자동완성 상태 (구글만)
  const [prefixGoogle, setPrefixGoogle] = useState<ExpandedItem[]>([]);
  const [showPrefixGoogle, setShowPrefixGoogle] = useState(false);
  const [isFetchingPrefix, setIsFetchingPrefix] = useState(false);

  const googleExpandMutation = useExpandedAutocomplete();
  const naverExpandMutation = useExpandedAutocomplete();
  const bulkVolumeMutation = useBulkVolumeQuery();
  const modifiersMutation = useGenerateModifiers();

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

  // 네이버 심층 확장 - Phase 1: 점진적 타이핑만
  const handleDeepExpandNaver = async () => {
    if (deepExpandedNaver.length > 0) {
      setShowDeepExpandedNaver(!showDeepExpandedNaver);
      return;
    }

    // 키워드 분리: "노트북 추천" → baseKeyword="노트북", targetSuffix="추천"
    const parts = keyword.trim().split(/\s+/);
    if (parts.length < 2) {
      alert('심층 확장은 2단어 이상 키워드에서만 사용 가능합니다.\n예: "노트북 추천"');
      return;
    }

    const baseKeyword = parts[0];
    const targetSuffix = parts.slice(1).join(' ');

    setIsDeepExpandingNaver(true);

    try {
      const response = await fetch('/api/naver/autocomplete-expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: baseKeyword, targetSuffix }),
      });

      if (!response.ok) throw new Error('API error');

      const result = await response.json();
      setDeepExpandedNaver(result.data || []);
      setShowDeepExpandedNaver(true);
    } catch (err) {
      console.error('Naver deep expand error:', err);
      alert('심층 확장 중 오류가 발생했습니다.');
    } finally {
      setIsDeepExpandingNaver(false);
    }
  };

  // 개별 키워드 심층 확장 (196음절) - 구글/네이버 모두 지원
  const handleExpandSingleKeyword = async (kw: string, platform: 'google' | 'naver' = 'naver') => {
    if (expandingKeywords.has(kw) || expandedKeywords.has(kw)) return;

    setExpandingKeywords(prev => new Set(prev).add(kw));

    const apiUrl = platform === 'google'
      ? '/api/google/autocomplete-expand'
      : '/api/naver/autocomplete-expand';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: kw, expandKeyword: kw }),
      });

      if (!response.ok) throw new Error('API error');

      const result = await response.json();
      const newResults: ExpandedItem[] = result.data || [];

      setPerKeywordResults(prev => ({ ...prev, [kw]: newResults }));
      setPerKeywordPlatform(prev => ({ ...prev, [kw]: platform }));
      setExpandedKeywords(prev => new Set(prev).add(kw));
    } catch (err) {
      console.error(`Expand error for "${kw}":`, err);
    } finally {
      setExpandingKeywords(prev => {
        const next = new Set(prev);
        next.delete(kw);
        return next;
      });
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
    setDeepExpandedNaver([]);
    setShowDeepExpandedNaver(false);
    setExpandingKeywords(new Set());
    setExpandedKeywords(new Set());
    setPerKeywordResults({});
    setPerKeywordPlatform({});
    setVolumeMap({});
    setVolumesFetched(false);
    setModifiers([]);
    setShowModifiers(false);
    setPrefixGoogle([]);
    setShowPrefixGoogle(false);
  }, [keyword]);

  // 수식어 생성 (앞에 붙는 수식어) - 구글만
  const handleGenerateModifiers = async () => {
    if (modifiers.length > 0) {
      setShowModifiers(!showModifiers);
      setShowPrefixGoogle(!showPrefixGoogle);
      return;
    }
    try {
      setIsFetchingPrefix(true);

      // 1. 수식어 생성
      const generatedModifiers = await modifiersMutation.mutateAsync(keyword);
      setModifiers(generatedModifiers);
      setShowModifiers(true);

      // 2. 수식어 + 키워드 조합 생성
      const prefixCombinations = generatedModifiers.map(modifier => `${modifier} ${keyword}`);

      // 3. 각 조합으로 구글 자동완성 조회 (실제 자동완성에 있는 것만 표시)
      const googleResults: ExpandedItem[] = [];

      // Google 자동완성 (병렬) - 결과가 있는 것만 추가
      const googlePromises = prefixCombinations.map(async (query) => {
        const modifier = query.split(' ')[0];
        try {
          const res = await fetch('/api/google/autocomplete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword: query }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.data && data.data.length > 0) {
              // 자동완성 결과가 있으면 해당 결과들만 추가
              return data.data.map((item: { keyword: string }) => ({
                keyword: item.keyword,
                volume: 0,
                source: modifier,
              }));
            }
          }
        } catch (err) {
          console.error(`Google autocomplete error for "${query}":`, err);
        }
        return []; // 결과 없으면 빈 배열
      });

      const googleAllResults = await Promise.all(googlePromises);
      googleAllResults.forEach(items => googleResults.push(...items));

      // 중복 제거
      const uniqueGoogle = googleResults.filter((item, idx, arr) =>
        arr.findIndex(i => i.keyword.toLowerCase() === item.keyword.toLowerCase()) === idx
      );

      setPrefixGoogle(uniqueGoogle);
      setShowPrefixGoogle(true);
      setIsFetchingPrefix(false);
    } catch (err) {
      console.error('Modifier generation error:', err);
      alert('수식어 생성에 실패했습니다. Gemini API 키를 확인해주세요.');
      setIsFetchingPrefix(false);
    }
  };

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

    // 수식어 자동완성 키워드 추가 (구글만)
    for (const item of prefixGoogle) {
      allKeywords.push({ keyword: item.keyword, source: 'google' });
    }

    // 네이버 심층 확장 키워드 추가
    for (const item of deepExpandedNaver) {
      allKeywords.push({ keyword: item.keyword, source: 'naver' });
    }

    // 개별 키워드 심층 확장 결과 추가
    for (const [parentKw, items] of Object.entries(perKeywordResults)) {
      const platform = perKeywordPlatform[parentKw] || 'naver';
      for (const item of items) {
        allKeywords.push({ keyword: item.keyword, source: platform });
      }
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

  // CSV 내보내기 (클라이언트 사이드)
  const handleExportCsv = (platform: 'google' | 'naver') => {
    const isGoogle = platform === 'google';
    const rows: Array<{ keyword: string; type: string; source: string; volume: number }> = [];
    const seen = new Set<string>();

    const addRow = (kw: string, type: string, src: string) => {
      const key = kw.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      rows.push({
        keyword: kw,
        type,
        source: src,
        volume: getVolume(kw, platform),
      });
    };

    // 1. 기본 자동완성
    const sectionData = isGoogle ? analysisData?.data.googleAutocomplete : analysisData?.data.naverAutocomplete;
    if (sectionData) {
      for (const item of sectionData) addRow(item.keyword, '기본 자동완성', '기본');
    }

    // 2. 확장 ㄱ~ㅎ
    const expanded = isGoogle ? expandedGoogle : expandedNaver;
    for (const item of expanded) addRow(item.keyword, '확장 자동완성', item.source);

    // 3. 수식어 (구글만)
    if (isGoogle) {
      for (const item of prefixGoogle) addRow(item.keyword, '수식어', item.source);
      // 수식어 심층 확장 하위
      for (const item of prefixGoogle) {
        if (expandedKeywords.has(item.keyword)) {
          for (const sub of (perKeywordResults[item.keyword] || [])) {
            addRow(sub.keyword, '수식어 심층확장', `${item.keyword} > ${sub.source}`);
          }
        }
      }
    }

    // 4. 심층 확장 (네이버만)
    if (!isGoogle) {
      for (const item of deepExpandedNaver) addRow(item.keyword, '심층 확장', item.source);
      // 심층 확장 하위
      for (const item of deepExpandedNaver) {
        if (expandedKeywords.has(item.keyword)) {
          for (const sub of (perKeywordResults[item.keyword] || [])) {
            addRow(sub.keyword, '심층확장 하위', `${item.keyword} > ${sub.source}`);
          }
        }
      }
    }

    // CSV 생성
    const escCsv = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const header = '키워드,유형,출처,검색량';
    const csvRows = rows.map(r => `${escCsv(r.keyword)},${escCsv(r.type)},${escCsv(r.source)},${r.volume}`);
    const csvContent = '\uFEFF' + header + '\n' + csvRows.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${keyword}_${isGoogle ? '구글' : '네이버'}_키워드_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // 키워드 복사 (줄바꿈으로 구분)
  const handleCopyKeywords = (source: 'google' | 'naver') => {
    const keywords = new Set<string>();
    const isGoogle = source === 'google';

    // 기본 자동완성
    const sectionData = isGoogle ? analysisData?.data.googleAutocomplete : analysisData?.data.naverAutocomplete;
    if (sectionData) {
      for (const item of sectionData) keywords.add(item.keyword);
    }

    // 확장 ㄱ~ㅎ
    const expanded = isGoogle ? expandedGoogle : expandedNaver;
    const showExp = isGoogle ? showExpandedGoogle : showExpandedNaver;
    if (showExp) {
      for (const item of expanded) keywords.add(item.keyword);
    }

    // 수식어 (구글만)
    if (isGoogle && showPrefixGoogle) {
      for (const item of prefixGoogle) keywords.add(item.keyword);
      for (const item of prefixGoogle) {
        if (expandedKeywords.has(item.keyword)) {
          for (const sub of (perKeywordResults[item.keyword] || [])) keywords.add(sub.keyword);
        }
      }
    }

    // 심층 확장 (네이버만)
    if (!isGoogle && showDeepExpandedNaver) {
      for (const item of deepExpandedNaver) keywords.add(item.keyword);
      for (const item of deepExpandedNaver) {
        if (expandedKeywords.has(item.keyword)) {
          for (const sub of (perKeywordResults[item.keyword] || [])) keywords.add(sub.keyword);
        }
      }
    }

    const text = Array.from(keywords).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSection(source);
      setTimeout(() => setCopiedSection(null), 2000);
    });
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
      data: analysisData.data.googleAutocomplete,
    },
    {
      title: '네이버 자동완성',
      color: 'text-[var(--naver)]',
      bgColor: 'bg-[var(--naver)]/10',
      source: 'naver',
      data: analysisData.data.naverAutocomplete,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-3 hover:bg-white/10 rounded-2xl transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          )}
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

        {/* 버튼 그룹 */}
        <div className="flex items-center gap-3">
          {/* CSV 내보내기 버튼 (구글/네이버 별도) */}
          <button
            onClick={() => handleExportCsv('google')}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30"
          >
            <Download size={16} />
            구글 CSV
          </button>
          <button
            onClick={() => handleExportCsv('naver')}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all bg-[var(--naver)]/20 text-[var(--naver)] hover:bg-[var(--naver)]/30 border border-[var(--naver)]/30"
          >
            <Download size={16} />
            네이버 CSV
          </button>

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
      </div>

      {/* 2-Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section, sIdx) => {
          const isGoogle = section.source === 'google';

          // 확장 관련 상태
          const expandedData = isGoogle ? expandedGoogle : expandedNaver;
          const showExpanded = isGoogle ? showExpandedGoogle : showExpandedNaver;
          const handleExpand = isGoogle ? handleExpandGoogle : handleExpandNaver;
          const isExpanding = isGoogle ? googleExpandMutation.isPending : naverExpandMutation.isPending;

          // 검색량 기준 정렬 함수
          const sortByVolume = <T extends { keyword: string }>(data: T[]): T[] => {
            if (!volumesFetched) return data;
            return [...data].sort((a, b) => {
              const volA = getVolume(a.keyword, section.source);
              const volB = getVolume(b.keyword, section.source);
              return volB - volA; // 높은 순
            });
          };

          // 정렬된 데이터
          const sortedSectionData = sortByVolume(section.data);
          const sortedExpandedData = sortByVolume(expandedData);
          const sortedDeepExpandedNaver = !isGoogle ? sortByVolume(deepExpandedNaver) : [];
          const sortedPrefixGoogle = isGoogle ? sortByVolume(prefixGoogle) : [];

          // 통합 정렬 리스트 (검색량 조회 후 모든 키워드를 검색량순으로 정렬)
          const unifiedSortedList = (() => {
            if (!volumesFetched) return [];

            const items: Array<{ keyword: string; badge: string; badgeClass: string; bgClass: string }> = [];

            // 기본 자동완성
            for (const item of section.data) {
              items.push({ keyword: item.keyword, badge: '', badgeClass: '', bgClass: '' });
            }

            // 확장 ㄱ~ㅎ
            if (showExpanded) {
              for (const item of expandedData) {
                items.push({ keyword: item.keyword, badge: item.source, badgeClass: 'bg-[var(--primary)]/20 text-[var(--primary)]', bgClass: 'bg-[var(--primary)]/5' });
              }
            }

            // 수식어 (구글만)
            if (isGoogle && showPrefixGoogle) {
              for (const item of prefixGoogle) {
                items.push({ keyword: item.keyword, badge: '수식어', badgeClass: 'bg-purple-500/20 text-purple-400', bgClass: 'bg-purple-500/5' });
              }
              // 수식어 심층 확장 결과
              for (const item of prefixGoogle) {
                if (expandedKeywords.has(item.keyword)) {
                  for (const sub of (perKeywordResults[item.keyword] || [])) {
                    items.push({ keyword: sub.keyword, badge: sub.source, badgeClass: 'bg-purple-900/30 text-purple-300', bgClass: 'bg-purple-900/10' });
                  }
                }
              }
            }

            // 심층 확장 (네이버만)
            if (!isGoogle && showDeepExpandedNaver) {
              for (const item of deepExpandedNaver) {
                items.push({ keyword: item.keyword, badge: item.source.length > 10 ? item.source.slice(0, 10) + '...' : item.source, badgeClass: 'bg-orange-500/20 text-orange-400', bgClass: 'bg-orange-500/5' });
              }
              // 심층 확장 하위 결과
              for (const item of deepExpandedNaver) {
                if (expandedKeywords.has(item.keyword)) {
                  for (const sub of (perKeywordResults[item.keyword] || [])) {
                    items.push({ keyword: sub.keyword, badge: sub.source, badgeClass: 'bg-orange-900/30 text-orange-300', bgClass: 'bg-orange-900/10' });
                  }
                }
              }
            }

            // 중복 제거
            const seen = new Set<string>();
            const unique = items.filter(item => {
              const key = item.keyword.toLowerCase();
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });

            // 검색량 기준 정렬 (높은 순)
            unique.sort((a, b) => getVolume(b.keyword, section.source) - getVolume(a.keyword, section.source));

            return unique;
          })();

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
                    <Keyboard className={section.color} size={18} />
                  </div>
                  <h3 className="text-sm font-black text-white">{section.title}</h3>
                </div>
                <div className="flex items-center gap-2">
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
                  {/* 구글 수식어 생성 버튼 */}
                  {isGoogle && (
                    <button
                      onClick={handleGenerateModifiers}
                      disabled={modifiersMutation.isPending || isFetchingPrefix}
                      className={`text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded transition-all flex items-center gap-1 ${
                        showPrefixGoogle
                          ? 'bg-purple-500 text-white'
                          : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20'
                      }`}
                    >
                      {modifiersMutation.isPending || isFetchingPrefix ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Wand2 size={10} />
                      )}
                      {prefixGoogle.length > 0
                        ? `수식어 ${prefixGoogle.length}개`
                        : '수식어'}
                      {showPrefixGoogle ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                  )}
                  {/* 네이버 심층 확장 버튼 (Phase 1: 점진적 타이핑) */}
                  {!isGoogle && (
                    <button
                      onClick={handleDeepExpandNaver}
                      disabled={isDeepExpandingNaver}
                      className={`text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded transition-all flex items-center gap-1 ${
                        showDeepExpandedNaver
                          ? 'bg-orange-500 text-white'
                          : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20'
                      }`}
                    >
                      {isDeepExpandingNaver ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Zap size={10} />
                      )}
                      {deepExpandedNaver.length > 0
                        ? `심층 ${deepExpandedNaver.length}개`
                        : '심층 확장'}
                      {showDeepExpandedNaver ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                  )}
                  <button
                    onClick={() => handleCopyKeywords(section.source)}
                    className={`text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded transition-all flex items-center gap-1 ${
                      copiedSection === section.source
                        ? 'bg-green-500 text-white'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                  >
                    {copiedSection === section.source ? (
                      <Check size={10} />
                    ) : (
                      <Copy size={10} />
                    )}
                    {copiedSection === section.source ? '복사됨!' : '키워드 복사'}
                  </button>
                  <span className="text-[10px] font-black bg-white/5 px-2 py-1 rounded-md text-slate-400 border border-white/5">
                    {section.data.length} Results
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {sortedSectionData.length === 0 && sortedExpandedData.length === 0 ? (
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
                      {volumesFetched ? (
                        <>
                          <tr className="bg-emerald-500/10">
                            <td colSpan={2} className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                              전체 키워드 검색량순 - {unifiedSortedList.length}개
                            </td>
                          </tr>
                          {unifiedSortedList.map((item, idx) => (
                            <tr
                              key={`unified-${idx}`}
                              className={`hover:bg-white/[0.04] group transition-all ${item.bgClass}`}
                            >
                              <td className="px-5 py-3">
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2">
                                    {item.badge && (
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.badgeClass}`}>
                                        {item.badge}
                                      </span>
                                    )}
                                    <span className="font-bold text-slate-200 group-hover:text-white transition-colors break-words">
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
                                {getVolume(item.keyword, section.source) > 0
                                  ? getVolume(item.keyword, section.source).toLocaleString()
                                  : '-'}
                              </td>
                            </tr>
                          ))}
                        </>
                      ) : (
                        <>
                      {/* 수식어 자동완성 데이터 (구글만) - 맨 위 */}
                      {isGoogle && showPrefixGoogle && sortedPrefixGoogle.length > 0 && (
                        <>
                          <tr className="bg-purple-500/10">
                            <td colSpan={2} className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-purple-400">
                              수식어 자동완성 - {sortedPrefixGoogle.length}개 {volumesFetched && '(검색량순)'}
                            </td>
                          </tr>
                          {sortedPrefixGoogle.map((item, kIdx) => {
                            const isExpandingItem = expandingKeywords.has(item.keyword);
                            const isExpandedItem = expandedKeywords.has(item.keyword);
                            const subResults = perKeywordResults[item.keyword] || [];
                            const sortedSubResults = volumesFetched
                              ? [...subResults].sort((a, b) => getVolume(b.keyword, 'google') - getVolume(a.keyword, 'google'))
                              : subResults;

                            return (
                              <React.Fragment key={`prefix-${kIdx}`}>
                                <tr className="hover:bg-white/[0.04] group transition-all bg-purple-500/5">
                                  <td className="px-5 py-3">
                                    <div className="flex flex-col gap-1.5">
                                      <span className="font-bold text-slate-200 group-hover:text-white transition-colors break-words">
                                        {item.keyword}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <a
                                          href={`https://www.google.com/search?q=${encodeURIComponent(item.keyword)}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[9px] font-black uppercase tracking-tighter px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all flex items-center gap-1.5"
                                        >
                                          <Globe size={10} /> GOOGLE 검색
                                        </a>
                                        <button
                                          onClick={() => handleExpandSingleKeyword(item.keyword, 'google')}
                                          disabled={isExpandingItem || isExpandedItem}
                                          className={`text-[9px] font-black uppercase tracking-tighter px-2.5 py-1 rounded transition-all flex items-center gap-1.5 ${
                                            isExpandedItem
                                              ? 'bg-purple-500 text-white'
                                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/30'
                                          }`}
                                        >
                                          {isExpandingItem ? (
                                            <Loader2 size={10} className="animate-spin" />
                                          ) : (
                                            <Zap size={10} />
                                          )}
                                          {isExpandedItem ? `확장 ${subResults.length}개` : isExpandingItem ? '확장 중...' : '심층 확장'}
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3 text-right font-mono text-slate-500 text-xs font-medium">
                                    {volumesFetched
                                      ? (getVolume(item.keyword, 'google') > 0
                                          ? getVolume(item.keyword, 'google').toLocaleString()
                                          : '-')
                                      : <span className="text-slate-600">-</span>
                                    }
                                  </td>
                                </tr>
                                {/* 개별 키워드 심층 확장 결과 */}
                                {isExpandedItem && sortedSubResults.map((sub, sIdx) => (
                                  <tr
                                    key={`prefix-${kIdx}-sub-${sIdx}`}
                                    className="hover:bg-white/[0.04] group transition-all bg-purple-900/10"
                                  >
                                    <td className="px-5 py-2 pl-10">
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-purple-900/30 text-purple-300">
                                            {sub.source}
                                          </span>
                                          <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors break-words">
                                            {sub.keyword}
                                          </span>
                                        </div>
                                        <a
                                          href={`https://www.google.com/search?q=${encodeURIComponent(sub.keyword)}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all inline-flex items-center gap-1 w-fit"
                                        >
                                          <Globe size={9} /> GOOGLE
                                        </a>
                                      </div>
                                    </td>
                                    <td className="px-5 py-2 text-right font-mono text-slate-500 text-xs font-medium">
                                      {volumesFetched
                                        ? (getVolume(sub.keyword, 'google') > 0
                                            ? getVolume(sub.keyword, 'google').toLocaleString()
                                            : '-')
                                        : <span className="text-slate-600">-</span>
                                      }
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          })}
                        </>
                      )}

                      {/* 기본 자동완성 데이터 */}
                      {sortedSectionData.map((item, kIdx) => (
                        <tr
                          key={kIdx}
                          className="hover:bg-white/[0.04] group transition-all"
                        >
                          <td className="px-5 py-3">
                            <div className="flex flex-col gap-1.5">
                              <span className="font-bold text-slate-200 group-hover:text-white transition-colors break-words">
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
                      {showExpanded && sortedExpandedData.length > 0 && (
                        <>
                          <tr className="bg-[var(--primary)]/10">
                            <td colSpan={2} className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">
                              확장 자동완성 (ㄱ~ㅎ) - {sortedExpandedData.length}개 {volumesFetched && '(검색량순)'}
                            </td>
                          </tr>
                          {sortedExpandedData.map((item, kIdx) => (
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
                                    <span className="font-bold text-slate-200 group-hover:text-white transition-colors break-words">
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

                      {/* 네이버 심층 확장 데이터 (점진적 타이핑 결과) */}
                      {!isGoogle && showDeepExpandedNaver && sortedDeepExpandedNaver.length > 0 && (
                        <>
                          <tr className="bg-orange-500/10">
                            <td colSpan={2} className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-orange-400">
                              심층 확장 (점진적 타이핑) - {sortedDeepExpandedNaver.length}개
                              {volumesFetched && <span className="ml-2 text-orange-300">(검색량순)</span>}
                            </td>
                          </tr>
                          {sortedDeepExpandedNaver.map((item, kIdx) => {
                            const isExpanding = expandingKeywords.has(item.keyword);
                            const isExpanded = expandedKeywords.has(item.keyword);
                            const subResults = perKeywordResults[item.keyword] || [];
                            const sortedSubResults = volumesFetched
                              ? [...subResults].sort((a, b) => getVolume(b.keyword, 'naver') - getVolume(a.keyword, 'naver'))
                              : subResults;

                            return (
                              <React.Fragment key={`deep-${kIdx}`}>
                                <tr className="hover:bg-white/[0.04] group transition-all bg-orange-500/5">
                                  <td className="px-5 py-3">
                                    <div className="flex flex-col gap-1.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">
                                          {item.source.length > 10 ? item.source.slice(0, 10) + '...' : item.source}
                                        </span>
                                        <span className="font-bold text-slate-200 group-hover:text-white transition-colors break-words">
                                          {item.keyword}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <a
                                          href={`https://search.naver.com/search.naver?query=${encodeURIComponent(item.keyword)}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[9px] font-black uppercase tracking-tighter px-2.5 py-1 rounded bg-[var(--naver)]/10 text-[var(--naver)] border border-[var(--naver)]/20 hover:bg-[var(--naver)] hover:text-white transition-all flex items-center gap-1.5"
                                        >
                                          <Zap size={10} /> NAVER 검색
                                        </a>
                                        <button
                                          onClick={() => handleExpandSingleKeyword(item.keyword)}
                                          disabled={isExpanding || isExpanded}
                                          className={`text-[9px] font-black uppercase tracking-tighter px-2.5 py-1 rounded transition-all flex items-center gap-1.5 ${
                                            isExpanded
                                              ? 'bg-orange-500 text-white'
                                              : 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/30'
                                          }`}
                                        >
                                          {isExpanding ? (
                                            <Loader2 size={10} className="animate-spin" />
                                          ) : (
                                            <Zap size={10} />
                                          )}
                                          {isExpanded ? `확장 ${subResults.length}개` : isExpanding ? '확장 중...' : '심층 확장'}
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3 text-right font-mono text-slate-500 text-xs font-medium">
                                    {volumesFetched
                                      ? (getVolume(item.keyword, 'naver') > 0
                                          ? getVolume(item.keyword, 'naver').toLocaleString()
                                          : '-')
                                      : <span className="text-slate-600">-</span>
                                    }
                                  </td>
                                </tr>
                                {/* 개별 키워드 심층 확장 결과 */}
                                {isExpanded && sortedSubResults.map((sub, sIdx) => (
                                  <tr
                                    key={`deep-${kIdx}-sub-${sIdx}`}
                                    className="hover:bg-white/[0.04] group transition-all bg-orange-900/10"
                                  >
                                    <td className="px-5 py-2 pl-10">
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-orange-900/30 text-orange-300">
                                            {sub.source}
                                          </span>
                                          <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors break-words">
                                            {sub.keyword}
                                          </span>
                                        </div>
                                        <a
                                          href={`https://search.naver.com/search.naver?query=${encodeURIComponent(sub.keyword)}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-[var(--naver)]/10 text-[var(--naver)] border border-[var(--naver)]/20 hover:bg-[var(--naver)] hover:text-white transition-all inline-flex items-center gap-1 w-fit"
                                        >
                                          <Zap size={9} /> NAVER
                                        </a>
                                      </div>
                                    </td>
                                    <td className="px-5 py-2 text-right font-mono text-slate-500 text-xs font-medium">
                                      {volumesFetched
                                        ? (getVolume(sub.keyword, 'naver') > 0
                                            ? getVolume(sub.keyword, 'naver').toLocaleString()
                                            : '-')
                                        : <span className="text-slate-600">-</span>
                                      }
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          })}
                        </>
                      )}
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
