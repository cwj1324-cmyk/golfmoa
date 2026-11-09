import React from 'react';
import type { GolfClub } from '../types/golf';
import { calculateCostPerPerson, formatPrice, predictFieldScore } from '../utils/calculator';
import { Star, Clock, MapPin, Check, Plus, ChevronRight, Moon } from 'lucide-react';

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

  const isNoMat = club.teeBoxMatRatio.includes('매트 없음');
  const isYangGrass = club.grass.fairway.includes('양잔디');
  const isFlat = club.courseStyle.includes('구릉') || club.courseStyle.includes('링크스') || club.courseStyle.includes('평지');
  const isLedNight = club.playOptions.nightPlay && club.playOptions.lightingType.includes('LED');
  const isFastGreen = club.greenSpeedAvg >= 2.8;
  const isWideFairway = club.fairwayWidth === '넓음';

  return (
    <div
      onClick={() => onSelectClub(club)}
      className={`bg-white rounded-xl border transition-all duration-150 p-4 flex flex-col justify-between cursor-pointer group hover:border-slate-400 hover:shadow-xs ${
        isCompared ? 'border-emerald-700 ring-1 ring-emerald-700 bg-emerald-50/20' : 'border-slate-200/90 shadow-2xs'
      }`}
    >
      {/* 1. Header: Club Name, Type, Rating, Region & Compare Button */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight group-hover:text-emerald-800 transition-colors">
              {club.name}
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
              {club.courseType} {club.holes}홀
            </span>
            <div className="flex items-center text-xs text-amber-500 font-bold ml-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
              <span>{club.rating.toFixed(1)}</span>
              <span className="text-[11px] font-normal text-slate-400 ml-1">({club.reviewCount})</span>
            </div>
          </div>

          {/* Region & Travel Time */}
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 font-medium text-slate-600">
              <MapPin className="w-3 h-3 text-slate-400" />
              {club.region} ({club.address.split(' ')[0] || club.region})
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              서울 {club.drivingTimeFromSeoul}분
            </span>
          </div>
        </div>

        {/* 1:1 Compare Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCompare(club);
          }}
          className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border ${
            isCompared
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
          }`}
          title="1:1 조건 비교함에 담기"
        >
          {isCompared ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>비교중</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>조건 비교</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Condition Badges Matrix (The Star of the Show) */}
      <div className="py-3 flex flex-wrap items-center gap-1.5 text-xs">
        {/* Tee Box Mat Condition */}
        {isNoMat ? (
          <span className="px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
            🌱 100% 잔디티
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-600">
            매트 혼용
          </span>
        )}

        {/* Grass Type */}
        <span
          className={`px-2 py-0.5 rounded font-semibold border ${
            isYangGrass
              ? 'bg-teal-50 text-teal-800 border-teal-200/80'
              : 'bg-amber-50 text-amber-900 border-amber-200/80'
          }`}
        >
          {isYangGrass ? '🌿 양잔디' : '🌾 조선잔디'}
        </span>

        {/* Topography & Sightline */}
        <span
          className={`px-2 py-0.5 rounded font-medium border ${
            isFlat
              ? 'bg-sky-50 text-sky-800 border-sky-200/80'
              : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          {isFlat ? '⛰️ 평지·시야개방' : '⛰️ 산악 다이내믹'}
        </span>

        {/* Night Golf Condition */}
        {isLedNight ? (
          <span className="px-2 py-0.5 rounded font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/90 flex items-center gap-1">
            <Moon className="w-3 h-3 text-indigo-600" />
            초고광량 LED 야간
          </span>
        ) : club.playOptions.nightPlay ? (
          <span className="px-2 py-0.5 rounded font-medium bg-indigo-50/60 text-indigo-700 border border-indigo-100 flex items-center gap-1">
            <Moon className="w-3 h-3 text-indigo-500" />
            야간 3부 운영
          </span>
        ) : null}

        {/* Green Speed */}
        {isFastGreen ? (
          <span className="px-2 py-0.5 rounded font-bold bg-purple-50 text-purple-800 border border-purple-200/80">
            ⛳ 빠른 그린 {club.greenSpeedAvg.toFixed(1)}m
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-600">
            그린 {club.greenSpeedAvg.toFixed(1)}m
          </span>
        )}

        {/* Fairway Width */}
        {isWideFairway && (
          <span className="px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700">
            📏 넓은 페어웨이
          </span>
        )}

        {/* Play Options */}
        {club.playOptions.noCaddieAllowed && (
          <span className="px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
            노캐디 가능
          </span>
        )}
        {club.playOptions.twoPlayerAllowed && (
          <span className="px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700">
            2인 가능
          </span>
        )}
        {club.facilities.drivingRange && (
          <span className="px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-600">
            타석 연습장
          </span>
        )}
      </div>

      {/* 3. Detail Course Characteristics & Score Prediction */}
      <div className="py-2.5 px-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1.5 text-slate-600">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <span className="font-medium text-slate-700">
            {club.highlight || club.description}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
          <span className="text-slate-500">
            USGA 공인 난이도: 슬로프 {club.difficultyIndex.slopeRating} (코스레이팅 {club.difficultyIndex.courseRating})
          </span>
          <span className="font-semibold text-slate-800">
            내 예상: <strong className="text-slate-900 font-bold">{pred.expectedScore}타</strong>
            <span className={`ml-1 font-bold ${pred.diffFromAverage > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              ({pred.diffFromAverage > 0 ? `+${pred.diffFromAverage}` : pred.diffFromAverage})
            </span>
          </span>
        </div>
      </div>

      {/* 4. Footer: Reference Price & Detailed Condition Action */}
      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">
            기준 비용 (카트·캐디 분담 포함)
          </span>
          <div className="flex items-baseline space-x-1">
            <span className="text-sm sm:text-base font-extrabold text-slate-900">
              {formatPrice(weekdayCost.totalPerPerson)}
            </span>
            <span className="text-[11px] text-slate-400">/ 1인</span>
          </div>
        </div>

        <div className="inline-flex items-center text-xs font-semibold text-emerald-800 group-hover:text-emerald-900 transition-colors">
          <span>상세 조건 & 날짜별 요금</span>
          <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
