'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { fetchAPI } from '@/lib/api';

interface VideoCallRoomProps {
  roomId: string;
  user: { username: string; fullname: string };
  onLeaveRoom: () => void;
  bookingId?: number;
  duration?: number; // minutes
  startedAt?: string; // ISO String
}

export default function VideoCallRoom({
  roomId,
  user,
  onLeaveRoom,
  bookingId,
  duration,
  startedAt,
}: VideoCallRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const joinedRef = useRef(false);
  const zpRef = useRef<any>(null);
  const autoClosedRef = useRef(false);



  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (!startedAt || !duration) return 0;
    const endTime = new Date(startedAt).getTime() + duration * 60000;
    return Math.max(0, Math.floor((endTime - Date.now()) / 1000));
  });

  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [warningType, setWarningType] = useState<'info' | 'warning' | 'danger'>('info');

  const playBeep = (freq = 440, beepDuration = 0.5) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + beepDuration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + beepDuration);
    } catch (e) {
      console.warn("Lỗi phát âm thanh cảnh báo: ", e);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAutoClose = async () => {

      if (autoClosedRef.current) return; // ← guard chống gọi 2 lần
          autoClosedRef.current = true;

    try {
      if (zpRef.current) {
        zpRef.current.destroy();
      }
    } catch (e) {
      console.warn("ZegoCloud destroy error:", e);
    }

    if (bookingId) {
      try {
        await fetchAPI(`/api/bookings/${bookingId}/status`, {
          method: 'PUT',
          body: JSON.stringify({
            status: 'CLOSED',
            reason: 'Cuộc gọi tự động kết thúc do hết thời lượng.'
          })
        });
      } catch (e) {
        console.error("Lỗi cập nhật trạng thái cuộc gọi:", e);
      }
    }

    onLeaveRoom();
  };

  // Timer tick effect
  useEffect(() => {
    if (!startedAt || !duration || !bookingId) return;

    const endTime = new Date(startedAt).getTime() + duration * 60000;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);

      // Warning milestones
      if (remaining === 600) {
        setWarningMessage("Cuộc gọi sẽ tự động kết thúc sau 10 phút nữa!");
        setWarningType("info");
        playBeep(440, 0.4);
      } else if (remaining === 300) {
        setWarningMessage("Cuộc gọi sẽ tự động kết thúc sau 5 phút nữa!");
        setWarningType("warning");
        playBeep(494, 0.5);
      } else if (remaining === 60) {
        setWarningMessage("Cảnh báo: Chỉ còn 1 phút cuối cùng trước khi tự động kết thúc cuộc gọi!");
        setWarningType("danger");
        playBeep(587, 0.6);
      }

      if (remaining <= 0) {
        clearInterval(timer);
        handleAutoClose();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startedAt, duration, bookingId]);

  // Auto clear warnings after 8 seconds
  useEffect(() => {
    if (warningMessage) {
      const bannerTimer = setTimeout(() => {
        setWarningMessage(null);
      }, 8000);
      return () => clearTimeout(bannerTimer);
    }
  }, [warningMessage]);

  useEffect(() => {
    if (!containerRef.current || joinedRef.current) return;
    joinedRef.current = true;

    const initZego = async () => {
      try {
        const appID = 1435055187;
        const serverSecret = "b4651fdf344e4930bff5005595c6c0a4";

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          roomId,
          user.username,
          user.fullname || "Người dùng"
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          showScreenSharingButton: true,
          turnOnMicrophoneWhenJoining: false,
          turnOnCameraWhenJoining: false,
          showPreJoinView: true,
          onLeaveRoom: () => {
            if (autoClosedRef.current) return; // Nếu đã tự động đóng, bỏ qua callback này
            joinedRef.current = false;
            setTimeout(() => {
              onLeaveRoom();
            }, 500);
          },
        });
      } catch (err) {
        console.error("Lỗi khởi tạo ZegoCloud: ", err);
        joinedRef.current = false;

        try {
          if (zpRef.current) zpRef.current.destroy();
        } catch (e) {}
      }
    };

    initZego();

    return () => {
      try {
        if (zpRef.current) {
          zpRef.current.destroy();
        }
      } catch (error) {
        console.warn("ZegoCloud tự dọn dẹp bị lỗi, nhưng React đã an toàn.");
      }
      joinedRef.current = false;
    };
  }, [roomId, user.username, user.fullname]);

  return (
    <div
      className="video-call-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#111827',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        @keyframes slideDown {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.5); }
          70% { box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
        }
      `}</style>

      {/* Floating Timer Badge (Only render if booking props are provided) */}
      {startedAt && duration && bookingId !== undefined && (
        <div
          className="call-timer-badge"
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100000,
            backgroundColor: 'rgba(17, 24, 39, 0.85)',
            backdropFilter: 'blur(8px)',
            border: `1.5px solid ${timeLeft < 60 ? '#dc3545' : (timeLeft < 300 ? '#F27125' : 'rgba(242, 113, 37, 0.4)')}`,
            padding: '8px 20px',
            borderRadius: '20px',
            color: timeLeft < 60 ? '#ff6b6b' : (timeLeft < 300 ? '#FF9E67' : '#fff'),
            fontWeight: 'bold',
            fontSize: '14.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            animation: timeLeft < 60 ? 'pulse-red 1s infinite' : 'none',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: timeLeft < 60 ? '#dc3545' : (timeLeft < 300 ? '#F27125' : '#10b981'),
              animation: 'blink 1s infinite',
            }}
          />
          <span>Thời gian còn lại: {formatTime(timeLeft)}</span>
        </div>
      )}

      {/* Warning Banners (Only render if booking props are provided) */}
      {startedAt && duration && bookingId !== undefined && warningMessage && (
        <div
          className="alert-banner"
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100001,
            padding: '12px 24px',
            borderRadius: '30px',
            backgroundColor: warningType === 'danger' ? '#dc3545' : (warningType === 'warning' ? '#F27125' : '#0ea5e9'),
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <i className={`bi ${warningType === 'danger' ? 'bi-exclamation-octagon-fill' : 'bi-exclamation-triangle-fill'}`}></i>
          <span>{warningMessage}</span>
          <button
            onClick={() => setWarningMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: 0,
              marginLeft: '8px',
              opacity: 0.8,
              fontSize: '16px',
            }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      )}

      <div ref={containerRef} style={{ flex: 1, width: '100%' }} />
    </div>
  );
}