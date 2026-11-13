import type { GolfClub, GolferReview, WikiEditRecord } from '../types/golf';

const WIKI_STORAGE_KEY = 'GOLFMOA_WIKI_EDITS';
const REVIEWS_STORAGE_KEY = 'GOLFMOA_GOLFER_REVIEWS';
const MY_REVIEWS_STORAGE_KEY = 'GOLFMOA_MY_REVIEWS';

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

// 2. GOLFER REVIEWS (실제 골퍼가 직접 남긴 전체 평만 보관 - AI 자동 생성 금지)
export interface RatingStats {
  rating: number | null;
  reviewCount: number;
}

export const getClubRatingStats = (clubId: string): RatingStats => {
  let stored: Record<string, GolferReview[]> = {};
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    stored = raw ? JSON.parse(raw) : {};
  } catch {
    stored = {};
  }

  const reviews = (stored[clubId] || []).filter((r) => !r.id.startsWith('default-'));
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
  let stored: Record<string, GolferReview[]> = {};
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    stored = raw ? JSON.parse(raw) : {};
  } catch {
    stored = {};
  }

  const customReviews = stored[club.id] || [];
  // AI 생성 및 기본 시드 후기 엄격 제외 (실제 사용자가 직접 작성한 후기만 반환)
  return customReviews.filter((r) => !r.id.startsWith('default-'));
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
  const index = list.findIndex((r) => r.id === reviewId);
  if (index === -1) return null;

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

  // Remove from myReviewIds
  const myIds = getMyReviewIds().filter((id) => id !== reviewId);
  try {
    localStorage.setItem(MY_REVIEWS_STORAGE_KEY, JSON.stringify(myIds));
  } catch (e) {
    console.error('Failed to remove review from my reviews', e);
  }

  return true;
};


