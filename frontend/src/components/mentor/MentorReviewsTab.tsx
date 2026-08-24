'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/lib/api';

interface ReviewStudent {
  username: string;
  fullname: string;
  avatar: string;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  bookingId: number;
  student: ReviewStudent;
}

interface ReviewsData {
  reviews: Review[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  averageRating: number;
  reviewCount: number;
}

interface MentorReviewsTabProps {
  mentorUsername: string;
}

/** Render filled/half/empty stars */
const StarDisplay = ({ rating, size = 18 }: { rating: number; size?: number }) => {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = rating >= s;
        const half = !filled && rating >= s - 0.5;
        return (
          <i
            key={s}
            className={filled ? 'bi bi-star-fill' : half ? 'bi bi-star-half' : 'bi bi-star'}
            style={{ fontSize: size, color: filled || half ? '#F5C518' : '#D1D5DB' }}
          />
        );
      })}
    </span>
  );
};

/** Bar chart row for star distribution */
const RatingBar = ({ star, count, total }: { star: number; count: number; total: number }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <span style={{ fontSize: 13, color: '#6B7280', width: 28, textAlign: 'right', flexShrink: 0 }}>
        {star} <i className="bi bi-star-fill" style={{ color: '#F5C518', fontSize: 11 }} />
      </span>
      <div style={{
        flex: 1, height: 8, borderRadius: 99,
        background: '#E5E7EB', overflow: 'hidden'
      }}>
        <div style={{
          height: '100%', borderRadius: 99,
          width: `${pct}%`,
          background: star >= 4 ? '#22C55E' : star === 3 ? '#F59E0B' : '#EF4444',
          transition: 'width 0.6s cubic-bezier(.4,0,.2,1)'
        }} />
      </div>
      <span style={{ fontSize: 12, color: '#9CA3AF', width: 32, flexShrink: 0 }}>{count}</span>
    </div>
  );
};

