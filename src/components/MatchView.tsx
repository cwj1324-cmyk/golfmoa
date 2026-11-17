import React, { useMemo, useState } from 'react';
import type { GolfClub, Region } from '../types/golf';
import { calculateCostPerPerson, predictFieldScore } from '../utils/calculator';
import { getClubMetaLine, isFlatCourse } from '../utils/clubDisplay';
import { CompareCheck } from './GolfCard';

/**
 * 안 C · 내 조건 맞춤
 * 라운드 조건을 문장으로 고르고, 골프장마다 맞는 이유와 걸리는 점을 보여 준다.
 * 지역은 꼭 맞아야 하는 조건이고, 나머지는 몇 개가 맞는지 세어 순서를 정한다.
 */
export interface MatchCondition {
  players: 2 | 3 | 4;
  weekend: boolean;
  region: Region;
  budget: number; // 0 = 상관없음
  terrain: '상관없음' | '평지형' | '산악형';
  grass: '상관없음' | '양잔디' | '조선잔디';
}

interface MatchViewProps {
  clubs: GolfClub[];
  comparedIds: Set<string>;
  onToggleCompare: (club: GolfClub) => void;
  onSelectClub: (club: GolfClub) => void;
  userAvgScore: number;
  setUserAvgScore: (score: number) => void;
}

interface Reason {
  ok: boolean;
  text: string;
}

interface Evaluated {
  club: GolfClub;
  cost: number;
  expected: number | null;
  reasons: Reason[];
  okCount: number;
  total: number;
}

const REGIONS: Region[] = ['전체', '경기남부', '경기북부', '인천', '강원', '충청', '전라', '경상', '제주'];
const BUDGETS = [0, 150000, 200000, 250000, 300000, 350000, 400000];
const SCORES = [80, 85, 90, 95, 100, 105];
const PAGE = 24;

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

function evaluate(club: GolfClub, cond: MatchCondition, userAvgScore: number): Evaluated {
  const reasons: Reason[] = [];
  const cost = calculateCostPerPerson(club, cond.weekend, cond.players, true).totalPerPerson;
  const day = cond.weekend ? '주말' : '주중';

  if (cond.budget > 0) {
    reasons.push(
      cost <= cond.budget
        ? { ok: true, text: `${day} 1인 ${won(cost)} — 예산 안` }
        : { ok: false, text: `예산보다 ${won(cost - cond.budget)} 높음` },
    );
  }
  if (cond.players === 2) {
    reasons.push(club.playOptions.twoPlayerAllowed ? { ok: true, text: '2인 플레이 가능' } : { ok: false, text: '2인 플레이 불가로 등록됨' });
  } else if (cond.players === 3) {
    reasons.push(club.playOptions.threePlayerAllowed ? { ok: true, text: '3인 플레이 가능' } : { ok: false, text: '3인 플레이 불가로 등록됨' });
  }
  if (cond.terrain !== '상관없음') {
    const flat = isFlatCourse(club);
    const match = cond.terrain === '평지형' ? flat : !flat;
    reasons.push({ ok: match, text: match ? `${cond.terrain} 코스` : `${flat ? '평지형' : '산악형'} — ${cond.terrain} 조건과 다름` });
  }
  if (cond.grass !== '상관없음') {
    const yang = club.grass.fairway.includes('양잔디');
    const match = cond.grass === '양잔디' ? yang : !yang;
    reasons.push({ ok: match, text: match ? `${cond.grass} 페어웨이` : `${yang ? '양잔디' : '조선잔디'} — ${cond.grass} 아님` });
  }
  const pred = predictFieldScore(club.difficultyIndex?.slopeRating, club.difficultyIndex?.courseRating, userAvgScore);
  if (!pred.isUnrated) {
    const diff = pred.diffFromAverage;
    reasons.push(
      diff <= 3
        ? { ok: true, text: `예상 ${pred.expectedScore}타 — 평소와 비슷한 난이도` }
        : { ok: false, text: `예상 ${pred.expectedScore}타 — 평소보다 ${diff}타 어려움` },
    );
  }
  // 조건이 아닌 참고 정보: 확인된 장점만 덧붙인다
  const extras: Reason[] = [];
  if (club.playOptions.noCaddieAllowed) extras.push({ ok: true, text: '노캐디 가능 — 캐디피를 아낄 수 있음' });
  if (club.teeBoxMatRatio === '매트 없음(100% 잔디)') extras.push({ ok: true, text: '100% 잔디 티' });

  const oks = reasons.filter((r) => r.ok);
  const fails = reasons.filter((r) => !r.ok);
  const okCount = oks.length;
  // 걸리는 점은 항상 모두 보여 주고, 남는 자리에 맞는 이유·장점을 채운다(최대 4줄).
  const room = Math.max(0, 4 - fails.length);
  const shown = [...[...oks, ...extras].slice(0, room), ...fails];
  return {
    club,
    cost,
    expected: pred.isUnrated ? null : pred.expectedScore,
    reasons: shown,
    okCount,
    total: reasons.length,
  };
}

