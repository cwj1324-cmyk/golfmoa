import React, { useState } from 'react';
import type { FilterState, Region } from '../types/golf';
import { Search, RotateCcw, SlidersHorizontal, ChevronDown, ChevronUp, DollarSign, Clock } from 'lucide-react';

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
      noMatOnly: false,
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
    filter.noMatOnly ||
    filter.drivingRangeOnly ||
    filter.selectedTheme !== null ||
    filter.userAvgScore !== 90;

  // Active advanced filter count for badge
  const advancedCount = [
    filter.maxTotalCostPerPerson < 400000,
    filter.maxDrivingTime < 300,
    filter.difficultyFilter !== '전체',
    filter.twoPlayerOnly,
    filter.noMatOnly,
    filter.drivingRangeOnly,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 mb-5 space-y-3">
      {/* 1. Primary Search & Region Tabs */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filter.searchQuery}
            onChange={(e) => setFilter((prev) => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="골프장 이름, 지역 검색 (예: 라비에벨, 용인, 서원힐스, 제주)"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Region Pills */}
        <div className="flex items-center overflow-x-auto pb-1 md:pb-0 gap-1 scrollbar-none">
          {REGIONS.map((reg) => (
            <button
              key={reg}
              onClick={() => setFilter((prev) => ({ ...prev, region: reg }))}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${filter.region === reg
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Quick Filter Chips & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* Quick Average Score Dropdown */}
          <div className="inline-flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/70">
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

          {/* Quick Toggle: Yang-grass */}
          <button
            onClick={() =>
              setFilter((prev) => ({
                ...prev,
                fairwayGrass: prev.fairwayGrass === '양잔디' ? '전체' : '양잔디',
              }))
            }
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${filter.fairwayGrass === '양잔디'
                ? 'bg-emerald-800 text-white border-emerald-800'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
          >
            양잔디 100%
          </button>

          {/* Quick Toggle: No Caddie */}
          <button
            onClick={() => setFilter((prev) => ({ ...prev, noCaddieOnly: !prev.noCaddieOnly }))}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${filter.noCaddieOnly
                ? 'bg-emerald-800 text-white border-emerald-800'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
          >
            노캐디
          </button>

          {/* Quick Toggle: Night Play */}
          <button
            onClick={() => setFilter((prev) => ({ ...prev, nightPlayOnly: !prev.nightPlayOnly }))}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${filter.nightPlayOnly
                ? 'bg-indigo-800 text-white border-indigo-800'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
          >
            야간 3부
          </button>

          {/* Expandable Advanced Filter Trigger */}
          <button
            onClick={() => setIsDetailOpen(!isDetailOpen)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all border ${isDetailOpen || advancedCount > 0
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>상세 필터</span>
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
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-50 transition-all ml-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>초기화</span>
            </button>
          )}
        </div>

        {/* Count & Sort */}
        <div className="flex items-center space-x-2 text-xs ml-auto">
          <span className="text-slate-500">
            총 <strong className="text-slate-900 font-bold">{filteredCount}</strong>/{totalCount}개
          </span>
          <span className="text-slate-300">|</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="recommended">추천순</option>
            <option value="costLow">비용 낮은순</option>
            <option value="distance">서울 가까운순</option>
            <option value="slopeHigh">난이도 높은순</option>
            <option value="slopeLow">난이도 쉬운순</option>
            <option value="rating">평점 높은순</option>
          </select>
        </div>
      </div>

      {/* 3. Collapsible Advanced Filters Drawer */}
      {isDetailOpen && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100 animate-fadeIn">
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

          {/* Difficulty Segment */}
          <div className="space-y-1">
            <span className="font-semibold text-slate-700 block">난이도 구분</span>
            <div className="grid grid-cols-5 gap-1 bg-white p-1 rounded-lg border border-slate-200">
              {(['전체', '쉬움', '보통', '어려움', '지옥'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setFilter((prev) => ({ ...prev, difficultyFilter: diff }))}
                  className={`py-0.5 rounded text-[11px] font-semibold transition-all ${filter.difficultyFilter === diff
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Sub Options */}
          <div className="sm:col-span-3 flex items-center gap-2 pt-1 border-t border-slate-200/60">
            <span className="text-slate-500 font-medium">추가 조건:</span>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={filter.twoPlayerOnly}
                onChange={(e) => setFilter((prev) => ({ ...prev, twoPlayerOnly: e.target.checked }))}
                className="rounded accent-emerald-700"
              />
              <span>2인 라운드</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={filter.noMatOnly}
                onChange={(e) => setFilter((prev) => ({ ...prev, noMatOnly: e.target.checked }))}
                className="rounded accent-emerald-700"
              />
              <span>티박스 천연잔디 100%</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={filter.drivingRangeOnly}
                onChange={(e) => setFilter((prev) => ({ ...prev, drivingRangeOnly: e.target.checked }))}
                className="rounded accent-emerald-700"
              />
              <span>드라이빙 레인지</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
