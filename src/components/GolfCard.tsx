import React from 'react';
import type { GolfClub } from '../types/golf';
import { calculateCostPerPerson, formatPrice, predictFieldScore } from '../utils/calculator';
import { Star, MapPin, Check, Plus, ChevronRight } from 'lucide-react';

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
  const pred = predictFieldScore(club.difficultyIndex?.slopeRating, club.difficultyIndex?.courseRating, userAvgScore);

  const isNoMat = club.teeBoxMatRatio?.includes('매트 없음');
  const isMixedMat = club.teeBoxMatRatio?.includes('일부 매트') || club.teeBoxMatRatio?.includes('매트 비율 높음');
  const isYangGrass = club.grass.fairway.includes('양잔디');
  const isFlat = club.courseStyle.includes('구릉') || club.courseStyle.includes('링크스') || club.courseStyle.includes('평지');
  const isNightLed = club.playOptions.nightPlay && club.playOptions.lightingType.includes('LED');

  return (
    <div
      onClick={() => onSelectClub(club)}
      className={`bg-white rounded-xl border transition-all duration-150 p-4 flex flex-col justify-between cursor-pointer group hover:border-slate-400 hover:shadow-xs ${isCompared ? 'border-emerald-700 ring-1 ring-emerald-700 bg-emerald-50/20' : 'border-slate-200 shadow-2xs'
        }`}
    >
      <div>
        {/* 1. Header: Name, Hole Count, Region, Travel Time & Compare Checkbox */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate group-hover:text-emerald-800 transition-colors">
                {club.name}
              </h3>
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                {club.courseType.replace('대중제+회원제', '대중/회원')} {club.holes}홀
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] sm:text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 font-medium text-slate-600 shrink-0">
                <MapPin className="w-3 h-3 text-slate-400" />
                {club.region} ({club.address.split(' ')[0] || club.region})
              </span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center text-amber-500 font-bold shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                {club.rating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Compare Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(club);
            }}
            className={`shrink-0 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all border ${isCompared
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            title="1:1 조건 비교함에 담기"
          >
            {isCompared ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden sm:inline">비교중</span>
                <span className="sm:hidden text-[11px]">비교중</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">조건 비교</span>
                <span className="sm:hidden text-[11px]">비교</span>
              </>
            )}
          </button>
        </div>

        {/* 2. Structured 4-Column Condition Strip (Disciplined Grid with Guaranteed Single-Line Alignment) */}
        <div className="grid grid-cols-4 gap-1 my-2.5 sm:my-3 p-1.5 sm:p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
          {/* Slot 1: 티박스 */}
          <div className="py-0.5 flex flex-col justify-center items-center min-w-0">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block whitespace-nowrap">티박스</span>
            <span className={`text-[10px] sm:text-[11px] font-bold block mt-0.5 whitespace-nowrap truncate w-full px-0.5 ${isNoMat ? 'text-emerald-800' : isMixedMat ? 'text-slate-700' : 'text-slate-400'}`}>
              {isNoMat ? '100% 잔디' : isMixedMat ? '매트 혼용' : '미확인'}
            </span>
          </div>

          {/* Slot 2: 잔디 */}
          <div className="py-0.5 border-l border-slate-200/60 flex flex-col justify-center items-center min-w-0">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block whitespace-nowrap">페어웨이</span>
            <span className={`text-[10px] sm:text-[11px] font-bold block mt-0.5 whitespace-nowrap truncate w-full px-0.5 ${isYangGrass ? 'text-teal-800' : 'text-amber-900'}`}>
              {isYangGrass ? '양잔디' : '조선잔디'}
            </span>
          </div>

          {/* Slot 3: 지형 */}
          <div className="py-0.5 border-l border-slate-200/60 flex flex-col justify-center items-center min-w-0">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block whitespace-nowrap">코스 지형</span>
            <span className={`text-[10px] sm:text-[11px] font-bold block mt-0.5 whitespace-nowrap truncate w-full px-0.5 ${isFlat ? 'text-sky-800' : 'text-slate-700'}`}>
              {isFlat ? '평지형' : '산악형'}
            </span>
          </div>

          {/* Slot 4: 야간 */}
          <div className="py-0.5 border-l border-slate-200/60 flex flex-col justify-center items-center min-w-0">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block whitespace-nowrap">야간 3부</span>
            <span className={`text-[10px] sm:text-[11px] font-bold block mt-0.5 whitespace-nowrap truncate w-full px-0.5 ${isNightLed ? 'text-indigo-800' : club.playOptions.nightPlay ? 'text-indigo-600' : 'text-slate-400'
              }`}>
              {club.playOptions.nightPlay ? (isNightLed ? 'LED 야간' : '야간운영') : '미운영'}
            </span>
          </div>
        </div>

        {/* 3. Secondary Specs 1-liner */}
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-600 truncate pb-1">
          <span className="font-semibold text-slate-800 shrink-0">
            {club.greenSpeedAvg ? `그린 ${club.greenSpeedAvg.toFixed(1)}m` : '그린 -'}
          </span>
          <span className="text-slate-300">·</span>
          <span className="shrink-0">{club.fairwayWidth} 페어웨이</span>
          <span className="text-slate-300">·</span>
          <span className="truncate">전장 {club.totalLengthMeters.toLocaleString()}m</span>
          {club.playOptions.noCaddieAllowed && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-emerald-700 font-bold shrink-0">노캐디</span>
            </>
          )}
        </div>
      </div>

      {/* 4. Footer: Expected Score & Reference Price */}
      <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-end justify-between gap-2 text-xs">
        {/* Left: USGA Score Prediction */}
        <div className="min-w-0">
          <span className="text-[10px] text-slate-400 block font-medium truncate">내 예상 스코어 ({userAvgScore}타 기준)</span>
          {pred.isUnrated ? (
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 whitespace-nowrap">공인 레이팅 미측정</span>
            </div>
          ) : (
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-sm sm:text-base font-black text-slate-900">{pred.expectedScore}타</span>
              <span className={`text-[10px] sm:text-[11px] font-bold ${pred.diffFromAverage > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                ({pred.diffFromAverage > 0 ? `+${pred.diffFromAverage}` : pred.diffFromAverage})
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 ml-0.5 whitespace-nowrap hidden sm:inline">슬로프 {club.difficultyIndex?.slopeRating}</span>
            </div>
          )}
        </div>

        {/* Right: Estimated Cost & Detail Trigger */}
        <div className="text-right shrink-0">
          <span className="text-[10px] text-slate-400 block font-medium whitespace-nowrap">1인 실부담 (카트·캐디 포함)</span>
          <div className="flex items-baseline justify-end space-x-0.5 mt-0.5">
            <span className="text-sm sm:text-base font-black text-slate-900">
              {formatPrice(weekdayCost.totalPerPerson)}
            </span>
            <span className="text-[10px] text-slate-400">~</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 ml-0.5 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
};
