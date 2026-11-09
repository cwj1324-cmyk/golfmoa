export type Region =
  | '전체'
  | '경기남부'
  | '경기북부'
  | '인천'
  | '강원'
  | '충청'
  | '경상'
  | '전라'
  | '제주';

export type GrassType =
  | '조선잔디(한국잔디)'
  | '조선잔디(중지)'
  | '조선잔디(안양중지)'
  | '양잔디(켄터키블루)'
  | '양잔디(벤트그라스/켄터키)'
  | '양잔디(벤트그라스)'
  | '양잔디(버뮤다/켄터키)'
  | '중지'
  | '벤트그라스 혼합'
  | '미확인';

export type CourseStyle = '산악형' | '구릉형(힐)' | '링크스형(평지/해변)' | '곶자왈(평지)';
export type FairwayWidth = '넓음' | '보통' | '좁음';
export type Undulation = '심함' | '보통' | '평탄';
export type CourseType = '대중제' | '회원제' | '대중제+회원제';

export interface DifficultyIndex {
  slopeRating?: number | null;        // USGA/KGA 슬로프 레이팅 (113이 세계 표준, 미측정 시 null)
  courseRating?: number | null;       // USGA/KGA 코스 레이팅 (미측정 시 null)
  golfzonCourseLevel?: number | null; // 골프존 코스 난이도 (1.0 ~ 5.0 별점)
  golfzonGreenLevel?: number | null;  // 골프존 그린 난이도 (1.0 ~ 5.0 별점)
  avgFieldScore?: number | null;      // 스마트스코어 필드 아마추어 평균 타수
  relativeDifficulty?: '쉬움(초보추천)' | '보통(표준)' | '어려움(중상급)' | '지옥(상급자전용)' | '미측정';
}

export interface GolfClub {
  id: string;
  name: string;
  region: Exclude<Region, '전체'>;
  city?: string; // 상세 행정구역 시/군 (예: "남해군", "안성시", "춘천시", "서귀포시")
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  drivingTimeFromSeoul: number; // 서울(강남) 기준 예상 이동시간(분)
  courseType: CourseType;
  holes: number;

  // 코스 스펙
  grass: {
    fairway: GrassType;
    green: string;
  };
  courseStyle: CourseStyle;
  fairwayWidth: FairwayWidth;
  undulation: Undulation;
  totalLengthMeters: number; // 18홀 기준 전장 (m)
  courseDifficulty: number; // 1 ~ 5 (코스 레이아웃/벙커/해저드 난이도)
  greenDifficulty: number;  // 1 ~ 5 (언듈레이션 난이도)
  greenSpeedAvg?: number | null;    // 평균 그린 스피드 (m) (미측정 시 null)
  teeBoxMatRatio?: '매트 없음(100% 잔디)' | '일부 매트' | '매트 비율 높음' | '미확인' | null;

  // 골프장 공인 및 체감 난이도 지수
  difficultyIndex: DifficultyIndex;

  // 비용 체계 (원 단위)
  pricing: {
    weekdayGreenFee: number; // 주중 최저
    weekendGreenFee: number; // 주말 최저
    cartFee: number;         // 팀당 카트비
    caddieFee: number;       // 팀당 캐디피
  };

  // 플레이 옵션
  playOptions: {
    twoPlayerAllowed: boolean;   // 2인 플레이 가능
    threePlayerAllowed: boolean; // 3인 플레이 가능
    noCaddieAllowed: boolean;    // 노캐디(자율주행/수동)
    nightPlay: boolean;          // 3부 야간 라운드
    lightingType: 'LED 초고광량' | '최신 고광량 LED' | '일반 메탈' | '야간 미운영';
  };

  // 부대시설
  facilities: {
    drivingRange: boolean;       // 인도어/야외 연습장
    drivingRangeNote?: string | null; // 예: "300m 비거리 천연잔디 타석"
    practiceGreen: boolean;      // 어프로치/벙커 연습 그린
    hotel: boolean;              // 골프텔/숙박
    saunaRating: '최상' | '최우수' | '우수' | '보통';
  };

  rating: number; // 5.0 만점
  reviewCount: number;
  tags: string[]; // 필터 및 큐레이션용 태그
  imageUrl: string;
  description: string;
  highlight: string; // 한줄 핵심 매력
  officialUrl: string;
  phone: string;
}

export interface FilterState {
  searchQuery: string;
  region: Region;
  maxTotalCostPerPerson: number; // 1인 총비용 상한선 (예: 400,000)
  maxDrivingTime: number; // 서울 기준 최대 분
  fairwayGrass: '전체' | '양잔디' | '조선잔디';
  difficultyFilter: '전체' | '쉬움' | '보통' | '어려움' | '지옥';
  courseDifficulty: number; // 0이면 전체, 1~5면 해당 난이도 이하/이상
  noCaddieOnly: boolean;
  twoPlayerOnly: boolean;
  nightPlayOnly: boolean;
  nightLedOnly: boolean; // 초고광량 LED 야간만
  noMatOnly: boolean; // 티박스 매트 없는 곳만 (100% 잔디)
  flatTerrainOnly: boolean; // 평지/구릉형만 (산악 고저차 적음)
  wideFairwayOnly: boolean; // 넓은 페어웨이만
  fastGreenOnly: boolean; // 그린스피드 2.8m+ 만
  drivingRangeOnly: boolean;
  selectedTheme: string | null;
  userAvgScore: number; // 골퍼 본인의 평소 평균 타수 (기본 90타)
}
