import React from 'react';
import { Flag, Layers, Compass, MapPin } from 'lucide-react';

interface NavbarProps {
  viewMode: 'list' | 'map';
  setViewMode: (mode: 'list' | 'map') => void;
  compareCount: number;
  onOpenCompare: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  setViewMode,
  compareCount,
  onOpenCompare,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-xs">
            <Flag className="w-4 h-4 fill-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1 sm:space-x-1.5">
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">골프모아</span>
              <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold tracking-wider">GOLFMOA</span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">전국 골프장 스펙 비교 & 실시간 요금 시뮬레이터</p>
          </div>
        </div>

        {/* View Toggle & Compare Button */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          {/* View Mode Switcher */}
          <div className="bg-slate-100 p-0.5 sm:p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="sm:inline hidden">목록 보기</span>
              <span className="sm:hidden text-[11px]">목록</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center space-x-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="sm:inline hidden">지도 탐색</span>
              <span className="sm:hidden text-[11px]">지도</span>
            </button>
          </div>

          {/* Quick Compare Button */}
          <button
            onClick={onOpenCompare}
            className={`relative flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              compareCount > 0
                ? 'bg-emerald-700 text-white shadow-xs hover:bg-emerald-800'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="sm:inline hidden">스펙 비교</span>
            <span className="sm:hidden text-[11px]">비교</span>
            {compareCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 text-[10px] sm:text-xs bg-white text-emerald-800 font-black rounded-full">
                {compareCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

