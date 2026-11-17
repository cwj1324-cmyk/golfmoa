import type { GolferReview, WikiEditRecord } from '../types/golf';

/**
 * 사이트에 함께 싣는 골퍼 기여(후기·정보 수정)
 *
 * 후기와 정보 수정은 브라우저 저장소(localStorage)에 저장되는데, 이 저장소는 사이트 주소마다 따로라서
 * golfmoa-kr.pages.dev 에서 쓴 글이 GitHub Pages 주소·다른 기기에서는 보이지 않았다(2026-11-17 확인).
 * 실제 골퍼가 직접 남긴 글을 여기에 옮겨 두면 어느 주소에서 열어도 보인다.
 * AI가 만든 글은 넣지 않는다.
 */
export const BUNDLED_REVIEWS: Record<string, GolferReview[]> = {
  "소노펠리체cc델피노cc": [
    {
      "author": "보기플레이어",
      "rating": 5,
      "avgScore": "90대 (보기플레이어)",
      "visitDate": "2026년 10월",
      "content": "전반은 바다 뷰, 후반은 울산 바위 뷰. 관리 상태도 나쁘진 않았지만 뷰가 모든 것을 다 한 골프장",
      "scores": {
        "course": 4,
        "caddie": 4,
        "cost": 4
      },
      "id": "review-1794540852078",
      "clubId": "소노펠리체cc델피노cc",
      "createdAt": "2026-11-13"
    }
  ],
  "코리아cc": [
    {
      "author": "주말골퍼",
      "rating": 4,
      "avgScore": "90대 (보기플레이어)",
      "visitDate": "2026년 11월",
      "content": "2026년 11월 13일 3부 방문, 페어웨이 잔디는 고르지 못하고 페어웨이 디봇은 많았음. 하지만 코스가 다양하여 재미가 있었고, 야간임에도 라이트가 밝아 플레이에 지장이 업었음.",
      "scores": {
        "course": 3,
        "caddie": 4,
        "cost": 5
      },
      "id": "review-1794613705094",
      "clubId": "코리아cc",
      "createdAt": "2026-11-13"
    }
  ]
};

export const BUNDLED_WIKI_EDITS: Record<string, WikiEditRecord> = {
  "코리아cc": {
    "clubId": "코리아cc",
    "updatedAt": "2026-11-13",
    "author": "주말골퍼",
    "reason": "2026년 11월 13일 3부 방문",
    "changes": {
      "courseType": "대중제+회원제",
      "grass": {
        "fairway": "조선잔디",
        "green": "벤트그라스"
      },
      "teeBoxMatRatio": "매트 비율 높음",
      "playOptions": {
        "twoPlayerAllowed": false,
        "threePlayerAllowed": true,
        "noCaddieAllowed": false,
        "nightPlay": true,
        "lightingType": "LED 초고광량"
      },
      "courseStyle": "구릉형(힐)",
      "pricing": {
        "weekdayGreenFee": 180000,
        "weekendGreenFee": 230000,
        "cartFee": 100000,
        "caddieFee": 150000
      },
      "facilities": {
        "drivingRange": false,
        "drivingRangeNote": null,
        "practiceGreen": true,
        "hotel": false,
        "saunaRating": "우수"
      }
    }
  }
};
