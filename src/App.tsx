import { useState, useMemo, useEffect } from 'react';
import { GOLF_CLUBS_DATA, THEME_PRESETS } from './data/golfClubs';
import type { GolfClub, FilterState } from './types/golf';
import { calculateCostPerPerson } from './utils/calculator';
import { Navbar, type ViewMode } from './components/Navbar';
import { ThemeCards } from './components/ThemeCards';
import { FilterBar } from './components/FilterBar';
import { GolfCard } from './components/GolfCard';
import { GolfListView } from './components/GolfListView';
import { MapView } from './components/MapView';
import { ComparisonModal } from './components/ComparisonModal';
import { GolfDetailModal } from './components/GolfDetailModal';
import { FloatingComparisonBar } from './components/FloatingComparisonBar';
import { applyWikiEditsToClubs, getClubRatingStats } from './utils/wikiStorage';
import { Info, ArrowUp } from 'lucide-react';

export function App() {
  // Navigation / View State
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [displayCount, setDisplayCount] = useState<number>(24);

  // Wiki-Overlaid Master Club Data
  const [allClubs, setAllClubs] = useState<GolfClub[]>(() =>
    applyWikiEditsToClubs(GOLF_CLUBS_DATA)
  );

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

  // Detail Modal Club
  const [selectedClub, setSelectedClub] = useState<GolfClub | null>(null);

  // 1. URL Parameter Listener (?compare=구장1,구장2) - 총무 바이럴 링크 수신 처리
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const compareParam = params.get('compare');
      if (compareParam) {
        const queryNames = compareParam
          .split(',')
          .map((s) => decodeURIComponent(s.trim()).toLowerCase());
        const matched = allClubs
          .filter((c) =>
            queryNames.some(
              (qn) =>
                c.name.toLowerCase().includes(qn) || c.id.toLowerCase().includes(qn)
            )
          )
          .slice(0, 3);

        if (matched.length > 0) {
          setComparedClubs(matched);
          setIsCompareModalOpen(true);
        }
      }
    } catch {
      // fallback
    }
  }, [allClubs]);

  const handleToggleCompare = (club: GolfClub) => {
    setComparedClubs((prev) => {
      const exists = prev.some((c) => c.id === club.id);
      if (exists) {
        return prev.filter((c) => c.id !== club.id);
      } else {
        if (prev.length >= 3) {
          alert('비교함에는 최대 3개 구장까지 동시에 담을 수 있습니다.');
          return prev;
        }
        return [...prev, club];
      }
    });
  };

  const handleRemoveFromCompare = (clubId: string) => {
    setComparedClubs((prev) => prev.filter((c) => c.id !== clubId));
  };

  const handleClearCompare = () => {
    setComparedClubs([]);
  };

  // Handle Wiki Updates from Modal
  const handleUpdateClub = (updatedClub: GolfClub) => {
    setAllClubs((prev) =>
      prev.map((c) => (c.id === updatedClub.id ? updatedClub : c))
    );
    setSelectedClub(updatedClub);
    setComparedClubs((prev) =>
      prev.map((c) => (c.id === updatedClub.id ? updatedClub : c))
    );
  };

  const handleSelectTheme = (themeId: string | null) => {
    setFilter((prev) => ({
      ...prev,
      selectedTheme: themeId,
    }));
  };

  // Filter & Sort Logic
  const filteredClubs = useMemo(() => {
    return allClubs.filter((club) => {
      // 1. Search Query (공식 명칭, 주소, 상세 시/군, 태그 검색)
      if (filter.searchQuery.trim()) {
        const query = filter.searchQuery.toLowerCase();
        const matchName = club.name.toLowerCase().includes(query);
        const matchAddress = club.address.toLowerCase().includes(query);
        const matchCity = club.city ? club.city.toLowerCase().includes(query) : false;
        const matchTags = club.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchName && !matchAddress && !matchCity && !matchTags) return false;
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

      // 4. 페어웨이 잔디 종류
      if (filter.fairwayGrass !== '전체') {
        if (!club.grass.fairway.includes(filter.fairwayGrass)) {
          return false;
        }
      }

      // 5. 체감/공인 난이도
      if (filter.difficultyFilter !== '전체') {
        const rd = club.difficultyIndex?.relativeDifficulty;
        const slope = club.difficultyIndex?.slopeRating;
        if (filter.difficultyFilter === '쉬움') {
          if (rd !== '쉬움(초보추천)' && (!slope || slope > 118)) return false;
        } else if (filter.difficultyFilter === '보통') {
          if (rd !== '보통(표준)' && (!slope || slope < 119 || slope > 127)) return false;
        } else if (filter.difficultyFilter === '어려움') {
          if (rd !== '어려움(중상급)' && (!slope || slope < 128 || slope > 134)) return false;
        } else if (filter.difficultyFilter === '지옥') {
          if (rd !== '지옥(상급자전용)' && (!slope || slope < 135)) return false;
        }
      }

      // 6. 편의 옵션
      if (filter.noCaddieOnly && !club.playOptions.noCaddieAllowed) return false;
      if (filter.twoPlayerOnly && !club.playOptions.twoPlayerAllowed) return false;
      if (filter.nightPlayOnly && !club.playOptions.nightPlay) return false;
      if (filter.nightLedOnly && (!club.playOptions.nightPlay || !club.playOptions.lightingType.includes('LED'))) return false;

      // 7. 코스 컨디션 옵션
      if (filter.noMatOnly && club.teeBoxMatRatio !== '매트 없음(100% 잔디)') return false;
      if (filter.flatTerrainOnly && club.courseStyle !== '구릉형(힐)' && club.courseStyle !== '링크스형(평지/해변)' && club.courseStyle !== '곶자왈(평지)') return false;
      if (filter.wideFairwayOnly && club.fairwayWidth !== '넓음') return false;
      if (filter.fastGreenOnly && (!club.greenSpeedAvg || club.greenSpeedAvg < 2.8)) return false;
      if (filter.drivingRangeOnly && !club.facilities.drivingRange) return false;

      // 8. 큐레이션 테마 필터 적용
      if (filter.selectedTheme) {
        const theme = THEME_PRESETS.find((t) => t.id === filter.selectedTheme);
        if (theme && !theme.filter(club)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'ko');
      }
      if (sortBy === 'rating') {
        const statsA = getClubRatingStats(a.id);
        const statsB = getClubRatingStats(b.id);
        if (statsA.rating !== null && statsB.rating !== null) {
          return statsB.rating - statsA.rating || statsB.reviewCount - statsA.reviewCount;
        }
        if (statsA.rating !== null) return -1;
        if (statsB.rating !== null) return 1;
        return a.name.localeCompare(b.name, 'ko');
      }
      if (sortBy === 'slopeHigh') {
        return (b.difficultyIndex?.slopeRating ?? 0) - (a.difficultyIndex?.slopeRating ?? 0);
      }
      if (sortBy === 'slopeLow') {
        return (a.difficultyIndex?.slopeRating ?? 999) - (b.difficultyIndex?.slopeRating ?? 999);
      }
      if (sortBy === 'costLow') {
        const costA = calculateCostPerPerson(a, false, 4, true).totalPerPerson;
        const costB = calculateCostPerPerson(b, false, 4, true).totalPerPerson;
        return costA - costB;
      }
      // default: recommended (KGA 공인 레이팅 보유 구장 우선 배치 후 가나다순)
      const hasRatingA = a.difficultyIndex?.slopeRating != null ? 1 : 0;
      const hasRatingB = b.difficultyIndex?.slopeRating != null ? 1 : 0;
      if (hasRatingB !== hasRatingA) return hasRatingB - hasRatingA;
      return a.name.localeCompare(b.name, 'ko');
    });
  }, [allClubs, filter, sortBy]);

  const comparedIds = useMemo(() => new Set(comparedClubs.map((c) => c.id)), [comparedClubs]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Header Navbar */}
      <Navbar
        compareCount={comparedClubs.length}
        onOpenCompare={() => setIsCompareModalOpen(true)}
      />

      {/* 2. Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 w-full pb-28">
        {/* Page Header (Minimal) */}
        <div className="mb-2.5 sm:mb-3">
          <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
            전국 골프장 코스 조건 정보
          </h1>
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
          totalCount={allClubs.length}
          filteredCount={filteredClubs.length}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {/* View Mode Content (Cards vs Table List vs Map) */}
        {viewMode === 'map' ? (
          <MapView
            clubs={filteredClubs}
            onSelectClub={setSelectedClub}
            comparedIds={comparedIds}
            onToggleCompare={handleToggleCompare}
          />
        ) : filteredClubs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200">
            <Info className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
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
              className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-all shadow-2xs"
            >
              필터 전체 초기화
            </button>
          </div>
        ) : viewMode === 'list' ? (
          /* Table / Compact List View */
          <div>
            <GolfListView
              clubs={filteredClubs}
              onSelectClub={setSelectedClub}
              comparedIds={comparedIds}
              onToggleCompare={handleToggleCompare}
              userAvgScore={filter.userAvgScore}
            />
          </div>
        ) : (
          /* Card Grid View */
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
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
      </main>

      {/* Floating Compare Action Bar (Appears when 1+ club is in compare) */}
      <FloatingComparisonBar
        comparedClubs={comparedClubs}
        onOpenCompare={() => setIsCompareModalOpen(true)}
        onRemoveClub={handleRemoveFromCompare}
        onClearAll={handleClearCompare}
      />

      {/* Detail Modal with Wikipedia Edit & Reviews */}
      {selectedClub && (
        <GolfDetailModal
          club={selectedClub}
          onClose={() => setSelectedClub(null)}
          isCompared={comparedIds.has(selectedClub.id)}
          onToggleCompare={handleToggleCompare}
          userAvgScore={filter.userAvgScore}
          onUpdateClub={handleUpdateClub}
        />
      )}

      {/* 1:1 Comparison Modal */}
      {isCompareModalOpen && (
        <ComparisonModal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          comparedClubs={comparedClubs}
          onRemoveFromCompare={handleRemoveFromCompare}
          onSelectClub={setSelectedClub}
          userAvgScore={filter.userAvgScore}
        />
      )}

      {/* Footer */}
      <footer className="bg-emerald-950 border-t border-emerald-900 py-6 text-emerald-200/70 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="flex items-center space-x-2 text-white font-extrabold text-sm mb-1">
              <span className="text-emerald-400 font-black">GOLFMOA</span>
              <span className="text-white">골프모아</span>
              <span className="text-[11px] text-slate-400 font-normal">
                | KGA·KGBA 공인 데이터 & 골퍼 참여형 코스 정보
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              대한골프협회(KGA) 공식 코스레이팅, 한국골프장경영협회(KGBA) 인허가 현황 및 골퍼들의 정보 수정과 기여로 운영됩니다.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 hover:text-white transition-all"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>맨 위로</span>
            </button>
            <span>•</span>
            <span className="text-slate-500">버전 2.0 (Wiki & List)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
