'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
  className?: string;
}

export default function InfoTooltip({ text, className = '' }: InfoTooltipProps) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    if (show) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [show]);

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setShow(!show); }}
        className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors ml-1"
        type="button"
      >
        <HelpCircle size={13} />
      </button>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl text-xs text-[var(--text-secondary)] leading-relaxed whitespace-normal text-left font-normal">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] w-2.5 h-2.5 rotate-45 bg-[var(--surface)] border-r border-b border-[var(--border)]" />
        </div>
      )}
    </div>
  );
}
