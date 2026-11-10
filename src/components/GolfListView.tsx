import React from 'react';
import { Star, MapPin, Layers, Check, ExternalLink, Moon } from 'lucide-react';
import type { GolfClub } from '../types/golf';
import { predictFieldScore } from '../utils/calculator';
import { getClubRatingStats } from '../utils/wikiStorage';

interface GolfListViewProps {
  clubs: GolfClub[];
  onSelectClub: (club: GolfClub) => void;
  comparedIds: Set<string>;
  onToggleCompare: (club: GolfClub) => void;
  userAvgScore: number;
}

export const GolfListView: React.FC<GolfListViewProps> = ({
  clubs,
  onSelectClub,
  comparedIds,
  onToggleCompare,
  userAvgScore,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Desktop Table Header */}
      <div className="hidden lg:grid grid-cols-12 gap-3 px-5 py-3.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500">
        <div className="col-span-4">골프장 / 위치</div>
        <div className="col-span-2 text-center">잔디 · 티박스</div>
        <div className="col-span-2 text-center">야간 · 지형</div>
        <div className="col-span-1 text-center">난이도 (슬로프)</div>
        <div className="col-span-2 text-right">예상 비용 (1인 총액)</div>
        <div className="col-span-1 text-center">비교 / 상세</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100">
        {clubs.map((club) => {
          const isCompared = comparedIds.has(club.id);
          const pred = predictFieldScore(
            club.difficultyIndex?.slopeRating,
            club.difficultyIndex?.courseRating,
            userAvgScore
          );

          // 1인 총비용
          const totalCost =
            club.pricing.weekdayGreenFee +
            Math.round(club.pricing.cartFee / 4) +
            Math.round(club.pricing.caddieFee / 4);

          const isYang = club.grass.fairway.includes('양잔디');
          const isNoMat = club.teeBoxMatRatio === '매트 없음(100% 잔디)';
          const ratingStats = getClubRatingStats(club.id);

          return (
            <div
              key={club.id}
              onClick={() => onSelectClub(club)}
              className="p-3.5 sm:p-4 hover:bg-slate-50/80 transition-all cursor-pointer flex flex-col lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center group"
            >
              {/* 1. 골프장 정보 & 위치 (사진 제거됨) */}
              <div className="col-span-4 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    {club.courseType} · {club.holes}홀
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    {club.region} · {club.city || club.address.split(' ')[1] || club.region}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors truncate">
                  {club.name}
                </h3>

                <div className="flex items-center gap-2 mt-0.5 text-xs">
                  {ratingStats.rating !== null ? (
                    <span className="inline-flex items-center text-amber-500 font-bold text-[11px]">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                      {ratingStats.rating} (후기 {ratingStats.reviewCount})
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">후기 0</span>
                  )}
                </div>
              </div>

              {/* Mobile Spec Summary Strip */}
              <div className="lg:hidden flex flex-wrap items-center gap-1.5 my-2.5 pt-2 border-t border-slate-100 text-[11px]">
                <span
                  className={`px-1.5 py-0.5 rounded font-semibold border ${isYang ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-amber-50 text-amber-900 border-amber-200'
                    }`}
                >
                  {isYang ? '양잔디' : '조선잔디'}
                </span>
                {isNoMat && (
                  <span className="px-1.5 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    잔디티 100%
                  </span>
                )}
                {club.playOptions.nightPlay && (
                  <span className="px-1.5 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-0.5">
                    <Moon className="w-2.5 h-2.5 text-indigo-600" />
                    야간 LED
                  </span>
                )}
                <span className="px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-600">
                  {club.courseStyle}
                </span>
                {club.difficultyIndex?.slopeRating && (
                  <span className="px-1.5 py-0.5 rounded font-bold bg-emerald-800 text-white text-[10px]">
                    슬로프 {club.difficultyIndex.slopeRating}
                  </span>
                )}
              </div>

              {/* 2. Desktop: 잔디 · 티박스 */}
              <div className="hidden lg:flex col-span-2 flex-col items-center justify-center gap-1 text-center">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold border ${isYang ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-amber-50 text-amber-900 border-amber-200'
                    }`}
                >
                  {isYang ? '양잔디' : '조선잔디'}
                </span>
                <span
                  className={`text-[11px] font-medium ${isNoMat ? 'text-emerald-700 font-bold' : club.teeBoxMatRatio ? 'text-slate-600' : 'text-slate-400'
                    }`}
                >
                  {club.teeBoxMatRatio || '티박스 미확인'}
                </span>
              </div>

              {/* 3. Desktop: 야간 · 지형 */}
              <div className="hidden lg:flex col-span-2 flex-col items-center justify-center gap-1 text-center">
                {club.playOptions.nightPlay ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Moon className="w-3 h-3 text-indigo-600" />
                    {club.playOptions.lightingType.includes('LED') ? '최신 LED 3부' : '야간 3부 운영'}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">야간 미운영</span>
                )}
                <span className="text-[11px] text-slate-600 font-medium">
                  {club.courseStyle} · {club.undulation}
                </span>
              </div>

              {/* 4. Desktop: 공인 난이도 */}
              <div className="hidden lg:flex col-span-1 flex-col items-center justify-center text-center">
                {club.difficultyIndex?.slopeRating ? (
                  <>
                    <span className="text-xs font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {club.difficultyIndex.slopeRating}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      예상 {pred.expectedScore}타
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] text-slate-400">미공인</span>
                )}
              </div>

              {/* 5. 예상 비용 */}
              <div className="col-span-2 flex lg:flex-col items-center lg:items-end justify-between lg:justify-center">
                <span className="text-xs text-slate-400 lg:hidden">1인 예상 총비용</span>
                <div className="text-right">
                  <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                    {totalCost.toLocaleString()}원
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    그린피 {club.pricing.weekdayGreenFee.toLocaleString()}원~
                  </span>
                </div>
              </div>

              {/* 6. 액션 버튼 (비교 & 상세) */}
              <div
                className="col-span-1 flex items-center justify-end lg:justify-center gap-1.5 mt-2 lg:mt-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => onToggleCompare(club)}
                  className={`p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all border ${isCompared
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-600 hover:text-emerald-800'
                    }`}
                  title={isCompared ? '비교함에서 제외' : '1:1 비교함 담기'}
                >
                  {isCompared ? <Check className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isCompared ? '담김' : '비교'}</span>
                </button>

                <button
                  onClick={() => onSelectClub(club)}
                  className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-all"
                  title="상세보기"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
