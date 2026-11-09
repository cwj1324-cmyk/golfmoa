import React, { useState } from 'react';
import type { GolfClub } from '../types/golf';
import { calculateCostPerPerson, formatPrice, predictFieldScore, getOfficialClubUrl } from '../utils/calculator';
import { X, MapPin, Gauge, Phone, ExternalLink, Check, Target, Moon, Plus } from 'lucide-react';

interface GolfDetailModalProps {
  club: GolfClub | null;
  onClose: () => void;
  isCompared: boolean;
  onToggleCompare: (club: GolfClub) => void;
  initialUserAvgScore?: number;
}

export const GolfDetailModal: React.FC<GolfDetailModalProps> = ({
  club,
  onClose,
  isCompared,
  onToggleCompare,
  initialUserAvgScore = 90,
}) => {
  const [myAvgScore, setMyAvgScore] = useState<number>(initialUserAvgScore);

  if (!club) return null;

  const scorePred = predictFieldScore(
    club.difficultyIndex.slopeRating,
    club.difficultyIndex.courseRating,
    myAvgScore
  );

  const weekdayCost = calculateCostPerPerson(club, false, 4, true);
  const weekendCost = calculateCostPerPerson(club, true, 4, true);
  const officialUrl = getOfficialClubUrl(club);

  const isNoMat = club.teeBoxMatRatio?.includes('매트 없음');
  const isMixedMat = club.teeBoxMatRatio?.includes('일부 매트') || club.teeBoxMatRatio?.includes('매트 비율 높음');
  const isYangGrass = club.grass.fairway.includes('양잔디');
  const isFlat = club.courseStyle.includes('구릉') || club.courseStyle.includes('링크스') || club.courseStyle.includes('평지');
  const isNightLed = club.playOptions.nightPlay && club.playOptions.lightingType.includes('LED');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* 1. Clean Modal Header (Photo-less, High-Density Spec Profile) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-white">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-700 whitespace-nowrap">
                  {club.courseType} {club.holes}홀
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 font-medium truncate">
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                  {club.region} · {club.city || club.address.split(' ')[1] || club.region}
                </span>
              </div>

              <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {club.name}
              </h2>

              <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1">
                {club.highlight || club.description}
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                onClick={() => onToggleCompare(club)}
                className={`px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all ${isCompared
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                {isCompared ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isCompared ? '비교중' : '조건 비교'}</span>
                <span className="sm:hidden text-[11px]">{isCompared ? '비교중' : '비교'}</span>
              </button>

              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1 transition-all shadow-2xs"
                title="공식 홈페이지 바로가기"
              >
                <span className="hidden sm:inline">공홈 바로가기</span>
                <span className="sm:hidden text-[11px]">공홈</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                onClick={onClose}
                className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all ml-0.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Section 1: 핵심 코스 조건 8대 매트릭스 (Disciplined Grid) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase flex items-center gap-1.5">
                <span>핵심 코스 조건 제원표</span>
              </h3>
              <span className="text-[11px] text-slate-400">8대 코스 조건 대조</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {/* 1. 티박스 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                <span className="text-[10px] text-slate-400 block font-medium">티박스 컨디션</span>
                <span className={`font-bold mt-1 block ${isNoMat ? 'text-emerald-800' : isMixedMat ? 'text-slate-700' : 'text-slate-400'}`}>
                  {isNoMat ? '🌱 100% 잔디티' : isMixedMat ? '매트 혼용' : '티박스 -'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">{club.teeBoxMatRatio || '미확인'}</span>
              </div>

              {/* 2. 페어웨이 잔디 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                <span className="text-[10px] text-slate-400 block font-medium">페어웨이 잔디</span>
                <span className={`font-bold mt-1 block ${isYangGrass ? 'text-teal-800' : 'text-amber-900'}`}>
                  {isYangGrass ? '🌿 양잔디' : '🌾 조선잔디'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block line-clamp-1">{club.grass.fairway}</span>
              </div>

              {/* 3. 코스 지형 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                <span className="text-[10px] text-slate-400 block font-medium">코스 지형 & 고저차</span>
                <span className={`font-bold mt-1 block ${isFlat ? 'text-sky-800' : 'text-slate-700'}`}>
                  {isFlat ? '⛰️ 평지·시야개방' : '⛰️ 산악 다이내믹'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">언듈레이션 {club.undulation}</span>
              </div>

              {/* 4. 야간 3부 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                <span className="text-[10px] text-slate-400 block font-medium">야간 3부 라운드</span>
                <span className={`font-bold mt-1 block flex items-center gap-1 ${isNightLed ? 'text-indigo-800' : club.playOptions.nightPlay ? 'text-indigo-600' : 'text-slate-400'
                  }`}>
                  {club.playOptions.nightPlay ? (
                    <>
                      <Moon className="w-3 h-3 text-indigo-500 fill-indigo-500" />
                      <span>{isNightLed ? 'LED 야간 운영' : '야간 3부 운영'}</span>
                    </>
                  ) : (
                    '야간 미운영'
                  )}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">{club.playOptions.lightingType}</span>
              </div>

              {/* 5. 그린 스피드 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                <span className="text-[10px] text-slate-400 block font-medium">평균 그린 스피드</span>
                <span className="font-bold text-slate-900 mt-1 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-purple-600" />
                  {club.greenSpeedAvg ? (
                    <>
                      <span>{club.greenSpeedAvg.toFixed(1)}m</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        ({club.greenSpeedAvg >= 2.8 ? '빠름' : '보통'})
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400 font-normal text-xs">미확인</span>
                  )}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">그린잔디: {club.grass.green}</span>
              </div>

              {/* 6. 페어웨이 폭 & 전장 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                <span className="text-[10px] text-slate-400 block font-medium">페어웨이 폭 & 전장</span>
                <span className="font-bold text-slate-900 mt-1 block">
                  {club.fairwayWidth} 폭
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  전장 {club.totalLengthMeters.toLocaleString()}m
                </span>
              </div>

              {/* 7. 플레이 옵션 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                <span className="text-[10px] text-slate-400 block font-medium">인원 & 캐디 옵션</span>
                <span className="font-bold text-slate-900 mt-1 block">
                  {club.playOptions.noCaddieAllowed ? '노캐디 가능' : '캐디제 운영'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {club.playOptions.twoPlayerAllowed ? '2인 라운드 가능' : '3~4인 전용'}
                </span>
              </div>

              {/* 8. 연습 시설 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                <span className="text-[10px] text-slate-400 block font-medium">라운드 전 연습시설</span>
                <span className="font-bold text-slate-900 mt-1 block">
                  {club.facilities.drivingRange ? '타석 레인지 보유' : '퍼팅 연습그린'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {club.facilities.practiceGreen ? '어프로치 그린 완비' : '기본 퍼팅그린'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: USGA 공인 코스 난이도 & 맞춤 스코어 예측 (Harmonious Light Theme) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-emerald-800" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  USGA 공인 코스 난이도 & 내 맞춤 예상 스코어
                </h3>
              </div>
              <div className="flex items-center space-x-1 text-xs">
                <span className="text-slate-500 text-[11px] font-medium">내 평소 타수:</span>
                <div className="flex items-center gap-1">
                  {[80, 85, 90, 95, 100].map((score) => (
                    <button
                      key={score}
                      onClick={() => setMyAvgScore(score)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all border ${myAvgScore === score
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      {score}타
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4-Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-medium">슬로프 레이팅 (SR)</span>
                <span className="text-xl font-black text-rose-600 block mt-0.5">
                  {club.difficultyIndex?.slopeRating ?? '미측정'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {club.difficultyIndex?.slopeRating ? '표준 113 기준' : '공인 데이터 없음'}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-medium">코스 레이팅 (CR)</span>
                <span className="text-xl font-black text-amber-600 block mt-0.5">
                  {club.difficultyIndex?.courseRating ?? '미측정'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {club.difficultyIndex?.courseRating ? '스크래치 기준' : '공인 데이터 없음'}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-medium">빅데이터 평균 타수</span>
                <span className="text-xl font-black text-emerald-800 block mt-0.5">
                  {club.difficultyIndex?.avgFieldScore ? `${club.difficultyIndex.avgFieldScore}타` : '미집계'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">스마트스코어 실기록</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-medium">내 체감 예상 타수</span>
                {scorePred.isUnrated ? (
                  <div className="mt-1">
                    <span className="text-sm font-bold text-slate-600">공인 레이팅 미측정</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">평소 {myAvgScore}타 기준</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline justify-center space-x-1 mt-0.5">
                      <span className="text-xl font-black text-slate-900">
                        {scorePred.expectedScore}타
                      </span>
                      <span className={`text-[11px] font-bold ${scorePred.diffFromAverage > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        ({scorePred.diffFromAverage > 0 ? `+${scorePred.diffFromAverage}` : scorePred.diffFromAverage})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">{scorePred.levelAssessment.split(' ')[0]}</span>
                  </>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-700 bg-white p-3 rounded-xl border border-emerald-200/70 shadow-2xs leading-relaxed">
              <span className="font-bold text-emerald-800">💡 코스 실전 공략 가이드:</span> {scorePred.advice}
            </div>
          </div>

          {/* Section 3: 기본 이용 요금 안내 (Clean Compact Table, NO giant simulator) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase">
                기준 이용 요금 안내
              </h3>
              <span className="text-[11px] text-slate-400">공시 기준 정가</span>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
              <div className="grid grid-cols-4 bg-slate-50 font-semibold text-slate-600 p-2 sm:p-2.5 border-b border-slate-200 text-center text-[10px] sm:text-xs">
                <div>주중 그린피</div>
                <div>주말 그린피</div>
                <div>팀 카트비</div>
                <div>팀 캐디피</div>
              </div>
              <div className="grid grid-cols-4 p-2.5 sm:p-3 text-center font-bold text-slate-900 items-center text-[11px] sm:text-xs">
                <div className="truncate">{formatPrice(club.pricing.weekdayGreenFee)}~</div>
                <div className="truncate">{formatPrice(club.pricing.weekendGreenFee)}~</div>
                <div className="truncate">{formatPrice(club.pricing.cartFee)}</div>
                <div className="truncate">
                  {club.pricing.caddieFee === 0 ? (
                    <span className="text-emerald-700 font-extrabold">노캐디</span>
                  ) : (
                    formatPrice(club.pricing.caddieFee)
                  )}
                </div>
              </div>

              {/* 1인 실부담금 요약 바 */}
              <div className="bg-emerald-50/60 p-2.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] px-3.5">
                <span className="text-emerald-950 font-bold">
                  4인 라운드 기준 1인 실부담 예상 (카트·캐디 분담 포함):
                </span>
                <span className="text-emerald-800 font-extrabold">
                  주중 약 {formatPrice(weekdayCost.totalPerPerson)} / 주말 약 {formatPrice(weekendCost.totalPerPerson)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: 골프장 정보 & 부대시설 */}
          <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/40 text-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{club.address}</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-800">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{club.phone}</span>
              </span>
            </div>
            {club.facilities.drivingRangeNote && (
              <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                {club.facilities.drivingRangeNote}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
