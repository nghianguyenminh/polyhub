'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI } from '@/lib/api';
import Header from '@/components/layout/Header';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import dynamic from 'next/dynamic';
import ClockPicker from '@/components/common/ClockPicker';
import RatingModal from '@/components/common/RatingModal';
import '@/styles/bookings.css';

const VideoCallRoom = dynamic(() => import('@/components/chat/VideoCallRoom'), {
  ssr: false,
});

interface Booking {
  id: number;
  mentor: { username: string; fullname: string; avatar: string; email: string; major: string };
  student: { username: string; fullname: string; avatar: string; email: string; major: string };
  bookingDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  note: string;
  roomId?: string;
  rejectionReason?: string;
  mentorJoined?: boolean;
  studentJoined?: boolean;
  startedAt?: string;
  createdAt: string;
}

interface ScheduleSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'student' | 'mentor-bookings' | 'mentor-schedule'>('student');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Real-time ticking clock for countdowns
  const [now, setNow] = useState<Date>(new Date());

  // Call video states
  const [activeCallRoomId, setActiveCallRoomId] = useState<string | null>(null);
  const [selectedBookingForCall, setSelectedBookingForCall] = useState<Booking | null>(null);
  
  // Rating Modal state
  const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);

  // Mentor availability config states
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('11:00');
  const [activeScheduleDay, setActiveScheduleDay] = useState<number>(2);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Rejection modal states
  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingRejection, setSubmittingRejection] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      setActiveTab(user.role === 'MENTOR' ? 'mentor-bookings' : 'student');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      if (activeTab === 'student') loadStudentBookings();
      else if (activeTab === 'mentor-bookings') loadMentorBookings();
      else if (activeTab === 'mentor-schedule') loadMentorSchedule();
    }
  }, [activeTab, user]);

  const loadStudentBookings = async () => {
    setLoadingBookings(true);
    setErrorMsg('');
    try {
      const data = await fetchAPI('/api/bookings/student');
      const sorted = (data || []).sort((a: Booking, b: Booking) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setBookings(sorted);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi tải danh sách đặt lịch');
    } finally {
      setLoadingBookings(false);
    }
  };

  const loadMentorBookings = async () => {
    setLoadingBookings(true);
    setErrorMsg('');
    try {
      const data = await fetchAPI('/api/bookings/mentor');
      const sorted = (data || []).sort((a: Booking, b: Booking) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setBookings(sorted);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi tải danh sách đặt lịch');
    } finally {
      setLoadingBookings(false);
    }
  };

  const loadMentorSchedule = async () => {
    setLoadingBookings(true);
    setErrorMsg('');
    try {
      const data = await fetchAPI('/api/mentor/schedule');
      const slots: ScheduleSlot[] = data || [];
      setScheduleSlots(slots);
      const days = Array.from(new Set(slots.map(s => s.dayOfWeek)));
      setSelectedDays(days);
      setActiveScheduleDay(days.length > 0 ? days[0] : 2);
      setIsDirty(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi tải cấu hình lịch rảnh');
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleCancelBooking = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;
    setErrorMsg('');
    try {
      await fetchAPI(`/api/bookings/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      setSuccessMsg('Đã hủy lịch hẹn thành công.');
      setTimeout(() => setSuccessMsg(''), 3000);
      activeTab === 'student' ? loadStudentBookings() : loadMentorBookings();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi hủy lịch hẹn');
    }
  };

  const handleApproveBooking = async (id: number) => {
    setErrorMsg('');
    try {
      await fetchAPI(`/api/bookings/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      setSuccessMsg('Đã phê duyệt lịch hẹn. Hệ thống đã gửi email và thông báo đến sinh viên.');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadMentorBookings();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi phê duyệt lịch hẹn');
    }
  };

  const handleOpenRejectModal = (booking: Booking) => {
    setRejectingBooking(booking);
    setRejectionReason('');
    setErrorMsg('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingBooking) return;
    setSubmittingRejection(true);
    setErrorMsg('');
    try {
      await fetchAPI(`/api/bookings/${rejectingBooking.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'REJECTED',
          reason: rejectionReason || 'Mentor không sắp xếp được thời gian',
        }),
      });
      setSuccessMsg('Đã từ chối lịch hẹn và gửi thông báo đến sinh viên.');
      setTimeout(() => setSuccessMsg(''), 3000);
      setRejectingBooking(null);
      loadMentorBookings();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi từ chối lịch hẹn');
    } finally {
      setSubmittingRejection(false);
    }
  };

  const handleJoinCall = async (booking: Booking) => {
    try {
      const updatedBooking = await fetchAPI(`/api/bookings/${booking.id}/join`, { method: 'POST' });
      setSelectedBookingForCall(updatedBooking);
      setActiveCallRoomId(updatedBooking.roomId || `booking_${updatedBooking.id}`);
    } catch (err: any) {
      alert(err.message || 'Không thể tham gia cuộc gọi vào lúc này.');
    }
  };

  const handleToggleDay = (day: number) => {
    setIsDirty(true);
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
      setScheduleSlots(scheduleSlots.filter(s => s.dayOfWeek !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
      setActiveScheduleDay(day);
    }
  };

  const handleAddSlot = () => {
    if (!newSlotStart || !newSlotEnd) return;
    const [sh, sm] = newSlotStart.split(':').map(Number);
    const [eh, em] = newSlotEnd.split(':').map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      alert('Thời gian bắt đầu phải trước thời gian kết thúc.');
      return;
    }
    const daySlots = scheduleSlots.filter(s => s.dayOfWeek === activeScheduleDay);
    const newStartMin = sh * 60 + sm;
    const newEndMin = eh * 60 + em;
    for (const slot of daySlots) {
      const [slotSh, slotSm] = slot.startTime.split(':').map(Number);
      const [slotEh, slotEm] = slot.endTime.split(':').map(Number);
      const startMin = slotSh * 60 + slotSm;
      const endMin = slotEh * 60 + slotEm;
      if (newStartMin < endMin && newEndMin > startMin) {
        alert('Khung giờ rảnh bị đè lên khung giờ rảnh khác của ngày hôm nay.');
        return;
      }
    }
    const newSlot: ScheduleSlot = { dayOfWeek: activeScheduleDay, startTime: newSlotStart, endTime: newSlotEnd };
    setScheduleSlots([...scheduleSlots, newSlot].sort((a, b) => a.startTime.localeCompare(b.startTime)));
    setIsDirty(true);
  };

  const handleRemoveSlot = (index: number) => {
    setScheduleSlots(scheduleSlots.filter((_, idx) => idx !== index));
    setIsDirty(true);
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const filteredSlots = scheduleSlots.filter(s => selectedDays.includes(s.dayOfWeek));
      await fetchAPI('/api/mentor/schedule', {
        method: 'POST',
        body: JSON.stringify(filteredSlots),
      });
      setSuccessMsg('Lưu cấu hình lịch rảnh thành công!');
      setIsDirty(false);
      setTimeout(() => setSuccessMsg(''), 3000);
      loadMentorSchedule();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lưu cấu hình thất bại');
    } finally {
      setSavingSchedule(false);
    }
  };

  const getDayLabel = (day: number) => day === 8 ? 'Chủ Nhật' : `Thứ ${day}`;

  const getStatusInfo = (status: string): { cls: string; text: string; icon: string } => {
    switch (status.toUpperCase()) {
      case 'APPROVED':  return { cls: 'approved',  text: 'Đã phê duyệt',    icon: 'bi-check-circle-fill' };
      case 'PENDING':   return { cls: 'pending',   text: 'Chờ phê duyệt',   icon: 'bi-hourglass-split' };
      case 'REJECTED':  return { cls: 'rejected',  text: 'Đã từ chối',      icon: 'bi-x-circle-fill' };
      case 'CANCELLED': return { cls: 'cancelled', text: 'Đã hủy',          icon: 'bi-slash-circle' };
      case 'CLOSED':    return { cls: 'closed',    text: 'Đã kết thúc',     icon: 'bi-flag-fill' };
      default:          return { cls: 'cancelled', text: status,             icon: 'bi-circle' };
    }
  };

  const getCountdownStatus = (booking: Booking) => {
    if (booking.status !== 'APPROVED') return { text: '', isJoinable: false, isClosed: false };

    const startDateTime = new Date(`${booking.bookingDate}T${booking.startTime}`);
    const limitDateTime = new Date(startDateTime.getTime() + 10 * 60 * 1000);
    const diff = startDateTime.getTime() - now.getTime();

    if (diff > 0) {
      const totalSecs = Math.floor(diff / 1000);
      const hrs = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      if (hrs >= 24) {
        const days = Math.floor(hrs / 24);
        return { text: `Bắt đầu sau ${days} ngày`, isJoinable: false, isClosed: false };
      }
      const hStr = String(hrs).padStart(2, '0');
      const mStr = String(mins).padStart(2, '0');
      const sStr = String(secs).padStart(2, '0');
      return { text: `Bắt đầu sau ${hStr}:${mStr}:${sStr}`, isJoinable: false, isClosed: false };
    } else {
      if (booking.startedAt != null) {
        const actualEnd = new Date(new Date(booking.startedAt).getTime() + booking.duration * 60 * 1000);
        if (now.getTime() > actualEnd.getTime()) {
          return { text: 'Cuộc gọi đã hết thời lượng', isJoinable: false, isClosed: true };
        }
        return { text: 'Cuộc gọi đang diễn ra', isJoinable: true, isClosed: false };
      } else {
        if (now.getTime() > limitDateTime.getTime()) {
          return { text: 'Đã đóng do quá 10 phút không tham gia', isJoinable: false, isClosed: true };
        }
        return { text: 'Bắt đầu ngay · Vào phòng call!', isJoinable: true, isClosed: false };
      }
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="bk-spinner" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="app-container">
        <main className="w-100 d-flex justify-content-between">
          <LeftSidebar activeMenu="bookings" />

          <div className="poly-main-feed flex-grow-1 mx-4" style={{ maxWidth: '850px', minWidth: '0' }}>

            {/* Page Header */}
            <div className="bkp-header">
              <h4 className="bkp-header-title">
                <span className="bkp-header-icon">
                  <i className="bi bi-camera-video-fill" />
                </span>
                Quản lý Lịch hẹn Call Video
              </h4>
              <p className="bkp-header-sub">
                Đọc thông báo hệ thống, theo dõi đếm ngược và tham gia cuộc gọi video trực tiếp.
              </p>
            </div>

            {/* Notifications */}
            {successMsg && (
              <div className="bkp-alert success">
                <i className="bi bi-check-circle-fill" /> {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="bkp-alert danger">
                <i className="bi bi-exclamation-triangle-fill" /> {errorMsg}
              </div>
            )}

            {/* Tab Navigation */}
            <div className="bkp-tabs">
              <button
                className={`bkp-tab ${activeTab === 'student' ? 'active' : ''}`}
                onClick={() => setActiveTab('student')}
              >
                <i className="bi bi-person" />
                Lịch hẹn của tôi
              </button>

              {user?.role === 'MENTOR' && (
                <>
                  <button
                    className={`bkp-tab ${activeTab === 'mentor-bookings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mentor-bookings')}
                  >
                    <i className="bi bi-person-workspace" />
                    Yêu cầu đặt lịch
                  </button>
                  <button
                    className={`bkp-tab ${activeTab === 'mentor-schedule' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mentor-schedule')}
                  >
                    <i className="bi bi-gear-fill" />
                    Cài đặt lịch rảnh
                  </button>
                </>
              )}
            </div>

            {/* ═══════════════════════════════════════
                BOOKINGS LIST TAB
            ═══════════════════════════════════════ */}
            {activeTab !== 'mentor-schedule' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
                {loadingBookings ? (
                  <div className="bk-loading" style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(0,0,0,0.05)' }}>
                    <div className="bk-spinner" />
                    <span className="bk-loading-text">Đang tải...</span>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="bkp-empty">
                    <i className="bi bi-calendar-x bkp-empty-icon" />
                    <div className="bkp-empty-title">Chưa có lịch hẹn nào</div>
                    <p className="bkp-empty-sub">
                      {activeTab === 'student'
                        ? 'Hãy tìm Mentor phù hợp và đặt lịch ngay!'
                        : 'Sinh viên chưa gửi yêu cầu đặt lịch nào.'}
                    </p>
                  </div>
                ) : (
                  bookings.map((booking, index) => {
                    const isStudentView = activeTab === 'student';
                    const targetUser = isStudentView ? booking.mentor : booking.student;
                    const dateObj = new Date(booking.bookingDate);
                    const formattedDate = dateObj.toLocaleDateString('vi-VN', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    });
                    const cdt = getCountdownStatus(booking);
                    const statusInfo = getStatusInfo(booking.status);

                    return (
                      <div
                        key={booking.id}
                        className={`bkp-card status-${booking.status.toLowerCase()}`}
                        style={{ animationDelay: `${index * 0.06}s` }}
                      >
                        {/* Card Header */}
                        <div className="bkp-card-header">
                          <div className="bkp-card-left">
                            <div className="bkp-avatar-wrap">
                              <img
                                src={targetUser?.avatar && targetUser.avatar !== 'default.png'
                                  ? targetUser.avatar
                                  : `https://ui-avatars.com/api/?name=${targetUser?.fullname || 'User'}&background=random`}
                                className="bkp-avatar"
                                alt="avatar"
                              />
                              <div className={`bkp-avatar-status ${
                                booking.status === 'APPROVED' ? 'online'
                                : booking.status === 'PENDING' ? 'pending'
                                : 'offline'
                              }`} />
                            </div>
                            <div className="bkp-card-info">
                              <p className="bkp-card-name">{targetUser?.fullname}</p>
                              <p className="bkp-card-role">
                                <i className="bi bi-briefcase" />
                                {isStudentView
                                  ? `Mentor · ${targetUser?.major || 'Đang cập nhật'}`
                                  : `Sinh viên · ${targetUser?.major || 'Đang cập nhật'}`}
                              </p>
                              <div className="bkp-card-time">
                                <i className="bi bi-clock-fill" />
                                {booking.startTime} – {booking.endTime}
                                <span style={{ color: '#9ca3af', fontWeight: 400 }}>({booking.duration} phút)</span>
                                <span style={{ color: '#9ca3af' }}>·</span>
                                <span style={{ fontWeight: 500, color: '#6c757d' }}>{formattedDate}</span>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div>
                            <span className={`bkp-status ${statusInfo.cls}`}>
                              <i className={`bi ${statusInfo.icon}`} />
                              {statusInfo.text}
                            </span>
                          </div>
                        </div>

                        {/* Countdown Strip */}
                        {booking.status === 'APPROVED' && (
                          <div className={`bkp-countdown ${
                            cdt.isClosed ? 'closed' : cdt.isJoinable ? 'joinable' : 'waiting'
                          }`}>
                            <i className={`bi ${
                              cdt.isClosed ? 'bi-x-circle-fill' :
                              cdt.isJoinable ? 'bi-broadcast-pin' :
                              'bi-hourglass-split'
                            }`} />
                            {cdt.text}
                          </div>
                        )}

                        {/* Notes & Reasons */}
                        {booking.note && (
                          <div className="bkp-note">
                            <strong>Ghi chú: </strong>{booking.note}
                          </div>
                        )}
                        {booking.status === 'REJECTED' && booking.rejectionReason && (
                          <div className="bkp-rejection">
                            <strong>Lý do từ chối: </strong>{booking.rejectionReason}
                          </div>
                        )}
                        {booking.status === 'CLOSED' && booking.rejectionReason && (
                          <div className="bkp-closed-reason">
                            <strong>Chi tiết đóng lịch: </strong>{booking.rejectionReason}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="bkp-actions">
                          {booking.status === 'APPROVED' && (
                            <button
                              onClick={() => handleJoinCall(booking)}
                              disabled={!cdt.isJoinable || cdt.isClosed}
                              className="bkp-btn-join"
                            >
                              <i className="bi bi-camera-video-fill" />
                              Tham gia Call Video
                            </button>
                          )}

                          {isStudentView ? (
                            (booking.status === 'PENDING' || booking.status === 'APPROVED') && !cdt.isClosed && (
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                className="bkp-btn-cancel"
                              >
                                <i className="bi bi-x-circle me-1" />
                                Hủy lịch
                              </button>
                            )
                          ) : (
                            booking.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleApproveBooking(booking.id)}
                                  className="bkp-btn-approve"
                                >
                                  <i className="bi bi-check-circle-fill" />
                                  Phê duyệt
                                </button>
                                <button
                                  onClick={() => handleOpenRejectModal(booking)}
                                  className="bkp-btn-reject"
                                >
                                  <i className="bi bi-x-circle me-1" />
                                  Từ chối
                                </button>
                              </>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* ═══════════════════════════════════════
                 MENTOR SCHEDULE TAB
              ═══════════════════════════════════════ */
              <div className="sch-card" style={{ marginBottom: 40 }}>
                <h5 className="sch-title">
                  <span className="bkp-header-icon" style={{ width: 32, height: 32, fontSize: 14 }}>
                    <i className="bi bi-calendar3" />
                  </span>
                  Thiết lập Lịch rảnh hàng tuần
                </h5>
                <p className="sch-sub">
                  Chọn các ngày bạn rảnh trong tuần và cấu hình khung giờ rảnh để sinh viên có thể đặt lịch hẹn. Bạn có thể thiết lập nhiều khung giờ khác nhau trong cùng một ngày.
                </p>

                {/* Step 1: Chọn ngày */}
                <div className="sch-step-label">
                  <span className="sch-step-badge">1</span>
                  Chọn ngày bạn rảnh trong tuần
                </div>
                <div className="sch-day-grid">
                  {[2, 3, 4, 5, 6, 7, 8].map((day) => {
                    const isActive = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`sch-day-toggle ${isActive ? 'active' : ''}`}
                      >
                        {isActive
                          ? <i className="bi bi-check-circle-fill" />
                          : <i className="bi bi-circle" />
                        }
                        {day === 8 ? 'Chủ Nhật' : `Thứ ${day}`}
                      </button>
                    );
                  })}
                </div>

                {/* Step 2: Cài đặt khung giờ */}
                <div className="sch-step-label">
                  <span className="sch-step-badge">2</span>
                  Cài đặt khung giờ rảnh cho từng ngày
                </div>

                {selectedDays.length > 0 ? (
                  <div>
                    {/* Day Tabs */}
                    <div className="sch-day-tabs">
                      {selectedDays.sort((a,b) => a - b).map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setActiveScheduleDay(day)}
                          className={`sch-day-tab ${activeScheduleDay === day ? 'active' : ''}`}
                        >
                          {getDayLabel(day)}
                        </button>
                      ))}
                    </div>

                    {/* Slots for active day */}
                    <div className="sch-slot-list">
                      {scheduleSlots.filter(s => s.dayOfWeek === activeScheduleDay).length === 0 ? (
                        <div className="sch-empty-slots">
                          <i className="bi bi-clock" />
                          Chưa có khung giờ. Hãy thêm ở bên dưới.
                        </div>
                      ) : (
                        scheduleSlots.map((slot, idx) => {
                          if (slot.dayOfWeek !== activeScheduleDay) return null;
                          return (
                            <div key={idx} className="sch-slot-item">
                              <div className="sch-slot-time">
                                <i className="bi bi-clock-fill" />
                                {slot.startTime} – {slot.endTime}
                                <span style={{ fontSize: 12, color: '#6c757d', fontWeight: 400, marginLeft: 4 }}>
                                  ({Math.round(
                                    (parseInt(slot.endTime.split(':')[0]) * 60 + parseInt(slot.endTime.split(':')[1])) -
                                    (parseInt(slot.startTime.split(':')[0]) * 60 + parseInt(slot.startTime.split(':')[1]))
                                  )} phút)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveSlot(scheduleSlots.indexOf(slot))}
                                className="sch-slot-del"
                                title="Xóa khung giờ này"
                              >
                                <i className="bi bi-trash3-fill" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Add slot form */}
                    <div className="sch-add-form">
                      <div className="sch-add-title">
                        <i className="bi bi-plus-circle-fill" style={{ color: '#F27125' }} />
                        Thêm khung giờ rảnh mới
                      </div>
                      <div className="sch-time-row">
                        <div className="sch-time-field">
                          <label className="sch-time-label">Bắt đầu</label>
                          <ClockPicker
                            value={newSlotStart}
                            onChange={setNewSlotStart}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', color: '#9ca3af', fontWeight: 700, fontSize: 18, paddingBottom: 2 }}>–</div>
                        <div className="sch-time-field">
                          <label className="sch-time-label">Kết thúc</label>
                          <ClockPicker
                            value={newSlotEnd}
                            onChange={setNewSlotEnd}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddSlot}
                          className="sch-add-btn"
                        >
                          <i className="bi bi-plus-lg" />
                          Thêm
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="sch-alert">
                    <i className="bi bi-info-circle-fill" />
                    Vui lòng chọn ít nhất 1 ngày rảnh ở Bước 1 để bắt đầu cấu hình khung giờ.
                  </div>
                )}

                {/* Save Button */}
                <div className="sch-save-wrap">
                  {isDirty && (
                    <div className="sch-dirty-warning">
                      <i className="bi bi-exclamation-triangle-fill" />
                      Bạn có thay đổi chưa lưu. Hãy nhấn "Lưu cấu hình" để cập nhật vào hệ thống.
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveSchedule}
                    disabled={savingSchedule}
                    className="sch-save-btn"
                  >
                    {savingSchedule ? (
                      <>
                        <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'bk-spin 0.7s linear infinite' }} />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-floppy-fill" />
                        Lưu cấu hình
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
          <RightSidebar />
        </main>
      </div>

      {/* ═══════════════════════════════════════
          REJECT MODAL
      ═══════════════════════════════════════ */}
      {rejectingBooking && (
        <div
          className="bkp-reject-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setRejectingBooking(null); }}
        >
          <div className="bkp-reject-modal">
            <div className="bkp-reject-header">
              <div className="bkp-reject-title">
                <i className="bi bi-x-circle-fill" />
                Từ chối yêu cầu đặt lịch
              </div>
              <button
                className="bkp-reject-close"
                onClick={() => setRejectingBooking(null)}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="bkp-reject-body">
              <p className="bkp-reject-desc">
                Vui lòng cung cấp lý do từ chối yêu cầu của sinh viên{' '}
                <strong>{rejectingBooking.student.fullname}</strong>. Sinh viên sẽ nhận được email và thông báo hệ thống kèm lý do này.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="bkp-reject-textarea"
                rows={4}
                placeholder="Ví dụ: Tôi có lịch họp đột xuất, bạn có thể hẹn vào khung giờ khác được không..."
              />
            </div>
            <div className="bkp-reject-footer">
              <button
                className="bkp-reject-cancel"
                onClick={() => setRejectingBooking(null)}
              >
                Hủy
              </button>
              <button
                disabled={submittingRejection}
                onClick={handleConfirmReject}
                className="bkp-reject-confirm"
              >
                {submittingRejection ? (
                  <>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'bk-spin 0.7s linear infinite' }} />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="bi bi-x-circle-fill" />
                    Xác nhận từ chối
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Room */}
      {activeCallRoomId && user && selectedBookingForCall && (
        <VideoCallRoom
          roomId={activeCallRoomId}
          user={{ username: user.username, fullname: user.fullname }}
          onLeaveRoom={() => {
            setActiveCallRoomId(null);
            if (activeTab === 'student') {
              setRatingBooking(selectedBookingForCall);
            }
            setSelectedBookingForCall(null);
            activeTab === 'student' ? loadStudentBookings() : loadMentorBookings();
          }}
          bookingId={selectedBookingForCall.id}
          duration={selectedBookingForCall.duration}
          startedAt={selectedBookingForCall.startedAt || new Date().toISOString()}
        />
      )}
      
      {ratingBooking && (
        <RatingModal
          bookingId={ratingBooking.id}
          mentorName={ratingBooking.mentor?.fullname || 'Mentor'}
          onClose={() => setRatingBooking(null)}
        />
      )}
    </>
  );
}
