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
  const [selectedBookingForCall, setSelectedBookingForCall] = useState<Booking | null>(null);
  
  const [upcomingBooking, setUpcomingBooking] = useState<Booking | null>(null);
  const [dismissedBookingId, setDismissedBookingId] = useState<number | null>(null);
  
  // Rating Modal state
  const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);

  // Poll bookings
  useEffect(() => {
    if (!user) return;
    
    // Don't show popup if we are on bookings page, since they can join from there directly?
    // User requested: "pop-up này sẽ xem người dùng đang ở trang nào để hiển thị ở trang đó để người dùng ấn vào call video."
    // So we show it everywhere.
    if (activeCallRoomId) return; // already in call

    const checkBookings = async () => {
      try {
        const endpoint = user.role === 'MENTOR' ? '/api/bookings/mentor' : '/api/bookings/student';
        const data = await fetchAPI(endpoint);
        
        const now = new Date();
        const approvedBookings: Booking[] = (data || []).filter((b: Booking) => b.status === 'APPROVED');
        
        let joinableBooking: Booking | null = null;

        for (const booking of approvedBookings) {
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
        
        setUpcomingBooking(joinableBooking);
        
      } catch (err) {
        // ignore errors silently
      }
    };

    checkBookings();
    const interval = setInterval(checkBookings, 10000);
    return () => clearInterval(interval);
  }, [user, activeCallRoomId]);

  const handleJoinCall = async () => {
    if (!upcomingBooking) return;
    try {
      const updatedBooking = await fetchAPI(`/api/bookings/${upcomingBooking.id}/join`, { method: 'POST' });
      setSelectedBookingForCall(updatedBooking);
      setActiveCallRoomId(updatedBooking.roomId || `booking_${updatedBooking.id}`);
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
  
  const targetUser = user?.role === 'MENTOR' ? upcomingBooking?.student : upcomingBooking?.mentor;
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
          onLeaveRoom={() => {
            setActiveCallRoomId(null);
            
            // If student leaves the call, show rating modal
            if (user.role !== 'MENTOR') {
              setRatingBooking(selectedBookingForCall);
            }
            
            if (selectedBookingForCall) {
              setDismissedBookingId(selectedBookingForCall.id);
            }
            setSelectedBookingForCall(null);
          }}
          bookingId={selectedBookingForCall.id}
          duration={selectedBookingForCall.duration}
          startedAt={selectedBookingForCall.startedAt}
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
