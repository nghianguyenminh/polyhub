import React, { useState } from 'react';
import { fetchAPI } from '@/lib/api';

interface RatingModalProps {
  bookingId: number;
  mentorName: string;
  onClose: () => void;
}

export default function RatingModal({ bookingId, mentorName, onClose }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      setErrorMsg('Vui lòng chọn số sao đánh giá!');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      await fetchAPI('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ bookingId, rating, comment }),
      });
      setSuccess(true);
      window.dispatchEvent(new CustomEvent('refresh-bookings'));
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã xảy ra lỗi khi gửi đánh giá');
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 999999
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 450,
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, color: '#31A24C', marginBottom: 16 }}>
              <i className="bi bi-check-circle-fill" />
            </div>
            <h4 style={{ fontWeight: 700, color: '#1C1E21', marginBottom: 8 }}>Cảm ơn bạn!</h4>
            <p style={{ color: '#65676B' }}>Đánh giá của bạn đã được gửi thành công.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ fontWeight: 700, margin: 0, color: '#1C1E21' }}>Đánh giá buổi học</h4>
              <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#8A8D91', cursor: 'pointer' }}>
                &times;
              </button>
            </div>
            <p style={{ color: '#65676B', marginBottom: 24 }}>
              Bạn cảm thấy buổi học với Mentor <strong>{mentorName}</strong> như thế nào?
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  style={{
                    background: 'none', border: 'none', fontSize: 40, cursor: 'pointer',
                    color: star <= (hoverRating || rating) ? '#F5C518' : '#E4E6EB',
                    transition: 'transform 0.1s',
                  }}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.9)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <i className="bi bi-star-fill" />
                </button>
              ))}
            </div>

            <textarea
              placeholder="Để lại nhận xét của bạn về Mentor (không bắt buộc)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: '100%', padding: 12, borderRadius: 12, border: '1px solid #E4E6EB',
                background: '#F0F2F5', minHeight: 100, resize: 'none', marginBottom: 16,
                fontFamily: 'inherit', fontSize: 14
              }}
            />

            {errorMsg && (
              <div style={{ color: '#E02424', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="bi bi-exclamation-circle-fill" /> {errorMsg}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: '100%', padding: '14px 0', background: '#F27125', color: '#fff',
                border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 15,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