const formatDate = (dt: string) => {
  try {
    return new Date(dt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dt;
  }
};

const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || '?';

const AVATAR_COLORS = ['#F27125', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];
const colorFor = (str: string) => AVATAR_COLORS[str.charCodeAt(0) % AVATAR_COLORS.length];

export default function MentorReviewsTab({ mentorUsername }: MentorReviewsTabProps) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [starDist, setStarDist] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res: ReviewsData = await fetchAPI(`/api/reviews/mentor/${mentorUsername}?page=${p}`);
      setData(res);
      if (p === 1) {
        const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        (res.reviews || []).forEach(r => { if (r.rating >= 1 && r.rating <= 5) dist[r.rating]++; });
        setStarDist(dist);
      }
    } catch (err) {
      console.error('[MentorReviewsTab] Lỗi tải đánh giá:', err);
    } finally {
      setLoading(false);
    }
  }, [mentorUsername]);

  useEffect(() => { load(page); }, [page, load]);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200, gap: 12 }}>
        <div style={{
          width: 32, height: 32, border: '3px solid #F27125',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span style={{ color: '#6B7280', fontSize: 15 }}>Đang tải đánh giá...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const totalReviews = data?.reviewCount ?? 0;
  const avgRating = data?.averageRating ?? 0;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Overview Card */}
      <div style={{
        background: 'linear-gradient(135deg, #fff7f0 0%, #fff 60%)',
        border: '1px solid #FFE4CC',
        borderRadius: 20,
        padding: '28px 32px',
        marginBottom: 24,
        display: 'flex',
        gap: 40,
        alignItems: 'center',
        flexWrap: 'wrap',
        boxShadow: '0 2px 12px rgba(242,113,37,0.07)'
      }}>
        {/* Big rating number */}
        <div style={{ textAlign: 'center', minWidth: 120 }}>
          <div style={{ fontSize: 64, fontWeight: 800, color: '#F27125', lineHeight: 1 }}>
            {totalReviews > 0 ? avgRating.toFixed(1) : '—'}
          </div>
          <StarDisplay rating={avgRating} size={20} />
          <div style={{ marginTop: 8, color: '#6B7280', fontSize: 13 }}>
            {totalReviews} đánh giá
          </div>
        </div>

        {/* Bar chart */}
        <div style={{ flex: 1, minWidth: 200 }}>
          {[5, 4, 3, 2, 1].map(s => (
            <RatingBar key={s} star={s} count={starDist[s] ?? 0} total={totalReviews} />
          ))}
        </div>

        {/* Summary chip */}
        <div style={{
          background: avgRating >= 4.5 ? '#ECFDF5' : avgRating >= 3.5 ? '#FFF7ED' : '#FEF2F2',
          border: `1px solid ${avgRating >= 4.5 ? '#6EE7B7' : avgRating >= 3.5 ? '#FED7AA' : '#FECACA'}`,
          borderRadius: 12,
          padding: '14px 20px',
          textAlign: 'center',
          minWidth: 140
        }}>
          <div style={{ fontSize: 28 }}>
            {avgRating >= 4.5 ? '🏆' : avgRating >= 3.5 ? '👍' : avgRating > 0 ? '📈' : '📋'}
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, marginTop: 6, color: '#111827' }}>
            {avgRating >= 4.5 ? 'Xuất sắc' : avgRating >= 3.5 ? 'Tốt' : avgRating > 0 ? 'Trung bình' : 'Chưa có'}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
            {avgRating >= 4.5 ? 'Sinh viên rất hài lòng' : avgRating >= 3.5 ? 'Sinh viên hài lòng' : avgRating > 0 ? 'Cần cải thiện thêm' : 'đánh giá nào'}
          </div>
        </div>
      </div>

      {/* Review List */}
      {totalReviews === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: '#F9FAFB', borderRadius: 16,
          border: '1.5px dashed #E5E7EB'
        }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>⭐</div>
          <div style={{ fontWeight: 700, fontSize: 17, color: '#374151', marginBottom: 6 }}>
            Chưa có đánh giá nào
          </div>
          <div style={{ color: '#9CA3AF', fontSize: 14 }}>
            Sau khi hoàn thành buổi học, sinh viên sẽ có thể đánh giá bạn tại đây.
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 14 }}>
            Tất cả đánh giá ({totalReviews})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(data?.reviews || []).map(review => (
              <div key={review.id} style={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: 16,
                padding: '20px 22px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                transition: 'box-shadow 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(242,113,37,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  {/* Avatar */}
                  {review.student?.avatar ? (
                    <img
                      src={review.student.avatar}
                      alt={review.student.fullname}
                      style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{
                      width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                      background: colorFor(review.student?.username || 'a'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 700, fontSize: 18
                    }}>
                      {getInitial(review.student?.fullname || '')}
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                      <div>
                        <span style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>
                          {review.student?.fullname || review.student?.username || 'Sinh viên'}
                        </span>
                        <span style={{ color: '#9CA3AF', fontSize: 12, marginLeft: 8 }}>
                          @{review.student?.username}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                        <i className="bi bi-clock" style={{ marginRight: 4 }} />
                        {formatDate(review.createdAt)}
                      </span>
                    </div>

                    {/* Stars */}
                    <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StarDisplay rating={review.rating} size={16} />
                      <span style={{
                        fontSize: 12, fontWeight: 600, color: '#fff',
                        background: review.rating >= 4 ? '#22C55E' : review.rating === 3 ? '#F59E0B' : '#EF4444',
                        padding: '1px 8px', borderRadius: 99
                      }}>
                        {review.rating}/5
                      </span>
                    </div>

                    {/* Comment */}
                    {review.comment ? (
                      <div style={{
                        fontSize: 14, color: '#374151', lineHeight: 1.6,
                        background: '#F9FAFB', borderRadius: 10,
                        padding: '10px 14px',
                        borderLeft: '3px solid #F27125'
                      }}>
                        <i className="bi bi-chat-quote" style={{ color: '#F27125', marginRight: 6 }} />
                        {review.comment}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>
                        Sinh viên không để lại nhận xét.
                      </div>
                    )}

                    <div style={{ marginTop: 8, fontSize: 11, color: '#C4C9D4' }}>
                      Booking #{review.bookingId}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {(data?.totalPages ?? 0) > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 18px', borderRadius: 10, border: '1px solid #E5E7EB',
                  background: page === 1 ? '#F3F4F6' : '#fff',
                  color: page === 1 ? '#9CA3AF' : '#374151',
                  cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14
                }}
              >
                <i className="bi bi-chevron-left" />
              </button>
              {Array.from({ length: data?.totalPages ?? 0 }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    padding: '8px 16px', borderRadius: 10, fontWeight: 600, fontSize: 14,
                    border: p === page ? '2px solid #F27125' : '1px solid #E5E7EB',
                    background: p === page ? '#FFF3EA' : '#fff',
                    color: p === page ? '#F27125' : '#374151',
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(data?.totalPages ?? 1, p + 1))}
                disabled={page === (data?.totalPages ?? 1)}
                style={{
                  padding: '8px 18px', borderRadius: 10, border: '1px solid #E5E7EB',
                  background: page === (data?.totalPages ?? 1) ? '#F3F4F6' : '#fff',
                  color: page === (data?.totalPages ?? 1) ? '#9CA3AF' : '#374151',
                  cursor: page === (data?.totalPages ?? 1) ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14
                }}
              >
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          )}
        </>
      )}

      {loading && data && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 14 }}>
          <i className="bi bi-arrow-repeat" style={{ marginRight: 6 }} />
          Đang tải...
        </div>
      )}
    </div>
  );
}
