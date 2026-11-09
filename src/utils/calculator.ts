import type { GolfClub } from '../types/golf';

export type TimeSlot = '1부_새벽' | '2부_오전골든' | '2부_오후' | '3부_야간';

export interface DateCostEstimate {
  selectedDate: Date;
  dateString: string;
  dayOfWeekName: string;
  isWeekend: boolean;
  isFriday: boolean;
  seasonType: '성수기(봄/가을)' | '준성수기' | '비수기(여름/겨울)';
  timeSlot: TimeSlot;
  timeSlotName: string;
  originalGreenFee: number; // 할인 적용 전 공시 기준가
  greenFee: number; // 최종 적용된 1인 그린피
  memberDiscountAmount: number; // 공홈 인터넷 회원 할인액
  lastMinuteDiscountAmount: number; // 잔여티 임박 특가 할인액
  totalDiscountAmount: number; // 총 할인액
  cartFeeShare: number;
  caddieFeeShare: number;
  totalPerPerson: number;
  totalTeamCost: number;
  discountRate: number; // 총 할인율 (%)
}

/**
 * 일자, 시간대, 인원수, 캐디 여부 및 할인 옵션(회원가/임박특가)에 따른 정밀 그린피 및 1인 총비용 계산
 */
export function calculateDateSpecificCost(
  club: GolfClub,
  date: Date,
  timeSlot: TimeSlot = '2부_오전골든',
  playerCount: number = 4,
  withCaddie: boolean = true,
  applyMemberDiscount: boolean = true, // 기본: 공홈 인터넷 회원 할인 적용
  applyLastMinuteDiscount: boolean = false // 기본: 임박 특가 모드 오프
): DateCostEstimate {
  const day = date.getDay(); // 0: 일, 1: 월, ..., 5: 금, 6: 토
  const month = date.getMonth() + 1; // 1 ~ 12

  const isWeekend = day === 0 || day === 6;
  const isFriday = day === 5;
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeekName = dayNames[day];

  // 시즌 판별 (4~5월, 9~10월: 성수기, 6~8월: 하계 비수기/혹서기, 12~2월: 동계)
  let seasonType: '성수기(봄/가을)' | '준성수기' | '비수기(여름/겨울)' = '성수기(봄/가을)';
  let seasonMultiplier = 1.0;
  if ([1, 2, 12].includes(month)) {
    seasonType = '비수기(여름/겨울)';
    seasonMultiplier = 0.82; // 동계 18% 할인
  } else if ([7, 8].includes(month)) {
    seasonType = '비수기(여름/겨울)';
    seasonMultiplier = 0.88; // 혹서기 12% 할인
  } else if ([3, 6, 11].includes(month)) {
    seasonType = '준성수기';
    seasonMultiplier = 0.94;
  }

  // 기준 그린피 (주중 vs 주말 vs 금요일)
  let baseGreenFee = club.pricing.weekdayGreenFee;
  if (isWeekend) {
    baseGreenFee = club.pricing.weekendGreenFee;
  } else if (isFriday) {
    // 금요일은 주중과 주말의 중간 요금 적용
    baseGreenFee = Math.round((club.pricing.weekdayGreenFee * 0.4 + club.pricing.weekendGreenFee * 0.6) / 1000) * 1000;
  }

  // 시간대별 요율 조정 (1부 새벽 할인, 2부 골든타임 정가, 3부 야간 할인)
  let slotMultiplier = 1.0;
  let timeSlotName = '2부 오전 (07:30~11:30)';

  if (timeSlot === '1부_새벽') {
    slotMultiplier = 0.88; // 1부 새벽 얼리버드 12% 할인
    timeSlotName = '1부 새벽 얼리버드 (06:00~07:30)';
  } else if (timeSlot === '2부_오후') {
    slotMultiplier = 0.95; // 2부 늦은 오후 5% 할인
    timeSlotName = '2부 오후 (11:31~14:00)';
  } else if (timeSlot === '3부_야간') {
    slotMultiplier = 0.80; // 3부 야간 20% 할인
    timeSlotName = '3부 야간 나이트 (17:00~)';
  }

  // 1. 공시 기준 1인 그린피 산출
  const originalGreenFee = Math.round((baseGreenFee * seasonMultiplier * slotMultiplier) / 1000) * 1000;

  // 2. 할인 옵션 적용
  let effectiveGreenFee = originalGreenFee;
  let memberDiscountAmount = 0;
  let lastMinuteDiscountAmount = 0;

  // 공홈 인터넷 회원 할인 (1만 원 차감)
  if (applyMemberDiscount) {
    memberDiscountAmount = Math.min(10000, effectiveGreenFee - 50000);
    effectiveGreenFee -= memberDiscountAmount;
  }

  // 잔여티 임박 특가 모드 (추가 20% 할인)
  if (applyLastMinuteDiscount) {
    lastMinuteDiscountAmount = Math.round((effectiveGreenFee * 0.20) / 1000) * 1000;
    effectiveGreenFee -= lastMinuteDiscountAmount;
  }

  const totalDiscountAmount = memberDiscountAmount + lastMinuteDiscountAmount;

  // 카트비 및 캐디피 분담금
  const count = Math.max(2, Math.min(4, playerCount || 4));
  const cartFeeShare = Math.round(club.pricing.cartFee / count);

  const effectiveCaddieFee = (!withCaddie || club.pricing.caddieFee === 0)
    ? 0
    : (withCaddie ? club.pricing.caddieFee : 0);
  const caddieFeeShare = Math.round(effectiveCaddieFee / count);

  const totalPerPerson = effectiveGreenFee + cartFeeShare + caddieFeeShare;
  const totalTeamCost = (effectiveGreenFee * count) + club.pricing.cartFee + effectiveCaddieFee;

  const standardFullPrice = (isWeekend ? club.pricing.weekendGreenFee : club.pricing.weekdayGreenFee);
  const discountRate = Math.max(0, Math.round(((standardFullPrice - effectiveGreenFee) / standardFullPrice) * 100));

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return {
    selectedDate: date,
    dateString: `${yyyy}.${mm}.${dd}`,
    dayOfWeekName,
    isWeekend,
    isFriday,
    seasonType,
    timeSlot,
    timeSlotName,
    originalGreenFee,
    greenFee: effectiveGreenFee,
    memberDiscountAmount,
    lastMinuteDiscountAmount,
    totalDiscountAmount,
    cartFeeShare,
    caddieFeeShare,
    totalPerPerson,
    totalTeamCost,
    discountRate,
  };
}

