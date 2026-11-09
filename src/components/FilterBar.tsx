import React, { useState } from 'react';
import type { FilterState, Region } from '../types/golf';
import { Search, RotateCcw, SlidersHorizontal, ChevronDown, ChevronUp, DollarSign, Clock, Moon } from 'lucide-react';

interface FilterBarProps {
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  totalCount: number;
  filteredCount: number;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

const REGIONS: Region[] = ['전체', '경기남부', '경기북부', '인천', '강원', '충청', '전라', '경상', '제주'];

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  setFilter,
  totalCount,
  filteredCount,
  sortBy,
  setSortBy,
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
    filter.maxDrivingTime < 300 ||
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

  // Active advanced filter count for badge
  const advancedCount = [
    filter.maxTotalCostPerPerson < 400000,
    filter.maxDrivingTime < 300,
    filter.difficultyFilter !== '전체',
    filter.drivingRangeOnly,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 mb-5 space-y-3">
      {/* 1. Primary Search & Region Tabs */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filter.searchQuery}
            onChange={(e) => setFilter((prev) => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="골프장 이름, 지역 검색 (예: 라비에벨, 남여주, 용인, 서원힐스, 제주)"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Region Pills */}
        <div className="flex items-center overflow-x-auto pb-1 md:pb-0 gap-1 scrollbar-none">
          {REGIONS.map((reg) => (
            <button
              key={reg}
              onClick={() => setFilter((prev) => ({ ...prev, region: reg }))}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filter.region === reg
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Condition-First Quick Filter Chips */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* Quick Average Score Dropdown */}
          <div className="inline-flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/70 mr-1">
            <span className="text-[11px] font-medium text-slate-500 pl-2 pr-1">내 타수:</span>
            <select
              value={filter.userAvgScore || 90}
              onChange={(e) => setFilter((prev) => ({ ...prev, userAvgScore: Number(e.target.value) }))}
              className="bg-transparent font-bold text-slate-800 text-xs py-1 pr-1 focus:outline-none cursor-pointer"
            >
              <option value={80}>80타 (싱글)</option>
              <option value={85}>85타 (중상급)</option>
              <option value={90}>90타 (보기)</option>
              <option value={95}>95타 (안정)</option>
              <option value={100}>100타 (백돌이)</option>
              <option value={105}>105타+ (초보)</option>
            </select>
          </div>

          {/* Condition Chip: 100% 잔디티 (매트 없음) */}
          <button
            onClick={() => setFilter((prev) => ({ ...prev, noMatOnly: !prev.noMatOnly }))}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
              filter.noMatOnly
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            🌱 100% 잔디티
          </button>

          {/* Condition Chip: 양잔디 */}
          <button
            onClick={() =>
              setFilter((prev) => ({
                ...prev,
                fairwayGrass: prev.fairwayGrass === '양잔디' ? '전체' : '양잔디',
              }))
            }
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
              filter.fairwayGrass === '양잔디'
                ? 'bg-teal-800 text-white border-teal-800 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            🌿 양잔디
          </button>

          {/* Condition Chip: 조선잔디 */}
          <button
            onClick={() =>
              setFilter((prev) => ({
                ...prev,
                fairwayGrass: prev.fairwayGrass === '조선잔디' ? '전체' : '조선잔디',
              }))
            }
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
              filter.fairwayGrass === '조선잔디'
                ? 'bg-amber-800 text-white border-amber-800 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            🌾 조선잔디
          </button>

          {/* Condition Chip: 평지·시야개방 */}
          <button
            onClick={() => setFilter((prev) => ({ ...prev, flatTerrainOnly: !prev.flatTerrainOnly }))}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
              filter.flatTerrainOnly
                ? 'bg-sky-800 text-white border-sky-800 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            ⛰️ 평지·시야개방
          </button>

          {/* Condition Chip: 🌙 야간 3부 (LED 라이트) */}
          <button
            onClick={() => setFilter((prev) => ({ ...prev, nightPlayOnly: !prev.nightPlayOnly }))}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1 ${
              filter.nightPlayOnly
                ? 'bg-indigo-800 text-white border-indigo-800 shadow-2xs'
                : 'bg-white text-indigo-900 border-slate-200 hover:bg-indigo-50/50'
            }`}
          >
            <Moon className="w-3 h-3 text-indigo-500 fill-indigo-500" />
            <span>야간 3부 (LED)</span>
          </button>

          {/* Condition Chip: 빠른 그린 2.8m+ */}
          <button
            onClick={() => setFilter((prev) => ({ ...prev, fastGreenOnly: !prev.fastGreenOnly }))}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
              filter.fastGreenOnly
                ? 'bg-purple-800 text-white border-purple-800 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            ⛳ 빠른 그린 (2.8m+)
          </button>

          {/* Condition Chip: 넓은 페어웨이 */}
          <button
            onClick={() => setFilter((prev) => ({ ...prev, wideFairwayOnly: !prev.wideFairwayOnly }))}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
              filter.wideFairwayOnly
                ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            📏 넓은 페어웨이
          </button>

          {/* Condition Chip: 노캐디 */}
          <button
            onClick={() => setFilter((prev) => ({ ...prev, noCaddieOnly: !prev.noCaddieOnly }))}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
              filter.noCaddieOnly
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            🚶 노캐디
          </button>

          {/* Condition Chip: 2인 라운드 */}
          <button
            onClick={() => setFilter((prev) => ({ ...prev, twoPlayerOnly: !prev.twoPlayerOnly }))}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
              filter.twoPlayerOnly
                ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            👥 2인 가능
          </button>

          {/* Detail Drawer Trigger */}
          <button
            onClick={() => setIsDetailOpen(!isDetailOpen)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all border ${
              isDetailOpen || advancedCount > 0
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>비용·거리 필터</span>
            {advancedCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-900 text-[10px] font-black flex items-center justify-center ml-0.5">
                {advancedCount}
              </span>
            )}
            {isDetailOpen ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </button>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-50 transition-all ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>초기화</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Collapsible Advanced Filters (Price, Travel Time, Difficulty) */}
      {isDetailOpen && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3 rounded-lg border border-slate-100 animate-fadeIn">
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
              className="w-full accent-emerald-800 cursor-pointer h-1.5 bg-slate-200 rounded"
            />
          </div>

          {/* Driving Time Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-600" />
                서울 기준 소요시간
              </span>
              <span className="font-bold text-blue-700">
                {filter.maxDrivingTime >= 300 ? '전국 전체' : `${filter.maxDrivingTime}분 이내`}
              </span>
            </div>
            <input
              type="range"
              min={40}
              max={300}
              step={10}
              value={filter.maxDrivingTime}
              onChange={(e) => setFilter((prev) => ({ ...prev, maxDrivingTime: Number(e.target.value) }))}
              className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded"
            />
          </div>

          {/* Difficulty Dropdown */}
          <div className="space-y-1">
            <span className="font-semibold text-slate-700 block">코스 공인 난이도 체감</span>
            <select
              value={filter.difficultyFilter}
              onChange={(e) => setFilter((prev) => ({ ...prev, difficultyFilter: e.target.value as any }))}
              className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-700"
            >
              <option value="전체">전체 난이도</option>
              <option value="쉬움">쉬움 (초보자 추천 · 슬로프 118 이하)</option>
              <option value="보통">보통 (표준 난이도 · 슬로프 119~127)</option>
              <option value="어려움">어려움 (중상급자 도전 · 슬로프 128~134)</option>
              <option value="지옥">지옥 (익스트림 난코스 · 슬로프 135 이상)</option>
            </select>
          </div>
        </div>
      )}

      {/* 4. Active Count & Sort By */}
      <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
        <div>
          조건 일치 골프장: <strong className="text-slate-900 font-bold">{filteredCount}</strong>개 / 전체 {totalCount}개
        </div>

        <div className="flex items-center space-x-1">
          <span className="text-slate-400">정렬:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="recommended">추천순</option>
            <option value="rating">평점 높은순</option>
            <option value="distance">서울 가까운순</option>
            <option value="slopeLow">난이도 쉬운순</option>
            <option value="slopeHigh">난이도 높은순</option>
            <option value="costLow">비용 낮은순</option>
          </select>
        </div>
      </div>
    </div>
  );
};
