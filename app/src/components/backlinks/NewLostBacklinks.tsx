'use client';

import React, { useMemo } from 'react';
import { Loader2, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNewLostBacklinks } from '@/lib/hooks/useBacklinkAnalysis';
import InfoTooltip from './InfoTooltip';

interface NewLostBacklinksProps {
  target: string | null;
}

function DualBarChart({ data, width = 800, height = 300 }: {
  data: { date: string; new_backlinks: number; lost_backlinks: number }[];
  width?: number;
  height?: number;
}) {
  const chart = useMemo(() => {
    if (data.length === 0) return null;

    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxVal = Math.max(
      ...data.map(d => Math.max(d.new_backlinks ?? 0, d.lost_backlinks ?? 0)),
      1
    );

    const barGroupWidth = chartWidth / data.length;
    const barWidth = barGroupWidth * 0.35;
    const gap = barGroupWidth * 0.05;

    const bars = data.map((d, i) => {
      const groupX = padding.left + i * barGroupWidth;
      return {
        newBar: {
          x: groupX + gap,
          y: padding.top + chartHeight - ((d.new_backlinks ?? 0) / maxVal) * chartHeight,
          width: barWidth,
          height: ((d.new_backlinks ?? 0) / maxVal) * chartHeight,
          value: d.new_backlinks ?? 0,
        },
        lostBar: {
          x: groupX + barWidth + gap * 2,
          y: padding.top + chartHeight - ((d.lost_backlinks ?? 0) / maxVal) * chartHeight,
          width: barWidth,
          height: ((d.lost_backlinks ?? 0) / maxVal) * chartHeight,
          value: d.lost_backlinks ?? 0,
        },
        labelX: groupX + barGroupWidth / 2,
        label: new Date(d.date).toLocaleDateString('ko-KR', { month: 'short' }),
      };
    });

    // Y축 눈금
    const yTicks = 5;
    const yLines = Array.from({ length: yTicks + 1 }, (_, i) => ({
      value: Math.round((maxVal / yTicks) * i),
      y: padding.top + chartHeight - (i / yTicks) * chartHeight,
    }));

    return { bars, yLines, padding, chartWidth, chartHeight };
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

      {/* 바 */}
      {chart.bars.map((bar, i) => (
        <g key={i}>
          <rect
            x={bar.newBar.x}
            y={bar.newBar.y}
            width={bar.newBar.width}
            height={Math.max(bar.newBar.height, 1)}
            fill="#10b981"
            rx="3"
          />
          <rect
            x={bar.lostBar.x}
            y={bar.lostBar.y}
            width={bar.lostBar.width}
            height={Math.max(bar.lostBar.height, 1)}
            fill="#ef4444"
            rx="3"
          />
          <text
            x={bar.labelX}
            y={height - 8}
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontSize="10"
          >
            {bar.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function NewLostBacklinks({ target }: NewLostBacklinksProps) {
  const { data, isLoading, error } = useNewLostBacklinks(target);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
        <span className="ml-3 text-[var(--text-secondary)]">신규/손실 데이터 로딩 중...</span>
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
        신규/손실 백링크 데이터가 없습니다.
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalNew = sortedData.reduce((s, d) => s + (d.new_backlinks ?? 0), 0);
  const totalLost = sortedData.reduce((s, d) => s + (d.lost_backlinks ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <ArrowUpRight size={18} />
            <span className="text-sm flex items-center">총 신규 백링크<InfoTooltip text="선택 기간 동안 새로 발견된 백링크의 총 합계입니다. 꾸준한 신규 백링크 유입은 사이트가 성장하고 있다는 긍정적 신호입니다." /></span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">+{totalNew.toLocaleString()}</div>
        </div>
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <ArrowDownRight size={18} />
            <span className="text-sm flex items-center">총 손실 백링크<InfoTooltip text="선택 기간 동안 사라진(삭제/접속불가) 백링크의 총 합계입니다. 일부 손실은 자연스럽지만, 신규보다 손실이 더 많으면 백링크 프로필이 약화되고 있다는 경고 신호입니다." /></span>
          </div>
          <div className="text-2xl font-bold text-red-400">-{totalLost.toLocaleString()}</div>
        </div>
      </div>

      {/* 차트 */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">신규 vs 손실 백링크<InfoTooltip text="월별 신규(초록) 백링크와 손실(빨강) 백링크를 비교한 차트입니다. 초록 바가 빨강 바보다 꾸준히 높으면 백링크 프로필이 성장하고 있는 것입니다. 반대라면 백링크가 줄어들고 있으므로 원인 파악이 필요합니다." /></h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-[var(--text-secondary)]">신규</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500" />
              <span className="text-[var(--text-secondary)]">손실</span>
            </div>
          </div>
        </div>
        <DualBarChart data={sortedData} />
      </div>

      {/* 데이터 테이블 */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <th className="text-left px-4 py-3 font-medium"><div className="flex items-center">날짜<InfoTooltip text="백링크 변동이 기록된 날짜입니다. 보통 월 단위로 데이터가 제공됩니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium text-emerald-400"><div className="flex items-center justify-center">+신규 백링크<InfoTooltip text="해당 기간에 새로 발견된 백링크 수입니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium text-red-400"><div className="flex items-center justify-center">-손실 백링크<InfoTooltip text="해당 기간에 사라진 백링크 수입니다. 출처 페이지 삭제, 링크 제거, 사이트 폐쇄 등이 원인입니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium text-emerald-400"><div className="flex items-center justify-center">+신규 도메인<InfoTooltip text="해당 기간에 새롭게 이 사이트에 링크를 건 고유 도메인 수입니다. 새로운 도메인에서 링크가 오면 백링크 다양성이 향상됩니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium text-red-400"><div className="flex items-center justify-center">-손실 도메인<InfoTooltip text="해당 기간에 더 이상 링크를 보내지 않게 된 고유 도메인 수입니다." /></div></th>
                <th className="text-center px-4 py-3 font-medium"><div className="flex items-center justify-center">순변동<InfoTooltip text="신규 백링크에서 손실 백링크를 뺀 순수 증감분입니다. 양수(+, 초록)면 백링크가 늘고 있고, 음수(-, 빨강)면 줄고 있는 것입니다." /></div></th>
              </tr>
            </thead>
            <tbody>
              {sortedData.slice().reverse().map((item, i) => {
                const net = (item.new_backlinks ?? 0) - (item.lost_backlinks ?? 0);
                return (
                  <tr key={i} className="border-b border-[var(--border)]/50 hover:bg-[var(--border)]/30 transition-colors">
                    <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-center text-emerald-400">+{(item.new_backlinks ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center text-red-400">-{(item.lost_backlinks ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center text-emerald-400">+{item.new_referring_domains?.toLocaleString() || 0}</td>
                    <td className="px-4 py-3 text-center text-red-400">-{item.lost_referring_domains?.toLocaleString() || 0}</td>
                    <td className={`px-4 py-3 text-center font-medium ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {net >= 0 ? '+' : ''}{net.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
