import React, { useState, useEffect } from 'react';
import type { GolfClub } from '../types/golf';
import { calculateCostPerPerson, formatPrice, predictFieldScore } from '../utils/calculator';
import { X, ExternalLink, Gauge, MapPin, Share2, Copy, ThumbsUp, Sparkles, Moon } from 'lucide-react';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparedClubs: GolfClub[];
  onRemoveFromCompare: (clubId: string) => void;
  onSelectClub: (club: GolfClub) => void;
  userAvgScore?: number;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  comparedClubs,
  onRemoveFromCompare,
  onSelectClub,
  userAvgScore = 90,
}) => {
  const [isWeekend, setIsWeekend] = useState(false);
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // 동반자 투표 상태 (localStorage 기반)
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [myVotedClubId, setMyVotedClubId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedVotes = localStorage.getItem('golfmoa_votes');
      if (savedVotes) {
        setVotes(JSON.parse(savedVotes));
      }
      const myVote = localStorage.getItem('golfmoa_my_vote');
      if (myVote) {
        setMyVotedClubId(myVote);
      }
    } catch {
      // fallback
    }
  }, []);

  const handleVote = (clubId: string) => {
    const newVotes = { ...votes };
    if (myVotedClubId === clubId) {
      newVotes[clubId] = Math.max(0, (newVotes[clubId] || 1) - 1);
      setMyVotedClubId(null);
      localStorage.removeItem('golfmoa_my_vote');
    } else {
      if (myVotedClubId && newVotes[myVotedClubId]) {
        newVotes[myVotedClubId] = Math.max(0, newVotes[myVotedClubId] - 1);
      }
      newVotes[clubId] = (newVotes[clubId] || 0) + 1;
      setMyVotedClubId(clubId);
      localStorage.setItem('golfmoa_my_vote', clubId);
    }
    setVotes(newVotes);
    localStorage.setItem('golfmoa_votes', JSON.stringify(newVotes));
  };

  if (!isOpen) return null;

  // 공유용 고유 URL 생성
  const shareUrl = `${window.location.origin}${window.location.pathname}?compare=${encodeURIComponent(
    comparedClubs.map((c) => c.name).join(',')
  )}`;

  // 1. 단순 비교 링크 복사
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopyFeedback('비교 링크가 클립보드에 복사되었습니다!');
      setTimeout(() => setCopyFeedback(null), 3000);
    });
  };

  // 2. 카카오톡 단톡방용 텍스트 요약 복사 (조건 중심 요약)
  const handleCopyKakaoText = () => {
    const dayText = isWeekend ? '주말' : '주중';
    const lines = [
      `⛳ [골프모아] 골프장 코스 조건 1:1 대조표 (${comparedClubs.length}곳 비교)`,
      `기준: ${dayText} / ${playerCount}인 라운드 (내 평균 ${userAvgScore}타 기준)`,
      '--------------------------------',
    ];

    comparedClubs.forEach((club, idx) => {
      const cost = calculateCostPerPerson(club, isWeekend, playerCount, true);
      const prediction = predictFieldScore(club.difficultyIndex.slopeRating, club.difficultyIndex.courseRating, userAvgScore);
      const isNoMat = club.teeBoxMatRatio.includes('매트 없음') ? '🌱 100% 잔디티' : '매트 혼용';
      const isNight = club.playOptions.nightPlay ? `🌙 ${club.playOptions.lightingType}` : '야간 미운영';

      lines.push(
        `${idx + 1}. ${club.name} (${club.region} / 서울 ${club.drivingTimeFromSeoul}분)`,
        `   • 핵심 조건: ${isNoMat} | ${club.grass.fairway} | ${isNight}`,
        `   • 지형/그린: ${club.courseStyle} | 그린 ${club.greenSpeedAvg}m`,
        `   • 예상 스코어: ${prediction.expectedScore}타 (슬로프 ${club.difficultyIndex.slopeRating})`,
        `   • 1인 실부담: ${formatPrice(cost.totalPerPerson)} (팀: ${formatPrice(cost.totalTeamCost)})`,
        `   • 득표수: ${votes[club.id] || 0}표`,
        ''
      );
    });

    lines.push(
      `👉 1:1 세부 조건 대조 & 동반자 투표 참여하기:`,
      shareUrl
    );

    const fullText = lines.join('\n');
    navigator.clipboard.writeText(fullText).then(() => {
      setCopyFeedback('카톡 단톡방 공유용 조건 대조표가 복사되었습니다!');
      setTimeout(() => setCopyFeedback(null), 3000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                1:1 코스 조건 대조
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                골프장 조건 & 스펙 비교함 ({comparedClubs.length}/3)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              티박스 매트 · 잔디 · 야간 조명 · 그린스피드 · 난이도 조건을 나란히 대조합니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Weekend Toggle */}
            <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setIsWeekend(false)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  !isWeekend ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                주중
              </button>
              <button
                onClick={() => setIsWeekend(true)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  isWeekend ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                주말
              </button>
            </div>

            {/* Player Count Select */}
            <select
              value={playerCount}
              onChange={(e) => setPlayerCount(Number(e.target.value))}
              className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none"
            >
              <option value={4}>4인 기준</option>
              <option value={3}>3인 기준</option>
              <option value={2}>2인 기준</option>
            </select>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Share & Feedback Bar */}
        {comparedClubs.length > 0 && (
          <div className="px-4 py-2.5 bg-emerald-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>동반자들과 공유하고 선호하는 구장에 실시간 투표를 받아보세요.</span>
              {copyFeedback && (
                <span className="text-emerald-300 font-bold ml-2 animate-fadeIn">
                  ✓ {copyFeedback}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold flex items-center gap-1 transition-all"
              >
                <Copy className="w-3 h-3" />
                <span>링크 복사</span>
              </button>
              <button
                onClick={handleCopyKakaoText}
                className="px-3 py-1 bg-[#FEE500] hover:bg-[#FADA0A] text-slate-900 rounded-lg font-black flex items-center gap-1 transition-all shadow-xs"
              >
                <Share2 className="w-3 h-3 text-slate-900" />
                <span>카톡 단톡방 공유 텍스트 복사</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Body (Scrollable Table) */}
        <div className="flex-1 overflow-x-auto p-4 sm:p-6">
          {comparedClubs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-base font-bold mb-2">비교함이 비어 있습니다.</p>
              <p className="text-xs">골프장 목록에서 [조건 비교]를 눌러 최대 3개 구장을 비교해보세요.</p>
            </div>
          ) : (
            <div className="min-w-[640px]">
              {/* Header Cards Row with Live Vote Buttons */}
              <div className="grid grid-cols-4 gap-4 pb-4 border-b border-slate-200">
                <div className="flex flex-col justify-end text-xs font-bold text-slate-400 uppercase tracking-wider pb-2">
                  <span>조건 대조 항목</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    (클럽별 코스 조건 1:1 비교)
                  </span>
                </div>

                {comparedClubs.map((club) => {
                  const voteCount = votes[club.id] || 0;
                  const isMyVote = myVotedClubId === club.id;

                  return (
                    <div
                      key={club.id}
                      className="relative bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex flex-col justify-between"
                    >
                      <button
                        onClick={() => onRemoveFromCompare(club.id)}
                        className="absolute top-2 right-2 p-1 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full transition-all shadow-2xs"
                        title="비교에서 제거"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="cursor-pointer" onClick={() => onSelectClub(club)}>
                        <div className="text-[11px] font-semibold text-slate-500 mb-0.5">
                          {club.courseType} {club.holes}홀
                        </div>
                        <h4 className="font-extrabold text-base text-slate-900 line-clamp-1 hover:text-emerald-800">
                          {club.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-700" />
                          {club.region} · 서울 {club.drivingTimeFromSeoul}분
                        </p>
                      </div>

                      {/* Vote Button */}
                      <button
                        onClick={() => handleVote(club.id)}
                        className={`mt-2.5 w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                          isMyVote
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-600 hover:text-emerald-800'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${isMyVote ? 'fill-white' : ''}`} />
                        <span>이 구장 투표 ({voteCount}표)</span>
                      </button>

                      {/* Outlinks */}
                      <div className="mt-1.5 grid grid-cols-2 gap-1 text-[11px]">
                        <a
                          href={`https://golf.kakao.com/search?keyword=${encodeURIComponent(club.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-1 bg-[#FEE500] hover:bg-[#FADA0A] text-slate-900 rounded font-black flex items-center justify-center gap-0.5"
                        >
                          <span>카카오</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <a
                          href={club.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold flex items-center justify-center gap-0.5"
                        >
                          <span>공홈</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Table Rows: Front-loading Course Conditions */}
              <div className="divide-y divide-slate-100 text-xs sm:text-sm">
                {/* 1. 티박스 매트 유무 */}
                <div className="grid grid-cols-4 gap-4 py-3 items-center bg-emerald-50/40 -mx-4 px-4 font-bold">
                  <div className="text-emerald-950">
                    🌱 티박스 매트 여부
                    <span className="block text-[10px] text-emerald-700 font-normal">티샷 환경</span>
                  </div>
                  {comparedClubs.map((club) => (
                    <div key={club.id}>
                      {club.teeBoxMatRatio.includes('매트 없음') ? (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                          100% 잔디 티박스
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                          인조 매트 혼용
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* 2. 페어웨이 잔디 종류 */}
                <div className="grid grid-cols-4 gap-4 py-3 items-center">
                  <div className="text-slate-600 font-medium">
                    🌿 페어웨이 잔디
                    <span className="block text-[10px] text-slate-400">손맛 & 난이도</span>
                  </div>
                  {comparedClubs.map((club) => {
                    const isYang = club.grass.fairway.includes('양잔디');
                    return (
                      <div key={club.id}>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${
                            isYang
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : 'bg-amber-50 text-amber-900 border-amber-200'
                          }`}
                        >
                          {club.grass.fairway}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 3. 코스 지형 & 시야 */}
                <div className="grid grid-cols-4 gap-4 py-3 items-center bg-slate-50/50 -mx-4 px-4">
                  <div className="text-slate-600 font-medium">
                    ⛰️ 코스 지형 & 시야
                    <span className="block text-[10px] text-slate-400">고저차 / 블라인드</span>
                  </div>
                  {comparedClubs.map((club) => {
                    const isFlat = club.courseStyle.includes('구릉') || club.courseStyle.includes('링크스') || club.courseStyle.includes('평지');
                    return (
                      <div key={club.id} className="text-xs">
                        <span className={`font-semibold ${isFlat ? 'text-sky-800' : 'text-slate-700'}`}>
                          {club.courseStyle}
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          언듈레이션 {club.undulation}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 4. 야간 3부 라운드 & 조명 */}
                <div className="grid grid-cols-4 gap-4 py-3 items-center">
                  <div className="text-slate-600 font-medium">
                    🌙 야간 라운드 (3부)
                    <span className="block text-[10px] text-slate-400">조명 품질</span>
                  </div>
                  {comparedClubs.map((club) => (
                    <div key={club.id} className="text-xs">
                      {club.playOptions.nightPlay ? (
                        <span className={`inline-flex items-center gap-1 font-bold ${
                          club.playOptions.lightingType.includes('LED') ? 'text-indigo-800' : 'text-slate-700'
                        }`}>
                          <Moon className="w-3.5 h-3.5 text-indigo-600" />
                          {club.playOptions.lightingType}
                        </span>
                      ) : (
                        <span className="text-slate-400">야간 미운영</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* 5. 그린 스피드 & 관리도 */}
                <div className="grid grid-cols-4 gap-4 py-3 items-center bg-slate-50/50 -mx-4 px-4">
                  <div className="text-slate-600 font-medium">
                    ⛳ 평균 그린 스피드
                    <span className="block text-[10px] text-slate-400">퍼팅 퀄리티</span>
                  </div>
                  {comparedClubs.map((club) => (
                    <div key={club.id} className="font-bold text-slate-800 flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-purple-600" />
                      <span>{club.greenSpeedAvg.toFixed(1)}m</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        ({club.greenSpeedAvg >= 2.8 ? '빠름' : '보통'})
                      </span>
                    </div>
                  ))}
                </div>

                {/* 6. 페어웨이 폭 & 전장 */}
                <div className="grid grid-cols-4 gap-4 py-3 items-center">
                  <div className="text-slate-600 font-medium">
                    📏 페어웨이 & 전장
                    <span className="block text-[10px] text-slate-400">OB 부담도</span>
                  </div>
                  {comparedClubs.map((club) => (
                    <div key={club.id} className="text-xs text-slate-800">
                      <span className="font-bold">{club.fairwayWidth} 폭</span>
                      <span className="text-slate-500 block">전장 {club.totalLengthMeters.toLocaleString()}m</span>
                    </div>
                  ))}
                </div>

                {/* 7. 플레이 옵션 (노캐디/2인/연습장) */}
                <div className="grid grid-cols-4 gap-4 py-3 items-center bg-slate-50/50 -mx-4 px-4">
                  <div className="text-slate-600 font-medium">편의 옵션</div>
                  {comparedClubs.map((club) => (
                    <div key={club.id} className="text-xs space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">노캐디:</span>
                        <span className="font-bold text-slate-800">{club.playOptions.noCaddieAllowed ? '가능' : '불가'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">2인 라운드:</span>
                        <span className="font-bold text-slate-800">{club.playOptions.twoPlayerAllowed ? '가능' : '불가'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">타석 연습장:</span>
                        <span className="font-bold text-slate-800">{club.facilities.drivingRange ? '보유' : '미보유'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 8. 내 타수 기준 예상 스코어 (Score Predictor) */}
                <div className="grid grid-cols-4 gap-4 py-3.5 bg-blue-50/70 -mx-4 px-4 items-center">
                  <div>
                    <div className="flex items-center gap-1 text-blue-950 font-extrabold">
                      <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                      <span>내 예상 타수</span>
                    </div>
                    <span className="text-[10px] text-blue-700">
                      평균 {userAvgScore}타 골퍼 기준
                    </span>
                  </div>
                  {comparedClubs.map((club) => {
                    const pred = predictFieldScore(
                      club.difficultyIndex.slopeRating,
                      club.difficultyIndex.courseRating,
                      userAvgScore
                    );
                    const diff = pred.diffFromAverage;
                    const diffText = diff > 0 ? `+${diff}` : `${diff}`;

                    return (
                      <div key={club.id} className="space-y-0.5">
                        <div className="flex items-baseline space-x-1">
                          <span className="text-base font-black text-blue-900">
                            {pred.expectedScore}타
                          </span>
                          <span className={`text-[11px] font-bold ${diff > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                            ({diffText}타)
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          슬로프 {club.difficultyIndex.slopeRating} (CR {club.difficultyIndex.courseRating})
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 9. 1인 실부담 총비용 */}
                <div className="grid grid-cols-4 gap-4 py-3.5 items-center">
                  <div className="text-slate-700 font-bold">
                    1인 실부담 총비용
                    <span className="block text-[10px] text-slate-400 font-normal">
                      (그린피+카트/{playerCount}+캐디/{playerCount})
                    </span>
                  </div>
                  {comparedClubs.map((club) => {
                    const cost = calculateCostPerPerson(club, isWeekend, playerCount, true);
                    return (
                      <div key={club.id} className="text-slate-900 font-black text-sm sm:text-base">
                        {formatPrice(cost.totalPerPerson)}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          팀당 총 {formatPrice(cost.totalTeamCost)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 10. 그린피 / 카트비 / 캐디피 상세 */}
                <div className="grid grid-cols-4 gap-4 py-3 items-center bg-slate-50/50 -mx-4 px-4 text-xs text-slate-500">
                  <div>세부 비용 명세</div>
                  {comparedClubs.map((club) => (
                    <div key={club.id} className="space-y-0.5">
                      <div>그린피: {formatPrice(isWeekend ? club.pricing.weekendGreenFee : club.pricing.weekdayGreenFee)}</div>
                      <div>카트: {formatPrice(club.pricing.cartFee)} / 캐디: {formatPrice(club.pricing.caddieFee)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
