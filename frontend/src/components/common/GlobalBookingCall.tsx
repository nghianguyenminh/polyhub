'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { fetchAPI } from '@/lib/api';
import dynamic from 'next/dynamic';
import '@/styles/chat.css';
import RatingModal from '@/components/common/RatingModal';

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
  roomId?: string;
  startedAt?: string;
}

export default function GlobalBookingCall() {
  const { user } = useAuth();
  const { showError } = useToast();
  
  const [activeCallRoomId, setActiveCallRoomId] = useState<string | null>(null);
  const activeCallRoomIdRef = React.useRef<string | null>(null);
  activeCallRoomIdRef.current = activeCallRoomId;

  const [selectedBookingForCall, setSelectedBookingForCall] = useState<Booking | null>(null);
  const selectedBookingForCallRef = React.useRef<Booking | null>(null);
  selectedBookingForCallRef.current = selectedBookingForCall;
  
  const [upcomingBooking, setUpcomingBooking] = useState<Booking | null>(null);
  const [dismissedBookingId, setDismissedBookingId] = useState<number | null>(null);
  
  // Rating Modal state
  const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);

  const isMentor = user?.role === 'MENTOR' || (typeof user?.role === 'object' && (user?.role as any)?.id === 'MENTOR');

  const callStartTimeRef = React.useRef<number>(0);

  // Lắng nghe sự kiện mở cuộc gọi từ bất kỳ trang nào (ví dụ trang /bookings)
  useEffect(() => {
    const handleCustomCallEvent = (e: any) => {
      const booking = e.detail;
      if (booking) {
        const roomId = booking.roomId || `booking_${booking.id}`;
        callStartTimeRef.current = Date.now();
        activeCallRoomIdRef.current = roomId;
        selectedBookingForCallRef.current = booking;
        setSelectedBookingForCall(booking);
        setActiveCallRoomId(roomId);
        setUpcomingBooking(null);
      }
    };
    window.addEventListener('open-video-call', handleCustomCallEvent);
    return () => window.removeEventListener('open-video-call', handleCustomCallEvent);
  }, []);

  // Poll bookings
  useEffect(() => {
    if (!user) return;

    const checkBookings = async () => {
      if (activeCallRoomIdRef.current) return; // Không poll popup khi đang trong cuộc gọi
      try {
        const endpoint = isMentor ? '/api/bookings/mentor' : '/api/bookings/student';
        const data = await fetchAPI(endpoint);
        
        if (activeCallRoomIdRef.current) return; // Double check

        const now = new Date();
        const approvedBookings: Booking[] = (data || []).filter((b: Booking) => b.status === 'APPROVED');
        
        let joinableBooking: Booking | null = null;

        for (const booking of approvedBookings) {
          if (dismissedBookingId && booking.id === dismissedBookingId) continue;

          const startDateTime = new Date(`${booking.bookingDate}T${booking.startTime}`);
          const limitDateTime = new Date(startDateTime.getTime() + 10 * 60 * 1000);
          const diff = startDateTime.getTime() - now.getTime();

          let isJoinable = false;
          let isClosed = false;

          if (diff <= 0) {
            if (booking.startedAt != null) {
              const actualEnd = new Date(new Date(booking.startedAt).getTime() + booking.duration * 60 * 1000);
              if (now.getTime() > actualEnd.getTime()) {
                isClosed = true;
              } else {
                isJoinable = true;
              }
            } else {
              if (now.getTime() > limitDateTime.getTime()) {
                isClosed = true;
              } else {
                isJoinable = true;
              }
            }
          }

          if (isJoinable && !isClosed) {
            joinableBooking = booking;
            break; 
          }
        }
        
        if (!activeCallRoomIdRef.current) {
          setUpcomingBooking(joinableBooking);
        }
      } catch (err) {
        // ignore errors silently
      }
    };

    checkBookings();
    const interval = setInterval(checkBookings, 10000);
    return () => clearInterval(interval);
  }, [user, isMentor, dismissedBookingId]);

  const handleJoinCall = async () => {
    if (!upcomingBooking) return;
    try {
      const updatedBooking = await fetchAPI(`/api/bookings/${upcomingBooking.id}/join`, { method: 'POST' });
      const roomId = updatedBooking.roomId || `booking_${updatedBooking.id}`;
      callStartTimeRef.current = Date.now();
      activeCallRoomIdRef.current = roomId;
      selectedBookingForCallRef.current = updatedBooking;
      setSelectedBookingForCall(updatedBooking);
      setActiveCallRoomId(roomId);
      setUpcomingBooking(null);
    } catch (err: any) {
      showError(err.message || 'Không thể tham gia cuộc gọi vào lúc này.');
    }
  };

  const getAvatarUrl = (avatar: string | null, fullname: string) =>
    avatar && avatar !== 'default.png'
      ? avatar
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(fullname)}&background=F27125&color=fff&bold=true`;

  const handleDismiss = () => {
    if (upcomingBooking) {
      setDismissedBookingId(upcomingBooking.id);
    }
    setUpcomingBooking(null);
  };

  // Modal xác nhận kết thúc booking khi rời phòng sớm
  const [pendingLeaveBooking, setPendingLeaveBooking] = useState<Booking | null>(null);
  const [isClosingBooking, setIsClosingBooking] = useState<boolean>(false);

  const handleLeaveRoom = React.useCallback(() => {
    const currentBooking = selectedBookingForCallRef.current;
    setActiveCallRoomId(null);
    setSelectedBookingForCall(null);
    
    if (currentBooking) {
      setDismissedBookingId(currentBooking.id);
      // Mở modal hỏi người dùng có muốn kết thúc luôn buổi tư vấn hay chỉ tạm thời rời phòng
      setPendingLeaveBooking(currentBooking);
    }
  }, []);

  const handleConfirmEndSession = async () => {
    if (!pendingLeaveBooking || isClosingBooking) return;
    setIsClosingBooking(true);
    try {
      await fetchAPI(`/api/bookings/${pendingLeaveBooking.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'CLOSED',
          reason: 'Buổi tư vấn đã được người tham gia xác nhận kết thúc.'
        })
      });
      // Nếu là học viên, hiện modal đánh giá
      if (!isMentor) {
        setRatingBooking(pendingLeaveBooking);
      }
      window.dispatchEvent(new CustomEvent('refresh-bookings'));
      window.dispatchEvent(new CustomEvent('refresh-coins'));
      window.dispatchEvent(new CustomEvent('refresh-user'));
    } catch (err: any) {
      showError(err.message || 'Không thể kết thúc lịch hẹn');
    } finally {
      setIsClosingBooking(false);
      setPendingLeaveBooking(null);
    }
  };

  const handleCancelEndSession = () => {
    // Chỉ tạm thời rời phòng, vẫn giữ booking APPROVED
    setPendingLeaveBooking(null);
  };
  
  const targetUser = isMentor ? upcomingBooking?.student : upcomingBooking?.mentor;
  const showPopup = upcomingBooking && upcomingBooking.id !== dismissedBookingId && !activeCallRoomId;

  return (
    <>
      {showPopup && targetUser && (
        <div className="incoming-call-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="incoming-call-card">
            <div className="incoming-call-rings">
              <div className="ring ring-1" />
              <div className="ring ring-2" />
              <div className="ring ring-3" />
              <img
                src={getAvatarUrl(targetUser.avatar, targetUser.fullname)}
                alt={targetUser.fullname}
                className="incoming-call-avatar"
              />
            </div>
            <div className="incoming-call-info">
              <div className="incoming-call-name">{targetUser.fullname}</div>
              <div className="incoming-call-label">
                <i className="bi bi-camera-video-fill" />
                Đến giờ lịch hẹn video của bạn...
              </div>
            </div>
            <div className="incoming-call-actions">
              <button
                className="call-action-btn call-reject"
                title="Bỏ qua"
                onClick={handleDismiss}
              >
                <i className="bi bi-x-lg" />
              </button>
              <button
                className="call-action-btn call-accept"
                title="Tham gia"
                onClick={handleJoinCall}
              >
                <i className="bi bi-camera-video-fill" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {activeCallRoomId && user && selectedBookingForCall && (
        <VideoCallRoom
          roomId={activeCallRoomId}
          user={{ username: user.username, fullname: user.fullname }}
          onLeaveRoom={handleLeaveRoom}
          bookingId={selectedBookingForCall.id}
          duration={selectedBookingForCall.duration}
          startedAt={selectedBookingForCall.startedAt}
        />
      )}

      {/* Modal xác nhận kết thúc buổi tư vấn */}
      {pendingLeaveBooking && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100020,
          backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: '#1e293b', borderRadius: '20px', padding: '28px 24px',
            width: '100%', maxWidth: '440px', border: '1px solid rgba(242,113,37,0.3)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)', textAlign: 'center', color: '#fff'
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              backgroundColor: 'rgba(242,113,37,0.15)', color: '#F27125',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', margin: '0 auto 16px'
            }}>
              <i className="bi bi-telephone-x-fill" />
            </div>

            <h3 style={{ fontSize: '19px', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>
              Xác nhận kết thúc buổi tư vấn
            </h3>

            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: '22px' }}>
              Bạn vừa rời phòng gọi video. Bạn có muốn <strong>kết thúc luôn buổi tư vấn này</strong> không?
              <br /><span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>(Nếu kết thúc, lịch hẹn sẽ chuyển sang Hoàn thành và mở phần Đánh giá)</span>
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleCancelEndSession}
                disabled={isClosingBooking}
                style={{
                  flex: 1, padding: '11px 16px', borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.08)', color: '#cbd5e1',
                  border: '1px solid rgba(255,255,255,0.15)', fontWeight: 600,
                  fontSize: '14px', cursor: 'pointer'
                }}
              >
                Tạm rời phòng
              </button>

              <button
                onClick={handleConfirmEndSession}
                disabled={isClosingBooking}
                style={{
                  flex: 1, padding: '11px 16px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #F27125 0%, #E05A0E 100%)', color: '#fff',
                  border: 'none', fontWeight: 600, fontSize: '14px',
                  cursor: isClosingBooking ? 'not-allowed' : 'pointer',
                  opacity: isClosingBooking ? 0.6 : 1,
                  boxShadow: '0 4px 14px rgba(242,113,37,0.4)'
                }}
              >
                {isClosingBooking ? 'Đang xử lý...' : 'Kết thúc buổi tư vấn'}
              </button>
            </div>
          </div>
        </div>
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
