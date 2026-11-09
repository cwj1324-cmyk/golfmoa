import React from 'react';
import { THEME_PRESETS } from '../data/golfClubs';
import { Target, Trees, Wallet, Moon, Trophy, Sparkles } from 'lucide-react';

interface ThemeCardsProps {
  selectedThemeId: string | null;
  onSelectTheme: (themeId: string | null) => void;
}

const THEME_ICONS: Record<string, React.FC<{ className?: string }>> = {
  beginner: Target,
  'cool-grass': Trees,
  'cost-effective': Wallet,
  'night-golf': Moon,
  tournament: Trophy,
};

export const ThemeCards: React.FC<ThemeCardsProps> = ({
  selectedThemeId,
  onSelectTheme,
}) => {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* 'All' button */}
        <button
          onClick={() => onSelectTheme(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${selectedThemeId === null
              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>전체 골프장</span>
        </button>

        {/* Theme Pills */}
        {THEME_PRESETS.map((theme) => {
          const isSelected = selectedThemeId === theme.id;
          const Icon = THEME_ICONS[theme.id] || Target;

          return (
            <button
              key={theme.id}
              onClick={() => onSelectTheme(isSelected ? null : theme.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${isSelected
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`} />
              <span>{theme.badge}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
