import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  MapPin,
  Phone,
  Check,
  Plus,
  ShieldCheck,
  Star,
  Moon,
  Sparkles,
  Edit3,
  RotateCcw,
  MessageSquare,
  Send,
  BookOpen,
  Calendar,
  Trash2,
} from 'lucide-react';
import type { GolfClub, GrassType, CourseStyle, CourseType, GolferReview, WikiEditRecord } from '../types/golf';
import { calculateCostPerPerson, formatPrice, predictFieldScore, getOfficialClubUrl } from '../utils/calculator';
import { BLOG_REVIEWS_MAP } from '../data/blogReviewsData';
import {
  getWikiEdits,
  saveWikiEdit,
  resetWikiEdit,
  getGolferReviews,
  addGolferReview,
  updateGolferReview,
  deleteGolferReview,
  isMyReview,
} from '../utils/wikiStorage';

interface GolfDetailModalProps {
  club: GolfClub;
  onClose: () => void;
  isCompared: boolean;
  onToggleCompare: (club: GolfClub) => void;
  userAvgScore: number;
  onUpdateClub?: (updatedClub: GolfClub) => void;
}

export const GolfDetailModal: React.FC<GolfDetailModalProps> = ({
  club: initialClub,
  onClose,
  isCompared,
  onToggleCompare,
  userAvgScore,
  onUpdateClub,
}) => {
  const [club, setClub] = useState<GolfClub>(initialClub);
  const [wikiRecord, setWikiRecord] = useState<WikiEditRecord | null>(null);

  // Wiki Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    courseType: club.courseType,
    fairwayGrass: club.grass.fairway,
    teeBoxMatRatio: club.teeBoxMatRatio || '미확인',
    nightPlay: club.playOptions.nightPlay,
    lightingType: club.playOptions.lightingType,
    courseStyle: club.courseStyle,
    weekdayGreenFee: club.pricing.weekdayGreenFee,
    weekendGreenFee: club.pricing.weekendGreenFee,
    cartFee: club.pricing.cartFee,
    caddieFee: club.pricing.caddieFee,
    drivingRange: club.facilities.drivingRange,
    drivingRangeNote: club.facilities.drivingRangeNote || '',
    author: '',
    reason: '',
  });

  // Review System State
  const [reviews, setReviews] = useState<GolferReview[]>([]);
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({
    author: '',
    rating: 5,
    avgScore: '80대',
    visitDate: '2024년 10월',
    courseScore: 5,
    caddieScore: 5,
    costScore: 4,
    content: '',
  });

  // Load Wiki Record & Reviews
  useEffect(() => {
    const edits = getWikiEdits();
    if (edits[club.id]) {
      setWikiRecord(edits[club.id]);
    } else {
      setWikiRecord(null);
    }
    setReviews(getGolferReviews(club));
  }, [club.id]);

  const pred = predictFieldScore(
    club.difficultyIndex?.slopeRating,
    club.difficultyIndex?.courseRating,
    userAvgScore
  );

  const weekdayCost = calculateCostPerPerson(club, false, 4, true);
  const weekendCost = calculateCostPerPerson(club, true, 4, true);

  // Safe official URL fallback
  const officialUrl = getOfficialClubUrl(club);

  // Handle Wiki Save
  const handleSaveWiki = (e: React.FormEvent) => {
    e.preventDefault();

    const changes: Partial<GolfClub> = {
      courseType: editForm.courseType,
      grass: {
        ...club.grass,
        fairway: editForm.fairwayGrass as GrassType,
      },
      teeBoxMatRatio:
        editForm.teeBoxMatRatio === '미확인'
          ? null
          : (editForm.teeBoxMatRatio as GolfClub['teeBoxMatRatio']),
      playOptions: {
        ...club.playOptions,
        nightPlay: editForm.nightPlay,
        lightingType: editForm.lightingType as GolfClub['playOptions']['lightingType'],
      },
      courseStyle: editForm.courseStyle as CourseStyle,
      pricing: {
        ...club.pricing,
        weekdayGreenFee: Number(editForm.weekdayGreenFee),
        weekendGreenFee: Number(editForm.weekendGreenFee),
        cartFee: Number(editForm.cartFee),
        caddieFee: Number(editForm.caddieFee),
      },
      facilities: {
        ...club.facilities,
        drivingRange: editForm.drivingRange,
        drivingRangeNote: editForm.drivingRangeNote.trim() || null,
      },
    };

    const record = saveWikiEdit(club.id, changes, editForm.author, editForm.reason);
    const updated = {
      ...club,
      ...changes,
    };

    setClub(updated);
    setWikiRecord(record);
    setIsEditing(false);
    if (onUpdateClub) onUpdateClub(updated);
  };

  // Handle Reset to Official Data
  const handleResetWiki = () => {
    if (confirm('골퍼가 수정한 정보를 삭제하고 공식 기본 데이터로 되돌리시겠습니까?')) {
      resetWikiEdit(club.id);
      setWikiRecord(null);
      setClub(initialClub);
      if (onUpdateClub) onUpdateClub(initialClub);
    }
  };

  // Start Editing Review
  const handleStartEditReview = (rev: GolferReview) => {
    setEditingReviewId(rev.id);
    setIsWritingReview(true);
    setReviewForm({
      author: rev.author,
      rating: rev.rating,
      avgScore: rev.avgScore || '80대',
      visitDate: rev.visitDate || '',
      courseScore: rev.scores?.course || 5,
      caddieScore: rev.scores?.caddie || 5,
      costScore: rev.scores?.cost || 4,
      content: rev.content,
    });
  };

  // Cancel Review Writing/Editing
  const handleCancelReview = () => {
    setIsWritingReview(false);
    setEditingReviewId(null);
    setReviewForm({
      author: '',
      rating: 5,
      avgScore: '80대',
      visitDate: '2024년 10월',
      courseScore: 5,
      caddieScore: 5,
      costScore: 4,
      content: '',
    });
  };

  // Delete Review
  const handleDeleteReview = (reviewId: string) => {
    if (!confirm('작성하신 전체 평을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.')) {
      return;
    }

    deleteGolferReview(club.id, reviewId);
    setReviews(reviews.filter((r) => r.id !== reviewId));
    if (editingReviewId === reviewId) {
      setIsWritingReview(false);
      setEditingReviewId(null);
    }
  };

  // Handle Review Submission (Add & Update)
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.content.trim()) {
      alert('골프장 전체 평(후기) 내용을 입력해 주세요.');
      return;
    }

    if (editingReviewId) {
      const updated = updateGolferReview(club.id, editingReviewId, {
        author: reviewForm.author.trim() || '익명 골퍼',
        rating: reviewForm.rating,
        avgScore: reviewForm.avgScore,
        visitDate: reviewForm.visitDate,
        content: reviewForm.content.trim(),
        scores: {
          course: reviewForm.courseScore,
          caddie: reviewForm.caddieScore,
          cost: reviewForm.costScore,
        },
      });

      if (updated) {
        setReviews(reviews.map((r) => (r.id === editingReviewId ? updated : r)));
      }
      setIsWritingReview(false);
      setEditingReviewId(null);
    } else {
      const newRev = addGolferReview(club.id, {
        author: reviewForm.author.trim() || '익명 골퍼',
        rating: reviewForm.rating,
        avgScore: reviewForm.avgScore,
        visitDate: reviewForm.visitDate,
        content: reviewForm.content.trim(),
        scores: {
          course: reviewForm.courseScore,
          caddie: reviewForm.caddieScore,
          cost: reviewForm.costScore,
        },
      });

      setReviews([newRev, ...reviews.filter((r) => r.id !== newRev.id)]);
      setIsWritingReview(false);
    }

    setReviewForm({
      author: '',
      rating: 5,
      avgScore: '80대',
      visitDate: '2024년 10월',
      courseScore: 5,
      caddieScore: 5,
      costScore: 4,
      content: '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Contributed Info Banner */}
        {wikiRecord && (
          <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-medium truncate">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                <strong>골퍼 기여 정보 적용됨</strong> ({wikiRecord.author} 님 · {wikiRecord.updatedAt}):{' '}
                <span className="text-amber-800">{wikiRecord.reason}</span>
              </span>
            </span>
            <button
              onClick={handleResetWiki}
              className="px-2 py-0.5 rounded text-[11px] font-bold text-amber-800 hover:bg-amber-100 flex items-center gap-1 shrink-0"
              title="공식 기본 데이터로 복원"
            >
              <RotateCcw className="w-3 h-3" />
              <span>원문 복원</span>
            </button>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200 flex items-start justify-between gap-2 bg-white sticky top-0 z-10">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-700 whitespace-nowrap">
                {club.courseType} {club.holes}홀
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 font-medium truncate">
                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                {club.region} · {club.city || club.address.split(' ')[1] || club.region}
              </span>
            </div>

            <h2 className="text-lg sm:text-2xl font-bold text-emerald-800 tracking-tight truncate">
              {club.name}
            </h2>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Info Edit Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all ${
                isEditing
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300'
              }`}
              title="골프장 정보 직접 수정 및 기여하기"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isEditing ? '보기 모드' : '정보 수정'}</span>
              <span className="sm:hidden text-[11px]">{isEditing ? '보기' : '수정'}</span>
            </button>

            {/* Compare Button */}
            <button
              onClick={() => onToggleCompare(club)}
              className={`px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all ${
                isCompared
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isCompared ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isCompared ? '비교중' : '조건 비교'}</span>
              <span className="sm:hidden text-[11px]">{isCompared ? '비교중' : '비교'}</span>
            </button>

            {/* Official Webpage */}
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1 transition-all shadow-2xs"
              title="공식 홈페이지 바로가기"
            >
              <span className="hidden sm:inline">공홈 바로가기</span>
              <span className="sm:hidden text-[11px]">공홈</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all ml-0.5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          {/* ==================================================== */}
          {/* MODE A: INFO EDIT FORM (정보 수정 모드) */}
          {/* ==================================================== */}
          {isEditing ? (
            <form onSubmit={handleSaveWiki} className="bg-amber-50/50 rounded-2xl border border-amber-200 p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-amber-950 flex items-center gap-1.5">
                    <Edit3 className="w-5 h-5 text-amber-700" />
                    골프장 정보 직접 수정 및 기여하기
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    실제 라운드 방문 경험이나 최신 변경사항을 자유롭게 수정하고 기여해 주세요.
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  정보 수정중
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* 1. 운영 구분 */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">운영 구분 (코스 타입)</label>
                  <select
                    value={editForm.courseType}
                    onChange={(e) => setEditForm({ ...editForm, courseType: e.target.value as CourseType })}
                    className="w-full p-2 bg-white rounded-lg border border-slate-300 font-medium"
                  >
                    <option value="대중제">대중제 (퍼블릭)</option>
                    <option value="회원제">회원제 (프라이빗)</option>
                    <option value="대중제+회원제">대중제+회원제 (복합 운영)</option>
                  </select>
                </div>

                {/* 2. 페어웨이 잔디 (조선잔디 vs 양잔디만 구분) */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">페어웨이 잔디 종류</label>
                  <select
                    value={editForm.fairwayGrass.includes('양잔디') ? '양잔디' : '조선잔디'}
                    onChange={(e) => setEditForm({ ...editForm, fairwayGrass: e.target.value as GrassType })}
                    className="w-full p-2 bg-white rounded-lg border border-slate-300 font-medium"
                  >
                    <option value="조선잔디">조선잔디</option>
                    <option value="양잔디">양잔디</option>
                  </select>
                </div>

                {/* 3. 티박스 상태 */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">티박스 매트 상태</label>
                  <select
                    value={editForm.teeBoxMatRatio || '미확인'}
                    onChange={(e) => setEditForm({ ...editForm, teeBoxMatRatio: e.target.value as any })}
                    className="w-full p-2 bg-white rounded-lg border border-slate-300 font-medium"
                  >
                    <option value="매트 없음(100% 잔디)">매트 없음 (100% 자연잔디 티)</option>
                    <option value="일부 매트">일부 매트 (파3 또는 잔디보호 매트 혼용)</option>
                    <option value="매트 비율 높음">매트 비율 높음</option>
                    <option value="미확인">미확인 / 미측정</option>
                  </select>
                </div>

                {/* 4. 야간 라운드 & 조명 */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">3부 야간 라운드 및 조명</label>
                  <select
                    value={editForm.lightingType}
                    onChange={(e) => {
                      const lt = e.target.value as GolfClub['playOptions']['lightingType'];
                      setEditForm({
                        ...editForm,
                        lightingType: lt,
                        nightPlay: lt !== '야간 미운영',
                      });
                    }}
                    className="w-full p-2 bg-white rounded-lg border border-slate-300 font-medium"
                  >
                    <option value="최신 고광량 LED">야간 운영 · 최신 고광량 LED (눈부심 적음)</option>
                    <option value="LED 초고광량">야간 운영 · LED 초고광량</option>
                    <option value="일반 메탈">야간 운영 · 일반 메탈 라이트</option>
                    <option value="야간 미운영">야간 3부 미운영 (주간 전용)</option>
                  </select>
                </div>

                {/* 5. 코스 지형 */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">코스 지형 스타일</label>
                  <select
                    value={editForm.courseStyle}
                    onChange={(e) => setEditForm({ ...editForm, courseStyle: e.target.value as CourseStyle })}
                    className="w-full p-2 bg-white rounded-lg border border-slate-300 font-medium"
                  >
                    <option value="구릉형(힐)">구릉형 (힐 코스)</option>
                    <option value="산악형">산악형 (마운틴 코스)</option>
                    <option value="링크스형(평지/해변)">링크스형 (평지 / 해변 코스)</option>
                    <option value="곶자왈(평지)">곶자왈 (제주 평지형)</option>
                  </select>
                </div>

                {/* 6. 부대시설 연습장 */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">인도어 드라이빙레인지 연습장</label>
                  <input
                    type="text"
                    value={editForm.drivingRangeNote}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        drivingRangeNote: e.target.value,
                        drivingRange: e.target.value.trim().length > 0,
                      })
                    }
                    placeholder="예: 300m 비거리 천연잔디 인도어 타석 완비"
                    className="w-full p-2 bg-white rounded-lg border border-slate-300 font-medium"
                  />
                </div>
              </div>

              {/* 비용 수정 */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-800 block mb-2">실제 라운드 비용 체계 (원 단위)</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block">주중 그린피</span>
                    <input
                      type="number"
                      value={editForm.weekdayGreenFee}
                      onChange={(e) => setEditForm({ ...editForm, weekdayGreenFee: Number(e.target.value) })}
                      className="w-full p-1.5 border border-slate-300 rounded font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">주말 그린피</span>
                    <input
                      type="number"
                      value={editForm.weekendGreenFee}
                      onChange={(e) => setEditForm({ ...editForm, weekendGreenFee: Number(e.target.value) })}
                      className="w-full p-1.5 border border-slate-300 rounded font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">팀 카트비</span>
                    <input
                      type="number"
                      value={editForm.cartFee}
                      onChange={(e) => setEditForm({ ...editForm, cartFee: Number(e.target.value) })}
                      className="w-full p-1.5 border border-slate-300 rounded font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">팀 캐디피</span>
                    <input
                      type="number"
                      value={editForm.caddieFee}
                      onChange={(e) => setEditForm({ ...editForm, caddieFee: Number(e.target.value) })}
                      className="w-full p-1.5 border border-slate-300 rounded font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* 기여자 서명 & 수정 사유 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">기여자 닉네임</label>
                  <input
                    type="text"
                    value={editForm.author}
                    onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                    placeholder="예: 싱글골퍼, 안성주민"
                    className="w-full p-2 bg-white rounded-lg border border-slate-300 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">수정 사유 및 출처</label>
                  <input
                    type="text"
                    value={editForm.reason}
                    onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                    placeholder="예: 2024년 10월 실제 방문 시 잔디티 확인"
                    className="w-full p-2 bg-white rounded-lg border border-slate-300 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-600 border border-slate-300 hover:bg-slate-100"
                >
                  수정 취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>수정 정보 저장 및 반영</span>
                </button>
              </div>
            </form>
          ) : null}

          {/* ==================================================== */}
          {/* MODE B: STANDARD DETAIL VIEW (일반 상세 보기 모드) */}
          {/* ==================================================== */}

          {/* Section 1: 코스 핵심 조건 4대 스펙 스트립 */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              골퍼 필수 확인 코스 컨디션 4대 조건
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {/* 1. 페어웨이 잔디 (조선잔디 vs 양잔디) */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                <span className="text-[11px] text-slate-500 block mb-1">페어웨이 잔디</span>
                <span className="font-black text-slate-900 block truncate text-xs sm:text-sm">
                  {club.grass.fairway.includes('양잔디') ? '양잔디' : '조선잔디'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {club.grass.fairway.includes('양잔디') ? '디봇 샷감 우수 · 4계절 녹색' : '조선 천연잔디'}
                </span>
              </div>

              {/* 2. 티잉구역 매트 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                <span className="text-[11px] text-slate-500 block mb-1">티박스 매트 유무</span>
                <span
                  className={`font-black block truncate text-xs sm:text-sm ${
                    club.teeBoxMatRatio === '매트 없음(100% 잔디)' ? 'text-emerald-800' : 'text-slate-900'
                  }`}
                >
                  {club.teeBoxMatRatio ?? '공인 데이터 미측정'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {club.teeBoxMatRatio === '매트 없음(100% 잔디)' ? '100% 자연잔디 티샷' : '주말/파3 일부 매트'}
                </span>
              </div>

              {/* 3. 야간 라운드 & 조명 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                <span className="text-[11px] text-slate-500 block mb-1">야간 3부 라운드</span>
                <span className="font-black text-slate-900 block truncate text-xs sm:text-sm flex items-center gap-1">
                  {club.playOptions.nightPlay ? (
                    <>
                      <Moon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="text-indigo-900">운영</span>
                    </>
                  ) : (
                    <span className="text-slate-400">야간 미운영</span>
                  )}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block truncate">
                  {club.playOptions.lightingType}
                </span>
              </div>

              {/* 4. 코스 지형 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                <span className="text-[11px] text-slate-500 block mb-1">코스 지형 스타일</span>
                <span className="font-black text-slate-900 block truncate text-xs sm:text-sm">
                  {club.courseStyle}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  언듈레이션 {club.undulation} · {club.fairwayWidth} 페어웨이
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: 공인 난이도 지표 & 핸디캡 타수 예측 */}
          <div className="rounded-xl border border-slate-200 p-3.5 sm:p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-800" />
                USGA / KGA 공인 코스 난이도 분석
              </span>
              <span className="text-[11px] text-slate-500">
                골퍼 평균 <strong>{userAvgScore}타</strong> 기준 예측
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500">슬로프 레이팅 (Slope)</span>
                <div className="text-base font-bold text-slate-700 mt-0.5">
                  {club.difficultyIndex?.slopeRating ?? '미측정'}
                </div>
                <span className="text-[10px] text-slate-400">
                  {club.difficultyIndex?.slopeRating ? '세계 표준 113 기준' : '공인 데이터 미측정'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500">코스 레이팅 (CR)</span>
                <div className="text-base font-bold text-slate-700 mt-0.5">
                  {club.difficultyIndex?.courseRating ?? '미측정'}
                </div>
                <span className="text-[10px] text-slate-400">
                  {club.difficultyIndex?.courseRating ? '스크래치 골퍼 기준' : '공인 데이터 미측정'}
                </span>
              </div>

              <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-[11px] text-emerald-900 font-bold">내 예상 필드 타수</span>
                <div className="text-base font-black text-emerald-950 mt-0.5">
                  {pred.isUnrated ? '공인 미측정' : `약 ${pred.expectedScore}타`}
                </div>
                <span className="text-[10px] text-emerald-800">
                  {pred.isUnrated ? '평소 타수 참고' : `평소보다 ${pred.diffFromAverage > 0 ? `+${pred.diffFromAverage}타` : `${pred.diffFromAverage}타`}`}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: 비용 체계 */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              상세 요금 체계 및 1인 실부담액
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="grid grid-cols-4 bg-slate-50 p-2 sm:p-2.5 text-center text-[10px] sm:text-xs font-bold text-slate-500 border-b border-slate-200">
                <div>주중 그린피</div>
                <div>주말 그린피</div>
                <div>팀 카트비</div>
                <div>팀 캐디피</div>
              </div>
              <div className="grid grid-cols-4 p-2.5 sm:p-3 text-center font-bold text-slate-700 items-center text-[11px] sm:text-xs">
                <div className="truncate">{formatPrice(club.pricing.weekdayGreenFee)}~</div>
                <div className="truncate">{formatPrice(club.pricing.weekendGreenFee)}~</div>
                <div className="truncate">{formatPrice(club.pricing.cartFee)}</div>
                <div className="truncate">
                  {club.pricing.caddieFee === 0 ? (
                    <span className="text-emerald-700 font-extrabold">노캐디</span>
                  ) : (
                    formatPrice(club.pricing.caddieFee)
                  )}
                </div>
              </div>

              {/* 1인 실부담금 요약 바 */}
              <div className="bg-emerald-50/60 p-2.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] px-3.5">
                <span className="text-emerald-950 font-bold">
                  4인 라운드 기준 1인 실부담 예상 (카트·캐디 분담 포함):
                </span>
                <span className="text-emerald-800 font-extrabold">
                  주중 약 {formatPrice(weekdayCost.totalPerPerson)} / 주말 약 {formatPrice(weekendCost.totalPerPerson)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: 골프장 정보 & 부대시설 */}
          <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/40 text-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{club.address}</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-800">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{club.phone}</span>
              </span>
            </div>
            {club.facilities.drivingRangeNote && (
              <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                {club.facilities.drivingRangeNote}
              </p>
            )}
          </div>

          {/* ==================================================== */}
          {/* Section 5: 네이버 블로그 최신 실 라운드 후기 (검수 완료) */}
          {/* ==================================================== */}
          {(() => {
            const blogReviews = (club.blogReviews && club.blogReviews.length > 0)
              ? club.blogReviews
              : (BLOG_REVIEWS_MAP[club.id] || []);
            const naverSearchQuery = `${club.name} 라운드 후기`;
            const naverSearchUrl = `https://search.naver.com/search.naver?where=blog&query=${encodeURIComponent(naverSearchQuery)}`;

            return (
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-700" />
                      <span>네이버 블로그 실 라운드 후기</span>
                      {blogReviews.length > 0 && (
                        <span className="text-emerald-700 font-extrabold text-xs">({blogReviews.length}건)</span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      최근 1~2년 이내(2024~2026년) 실제 골퍼가 작성한 솔직한 코스 컨디션 및 라운드 기록입니다.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {blogReviews.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>골프장 전수 검수 완료</span>
                      </span>
                    )}
                    <a
                      href={naverSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      <span>네이버 전체 검색</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {blogReviews.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2.5">
                    {blogReviews.map((rev, idx) => (
                      <div
                        key={idx}
                        className="p-3 sm:p-3.5 bg-slate-50/80 hover:bg-emerald-50/30 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all text-xs space-y-1.5 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <a
                            href={rev.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-slate-900 hover:text-emerald-800 transition-colors flex items-center gap-1.5 group-hover:underline leading-snug"
                          >
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-100/70 text-emerald-800 font-bold shrink-0">
                              블로그
                            </span>
                            <span>{rev.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 shrink-0" />
                          </a>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-bold text-slate-700">{rev.blogName}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-3 h-3" />
                            <span>{rev.date}</span>
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                          {rev.snippet}
                        </p>

                        <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-[11px]">
                          <span className="text-slate-400 text-[10px]">네이버 블로그 출처</span>
                          <a
                            href={rev.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800"
                          >
                            <span>블로그 원문 읽기</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5 text-center sm:text-left">
                      <p className="font-bold text-slate-700">
                        {club.name}의 최신 라운드 블로그 후기를 확인해보세요
                      </p>
                      <p className="text-[11px] text-slate-500">
                        네이버 블로그에서 실제 골퍼들의 잔디 상태 및 코스 공략 후기를 바로 보실 수 있습니다.
                      </p>
                    </div>
                    <a
                      href={naverSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-lg font-bold bg-[#03C75A] hover:bg-[#02b350] text-white flex items-center gap-1.5 shadow-2xs shrink-0 transition-colors"
                    >
                      <span className="font-black text-xs">N</span>
                      <span>네이버 블로그 후기 보기</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ==================================================== */}
          {/* Section 6: 골퍼 실제 리뷰 & 전체 평 남기기 */}
          {/* ==================================================== */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                  골퍼 실제 라운드 전체 평 ({reviews.length}개)
                </h3>
                <p className="text-[11px] text-slate-500">
                  직접 라운드를 다녀온 골퍼들의 솔직한 코스 관리 상태 및 체감 리뷰입니다.
                </p>
              </div>

              <button
                onClick={() => setIsWritingReview(!isWritingReview)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1 shadow-2xs transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isWritingReview ? '작성 닫기' : '전체 평 남기기'}</span>
              </button>
            </div>

            {/* Review Input Form */}
            {isWritingReview && (
              <form onSubmit={handleSubmitReview} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="font-bold text-slate-800 flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-emerald-700" />
                    <span>{editingReviewId ? '내가 작성한 전체 평 수정하기' : '솔직한 전체 평 & 평점 남기기'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="p-0.5"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= reviewForm.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="font-black text-amber-500 ml-1">{reviewForm.rating}.0</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">닉네임</label>
                    <input
                      type="text"
                      value={reviewForm.author}
                      onChange={(e) => setReviewForm({ ...reviewForm, author: e.target.value })}
                      placeholder="예: 싱글골퍼, 보기플레이어"
                      className="w-full p-2 bg-white rounded-lg border border-slate-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">평균 타수 (핸디)</label>
                    <select
                      value={reviewForm.avgScore}
                      onChange={(e) => setReviewForm({ ...reviewForm, avgScore: e.target.value })}
                      className="w-full p-2 bg-white rounded-lg border border-slate-300"
                    >
                      <option value="싱글 (70대)">싱글 (70대)</option>
                      <option value="80대 초중반">80대 초중반</option>
                      <option value="90대 (보기플레이어)">90대 (보기플레이어)</option>
                      <option value="100대 (골린이/백돌이)">100대 (골린이/백돌이)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">방문 시기</label>
                    <input
                      type="text"
                      value={reviewForm.visitDate}
                      onChange={(e) => setReviewForm({ ...reviewForm, visitDate: e.target.value })}
                      placeholder="예: 2024년 10월 3부"
                      className="w-full p-2 bg-white rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                {/* 세부 점수 */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-white rounded-lg border border-slate-200 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">코스/잔디 관리:</span>
                    <select
                      value={reviewForm.courseScore}
                      onChange={(e) => setReviewForm({ ...reviewForm, courseScore: Number(e.target.value) })}
                      className="font-bold text-slate-800"
                    >
                      <option value="5">★ 5점 (최상)</option>
                      <option value="4">★ 4점 (우수)</option>
                      <option value="3">★ 3점 (보통)</option>
                      <option value="2">★ 2점 (미흡)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">진행/캐디 서비스:</span>
                    <select
                      value={reviewForm.caddieScore}
                      onChange={(e) => setReviewForm({ ...reviewForm, caddieScore: Number(e.target.value) })}
                      className="font-bold text-slate-800"
                    >
                      <option value="5">★ 5점 (친절)</option>
                      <option value="4">★ 4점 (원활)</option>
                      <option value="3">★ 3점 (보통)</option>
                      <option value="2">★ 2점 (아쉬움)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">가성비/시설:</span>
                    <select
                      value={reviewForm.costScore}
                      onChange={(e) => setReviewForm({ ...reviewForm, costScore: Number(e.target.value) })}
                      className="font-bold text-slate-800"
                    >
                      <option value="5">★ 5점 (대만족)</option>
                      <option value="4">★ 4점 (적정)</option>
                      <option value="3">★ 3점 (보통)</option>
                      <option value="2">★ 2점 (비쌈)</option>
                    </select>
                  </div>
                </div>

                {/* 텍스트 내용 */}
                <div>
                  <textarea
                    rows={3}
                    value={reviewForm.content}
                    onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                    placeholder="페어웨이 디봇 상태, 그린 스피드, 티박스 매트 유무, 야간 조명 밝기 등 골퍼들에게 실질적인 도움이 되는 전체 평을 솔직하게 남겨주세요."
                    className="w-full p-2.5 bg-white rounded-lg border border-slate-300"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCancelReview}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 font-bold transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{editingReviewId ? '수정 완료' : '전체 평 등록하기'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">
                  아직 등록된 골퍼 후기가 없습니다
                </p>
                <p className="text-xs text-slate-500">
                  직접 라운드를 다녀오셨나요? 첫 번째 솔직한 전체 평을 남겨보세요!
                </p>
                {!isWritingReview && (
                  <button
                    onClick={() => setIsWritingReview(true)}
                    className="mt-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white inline-flex items-center gap-1 shadow-2xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>첫 전체 평 남기기</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {reviews.map((rev) => {
                  const mine = isMyReview(rev.id);
                  return (
                    <div
                      key={rev.id}
                      className={`p-3 sm:p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                        mine
                          ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200/50'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900">{rev.author}</span>
                          {mine && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white shadow-2xs">
                              내가 쓴 글
                            </span>
                          )}
                          {rev.avgScore && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                              {rev.avgScore}
                            </span>
                          )}
                          {rev.visitDate && (
                            <span className="text-[10px] text-slate-400">· {rev.visitDate}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1">
                            <div className="flex items-center text-amber-500">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < rev.rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-400 ml-1">
                              {rev.createdAt}
                              {rev.updatedAt && ' (수정됨)'}
                            </span>
                          </div>

                          {mine && (
                            <div className="flex items-center gap-1 pl-1.5 border-l border-slate-300">
                              <button
                                type="button"
                                onClick={() => handleStartEditReview(rev)}
                                className="px-2 py-1 text-slate-600 hover:text-emerald-800 hover:bg-emerald-100 rounded text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                                title="수정하기"
                              >
                                <Edit3 className="w-3 h-3 text-emerald-700" />
                                <span>수정</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReview(rev.id)}
                                className="px-2 py-1 text-slate-500 hover:text-rose-700 hover:bg-rose-100 rounded text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                                title="삭제하기"
                              >
                                <Trash2 className="w-3 h-3 text-rose-600" />
                                <span>삭제</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-700 leading-relaxed text-[11px] sm:text-xs">
                        {rev.content}
                      </p>

                      {rev.scores && (
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          <span>잔디/관리 ★{rev.scores.course}</span>
                          <span>·</span>
                          <span>서비스 ★{rev.scores.caddie}</span>
                          <span>·</span>
                          <span>가성비 ★{rev.scores.cost}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