export function calculateCostPerPerson(
  club: GolfClub,
  isWeekend: boolean = false,
  playersCount: number = 4,
  withCaddie: boolean = true
): {
  greenFee: number;
  cartFeeShare: number;
  caddieFeeShare: number;
  totalPerPerson: number;
  totalTeamCost: number;
} {
  const greenFee = isWeekend ? club.pricing.weekendGreenFee : club.pricing.weekdayGreenFee;
  const cartFeeShare = Math.round(club.pricing.cartFee / (playersCount || 4));
  const effectiveCaddieFee = (!withCaddie || club.pricing.caddieFee === 0) ? 0 : club.pricing.caddieFee;
  const caddieFeeShare = Math.round(effectiveCaddieFee / (playersCount || 4));

  const totalPerPerson = greenFee + cartFeeShare + caddieFeeShare;
  const totalTeamCost = (greenFee * playersCount) + club.pricing.cartFee + effectiveCaddieFee;

  return {
    greenFee,
    cartFeeShare,
    caddieFeeShare,
    totalPerPerson,
    totalTeamCost,
  };
}

export function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR') + '원';
}

export interface ScorePrediction {
  userAverageScore: number;
  expectedScore: number;
  diffFromAverage: number;
  handicapIndex: number;
  courseHandicap: number;
  levelAssessment: string;
  advice: string;
  ballLossRisk: '낮음' | '보통' | '높음' | '매우 높음(지옥)';
}

/**
 * USGA / KGA 공식 코스 핸디캡 공식을 기반으로 사용자의 평균 타수 대비 해당 코스 예상 타수를 산출
 * Formula: Course Handicap = Handicap Index * (Slope Rating / 113) + (Course Rating - Par)
 */
export function predictFieldScore(
  slopeRating: number,
  courseRating: number,
  userAverageScore: number = 90
): ScorePrediction {
  const par = 72;
  // 핸디캡 인덱스 역산 (평균 타수 - 파 72)
  const handicapIndex = Math.max(0, userAverageScore - par);
  
  // USGA 공식 코스 핸디캡
  const courseHandicap = handicapIndex * (slopeRating / 113) + (courseRating - par);
  const expectedScoreRaw = par + courseHandicap;
  const expectedScore = Math.round(expectedScoreRaw * 10) / 10;
  const diffFromAverage = Math.round((expectedScore - userAverageScore) * 10) / 10;

  let levelAssessment = '표준적인 난이도의 코스입니다.';
  let advice = '평소 구질을 유지하며 편안하게 공략할 수 있습니다.';
  let ballLossRisk: '낮음' | '보통' | '높음' | '매우 높음(지옥)' = '보통';

  if (slopeRating >= 135) {
    levelAssessment = '초상급자용 토너먼트 코스 (지옥 난이도)';
    advice = '해저드와 벙커 함정이 많아 드라이버 티샷 정확도가 생명입니다. 공을 평소보다 1더즌(12개) 넉넉히 챙기세요.';
    ballLossRisk = '매우 높음(지옥)';
  } else if (slopeRating >= 126) {
    levelAssessment = '중상급자 도전형 코스';
    advice = '페어웨이 언듈레이션과 벙커 턱이 높습니다. 그린 공략 시 핀을 바로 보지 말고 그린 중앙을 겨냥하세요.';
    ballLossRisk = '높음';
  } else if (slopeRating <= 118) {
    levelAssessment = '라베(Life Best) 도전 추천 코스';
    advice = '페어웨이가 넓고 OB 위험이 적어 스코어가 잘 나옵니다. 과감한 버디 찬스를 노려보세요.';
    ballLossRisk = '낮음';
  }

  return {
    userAverageScore,
    expectedScore,
    diffFromAverage,
    handicapIndex: Math.round(handicapIndex * 10) / 10,
    courseHandicap: Math.round(courseHandicap * 10) / 10,
    levelAssessment,
    advice,
    ballLossRisk,
  };
}

/**
 * 골프장 공식 홈페이지 주소 반환 (구글 검색 URL인 경우 네이버 공식 검색 직통 링크로 보정)
 */
export function getOfficialClubUrl(club: GolfClub): string {
  if (club.officialUrl && !club.officialUrl.includes('google.com/search')) {
    return club.officialUrl;
  }
  // 한국 골프장의 경우 네이버 검색이 공식 예약 홈페이지를 1순위로 즉시 노출함
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(club.name + ' 공식홈페이지 예약')}`;
}

