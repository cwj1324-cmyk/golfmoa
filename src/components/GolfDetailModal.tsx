import React, { useState } from 'react';
import type { GolfClub } from '../types/golf';
import { DateRateSimulator } from './DateRateSimulator';
import { predictFieldScore } from '../utils/calculator';
import { X, MapPin, Gauge, Phone, ExternalLink, ShieldCheck, Check, Activity, Target, AlertTriangle } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header Image */}
        <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-900 shrink-0">
          <img
            src={club.imageUrl}
            alt={club.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/20" />

          {/* Close & Compare Button */}
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <button
              onClick={() => onToggleCompare(club)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${isCompared
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white/95 text-slate-800 hover:bg-white'
                }`}
            >
              {isCompared ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
              <span>{isCompared ? '비교함 담김' : '+ 비교 담기'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Header Info */}
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <div className="flex items-center space-x-2 text-xs text-emerald-300 font-semibold mb-1">
              <span>{club.region}</span>
              <span>•</span>
              <span>{club.courseType}</span>
              <span>•</span>
              <span>{club.holes}홀</span>
              <span>•</span>
              <span>서울 강남 기준 {club.drivingTimeFromSeoul}분 소요</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{club.name}</h2>
            <p className="text-xs text-slate-300 mt-1 line-clamp-1">{club.highlight}</p>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Introduction */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">골프장 소개</h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/70">
              {club.description}
            </p>
          </div>

          {/* 1. Date & Time-Slot Specific Fee Simulator */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                실시간 티타임 요금 시뮬레이션
              </h3>
              <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                일자 · 시간대 · 인원별 카트/캐디 자동 분담
              </span>
            </div>
            <DateRateSimulator club={club} />
          </div>

          {/* 2. Official Course Difficulty Index Analysis Report */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  공식 코스 난이도 분석 리포트 (USGA / KGA / 골프존)
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                {club.difficultyIndex.relativeDifficulty}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center my-3">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-medium">슬로프 레이팅 (SR)</span>
                <span className="text-xl font-black text-rose-400 block mt-0.5">
                  {club.difficultyIndex.slopeRating}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  (표준 113 대비 {club.difficultyIndex.slopeRating > 113 ? `+${club.difficultyIndex.slopeRating - 113} 난이도` : '쉬움'})
                </span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-medium">코스 레이팅 (CR)</span>
                <span className="text-xl font-black text-amber-400 block mt-0.5">
                  {club.difficultyIndex.courseRating}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">스크래치 골퍼 기준 타수</span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-medium">아마추어 평균 타수</span>
                <span className="text-xl font-black text-emerald-400 block mt-0.5">
                  {club.difficultyIndex.avgFieldScore}타
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">스마트스코어 실제 빅데이터</span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-medium">골프존 난이도</span>
                <div className="mt-1 flex items-center justify-center space-x-1.5 text-xs font-bold text-amber-300">
                  <span>코스 ★{club.difficultyIndex.golfzonCourseLevel}</span>
                  <span>/</span>
                  <span>그린 ★{club.difficultyIndex.golfzonGreenLevel}</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">스크린 매칭 지수</span>
              </div>
            </div>

            {/* Interactive User Score Predictor (독점 해자: 내 핸디캡 맞춤 타수 예측기) */}
            <div className="mt-4 p-4 rounded-xl bg-slate-800/90 border border-slate-700/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">내 평소 타수 기준 맞춤 스코어 예측기</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-slate-400 text-[11px]">내 평소 타수:</span>
                  <div className="flex items-center gap-1">
                    {[80, 85, 90, 95, 100].map((score) => (
                      <button
                        key={score}
                        onClick={() => setMyAvgScore(score)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                          myAvgScore === score
                            ? 'bg-emerald-500 text-slate-900 shadow-xs'
                            : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {score}타
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prediction Result Display */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block font-medium">예상 필드 스코어</span>
                  <div className="flex items-baseline space-x-1 mt-0.5">
                    <span className="text-2xl font-black text-emerald-400">
                      {scorePred.expectedScore}타
                    </span>
                    <span className={`text-xs font-bold ${scorePred.diffFromAverage > 0 ? 'text-rose-400' : 'text-emerald-300'}`}>
                      ({scorePred.diffFromAverage > 0 ? `+${scorePred.diffFromAverage}` : scorePred.diffFromAverage}타)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    USGA 공식 핸디캡 {scorePred.courseHandicap}타 반영
                  </span>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block font-medium">코스 체감 난도</span>
                  <span className="text-sm font-bold text-white block mt-1 line-clamp-1">
                    {scorePred.levelAssessment}
                  </span>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-300">
                    <AlertTriangle className="w-3 h-3" />
                    <span>볼 분실 위험: {scorePred.ballLossRisk}</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-700/50 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block font-medium">실전 공략 팁</span>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug line-clamp-3">
                    {scorePred.advice}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50 leading-relaxed mt-3">
              <span className="font-bold text-slate-300">💡 슬로프 레이팅(Slope Rating) 기준:</span> 113(전국 평균)을 기준으로 높을수록 해저드·벙커·경사로 인해 보기플레이어가 타수를 더 많이 잃습니다. 130 이상은 핸디캡이 2~4타 더 발생합니다.
            </div>
          </div>

          {/* 3. Detailed Specifications */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">코스 상세 제원</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-medium">페어웨이 잔디</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{club.grass.fairway}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-medium">그린 잔디</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{club.grass.green}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-medium">평균 그린 스피드</span>
                <span className="font-bold text-emerald-800 mt-0.5 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5" />
                  {club.greenSpeedAvg}m ({club.greenDifficulty >= 4 ? '상급' : '보통'})
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-medium">18홀 전장</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{club.totalLengthMeters.toLocaleString()}m</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-medium">코스 스타일</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{club.courseStyle}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-medium">페어웨이 폭</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{club.fairwayWidth}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-medium">언듈레이션</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{club.undulation}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-medium">티박스 컨디션</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{club.teeBoxMatRatio}</span>
              </div>
            </div>
          </div>

          {/* 4. Facilities & Operations */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">부대시설 및 운영 정보</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                <span className="font-bold text-slate-700 block">연습 시설</span>
                <div className="space-y-1 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span>드라이빙 레인지:</span>
                    <span className="font-bold text-slate-900">
                      {club.facilities.drivingRange ? '⭕ 보유' : '❌ 없음'}
                    </span>
                  </div>
                  {club.facilities.drivingRangeNote && (
                    <p className="text-[11px] text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-100">
                      {club.facilities.drivingRangeNote}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span>어프로치/퍼팅 연습그린:</span>
                    <span className="font-bold text-slate-900">
                      {club.facilities.practiceGreen ? '⭕ 보유' : '❌ 없음'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                <span className="font-bold text-slate-700 block">클럽하우스 & 위치</span>
                <div className="space-y-1.5 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="line-clamp-1">{club.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{club.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>사우나 락커 시설: {club.facilities.saunaRating}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/90 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleCompare(club)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${isCompared
                  ? 'border-emerald-700 bg-emerald-50 text-emerald-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
            >
              {isCompared ? '비교함에서 빼기' : '비교함 담기'}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={`https://golf.kakao.com/search?keyword=${encodeURIComponent(club.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 bg-[#FEE500] hover:bg-[#FADA0A] text-slate-900 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <span className="w-4 h-4 rounded-full bg-slate-900 text-[#FEE500] flex items-center justify-center text-[10px] font-black">
                K
              </span>
              <span>카카오골프 실시간</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={club.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span>공홈 예약 바로가기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
