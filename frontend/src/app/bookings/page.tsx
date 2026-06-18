'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI } from '@/lib/api';
import Header from '@/components/layout/Header';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import dynamic from 'next/dynamic';

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

  // Call video state
  const [activeCallRoomId, setActiveCallRoomId] = useState<string | null>(null);

  // Mentor availability config states
  const [selectedDays, setSelectedDays] = useState<number[]>([]); // 2 to 8
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('11:00');
  const [activeScheduleDay, setActiveScheduleDay] = useState<number>(2); // T2
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Rejection modal states
  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingRejection, setSubmittingRejection] = useState(false);

  useEffect(() => {
    if (user) {
      // Set default tab based on role
      if (user.role === 'MENTOR') {
        setActiveTab('mentor-bookings');
      } else {
        setActiveTab('student');
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      if (activeTab === 'student') {
        loadStudentBookings();
      } else if (activeTab === 'mentor-bookings') {
        loadMentorBookings();
      } else if (activeTab === 'mentor-schedule') {
        loadMentorSchedule();
      }
    }
  }, [activeTab, user]);

  const loadStudentBookings = async () => {
    setLoadingBookings(true);
    setErrorMsg('');
    try {
      const data = await fetchAPI('/api/bookings/student');
      setBookings(data || []);
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
      setBookings(data || []);
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
      
      // Trích xuất các ngày có lịch rảnh
      const days = Array.from(new Set(slots.map(s => s.dayOfWeek)));
      setSelectedDays(days);
      if (days.length > 0) {
        setActiveScheduleDay(days[0]);
      } else {
        setActiveScheduleDay(2);
      }
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
      
      if (activeTab === 'student') {
        loadStudentBookings();
      } else {
        loadMentorBookings();
      }
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
      setSuccessMsg('Đã phê duyệt lịch hẹn thành công.');
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
      setSuccessMsg('Đã từ chối lịch hẹn.');
      setTimeout(() => setSuccessMsg(''), 3000);
      setRejectingBooking(null);
      loadMentorBookings();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi từ chối lịch hẹn');
    } finally {
      setSubmittingRejection(false);
    }
  };

  // Mentor schedule settings functions
  const handleToggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
      // Xóa tất cả slot của ngày này
      setScheduleSlots(scheduleSlots.filter(s => s.dayOfWeek !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
      setActiveScheduleDay(day);
    }
  };

  const handleAddSlot = () => {
    if (!newSlotStart || !newSlotEnd) return;
    
    // Validate start before end
    const [sh, sm] = newSlotStart.split(':').map(Number);
    const [eh, em] = newSlotEnd.split(':').map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      alert('Thời gian bắt đầu phải trước thời gian kết thúc.');
      return;
    }

    // Check overlap with existing slots of activeScheduleDay
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

    const newSlot: ScheduleSlot = {
      dayOfWeek: activeScheduleDay,
      startTime: newSlotStart,
      endTime: newSlotEnd
    };

    setScheduleSlots([...scheduleSlots, newSlot].sort((a, b) => a.startTime.localeCompare(b.startTime)));
  };

  const handleRemoveSlot = (index: number) => {
    setScheduleSlots(scheduleSlots.filter((_, idx) => idx !== index));
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      // Chỉ gửi lên các slot thuộc về những ngày đang được check chọn rảnh
      const filteredSlots = scheduleSlots.filter(s => selectedDays.includes(s.dayOfWeek));
      await fetchAPI('/api/mentor/schedule', {
        method: 'POST',
        body: JSON.stringify(filteredSlots),
      });
      setSuccessMsg('Lưu cấu hình lịch rảnh thành công!');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadMentorSchedule();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lưu cấu hình thất bại');
    } finally {
      setSavingSchedule(false);
    }
  };

  const getDayLabel = (day: number) => {
    if (day === 8) return 'Chủ Nhật';
    return `Thứ ${day}`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED': return 'bg-success bg-opacity-10 text-success border border-success border-opacity-20';
      case 'PENDING': return 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-20';
      case 'REJECTED': return 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20';
      default: return 'bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED': return 'Đã phê duyệt';
      case 'PENDING': return 'Đang chờ duyệt';
      case 'REJECTED': return 'Đã từ chối';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  if (authLoading) {
    return <div className="text-center mt-5"><div className="spinner-border text-primary" /></div>;
  }

  return (
    <>
      <Header />
      <div className="app-container">
        <main className="w-100 d-flex justify-content-between">
          <LeftSidebar activeMenu="bookings" />

          {/* Bookings Content */}
          <div className="poly-main-feed flex-grow-1 mx-4" style={{ maxWidth: '850px', minWidth: '0' }}>
            <div className="poly-card p-3 mb-4 bg-white">
              <h4 className="fw-bold text-dark mb-1">Quản lý Lịch hẹn Call Video</h4>
              <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                Đặt lịch call trực tiếp với chuyên gia qua hệ thống camera video tích hợp.
              </p>
            </div>

            {/* Notifications */}
            {successMsg && <div className="alert alert-success alert-dismissible fade show py-2 px-3 mb-3"><i className="bi bi-check-circle-fill me-2"></i>{successMsg}</div>}
            {errorMsg && <div className="alert alert-danger alert-dismissible fade show py-2 px-3 mb-3"><i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMsg}</div>}

            {/* Navigation Tabs */}
            <div className="d-flex border-bottom mb-4 bg-white p-2 rounded-3 border">
              {/* Sinh viên tab: always visible */}
              <button
                className={`btn flex-grow-1 rounded-pill fw-bold py-2 ${activeTab === 'student' ? 'btn-poly-gradient text-white border-0' : 'btn-light text-dark'}`}
                style={{
                  background: activeTab === 'student' ? 'linear-gradient(135deg, #F27125, #FF9E67)' : undefined,
                  fontSize: '14px'
                }}
                onClick={() => setActiveTab('student')}
              >
                <i className="bi bi-person me-1"></i> Lịch hẹn đã đặt (Vai trò Sinh viên)
              </button>

              {/* Mentor tabs: only visible if user is a Mentor */}
              {user?.role === 'MENTOR' && (
                <>
                  <button
                    className={`btn flex-grow-1 rounded-pill fw-bold py-2 ms-2 ${activeTab === 'mentor-bookings' ? 'btn-poly-gradient text-white border-0' : 'btn-light text-dark'}`}
                    style={{
                      background: activeTab === 'mentor-bookings' ? 'linear-gradient(135deg, #F27125, #FF9E67)' : undefined,
                      fontSize: '14px'
                    }}
                    onClick={() => setActiveTab('mentor-bookings')}
                  >
                    <i className="bi bi-person-workspace me-1"></i> Yêu cầu đặt lịch (Vai trò Mentor)
                  </button>

                  <button
                    className={`btn flex-grow-1 rounded-pill fw-bold py-2 ms-2 ${activeTab === 'mentor-schedule' ? 'btn-poly-gradient text-white border-0' : 'btn-light text-dark'}`}
                    style={{
                      background: activeTab === 'mentor-schedule' ? 'linear-gradient(135deg, #F27125, #FF9E67)' : undefined,
                      fontSize: '14px'
                    }}
                    onClick={() => setActiveTab('mentor-schedule')}
                  >
                    <i className="bi bi-gear me-1"></i> Cài đặt lịch rảnh
                  </button>
                </>
              )}
            </div>

            {/* TAB CONTENT: BOOKINGS LIST */}
            {activeTab !== 'mentor-schedule' ? (
              <div className="bookings-list d-flex flex-column gap-3 mb-5">
                {loadingBookings ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" style={{ color: '#F27125' }} role="status"></div>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="poly-card p-5 text-center text-muted bg-white border">
                    <i className="bi bi-calendar-x fs-1 d-block mb-2 text-secondary"></i>
                    Không có lịch hẹn nào.
                  </div>
                ) : (
                  bookings.map((booking) => {
                    const isStudentView = activeTab === 'student';
                    const targetUser = isStudentView ? booking.mentor : booking.student;
                    const dateObj = new Date(booking.bookingDate);
                    const formattedDate = dateObj.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    
                    return (
                      <div key={booking.id} className="poly-card p-3 bg-white border shadow-sm transition-all" style={{ borderLeft: '5px solid #F27125 !important' }}>
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                          
                          {/* Left: User details */}
                          <div className="d-flex align-items-center gap-3">
                            <img 
                              src={targetUser?.avatar && targetUser.avatar !== 'default.png' ? targetUser.avatar : `https://ui-avatars.com/api/?name=${targetUser?.fullname || 'User'}&background=random`} 
                              className="rounded-circle border" 
                              style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                              alt="avatar" 
                            />
                            <div>
                              <div className="d-flex align-items-center gap-2">
                                <h6 className="fw-bold mb-0 text-dark">{targetUser?.fullname}</h6>
                                <span className={`badge px-2 py-1 fs-8 rounded-pill ${getStatusBadgeClass(booking.status)}`}>
                                  {getStatusText(booking.status)}
                                </span>
                              </div>
                              <div className="text-muted fs-7 mt-1">
                                {isStudentView ? `Mentor • Ngành ${targetUser?.major || 'Đang cập nhật'}` : `Sinh viên • Ngành ${targetUser?.major || 'Đang cập nhật'}`}
                              </div>
                              <div className="text-dark fw-medium fs-7 mt-1">
                                <i className="bi bi-clock me-1 text-primary" style={{ color: '#F27125' }}></i>
                                {booking.startTime} - {booking.endTime} ({booking.duration} phút) &bull; {formattedDate}
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="d-flex gap-2 w-100 w-md-auto justify-content-end align-self-stretch align-self-md-center">
                            {booking.status === 'APPROVED' && (
                              <button 
                                onClick={() => setActiveCallRoomId(booking.roomId || `booking_${booking.id}`)}
                                className="btn rounded-pill fw-bold text-white px-3 d-flex align-items-center gap-1 shadow-sm"
                                style={{ background: 'linear-gradient(135deg, #F27125 0%, #FF9E67 100%)', border: 'none', fontSize: '13.5px' }}
                              >
                                <i className="bi bi-camera-video-fill"></i> Tham gia Call Video
                              </button>
                            )}

                            {isStudentView ? (
                              // Student views: can cancel pending or approved calls
                              (booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                                <button 
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="btn btn-outline-danger rounded-pill fw-bold px-3 fs-7"
                                >
                                  Hủy lịch hẹn
                                </button>
                              )
                            ) : (
                              // Mentor views: can approve or reject pending calls
                              booking.status === 'PENDING' && (
                                <>
                                  <button 
                                    onClick={() => handleApproveBooking(booking.id)}
                                    className="btn btn-success rounded-pill fw-bold px-3 fs-7 text-white"
                                  >
                                    Phê duyệt
                                  </button>
                                  <button 
                                    onClick={() => handleOpenRejectModal(booking)}
                                    className="btn btn-outline-danger rounded-pill fw-bold px-3 fs-7"
                                  >
                                    Từ chối
                                  </button>
                                </>
                              )
                            )}
                          </div>
                        </div>

                        {/* Note area */}
                        {booking.note && (
                          <div className="mt-3 p-3 bg-light rounded-3 text-dark fs-7" style={{ borderLeft: '3px solid #dee2e6' }}>
                            <strong>Ghi chú câu hỏi:</strong> {booking.note}
                          </div>
                        )}

                        {/* Rejection reason area */}
                        {booking.status === 'REJECTED' && booking.rejectionReason && (
                          <div className="mt-3 p-3 bg-danger bg-opacity-10 text-danger rounded-3 fs-7">
                            <strong>Lý do từ chối:</strong> {booking.rejectionReason}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* TAB CONTENT: MENTOR SCHEDULE CONFIG */
              <div className="poly-card p-4 bg-white border shadow-sm mb-5">
                <h5 className="fw-bold mb-3 text-dark">Thiết lập Lịch rảnh hàng tuần</h5>
                <p className="text-muted fs-7 mb-4">
                  Chọn các ngày bạn rảnh trong tuần từ Thứ 2 đến Chủ Nhật. Với mỗi ngày được chọn, hãy cấu hình các khung giờ rảnh để sinh viên có thể chọn đặt lịch hẹn.
                </p>

                {/* 1. Chọn ngày rảnh trong tuần */}
                <div className="mb-4">
                  <label className="fw-bold text-secondary mb-2" style={{ fontSize: '13.5px' }}>
                    Bước 1: Chọn ngày rảnh của bạn:
                  </label>
                  <div className="d-flex flex-wrap gap-2">
                    {[2, 3, 4, 5, 6, 7, 8].map((day) => {
                      const isActive = selectedDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleToggleDay(day)}
                          className="btn fw-bold px-3 py-2 rounded-3 transition-all"
                          style={{
                            fontSize: '13.5px',
                            backgroundColor: isActive ? '#F27125' : 'rgba(242, 113, 37, 0.08)',
                            color: isActive ? '#fff' : '#F27125',
                            border: isActive ? '1px solid #F27125' : '1px solid rgba(242, 113, 37, 0.2)'
                          }}
                        >
                          {day === 8 ? 'Chủ Nhật' : `Thứ ${day}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Cài đặt khung giờ cho từng ngày */}
                {selectedDays.length > 0 ? (
                  <div className="mb-4 bg-light p-3 rounded-3 border">
                    <label className="fw-bold text-secondary mb-3" style={{ fontSize: '13.5px' }}>
                      Bước 2: Cài đặt khoảng giờ rảnh cho từng ngày:
                    </label>

                    {/* Lọc ngày để hiển thị chi tiết cài đặt */}
                    <div className="d-flex gap-2 border-bottom pb-2 mb-3 overflow-x-auto">
                      {selectedDays.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setActiveScheduleDay(day)}
                          className={`btn btn-sm rounded-pill px-3 py-1 fw-bold border-0 ${activeScheduleDay === day ? 'bg-poly text-white' : 'bg-transparent text-muted'}`}
                          style={{ backgroundColor: activeScheduleDay === day ? '#F27125' : undefined }}
                        >
                          {getDayLabel(day)}
                        </button>
                      ))}
                    </div>

                    {/* Danh sách các slot đã thêm của activeScheduleDay */}
                    <div className="slots-editor">
                      <h6 className="fw-bold mb-2 text-dark fs-7">Danh sách khung giờ của {getDayLabel(activeScheduleDay)}:</h6>
                      
                      <div className="d-flex flex-column gap-2 mb-3">
                        {scheduleSlots.filter(s => s.dayOfWeek === activeScheduleDay).length === 0 ? (
                          <div className="text-muted fs-7 py-2"><i className="bi bi-info-circle me-1"></i>Chưa cấu hình khung giờ rảnh cho ngày này. Hãy thêm ở dưới.</div>
                        ) : (
                          scheduleSlots.map((slot, idx) => {
                            if (slot.dayOfWeek !== activeScheduleDay) return null;
                            return (
                              <div key={idx} className="d-flex justify-content-between align-items-center bg-white p-2 rounded border">
                                <span className="text-dark fw-medium fs-7">
                                  <i className="bi bi-clock me-2 text-success"></i>
                                  {slot.startTime} - {slot.endTime}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlot(scheduleSlots.indexOf(slot))}
                                  className="btn btn-sm btn-link text-danger p-0"
                                >
                                  <i className="bi bi-trash-fill"></i>
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Công cụ thêm slot mới */}
                      <div className="p-3 bg-white rounded border">
                        <h6 className="fw-bold text-dark fs-7 mb-2">Thêm khoảng giờ rảnh mới:</h6>
                        <div className="row g-2 align-items-end">
                          <div className="col-5">
                            <label className="text-muted fs-8 mb-1">Giờ bắt đầu</label>
                            <input
                              type="time"
                              value={newSlotStart}
                              onChange={(e) => setNewSlotStart(e.target.value)}
                              className="form-control form-control-sm shadow-none"
                            />
                          </div>
                          <div className="col-5">
                            <label className="text-muted fs-8 mb-1">Giờ kết thúc</label>
                            <input
                              type="time"
                              value={newSlotEnd}
                              onChange={(e) => setNewSlotEnd(e.target.value)}
                              className="form-control form-control-sm shadow-none"
                            />
                          </div>
                          <div className="col-2 text-end">
                            <button
                              type="button"
                              onClick={handleAddSlot}
                              className="btn btn-sm btn-poly-gradient text-white w-100 fw-bold border-0"
                              style={{ background: 'linear-gradient(135deg, #F27125, #FF9E67)', height: '31px' }}
                            >
                              Thêm
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-warning py-2 px-3 text-warning border-0" style={{ backgroundColor: '#fff3cd' }}>
                    <i className="bi bi-exclamation-circle me-2"></i>Vui lòng chọn ít nhất 1 ngày rảnh ở Bước 1 để bắt đầu cấu hình khung giờ.
                  </div>
                )}

                {/* Nút lưu cấu hình */}
                <div className="border-top pt-3 d-flex justify-content-end">
                  <button
                    type="button"
                    onClick={handleSaveSchedule}
                    disabled={savingSchedule}
                    className="btn btn-poly-gradient px-4 py-2 rounded-pill fw-bold text-white border-0 shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #F27125 0%, #FFC371 100%)', opacity: savingSchedule ? 0.6 : 1 }}
                  >
                    {savingSchedule ? 'Đang lưu...' : 'Lưu cấu hình'}
                  </button>
                </div>
              </div>
            )}
          </div>
          <RightSidebar />
        </main>
      </div>

      {/* Modal từ chối yêu cầu đặt lịch */}
      {rejectingBooking && (
        <div className="modal show d-block animate-fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header bg-danger text-white border-0 py-3">
                <h5 className="modal-title fw-bold"><i className="bi bi-x-circle me-2"></i>Từ chối yêu cầu đặt lịch</h5>
                <button type="button" className="btn-close btn-close-white shadow-none" onClick={() => setRejectingBooking(null)}></button>
              </div>
              <div className="modal-body p-4 bg-light text-dark">
                <p className="fs-7 text-secondary mb-3">
                  Vui lòng cung cấp lý do từ chối yêu cầu đặt lịch của sinh viên <strong>{rejectingBooking.student.fullname}</strong>. Sinh viên sẽ nhận được email phản hồi kèm lý do này.
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="form-control bg-white shadow-none"
                  rows={3}
                  placeholder="Ví dụ: Tôi có lịch họp đột xuất, bạn có thể hẹn vào khung giờ khác được không..."
                  required
                />
              </div>
              <div className="modal-footer border-0 bg-light pt-0">
                <button type="button" className="btn btn-light border rounded-pill px-4 fw-medium text-dark" onClick={() => setRejectingBooking(null)}>Hủy</button>
                <button
                  type="button"
                  disabled={submittingRejection}
                  onClick={handleConfirmReject}
                  className="btn btn-danger rounded-pill px-4 fw-bold text-white"
                >
                  {submittingRejection ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phòng họp Video call overlay */}
      {activeCallRoomId && user && (
        <VideoCallRoom
          roomId={activeCallRoomId}
          user={{ username: user.username, fullname: user.fullname }}
          onLeaveRoom={() => setActiveCallRoomId(null)}
        />
      )}
    </>
  );
}
