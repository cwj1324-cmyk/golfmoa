import type { GolfClub, GolferReview, WikiEditRecord } from '../types/golf';
import { BUNDLED_REVIEWS, BUNDLED_WIKI_EDITS } from '../data/contributions';

const WIKI_STORAGE_KEY = 'GOLFMOA_WIKI_EDITS';
const REVIEWS_STORAGE_KEY = 'GOLFMOA_GOLFER_REVIEWS';
const MY_REVIEWS_STORAGE_KEY = 'GOLFMOA_MY_REVIEWS';
/** 이 기기에서 지운 '사이트에 실린 후기' id (사이트 데이터는 지울 수 없으므로 숨김 처리) */
const HIDDEN_REVIEWS_STORAGE_KEY = 'GOLFMOA_HIDDEN_REVIEWS';

const readStoredReviews = (): Record<string, GolferReview[]> => {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const readHiddenReviewIds = (): string[] => {
  try {
    const raw = localStorage.getItem(HIDDEN_REVIEWS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/** 이 브라우저에 저장된 후기 + 사이트에 실린 후기 (같은 id면 브라우저 쪽이 우선, 최신순) */
const getMergedReviews = (clubId: string): GolferReview[] => {
  const stored = (readStoredReviews()[clubId] || []).filter((r) => !r.id.startsWith('default-'));
  const storedIds = new Set(stored.map((r) => r.id));
  const hidden = new Set(readHiddenReviewIds());
  const bundled = (BUNDLED_REVIEWS[clubId] || []).filter((r) => !storedIds.has(r.id) && !hidden.has(r.id));
  return [...stored, ...bundled].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
};

// 1. WIKI EDITS
export const getWikiEdits = (): Record<string, WikiEditRecord> => {
  try {
    const data = localStorage.getItem(WIKI_STORAGE_KEY);
    return { ...BUNDLED_WIKI_EDITS, ...(data ? JSON.parse(data) : {}) };
  } catch {
    return { ...BUNDLED_WIKI_EDITS };
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

// 2. GOLFER REVIEWS (실제 골퍼가 직접 남긴 전체 평만 보관 - AI 자동 생성 금지)
export interface RatingStats {
  rating: number | null;
  reviewCount: number;
}

export const getClubRatingStats = (clubId: string): RatingStats => {
  const reviews = getMergedReviews(clubId);
  if (reviews.length === 0) {
    return { rating: null, reviewCount: 0 };
  }
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    rating: Number((sum / reviews.length).toFixed(1)),
    reviewCount: reviews.length,
  };
};

export const getGolferReviews = (club: GolfClub): GolferReview[] => {
  // 실제 사용자가 직접 작성한 후기만 (AI 생성·기본 시드 제외)
  return getMergedReviews(club.id);
};

export const getMyReviewIds = (): string[] => {
  try {
    const raw = localStorage.getItem(MY_REVIEWS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }

  // Backward compatibility: If no record yet, claim all custom reviews currently in this device's storage
  try {
    const rawReviews = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (rawReviews) {
      const stored: Record<string, GolferReview[]> = JSON.parse(rawReviews);
      const allIds = Object.values(stored)
        .flat()
        .filter((r) => !r.id.startsWith('default-'))
        .map((r) => r.id);
      localStorage.setItem(MY_REVIEWS_STORAGE_KEY, JSON.stringify(allIds));
      return allIds;
    }
  } catch {
    // fallback
  }

  return [];
};

export const isMyReview = (reviewId: string): boolean => {
  const ids = getMyReviewIds();
  return ids.includes(reviewId);
};

export const markAsMyReview = (reviewId: string): void => {
  const ids = getMyReviewIds();
  if (!ids.includes(reviewId)) {
    ids.push(reviewId);
    try {
      localStorage.setItem(MY_REVIEWS_STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      console.error('Failed to save my review id', e);
    }
  }
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

  markAsMyReview(newReview.id);
  return newReview;
};

export const updateGolferReview = (
  clubId: string,
  reviewId: string,
  updatedFields: Partial<Omit<GolferReview, 'id' | 'clubId' | 'createdAt'>>
): GolferReview | null => {
  let stored: Record<string, GolferReview[]> = {};
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    stored = raw ? JSON.parse(raw) : {};
  } catch {
    stored = {};
  }

  const list = stored[clubId] || [];
  let index = list.findIndex((r) => r.id === reviewId);
  if (index === -1) {
    // 사이트에 실린 후기를 고치면 이 브라우저에 사본을 만들어 덮어쓴다
    const bundled = (BUNDLED_REVIEWS[clubId] || []).find((r) => r.id === reviewId);
    if (!bundled) return null;
    list.unshift({ ...bundled });
    index = 0;
  }

  const oldScores = list[index].scores;
  const newScores = updatedFields.scores;
  const mergedScores = newScores && oldScores
    ? {
        course: newScores.course ?? oldScores.course,
        caddie: newScores.caddie ?? oldScores.caddie,
        cost: newScores.cost ?? oldScores.cost,
      }
    : (newScores || oldScores);

  const updated: GolferReview = {
    ...list[index],
    ...updatedFields,
    updatedAt: new Date().toISOString().split('T')[0],
    scores: mergedScores,
  };

  list[index] = updated;
  stored[clubId] = list;

  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {
    console.error('Failed to update review in localStorage', e);
  }

  return updated;
};

export const deleteGolferReview = (clubId: string, reviewId: string): boolean => {
  let stored: Record<string, GolferReview[]> = {};
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    stored = raw ? JSON.parse(raw) : {};
  } catch {
    stored = {};
  }

  const list = stored[clubId] || [];
  stored[clubId] = list.filter((r) => r.id !== reviewId);

  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {
    console.error('Failed to delete review from localStorage', e);
  }

  // 사이트에 실린 후기는 지울 수 없으므로 이 기기에서 숨긴다
  if ((BUNDLED_REVIEWS[clubId] || []).some((r) => r.id === reviewId)) {
    try {
      localStorage.setItem(HIDDEN_REVIEWS_STORAGE_KEY, JSON.stringify([...readHiddenReviewIds(), reviewId]));
    } catch (e) {
      console.error('Failed to hide bundled review', e);
    }
  }

  // Remove from myReviewIds
  const myIds = getMyReviewIds().filter((id) => id !== reviewId);
  try {
    localStorage.setItem(MY_REVIEWS_STORAGE_KEY, JSON.stringify(myIds));
  } catch (e) {
    console.error('Failed to remove review from my reviews', e);
  }

  return true;
};


