---
name: anti-ai-ui-design
description: >-
  Use this skill when designing, reviewing, or refactoring web user interfaces to eliminate
  "AI-generated" clichés (emoji soup, cosmic gradients, giant background watermarks, tag clutter,
  repetitive bento grids, and fluffy marketing copy) and elevate them into clean, high-credibility,
  human-crafted commercial products (like Toss, Airbnb, 29CM, Linear, Stripe).
---

# Anti-AI UI/UX Design System Guide

인공지능이 생성한 웹 UI는 첫눈에 화려해 보이지만, 실제 상용 프로덕트에 비해 **"전형적인 AI 프로토타입 느낌(Cliché)"**이 강해 사용자에게 신뢰감과 완성도를 주지 못하는 경우가 많습니다.

본 스킬은 이러한 AI 생성 특유의 조잡함과 이질감을 체계적으로 진단하고, 토스(Toss), 에어비앤비(Airbnb), 29CM, 스트라이프(Stripe)와 같은 **절제되고 완성도 높은 상용 프로덕트 수준의 UI**로 개선하기 위한 실무 가이드라인 및 워크플로우를 제공합니다.

---

## 1. AI 생성 UI의 6대 클리셰와 개선 원칙

### ① 이모지 남발 (Emoji Soup)
* ❌ **AI 패턴**: 모든 버튼, 뱃지, 카드 제목마다 이모지 접두사 삽입 (`🐣 초보 추천`, `💰 가성비`, `🌙 야간 라운드`, `🏆 챔피언십`).
* ⭕ **인간 디자이너 패턴**: 이모지 전면 제거. 단색(Monochrome) 또는 브랜드 컬러가 적용된 14~16px의 정제된 벡터 아이콘(Lucide, Heroicons 등)과 마이크로 라벨 시스템 적용.

### ② 우주적 그라디언트 & 거대 워터마크 (Cosmic Gradients & Watermarks)
* ❌ **AI 패턴**: `bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900` 등 3~4단계 이상의 어두운 그라디언트, 배경 구석에 90도로 누운 거대한 투명 아이콘(`Compass`, `Sparkles` 등) 워터마크.
* ⭕ **인간 디자이너 패턴**: 절제된 단색 캔버스(`bg-white`, `bg-slate-50`), 딥 톤의 포인트 배경(예: 단일 `#0C2E22`), 1px의 정교한 보더(`border-slate-200/80`)와 소프트 섀도우(`shadow-xs`, `shadow-2xs`).

### ③ 무의미한 태그 나열 (Tag Soup & Badge Clutter)
* ❌ **AI 패턴**: 빨강, 초록, 파랑, 노랑 등 무지개색 뱃지를 5~8개씩 카드마다 어지럽게 나열.
* ⭕ **인간 디자이너 패턴**: 정보의 성격별로 명확히 분리.
  * **수치/규격 데이터**: 테두리 분할형 스펙 그리드 (예: `전장 6,400m · 슬로프 121`).
  * **핵심 상태 플래그**: 단일 톤의 미니멀 칩 1~2개로 제한.

### ④ 모호하고 장황한 마케팅 문구 (Fluffy Buzzwords)
* ❌ **AI 패턴**: "나의 실력과 취향에 맞는 최고의 골프장을 지금 만나보세요", "혁신적인 골프 라이프의 시작".
* ⭕ **인간 디자이너 패턴**: 구체적인 숫자, 실질적인 편익, 행동 중심의 마이크로카피.
  * 예: "전국 640개 골프장 스펙 비교", "1·2·3부 일자별 실부담 요금 자동 계산", "카트·캐디피 N빵 분담".

### ⑤ 획일적인 벤토 그리드 증후군 (Bento Grid Syndrome)
* ❌ **AI 패턴**: 의미 없는 카드들을 동일한 라운딩(`rounded-3xl`)으로 바둑판처럼 배치해 시선이 분산됨.
* ⭕ **인간 디자이너 패턴**: 명확한 시각적 위계(Visual Hierarchy). 가장 중요한 검색/필터와 핵심 수치를 먼저 배치하고, 세부 목록은 탐색에 최적화된 리스트/카드 뷰로 유기적 연결.

### ⑥ 장식용 가짜 복잡성 (Fake Complexity)
* ❌ **AI 패턴**: 실제 기능 없이 시각적 효과만을 위한 가짜 게이지 바, 무의미한 프로그레스 바.
* ⭕ **인간 디자이너 패턴**: 사용자가 날짜, 시간대, 인원수를 바꾸면 실시간으로 계산되는 진짜 인터랙티브 시뮬레이터(`DateRateSimulator`) 제공.

---

## 2. UI 개선 단계별 실행 워크플로우

