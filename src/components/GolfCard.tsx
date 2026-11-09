import React from 'react';
import type { GolfClub } from '../types/golf';
import { calculateCostPerPerson, formatPrice, predictFieldScore } from '../utils/calculator';
import { Star, Clock, MapPin, Layers, Check, ChevronRight } from 'lucide-react';

interface GolfCardProps {
  club: GolfClub;
  isCompared: boolean;
  onToggleCompare: (club: GolfClub) => void;
  onSelectClub: (club: GolfClub) => void;
  userAvgScore?: number;
}

export const GolfCard: React.FC<GolfCardProps> = ({
  club,
  isCompared,
  onToggleCompare,
  onSelectClub,
  userAvgScore = 90,
}) => {
  const weekdayCost = calculateCostPerPerson(club, false, 4, true);
  const pred = predictFieldScore(club.difficultyIndex.slopeRating, club.difficultyIndex.courseRating, userAvgScore);

  return (
    <div
      onClick={() => onSelectClub(club)}
      className={`bg-white rounded-2xl border transition-all duration-150 overflow-hidden flex flex-col justify-between cursor-pointer group hover:border-slate-400 hover:shadow-md ${
        isCompared ? 'border-emerald-700 ring-1 ring-emerald-700 shadow-sm' : 'border-slate-200/90 shadow-2xs'
      }`}
    >
      {/* Top Image Section */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <img
          src={club.imageUrl}
          alt={club.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Region & Time Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center space-x-1">
          <span className="px-2 py-0.5 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold rounded-md flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-400" />
            {club.region}
          </span>
          <span className="px-2 py-0.5 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium rounded-md flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-300" />
            서울 {club.drivingTimeFromSeoul}분
          </span>
        </div>

        {/* Compare Checkbox Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCompare(club);
          }}
          className={`absolute top-2.5 right-2.5 px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm ${
            isCompared
              ? 'bg-emerald-700 text-white'
              : 'bg-white/95 text-slate-700 hover:bg-white'
          }`}
        >
          {isCompared ? (
            <>
              <Check className="w-3 h-3 stroke-[3]" />
              <span>비교중</span>
            </>
          ) : (
            <>
              <Layers className="w-3 h-3" />
              <span>비교</span>
            </>
          )}
        </button>

        {/* Bottom Title on Image */}
        <div className="absolute bottom-2.5 left-3 right-3 text-white flex items-end justify-between">
          <h3 className="text-base font-extrabold tracking-tight drop-shadow-xs line-clamp-1">
            {club.name}
          </h3>
          <div className="flex items-center space-x-1 text-xs shrink-0 text-amber-300 font-bold drop-shadow-xs">
            <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>{club.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Middle Content Section (Clean 2-row layout) */}
      <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
        {/* Row 1: Key Spec Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
            {club.grass.fairway.includes('양잔디') ? '양잔디' : '조선잔디'}
          </span>
          <span className={`px-2 py-0.5 rounded font-bold ${
            club.difficultyIndex.slopeRating >= 135
              ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
              : club.difficultyIndex.slopeRating <= 118
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
              : 'bg-slate-100 text-slate-700'
          }`}>
            슬로프 {club.difficultyIndex.slopeRating}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
            {club.holes}홀
          </span>
          {club.playOptions.noCaddieAllowed && (
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">
              노캐디
            </span>
          )}
          {club.playOptions.nightPlay && (
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 font-medium">
              야간 3부
            </span>
          )}
        </div>

        {/* Row 2: Price & Score Prediction Grid */}
        <div className="pt-2 border-t border-slate-100 flex items-end justify-between">
          {/* Price */}
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">
              1인 실부담 (카트+캐디 포함)
            </span>
            <div className="flex items-baseline space-x-1">
              <span className="text-base sm:text-lg font-black text-slate-900">
                {formatPrice(weekdayCost.totalPerPerson)}
              </span>
              <span className="text-[10px] text-slate-400">/ 1인</span>
            </div>
          </div>

          {/* User Score Prediction */}
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-medium">
              내 예상 타수 ({userAvgScore}타 기준)
            </span>
            <div className="flex items-baseline justify-end space-x-1">
              <span className="text-sm font-black text-slate-800">
                {pred.expectedScore}타
              </span>
              <span className={`text-[11px] font-bold ${pred.diffFromAverage > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                ({pred.diffFromAverage > 0 ? `+${pred.diffFromAverage}` : pred.diffFromAverage})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-400">
          그린피 {formatPrice(club.pricing.weekdayGreenFee)}~
        </span>

        <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
          <a
            href={`https://golf.kakao.com/search?keyword=${encodeURIComponent(club.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            title="카카오골프 실시간 가격 조회"
            className="w-6 h-6 bg-[#FEE500] hover:bg-[#FADA0A] text-slate-900 rounded-md text-[10px] font-black transition-all flex items-center justify-center shadow-2xs shrink-0"
          >
            K
          </a>
          <button
            onClick={() => onSelectClub(club)}
            className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-800 rounded-md text-xs font-semibold transition-all flex items-center gap-0.5 shadow-2xs group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900"
          >
            <span>요금·스펙 상세</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
