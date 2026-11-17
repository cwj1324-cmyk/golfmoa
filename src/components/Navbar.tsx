import React from 'react';
import { Flag } from 'lucide-react';
import { UI_VARIANTS, type UiVariant } from '../utils/uiVariants';

export type { UiVariant };

export type ViewMode = 'cards' | 'list' | 'map';

interface NavbarProps {
  variant?: UiVariant;
  onChangeVariant?: (v: UiVariant) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ variant, onChangeVariant }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div
          className="flex items-center space-x-2 sm:space-x-3 cursor-pointer shrink-0"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-800 flex items-center justify-center text-white">
            <Flag className="w-4 h-4 fill-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1 sm:space-x-1.5">
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">골프모아</span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">전국 골프장 스펙 비교 & 참여형 코스 정보</p>
          </div>
        </div>

        {/* 화면 안 선택 */}
        {variant && onChangeVariant && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="hidden lg:inline text-[11px] font-semibold text-slate-400">화면 안</span>
            <div role="radiogroup" aria-label="화면 안 선택" className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg">
              {UI_VARIANTS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={variant === v.id}
                  title={v.desc}
                  onClick={() => onChangeVariant(v.id)}
                  className={`h-8 px-2.5 sm:px-3 rounded-md text-xs whitespace-nowrap transition-colors ${
                    variant === v.id ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-900 font-medium'
                  }`}
                >
                  <span className="sm:hidden">{v.short}</span>
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
