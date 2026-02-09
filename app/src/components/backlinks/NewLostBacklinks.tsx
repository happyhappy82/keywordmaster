'use client';

import React, { useMemo } from 'react';
import { Loader2, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNewLostBacklinks } from '@/lib/hooks/useBacklinkAnalysis';

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
      ...data.map(d => Math.max(d.new_backlinks, d.lost_backlinks)),
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
          y: padding.top + chartHeight - (d.new_backlinks / maxVal) * chartHeight,
          width: barWidth,
          height: (d.new_backlinks / maxVal) * chartHeight,
          value: d.new_backlinks,
        },
        lostBar: {
          x: groupX + barWidth + gap * 2,
          y: padding.top + chartHeight - (d.lost_backlinks / maxVal) * chartHeight,
          width: barWidth,
          height: (d.lost_backlinks / maxVal) * chartHeight,
          value: d.lost_backlinks,
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

  const totalNew = sortedData.reduce((s, d) => s + d.new_backlinks, 0);
  const totalLost = sortedData.reduce((s, d) => s + d.lost_backlinks, 0);

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <ArrowUpRight size={18} />
            <span className="text-sm">총 신규 백링크</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">+{totalNew.toLocaleString()}</div>
        </div>
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <ArrowDownRight size={18} />
            <span className="text-sm">총 손실 백링크</span>
          </div>
          <div className="text-2xl font-bold text-red-400">-{totalLost.toLocaleString()}</div>
        </div>
      </div>

      {/* 차트 */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">신규 vs 손실 백링크</h3>
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
                <th className="text-left px-4 py-3 font-medium">날짜</th>
                <th className="text-center px-4 py-3 font-medium text-emerald-400">+신규 백링크</th>
                <th className="text-center px-4 py-3 font-medium text-red-400">-손실 백링크</th>
                <th className="text-center px-4 py-3 font-medium text-emerald-400">+신규 도메인</th>
                <th className="text-center px-4 py-3 font-medium text-red-400">-손실 도메인</th>
                <th className="text-center px-4 py-3 font-medium">순변동</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.slice().reverse().map((item, i) => {
                const net = item.new_backlinks - item.lost_backlinks;
                return (
                  <tr key={i} className="border-b border-[var(--border)]/50 hover:bg-[var(--border)]/30 transition-colors">
                    <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-center text-emerald-400">+{item.new_backlinks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center text-red-400">-{item.lost_backlinks.toLocaleString()}</td>
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
