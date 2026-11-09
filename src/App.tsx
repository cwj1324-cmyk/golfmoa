import { useState, useMemo, useEffect } from 'react';
import { GOLF_CLUBS_DATA, THEME_PRESETS } from './data/golfClubs';
import type { GolfClub, FilterState } from './types/golf';
import { calculateCostPerPerson } from './utils/calculator';
import { Navbar } from './components/Navbar';
import { ThemeCards } from './components/ThemeCards';
import { FilterBar } from './components/FilterBar';
import { GolfCard } from './components/GolfCard';
import { MapView } from './components/MapView';
import { ComparisonModal } from './components/ComparisonModal';
import { GolfDetailModal } from './components/GolfDetailModal';
import { FloatingComparisonBar } from './components/FloatingComparisonBar';
import { Info, ArrowUp } from 'lucide-react';

export function App() {
  // Navigation / View State
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [displayCount, setDisplayCount] = useState<number>(24);

  // Filters State
  const [filter, setFilter] = useState<FilterState>({
    searchQuery: '',
    region: '전체',
    maxTotalCostPerPerson: 400000,
    maxDrivingTime: 300,
    fairwayGrass: '전체',
    difficultyFilter: '전체',
    courseDifficulty: 0,
    noCaddieOnly: false,
    twoPlayerOnly: false,
    nightPlayOnly: false,
    nightLedOnly: false,
    noMatOnly: false,
    flatTerrainOnly: false,
    wideFairwayOnly: false,
    fastGreenOnly: false,
    drivingRangeOnly: false,
    selectedTheme: null,
    userAvgScore: 90,
  });

  const [sortBy, setSortBy] = useState<string>('recommended');

  // Compared Clubs (Max 3)
  const [comparedClubs, setComparedClubs] = useState<GolfClub[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // 1. URL Parameter Listener (?compare=구장1,구장2) - 총무 바이럴 링크 수신 처리
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const compareParam = params.get('compare');
      if (compareParam) {
        const queryNames = compareParam.split(',').map((s) => decodeURIComponent(s.trim()).toLowerCase());
        const matched = GOLF_CLUBS_DATA.filter((c) =>
          queryNames.some((qn) => c.name.toLowerCase().includes(qn) || c.id.toLowerCase().includes(qn))
        ).slice(0, 3);

        if (matched.length > 0) {
          setComparedClubs(matched);
          setIsCompareModalOpen(true);
        }
      }
    } catch {
      // fallback
    }
  }, []);

  // Detail Modal Club
  const [selectedClub, setSelectedClub] = useState<GolfClub | null>(null);

  // Toggle Compare Handler
  const handleToggleCompare = (club: GolfClub) => {
    setComparedClubs((prev) => {
      const exists = prev.some((c) => c.id === club.id);
      if (exists) {
        return prev.filter((c) => c.id !== club.id);
      }
      if (prev.length >= 3) {
        alert('비교함에는 최대 3개 골프장까지 담을 수 있습니다.');
        return prev;
      }
      return [...prev, club];
    });
  };

  const handleRemoveFromCompare = (clubId: string) => {
    setComparedClubs((prev) => prev.filter((c) => c.id !== clubId));
  };

  const handleClearCompare = () => {
    setComparedClubs([]);
  };

  // Theme Select Handler
  const handleSelectTheme = (themeId: string | null) => {
    setFilter((prev) => ({
      ...prev,
      selectedTheme: themeId,
    }));
  };

  // Filter & Sort Logic
  const filteredClubs = useMemo(() => {
    return GOLF_CLUBS_DATA.filter((club) => {
      // 1. Search Query
      if (filter.searchQuery.trim()) {
        const query = filter.searchQuery.toLowerCase();
        const matchName = club.name.toLowerCase().includes(query);
        const matchAddress = club.address.toLowerCase().includes(query);
        const matchTags = club.tags.some((t) => t.toLowerCase().includes(query));
        const matchHighlight = club.highlight.toLowerCase().includes(query);
        if (!matchName && !matchAddress && !matchTags && !matchHighlight) return false;
      }

      // 2. Region
      if (filter.region !== '전체' && club.region !== filter.region) {
        return false;
      }

      // 3. 1인 총비용 (40만원 미만 설정 시에만 필터링)
      if (filter.maxTotalCostPerPerson < 400000) {
        const cost = calculateCostPerPerson(club, false, 4, true);
        if (cost.totalPerPerson > filter.maxTotalCostPerPerson) {
          return false;
        }
      }

      // 4. 서울 기준 소요시간 (300분 미만 설정 시에만 필터링)
      if (filter.maxDrivingTime < 300) {
        if (club.drivingTimeFromSeoul > filter.maxDrivingTime) {
          return false;
        }
      }

      // 5. 잔디 종류
      if (filter.fairwayGrass === '양잔디' && !club.grass.fairway.includes('양잔디')) {
        return false;
      }
      if (filter.fairwayGrass === '조선잔디' && !club.grass.fairway.includes('조선잔디')) {
        return false;
      }

      // 6. 난이도 지수 필터 ('쉬움' | '보통' | '어려움' | '지옥')
      if (filter.difficultyFilter !== '전체') {
        if (!club.difficultyIndex.relativeDifficulty.startsWith(filter.difficultyFilter)) {
          return false;
        }
      }

      // 7. 특수 조건 토글 옵션
      if (filter.noCaddieOnly && !club.playOptions.noCaddieAllowed) return false;
      if (filter.twoPlayerOnly && !club.playOptions.twoPlayerAllowed) return false;
      if (filter.nightPlayOnly && !club.playOptions.nightPlay) return false;
      if (filter.nightLedOnly && (!club.playOptions.nightPlay || !club.playOptions.lightingType.includes('LED'))) return false;
      if (filter.noMatOnly && !club.teeBoxMatRatio.includes('매트 없음')) return false;
      if (filter.flatTerrainOnly && !(club.courseStyle.includes('구릉') || club.courseStyle.includes('링크스') || club.courseStyle.includes('평지'))) return false;
      if (filter.wideFairwayOnly && club.fairwayWidth !== '넓음') return false;
      if (filter.fastGreenOnly && club.greenSpeedAvg < 2.8) return false;
      if (filter.drivingRangeOnly && !club.facilities.drivingRange) return false;

      // 8. Theme Preset
      if (filter.selectedTheme) {
        const theme = THEME_PRESETS.find((t) => t.id === filter.selectedTheme);
        if (theme && !theme.filter(club)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'costLow') {
        const costA = calculateCostPerPerson(a, false, 4, true).totalPerPerson;
        const costB = calculateCostPerPerson(b, false, 4, true).totalPerPerson;
        return costA - costB;
      }
      if (sortBy === 'distance') {
        return a.drivingTimeFromSeoul - b.drivingTimeFromSeoul;
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'slopeHigh') {
        return b.difficultyIndex.slopeRating - a.difficultyIndex.slopeRating;
      }
      if (sortBy === 'slopeLow') {
        return a.difficultyIndex.slopeRating - b.difficultyIndex.slopeRating;
      }
      if (sortBy === 'difficultyDesc') {
        return b.courseDifficulty - a.courseDifficulty;
      }
      if (sortBy === 'difficultyAsc') {
        return a.courseDifficulty - b.courseDifficulty;
      }
      // default: recommended (rating * reviewCount weighted)
      return (b.rating * Math.log10(b.reviewCount)) - (a.rating * Math.log10(a.reviewCount));
    });
  }, [filter, sortBy]);

  const comparedIds = useMemo(() => new Set(comparedClubs.map((c) => c.id)), [comparedClubs]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Header Navbar */}
      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        compareCount={comparedClubs.length}
        onOpenCompare={() => setIsCompareModalOpen(true)}
      />

      {/* 2. Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full pb-28">
        {/* Condition-First Page Header */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              전국 640개 골프장 코스 조건 & 1:1 대조기
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              티박스 매트 유무 · 잔디 종류 · 야간 LED 조명 · 평지 여부 · USGA 공인 난이도 조건 대조
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            전국 640개소 코스 스펙 전수 대조
          </span>
        </div>

        {/* Curation Themes */}
        <ThemeCards
          selectedThemeId={filter.selectedTheme}
          onSelectTheme={handleSelectTheme}
        />

        {/* Multi-Condition Filter Bar */}
        <FilterBar
          filter={filter}
          setFilter={setFilter}
          totalCount={GOLF_CLUBS_DATA.length}
          filteredCount={filteredClubs.length}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        {/* View Mode Content (List View vs Map View) */}
        {viewMode === 'map' ? (
          <MapView
            clubs={filteredClubs}
            onSelectClub={setSelectedClub}
            comparedIds={comparedIds}
            onToggleCompare={handleToggleCompare}
          />
        ) : (
          <div>
            {filteredClubs.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <Info className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  조건에 맞는 골프장이 없습니다.
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  필터 조건을 완화하거나 다른 지역/비용 범위를 선택해 보세요.
                </p>
                <button
                  onClick={() =>
                    setFilter({
                      searchQuery: '',
                      region: '전체',
                      maxTotalCostPerPerson: 400000,
                      maxDrivingTime: 300,
                      fairwayGrass: '전체',
                      difficultyFilter: '전체',
                      courseDifficulty: 0,
                      noCaddieOnly: false,
                      twoPlayerOnly: false,
                      nightPlayOnly: false,
                      nightLedOnly: false,
                      noMatOnly: false,
                      flatTerrainOnly: false,
                      wideFairwayOnly: false,
                      fastGreenOnly: false,
                      drivingRangeOnly: false,
                      selectedTheme: null,
                      userAvgScore: 90,
                    })
                  }
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all"
                >
                  필터 전체 초기화
                </button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredClubs.slice(0, displayCount).map((club) => (
                    <GolfCard
                      key={club.id}
                      club={club}
                      isCompared={comparedIds.has(club.id)}
                      onToggleCompare={handleToggleCompare}
                      onSelectClub={setSelectedClub}
                      userAvgScore={filter.userAvgScore}
                    />
                  ))}
                </div>

                {/* Load More Button */}
                {filteredClubs.length > displayCount && (
                  <div className="mt-8 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => setDisplayCount((prev) => prev + 24)}
                      className="px-6 py-3 bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-xs"
                    >
                      골프장 더보기 (+24개 더 보기)
                      <span className="text-slate-400 font-normal ml-1">
                        ({displayCount} / {filteredClubs.length})
                      </span>
                    </button>
                    <button
                      onClick={() => setDisplayCount(filteredClubs.length)}
                      className="px-4 py-2.5 text-slate-500 hover:text-slate-800 text-xs font-semibold underline transition-all"
                    >
                      전체 {filteredClubs.length}개 한 번에 보기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Compare Action Bar (Appears when 1+ club is in compare) */}
      <FloatingComparisonBar
        comparedClubs={comparedClubs}
        onOpenCompare={() => setIsCompareModalOpen(true)}
        onRemoveClub={handleRemoveFromCompare}
        onClearAll={handleClearCompare}
      />

      {/* Comparison Modal (Danawa-style 1:1 table) */}
      <ComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        comparedClubs={comparedClubs}
        onRemoveFromCompare={handleRemoveFromCompare}
        userAvgScore={filter.userAvgScore}
        onSelectClub={(club) => {
          setIsCompareModalOpen(false);
          setSelectedClub(club);
        }}
      />

      {/* Detailed Club Spec Modal */}
      <GolfDetailModal
        club={selectedClub}
        onClose={() => setSelectedClub(null)}
        isCompared={selectedClub ? comparedIds.has(selectedClub.id) : false}
        onToggleCompare={handleToggleCompare}
        initialUserAvgScore={filter.userAvgScore}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-white font-extrabold text-sm mb-1">
              <span className="text-emerald-400 font-black">GOLFMOA</span>
              <span className="text-white">골프모아</span>
              <span className="text-[11px] text-slate-400 font-normal">| 전국 골프장 스펙 & 실시간 요금 포털</span>
            </div>
            <p className="text-[11px] text-slate-500">
              본 서비스는 골퍼들의 합리적인 골프장 선택을 위해 코스 제원, 잔디, 비용, 편의 옵션을 종합 제공합니다.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <button onClick={scrollToTop} className="flex items-center gap-1 hover:text-white transition-all">
              <ArrowUp className="w-3.5 h-3.5" />
              <span>맨 위로</span>
            </button>
            <span>•</span>
            <span className="text-slate-500">버전 1.0 (MVP)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
