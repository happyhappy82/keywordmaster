'use client';

import React, { useMemo } from 'react';
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { useBacklinkHistory } from '@/lib/hooks/useBacklinkAnalysis';
import InfoTooltip from './InfoTooltip';

interface HistoryChartProps {
  target: string | null;
}

function LineChart({ data, width = 800, height = 300 }: {
  data: { date: string; backlinks: number; referring_domains: number }[];
  width?: number;
  height?: number;
}) {
  const chart = useMemo(() => {
    if (data.length === 0) return null;

    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxBacklinks = Math.max(...data.map(d => d.backlinks ?? 0), 1);
    const maxDomains = Math.max(...data.map(d => d.referring_domains ?? 0), 1);

    const xStep = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

    const backlinkPoints = data.map((d, i) => ({
      x: padding.left + (data.length > 1 ? i * xStep : chartWidth / 2),
      y: padding.top + chartHeight - ((d.backlinks ?? 0) / maxBacklinks) * chartHeight,
    }));

    const domainPoints = data.map((d, i) => ({
      x: padding.left + (data.length > 1 ? i * xStep : chartWidth / 2),
      y: padding.top + chartHeight - ((d.referring_domains ?? 0) / maxDomains) * chartHeight,
    }));

    const backlinkPath = backlinkPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const domainPath = domainPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    // 면적 채우기 경로
    const backlinkArea = `${backlinkPath} L ${backlinkPoints[backlinkPoints.length - 1].x} ${padding.top + chartHeight} L ${backlinkPoints[0].x} ${padding.top + chartHeight} Z`;

    // Y축 눈금선
    const yTicks = 5;
    const yLines = Array.from({ length: yTicks + 1 }, (_, i) => {
      const value = Math.round((maxBacklinks / yTicks) * i);
      const y = padding.top + chartHeight - (i / yTicks) * chartHeight;
      return { value, y };
    });

    // X축 라벨 (최대 6개)
    const labelStep = Math.max(1, Math.floor(data.length / 6));
    const xLabels = data.filter((_, i) => i % labelStep === 0 || i === data.length - 1).map((d, idx, arr) => {
      const originalIndex = data.indexOf(d);
      return {
        label: new Date(d.date).toLocaleDateString('ko-KR', { month: 'short', year: '2-digit' }),
        x: padding.left + (data.length > 1 ? originalIndex * xStep : chartWidth / 2),
      };
    });

    return { backlinkPath, domainPath, backlinkArea, backlinkPoints, domainPoints, yLines, xLabels, padding, chartWidth, chartHeight, maxBacklinks };
  }, [data, width, height]);

  if (!chart) return null;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Y축 눈금선 */}
      {chart.yLines.map((tick, i) => (
        <g key={i}>
          <line
            x1={chart.padding.left}
            y1={tick.y}
            x2={chart.padding.left + chart.chartWidth}
            y2={tick.y}
            stroke="var(--border)"
            strokeDasharray={i === 0 ? 'none' : '4 4'}
          />
          <text x={chart.padding.left - 8} y={tick.y + 4} textAnchor="end" fill="var(--text-secondary)" fontSize="10">
            {tick.value >= 1000 ? `${(tick.value / 1000).toFixed(0)}K` : tick.value}
          </text>
        </g>
      ))}

      {/* X축 라벨 */}
      {chart.xLabels.map((label, i) => (
        <text key={i} x={label.x} y={height - 8} textAnchor="middle" fill="var(--text-secondary)" fontSize="10">
          {label.label}
        </text>
      ))}

      {/* 백링크 면적 */}
      <path d={chart.backlinkArea} fill="var(--primary)" opacity="0.1" />

      {/* 백링크 라인 */}
      <path d={chart.backlinkPath} fill="none" stroke="var(--primary)" strokeWidth="2" />

      {/* 참조도메인 라인 */}
      <path d={chart.domainPath} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="6 3" />

      {/* 데이터 포인트 */}
      {chart.backlinkPoints.map((p, i) => (
        <circle key={`b-${i}`} cx={p.x} cy={p.y} r="3" fill="var(--primary)" />
      ))}
      {chart.domainPoints.map((p, i) => (
        <circle key={`d-${i}`} cx={p.x} cy={p.y} r="3" fill="#10b981" />
      ))}
    </svg>
  );
}

export default function HistoryChart({ target }: HistoryChartProps) {
  const { data, isLoading, error } = useBacklinkHistory(target);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
        <span className="ml-3 text-[var(--text-secondary)]">히스토리 로딩 중...</span>
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

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-20 text-[var(--text-secondary)]">
        히스토리 데이터가 없습니다.
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      {/* 차트 */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp size={18} className="text-[var(--primary)]" />
            백링크 히스토리
            <InfoTooltip text="시간에 따른 백링크 수와 참조 도메인 수의 변화 추이입니다. 실선(파랑)이 총 백링크 수, 점선(초록)이 참조 도메인 수입니다. 꾸준히 우상향하는 그래프가 이상적이며, 급격한 증가나 감소는 스팸 링크 유입이나 링크 삭제를 의미할 수 있습니다." />
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[var(--primary)]" />
              <span className="text-[var(--text-secondary)]">백링크</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 border-dashed" style={{ borderTop: '2px dashed #10b981', height: 0 }} />
              <span className="text-[var(--text-secondary)]">참조 도메인</span>
            </div>
          </div>
        </div>
        <LineChart data={sortedData} />
      </div>

      {/* 데이터 테이블 */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <th className="text-left px-4 py-3 font-medium"><div className="flex items-center">날짜<InfoTooltip text="DataForSEO가 해당 도메인의 백링크 현황을 기록한 날짜입니다. 보통 월 단위로 스냅샷이 저장됩니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium"><div className="flex items-center justify-center">Rank<InfoTooltip text="해당 시점의 도메인 권위 점수입니다 (0~1,000). 시간에 따라 Rank가 어떻게 변하는지 추적할 수 있습니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium"><div className="flex items-center justify-center">백링크<InfoTooltip text="해당 시점의 총 백링크 수입니다. 이전 달과 비교하여 증감을 파악할 수 있습니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium"><div className="flex items-center justify-center">참조 도메인<InfoTooltip text="해당 시점의 총 참조 도메인 수입니다. 백링크 수보다 참조 도메인 수의 증가가 SEO에 더 의미 있습니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium text-emerald-400"><div className="flex items-center justify-center">+신규<InfoTooltip text="해당 기간에 새로 발견된 백링크 수입니다. 양질의 콘텐츠나 마케팅 활동의 결과로 신규 백링크가 꾸준히 늘어나는 것이 이상적입니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium text-red-400"><div className="flex items-center justify-center">-손실<InfoTooltip text="해당 기간에 사라진(삭제되거나 접속 불가된) 백링크 수입니다. 자연적으로 일부 손실은 정상이지만, 대량 손실은 출처 사이트의 폐쇄나 링크 정리를 의미할 수 있습니다." /></div></th>
              </tr>
            </thead>
            <tbody>
              {sortedData.slice().reverse().map((item, i) => (
                <tr key={i} className="border-b border-[var(--border)]/50 hover:bg-[var(--border)]/30 transition-colors">
                  <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                    {new Date(item.date).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{item.rank}</td>
                  <td className="px-4 py-3 text-center">{item.backlinks?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">{item.referring_domains?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center text-emerald-400">+{item.new_backlinks?.toLocaleString() || 0}</td>
                  <td className="px-4 py-3 text-center text-red-400">-{item.lost_backlinks?.toLocaleString() || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
