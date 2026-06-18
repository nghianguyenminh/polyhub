'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { Mentor } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: Mentor;
}

interface DayAvailability {
  date: string;
  dayOfWeek: number;
  isAvailable: boolean;
  slots: { startTime: string; endTime: string }[];
  busySlots: { startTime: string; endTime: string; status: string }[];
}

export default function BookingModal({ isOpen, onClose, mentor }: BookingModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayAvailability | null>(null);
  
  // Form states
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState<number>(30);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Validation feedback
  const [validationMsg, setValidationMsg] = useState({ text: '', isValid: false });

  useEffect(() => {
    if (isOpen && mentor.user?.username) {
      loadAvailability();
      // Reset form states
      setStartTime('09:00');
      setDuration(30);
      setNote('');
      setError('');
      setSuccess(false);
      setSelectedDay(null);
    }
  }, [isOpen, mentor]);

  const loadAvailability = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAPI(`/api/bookings/mentor/${mentor.user?.username}/availability`);
      setAvailability(data);
      // Tự động chọn ngày khả dụng đầu tiên
      const firstAvailable = data.find((d: DayAvailability) => d.isAvailable);
      if (firstAvailable) {
        setSelectedDay(firstAvailable);
      }
    } catch (err: any) {
      console.error('Failed to load mentor availability', err);
      setError(err.message || 'Không thể tải lịch của Mentor. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Real-time client-side validation
  useEffect(() => {
    if (!selectedDay || !startTime) {
      setValidationMsg({ text: '', isValid: false });
      return;
    }

    try {
      const [sh, sm] = startTime.split(':').map(Number);
      const startMinutes = sh * 60 + sm;
      const endMinutes = startMinutes + duration;

      const eh = Math.floor(endMinutes / 60);
      const em = endMinutes % 60;
      const endTimeStr = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

      // 1. Kiểm tra có nằm trong khung giờ rảnh của mentor không
      let isWithinRange = false;
      for (const slot of selectedDay.slots) {
        const [slotSh, slotSm] = slot.startTime.split(':').map(Number);
        const [slotEh, slotEm] = slot.endTime.split(':').map(Number);
        const slotStartMin = slotSh * 60 + slotSm;
        const slotEndMin = slotEh * 60 + slotEm;

        if (startMinutes >= slotStartMin && endMinutes <= slotEndMin) {
          isWithinRange = true;
          break;
        }
      }

      if (!isWithinRange) {
        setValidationMsg({
          text: `Khung giờ ${startTime} - ${endTimeStr} nằm ngoài lịch rảnh của Mentor ngày hôm nay.`,
          isValid: false
        });
        return;
      }

      // 2. Kiểm tra có đè lên lịch bận nào không
      for (const busy of selectedDay.busySlots) {
        const [busySh, busySm] = busy.startTime.split(':').map(Number);
        const [busyEh, busyEm] = busy.endTime.split(':').map(Number);
        const busyStartMin = busySh * 60 + busySm;
        const busyEndMin = busyEh * 60 + busyEm;

        if (startMinutes < busyEndMin && endMinutes > busyStartMin) {
          setValidationMsg({
            text: `Khung giờ trùng với lịch đã được đặt (${busy.startTime} - ${busy.endTime}).`,
            isValid: false
          });
          return;
        }
      }

      setValidationMsg({
        text: `Thời gian đặt lịch hợp lệ: ${startTime} - ${endTimeStr}`,
        isValid: true
      });

    } catch (e) {
      setValidationMsg({ text: 'Thời gian nhập không đúng định dạng.', isValid: false });
    }
  }, [selectedDay, startTime, duration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay || !validationMsg.isValid) return;

    setSubmitting(true);
    setError('');

    try {
      await fetchAPI('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          mentorUsername: mentor.user?.username,
          bookingDate: selectedDay.date,
          startTime: startTime,
          duration: duration,
          note: note,
        }),
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        router.push('/bookings');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Đặt lịch thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const getDayName = (dayOfWeek: number) => {
    if (dayOfWeek === 8) return 'CN';
    return `T${dayOfWeek}`;
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          
          {/* Header */}
          <div className="modal-header text-white border-0 py-3" style={{ background: 'linear-gradient(135deg, #F27125, #FF9E67)' }}>
            <h5 className="modal-title fw-bold d-flex align-items-center">
              <i className="bi bi-calendar-event me-2"></i> Đặt lịch hẹn với Mentor
            </h5>
            <button type="button" className="btn-close btn-close-white shadow-none" onClick={onClose} aria-label="Close"></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4 bg-light text-dark">
            {/* Mentor Short Info */}
            <div className="d-flex align-items-center gap-3 p-3 bg-white rounded-3 border mb-4 shadow-sm">
              <img 
                src={mentor.user?.avatar && mentor.user.avatar !== 'default.png' ? mentor.user.avatar : `https://ui-avatars.com/api/?name=${mentor.fullname}&background=random`} 
                className="rounded-circle border" 
                style={{ width: '56px', height: '56px', objectFit: 'cover' }}
                alt="avatar" 
              />
              <div>
                <h6 className="fw-bold mb-1 text-dark">{mentor.fullname}</h6>
                <div className="text-muted" style={{ fontSize: '13px' }}>
                  <i className="bi bi-briefcase me-1"></i> {mentor.user?.major || 'Mentor'}
                </div>
              </div>
            </div>

            {success ? (
              <div className="text-center py-5">
                <div className="mb-3 text-success">
                  <i className="bi bi-check-circle-fill" style={{ fontSize: '64px' }}></i>
                </div>
                <h5 className="fw-bold text-success">Đặt Lịch Hẹn Thành Công!</h5>
                <p className="text-muted">Đang chuyển hướng bạn tới trang quản lý lịch hẹn...</p>
              </div>
            ) : loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" style={{ color: '#F27125' }} role="status"></div>
                <div className="mt-2 text-muted">Đang tải lịch của Mentor...</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger mb-3 py-2" style={{ fontSize: '14px' }}><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</div>}

                {/* 1. Chọn ngày rảnh */}
                <div className="mb-4">
                  <label className="fw-bold mb-2 text-secondary" style={{ fontSize: '14px' }}>
                    1. Chọn ngày hẹn (14 ngày tới):
                  </label>
                  
                  <div className="d-flex gap-2 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                    {availability.map((day) => {
                      const isSelected = selectedDay?.date === day.date;
                      return (
                        <button
                          key={day.date}
                          type="button"
                          disabled={!day.isAvailable}
                          onClick={() => {
                            setSelectedDay(day);
                            setError('');
                          }}
                          className="d-flex flex-column align-items-center justify-content-center border-0 rounded-3 shadow-sm transition-all"
                          style={{
                            minWidth: '68px',
                            height: '75px',
                            cursor: day.isAvailable ? 'pointer' : 'not-allowed',
                            backgroundColor: isSelected 
                              ? '#F27125' 
                              : day.isAvailable 
                                ? 'rgba(242, 113, 37, 0.08)' 
                                : '#e9ecef',
                            color: isSelected 
                              ? '#fff' 
                              : day.isAvailable 
                                ? '#F27125' 
                                : '#a1a8b3',
                            border: isSelected 
                              ? '1px solid #F27125' 
                              : day.isAvailable 
                                ? '1px solid rgba(242, 113, 37, 0.2)' 
                                : '1px solid #dee2e6',
                            transform: isSelected ? 'scale(1.03)' : 'none',
                            opacity: day.isAvailable ? 1 : 0.6
                          }}
                        >
                          <span className="fw-bold" style={{ fontSize: '14px' }}>{getDayName(day.dayOfWeek)}</span>
                          <span style={{ fontSize: '11px', marginTop: '2px', fontWeight: 500 }}>{formatDateLabel(day.date)}</span>
                          {!day.isAvailable && <span style={{ fontSize: '8px', marginTop: '2px', fontWeight: 600 }}>Bận</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedDay && (
                  <>
                    {/* 2. Biểu đồ lịch rảnh/bận */}
                    <div className="mb-4 bg-white p-3 rounded-3 border shadow-sm">
                      <label className="fw-bold mb-2 text-secondary" style={{ fontSize: '14px' }}>
                        2. Lịch rảnh & bận của Mentor hôm nay:
                      </label>

                      {/* Thông tin khung rảnh */}
                      <div className="mb-2 d-flex flex-wrap gap-2">
                        <span className="text-muted fs-7 me-1">Khung rảnh:</span>
                        {selectedDay.slots.map((s, idx) => (
                          <span key={idx} className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-20 fs-7 px-2 py-1">
                            <i className="bi bi-clock me-1"></i> {s.startTime} - {s.endTime}
                          </span>
                        ))}
                      </div>

                      {/* Thông tin lịch đã bận (Pending/Approved) */}
                      <div className="d-flex flex-wrap gap-2">
                        <span className="text-muted fs-7 me-1">Lịch bận:</span>
                        {selectedDay.busySlots.length === 0 ? (
                          <span className="text-success fs-7 fw-medium"><i className="bi bi-patch-check-fill me-1"></i>Chưa có lịch hẹn nào trùng - Trống lịch cả ngày</span>
                        ) : (
                          selectedDay.busySlots.map((b, idx) => (
                            <span key={idx} className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-20 fs-7 px-2 py-1" style={{ textDecoration: 'line-through' }}>
                              <i className="bi bi-x-circle me-1"></i> {b.startTime} - {b.endTime}
                            </span>
                          ))
                        )}
                      </div>

                      {/* Visual Progress/Timeline Bar */}
                      <div className="mt-3">
                        <div className="d-flex justify-content-between text-muted fs-8 px-1 mb-1">
                          <span>08:00</span>
                          <span>12:00</span>
                          <span>14:00</span>
                          <span>17:00</span>
                          <span>21:00</span>
                        </div>
                        <div className="progress" style={{ height: '12px', borderRadius: '50rem', backgroundColor: '#e9ecef' }}>
                          {/* We draw a simple visual representation */}
                          {selectedDay.slots.map((s, idx) => {
                            const [sh, sm] = s.startTime.split(':').map(Number);
                            const [eh, em] = s.endTime.split(':').map(Number);
                            // Normalize to minutes between 08:00 (480 mins) and 21:00 (1260 mins)
                            const minStart = 480;
                            const minEnd = 1260;
                            const total = minEnd - minStart;
                            
                            const sMin = sh * 60 + sm - minStart;
                            const eMin = eh * 60 + em - minStart;
                            
                            const leftPct = Math.max(0, (sMin / total) * 100);
                            const widthPct = Math.min(100 - leftPct, ((eMin - sMin) / total) * 100);

                            return (
                              <div
                                key={idx}
                                className="progress-bar bg-success bg-opacity-25"
                                style={{
                                  position: 'absolute',
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                  height: '12px'
                                }}
                              />
                            );
                          })}
                          
                          {selectedDay.busySlots.map((b, idx) => {
                            const [sh, sm] = b.startTime.split(':').map(Number);
                            const [eh, em] = b.endTime.split(':').map(Number);
                            const minStart = 480;
                            const minEnd = 1260;
                            const total = minEnd - minStart;
                            
                            const sMin = sh * 60 + sm - minStart;
                            const eMin = eh * 60 + em - minStart;
                            
                            const leftPct = Math.max(0, (sMin / total) * 100);
                            const widthPct = Math.min(100 - leftPct, ((eMin - sMin) / total) * 100);

                            return (
                              <div
                                key={idx}
                                className="progress-bar bg-danger"
                                style={{
                                  position: 'absolute',
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                  height: '12px',
                                  zIndex: 3
                                }}
                              />
                            );
                          })}
                        </div>
                        <div className="d-flex align-items-center gap-3 mt-2 text-muted" style={{ fontSize: '11px' }}>
                          <div className="d-flex align-items-center gap-1">
                            <span className="d-inline-block rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: 'rgba(25, 135, 84, 0.25)' }}></span> Lịch rảnh của Mentor
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <span className="d-inline-block rounded-circle bg-danger" style={{ width: '8px', height: '8px' }}></span> Lịch đã có người đặt
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. Giờ bắt đầu và Thời lượng */}
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="fw-bold mb-2 text-secondary" style={{ fontSize: '14px' }}>
                          3. Nhập giờ bắt đầu:
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-white"><i className="bi bi-clock"></i></span>
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="form-control bg-white shadow-none"
                            required
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="fw-bold mb-2 text-secondary" style={{ fontSize: '14px' }}>
                          4. Chọn thời lượng cuộc gọi:
                        </label>
                        <div className="d-flex flex-wrap gap-2">
                          {[20, 30, 40, 50, 60].map((mins) => {
                            const isDurSelected = duration === mins;
                            return (
                              <button
                                key={mins}
                                type="button"
                                onClick={() => setDuration(mins)}
                                className="btn fw-bold px-3 py-2 rounded-3 transition-all"
                                style={{
                                  fontSize: '13px',
                                  backgroundColor: isDurSelected ? '#F27125' : 'rgba(242, 113, 37, 0.08)',
                                  color: isDurSelected ? '#fff' : '#F27125',
                                  border: isDurSelected ? '1px solid #F27125' : '1px solid rgba(242, 113, 37, 0.2)'
                                }}
                              >
                                {mins} phút
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Hiển thị kết quả kiểm tra thời gian */}
                    <div className="mb-4">
                      <div 
                        className={`alert py-2 px-3 rounded-3 d-flex align-items-center fs-7 ${validationMsg.isValid ? 'alert-success text-success' : 'alert-warning text-warning'}`}
                        style={{ border: 'none', backgroundColor: validationMsg.isValid ? '#d1e7dd' : '#fff3cd' }}
                      >
                        <i className={`bi ${validationMsg.isValid ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2 fs-6`}></i>
                        <span>{validationMsg.text || 'Đang xác thực thời gian...'}</span>
                      </div>
                    </div>

                    {/* 4. Ghi chú */}
                    <div className="mb-4">
                      <label className="fw-bold mb-2 text-secondary" style={{ fontSize: '14px' }}>
                        5. Ghi chú câu hỏi / Nội dung cần hỗ trợ:
                      </label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="form-control bg-white shadow-none"
                        rows={3}
                        placeholder="Nêu chi tiết nội dung hoặc dự án bạn muốn Mentor tư vấn để Mentor chuẩn bị tốt nhất..."
                        maxLength={500}
                        required
                      />
                      <div className="text-end text-muted mt-1" style={{ fontSize: '11px' }}>
                        {note.length}/500 ký tự
                      </div>
                    </div>
                  </>
                )}

                {/* Footer buttons */}
                <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-4">
                  <button type="button" className="btn btn-light border rounded-pill px-4 fw-medium text-dark" onClick={onClose}>
                    Đóng
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting || !selectedDay || !validationMsg.isValid} 
                    className="btn btn-poly-gradient rounded-pill px-4 fw-bold text-white border-0 shadow-sm"
                    style={{ 
                      background: 'linear-gradient(135deg, #F27125 0%, #FFC371 100%)',
                      opacity: (!selectedDay || !validationMsg.isValid || submitting) ? 0.6 : 1
                    }}
                  >
                    {submitting ? 'Đang gửi...' : 'Xác nhận đặt lịch'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
