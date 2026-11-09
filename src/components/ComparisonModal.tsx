import React, { useState, useEffect } from 'react';
import type { GolfClub } from '../types/golf';
import { calculateCostPerPerson, formatPrice, predictFieldScore } from '../utils/calculator';
import { X, ExternalLink, Gauge, MapPin, Share2, Copy, ThumbsUp, Sparkles } from 'lucide-react';

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

  // 2. 카카오톡 단톡방용 텍스트 요약 복사
  const handleCopyKakaoText = () => {
    const dayText = isWeekend ? '주말' : '주중';
    const lines = [
      `⛳ [골프모아] 라운드 후보 골프장 ${comparedClubs.length}곳 비교 견적표`,
      `기준: ${dayText} / ${playerCount}인 라운드 (카트+캐디 포함)`,
      '--------------------------------',
    ];

    comparedClubs.forEach((club, idx) => {
      const cost = calculateCostPerPerson(club, isWeekend, playerCount, true);
      const prediction = predictFieldScore(club.difficultyIndex.slopeRating, club.difficultyIndex.courseRating, userAvgScore);
      lines.push(
        `${idx + 1}. ${club.name} (${club.region} / 서울 ${club.drivingTimeFromSeoul}분)`,
        `   • 1인 실부담: ${formatPrice(cost.totalPerPerson)} (팀: ${formatPrice(cost.totalTeamCost)})`,
        `   • 잔디/전장: ${club.grass.fairway} / ${club.totalLengthMeters.toLocaleString()}m`,
        `   • 공식 난이도: 슬로프 ${club.difficultyIndex.slopeRating} (내 타수 기준 예상 ${prediction.expectedScore}타)`,
        `   • 득표수: ${votes[club.id] || 0}표`,
        ''
      );
    });

    lines.push(
      `👉 1:1 스펙 대조 & 동반자 투표하기:`,
      shareUrl
    );

    const fullText = lines.join('\n');
    navigator.clipboard.writeText(fullText).then(() => {
      setCopyFeedback('카톡 단톡방 공유용 텍스트가 복사되었습니다!');
      setTimeout(() => setCopyFeedback(null), 3000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                1:1 다나와식 스펙 대조표
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                골프장 비교 ({comparedClubs.length}/3)
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              동반자와 후보 구장의 스펙, 1인 실부담액, 예상 타수를 나란히 비교하고 투표해보세요.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Weekend toggle */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
              <button
                onClick={() => setIsWeekend(false)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  !isWeekend ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600'
                }`}
              >
                주중
              </button>
              <button
                onClick={() => setIsWeekend(true)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  isWeekend ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600'
                }`}
              >
                주말
              </button>
            </div>

            {/* Players count */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
              {[4, 3, 2].map((p) => (
                <button
                  key={p}
                  onClick={() => setPlayerCount(p)}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    playerCount === p ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  {p}인
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Organizer's Share & Live Poll Bar (총무 전용 공유 툴바) */}
        {comparedClubs.length > 0 && (
          <div className="bg-emerald-900 text-white px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-emerald-200">총무 전용 동반자 조율 툴:</span>
              <span className="text-slate-300 hidden md:inline">
                단톡방에 이 비교표를 보내고 선호 구장 투표를 받아보세요
              </span>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {copyFeedback && (
                <span className="text-[11px] text-emerald-300 font-bold animate-fadeIn">
                  ✓ {copyFeedback}
                </span>
              )}
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1 transition-all border border-emerald-700"
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
              <p className="text-xs">골프장 목록에서 [비교 담기]를 눌러 최대 3개 구장을 비교해보세요.</p>
            </div>
          ) : (
            <div className="min-w-[640px]">
              {/* Header Cards Row with Live Vote Buttons */}
              <div className="grid grid-cols-4 gap-4 pb-4 border-b border-slate-200">
                <div className="flex flex-col justify-end text-xs font-bold text-slate-400 uppercase tracking-wider pb-2">
                  <span>항목 구분</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    (클럽별 세부 지표 대조)
                  </span>
                </div>

                {comparedClubs.map((club) => {
                  const voteCount = votes[club.id] || 0;
                  const isMyVote = myVotedClubId === club.id;

                  return (
                    <div
                      key={club.id}
                      className="relative bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex flex-col justify-between"
                    >
                      <button
                        onClick={() => onRemoveFromCompare(club.id)}
                        className="absolute top-2 right-2 p-1 bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full transition-all shadow-2xs"
                        title="비교에서 제거"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="cursor-pointer" onClick={() => onSelectClub(club)}>
                        <img
                          src={club.imageUrl}
                          alt={club.name}
                          className="w-full h-24 object-cover rounded-xl mb-2"
                        />
                        <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1 hover:text-emerald-800">
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
                        className={`mt-2 w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                          isMyVote
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-600 hover:text-emerald-800'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${isMyVote ? 'fill-white' : ''}`} />
                        <span>이 구장 투표 ({voteCount}표)</span>
                      </button>

                      {/* External Outlink Quick Buttons */}
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

              {/* Rows: 1. Cost Comparison */}
              <div className="divide-y divide-slate-100 text-xs sm:text-sm">
                {/* 1인 실부담 총비용 */}
                <div className="grid grid-cols-4 gap-4 py-3.5 bg-emerald-50/60 -mx-4 px-4 font-bold items-center">
                  <div className="text-emerald-950 font-extrabold">
                    1인 실부담 총비용
                    <span className="block text-[10px] text-emerald-700 font-normal">
                      (그린피+카트/{playerCount}+캐디/{playerCount})
                    </span>
                  </div>
                  {comparedClubs.map((club) => {
                    const cost = calculateCostPerPerson(club, isWeekend, playerCount, true);
                    return (
                      <div key={club.id} className="text-emerald-800 font-black text-sm sm:text-base">
                        {formatPrice(cost.totalPerPerson)}
                        <span className="block text-[10px] text-slate-500 font-normal">
                          팀당 총 {formatPrice(cost.totalTeamCost)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 그린피 / 카트비 / 캐디피 */}
                <div className="grid grid-cols-4 gap-4 py-3 items-center">
                  <div className="text-slate-500 font-medium">그린피 ({isWeekend ? '주말' : '주중'})</div>
                  {comparedClubs.map((club) => (
                    <div key={club.id} className="font-semibold text-slate-800">
                      {formatPrice(isWeekend ? club.pricing.weekendGreenFee : club.pricing.weekdayGreenFee)}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-4 py-3 items-center">
                  <div className="text-slate-500 font-medium">카트비 / 캐디피</div>
                  {comparedClubs.map((club) => (
                    <div key={club.id} className="text-slate-700 text-xs">
                      카트 {formatPrice(club.pricing.cartFee)}<br />
                      캐디 {club.pricing.caddieFee === 0 ? '전면 노캐디 (0원)' : formatPrice(club.pricing.caddieFee)}
                    </div>
                  ))}
                </div>

                {/* 내 타수 기준 예상 스코어 (NEW Score Predictor Row) */}
                <div className="grid grid-cols-4 gap-4 py-3.5 bg-blue-50/70 -mx-4 px-4 items-center">
                  <div>
                    <div className="flex items-center gap-1 text-blue-950 font-extrabold">
                      <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                      <span>내 체감 예상 타수</span>
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
                          <span className={`text-[11px] font-bold ${diff > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            ({diffText}타)
                          </span>
                        </div>
                        <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          club.difficultyIndex.slopeRating >= 135
                            ? 'bg-rose-100 text-rose-800'
                            : club.difficultyIndex.slopeRating <= 118
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {club.difficultyIndex.slopeRating <= 118 ? '🏆 라베 추천' : club.difficultyIndex.slopeRating >= 135 ? '⚠️ 볼 분실 주의' : '표준 코스'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 잔디 종류 */}
                <div className="grid grid-cols-4 gap-4 py-3 items-center bg-slate-50/50 -mx-4 px-4">
                  <div className="text-slate-500 font-medium">페어웨이 잔디</div>
                  {comparedClubs.map((club) => (
                    <div key={club.id} className="font-bold text-slate-900">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                        club.grass.fairway.includes('양잔디') ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {club.grass.fairway}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 공식 난이도 지수 (Slope & Course Rating) */}
                <div className="grid grid-cols-4 gap-4 py-3 items-center">
                  <div>
                    <span className="font-extrabold text-slate-900 block">공식 난이도 지수</span>
                    <span className="text-[10px] text-slate-500">USGA/KGA 슬로프 & CR</span>
                  </div>
                  {comparedClubs.map((club) => (
                    <div key={club.id} className="space-y-0.5">
                      <div className="font-bold text-slate-900 text-xs">
                        슬로프 {club.difficultyIndex.slopeRating} (CR {club.difficultyIndex.courseRating})
                      </div>
                      <div className="text-[11px] text-slate-500">
                        스마트스코어 평균 {club.difficultyIndex.avgFieldScore}타
                      </div>
                    </div>
                  ))}
                </div>

                {/* 그린 스피드 & 난이도 */}
                <div className="grid grid-cols-4 gap-4 py-3 items-center bg-slate-50/50 -mx-4 px-4">
                  <div className="text-slate-500 font-medium">평균 그린스피드</div>
                  {comparedClubs.map((club) => (
                    <div key={club.id} className="font-bold text-emerald-800 flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5" />
                      {club.greenSpeedAvg}m ({club.greenDifficulty >= 4 ? '초고속' : '보통'})
                    </div>
                  ))}
                </div>

                {/* 코스 전장 & 폭 */}
                <div className="grid grid-cols-4 gap-4 py-3 items-center">
                  <div className="text-slate-500 font-medium">전장 & 페어웨이</div>
                  {comparedClubs.map((club) => (
                    <div key={club.id} className="text-slate-800">
                      <span className="font-bold">{club.totalLengthMeters.toLocaleString()}m</span>
                      <span className="text-slate-500 text-xs block">{club.fairwayWidth} 폭 / {club.courseStyle}</span>
                    </div>
                  ))}
                </div>

                {/* 티박스 매트 유무 */}
                <div className="grid grid-cols-4 gap-4 py-3 items-center bg-slate-50/50 -mx-4 px-4">
                  <div className="text-slate-500 font-medium">티박스 매트 여부</div>
                  {comparedClubs.map((club) => (
                    <div key={club.id} className="text-xs font-semibold">
                      {club.teeBoxMatRatio.includes('매트 없음') ? (
                        <span className="text-emerald-800 font-bold">⭕ 천연잔디 100%</span>
                      ) : (
                        <span className="text-slate-500">매트 혼용</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* 플레이 옵션 (노캐디/2인/야간) */}
                <div className="grid grid-cols-4 gap-4 py-3 items-center">
                  <div className="text-slate-500 font-medium">편의 옵션</div>
                  {comparedClubs.map((club) => (
                    <div key={club.id} className="text-xs space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">노캐디:</span>
                        <span className="font-bold">{club.playOptions.noCaddieAllowed ? '가능' : '불가'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">2인 플레이:</span>
                        <span className="font-bold">{club.playOptions.twoPlayerAllowed ? '가능' : '불가'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">야간 3부:</span>
                        <span className="font-bold">{club.playOptions.nightPlay ? '운영' : '미운영'}</span>
                      </div>
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
