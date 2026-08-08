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
import BookingModal from '@/components/mentors/BookingModal';
import { Mentor } from '@/lib/types';
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

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLocalTimeRounded = (minutesToAdd = 0) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutesToAdd);
  const m = d.getMinutes();
  const remainder = m % 15;
  if (remainder > 0) {
    d.setMinutes(d.getMinutes() + (15 - remainder));
  }
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
};

const getLocalEndTimeRounded = (startTimeStr: string) => {
  if (!startTimeStr) return '17:00';
  const [sh, sm] = startTimeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(sh);
  d.setMinutes(sm);
  d.setHours(d.getHours() + 4); // Default to 4 hours busy duration
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const formatDateTimeStr = (isoStr: string) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hour}:${minute}`;
};

interface SuggestedMentor {
  username: string;
  fullname: string;
  avatar: string;
  major: string;
  availableAtExact: boolean;
  matchedSlots: { startTime: string; endTime: string }[];
}

const SuggestedMentorsWidget = ({
  booking,
  onSelectMentor
}: {
  booking: Booking;
  onSelectMentor: (mentor: Mentor) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [mentors, setMentors] = useState<SuggestedMentor[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchSuggestions = async () => {
    if (loaded) {
      setExpanded(!expanded);
      return;
    }
    setLoading(true);
    setExpanded(true);
    try {
      const data = await fetchAPI(
        `/api/bookings/suggest-mentors?date=${booking.bookingDate}&startTime=${booking.startTime}&endTime=${booking.endTime}&excludeMentor=${booking.mentor?.username || ''}`
      );
      setMentors(data || []);
      setLoaded(true);
    } catch (err) {
      console.error('Failed to load mentor suggestions', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <button
        type="button"
        onClick={fetchSuggestions}
        style={{
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
          color: '#c2410c',
          border: '1px solid #fed7aa',
          padding: '4px 10px',
          borderRadius: 8,
          fontSize: 11.5,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5
        }}
      >
        <i className="bi bi-lightbulb-fill" style={{ color: '#f97316' }} />
        {expanded ? 'Ẩn gợi ý Mentor khác' : 'Gợi ý Mentor rảnh khung giờ này'}
      </button>

      {expanded && (
        <div
          style={{
            marginTop: 8,
            padding: 10,
            background: '#ffffff',
            borderRadius: 10,
            border: '1px solid #ffedd5',
            boxShadow: '0 2px 8px rgba(249,115,22,0.08)'
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#9a3412', marginBottom: 6 }}>
            Mentor gợi ý (rảnh ngày {booking.bookingDate}):
          </div>
          {loading ? (
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Đang tìm kiếm Mentor...</div>
          ) : mentors.length === 0 ? (
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Không tìm thấy Mentor nào khác rảnh quanh khung giờ này.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {mentors.map((m) => (
                <div
                  key={m.username}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    background: '#fff7ed',
                    borderRadius: 8,
                    border: '1px solid #ffedd5'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img
                      src={
                        m.avatar && m.avatar !== 'default.png'
                          ? m.avatar
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.fullname)}&background=random`
                      }
                      alt="avatar"
                      style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#1e293b' }}>{m.fullname}</div>
                      <div style={{ fontSize: 10.5, color: '#64748b' }}>
                        {m.major || 'CNTT'} · {m.availableAtExact ? '🟢 Rảnh đúng khung giờ' : '🟡 Rảnh khung lân cận'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onSelectMentor({
                        id: 0,
                        fullname: m.fullname,
                        email: '',
                        phone: '',
                        birthday: '',
                        introduction: '',
                        motivation: '',
                        cvFile: '',
                        createdAt: '',
                        user: { username: m.username, avatar: m.avatar, major: m.major }
                      })
                    }
                    style={{
                      background: '#f27125',
                      color: '#fff',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Đặt lịch
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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
  const [slotDate, setSlotDate] = useState(() => getLocalDateString());
  const [slotDayOfWeek, setSlotDayOfWeek] = useState<number>(2);
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('11:00');
  const [expiryPreset, setExpiryPreset] = useState<'FOREVER' | '1_WEEK' | '2_WEEKS' | 'CUSTOM'>('FOREVER');
  const [slotExpiryDate, setSlotExpiryDate] = useState('');

  // Mentor vacation/busy states
  const [busyType, setBusyType] = useState<'EMERGENCY' | 'PLANNED'>('EMERGENCY');
  const [busyStartDate, setBusyStartDate] = useState(() => getLocalDateString());
  const [busyEndDate, setBusyEndDate] = useState(() => getLocalDateString());
  const [busyStartTime, setBusyStartTime] = useState(() => getLocalTimeRounded(0));
  const [busyEndTime, setBusyEndTime] = useState(() => getLocalEndTimeRounded(getLocalTimeRounded(0)));
  const [busyReason, setBusyReason] = useState('');
  const [busyError, setBusyError] = useState('');
  const [busySuccess, setBusySuccess] = useState('');
  const [submittingBusy, setSubmittingBusy] = useState(false);
  const [busyHistory, setBusyHistory] = useState<any[]>([]);
  const [loadingBusyHistory, setLoadingBusyHistory] = useState(false);

  // Rejection modal states
  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingRejection, setSubmittingRejection] = useState(false);

  // Rebook (re-schedule) state – open BookingModal for the same mentor
  const [rebookMentor, setRebookMentor] = useState<Mentor | null>(null);

  const handleRebook = (item: Booking | Mentor) => {
    if ('user' in item && item.user) {
      setRebookMentor(item as Mentor);
      return;
    }
    const b = item as Booking;
    const mentor: Mentor = {
      id: 0, // not needed by BookingModal for the booking flow
      fullname: b.mentor.fullname,
      email: b.mentor.email,
      phone: '',
      birthday: '',
      introduction: '',
      motivation: '',
      cvFile: '',
      createdAt: '',
      user: {
        username: b.mentor.username,
        avatar: b.mentor.avatar,
        major: b.mentor.major,
      },
    };
    setRebookMentor(mentor);
  };

  // Google Calendar View States
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('calendar');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => getLocalDateString());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Helper: Build the monthly calendar days grid
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 is Sunday, 1 is Monday, etc.
    
    const cells: { date: Date; isCurrentMonth: boolean; dateStr: string }[] = [];
    
    // Days of previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      cells.push({
        date: d,
        isCurrentMonth: false,
        dateStr: `${y}-${m}-${day}`
      });
    }
    
    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      cells.push({
        date: d,
        isCurrentMonth: true,
        dateStr: `${y}-${m}-${day}`
      });
    }
    
    // Days of next month to fill grid (multiple of 7, usually 35 or 42 cells)
    const totalCells = cells.length > 35 ? 42 : 35;
    const remaining = totalCells - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      cells.push({
        date: d,
        isCurrentMonth: false,
        dateStr: `${y}-${m}-${day}`
      });
    }
    
    return cells;
  };

  // Helper: Get active Available schedule slots for a selected date
  // Helper: Get active Available schedule slots for a selected date (excluding booked/busy slots)
  const getAvailabilityForDate = (dateStr: string) => {
    if (!scheduleSlots || scheduleSlots.length === 0) return [];
    
    const dateObj = new Date(dateStr);
    const dayOfWeek = dateObj.getDay() === 0 ? 8 : dateObj.getDay() + 1;
    
    const rawSlots = scheduleSlots.filter(slot => {
      if (slot.specificDate) {
        return slot.specificDate === dateStr;
      }
      
      if (slot.dayOfWeek === dayOfWeek) {
        if (!slot.expireDate) return true;
        return dateStr <= slot.expireDate;
      }
      
      return false;
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Lọc bỏ các khung giờ đã có lịch hẹn (PENDING, APPROVED, CLOSED) hoặc báo bận
    const dateBookings = (bookings || []).filter(
      (b: Booking) => b.bookingDate === dateStr && (b.status === 'PENDING' || b.status === 'APPROVED' || b.status === 'CLOSED')
    );

    const cellDate = new Date(dateStr);
    const startOfDay = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate(), 23, 59, 59);

    const dateBusies = (busyHistory || []).filter(item => {
      const busyStart = new Date(item.startTime);
      const busyEnd = new Date(item.endTime);
      return busyStart <= endOfDay && busyEnd >= startOfDay;
    });

    return rawSlots.filter(slot => {
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      const sMin = sh * 60 + sm;
      const eMin = eh * 60 + em;

      const isBooked = dateBookings.some((b: Booking) => {
        const [bSh, bSm] = b.startTime.split(':').map(Number);
        const [bEh, bEm] = b.endTime.split(':').map(Number);
        const bSMin = bSh * 60 + bSm;
        const bEMin = bEh * 60 + bEm;
        return bSMin < eMin && bEMin > sMin;
      });

      if (isBooked) return false;

      const isBusy = dateBusies.some(item => {
        const bStart = new Date(item.startTime);
        const bEnd = new Date(item.endTime);
        const bStartMin = bStart.getHours() * 60 + bStart.getMinutes();
        const bEndMin = bEnd.getHours() * 60 + bEnd.getMinutes();
        return bStartMin < eMin && bEndMin > sMin;
      });

      return !isBusy;
    });
  };

  // Helper: format standard ISO time to AM/PM format (e.g. "09:00" -> "9AM", "13:30" -> "1:30PM")
  const formatTimeToGCal = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const minStr = m === 0 ? '' : `:${String(m).padStart(2, '0')}`;
    return `${hour12}${minStr}${suffix}`;
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      setActiveTab(user.role === 'MENTOR' ? 'mentor-bookings' : 'student');
    }
  }, [user]);

  // Auto-adjust busy start/end dates and times to keep them valid
  useEffect(() => {
    if (busyStartDate && busyEndDate) {
      if (busyStartDate > busyEndDate) {
        setBusyEndDate(busyStartDate);
      } else if (busyStartDate === busyEndDate) {
        if (busyStartTime && busyEndTime && busyStartTime > busyEndTime) {
          setBusyEndTime(busyStartTime);
        }
      }
    }
  }, [busyStartDate, busyEndDate, busyStartTime, busyEndTime]);

  // Auto-adjust free schedule slots start/end times
  useEffect(() => {
    if (newSlotStart && newSlotEnd && newSlotStart > newSlotEnd) {
      setNewSlotEnd(newSlotStart);
    }
  }, [newSlotStart, newSlotEnd]);

  useEffect(() => {
    if (user) {
      if (activeTab === 'student') loadStudentBookings();
      else if (activeTab === 'mentor-bookings') loadMentorBookings();
      else if (activeTab === 'mentor-schedule') {
        loadMentorSchedule();
        loadBusyHistory();
      }
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

      // Load schedule slots in background so they are available on the timeline immediately
      try {
        const scheduleData = await fetchAPI('/api/mentor/schedule');
        setScheduleSlots(scheduleData || []);
      } catch (scheduleErr) {
        console.error('Lỗi tải lịch rảnh:', scheduleErr);
      }

      // Load busy history in background so it is available on the calendar/timeline immediately
      try {
        const busyData = await fetchAPI('/api/bookings/mentor/busy');
        setBusyHistory(busyData || []);
      } catch (busyErr) {
        console.error('Lỗi tải lịch bận:', busyErr);
      }
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

  const loadBusyHistory = async () => {
    setLoadingBusyHistory(true);
    try {
      const data = await fetchAPI('/api/bookings/mentor/busy');
      setBusyHistory(data || []);
    } catch (err: any) {
      console.error('Lỗi tải lịch sử báo bận:', err);
    } finally {
      setLoadingBusyHistory(false);
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
        expireDate = getLocalDateString(d);
      } else if (expiryPreset === '2_WEEKS') {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        expireDate = getLocalDateString(d);
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
      loadMentorBookings();
      setTimeout(() => setBusySuccess(''), 5000);
    } catch (err: any) {
      setBusyError(err.message || 'Có lỗi xảy ra khi báo bận');
    } finally {
      setSubmittingBusy(false);
    }
  };

  const setToCurrentTime = () => {
    if (busyType === 'PLANNED') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setMinutes(tomorrow.getMinutes() + 15);
      
      const roundedDate = getLocalDateString(tomorrow);
      const roundedTime = getLocalTimeRounded(15);
      
      setBusyStartDate(roundedDate);
      setBusyStartTime(roundedTime);
      setBusyEndDate(roundedDate);
      setBusyEndTime(getLocalEndTimeRounded(roundedTime));
    } else {
      const todayStr = getLocalDateString();
      const timeStr = getLocalTimeRounded(0);
      setBusyStartDate(todayStr);
      setBusyStartTime(timeStr);
      setBusyEndDate(todayStr);
      setBusyEndTime(getLocalEndTimeRounded(timeStr));
    }
  };

  // Auto-adjust date when switching busyType to keep it valid
  useEffect(() => {
    if (busyType === 'PLANNED') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = getLocalDateString(tomorrow);
      if (busyStartDate < tomorrowStr) {
        setBusyStartDate(tomorrowStr);
      }
    } else if (busyType === 'EMERGENCY') {
      const todayStr = getLocalDateString();
      if (busyStartDate > todayStr) {
        setBusyStartDate(todayStr);
      }
    }
  }, [busyType]);

  const getDayLabel = (day: number) => day === 8 ? 'Chủ Nhật' : `Thứ ${day}`;

  const isBookingPast = (booking: Booking) => {
    if (!booking.bookingDate || !booking.startTime) return false;
    const bookingStart = new Date(`${booking.bookingDate}T${booking.startTime}`);
    return bookingStart < now;
  };

  const getStatusInfo = (status: string, booking?: Booking): { cls: string; text: string; icon: string } => {
    if (status.toUpperCase() === 'PENDING' && booking && isBookingPast(booking)) {
      return { cls: 'rejected',  text: 'Quá hạn phê duyệt', icon: 'bi-exclamation-triangle-fill' };
    }
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
                {/* Lọc theo trạng thái và Chế độ xem */}
                <div className="bkp-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
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

                  <div className="bkp-view-toggle">
                    <button
                      type="button"
                      className={`bkp-view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                      onClick={() => setViewMode('calendar')}
                    >
                      <i className="bi bi-calendar3" /> Xem dạng Lịch
                    </button>
                    <button
                      type="button"
                      className={`bkp-view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                      onClick={() => setViewMode('table')}
                    >
                      <i className="bi bi-list-task" /> Xem dạng Bảng
                    </button>
                  </div>
                </div>

                {loadingBookings ? (
                  <div className="bk-loading" style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(0,0,0,0.05)' }}>
                    <div className="bk-spinner" />
                    <span className="bk-loading-text">Đang tải...</span>
                  </div>
                ) : viewMode === 'table' ? (
                  bookings.length === 0 ? (
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
                                const statusInfo = getStatusInfo(booking.status, booking);

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
                                      ) : booking.status === 'REJECTED' || booking.status === 'CLOSED' || booking.status === 'CANCELLED' ? (
                                        <div>
                                          <div style={{ fontSize: '12px', color: '#dc3545', background: 'rgba(220,53,69,0.08)', padding: '6px 10px', borderRadius: '8px' }}>
                                            <strong>Lý do: </strong>{booking.rejectionReason || 'Không có'}
                                          </div>
                                          {isStudentView && (booking.status === 'REJECTED' || booking.status === 'CANCELLED') && (
                                            <SuggestedMentorsWidget booking={booking} onSelectMentor={handleRebook} />
                                          )}
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
                                          (booking.status === 'PENDING' || booking.status === 'APPROVED') && !cdt.isClosed && !isBookingPast(booking) && (
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
                                          booking.status === 'PENDING' && !isBookingPast(booking) && (
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
                                        {isStudentView && (booking.status === 'REJECTED' || booking.status === 'CANCELLED') && (
                                          <button
                                            onClick={() => handleRebook(booking)}
                                            className="bkp-btn-approve"
                                            style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(34,197,94,0.08)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', gap: 4 }}
                                            title="Đặt lại lịch với mentor này"
                                          >
                                            <i className="bi bi-arrow-repeat" style={{ marginRight: 0 }} />
                                          </button>
                                        )}

                                        {(booking.status === 'CANCELLED' || booking.status === 'REJECTED' || booking.status === 'CLOSED' || (booking.status === 'PENDING' && isBookingPast(booking))) && (
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
                  })()
                ) : (() => {
                  const filteredBookings = bookings.filter(b => filterStatus === 'ALL' || b.status === filterStatus);
                  
                  const handlePrevMonth = () => {
                    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
                  };
                  const handleNextMonth = () => {
                    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
                  };
                  const handleToday = () => {
                    setCurrentMonth(new Date());
                    setSelectedDateStr(getLocalDateString());
                  };
                  
                  const getMonthNameVietnamese = (date: Date) => {
                    const months = [
                      'Tháng Một', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu',
                      'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Mười Hai'
                    ];
                    return `${months[date.getMonth()]} năm ${date.getFullYear()}`;
                  };
                  
                  const cells = getDaysInMonth(currentMonth);
                  
                  const bookingsByDate: { [key: string]: Booking[] } = {};
                  filteredBookings.forEach(b => {
                    if (!bookingsByDate[b.bookingDate]) {
                      bookingsByDate[b.bookingDate] = [];
                    }
                    bookingsByDate[b.bookingDate].push(b);
                  });
                  
                  Object.keys(bookingsByDate).forEach(d => {
                    bookingsByDate[d].sort((a, b) => a.startTime.localeCompare(b.startTime));
                  });

                  const selectedDateBookings = bookingsByDate[selectedDateStr] || [];
                  const selectedDateAvail = getAvailabilityForDate(selectedDateStr);
                  const selectedDateBusy = (() => {
                    if (!user || user.role !== 'MENTOR') return [];
                    const cellDate = new Date(selectedDateStr);
                    const startOfDay = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate(), 0, 0, 0);
                    const endOfDay = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate(), 23, 59, 59);

                    return busyHistory.filter(item => {
                      const busyStart = new Date(item.startTime);
                      const busyEnd = new Date(item.endTime);
                      return busyStart <= endOfDay && busyEnd >= startOfDay;
                    }).map(item => {
                      const busyStart = new Date(item.startTime);
                      const busyEnd = new Date(item.endTime);
                      
                      let startHour = 7;
                      let startMin = 0;
                      let endHour = 21;
                      let endMin = 0;

                      const localStartDateStr = getLocalDateString(busyStart);
                      if (localStartDateStr === selectedDateStr) {
                        startHour = busyStart.getHours();
                        startMin = busyStart.getMinutes();
                      }
                      
                      const localEndDateStr = getLocalDateString(busyEnd);
                      if (localEndDateStr === selectedDateStr) {
                        endHour = busyEnd.getHours();
                        endMin = busyEnd.getMinutes();
                      }

                      if (startHour < 7) { startHour = 7; startMin = 0; }
                      if (startHour > 21) { startHour = 21; startMin = 0; }
                      if (endHour < 7) { endHour = 7; endMin = 0; }
                      if (endHour > 21) { endHour = 21; endMin = 0; }

                      const startTimeStr = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
                      const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

                      return {
                        id: item.id,
                        startTime: startTimeStr,
                        endTime: endTimeStr,
                        originalStartTime: formatDateTimeStr(item.startTime),
                        originalEndTime: formatDateTimeStr(item.endTime),
                        reason: item.reason,
                        adminApproved: item.adminApproved
                      };
                    });
                  })();
                  
                  const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7 to 21
                  
                  const getSlotPosition = (startTimeStr: string, endTimeStr: string) => {
                    const [sh, sm] = startTimeStr.split(':').map(Number);
                    const [eh, em] = endTimeStr.split(':').map(Number);
                    const startOffsetMinutes = (sh - 7) * 60 + sm;
                    const durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
                    
                    const pxPerMin = 75 / 60;
                    const top = startOffsetMinutes * pxPerMin;
                    const height = durationMinutes * pxPerMin;
                    return { top, height };
                  };

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {/* Monthly Calendar Grid */}
                      <div className="gcal-wrapper">
                        <div className="gcal-header">
                          <h5 className="gcal-month-title">
                            <i className="bi bi-calendar3" style={{ color: '#f27125', marginRight: 8 }} />
                            {getMonthNameVietnamese(currentMonth)}
                          </h5>
                          <div className="gcal-nav-group">
                            <button type="button" className="gcal-btn" onClick={handleToday}>
                              Hôm nay
                            </button>
                            <button type="button" className="gcal-btn" onClick={handlePrevMonth} title="Tháng trước">
                              <i className="bi bi-chevron-left" />
                            </button>
                            <button type="button" className="gcal-btn" onClick={handleNextMonth} title="Tháng sau">
                              <i className="bi bi-chevron-right" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="gcal-grid-header">
                          <div className="gcal-day-header" style={{ color: '#dc3545' }}>CN</div>
                          <div className="gcal-day-header">Thứ 2</div>
                          <div className="gcal-day-header">Thứ 3</div>
                          <div className="gcal-day-header">Thứ 4</div>
                          <div className="gcal-day-header">Thứ 5</div>
                          <div className="gcal-day-header">Thứ 6</div>
                          <div className="gcal-day-header" style={{ color: '#3b82f6' }}>Thứ 7</div>
                        </div>
                        
                        <div className="gcal-calendar-grid">
                          {cells.map((cell, idx) => {
                            const dateStr = cell.dateStr;
                            const dayBookings = bookingsByDate[dateStr] || [];
                            const isToday = cell.dateStr === getLocalDateString();
                            const isSelected = cell.dateStr === selectedDateStr;
                            
                            const dayBusies = (() => {
                              if (!user || user.role !== 'MENTOR') return [];
                              const cellDate = new Date(dateStr);
                              const startOfDay = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate(), 0, 0, 0);
                              const endOfDay = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate(), 23, 59, 59);

                              return busyHistory.filter(item => {
                                const busyStart = new Date(item.startTime);
                                const busyEnd = new Date(item.endTime);
                                return busyStart <= endOfDay && busyEnd >= startOfDay;
                              });
                            })();

                            const dayAvails = getAvailabilityForDate(dateStr);

                            const totalItemCount = dayBookings.length + dayBusies.length + dayAvails.length;
                            
                            // Phân bổ hiển thị ưu tiên: 1. Bận -> 2. Lịch hẹn thực tế -> 3. Giờ rảnh còn trống
                            const maxDisplay = 3;
                            let rem = maxDisplay;

                            const displayBusies = dayBusies.slice(0, rem);
                            rem -= displayBusies.length;

                            const displayBookings = dayBookings.slice(0, Math.max(0, rem));
                            rem -= displayBookings.length;

                            const displayAvails = dayAvails.slice(0, Math.max(0, rem));
                            rem -= displayAvails.length;

                            const displayedCount = displayBusies.length + displayBookings.length + displayAvails.length;
                            const extraCount = totalItemCount - displayedCount;
                            
                            return (
                              <div
                                key={idx}
                                className={`gcal-day-cell ${cell.isCurrentMonth ? '' : 'inactive'} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                                onClick={() => setSelectedDateStr(dateStr)}
                              >
                                <div className="gcal-day-number-wrapper" style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'row-reverse', alignItems: 'center' }}>
                                  <span className="gcal-day-number">{cell.date.getDate()}</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {dayAvails.length > 0 && (
                                      <span style={{ fontSize: 9.5, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 4, padding: '1px 4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }} title={`Có ${dayAvails.length} khung giờ rảnh còn trống`}>
                                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} /> Rảnh
                                      </span>
                                    )}
                                    {totalItemCount > 0 && (
                                      <span style={{ fontSize: 10, background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: 4, padding: '1px 5px', fontWeight: 700, color: '#475569' }}>
                                        {totalItemCount}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="gcal-event-list">
                                  {displayBusies.map((busy) => (
                                    <div
                                      key={`cal-busy-${busy.id}`}
                                      className="gcal-event-badge"
                                      style={{
                                        background: '#fee2e2',
                                        color: '#991b1b',
                                        borderLeft: '2px solid #ef4444',
                                        padding: '2px 4px',
                                        borderRadius: '3px',
                                        fontSize: '11px',
                                        marginBottom: '2px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }}
                                      title={`Lịch bận: ${busy.reason}`}
                                    >
                                      <span className="gcal-event-dot" style={{ backgroundColor: '#ef4444' }} />
                                      <span style={{ fontWeight: 800, marginRight: 2 }}>🚨 BẬN</span>
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{busy.reason}</span>
                                    </div>
                                  ))}

                                  {displayBookings.map((b) => {
                                    const isStudentView = activeTab === 'student';
                                    const targetUser = isStudentView ? b.mentor : b.student;
                                    const statusClass = b.status.toLowerCase();
                                    const shortTime = formatTimeToGCal(b.startTime);
                                    
                                    return (
                                      <div
                                        key={b.id}
                                        className={`gcal-event-badge status-${statusClass}`}
                                        title={`${b.startTime} - ${b.endTime}: ${targetUser?.fullname || 'Lịch hẹn'}`}
                                      >
                                        <span className={`gcal-event-dot status-${statusClass}`} />
                                        <span style={{ fontWeight: 800, marginRight: 2 }}>{shortTime}</span>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{targetUser?.fullname || 'Lịch hẹn'}</span>
                                      </div>
                                    );
                                  })}

                                  {displayAvails.map((avail, aIdx) => (
                                    <div
                                      key={`cal-avail-${aIdx}`}
                                      className="gcal-event-badge"
                                      style={{
                                        background: '#dcfce7',
                                        color: '#15803d',
                                        borderLeft: '2.5px solid #22c55e',
                                        padding: '2px 4px',
                                        borderRadius: '3px',
                                        fontSize: '11px',
                                        marginBottom: '2px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }}
                                      title={`Giờ rảnh còn trống: ${avail.startTime} - ${avail.endTime}`}
                                    >
                                      <span className="gcal-event-dot" style={{ backgroundColor: '#22c55e' }} />
                                      <span style={{ fontWeight: 800, marginRight: 2 }}>
                                        {formatTimeToGCal(avail.startTime)}
                                      </span>
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Rảnh</span>
                                    </div>
                                  ))}

                                  {extraCount > 0 && (
                                    <div className="gcal-more-indicator">
                                      + {extraCount} mục khác
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Timeline & Details View */}
                      <div className="gcal-timeline-layout">
                        {/* Vertical Timeline */}
                        <div className="gcal-timeline-section">
                          <h6 className="gcal-timeline-title">
                            <i className="bi bi-clock-history" style={{ color: '#f27125' }} />
                            Khung thời gian ngày {selectedDateStr.split('-')[2]}/{selectedDateStr.split('-')[1]}/{selectedDateStr.split('-')[0]}
                          </h6>
                          <p className="gcal-timeline-subtitle">
                            Hiển thị các khung giờ rảnh bạn thiết lập và các lịch hẹn đè lên trục thời gian.
                          </p>
                          
                          <div className="gcal-timeline-scroller">
                             <div style={{ position: 'relative' }}>
                               {/* Absolute overlay container aligned exactly to the vertical grid border */}
                               <div style={{ position: 'absolute', top: 0, left: 56.5, right: 0, bottom: 0, pointerEvents: 'none' }}>
                                 <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'auto' }}>
                                   {selectedDateAvail.map((avail, sIdx) => {
                                     const { top, height } = getSlotPosition(avail.startTime, avail.endTime);
                                     return (
                                       <div
                                         key={sIdx}
                                         className="gcal-timeline-avail-block"
                                         style={{ top, height }}
                                         title={`Khung giờ rảnh: ${avail.startTime} - ${avail.endTime}`}
                                       >
                                         <span className="gcal-timeline-avail-title">Giờ rảnh</span>
                                         <span className="gcal-timeline-avail-time">{avail.startTime} - {avail.endTime}</span>
                                       </div>
                                     );
                                   })}
                                   
                                   {selectedDateBookings.map((booking, bIdx) => {
                                     const { top, height } = getSlotPosition(booking.startTime, booking.endTime);
                                     const isStudentView = activeTab === 'student';
                                     const targetUser = isStudentView ? booking.mentor : booking.student;
                                     const statusClass = booking.status.toLowerCase();
                                     return (
                                       <div
                                         key={`tb-${booking.id}`}
                                         className={`gcal-timeline-booking-block status-${statusClass}`}
                                         style={{ top, height }}
                                         title={`${booking.startTime} - ${booking.endTime}: ${targetUser?.fullname || 'Lịch hẹn'} (${booking.status})`}
                                       >
                                         <span className="gcal-timeline-booking-title">{targetUser?.fullname || 'Lịch hẹn'}</span>
                                         <span className="gcal-timeline-booking-time">{booking.startTime} - {booking.endTime}</span>
                                       </div>
                                     );
                                   })}

                                   {selectedDateBusy.map((busy, bIdx) => {
                                     const { top, height } = getSlotPosition(busy.startTime, busy.endTime);
                                     if (height <= 0) return null;
                                     return (
                                       <div
                                         key={`busy-${busy.id}-${bIdx}`}
                                         className="gcal-timeline-busy-block"
                                         style={{
                                           position: 'absolute',
                                           left: 0,
                                           right: 0,
                                           top,
                                           height,
                                           background: 'repeating-linear-gradient(45deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.08) 10px, rgba(239, 68, 68, 0.15) 10px, rgba(239, 68, 68, 0.15) 20px)',
                                           borderLeft: '4px solid #ef4444',
                                           borderRadius: '4px',
                                           padding: '4px 8px',
                                           fontSize: '11px',
                                           color: '#b91c1c',
                                           zIndex: 2,
                                           boxShadow: '0 2px 4px rgba(239, 68, 68, 0.05)',
                                           display: 'flex',
                                           flexDirection: 'column',
                                           justifyContent: 'center',
                                           pointerEvents: 'auto'
                                          }}
                                          title={`Lịch bận: ${busy.originalStartTime} - ${busy.originalEndTime}\nLý do: ${busy.reason}`}
                                       >
                                         <span style={{ fontWeight: 800 }}>🚨 LỊCH BẬN ({busy.adminApproved ? 'Đã duyệt' : 'Chờ duyệt'})</span>
                                         <span style={{ fontSize: '10px', opacity: 0.9, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                           {busy.reason}
                                         </span>
                                       </div>
                                     );
                                   })}
                                 </div>
                               </div>
                               
                               {hours.map((hr) => {
                                 const displayHour = hr < 12 ? `${hr}:00 AM` : hr === 12 ? '12:00 PM' : `${hr - 12}:00 PM`;
                                 return (
                                   <div key={hr} className="gcal-timeline-row">
                                    <div className="gcal-timeline-hour">{displayHour}</div>
                                    <div className="gcal-timeline-events-area"></div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        
                        {/* Daily Event Details */}
                        <div className="gcal-details-section">
                          <h6 className="gcal-timeline-title">
                            <i className="bi bi-card-text" style={{ color: '#f27125' }} />
                            Chi tiết lịch trình ({selectedDateBookings.length})
                          </h6>
                          <p className="gcal-timeline-subtitle" style={{ marginBottom: 8 }}>
                            Danh sách tất cả lịch đặt hẹn trong ngày.
                          </p>
                          
                          <div className="gcal-details-container" style={{ display: 'block', maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
                            {selectedDateBookings.length === 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: '#94a3b8', background: '#f8fafc', borderRadius: 16, border: '1px dashed #cbd5e1', textAlign: 'center', padding: 20 }}>
                                <i className="bi bi-calendar2-minus" style={{ fontSize: 32, marginBottom: 8, opacity: 0.7 }} />
                                <span style={{ fontSize: 13.5, fontWeight: 700, color: '#64748b' }}>Không có lịch hẹn nào</span>
                                <span style={{ fontSize: 11.5, opacity: 0.8, marginTop: 4 }}>
                                  {activeTab === 'student' ? 'Bạn chưa đặt lịch nào vào ngày này.' : 'Chưa có sinh viên nào đặt lịch với bạn.'}
                                </span>
                              </div>
                            ) : (
                              selectedDateBookings.map((booking) => {
                                const isStudentView = activeTab === 'student';
                                const targetUser = isStudentView ? booking.mentor : booking.student;
                                const statusInfo = getStatusInfo(booking.status, booking);
                                const cdt = getCountdownStatus(booking);
                                
                                return (
                                  <div key={booking.id} className={`gcal-detail-card status-${booking.status.toLowerCase()}`}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                      <img
                                        src={targetUser?.avatar && targetUser.avatar !== 'default.png'
                                          ? targetUser.avatar
                                          : `https://ui-avatars.com/api/?name=${targetUser?.fullname || 'User'}&background=random`}
                                        alt="avatar"
                                        style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #e2e8f0' }}
                                      />
                                      <div>
                                        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1e293b' }}>
                                          {targetUser?.fullname}
                                        </div>
                                        <div style={{ fontSize: 11.5, color: '#64748b' }}>
                                          {isStudentView ? 'Mentor' : 'Sinh viên'} · {targetUser?.major || 'Đang cập nhật'}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: '#334155', background: '#f8fafc', padding: 10, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 12 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 750 }}>
                                        <i className="bi bi-clock-fill" style={{ color: '#f27125' }} />
                                        {booking.startTime} - {booking.endTime} ({booking.duration} phút)
                                      </div>
                                      
                                      {booking.status === 'APPROVED' && cdt.text && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: cdt.isJoinable ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>
                                          <i className={`bi ${cdt.isJoinable ? 'bi-broadcast-pin' : 'bi-hourglass-split'}`} />
                                          {cdt.text}
                                        </div>
                                      )}
                                      
                                      {booking.note && (
                                        <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2, borderTop: '1px solid #e2e8f0', paddingTop: 4 }}>
                                          <strong>Ghi chú: </strong>{booking.note}
                                        </div>
                                      )}
                                      
                                      {(booking.status === 'REJECTED' || booking.status === 'CLOSED') && booking.rejectionReason && (
                                        <div style={{ fontSize: 11.5, color: '#dc3545', marginTop: 2, borderTop: '1px solid #e2e8f0', paddingTop: 4 }}>
                                          <strong>Lý do từ chối: </strong>{booking.rejectionReason}
                                        </div>
                                      )}

                                      {isStudentView && (booking.status === 'REJECTED' || booking.status === 'CANCELLED') && (
                                        <SuggestedMentorsWidget booking={booking} onSelectMentor={handleRebook} />
                                      )}
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                                      <span className={`bkp-status ${statusInfo.cls}`} style={{ marginRight: 'auto', padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center' }}>
                                        <i className={`bi ${statusInfo.icon}`} style={{ marginRight: 4 }} />
                                        {statusInfo.text}
                                      </span>
                                      
                                      {booking.status === 'APPROVED' && (
                                        <button
                                          onClick={() => handleJoinCall(booking)}
                                          disabled={!cdt.isJoinable || cdt.isClosed}
                                          className="bkp-btn-join"
                                          style={{ padding: '5px 10px', fontSize: 11.5 }}
                                        >
                                          <i className="bi bi-camera-video-fill" /> Vào Call
                                        </button>
                                      )}
                                      
                                      {isStudentView && (booking.status === 'REJECTED' || booking.status === 'CANCELLED') && (
                                        <button
                                          onClick={() => handleRebook(booking)}
                                          style={{
                                            padding: '5px 10px',
                                            fontSize: 11.5,
                                            background: 'rgba(34,197,94,0.1)',
                                            color: '#16a34a',
                                            border: '1px solid rgba(34,197,94,0.25)',
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4,
                                          }}
                                          title="Đặt lại lịch hẹn với mentor này"
                                        >
                                          <i className="bi bi-arrow-repeat" /> Đặt lại lịch
                                        </button>
                                      )}

                                      {isStudentView ? (
                                        (booking.status === 'PENDING' || booking.status === 'APPROVED') && !cdt.isClosed && (
                                          <button
                                            onClick={() => handleCancelBooking(booking.id)}
                                            className="bkp-btn-cancel"
                                            style={{ padding: '5px 10px', fontSize: 11.5 }}
                                          >
                                            Hủy lịch
                                          </button>
                                        )
                                      ) : (
                                        booking.status === 'PENDING' && (
                                          <>
                                            <button
                                              onClick={() => handleApproveBooking(booking.id)}
                                              className="bkp-btn-approve"
                                              style={{ padding: '5px 10px', fontSize: 11.5 }}
                                            >
                                              Duyệt
                                            </button>
                                            <button
                                              onClick={() => handleOpenRejectModal(booking)}
                                              className="bkp-btn-reject"
                                              style={{ padding: '5px 10px', fontSize: 11.5 }}
                                            >
                                              Từ chối
                                            </button>
                                          </>
                                        )
                                      )}
                                      
                                      {(booking.status === 'CANCELLED' || booking.status === 'REJECTED' || booking.status === 'CLOSED') && (
                                        <button
                                          onClick={() => handleDeleteBooking(booking.id)}
                                          className="bkp-btn-cancel"
                                          style={{ padding: '5px 10px', fontSize: 11.5, background: 'rgba(220,53,69,0.06)', color: '#dc3545', border: '1px solid rgba(220,53,69,0.1)' }}
                                        >
                                          <i className="bi bi-trash" /> Xóa
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
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
                            minDate={getLocalDateString()}
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
                              minDate={getLocalDateString()}
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
                    Chọn khoảng thời gian bạn bận. Hệ thống sẽ tự động hủy hàng loạt các lịch hẹn trùng và gửi thông báo tới sinh viên.
                  </p>

                  <form onSubmit={handleRegisterBusy} style={{ marginTop: 20 }}>
                    {/* Date selection & Time selection separate */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
                      {/* Bắt đầu bận */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label className="sch-time-label">Bắt đầu bận</label>
                          <button
                            type="button"
                            onClick={setToCurrentTime}
                            style={{
                              fontSize: '11px',
                              background: '#f3f4f6',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              padding: '2px 8px',
                              color: '#374151',
                              cursor: 'pointer',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            🕒 Lấy giờ hiện tại
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <CustomDatePicker
                            value={busyStartDate}
                            onChange={setBusyStartDate}
                            minDate={getLocalDateString()}
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
                        placeholder="Nhập lý do báo bận đột xuất..."
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

                  {/* Lịch sử báo bận (Vacation History) */}
                  <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px dashed #e5e7eb' }}>
                    <h6 className="sch-title" style={{ color: '#1f2937', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <span className="bkp-header-icon" style={{ width: 26, height: 26, fontSize: 11, backgroundColor: 'rgba(75, 85, 99, 0.1)', borderColor: 'rgba(75, 85, 99, 0.2)', color: '#4b5563' }}>
                        <i className="bi bi-clock-history" />
                      </span>
                      Lịch sử báo bận ({busyHistory.length})
                    </h6>

                    {loadingBusyHistory ? (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 80 }}>
                        <div style={{ width: 24, height: 24, border: '2px solid #e5e7eb', borderTopColor: '#ef4444', borderRadius: '50%', animation: 'bk-spin 0.7s linear infinite' }} />
                        <span style={{ marginLeft: 8, fontSize: 13, color: '#4b5563' }}>Đang tải lịch sử...</span>
                      </div>
                    ) : busyHistory.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 100, color: '#94a3b8', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1', textAlign: 'center', padding: 16 }}>
                        <span style={{ fontSize: 13 }}>Bạn chưa đăng ký báo bận lần nào.</span>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: '#ffffff' }}>
                          <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                              <th style={{ padding: '10px 14px', fontWeight: 600, color: '#374151' }}>Thời gian bận</th>
                              <th style={{ padding: '10px 14px', fontWeight: 600, color: '#374151' }}>Lý do</th>
                              <th style={{ padding: '10px 14px', fontWeight: 600, color: '#374151', textAlign: 'center' }}>Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {busyHistory.map((item) => {
                              const formatDateTimeStr = (isoStr: string) => {
                                if (!isoStr) return '';
                                const d = new Date(isoStr);
                                const day = String(d.getDate()).padStart(2, '0');
                                const month = String(d.getMonth() + 1).padStart(2, '0');
                                const year = d.getFullYear();
                                const hour = String(d.getHours()).padStart(2, '0');
                                const minute = String(d.getMinutes()).padStart(2, '0');
                                return `${day}/${month}/${year} ${hour}:${minute}`;
                              };

                              return (
                                <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                  <td style={{ padding: '12px 14px', color: '#1f2937', whiteSpace: 'nowrap' }}>
                                    <div style={{ fontWeight: 600 }}>{formatDateTimeStr(item.startTime)}</div>
                                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>đến {formatDateTimeStr(item.endTime)}</div>
                                  </td>
                                  <td style={{ padding: '12px 14px', color: '#4b5563', maxWidth: 220, wordWrap: 'break-word', whiteSpace: 'normal' }}>
                                    {item.reason}
                                  </td>
                                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                    <span style={{
                                      display: 'inline-block',
                                      padding: '3px 8px',
                                      borderRadius: '9999px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      background: item.adminApproved ? '#d1fae5' : '#fee2e2',
                                      color: item.adminApproved ? '#065f46' : '#991b1b'
                                    }}>
                                      {item.adminApproved ? 'Đã duyệt' : 'Chờ duyệt'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
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

      {/* Rebook Modal – re-open BookingModal with same mentor */}
      {rebookMentor && (
        <BookingModal
          isOpen={!!rebookMentor}
          onClose={() => {
            setRebookMentor(null);
            // Reload student bookings after potential new booking
            loadStudentBookings();
          }}
          mentor={rebookMentor}
        />
      )}
    </>
  );
}