### [1단계: AI 클리셰 진단 및 제거 (Audit & Strip)]
1. 코드베이스 전체에서 제목 및 UI 버튼 내 유니코드 이모지를 정규식으로 검색하여 모두 제거.
2. `bg-gradient-to-*` 중 채도가 높거나 멀티스톱(3개 이상 색상)이 적용된 배경을 플랫 컬러 또는 단색 서브틀(Subtle) 톤으로 단순화.
3. 배경의 불필요한 장식용 워터마크 SVG 요소를 삭제.

### [2단계: 디자인 토큰 및 팔레트 절제 (Color Discipline)]
* **베이스 캔버스**: Slate / Stone 계열의 미세한 배경 명도 차이 활용.
  * 배경: `bg-slate-50` 또는 `bg-stone-50`
  * 카드: `bg-white border border-slate-200/80`
  * 텍스트: 제목 `text-slate-900`, 보조 `text-slate-600`, 캡션 `text-slate-400`
* **브랜드 액센트 (1개로 집중)**:
  * 골프/스포츠: 딥 포레스트 그린 (`#0F392B`, Tailwind `emerald-800` / `emerald-900`)
  * 핀테크/금융: 코발트 블루 (`#0052FF`, `blue-700`)
  * 경고/주의: 뮤트된 앰버/로즈 (`amber-700`, `rose-600`)

### [3단계: 데이터 위계 구조화 (Component Architecture)]
* 카드 컴포넌트는 다음 4단 구조로 엄격히 제한:
  1. **Visual Anchor**: 상단 이미지 + 위치/시간 뱃지 (단색 반투명 오버레이)
  2. **Core Spec Table**: 2x2 또는 2x4 형태의 일정한 스펙 그리드
  3. **Official Metric / Simulator**: 공인 지표(슬로프, 레이팅) 또는 일자별 요금
  4. **Action Footer**: 평점 및 직관적인 동작 버튼 (`[일자별 요금]`, `[상세]`)

### [4단계: 현실성 있는 기능 연동 (Real-world Utility)]
* 정적 텍스트 대신 사용자의 실제 고민을 해결해주는 계산기/시뮬레이터/비교 테이블 연동:
  * 예: 날짜별(주중/주말/성수기/비수기), 시간대별(1부 새벽/2부 오전/3부 야간), 인원수(2/3/4인)에 따른 실부담 요금 자동 분담.

---

## 3. 코드 패턴 비교 (Tailwind CSS 기준)

### Hero Header
```tsx
// ❌ AI 생성형 (비추천)
<div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-8 relative overflow-hidden">
  <Compass className="absolute right-0 bottom-0 opacity-10 w-96 h-96" />
  <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold">
    ⛳ 골프장 선택의 새로운 기준
  </span>
  <h1 className="text-3xl font-black">나의 취향에 맞는 최고의 골프장</h1>
</div>

// ⭕ 인간 디자이너 상용 프로덕트형 (추천)
<section className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-2xs">
  <div className="flex flex-col lg:flex-row justify-between gap-6">
    <div>
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/70 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
        <span>전국 640개 골프장 스펙 & 실시간 요금 시뮬레이터</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
        잔디 종류부터 코스 난이도, <br />
        <span className="text-emerald-800">일자별 실부담 총비용</span>까지 한눈에
      </h1>
      <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-slate-100">
        <span className="text-xs font-semibold text-slate-400">빠른 필터:</span>
        <button className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium">수도권 60분 이내</button>
        <button className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium">양잔디 페어웨이</button>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3 shrink-0">
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
        <span className="text-[11px] text-slate-500 font-medium block">전국 등록 골프장</span>
        <span className="text-2xl font-black text-slate-900 block">640개소</span>
      </div>
    </div>
  </div>
</section>
```

---

## 4. 최종 품질 점검 체크리스트 (Quality Gate)

- [ ] **이모지 제거**: UI 버튼, 라벨, 카드 타이틀에 유니코드 이모지(`⛳`, `🐣`, `💰` 등)가 남아있지 않은가?
- [ ] **색상 절제**: 메인 배경이 무지개색 그라디언트 대신 차분한 단색 캔버스인가?
- [ ] **포인트 컬러 통일**: 강조색(Accent)이 1~2개 이내로 통일되어 시선이 분산되지 않는가?
- [ ] **보더 및 그림자**: 과도한 드롭 섀도우 대신 `border-slate-200`과 `shadow-2xs`/`shadow-xs` 위주로 단정하게 정리되었는가?
- [ ] **마이크로카피 구체성**: "최고의", "환상적인" 같은 수식어 대신 "640개소", "슬로프 121", "1인 분담액" 같은 사실 정보가 중심인가?
- [ ] **반응형 패딩**: 모바일과 데스크톱에서 패딩이 지나치게 크거나 낭비되지 않는가 (`p-4 sm:p-6`)?

