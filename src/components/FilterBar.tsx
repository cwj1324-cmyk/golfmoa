import React, { useState } from 'react';
import type { FilterState, Region } from '../types/golf';
import {
  Search,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Moon,
  LayoutGrid,
  List,
  MapPin,
  Sprout,
  Leaf,
  Mountain,
  Flag,
  Footprints,
  Layers,
} from 'lucide-react';
import type { ViewMode } from './Navbar';

interface FilterBarProps {
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  totalCount: number;
  filteredCount: number;
  sortBy: string;
  setSortBy: (sort: string) => void;
  viewMode?: ViewMode;
  setViewMode?: (mode: ViewMode) => void;
  compareCount?: number;
  onOpenCompare?: () => void;
}

const REGIONS: Region[] = ['전체', '경기남부', '경기북부', '인천', '강원', '충청', '전라', '경상', '제주'];

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  setFilter,
  totalCount,
  filteredCount,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  compareCount = 0,
  onOpenCompare,
}) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleReset = () => {
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
    });
  };

  const hasActiveFilters =
    filter.region !== '전체' ||
    filter.searchQuery !== '' ||
    filter.maxTotalCostPerPerson < 400000 ||
    filter.fairwayGrass !== '전체' ||
    filter.difficultyFilter !== '전체' ||
    filter.noCaddieOnly ||
    filter.twoPlayerOnly ||
    filter.nightPlayOnly ||
    filter.nightLedOnly ||
    filter.noMatOnly ||
    filter.flatTerrainOnly ||
    filter.wideFairwayOnly ||
    filter.fastGreenOnly ||
    filter.drivingRangeOnly ||
    filter.selectedTheme !== null ||
    filter.userAvgScore !== 90;

  const advancedCount = [
    filter.maxTotalCostPerPerson < 400000,
    filter.difficultyFilter !== '전체',
    filter.drivingRangeOnly,
    filter.twoPlayerOnly,
    filter.wideFairwayOnly,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 mb-4 space-y-3">
      {/* Row 1: Search Input & Region Tabs */}
      <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center justify-between">
        <div className="relative flex-1 flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filter.searchQuery}
            onChange={(e) => setFilter((prev) => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="골프장 이름, 지역 검색 (예: 라비에벨, 남여주, 용인, 서원힐스)"
            className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Region Tabs (Edge-to-edge smooth swipe on mobile) */}
        <div className="flex items-center overflow-x-auto pb-1 md:pb-0 gap-1 scrollbar-none -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
          {REGIONS.map((reg) => (
            <button
              key={reg}
              onClick={() => setFilter((prev) => ({ ...prev, region: reg }))}
              className={`h-9 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center transition-all shrink-0 ${filter.region === reg
                ? 'bg-emerald-700 text-white shadow-2xs font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Condition Filter Buttons (Uniform h-8 height & w-3.5 h-3.5 Lucide icons) */}
      <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* My Score Selector */}
          <div className="h-8 inline-flex items-center bg-slate-100 rounded-lg px-2.5 text-xs border border-slate-200/80">
            <span className="text-[11px] font-medium text-slate-500 mr-1.5 whitespace-nowrap">내 타수:</span>
            <select
              value={filter.userAvgScore || 90}
              onChange={(e) => setFilter((prev) => ({ ...prev, userAvgScore: Number(e.target.value) }))}
              className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
            >
              <option value={80}>80타 (싱글)</option>
              <option value={85}>85타 (중상급)</option>
              <option value={90}>90타 (보기)</option>
              <option value={95}>95타 (안정)</option>
              <option value={100}>100타 (백돌이)</option>
              <option value={105}>105타+ (초보)</option>
            </select>
          </div>

          {/* Condition: 100% 잔디티 */}
          <button
            onClick={() => setFilter((prev) => ({ ...prev, noMatOnly: !prev.noMatOnly }))}
            className={`h-8 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5 transition-all border ${filter.noMatOnly
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
          >
            <Sprout className={`w-3.5 h-3.5 shrink-0 ${filter.noMatOnly ? 'text-white' : 'text-emerald-600'}`} />
            <span>잔디티만</span>
          </button>

          {/* Condition: 양잔디 */}
          <button
            onClick={() =>
              setFilter((prev) => ({
                ...prev,
                fairwayGrass: prev.fairwayGrass === '양잔디' ? '전체' : '양잔디',
              }))
            }
            className={`h-8 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5 transition-all border ${filter.fairwayGrass === '양잔디'
              ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
          >
            <Leaf className={`w-3.5 h-3.5 shrink-0 ${filter.fairwayGrass === '양잔디' ? 'text-white' : 'text-teal-600'}`} />
            <span>양잔디</span>
          </button>

          {/* Condition: 평지·시야 */}
          <button
            onClick={() => setFilter((prev) => ({ ...prev, flatTerrainOnly: !prev.flatTerrainOnly }))}
            className={`h-8 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5 transition-all border ${filter.flatTerrainOnly
              ? 'bg-sky-700 text-white border-sky-700 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
          >
            <Mountain className={`w-3.5 h-3.5 shrink-0 ${filter.flatTerrainOnly ? 'text-white' : 'text-sky-600'}`} />
            <span>평지형</span>
          </button>

          {/* Condition: 야간 3부 */}
          <button
            onClick={() => setFilter((prev) => ({ ...prev, nightPlayOnly: !prev.nightPlayOnly }))}
            className={`h-8 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5 transition-all border ${filter.nightPlayOnly
              ? 'bg-indigo-700 text-white border-indigo-700 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
          >
            <Moon className={`w-3.5 h-3.5 shrink-0 ${filter.nightPlayOnly ? 'text-white' : 'text-indigo-500'}`} />
            <span>야간 3부</span>
          </button>

          {/* Condition: 빠른 그린 */}
          <button
            onClick={() => setFilter((prev) => ({ ...prev, fastGreenOnly: !prev.fastGreenOnly }))}
            className={`h-8 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5 transition-all border ${filter.fastGreenOnly
              ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
          >
            <Flag className={`w-3.5 h-3.5 shrink-0 ${filter.fastGreenOnly ? 'text-white' : 'text-purple-600'}`} />
            <span>빠른 그린</span>
          </button>

          {/* Condition: 노캐디 */}
          <button
            onClick={() => setFilter((prev) => ({ ...prev, noCaddieOnly: !prev.noCaddieOnly }))}
            className={`h-8 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5 transition-all border ${filter.noCaddieOnly
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
          >
            <Footprints className={`w-3.5 h-3.5 shrink-0 ${filter.noCaddieOnly ? 'text-white' : 'text-emerald-600'}`} />
            <span>노캐디</span>
          </button>

          {/* Drawer trigger */}
          <button
            onClick={() => setIsDetailOpen(!isDetailOpen)}
            className={`h-8 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5 transition-all border ${isDetailOpen || advancedCount > 0
              ? 'bg-emerald-700 text-white border-emerald-700 font-bold shadow-2xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
            <span>상세 조건</span>
            {advancedCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-emerald-800 text-[10px] font-black inline-flex items-center justify-center">
                {advancedCount}
              </span>
            )}
            {isDetailOpen ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
          </button>
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1.5 rounded-lg hover:bg-rose-50 transition-all shrink-0 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>필터 초기화</span>
          </button>
        )}
      </div>

      {/* Row 3: Collapsible Drawer (Cost & Difficulty) */}
      {isDetailOpen && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/70 p-3 rounded-lg border border-slate-100 animate-fadeIn">
          {/* Cost Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-700" />
                1인 총비용 상한선
              </span>
              <span className="font-bold text-emerald-800">
                {filter.maxTotalCostPerPerson >= 400000 ? '전체 (무제한)' : `${Math.round(filter.maxTotalCostPerPerson / 10000)}만원 이하`}
              </span>
            </div>
            <input
              type="range"
              min={150000}
              max={400000}
              step={10000}
              value={filter.maxTotalCostPerPerson}
              onChange={(e) => setFilter((prev) => ({ ...prev, maxTotalCostPerPerson: Number(e.target.value) }))}
              className="w-full accent-slate-900 cursor-pointer h-1.5 bg-slate-200 rounded"
            />
          </div>

          {/* USGA Difficulty Selector */}
          <div className="space-y-1">
            <span className="font-semibold text-slate-700 block">코스 공인 난이도 체감</span>
            <select
              value={filter.difficultyFilter}
              onChange={(e) => setFilter((prev) => ({ ...prev, difficultyFilter: e.target.value as any }))}
              className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="전체">전체 난이도</option>
              <option value="쉬움">쉬움 (초보 추천 · 슬로프 118 이하)</option>
              <option value="보통">보통 (표준 코스 · 슬로프 119~127)</option>
              <option value="어려움">어려움 (중상급 코스 · 슬로프 128~134)</option>
              <option value="지옥">지옥 (익스트림 난코스 · 슬로프 135+)</option>
            </select>
          </div>
        </div>
      )}

      {/* Row 4: Results Count, View Switcher & Sort Dropdown */}
      <div className="flex flex-wrap items-center justify-between pt-2 text-xs text-slate-500 border-t border-slate-100 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="whitespace-nowrap">
            검색 결과: <strong className="text-slate-900 font-bold">{filteredCount}</strong>
            <span className="text-slate-400">/{totalCount}곳</span>
          </span>

          {/* Unified 3-Way View Switcher: 카드 / 리스트 / 지도 */}
          {setViewMode && (
            <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg h-8">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`h-7 px-2 rounded-md inline-flex items-center gap-1 text-[11px] transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
                title="카드형 그리드 뷰"
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span>카드</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`h-7 px-2 rounded-md inline-flex items-center gap-1 text-[11px] transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
                title="리스트(표)형 뷰"
              >
                <List className="w-3.5 h-3.5 shrink-0" />
                <span>리스트</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`h-7 px-2 rounded-md inline-flex items-center gap-1 text-[11px] transition-all ${
                  viewMode === 'map'
                    ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
                title="지도형 뷰"
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>지도</span>
              </button>
            </div>
          )}

          {/* Spec Compare Button */}
          {onOpenCompare && (
            <button
              type="button"
              onClick={onOpenCompare}
              className={`h-8 px-2.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 transition-all shrink-0 ${
                compareCount > 0
                  ? 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
              title="선택한 골프장 스펙 비교"
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>스펙 비교</span>
              {compareCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] leading-none rounded-full bg-white text-emerald-800 font-extrabold">
                  {compareCount}
                </span>
              )}
            </button>
          )}
        </div>

        <div className="h-8 inline-flex items-center space-x-1 shrink-0">
          <span className="text-slate-400 text-[11px] sm:text-xs">정렬:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent font-bold text-slate-800 text-[11px] sm:text-xs focus:outline-none cursor-pointer"
          >
            <option value="recommended">추천순</option>
            <option value="name">이름순 (가나다)</option>
            <option value="rating">평점 높은순</option>
            <option value="slopeLow">난이도 쉬운순</option>
            <option value="slopeHigh">난이도 높은순</option>
            <option value="costLow">비용 낮은순</option>
          </select>
        </div>
      </div>
    </div>
  );
};
