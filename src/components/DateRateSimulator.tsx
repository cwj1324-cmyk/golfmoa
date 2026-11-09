import React, { useState } from 'react';
import type { GolfClub } from '../types/golf';
import { calculateDateSpecificCost, formatPrice } from '../utils/calculator';
import type { TimeSlot } from '../utils/calculator';
import { Calendar as CalendarIcon, Users, Shield, Tag, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';

interface DateRateSimulatorProps {
  club: GolfClub;
}

export const DateRateSimulator: React.FC<DateRateSimulatorProps> = ({ club }) => {
  // 기본 선택일: 오늘로부터 3일 뒤
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 3);

  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('2부_오전골든');
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [withCaddie, setWithCaddie] = useState<boolean>(true);

  // 현실 할인 옵션
  const [applyMemberDiscount, setApplyMemberDiscount] = useState<boolean>(true);
  const [applyLastMinuteDiscount, setApplyLastMinuteDiscount] = useState<boolean>(false);

  // 미니 달력 날짜 목록 생성 (오늘부터 향후 21일간)
  const availableDates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 21; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    availableDates.push(d);
  }

  const estimate = calculateDateSpecificCost(
    club,
    selectedDate,
    timeSlot,
    playerCount,
    withCaddie,
    applyMemberDiscount,
    applyLastMinuteDiscount
  );

  const timeSlots: { key: TimeSlot; label: string; sub: string; disabled?: boolean }[] = [
    { key: '1부_새벽', label: '1부 새벽', sub: '06:00~07:30 (얼리버드 할인)' },
    { key: '2부_오전골든', label: '2부 오전', sub: '07:31~11:30 (골든타임)' },
    { key: '2부_오후', label: '2부 오후', sub: '11:31~14:00 (오후 티)' },
    {
      key: '3부_야간',
      label: '3부 야간',
      sub: club.playOptions.nightPlay ? '17:00~ (야간 나이트)' : '야간 미운영',
      disabled: !club.playOptions.nightPlay
    },
  ];

  // 카카오골프 및 공홈 검색 링크
  const kakaoGolfUrl = `https://golf.kakao.com/search?keyword=${encodeURIComponent(club.name)}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4 text-emerald-800" />
          <h4 className="font-bold text-sm text-slate-900">일자별·시간대별 실부담 요금 시뮬레이터</h4>
        </div>
        <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          실제 티타임 요율 반영
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {/* 1. Date Selector (Horizontal Scrollable Strip) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">라운드 희망일 선택</span>
            <span className="text-xs font-bold text-emerald-800">
              {estimate.dateString} ({estimate.dayOfWeekName}요일) · {estimate.seasonType}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
            {availableDates.map((date, idx) => {
              const isSelected =
                date.getFullYear() === selectedDate.getFullYear() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getDate() === selectedDate.getDate();

              const day = date.getDay();
              const isWeekend = day === 0 || day === 6;
              const isSat = day === 6;
              const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(date)}
                  className={`flex flex-col items-center justify-center min-w-[52px] py-2 px-1 rounded-xl text-center transition-all shrink-0 border ${isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                >
                  <span className={`text-[10px] font-medium ${isSelected ? 'text-slate-300' : isWeekend ? (isSat ? 'text-blue-600' : 'text-rose-600') : 'text-slate-400'
                    }`}>
                    {dayNames[day]}
                  </span>
                  <span className="text-sm font-bold mt-0.5">
                    {date.getDate()}
                  </span>
                  <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-emerald-300' : 'text-slate-400'}`}>
                    {date.getMonth() + 1}월
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Time Slot Selection */}
        <div>
          <span className="text-xs font-semibold text-slate-700 block mb-2">시간대 선택</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {timeSlots.map((slot) => {
              const isSelected = timeSlot === slot.key;
              return (
                <button
                  key={slot.key}
                  disabled={slot.disabled}
                  onClick={() => setTimeSlot(slot.key)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${isSelected
                      ? 'border-emerald-700 bg-emerald-50/80 ring-1 ring-emerald-700'
                      : slot.disabled
                        ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                >
                  <span className={`block text-xs font-bold ${isSelected ? 'text-emerald-900' : slot.disabled ? 'text-slate-400' : 'text-slate-900'}`}>
                    {slot.label}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5 truncate">
                    {slot.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Players & Caddie Setup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Players */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-700 block mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              플레이 인원수
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[4, 3, 2].map((num) => {
                const disabled = num === 2 && !club.playOptions.twoPlayerAllowed;
                return (
                  <button
                    key={num}
                    disabled={disabled}
                    onClick={() => setPlayerCount(num)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${playerCount === num
                        ? 'bg-slate-900 text-white border-slate-900'
                        : disabled
                          ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    {num}인 {disabled ? '(불가)' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Caddie Option */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-700 block mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              캐디 선택
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setWithCaddie(true)}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${withCaddie
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                캐디 동반
              </button>
              <button
                disabled={!club.playOptions.noCaddieAllowed && club.pricing.caddieFee > 0}
                onClick={() => setWithCaddie(false)}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${!withCaddie
                    ? 'bg-slate-900 text-white border-slate-900'
                    : !club.playOptions.noCaddieAllowed && club.pricing.caddieFee > 0
                      ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                노캐디 (0원)
              </button>
            </div>
          </div>
        </div>

        {/* 4. Realistic Discount Toggles (실제 부킹 플랫폼 가격 반영) */}
        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-emerald-700" />
              실제 예약 할인율 보정 옵션
            </span>
            <span className="text-[10px] text-slate-500">부킹앱 및 공홈 실시간 혜택 반영</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Member Discount Toggle */}
            <button
              onClick={() => setApplyMemberDiscount(!applyMemberDiscount)}
              className={`p-2.5 rounded-lg border text-left flex items-start justify-between transition-all ${applyMemberDiscount
                  ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-1 ring-emerald-600'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
            >
              <div>
                <span className="font-bold block">공홈 인터넷 회원 할인</span>
                <span className="text-[11px] text-slate-500">홈페이지 가입 시 자동 1만 원 차감</span>
              </div>
              <span className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded ${applyMemberDiscount ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                -10,000원
              </span>
            </button>

            {/* Last-minute Special Discount Toggle */}
            <button
              onClick={() => setApplyLastMinuteDiscount(!applyLastMinuteDiscount)}
              className={`p-2.5 rounded-lg border text-left flex items-start justify-between transition-all ${applyLastMinuteDiscount
                  ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-1 ring-emerald-600'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
            >
              <div>
                <span className="font-bold block">잔여티 임박 특가 모드</span>
                <span className="text-[11px] text-slate-500">1~3일 전 비선호 티타임 최대 20% 추가 할인</span>
              </div>
              <span className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded ${applyLastMinuteDiscount ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                -20% 특가
              </span>
            </button>
          </div>
        </div>

        {/* 5. Final Real-Time Cost Card */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-emerald-300 text-xs font-semibold mb-1">
                <span>{estimate.dateString} ({estimate.dayOfWeekName})</span>
                <span>•</span>
                <span>{estimate.timeSlotName.split(' ')[0]}</span>
                <span>•</span>
                <span>{playerCount}인 기준</span>
                {estimate.totalDiscountAmount > 0 && (
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                    총 {formatPrice(estimate.totalDiscountAmount)} 할인 적용
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-300 flex items-center gap-2">
                <span>그린피 {formatPrice(estimate.greenFee)}</span>
                <span>+</span>
                <span>카트 {formatPrice(estimate.cartFeeShare)}</span>
                <span>+</span>
                <span>캐디 {formatPrice(estimate.caddieFeeShare)}</span>
              </div>
              {estimate.totalDiscountAmount > 0 && (
                <div className="text-[11px] text-slate-400 mt-1 line-through">
                  공시 정상가: {formatPrice(estimate.originalGreenFee)}
                </div>
              )}
            </div>

            <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-5">
              <span className="text-[11px] text-slate-400 block font-medium">1인 실부담 예상 금액</span>
              <div className="flex items-baseline sm:justify-end space-x-1.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                  {formatPrice(estimate.totalPerPerson)}
                </span>
                <span className="text-xs text-slate-400">/ 1인</span>
              </div>
              <span className="block text-[11px] text-slate-400 mt-1">
                팀 전체 결제액: <strong className="text-white">{formatPrice(estimate.totalTeamCost)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* 6. Dual Legal Outlink Buttons (실시간가 확인) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">실제 예약 플랫폼 실시간가 확인</span>
            <span className="text-[10px] text-slate-400">새 창으로 안전하게 이동합니다</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Kakao Golf Outlink */}
            <a
              href={kakaoGolfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-950 rounded-xl text-xs font-bold flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FEE500] text-slate-900 flex items-center justify-center text-[10px] font-black shrink-0">
                  K
                </span>
                <span>카카오골프예약 실시간 잔여티 조회</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {/* Official Website Outlink */}
            <a
              href={club.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>골프장 공식 홈페이지 예약창 바로가기</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* 7. Legal & Factual Disclaimer */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-700 font-semibold">요금 안내 및 유의사항:</strong> 본 시뮬레이션 금액은 골프장 공시 요금 및 시즌/시간대별 통상 요율을 기준으로 산출한 예상가입니다. 실시간 잔여 티타임 현황, 날씨 특가, 각 부킹 플랫폼의 선결제 프로모션에 따라 실제 결제액과 차이가 있을 수 있으므로, 상단의 실시간 조회 링크를 통해 최종 티타임 요금을 확인하시기 바랍니다.
          </div>
        </div>
      </div>
    </div>
  );
};
