'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fetchAPI } from '@/lib/api';
import { Mentor } from '@/lib/types';
import { useRouter } from 'next/navigation';
import ClockPicker from '../common/ClockPicker';
import '@/styles/bookings.css';

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
  const [balance, setBalance] = useState<number>(0);

  // Form states
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState<number>(30);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasManuallySelectedTime, setHasManuallySelectedTime] = useState(false);

  // Zoom state (timeline)
  const [zoom, setZoom] = useState<number>(1);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Validation feedback
  const [validationMsg, setValidationMsg] = useState({ text: '', isValid: false });
  const [lockStatus, setLockStatus] = useState<{ locked: boolean; message: string; expiresAt?: string } | null>(null);

  // Native wheel event binding to allow preventDefault (React passive listener bypass)
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const container = el.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseXInContainer = e.clientX - rect.left;
      const mouseXInContent = mouseXInContainer + container.scrollLeft;

      const oldZoom = zoom;
      let newZoom = oldZoom;

      if (e.deltaY < 0) {
        newZoom = Math.min(oldZoom + 0.5, 5);
      } else {
        newZoom = Math.max(oldZoom - 0.5, 1);
      }

      if (newZoom !== oldZoom) {
        setZoom(newZoom);
        const ratio = newZoom / oldZoom;
        const newMouseXInContent = mouseXInContent * ratio;
        const newScrollLeft = newMouseXInContent - mouseXInContainer;
        requestAnimationFrame(() => {
          container.scrollLeft = newScrollLeft;
        });
      }
    };

    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheelNative);
    };
  }, [zoom, selectedDay, loading]);

  useEffect(() => {
    if (isOpen && mentor.user?.username) {
      loadAvailability();
      setStartTime('09:00');
      setDuration(30);
      setNote('');
      setError('');
      setSuccess(false);
      setSelectedDay(null);
      setZoom(1);
      setHasManuallySelectedTime(false);
      loadBalance();
    }
  }, [isOpen, mentor]);

  const loadBalance = async () => {
    try {
      const data = await fetchAPI('/api/wallet/balance');
      setBalance(data.balance || 0);
    } catch (e) {
      console.error('Failed to load balance', e);
    }
  };

  const loadAvailability = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAPI(`/api/bookings/mentor/${mentor.user?.username}/availability`);
      setAvailability(data);
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

  const getEarliestAvailableTime = (day: DayAvailability, dur: number): string | null => {
    if (!day || day.slots.length === 0) return null;

    const todayStr = new Date().toLocaleDateString('en-CA');
    const isToday = day.date === todayStr;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const slot of day.slots) {
      const [slotSh, slotSm] = slot.startTime.split(':').map(Number);
      const [slotEh, slotEm] = slot.endTime.split(':').map(Number);
      const slotStartMin = slotSh * 60 + slotSm;
      const slotEndMin = slotEh * 60 + slotEm;

      const searchStartMin = isToday ? Math.max(slotStartMin, currentMinutes + 5) : slotStartMin;

      for (let timeMin = searchStartMin; timeMin + dur <= slotEndMin; timeMin += 5) {
        const testEndMin = timeMin + dur;
        let isOverlap = false;

        for (const busy of day.busySlots) {
          const [busySh, busySm] = busy.startTime.split(':').map(Number);
          const [busyEh, busyEm] = busy.endTime.split(':').map(Number);
          const busyStartMin = busySh * 60 + busySm;
          const busyEndMin = busyEh * 60 + busyEm;

          if (timeMin < busyEndMin && testEndMin > busyStartMin) {
            isOverlap = true;
            break;
          }
        }

        if (!isOverlap) {
          const h = Math.floor(timeMin / 60);
          const m = timeMin % 60;
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
      }
    }

    return null;
  };

  useEffect(() => {
    if (selectedDay && !hasManuallySelectedTime) {
      const suggested = getEarliestAvailableTime(selectedDay, duration);
      if (suggested) {
        setStartTime(suggested);
        setError('');
      } else {
        setValidationMsg({ text: 'Ngày được chọn đã bận hoàn toàn hoặc không còn giờ rảnh khả dụng trong hôm nay.', isValid: false });
      }
    }
  }, [selectedDay, duration, hasManuallySelectedTime]);

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

      const todayStr = new Date().toLocaleDateString('en-CA');
      if (selectedDay.date === todayStr) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        if (startMinutes < currentMinutes) {
          setValidationMsg({
            text: `Giờ bắt đầu (${startTime}) đã trôi qua. Vui lòng chọn khung giờ trong tương lai.`,
            isValid: false
          });
          return;
        }
      }

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
          text: `Khung giờ ${startTime} - ${endTimeStr} nằm ngoài lịch rảnh của Mentor.`,
          isValid: false
        });
        return;
      }

      for (const busy of selectedDay.busySlots) {
        const [busySh, busySm] = busy.startTime.split(':').map(Number);
        const [busyEh, busyEm] = busy.endTime.split(':').map(Number);
        const busyStartMin = busySh * 60 + busySm;
        const busyEndMin = busyEh * 60 + busyEm;

        if (startMinutes < busyEndMin && endMinutes > busyStartMin) {
          setValidationMsg({
            text: `Khung giờ trùng với lịch đã đặt (${busy.startTime} - ${busy.endTime}).`,
            isValid: false
          });
          return;
        }
      }

      setValidationMsg({
        text: `Thời gian hợp lệ: ${startTime} – ${endTimeStr}`,
        isValid: true
      });

    } catch (e) {
      setValidationMsg({ text: 'Thời gian nhập không hợp lệ.', isValid: false });
    }
  }, [selectedDay, startTime, duration]);

  useEffect(() => {
    if (!selectedDay || !startTime || !validationMsg.isValid) {
      setLockStatus(null);
      return;
    }

    const lockTimer = setTimeout(async () => {
      try {
        const data = await fetchAPI('/api/bookings/lock-slot', {
          method: 'POST',
          body: JSON.stringify({
            mentorUsername: mentor.user?.username,
            date: selectedDay.date,
            startTime: startTime
          })
        });
        if (data.locked) {
          setLockStatus({
            locked: true,
            message: 'Khung giờ này đã được giữ chỗ riêng cho bạn trong 3 phút.',
            expiresAt: data.expiresAt
          });
        } else {
          setLockStatus({
            locked: false,
            message: data.message || 'Lưu ý: Bạn đang đặt lịch ngoài khung giờ ưu tiên, vị trí chọn không được khóa bảo vệ.'
          });
        }
      } catch (err: any) {
        setLockStatus({
          locked: false,
          message: err.message || 'Khung giờ này đã bị khóa giữ chỗ bởi một người dùng khác.'
        });
        setValidationMsg({ text: 'Khung giờ này đang bị người khác giữ chỗ.', isValid: false });
      }
    }, 600);

    return () => clearTimeout(lockTimer);
  }, [selectedDay?.date, startTime, validationMsg.isValid, mentor.user?.username]);

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
      }, 1800);

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

  const formatFullDateVietnamese = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${dayNames[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const getEndTimeString = () => {
    if (!startTime) return '';
    const [sh, sm] = startTime.split(':').map(Number);
    const endMinutes = sh * 60 + sm + duration;
    const eh = Math.floor(endMinutes / 60);
    const em = endMinutes % 60;
    return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
  };

  const renderTimelineTicks = () => {
    const ticks = [];
    const minStart = 480;  // 08:00
    const minEnd = 1260;   // 21:00
    const totalMins = minEnd - minStart;

    let interval = 60;
    if (zoom >= 4.5) interval = 10;
    else if (zoom >= 3) interval = 30;

    for (let time = minStart; time <= minEnd; time += interval) {
      const pct = ((time - minStart) / totalMins) * 100;
      const h = Math.floor(time / 60);
      const m = time % 60;
      const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      ticks.push(
        <div
          key={time}
          className="bk-timeline-tick"
          style={{ left: `${pct}%` }}
        >
          <div className="bk-timeline-tick-line" />
          <span className="bk-timeline-tick-label">{label}</span>
        </div>
      );
    }
    return ticks;
  };

  if (!isOpen) return null;

  return (
    <div className="bk-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bk-modal-dialog">
        <div className="bk-modal-content">

          {/* Header */}
          <div className="bk-modal-header">
            <div className="bk-modal-title">
              <i className="bi bi-calendar-event-fill" />
              Đặt lịch hẹn với Mentor
            </div>
            <button className="bk-modal-close" onClick={onClose} aria-label="Close">
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* Body */}
          <div className="bk-modal-body">

            {/* Mentor Info */}
            <div className="bk-mentor-card">
              <img
                src={mentor.user?.avatar && mentor.user.avatar !== 'default.png'
                  ? mentor.user.avatar
                  : `https://ui-avatars.com/api/?name=${mentor.fullname}&background=random`}
                className="bk-mentor-avatar"
                alt="avatar"
              />
              <div>
                <div className="bk-mentor-name">{mentor.fullname}</div>
                <div className="bk-mentor-role">
                  <i className="bi bi-briefcase-fill" />
                  {mentor.user?.major || 'Mentor'}
                </div>
              </div>
            </div>

            {/* Error alert */}
            {error && (
              <div className="bk-validation-banner invalid" style={{ marginBottom: 16 }}>
                <i className="bi bi-exclamation-triangle-fill" />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="bk-success">
                <span className="bk-success-icon">🎉</span>
                <h5 className="bk-success-title">Đặt lịch thành công!</h5>
                <p className="bk-success-sub">Đang chuyển hướng đến trang quản lý lịch hẹn...</p>
              </div>
            ) : loading ? (
              <div className="bk-loading">
                <div className="bk-spinner" />
                <span className="bk-loading-text">Đang tải lịch của Mentor...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>

                {/* Step 1: Chọn ngày */}
                <div style={{ marginBottom: 20 }}>
                  <div className="bk-section-label">
                    <span className="bk-section-num">1</span>
                    Chọn ngày hẹn (14 ngày tới)
                  </div>
                  <div className="bk-day-list">
                    {availability.map((day) => {
                      const isSelected = selectedDay?.date === day.date;
                      return (
                        <button
                          key={day.date}
                          type="button"
                          disabled={!day.isAvailable}
                          onClick={() => {
                            setSelectedDay(day);
                            setHasManuallySelectedTime(false);
                            setError('');
                          }}
                          className={`bk-day-btn ${isSelected ? 'selected' : ''}`}
                        >
                          <span className="bk-day-name">{getDayName(day.dayOfWeek)}</span>
                          <span className="bk-day-date">{formatDateLabel(day.date)}</span>
                          {!day.isAvailable && <span className="bk-day-busy-badge">Bận</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedDay && (
                  <>
                    {/* Step 2: Timeline */}
                    <div className="bk-timeline-card">
                      <div className="bk-timeline-header">
                        <div className="bk-section-label" style={{ margin: 0 }}>
                          <span className="bk-section-num">2</span>
                          Biểu đồ lịch rảnh/bận trong ngày
                        </div>
                        <div className="bk-zoom-badge">
                          <i className="bi bi-mouse" />
                          Cuộn để Zoom ({zoom.toFixed(1)}x)
                        </div>
                      </div>

                      <div className="bk-slot-chips">
                        <span style={{ fontSize: 12, color: '#6c757d', fontWeight: 600 }}>Rảnh:</span>
                        {selectedDay.slots.map((s, idx) => (
                          <span key={idx} className="bk-slot-chip free">
                            <i className="bi bi-clock" />
                            {s.startTime} – {s.endTime}
                          </span>
                        ))}
                      </div>

                      <div className="bk-slot-chips">
                        <span style={{ fontSize: 12, color: '#6c757d', fontWeight: 600 }}>Bận:</span>
                        {selectedDay.busySlots.length === 0 ? (
                          <span className="bk-slot-chip free">
                            <i className="bi bi-check-circle-fill" />
                            Trống lịch cả ngày
                          </span>
                        ) : (
                          selectedDay.busySlots.map((b, idx) => (
                            <span key={idx} className="bk-slot-chip busy">
                              <i className="bi bi-x-circle" />
                              {b.startTime} – {b.endTime}
                            </span>
                          ))
                        )}
                      </div>

                      {/* Timeline Wrapper */}
                      <div className="bk-timeline-wrapper">
                        <div
                          ref={timelineRef}
                          className="bk-timeline-inner"
                          style={{ width: `${100 * zoom}%`, minWidth: '100%', cursor: 'zoom-in' }}
                        >
                          <div className="bk-timeline-bar">
                            {selectedDay.slots.map((s, idx) => {
                              const [sh, sm] = s.startTime.split(':').map(Number);
                              const [eh, em] = s.endTime.split(':').map(Number);
                              const minStart = 480; const minEnd = 1260; const total = minEnd - minStart;
                              const sMin = sh * 60 + sm - minStart;
                              const eMin = eh * 60 + em - minStart;
                              const leftPct = Math.max(0, (sMin / total) * 100);
                              const widthPct = Math.min(100 - leftPct, ((eMin - sMin) / total) * 100);
                              return (
                                <div
                                  key={idx}
                                  className="bk-timeline-slot free"
                                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                />
                              );
                            })}

                            {selectedDay.busySlots.map((b, idx) => {
                              const [sh, sm] = b.startTime.split(':').map(Number);
                              const [eh, em] = b.endTime.split(':').map(Number);
                              const minStart = 480; const minEnd = 1260; const total = minEnd - minStart;
                              const sMin = sh * 60 + sm - minStart;
                              const eMin = eh * 60 + em - minStart;
                              const leftPct = Math.max(0, (sMin / total) * 100);
                              const widthPct = Math.min(100 - leftPct, ((eMin - sMin) / total) * 100);
                              return (
                                <div
                                  key={idx}
                                  className="bk-timeline-slot busy"
                                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                  title={`Bận: ${b.startTime} – ${b.endTime}`}
                                />
                              );
                            })}
                          </div>

                          <div className="bk-timeline-ticks">
                            {renderTimelineTicks()}
                          </div>
                        </div>
                      </div>

                      <div className="bk-timeline-legend">
                        <div className="bk-legend-item">
                          <div className="bk-legend-dot free" />
                          Lịch rảnh
                        </div>
                        <div className="bk-legend-item">
                          <div className="bk-legend-dot busy" />
                          Đã bận
                        </div>
                      </div>
                    </div>

                    {/* Step 3 & 4: Giờ bắt đầu & Thời lượng */}
                    <div className="bk-form-section">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div>
                          <div className="bk-section-label">
                            <span className="bk-section-num">3</span>
                            Giờ bắt đầu
                          </div>
                          <ClockPicker 
                            value={startTime} 
                            onChange={(val) => {
                              setStartTime(val);
                              setHasManuallySelectedTime(true);
                            }} 
                           />
                          <div className="bk-hint-text">
                            <i className="bi bi-info-circle" />
                            Đã gợi ý giờ trống sớm nhất
                          </div>
                        </div>

                        <div>
                          <div className="bk-section-label">
                            <span className="bk-section-num">4</span>
                            Thời lượng cuộc gọi
                          </div>
                          <div className="bk-duration-grid">
                            {[1, 20, 30, 40, 50, 60].map((mins) => (
                              <button
                                key={mins}
                                type="button"
                                onClick={() => setDuration(mins)}
                                className={`bk-dur-btn ${duration === mins ? 'selected' : ''}`}
                              >
                                {mins} phút
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Validation Banner */}
                    {(validationMsg.text || true) && (
                      <div className={`bk-validation-banner ${validationMsg.isValid ? 'valid' : 'invalid'}`}>
                        <i className={`bi ${validationMsg.isValid ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`} />
                        <span>{validationMsg.text || 'Đang xác thực thời gian...'}</span>
                      </div>
                    )}

                    {lockStatus && (
                      <div className={`bk-validation-banner ${lockStatus.locked ? 'valid' : 'invalid'}`} style={{ marginTop: 10, background: lockStatus.locked ? 'rgba(25, 135, 84, 0.15)' : 'rgba(239, 68, 68, 0.15)', borderColor: lockStatus.locked ? '#198754' : '#dc3545', color: lockStatus.locked ? '#2eb573' : '#ff4757' }}>
                        <i className={`bi ${lockStatus.locked ? 'bi-lock-fill' : 'bi-exclamation-circle-fill'}`} />
                        <span>{lockStatus.message}</span>
                      </div>
                    )}

                    {/* Summary Card */}
                    {validationMsg.isValid && (
                      <div className="bk-summary-card">
                        <i className="bi bi-calendar-check-fill bk-summary-icon" />
                        <div style={{ flex: 1 }}>
                          <div className="bk-summary-label">Cuộc hẹn của bạn</div>
                          <div className="bk-summary-time">
                            {startTime} – {getEndTimeString()}
                            <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.85, marginLeft: 8 }}>({duration} phút)</span>
                          </div>
                          <div className="bk-summary-date">
                            <i className="bi bi-geo-alt-fill" />
                            {formatFullDateVietnamese(selectedDay.date)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 4 }}>Chi phí dự kiến</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#dc3545' }}>
                            {(duration * 1000).toLocaleString('vi-VN')} đ
                          </div>
                          <div style={{ fontSize: 12, color: balance >= duration * 1000 ? '#198754' : '#dc3545', marginTop: 4 }}>
                            Số dư: {balance.toLocaleString('vi-VN')} đ
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Ghi chú */}
                    <div className="bk-form-section" style={{ marginBottom: 0 }}>
                      <div className="bk-section-label">
                        <span className="bk-section-num">5</span>
                        Ghi chú / Nội dung cần hỗ trợ
                      </div>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="bk-note-textarea"
                        rows={3}
                        placeholder="Nêu chi tiết nội dung hoặc dự án bạn muốn Mentor tư vấn để Mentor chuẩn bị tốt nhất..."
                        maxLength={500}
                        required
                      />
                      <div className="bk-note-count">{note.length}/500 ký tự</div>
                    </div>
                  </>
                )}

                {/* Footer */}
                <div className="bk-modal-footer" style={{ marginTop: 20, padding: '16px 0 0', background: 'transparent', border: 'none', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ flex: 1 }}>
                    {balance < duration * 1000 && (
                      <span style={{ color: '#dc3545', fontSize: 13, fontWeight: 600 }}>
                        <i className="bi bi-exclamation-circle-fill" style={{ marginRight: 6 }} />
                        Số dư không đủ. Cần thêm {((duration * 1000) - balance).toLocaleString('vi-VN')} đ.
                      </span>
                    )}
                  </div>
                  <button type="button" className="bk-btn-cancel" onClick={onClose}>
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !selectedDay || !validationMsg.isValid || balance < duration * 1000}
                    className="bk-btn-submit"
                  >
                    {submitting ? (
                      <>
                        <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'bk-spin 0.7s linear infinite' }} />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-calendar-check-fill" />
                        Xác nhận đặt lịch
                      </>
                    )}
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
