/** 화면 안 선택: 기본(공통 개선) / A 스코어카드 행 / B 지도·목록 / C 내 조건 맞춤 */
export type UiVariant = 'basic' | 'a' | 'b' | 'c';

export const UI_VARIANTS: { id: UiVariant; short: string; label: string; desc: string }[] = [
  { id: 'basic', short: '기본', label: '기본', desc: '카드·리스트·지도 (공통 개선 적용)' },
  { id: 'a', short: 'A', label: 'A 스코어카드', desc: '한 줄 목록, 열 머리글로 정렬' },
  { id: 'b', short: 'B', label: 'B 지도·목록', desc: '지도 범위로 목록, 가격 핀' },
  { id: 'c', short: 'C', label: 'C 내 조건', desc: '조건 문장 + 맞는 이유' },
];

