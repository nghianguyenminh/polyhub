'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI } from '@/lib/api';
import Header from '@/components/layout/Header';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import dynamic from 'next/dynamic';
import ClockPicker from '@/components/common/ClockPicker';
import CustomDatePicker from '@/components/common/CustomDatePicker';
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
  specificDate?: string;
  expireDate?: string;
}

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'student' | 'mentor-bookings' | 'mentor-schedule'>('student');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Table filters & pagination
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Real-time ticking clock for countdowns
  const [now, setNow] = useState<Date>(new Date());

  // Call video states
  const [activeCallRoomId, setActiveCallRoomId] = useState<string | null>(null);
  const [selectedBookingForCall, setSelectedBookingForCall] = useState<Booking | null>(null);
  
  // Rating Modal state
  const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);

  // Mentor availability config states (Google Calendar Style)
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Form states for adding new event/slot
  const [slotType, setSlotType] = useState<'ONCE' | 'WEEKLY'>('ONCE');
  const [slotDate, setSlotDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slotDayOfWeek, setSlotDayOfWeek] = useState<number>(2);
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('11:00');
  const [expiryPreset, setExpiryPreset] = useState<'FOREVER' | '1_WEEK' | '2_WEEKS' | 'CUSTOM'>('FOREVER');
  const [slotExpiryDate, setSlotExpiryDate] = useState('');

  // Mentor vacation/busy states
  const [busyType, setBusyType] = useState<'EMERGENCY' | 'PLANNED'>('EMERGENCY');
  const [busyStartDate, setBusyStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [busyEndDate, setBusyEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [busyStartTime, setBusyStartTime] = useState('09:00');
  const [busyEndTime, setBusyEndTime] = useState('17:00');
  const [busyReason, setBusyReason] = useState('');
  const [busyError, setBusyError] = useState('');
  const [busySuccess, setBusySuccess] = useState('');
  const [submittingBusy, setSubmittingBusy] = useState(false);

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

  const handleDeleteBooking = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa lịch hẹn này vĩnh viễn?')) return;
    setErrorMsg('');
    try {
      await fetchAPI(`/api/bookings/${id}`, { method: 'DELETE' });
      setSuccessMsg('Đã xóa lịch hẹn thành công.');
      setTimeout(() => setSuccessMsg(''), 3000);
      activeTab === 'student' ? loadStudentBookings() : loadMentorBookings();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi xóa lịch hẹn');
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

  const handleAddSlot = () => {
    setErrorMsg('');
    if (!newSlotStart || !newSlotEnd) return;
    const [sh, sm] = newSlotStart.split(':').map(Number);
    const [eh, em] = newSlotEnd.split(':').map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      alert('Thời gian bắt đầu phải trước thời gian kết thúc.');
      return;
    }

    const specificDate = slotType === 'ONCE' ? slotDate : undefined;
    const dayOfWeek = slotType === 'ONCE'
      ? (new Date(slotDate).getDay() === 0 ? 8 : new Date(slotDate).getDay() + 1)
      : slotDayOfWeek;
    let expireDate: string | undefined = undefined;
    if (slotType === 'WEEKLY') {
      if (expiryPreset === '1_WEEK') {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        expireDate = d.toISOString().split('T')[0];
      } else if (expiryPreset === '2_WEEKS') {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        expireDate = d.toISOString().split('T')[0];
      } else if (expiryPreset === 'CUSTOM') {
        expireDate = slotExpiryDate;
      }
    }

    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    // Check for overlap locally
    for (const s of scheduleSlots) {
      let dateOverlap = false;
      if (specificDate && s.specificDate) {
        dateOverlap = specificDate === s.specificDate;
      } else if (!specificDate && !s.specificDate) {
        dateOverlap = dayOfWeek === s.dayOfWeek;
      } else {
        const spec = specificDate || s.specificDate;
        const weekDay = specificDate ? dayOfWeek : s.dayOfWeek;
        const exp = specificDate ? s.expireDate : expireDate;

        if (spec) {
          const specDayOfWeek = new Date(spec).getDay() === 0 ? 8 : new Date(spec).getDay() + 1;
          if (specDayOfWeek === weekDay) {
            if (!exp || new Date(spec).getTime() <= new Date(exp).getTime()) {
              dateOverlap = true;
            }
          }
        }
      }

      if (dateOverlap) {
        const [slotSh, slotSm] = s.startTime.split(':').map(Number);
        const [slotEh, slotEm] = s.endTime.split(':').map(Number);
        const slotStartMin = slotSh * 60 + slotSm;
        const slotEndMin = slotEh * 60 + slotEm;

        if (startMin < slotEndMin && endMin > slotStartMin) {
          alert('Khung giờ này bị trùng lặp với một lịch rảnh khác đã cấu hình.');
          return;
        }
      }
    }

    const newSlot: ScheduleSlot = {
      dayOfWeek,
      startTime: newSlotStart,
      endTime: newSlotEnd,
      specificDate,
      expireDate
    };

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
      await fetchAPI('/api/mentor/schedule', {
        method: 'POST',
        body: JSON.stringify(scheduleSlots),
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

  const handleRegisterBusy = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyError('');
    setBusySuccess('');
    if (!busyStartDate || !busyStartTime || !busyEndDate || !busyEndTime || !busyReason) {
      setBusyError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    const start = new Date(`${busyStartDate}T${busyStartTime}`);
    const end = new Date(`${busyEndDate}T${busyEndTime}`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setBusyError('Định dạng thời gian không hợp lệ');
      return;
    }
    if (start >= end) {
      setBusyError('Thời gian bắt đầu phải trước thời gian kết thúc');
      return;
    }
    if (start < new Date()) {
      setBusyError('Thời gian báo bận không thể ở quá khứ');
      return;
    }

    if (busyType === 'PLANNED') {
      const minStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
      if (start < minStart) {
        setBusyError('Bận báo trước phải đăng ký trước ít nhất 24 giờ (1 ngày)');
        return;
      }
    }
    
    const confirmCancel = window.confirm(
      'Hệ thống sẽ tự động Hủy hàng loạt các lịch đặt trùng trong khoảng này. Bạn có chắc chắn muốn báo bận?'
    );
    if (!confirmCancel) return;

    setSubmittingBusy(true);
    try {
      const res = await fetchAPI('/api/bookings/mentor/busy', {
        method: 'POST',
        body: JSON.stringify({
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          reason: `[${busyType === 'EMERGENCY' ? 'Bận đột xuất' : 'Bận báo trước'}] ${busyReason}`,
        }),
      });
      setBusySuccess(res.message || 'Đăng ký báo bận và hủy lịch trùng thành công!');
      setBusyReason('');
      setTimeout(() => setBusySuccess(''), 5000);
    } catch (err: any) {
      setBusyError(err.message || 'Có lỗi xảy ra khi báo bận');
    } finally {
      setSubmittingBusy(false);
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
                onClick={() => { setActiveTab('student'); setFilterStatus('ALL'); setCurrentPage(1); }}
              >
                <i className="bi bi-person" />
                Lịch hẹn của tôi
              </button>

              {user?.role === 'MENTOR' && (
                <>
                  <button
                    className={`bkp-tab ${activeTab === 'mentor-bookings' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('mentor-bookings'); setFilterStatus('ALL'); setCurrentPage(1); }}
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
                {/* Lọc theo trạng thái */}
                <div className="bkp-filters" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <select 
                    value={filterStatus} 
                    onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e0e4ea', outline: 'none', background: '#fff', color: '#495057', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="PENDING">Chờ phê duyệt</option>
                    <option value="APPROVED">Đã phê duyệt</option>
                    <option value="REJECTED">Đã từ chối</option>
                    <option value="CANCELLED">Đã hủy</option>
                    <option value="CLOSED">Đã kết thúc</option>
                  </select>
                </div>

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
                ) : (() => {
                  const filteredBookings = bookings.filter(b => filterStatus === 'ALL' || b.status === filterStatus);
                  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage) || 1;
                  const currentBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                  if (filteredBookings.length === 0) {
                    return (
                      <div className="bkp-empty" style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(0,0,0,0.05)' }}>
                        <i className="bi bi-search bkp-empty-icon" style={{ opacity: 0.5 }} />
                        <div className="bkp-empty-title">Không tìm thấy lịch hẹn</div>
                        <p className="bkp-empty-sub">Không có lịch hẹn nào khớp với bộ lọc trạng thái.</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="bkp-table-responsive" style={{ overflowX: 'auto', background: '#fff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <table className="bkp-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                          <thead>
                            <tr style={{ background: '#f8f9fb', borderBottom: '2px solid #e0e4ea' }}>
                              <th style={{ padding: '16px', fontWeight: 600, color: '#495057', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{activeTab === 'student' ? 'Mentor' : 'Sinh viên'}</th>
                              <th style={{ padding: '16px', fontWeight: 600, color: '#495057', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thời gian</th>
                              <th style={{ padding: '16px', fontWeight: 600, color: '#495057', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trạng thái</th>
                              <th style={{ padding: '16px', fontWeight: 600, color: '#495057', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', width: '25%' }}>Ghi chú / Call</th>
                              <th style={{ padding: '16px', fontWeight: 600, color: '#495057', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right', whiteSpace: 'nowrap' }}>Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentBookings.map((booking) => {
                              const isStudentView = activeTab === 'student';
                              const targetUser = isStudentView ? booking.mentor : booking.student;
                              const dateObj = new Date(booking.bookingDate);
                              const formattedDate = dateObj.toLocaleDateString('vi-VN', {
                                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                              });
                              const cdt = getCountdownStatus(booking);
                              const statusInfo = getStatusInfo(booking.status);

                              return (
                                <tr key={booking.id} style={{ borderBottom: '1px solid #f1f3f5', transition: 'background 0.2s' }}>
                                  <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <div className="bkp-avatar-wrap" style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                                        <img
                                          src={targetUser?.avatar && targetUser.avatar !== 'default.png'
                                            ? targetUser.avatar
                                            : `https://ui-avatars.com/api/?name=${targetUser?.fullname || 'User'}&background=random`}
                                          className="bkp-avatar"
                                          alt="avatar"
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <div className={`bkp-avatar-status ${
                                          booking.status === 'APPROVED' ? 'online'
                                          : booking.status === 'PENDING' ? 'pending'
                                          : 'offline'
                                        }`} style={{ width: '12px', height: '12px' }} />
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '14px', whiteSpace: 'nowrap' }}>{targetUser?.fullname}</div>
                                        <div style={{ fontSize: '12px', color: '#6c757d', whiteSpace: 'nowrap' }}>
                                          {isStudentView ? `Mentor` : `Sinh viên`} · {targetUser?.major || 'Đang cập nhật'}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  <td style={{ padding: '16px' }}>
                                    <div style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                      <i className="bi bi-clock-fill" style={{ color: '#F27125', marginRight: '6px' }} />
                                      {booking.startTime} – {booking.endTime}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px', whiteSpace: 'nowrap' }}>
                                      {formattedDate} ({booking.duration} phút)
                                    </div>
                                  </td>

                                  <td style={{ padding: '16px' }}>
                                    <span className={`bkp-status ${statusInfo.cls}`} style={{ display: 'inline-flex', padding: '6px 10px', fontSize: '12px' }}>
                                      <i className={`bi ${statusInfo.icon}`} />
                                      {statusInfo.text}
                                    </span>
                                  </td>

                                  <td style={{ padding: '16px' }}>
                                    {booking.status === 'APPROVED' ? (
                                      <div className={`bkp-countdown ${
                                        cdt.isClosed ? 'closed' : cdt.isJoinable ? 'joinable' : 'waiting'
                                      }`} style={{ marginTop: 0, padding: '6px 10px', fontSize: '12px' }}>
                                        <i className={`bi ${
                                          cdt.isClosed ? 'bi-x-circle-fill' :
                                          cdt.isJoinable ? 'bi-broadcast-pin' :
                                          'bi-hourglass-split'
                                        }`} />
                                        {cdt.text}
                                      </div>
                                    ) : booking.status === 'REJECTED' || booking.status === 'CLOSED' ? (
                                      <div style={{ fontSize: '12px', color: '#dc3545', background: 'rgba(220,53,69,0.08)', padding: '6px 10px', borderRadius: '8px' }}>
                                        <strong>Lý do: </strong>{booking.rejectionReason || 'Không có'}
                                      </div>
                                    ) : booking.note ? (
                                      <div style={{ fontSize: '12px', color: '#495057', background: '#f8f9fb', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e0e4ea' }}>
                                        <i className="bi bi-chat-left-text" style={{ marginRight: '6px', color: '#adb5bd' }}/>
                                        {booking.note}
                                      </div>
                                    ) : (
                                      <span style={{ fontSize: '12px', color: '#adb5bd' }}>-</span>
                                    )}
                                  </td>

                                  <td style={{ padding: '16px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                      {booking.status === 'APPROVED' && (
                                        <button
                                          onClick={() => handleJoinCall(booking)}
                                          disabled={!cdt.isJoinable || cdt.isClosed}
                                          className="bkp-btn-join"
                                          style={{ padding: '6px 12px', fontSize: '12px' }}
                                        >
                                          <i className="bi bi-camera-video-fill" />
                                          Vào Call
                                        </button>
                                      )}

                                      {isStudentView ? (
                                        (booking.status === 'PENDING' || booking.status === 'APPROVED') && !cdt.isClosed && (
                                          <button
                                            onClick={() => handleCancelBooking(booking.id)}
                                            className="bkp-btn-cancel"
                                            style={{ padding: '6px 12px', fontSize: '12px' }}
                                            title="Hủy lịch hẹn"
                                          >
                                            <i className="bi bi-x-circle" style={{ marginRight: 0 }} />
                                          </button>
                                        )
                                      ) : (
                                        booking.status === 'PENDING' && (
                                          <>
                                            <button
                                              onClick={() => handleApproveBooking(booking.id)}
                                              className="bkp-btn-approve"
                                              style={{ padding: '6px 12px', fontSize: '12px' }}
                                              title="Phê duyệt"
                                            >
                                              <i className="bi bi-check-lg" style={{ marginRight: 0 }} />
                                            </button>
                                            <button
                                              onClick={() => handleOpenRejectModal(booking)}
                                              className="bkp-btn-reject"
                                              style={{ padding: '6px 12px', fontSize: '12px' }}
                                              title="Từ chối"
                                            >
                                              <i className="bi bi-x-lg" style={{ marginRight: 0 }} />
                                            </button>
                                          </>
                                        )
                                      )}
                                      {(booking.status === 'CANCELLED' || booking.status === 'REJECTED' || booking.status === 'CLOSED') && (
                                        <button
                                          onClick={() => handleDeleteBooking(booking.id)}
                                          className="bkp-btn-cancel"
                                          style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(220,53,69,0.08)', color: '#dc3545', border: '1px solid rgba(220,53,69,0.2)' }}
                                          title="Xóa lịch hẹn"
                                        >
                                          <i className="bi bi-trash" style={{ marginRight: 0 }} />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
                          <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e0e4ea', background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#adb5bd' : '#495057' }}
                          >
                            <i className="bi bi-chevron-left" />
                          </button>
                          {Array.from({ length: totalPages }).map((_, i) => (
                            <button 
                              key={i} 
                              onClick={() => setCurrentPage(i + 1)}
                              style={{ padding: '8px 14px', borderRadius: '8px', border: currentPage === i + 1 ? 'none' : '1px solid #e0e4ea', background: currentPage === i + 1 ? '#F27125' : '#fff', color: currentPage === i + 1 ? '#fff' : '#495057', cursor: 'pointer', fontWeight: 600, boxShadow: currentPage === i + 1 ? '0 4px 12px rgba(242,113,37,0.3)' : 'none' }}
                            >
                              {i + 1}
                            </button>
                          ))}
                          <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e0e4ea', background: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#adb5bd' : '#495057' }}
                          >
                            <i className="bi bi-chevron-right" />
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <>
                <div className="sch-card" style={{ marginBottom: 40 }}>
                <h5 className="sch-title">
                  <span className="bkp-header-icon" style={{ width: 32, height: 32, fontSize: 14 }}>
                    <i className="bi bi-calendar-plus-fill" />
                  </span>
                  Thiết lập Khung giờ Rảnh (Google Calendar Style)
                </h5>
                <p className="sch-sub">
                  Tạo các sự kiện giờ rảnh tương tự như trên Google Calendar. Bạn có thể chọn lặp lại hàng tuần hoặc một ngày cụ thể trên lịch, cài đặt hạn sử dụng và khung giờ rảnh linh hoạt.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 32, marginTop: 20 }}>
                  {/* Cột 1: Biểu mẫu tạo Sự kiện Giờ rảnh */}
                  <div style={{ background: '#f8fafc', padding: 24, borderRadius: 20, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="bi bi-plus-circle-fill" style={{ color: '#f27125' }} />
                      Tạo khung giờ rảnh mới
                    </div>

                    {/* Chọn Loại Lịch (Lặp tuần vs Ngày cụ thể) */}
                    <div style={{ marginBottom: 20 }}>
                      <label className="sch-time-label" style={{ marginBottom: 8, display: 'block' }}>Chế độ lặp</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setSlotType('ONCE')}
                          style={{
                            flex: 1,
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: '1.5px solid',
                            borderColor: slotType === 'ONCE' ? '#f27125' : '#e2e8f0',
                            background: slotType === 'ONCE' ? 'rgba(242,113,37,0.06)' : '#ffffff',
                            color: slotType === 'ONCE' ? '#f27125' : '#4b5563',
                            fontWeight: '600',
                            fontSize: 13,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          <i className="bi bi-calendar-event" /> Một lần duy nhất
                        </button>
                        <button
                          type="button"
                          onClick={() => setSlotType('WEEKLY')}
                          style={{
                            flex: 1,
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: '1.5px solid',
                            borderColor: slotType === 'WEEKLY' ? '#f27125' : '#e2e8f0',
                            background: slotType === 'WEEKLY' ? 'rgba(242,113,37,0.06)' : '#ffffff',
                            color: slotType === 'WEEKLY' ? '#f27125' : '#4b5563',
                            fontWeight: '600',
                            fontSize: 13,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          <i className="bi bi-arrow-repeat" /> Lặp hàng tuần
                        </button>
                      </div>
                    </div>

                    {/* Date/Day selection */}
                    <div style={{ marginBottom: 20 }}>
                      {slotType === 'ONCE' ? (
                        <div>
                          <label className="sch-time-label" style={{ marginBottom: 6, display: 'block' }}>Chọn ngày cụ thể</label>
                          <CustomDatePicker
                            value={slotDate}
                            onChange={setSlotDate}
                            minDate={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="sch-time-label" style={{ marginBottom: 6, display: 'block' }}>Chọn ngày trong tuần</label>
                          <select
                            value={slotDayOfWeek}
                            onChange={(e) => setSlotDayOfWeek(parseInt(e.target.value))}
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              borderRadius: 10,
                              border: '1.5px solid #e2e8f0',
                              background: '#ffffff',
                              color: '#1a1a2e',
                              fontSize: 14,
                              fontWeight: '600',
                              outline: 'none',
                            }}
                          >
                            <option value={2}>Thứ Hai</option>
                            <option value={3}>Thứ Ba</option>
                            <option value={4}>Thứ Tư</option>
                            <option value={5}>Thứ Năm</option>
                            <option value={6}>Thứ Sáu</option>
                            <option value={7}>Thứ Bảy</option>
                            <option value={8}>Chủ Nhật</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Khung giờ rảnh (Start - End) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                      <div className="sch-time-field">
                        <label className="sch-time-label" style={{ marginBottom: 6, display: 'block' }}>Giờ bắt đầu</label>
                        <ClockPicker
                          value={newSlotStart}
                          onChange={setNewSlotStart}
                        />
                      </div>
                      <div className="sch-time-field">
                        <label className="sch-time-label" style={{ marginBottom: 6, display: 'block' }}>Giờ kết thúc</label>
                        <ClockPicker
                          value={newSlotEnd}
                          onChange={setNewSlotEnd}
                        />
                      </div>
                    </div>

                    {/* Expiry Date (Only for Weekly repeat) */}
                    {slotType === 'WEEKLY' && (
                      <div style={{ marginBottom: 24, padding: 12, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                        <label className="sch-time-label" style={{ marginBottom: 6, display: 'block' }}>Thời hạn lặp lại</label>
                        <select
                          value={expiryPreset}
                          onChange={(e) => setExpiryPreset(e.target.value as any)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: '1.5px solid #e2e8f0',
                            background: '#ffffff',
                            color: '#1a1a2e',
                            fontSize: 13.5,
                            fontWeight: '600',
                            outline: 'none',
                          }}
                        >
                          <option value="FOREVER">Lặp vô thời hạn (Mãi mãi)</option>
                          <option value="1_WEEK">Chỉ rảnh trong 1 tuần thôi (7 ngày)</option>
                          <option value="2_WEEKS">Chỉ rảnh trong 2 tuần (14 ngày)</option>
                          <option value="CUSTOM">Tùy chọn ngày hết hạn cụ thể...</option>
                        </select>

                        {expiryPreset === 'CUSTOM' && (
                          <div style={{ marginTop: 10 }}>
                            <label className="sch-time-label" style={{ marginBottom: 4, fontSize: 11, display: 'block' }}>Hiệu lực đến hết ngày</label>
                            <CustomDatePicker
                              value={slotExpiryDate}
                              onChange={setSlotExpiryDate}
                              placeholder="Chọn ngày hết hạn"
                              minDate={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Add Event Button */}
                    <button
                      type="button"
                      onClick={handleAddSlot}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        background: '#f27125',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 12,
                        fontWeight: '700',
                        fontSize: 14.5,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 4px 12px rgba(242,113,37,0.2)'
                      }}
                    >
                      <i className="bi bi-calendar-plus" /> Thêm vào Lịch rảnh
                    </button>
                  </div>

                  {/* Cột 2: Danh sách Lịch rảnh hiện có */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="bi bi-list-check" style={{ color: '#f27125' }} />
                      Danh sách lịch rảnh đã thiết lập ({scheduleSlots.length})
                    </div>

                    <div style={{ flex: 1, maxHeight: 420, overflowY: 'auto', paddingRight: 6, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {scheduleSlots.length === 0 ? (
                        <div className="sch-empty-slots" style={{ height: 260, justifyContent: 'center' }}>
                          <i className="bi bi-calendar-x" style={{ fontSize: 40, color: '#cbd5e1', marginBottom: 12 }} />
                          Chưa có lịch rảnh nào được cấu hình.
                        </div>
                      ) : (
                        scheduleSlots.map((slot, idx) => {
                          const isOnce = !!slot.specificDate;
                          return (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 14,
                                padding: '14px 18px',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  {isOnce ? (
                                    <span style={{ fontSize: 11, background: 'rgba(242,113,37,0.1)', color: '#f27125', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                                      📅 Một lần
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: 11, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                                      🔁 Hàng tuần
                                    </span>
                                  )}

                                  <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
                                    {isOnce 
                                      ? `${slot.specificDate?.split('-')[2]}/${slot.specificDate?.split('-')[1]}/${slot.specificDate?.split('-')[0]} (${getDayLabel(slot.dayOfWeek)})`
                                      : getDayLabel(slot.dayOfWeek)
                                    }
                                  </span>
                                </div>

                                <div style={{ fontSize: 13.5, color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <i className="bi bi-clock" style={{ color: '#64748b' }} />
                                  {slot.startTime} – {slot.endTime}
                                  <span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 400 }}>
                                    ({Math.round(
                                      (parseInt(slot.endTime.split(':')[0]) * 60 + parseInt(slot.endTime.split(':')[1])) -
                                      (parseInt(slot.startTime.split(':')[0]) * 60 + parseInt(slot.startTime.split(':')[1]))
                                    )} phút)
                                  </span>
                                </div>

                                {!isOnce && (
                                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <i className="bi bi-info-circle" />
                                    Hạn dùng: {slot.expireDate 
                                      ? `${slot.expireDate.split('-')[2]}/${slot.expireDate.split('-')[1]}/${slot.expireDate.split('-')[0]}`
                                      : 'Lặp vô thời hạn'
                                    }
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveSlot(idx)}
                                style={{
                                  background: 'rgba(239,68,68,0.06)',
                                  color: '#ef4444',
                                  border: 'none',
                                  width: 34,
                                  height: 34,
                                  borderRadius: 10,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'background 0.2s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
                                title="Xóa lịch rảnh này"
                              >
                                <i className="bi bi-trash-fill" style={{ fontSize: 13.5 }} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Nút lưu cấu hình */}
                    <div style={{ marginTop: 20 }}>
                      {isDirty && (
                        <div className="sch-dirty-warning" style={{ margin: '0 0 10px' }}>
                          <i className="bi bi-exclamation-triangle-fill" />
                          Bạn có thay đổi chưa lưu. Hãy nhấn "Lưu cấu hình" để cập nhật.
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveSchedule}
                        disabled={savingSchedule}
                        className="sch-save-btn"
                        style={{ width: '100%', margin: 0, padding: 12 }}
                      >
                        {savingSchedule ? (
                          <>
                            <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'bk-spin 0.7s linear infinite' }} />
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-floppy-fill" />
                            Lưu cấu hình lịch rảnh
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

                {/* Vacation/Busy Mode */}
                <div className="sch-card" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 30 }}>
                  <h5 className="sch-title" style={{ color: '#ef4444' }}>
                    <span className="bkp-header-icon" style={{ width: 32, height: 32, fontSize: 14, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }}>
                      <i className="bi bi-calendar-x" />
                    </span>
                    Báo bận &amp; Nghỉ phép (Vacation Mode)
                  </h5>
                  <p className="sch-sub">
                    Chọn loại báo bận và khoảng thời gian bạn bận. Hệ thống sẽ tự động hủy hàng loạt các lịch hẹn trùng và gửi thông báo tới sinh viên.
                  </p>

                  {/* Mode Selector */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    <button
                      type="button"
                      onClick={() => setBusyType('EMERGENCY')}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: 12,
                        border: '1.5px solid',
                        borderColor: busyType === 'EMERGENCY' ? '#ef4444' : '#e5e7eb',
                        background: busyType === 'EMERGENCY' ? 'rgba(239, 68, 68, 0.06)' : '#ffffff',
                        color: busyType === 'EMERGENCY' ? '#dc2626' : '#4b5563',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <span style={{ fontSize: 14.5 }}>🚨 Bận đột xuất</span>
                      <span style={{ fontSize: 11, fontWeight: 'normal', opacity: 0.8 }}>Báo việc gấp, nghỉ liền</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setBusyType('PLANNED')}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: 12,
                        border: '1.5px solid',
                        borderColor: busyType === 'PLANNED' ? '#ef4444' : '#e5e7eb',
                        background: busyType === 'PLANNED' ? 'rgba(239, 68, 68, 0.06)' : '#ffffff',
                        color: busyType === 'PLANNED' ? '#dc2626' : '#4b5563',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <span style={{ fontSize: 14.5 }}>📅 Bận báo trước</span>
                      <span style={{ fontSize: 11, fontWeight: 'normal', opacity: 0.8 }}>Du lịch / Kế hoạch trước 1-2 ngày</span>
                    </button>
                  </div>

                  <form onSubmit={handleRegisterBusy} style={{ marginTop: 20 }}>
                    {/* Date selection & Time selection separate */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
                      {/* Bắt đầu bận */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label className="sch-time-label">Bắt đầu bận</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <CustomDatePicker
                            value={busyStartDate}
                            onChange={setBusyStartDate}
                            minDate={new Date().toISOString().split('T')[0]}
                            placeholder="Chọn ngày bắt đầu"
                          />
                          <div>
                            <label style={{ fontSize: '11px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>Giờ bắt đầu (Đồng hồ)</label>
                            <ClockPicker
                              value={busyStartTime}
                              onChange={setBusyStartTime}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Kết thúc bận */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label className="sch-time-label">Kết thúc bận</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <CustomDatePicker
                            value={busyEndDate}
                            onChange={setBusyEndDate}
                            minDate={busyStartDate}
                            placeholder="Chọn ngày kết thúc"
                          />
                          <div>
                            <label style={{ fontSize: '11px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>Giờ kết thúc (Đồng hồ)</label>
                            <ClockPicker
                              value={busyEndTime}
                              onChange={setBusyEndTime}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="sch-time-field" style={{ marginBottom: 20 }}>
                      <label className="sch-time-label" style={{ marginBottom: 6 }}>Lý do xin nghỉ / báo bận</label>
                      <textarea
                        value={busyReason}
                        onChange={(e) => setBusyReason(e.target.value)}
                        placeholder="Nhập lý do báo bận đột xuất để AI đánh giá uy tín..."
                        style={{
                          background: '#ffffff',
                          color: '#1a1a2e',
                          border: '1.5px solid #e5e7eb',
                          borderRadius: 12,
                          padding: '12px 16px',
                          width: '100%',
                          height: 80,
                          resize: 'none',
                          outline: 'none',
                        }}
                        required
                      />
                    </div>

                    {busyError && (
                      <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="bi bi-exclamation-circle-fill" /> {busyError}
                      </div>
                    )}
                    {busySuccess && (
                      <div style={{ color: '#10b981', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="bi bi-check-circle-fill" /> {busySuccess}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submittingBusy}
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 12,
                        padding: '12px 24px',
                        fontWeight: '700',
                        cursor: submittingBusy ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => { if (!submittingBusy) e.currentTarget.style.background = '#dc2626'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#ef4444'; }}
                    >
                      {submittingBusy ? 'Đang đăng ký...' : (
                        <>
                          <i className="bi bi-calendar-x-fill" /> Đăng ký báo bận
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
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
