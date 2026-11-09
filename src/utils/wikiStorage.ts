import type { GolfClub, GolferReview, WikiEditRecord } from '../types/golf';

const WIKI_STORAGE_KEY = 'GOLFMOA_WIKI_EDITS';
const REVIEWS_STORAGE_KEY = 'GOLFMOA_GOLFER_REVIEWS';

// 1. WIKI EDITS
export const getWikiEdits = (): Record<string, WikiEditRecord> => {
  try {
    const data = localStorage.getItem(WIKI_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const saveWikiEdit = (
  clubId: string,
  changes: Partial<GolfClub>,
  author: string,
  reason: string
): WikiEditRecord => {
  const edits = getWikiEdits();
  const record: WikiEditRecord = {
    clubId,
    updatedAt: new Date().toISOString().split('T')[0],
    author: author.trim() || '익명 골퍼',
    reason: reason.trim() || '실제 라운드 방문 정보 업데이트',
    changes,
  };
  edits[clubId] = record;
  try {
    localStorage.setItem(WIKI_STORAGE_KEY, JSON.stringify(edits));
  } catch (e) {
    console.error('Failed to save wiki edit to localStorage', e);
  }
  return record;
};

export const resetWikiEdit = (clubId: string): void => {
  const edits = getWikiEdits();
  delete edits[clubId];
  try {
    localStorage.setItem(WIKI_STORAGE_KEY, JSON.stringify(edits));
  } catch (e) {
    console.error('Failed to reset wiki edit', e);
  }
};

export const applyWikiEditsToClubs = (clubs: GolfClub[]): GolfClub[] => {
  const edits = getWikiEdits();
  if (Object.keys(edits).length === 0) return clubs;

  return clubs.map((club) => {
    const edit = edits[club.id];
    if (!edit) return club;

    return {
      ...club,
      ...edit.changes,
      grass: {
        ...club.grass,
        ...(edit.changes.grass || {}),
      },
      pricing: {
        ...club.pricing,
        ...(edit.changes.pricing || {}),
      },
      playOptions: {
        ...club.playOptions,
        ...(edit.changes.playOptions || {}),
      },
      facilities: {
        ...club.facilities,
        ...(edit.changes.facilities || {}),
      },
    };
  });
};

// 2. GOLFER REVIEWS
export const getGolferReviews = (club: GolfClub): GolferReview[] => {
  let stored: Record<string, GolferReview[]> = {};
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    stored = raw ? JSON.parse(raw) : {};
  } catch {
    stored = {};
  }

  const customReviews = stored[club.id] || [];

  // Default seed review based on club specs if no reviews yet
  const defaultReviews: GolferReview[] = [
    {
      id: `default-${club.id}-1`,
      clubId: club.id,
      author: '주말골퍼',
      rating: Math.min(5, Math.max(4, Math.round(club.rating))),
      avgScore: '80대 후반',
      visitDate: '최근 방문',
      content: `${club.name}은(는) ${club.grass.fairway} 디봇 관리가 잘 되어 있고, ${
        club.teeBoxMatRatio === '매트 없음(100% 잔디)' ? '전홀 천연잔디 티박스라 샷감이 훌륭합니다.' : '코스 레이아웃이 재미있고 전략적인 공략이 요구됩니다.'
      } ${club.playOptions.nightPlay ? '야간 조명도 밝아 나이트 라운드로도 추천합니다.' : '주간에 즐기기 좋은 코스입니다.'}`,
      createdAt: '2024-10-18',
      scores: {
        course: 4.8,
        caddie: 4.6,
        cost: 4.5,
      },
    },
  ];

  return [...customReviews, ...defaultReviews];
};

export const addGolferReview = (
  clubId: string,
  review: Omit<GolferReview, 'id' | 'clubId' | 'createdAt'>
): GolferReview => {
  let stored: Record<string, GolferReview[]> = {};
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    stored = raw ? JSON.parse(raw) : {};
  } catch {
    stored = {};
  }

  const newReview: GolferReview = {
    ...review,
    id: `review-${Date.now()}`,
    clubId,
    createdAt: new Date().toISOString().split('T')[0],
  };

  const list = stored[clubId] || [];
  stored[clubId] = [newReview, ...list];

  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {
    console.error('Failed to save review to localStorage', e);
  }

  return newReview;
};
