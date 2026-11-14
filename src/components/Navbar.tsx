import React from 'react';
import { Flag } from 'lucide-react';

export type ViewMode = 'cards' | 'list' | 'map';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div
          className="flex items-center space-x-2 sm:space-x-3 cursor-pointer shrink-0"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-xs">
            <Flag className="w-4 h-4 fill-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1 sm:space-x-1.5">
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">골프모아</span>
              <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold tracking-wider">
                GOLFMOA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              전국 골프장 스펙 비교 & 참여형 코스 정보
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