/** 문장 안의 밑줄 선택지 */
function Pick<T extends string | number>({
  value,
  options,
  onChange,
  label,
  render,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  label: string;
  render: (v: T) => string;
}) {
  return (
    <span className="relative inline-block">
      <select
        aria-label={label}
        value={String(value)}
        onChange={(e) => {
          const found = options.find((o) => String(o) === e.target.value);
          if (found !== undefined) onChange(found);
        }}
        className="[field-sizing:content] appearance-none bg-transparent cursor-pointer font-bold text-emerald-800 border-b-2 border-emerald-600 px-0.5 pr-4 focus:outline-none focus-visible:bg-emerald-50 rounded-none"
      >
        {options.map((o) => (
          <option key={String(o)} value={String(o)}>
            {render(o)}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-0.5 top-1/2 -translate-y-1/2 text-[10px] text-emerald-700">▾</span>
    </span>
  );
}

export const MatchView: React.FC<MatchViewProps> = ({
  clubs,
  comparedIds,
  onToggleCompare,
  onSelectClub,
  userAvgScore,
  setUserAvgScore,
}) => {
  const [cond, setCond] = useState<MatchCondition>({
    players: 4,
    weekend: true,
    region: '경기남부',
    budget: 250000,
    terrain: '평지형',
    grass: '상관없음',
  });
  const [count, setCount] = useState(PAGE);
  const set = <K extends keyof MatchCondition>(k: K, v: MatchCondition[K]) => {
    setCond((p) => ({ ...p, [k]: v }));
    setCount(PAGE);
  };

  const results = useMemo(() => {
    return clubs
      .filter((c) => cond.region === '전체' || c.region === cond.region)
      .map((c) => evaluate(c, cond, userAvgScore))
      .sort((a, b) => {
        const missA = a.total - a.okCount;
        const missB = b.total - b.okCount;
        if (missA !== missB) return missA - missB; // 걸리는 점이 적은 순
        if (a.okCount !== b.okCount) return b.okCount - a.okCount; // 확인된 조건이 많은 순
        return a.cost - b.cost;
      });
  }, [clubs, cond, userAvgScore]);

  const perfect = results.filter((r) => r.total > 0 && r.okCount === r.total).length;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
        <p className="text-base sm:text-lg font-semibold text-slate-800 leading-[2.1] text-pretty">
          <Pick label="내 평균 타수" value={userAvgScore} options={SCORES} onChange={setUserAvgScore} render={(v) => `${v}타`} /> 골퍼{' '}
          <Pick label="인원" value={cond.players} options={[2, 3, 4] as const} onChange={(v) => set('players', v)} render={(v) => `${v}명`} />이{' '}
          <Pick label="요일" value={cond.weekend ? '주말' : '주중'} options={['주중', '주말'] as const} onChange={(v) => set('weekend', v === '주말')} render={(v) => v} />에{' '}
          <Pick label="지역" value={cond.region} options={REGIONS} onChange={(v) => set('region', v)} render={(v) => (v === '전체' ? '전국' : v)} />에서, 1인{' '}
          <Pick label="1인 예산" value={cond.budget} options={BUDGETS} onChange={(v) => set('budget', v)} render={(v) => (v === 0 ? '예산 상관없이' : `${v / 10000}만원 이하로`)} />,{' '}
          <Pick label="코스 지형" value={cond.terrain} options={['상관없음', '평지형', '산악형'] as const} onChange={(v) => set('terrain', v)} render={(v) => (v === '상관없음' ? '지형 상관없는' : v)} />{' '}
          <Pick label="잔디" value={cond.grass} options={['상관없음', '양잔디', '조선잔디'] as const} onChange={(v) => set('grass', v)} render={(v) => (v === '상관없음' ? '잔디 상관없는' : v)} /> 코스를 찾아요
        </p>
        <p className="mt-1 text-xs text-slate-500">
          밑줄을 눌러 바꿉니다 · {cond.region === '전체' ? '전국' : cond.region} {results.length}곳 중 조건이 모두 맞는 곳 <b className="text-slate-900">{perfect}</b>곳 · 걸리는 점이 적은 순
        </p>
      </div>

      {results.length === 0 ? (
        <p className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-500">이 지역에 등록된 골프장이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {results.slice(0, count).map(({ club, cost, expected, reasons, okCount, total }) => {
            const isCompared = comparedIds.has(club.id);
            const all = total > 0 && okCount === total;
            return (
              <div
                key={club.id}
                onClick={() => onSelectClub(club)}
                className={`bg-white rounded-xl border p-4 cursor-pointer flex flex-col transition-[border-color] ${
                  isCompared ? 'border-emerald-700 ring-1 ring-emerald-700' : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-bold text-slate-900 truncate">{club.name}</h3>
                      <CompareCheck checked={isCompared} onToggle={() => onToggleCompare(club)} name={club.name} />
                    </div>
                    <p className="text-xs text-slate-500 truncate">{getClubMetaLine(club, false)}</p>
                  </div>
                  {total > 0 && (
                    <span
                      className={`shrink-0 text-[11px] font-extrabold rounded-full px-2 py-0.5 ${
                        all ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      조건 {okCount}/{total}
                    </span>
                  )}
                </div>

                <ul className="my-3 space-y-1 flex-1">
                  {reasons.map((r) => (
                    <li key={r.text} className="flex gap-1.5 text-xs text-slate-700">
                      <span aria-hidden className={`w-3 shrink-0 text-center font-black ${r.ok ? 'text-emerald-700' : 'text-amber-600'}`}>
                        {r.ok ? '✓' : '!'}
                      </span>
                      <span>{r.text}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-end justify-between pt-2.5 border-t border-slate-200 tabular-nums">
                  <div>
                    {expected !== null ? (
                      <>
                        <div className="text-base font-bold text-slate-900">{expected}타</div>
                        <div className="text-[10.5px] text-slate-500">내 예상 타수</div>
                      </>
                    ) : (
                      <div className="text-[11px] text-slate-400">공인 레이팅 없음</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-slate-900">{won(cost)}</div>
                    <div className="text-[10.5px] text-slate-500">
                      1인 · {cond.players}인 {cond.weekend ? '주말' : '주중'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {results.length > count && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setCount((c) => c + PAGE)}
            className="px-5 py-2.5 bg-white border border-slate-300 hover:border-slate-500 rounded-xl text-sm font-bold text-slate-800"
          >
            더 보기 ({count} / {results.length})
          </button>
        </div>
      )}
    </div>
  );
};
