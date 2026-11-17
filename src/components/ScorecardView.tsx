import React, { useState } from 'react';
import type { GolfClub } from '../types/golf';
import { calculateCostPerPerson, predictFieldScore } from '../utils/calculator';
import { getClubMetaLine } from '../utils/clubDisplay';
import { CompareCheck, TraitChips } from './GolfCard';
import { ChevronRight, ArrowDown } from 'lucide-react';

/**
 * 안 A · 스코어카드 행
 * 다나와식 한 줄 목록. 열 머리글을 눌러 예상 타수·비용 순으로 바로 정렬한다.
 */
interface ScorecardViewProps {
  clubs: GolfClub[];
  comparedIds: Set<string>;
  onToggleCompare: (club: GolfClub) => void;
  onSelectClub: (club: GolfClub) => void;
  onOpenCompare: () => void;
  userAvgScore: number;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

const PAGE = 40;

export const ScorecardView: React.FC<ScorecardViewProps> = ({
  clubs,
  comparedIds,
  onToggleCompare,
  onSelectClub,
  onOpenCompare,
  userAvgScore,
  sortBy,
  setSortBy,
}) => {
  const [count, setCount] = useState(PAGE);

  const sortHead = (id: string, label: string, className = '') => (
    <button
      type="button"
      onClick={() => setSortBy(sortBy === id ? 'recommended' : id)}
      aria-pressed={sortBy === id}
      className={`inline-flex items-center gap-0.5 hover:text-slate-900 ${sortBy === id ? 'text-slate-900' : ''} ${className}`}
      title={`${label} 낮은 순으로 정렬`}
    >
      {label}
      {sortBy === id && <ArrowDown className="w-3 h-3" />}
    </button>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* 열 머리글 (데스크톱) */}
      <div className="hidden md:grid grid-cols-[28px_minmax(180px,1.4fr)_minmax(220px,1.6fr)_110px_130px_16px] gap-3 items-center h-9 px-4 bg-slate-50 border-b border-slate-200 text-[11.5px] font-semibold text-slate-500">
        <span aria-hidden="true" />
        {sortHead('name', '골프장')}
        <span>코스 특징</span>
        {sortHead('scoreLow', `내 예상 타수 (${userAvgScore}타)`, 'justify-self-end')}
        {sortHead('costLow', '1인 비용', 'justify-self-end')}
        <span />
      </div>

      <ul className="divide-y divide-slate-100">
        {clubs.slice(0, count).map((club) => {
          const cost = calculateCostPerPerson(club, false, 4, true);
          const weekendGap = club.pricing.weekendGreenFee - club.pricing.weekdayGreenFee;
          const pred = predictFieldScore(club.difficultyIndex?.slopeRating, club.difficultyIndex?.courseRating, userAvgScore);
          const isCompared = comparedIds.has(club.id);
          const slope = club.difficultyIndex?.slopeRating;
          return (
            <li
              key={club.id}
              onClick={() => onSelectClub(club)}
              className={`cursor-pointer px-4 py-3 md:py-0 md:min-h-[64px] grid grid-cols-[22px_1fr_auto] md:grid-cols-[28px_minmax(180px,1.4fr)_minmax(220px,1.6fr)_110px_130px_16px] gap-x-3 gap-y-2 items-center transition-colors ${
                isCompared ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
              }`}
            >
              <CompareCheck checked={isCompared} onToggle={() => onToggleCompare(club)} name={club.name} />

              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">{club.name}</div>
                <div className="text-[11.5px] text-slate-500 truncate">
                  {getClubMetaLine(club, false)}
                  {slope ? ` · 슬로프 ${slope}` : ''}
                </div>
              </div>

              {/* 모바일: 숫자를 이름 오른쪽에 */}
              <div className="md:hidden text-right">
                <div className="text-[15px] font-bold text-slate-900 tabular-nums">{cost.totalPerPerson.toLocaleString('ko-KR')}원</div>
                {!pred.isUnrated && <div className="text-[11px] text-slate-500 tabular-nums">예상 {pred.expectedScore}타</div>}
              </div>

              <div className="col-start-2 col-span-2 md:col-start-auto md:col-span-1">
                <TraitChips club={club} />
              </div>

              <div className="hidden md:block text-right tabular-nums">
                {pred.isUnrated ? (
                  <span className="text-[11px] text-slate-400">레이팅 없음</span>
                ) : (
                  <>
                    <div className="text-base font-bold text-slate-900">{pred.expectedScore}</div>
                    <div className="text-[11px] text-slate-500">
                      {pred.diffFromAverage > 0 ? `+${pred.diffFromAverage}` : pred.diffFromAverage}타
                    </div>
                  </>
                )}
              </div>

              <div className="hidden md:block text-right tabular-nums">
                <div className="text-base font-bold text-slate-900">{cost.totalPerPerson.toLocaleString('ko-KR')}원</div>
                {weekendGap > 0 && (
                  <div className="text-[11px] text-slate-500">주말 +{(weekendGap / 10000).toLocaleString('ko-KR')}만원</div>
                )}
              </div>

              <ChevronRight className="hidden md:block w-4 h-4 text-slate-300" />
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
        <span>
          {Math.min(count, clubs.length)} / {clubs.length}곳 표시 · 1인 비용은 4인·주중·캐디 포함 기준
        </span>
        <div className="flex items-center gap-3">
          {clubs.length > count && (
            <button
              type="button"
              onClick={() => setCount((c) => c + PAGE)}
              className="font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2"
            >
              {PAGE}곳 더 보기
            </button>
          )}
          {comparedIds.size > 0 && (
            <button type="button" onClick={onOpenCompare} className="font-bold text-emerald-800 hover:underline">
              {comparedIds.size}곳 선택됨 · 비교하기 →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
