import React from 'react';
import type { GolfClub } from '../types/golf';
import { Layers, X, ArrowRight, Trash2 } from 'lucide-react';

interface FloatingComparisonBarProps {
  comparedClubs: GolfClub[];
  onOpenCompare: () => void;
  onRemoveClub: (clubId: string) => void;
  onClearAll: () => void;
}

export const FloatingComparisonBar: React.FC<FloatingComparisonBarProps> = ({
  comparedClubs,
  onOpenCompare,
  onRemoveClub,
  onClearAll,
}) => {
  if (comparedClubs.length === 0) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[94%] sm:w-[95%] animate-slideUp">
      <div className="bg-emerald-950/95 text-white backdrop-blur-md rounded-2xl p-2.5 sm:p-3.5 shadow-2xl border border-emerald-800/80 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Thumbnail & Club Info */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 overflow-x-auto min-w-0 scrollbar-none">
          <div className="hidden sm:flex items-center space-x-1.5 text-xs font-bold text-emerald-400 pl-1 pr-2 border-r border-emerald-800 shrink-0">
            <Layers className="w-4 h-4" />
            <span>비교함 ({comparedClubs.length}/3)</span>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {comparedClubs.map((club) => (
              <div
                key={club.id}
                className="relative flex items-center bg-emerald-900/90 rounded-lg px-2 py-1 pr-5 sm:px-2.5 sm:py-1.5 sm:pr-6 border border-emerald-700/60 group"
              >
                <span className="text-[11px] sm:text-xs font-bold text-slate-100 max-w-[75px] sm:max-w-[110px] truncate block">
                  {club.name}
                </span>
                <button
                  onClick={() => onRemoveClub(club.id)}
                  className="absolute right-1 sm:right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-400 p-0.5 rounded transition-all"
                  title="제거"
                >
                  <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          <button
            onClick={onClearAll}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-emerald-900 transition-all text-xs"
            title="비교함 비우기"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={onOpenCompare}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm flex items-center space-x-1 sm:space-x-1.5 shadow-md shadow-emerald-500/20 transition-all whitespace-nowrap"
          >
            <span>비교하기</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
