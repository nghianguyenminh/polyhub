'use client';

import React, { useState, useEffect, useRef } from 'react';
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

  // Zoom state (timeline)
  const [zoom, setZoom] = useState<number>(1);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Validation feedback
  const [validationMsg, setValidationMsg] = useState({ text: '', isValid: false });

  // Native wheel event binding to allow preventDefault (React passive listener bypass)
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const container = el.parentElement;
      if (!container) return;

      // Calculate mouse position relative to container and scrollable content
      const rect = container.getBoundingClientRect();
      const mouseXInContainer = e.clientX - rect.left;
      const mouseXInContent = mouseXInContainer + container.scrollLeft;

      const oldZoom = zoom;
      let newZoom = oldZoom;

      if (e.deltaY < 0) {
        // Scroll up -> Zoom in
        newZoom = Math.min(oldZoom + 0.5, 5);
      } else {
        // Scroll down -> Zoom out
        newZoom = Math.max(oldZoom - 0.5, 1);
      }

      if (newZoom !== oldZoom) {
        setZoom(newZoom);

        // Calculate new scroll position to center zoom on mouse cursor
        const ratio = newZoom / oldZoom;
        const newMouseXInContent = mouseXInContent * ratio;
        const newScrollLeft = newMouseXInContent - mouseXInContainer;

        // Apply scroll offset instantly on the next frame to match the layout update
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
    }
  }, [isOpen, mentor]);

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

  // Helper: Find earliest available start time
  const getEarliestAvailableTime = (day: DayAvailability, dur: number): string | null => {
    if (!day || day.slots.length === 0) return null;

    const todayStr = new Date().toLocaleDateString('en-CA');
    const isToday = day.date === todayStr;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Standard business hours: loop through slots
    for (const slot of day.slots) {
      const [slotSh, slotSm] = slot.startTime.split(':').map(Number);
      const [slotEh, slotEm] = slot.endTime.split(':').map(Number);
      const slotStartMin = slotSh * 60 + slotSm;
      const slotEndMin = slotEh * 60 + slotEm;

      // If today, only allow search from current local time + 5 minutes
      const searchStartMin = isToday ? Math.max(slotStartMin, currentMinutes + 5) : slotStartMin;

      // Try times in 5-minute increments
      for (let timeMin = searchStartMin; timeMin + dur <= slotEndMin; timeMin += 5) {
        const testEndMin = timeMin + dur;
        let isOverlap = false;

        // Check against busy slots
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

  // Automatically suggest earliest available slot when day or duration changes
  useEffect(() => {
    if (selectedDay) {
      const suggested = getEarliestAvailableTime(selectedDay, duration);
      if (suggested) {
        setStartTime(suggested);
        setError('');
      } else {
        setValidationMsg({ text: 'Ngày được chọn đã bận hoàn toàn hoặc không còn giờ rảnh khả dụng trong hôm nay.', isValid: false });
      }
    }
  }, [selectedDay, duration]);

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

      // 0. Check if selected time is in the past for today
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

      // 1. Check if inside scheduled range
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

      // 2. Check for overlaps
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
        text: `Thời gian chọn hợp lệ: ${startTime} - ${endTimeStr}`,
        isValid: true
      });

    } catch (e) {
      setValidationMsg({ text: 'Thời gian nhập không hợp lệ.', isValid: false });
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

  const formatFullDateVietnamese = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${dayNames[d.getDay()]}, Ngày ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const getEndTimeString = () => {
    if (!startTime) return '';
    const [sh, sm] = startTime.split(':').map(Number);
    const endMinutes = sh * 60 + sm + duration;
    const eh = Math.floor(endMinutes / 60);
    const em = endMinutes % 60;
    return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
  };

  // Render scale ticks for zoomable timeline
  const renderTimelineTicks = () => {
    const ticks = [];
    const minStart = 480;  // 08:00
    const minEnd = 1260;   // 21:00
    const totalMins = minEnd - minStart;

    // Define tick intervals based on zoom level
    let interval = 60; // default 60 minutes
    if (zoom >= 4.5) {
      interval = 10;
    } else if (zoom >= 3) {
      interval = 30;
    }

    for (let time = minStart; time <= minEnd; time += interval) {
      const pct = ((time - minStart) / totalMins) * 100;
      const h = Math.floor(time / 60);
      const m = time % 60;
      const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      ticks.push(
        <div key={time} className="position-absolute d-flex flex-column align-items-center" style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}>
          <div style={{ width: '1px', height: '6px', backgroundColor: '#a1a8b3', marginBottom: '2px' }}></div>
          <span style={{ fontSize: '9px', color: '#6c757d', fontWeight: 500 }}>{label}</span>
        </div>
      );
    }
    return ticks;
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block animate-fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex={-1}>
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
          <div className="modal-body p-4 bg-light text-dark" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
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
                    {/* 2. Biểu đồ lịch rảnh/bận có ZOOM cuộn chuột */}
                    <div className="mb-4 bg-white p-3 rounded-3 border shadow-sm">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="fw-bold text-secondary" style={{ fontSize: '14px' }}>
                          2. Biểu đồ lịch rảnh/bận trong ngày:
                        </label>
                        <span className="badge bg-poly-soft text-poly border border-opacity-10 fs-8">
                          <i className="bi bi-mouse me-1"></i> Cuộn chuột để Zoom ({zoom.toFixed(1)}x)
                        </span>
                      </div>

                      <div className="mb-2 d-flex flex-wrap gap-2">
                        <span className="text-muted fs-8 me-1">Khung rảnh:</span>
                        {selectedDay.slots.map((s, idx) => (
                          <span key={idx} className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-20 fs-8 px-2 py-1">
                            <i className="bi bi-clock me-1"></i> {s.startTime} - {s.endTime}
                          </span>
                        ))}
                      </div>

                      <div className="mb-3 d-flex flex-wrap gap-2">
                        <span className="text-muted fs-8 me-1">Lịch bận:</span>
                        {selectedDay.busySlots.length === 0 ? (
                          <span className="text-success fs-8 fw-medium"><i className="bi bi-check-circle-fill me-1"></i>Mentor trống lịch cả ngày</span>
                        ) : (
                          selectedDay.busySlots.map((b, idx) => (
                            <span key={idx} className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20 fs-8 px-2 py-1">
                              <i className="bi bi-x-circle me-1"></i> {b.startTime} - {b.endTime} ({b.status === 'PENDING' ? 'Chờ duyệt' : 'Đã đặt'})
                            </span>
                          ))
                        )}
                      </div>

                      {/* Timeline Wrapper with Horizontal Scroll */}
                      <div 
                        className="position-relative border rounded p-2 bg-light overflow-x-auto" 
                        style={{ height: '110px' }}
                      >
                        {/* Zoomable timeline element */}
                        <div 
                          ref={timelineRef}
                          className="position-relative h-100" 
                          style={{ 
                            width: `${100 * zoom}%`, 
                            minWidth: '100%',
                            height: '50px',
                            cursor: 'zoom-in'
                          }}
                        >
                          {/* Base Progress Bar */}
                          <div className="progress w-100" style={{ height: '24px', borderRadius: '6px', backgroundColor: '#e9ecef', position: 'relative', marginTop: '10px' }}>
                            
                            {/* Available Slots */}
                            {selectedDay.slots.map((s, idx) => {
                              const [sh, sm] = s.startTime.split(':').map(Number);
                              const [eh, em] = s.endTime.split(':').map(Number);
                              const minStart = 480;  // 08:00
                              const minEnd = 1260;   // 21:00
                              const total = minEnd - minStart;
                              
                              const sMin = sh * 60 + sm - minStart;
                              const eMin = eh * 60 + em - minStart;
                              
                              const leftPct = Math.max(0, (sMin / total) * 100);
                              const widthPct = Math.min(100 - leftPct, ((eMin - sMin) / total) * 100);

                              return (
                                <div
                                  key={idx}
                                  className="progress-bar bg-success bg-opacity-25 border border-success border-opacity-50"
                                  style={{
                                    position: 'absolute',
                                    left: `${leftPct}%`,
                                    width: `${widthPct}%`,
                                    height: '24px',
                                    zIndex: 1
                                  }}
                                />
                              );
                            })}
                            
                            {/* Busy Slots */}
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
                                  className="progress-bar bg-danger bg-opacity-50 border border-danger border-opacity-75"
                                  style={{
                                    position: 'absolute',
                                    left: `${leftPct}%`,
                                    width: `${widthPct}%`,
                                    height: '24px',
                                    zIndex: 3
                                  }}
                                  title={`Bận: ${b.startTime} - ${b.endTime}`}
                                />
                              );
                            })}
                          </div>

                          {/* Render Scale ticks below bar */}
                          <div className="position-relative w-100" style={{ height: '20px', marginTop: '10px' }}>
                            {renderTimelineTicks()}
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-3 mt-2 text-muted" style={{ fontSize: '11px' }}>
                        <div className="d-flex align-items-center gap-1">
                          <span className="d-inline-block rounded" style={{ width: '12px', height: '12px', backgroundColor: 'rgba(25, 135, 84, 0.25)', border: '1px solid rgba(25, 135, 84, 0.5)' }}></span> Lịch rảnh
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <span className="d-inline-block rounded" style={{ width: '12px', height: '12px', backgroundColor: 'rgba(220, 53, 69, 0.5)', border: '1px solid rgba(220, 53, 69, 0.75)' }}></span> Đã bận
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
                          <span className="input-group-text bg-white" style={{ borderColor: startTime ? (validationMsg.isValid ? '#198754' : '#dc3545') : undefined, transition: 'border-color 0.15s' }}><i className="bi bi-clock-fill text-muted"></i></span>
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className={`form-control bg-white shadow-none ${startTime ? (validationMsg.isValid ? 'is-valid' : 'is-invalid') : ''}`}
                            style={{
                              borderColor: startTime ? (validationMsg.isValid ? '#198754' : '#dc3545') : undefined,
                              boxShadow: startTime ? (validationMsg.isValid ? '0 0 0 0.15rem rgba(25, 135, 84, 0.15)' : '0 0 0 0.15rem rgba(220, 53, 69, 0.15)') : undefined,
                              transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                            }}
                            required
                          />
                        </div>
                        <small className="text-muted mt-1 d-block fs-8"><i className="bi bi-info-circle me-1"></i>Hệ thống đã tự gợi ý giờ trống khả dụng sớm nhất.</small>
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
                    <div className="mb-3">
                      <div 
                        className={`alert py-2 px-3 rounded-3 d-flex align-items-center fs-7 ${validationMsg.isValid ? 'alert-success text-success' : 'alert-warning text-warning'}`}
                        style={{ border: 'none', backgroundColor: validationMsg.isValid ? '#d1e7dd' : '#fff3cd' }}
                      >
                        <i className={`bi ${validationMsg.isValid ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2 fs-6`}></i>
                        <span>{validationMsg.text || 'Đang xác thực thời gian...'}</span>
                      </div>
                    </div>

                    {/* Tóm tắt khung giờ chọn (Selected slot Summary) */}
                    {validationMsg.isValid && (
                      <div className="mb-4 p-3 rounded-3 text-white shadow-sm border-0 d-flex align-items-center gap-3" style={{ background: 'linear-gradient(135deg, #F27125, #FF8E4F)' }}>
                        <i className="bi bi-clock-history fs-3"></i>
                        <div>
                          <div className="fw-bold fs-7">Bạn đã chọn cuộc hẹn:</div>
                          <div className="fs-6 fw-bold mt-1">
                            {startTime} - {getEndTimeString()} ({duration} phút)
                          </div>
                          <div className="fs-8 mt-1 opacity-90">
                            <i className="bi bi-calendar-check me-1"></i> {formatFullDateVietnamese(selectedDay.date)}
                          </div>
                        </div>
                      </div>
                    )}

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
