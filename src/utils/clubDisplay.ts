import type { GolfClub } from '../types/golf';

/**
 * 화면 공통 표시 규칙 (2026-11 UI 개선)
 * - 모르는 값은 표시하지 않는다(빈 값 숨김).
 * - 강조색(초록)은 '비교 선택'과 비용을 줄이는 조건(노캐디)에만 쓴다.
 */

export interface ClubTrait {
  label: string;
  tone: 'plain' | 'save';
}

export function isFlatCourse(club: GolfClub): boolean {
  return (
    club.courseStyle.includes('구릉') ||
    club.courseStyle.includes('링크스') ||
    club.courseStyle.includes('평지')
  );
}

/** 확인된 특징만 칩으로 돌려준다. */
export function getClubTraits(club: GolfClub): ClubTrait[] {
  const traits: ClubTrait[] = [];
  if (club.teeBoxMatRatio === '매트 없음(100% 잔디)') {
    traits.push({ label: '100% 잔디 티', tone: 'plain' });
  }
  traits.push({ label: club.grass.fairway.includes('양잔디') ? '양잔디' : '조선잔디', tone: 'plain' });
  traits.push({ label: isFlatCourse(club) ? '평지형' : '산악형', tone: 'plain' });
  if (club.playOptions.nightPlay) {
    traits.push({ label: club.playOptions.lightingType.includes('LED') ? 'LED 야간' : '야간 3부', tone: 'plain' });
  }
  if (club.greenSpeedAvg) {
    traits.push({ label: `그린 ${club.greenSpeedAvg.toFixed(1)}m`, tone: 'plain' });
  }
  if (club.playOptions.noCaddieAllowed) {
    traits.push({ label: '노캐디', tone: 'save' });
  }
  return traits;
}

/** "여주시" → "여주"처럼 짧은 지역 이름 */
export function getShortCity(club: GolfClub): string {
  const city = club.city || club.address.split(' ')[1] || club.region;
  if (city.length >= 3 && (city.endsWith('시') || city.endsWith('군'))) {
    return city.slice(0, -1);
  }
  return city;
}

/** "여주 · 대중제 18홀 · 6,700m" 형태의 한 줄 요약 */
export function getClubMetaLine(club: GolfClub, withLength = true): string {
  const parts = [getShortCity(club), `${club.courseType.replace('대중제+회원제', '대중/회원')} ${club.holes}홀`];
  if (withLength && club.totalLengthMeters) {
    parts.push(`${club.totalLengthMeters.toLocaleString('ko-KR')}m`);
  }
  return parts.join(' · ');
}

/** 182500 → "18.2만" (지도 핀용) */
export function formatManwon(won: number): string {
  const man = won / 10000;
  return `${man >= 100 ? Math.round(man) : Math.round(man * 10) / 10}만`;
}
