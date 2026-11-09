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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-9 h-9 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-xs">
            <Flag className="w-4 h-4 fill-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-lg font-black tracking-tight text-slate-900">골프모아</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold tracking-wider">GOLFMOA</span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">전국 골프장 스펙 비교 & 실시간 요금 시뮬레이터</p>
          </div>
        </div>

        {/* View Toggle & Compare Button */}
        <div className="flex items-center space-x-3">
          {/* View Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-emerald-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>목록 보기</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-emerald-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>지도 탐색</span>
            </button>
          </div>

          {/* Quick Compare Button */}
          <button
            onClick={onOpenCompare}
            className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              compareCount > 0
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>스펙 비교</span>
            {compareCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-white text-emerald-700 font-extrabold rounded-full">
                {compareCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

