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
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[95%] animate-slideUp">
      <div className="bg-slate-900/95 text-white backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-slate-700/60 flex items-center justify-between gap-3">
        {/* Left: Thumbnail & Club Info */}
        <div className="flex items-center space-x-2.5 overflow-x-auto">
          <div className="hidden sm:flex items-center space-x-1.5 text-xs font-bold text-emerald-400 pl-1 pr-2 border-r border-slate-700">
            <Layers className="w-4 h-4" />
            <span>비교함 ({comparedClubs.length}/3)</span>
          </div>

          <div className="flex items-center space-x-2">
            {comparedClubs.map((club) => (
              <div
                key={club.id}
                className="relative flex items-center space-x-1.5 bg-slate-800/90 rounded-lg px-2.5 py-1.5 pr-6 border border-slate-700/80 group"
              >
                <span className="text-xs font-bold text-slate-100 max-w-[110px] truncate">
                  {club.name}
                </span>
                <button
                  onClick={() => onRemoveClub(club.id)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-400 p-0.5 rounded transition-all"
                  title="제거"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onClearAll}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-all text-xs"
            title="비교함 비우기"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenCompare}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all"
          >
            <span>비교하기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
