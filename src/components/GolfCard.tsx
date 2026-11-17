import React from 'react';
import type { GolfClub } from '../types/golf';
import { calculateCostPerPerson, predictFieldScore } from '../utils/calculator';
import { getClubRatingStats } from '../utils/wikiStorage';
import { getClubMetaLine, getClubTraits } from '../utils/clubDisplay';
import { Star, Check } from 'lucide-react';

interface GolfCardProps {
  club: GolfClub;
  isCompared: boolean;
  onToggleCompare: (club: GolfClub) => void;
  onSelectClub: (club: GolfClub) => void;
  userAvgScore?: number;
  /** 지도·목록 분할(안 B)에서 지도 핀과 연동해 강조할 때 */
  isHighlighted?: boolean;
  onHover?: (clubId: string | null) => void;
}

/** 비교 담기 체크박스 (다나와식) */
export const CompareCheck: React.FC<{ checked: boolean; onToggle: () => void; name: string }> = ({
  checked,
  onToggle,
  name,
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={`${name} 비교에 ${checked ? '담김' : '담기'}`}
    title={checked ? '비교에서 빼기' : '비교에 담기 (최대 3곳)'}
    onClick={(e) => {
      e.stopPropagation();
      onToggle();
    }}
    className={`w-[18px] h-[18px] shrink-0 rounded-[5px] border-[1.5px] inline-flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 ${
      checked ? 'bg-emerald-700 border-emerald-700' : 'bg-white border-slate-400 hover:border-slate-700'
    }`}
  >
    {checked && <Check className="w-3 h-3 text-white stroke-[3.5]" />}
  </button>
);

export const TraitChips: React.FC<{ club: GolfClub; max?: number }> = ({ club, max }) => {
  const traits = getClubTraits(club);
  const shown = max ? traits.slice(0, max) : traits;
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((t) => (
        <span
          key={t.label}
          className={`px-1.5 py-0.5 rounded text-[11px] font-semibold border whitespace-nowrap ${
            t.tone === 'save'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          {t.label}
        </span>
      ))}
    </div>
  );
};

export const GolfCard: React.FC<GolfCardProps> = ({
  club,
  isCompared,
  onToggleCompare,
  onSelectClub,
  userAvgScore = 90,
  isHighlighted = false,
  onHover,
}) => {
  const weekdayCost = calculateCostPerPerson(club, false, 4, true);
  const pred = predictFieldScore(club.difficultyIndex?.slopeRating, club.difficultyIndex?.courseRating, userAvgScore);
  const ratingStats = getClubRatingStats(club.id);

  return (
    <div
      onClick={() => onSelectClub(club)}
      onMouseEnter={onHover ? () => onHover(club.id) : undefined}
      onMouseLeave={onHover ? () => onHover(null) : undefined}
      data-club-id={club.id}
      className={`bg-white rounded-xl border p-4 flex flex-col cursor-pointer transition-[border-color,box-shadow] duration-150 ${
        isCompared
          ? 'border-emerald-700 ring-1 ring-emerald-700'
          : isHighlighted
            ? 'border-slate-900 ring-1 ring-slate-900'
            : 'border-slate-200 hover:border-slate-400'
      }`}
    >
      {/* 층 1: 이름 · 지역/유형 · 예상 타수 */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-bold text-slate-900 tracking-tight truncate">{club.name}</h3>
            <CompareCheck checked={isCompared} onToggle={() => onToggleCompare(club)} name={club.name} />
          </div>
          <p className="mt-0.5 text-xs text-slate-500 truncate">
            {getClubMetaLine(club)}
            {ratingStats.rating !== null && (
              <span className="ml-1.5 inline-flex items-center gap-0.5 text-slate-700 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {ratingStats.rating}
                <span className="text-slate-400 font-normal">({ratingStats.reviewCount})</span>
              </span>
            )}
          </p>
        </div>
        {!pred.isUnrated && (
          <div className="text-right shrink-0">
            <div className="text-xl font-bold text-slate-900 leading-none tabular-nums">{pred.expectedScore}</div>
            <div className="text-[10.5px] text-slate-500 mt-1 whitespace-nowrap">내 예상 타수</div>
          </div>
        )}
      </div>

      {/* 층 2: 확인된 특징만 */}
      <div className="mt-3">
        <TraitChips club={club} />
      </div>

      {/* 층 3: 1인 비용 */}
      <div className="mt-3 pt-2.5 border-t border-dashed border-slate-200 flex items-center justify-between text-xs">
        <span className="text-slate-500">1인 · 4인 주중</span>
        <span className="text-[15px] font-bold text-slate-900 tabular-nums">
          {weekdayCost.totalPerPerson.toLocaleString('ko-KR')}원~
        </span>
      </div>
    </div>
  );
};
