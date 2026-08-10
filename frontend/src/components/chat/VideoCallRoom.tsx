'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { fetchAPI } from '@/lib/api';

interface VideoCallRoomProps {
  roomId: string;
  user: { username: string; fullname: string };
  onLeaveRoom: () => void;
  bookingId?: number;
  duration?: number;
  startedAt?: string;
}

const POLL_INTERVAL_MS = 30_000;
const WARNING_THRESHOLD_SEC = 60;      // 60s (1 phút) để gia hạn
const EXTENSION_OPTIONS = [3, 5, 10, 15, 20, 25, 30]; // +1 phút để demo

const fmtTime = (secs: number) => {
  if (secs <= 0) return '00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const playBeep = (freq = 440, dur = 0.5) => {
  try {
    const ACtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!ACtx) return;
    const ctx = new ACtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq; osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + dur);
  } catch (_) { }
};

export default function VideoCallRoom({ roomId, user, onLeaveRoom, bookingId, duration, startedAt }: VideoCallRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const joinedRef = useRef(false);
  const zpRef = useRef<any>(null);
  const autoClosedRef = useRef(false);

  const [isInRoom, setIsInRoom] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (!startedAt || !duration) return 0;
    const end = new Date(startedAt).getTime() + duration * 60_000;
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  });
  const timeLeftRef = useRef<number>(timeLeft);

  const [showExtModal, setShowExtModal] = useState(false);
  const [modalShownOnce, setModalShownOnce] = useState(false);
  const [extCount, setExtCount] = useState(0);
  const [maxExt, setMaxExt] = useState(3);
  const [extMinutes, setExtMinutes] = useState(0);
  const [canExtend, setCanExtend] = useState(true);
  const [isExtending, setIsExtending] = useState(false);
  const [extMsg, setExtMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [allowedOptions, setAllowedOptions] = useState<number[]>(EXTENSION_OPTIONS);

  const fetchExtendLimit = useCallback(async () => {
    if (!bookingId) return;
    try {
      const data = await fetchAPI(`/api/bookings/${bookingId}/extend-limit`);
      if (data && data.allowedOptions) {
        setAllowedOptions(data.allowedOptions);
      }
    } catch (_) { }
  }, [bookingId]);

  const handleAutoClose = useCallback(async () => {
    if (autoClosedRef.current) return;
    autoClosedRef.current = true;
    try { zpRef.current?.destroy(); } catch (_) { }
    if (bookingId) {
      try {
        await fetchAPI(`/api/bookings/${bookingId}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'CLOSED', reason: 'Cuộc gọi tự động kết thúc do hết thời lượng' }),
        });
      } catch (_) { }
    }
    onLeaveRoom();
  }, [bookingId, onLeaveRoom]);

  const fetchRemaining = useCallback(async () => {
    if (!bookingId) return;
    try {
      const data = await fetchAPI(`/api/bookings/${bookingId}/remaining-time`);
      if (data.status !== 'APPROVED') { handleAutoClose(); return; }
      setExtCount(data.extensionCount ?? 0);
      setMaxExt(data.maxExtensions ?? 3);
      setExtMinutes(data.extendedMinutes ?? 0);
      setCanExtend(data.canExtend ?? true);
      if (data.remainingSeconds > timeLeftRef.current + 30) {
        timeLeftRef.current = data.remainingSeconds;
        setTimeLeft(data.remainingSeconds);
        setModalShownOnce(false);
        setShowExtModal(false);
      }
    } catch (_) { }
  }, [bookingId, handleAutoClose]);

  useEffect(() => {
    if (!startedAt || !duration || !bookingId) return;
    const tick = setInterval(() => {
      const newVal = Math.max(0, timeLeftRef.current - 1);
      timeLeftRef.current = newVal;
      setTimeLeft(newVal);
      if (newVal <= 0) { clearInterval(tick); handleAutoClose(); }
    }, 1000);
    const poll = setInterval(fetchRemaining, POLL_INTERVAL_MS);
    return () => { clearInterval(tick); clearInterval(poll); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, duration, bookingId]);

  // Chỉ hiển thị popup gia hạn & phát âm thanh khi người dùng đã THẬT SỰ JOIN vào phòng cuộc gọi
  useEffect(() => {
    if (isInRoom && timeLeft <= WARNING_THRESHOLD_SEC && timeLeft > 0 && !modalShownOnce) {
      setModalShownOnce(true);
      setShowExtModal(true);
      fetchExtendLimit(); // Quét và lấy giới hạn gia hạn thời gian thực
      playBeep(494, 0.5);
    }
    if (isInRoom && timeLeft === 60) playBeep(587, 0.6);
  }, [isInRoom, timeLeft, modalShownOnce, fetchExtendLimit]);

  // Fast poll (3s) khi popup đang hiển thị — detect gia hạn từ bên kia gần như tức thì
  useEffect(() => {
    if (!showExtModal || !bookingId) return;
    const fastPoll = setInterval(async () => {
      try {
        const data = await fetchAPI(`/api/bookings/${bookingId}/remaining-time`);
        if (data.remainingSeconds > timeLeftRef.current + 30) {
          timeLeftRef.current = data.remainingSeconds;
          setTimeLeft(data.remainingSeconds);
          setExtCount(data.extensionCount ?? 0);
          setMaxExt(data.maxExtensions ?? 3);
          setExtMinutes(data.extendedMinutes ?? 0);
          setCanExtend(data.canExtend ?? true);
          setModalShownOnce(false);
          setShowExtModal(false);
        }
      } catch (_) { }
    }, 3000);
    return () => clearInterval(fastPoll);
  }, [showExtModal, bookingId]);

  const handleExtend = async (mins: number) => {
    if (!bookingId || isExtending) return;
    setIsExtending(true); setExtMsg(null);
    try {
      const data = await fetchAPI(`/api/bookings/${bookingId}/extend`, {
        method: 'POST',
        body: JSON.stringify({ additionalMinutes: mins }),
      });
      timeLeftRef.current = data.remainingSeconds;
      setTimeLeft(data.remainingSeconds);
      setExtCount(data.extensionCount);
      setMaxExt(data.maxExtensions);
      setExtMinutes(data.extendedMinutes);
      setCanExtend(data.canExtend);
      setModalShownOnce(false);
      setExtMsg({ text: `Da gia han them ${mins} phut! Tong: ${data.newDuration} phut.`, ok: true });
      playBeep(523, 0.3);
      setTimeout(() => { setShowExtModal(false); setExtMsg(null); }, 1600);
    } catch (err: any) {
      setExtMsg({ text: err.message || 'Gia han that bai. Thu lai!', ok: false });
    } finally { setIsExtending(false); }
  };

  const handleEndFromModal = () => { setShowExtModal(false); handleAutoClose(); };

  useEffect(() => {
    if (!containerRef.current || joinedRef.current) return;
    joinedRef.current = true;
    const initZego = async () => {
      try {
        const appID = 1435055187;
        const serverSecret = 'b4651fdf344e4930bff5005595c6c0a4';
        const cleanUserId = String(user.username || 'user').replace(/[^a-zA-Z0-9_]/g, '_');
        const cleanRoomId = String(roomId || 'room_default').replace(/[^a-zA-Z0-9_]/g, '_');
        const userName = user.fullname || user.username || 'Nguoi dung';

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(appID, serverSecret, cleanRoomId, cleanUserId, userName);
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;
        zp.joinRoom({
          container: containerRef.current,
          scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
          showScreenSharingButton: true,
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: true,
          showPreJoinView: false,
          onJoinRoom: () => {
            setIsInRoom(true);
          },
          onLeaveRoom: () => {
            if (autoClosedRef.current) return;
            joinedRef.current = false;
            setIsInRoom(false);
            setTimeout(() => onLeaveRoom(), 500);
          },
        });
      } catch (err) {
        console.error('Loi khoi tao ZegoCloud:', err);
        joinedRef.current = false;
        try { zpRef.current?.destroy(); } catch (_) { }
      }
    };
    initZego();
    return () => { try { zpRef.current?.destroy(); } catch (_) { } joinedRef.current = false; };
  }, [roomId, user.username, user.fullname]);

  const isWarning = timeLeft <= WARNING_THRESHOLD_SEC && timeLeft > 0;
  const isCritical = timeLeft <= 60 && timeLeft > 0;
  const timerColor = isCritical ? '#ff4757' : isWarning ? '#FF9E67' : '#fff';
  const timerBorder = isCritical ? '#dc3545' : isWarning ? '#F27125' : 'rgba(242,113,37,0.4)';

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#111827', zIndex: 99999, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes blink   { 0%,100%{opacity:.4} 50%{opacity:1} }
        @keyframes pulse-r { 0%{box-shadow:0 0 0 0 rgba(220,53,69,.5)} 70%{box-shadow:0 0 0 10px rgba(220,53,69,0)} 100%{box-shadow:0 0 0 0 rgba(220,53,69,0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(60px) scale(.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes warnPulse { 0%,100%{transform:translateX(-50%) scale(1)} 50%{transform:translateX(-50%) scale(1.06)} }
      `}</style>

      {/* Timer Badge */}
      {startedAt && duration && bookingId !== undefined && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 100000, backgroundColor: 'rgba(17,24,39,0.88)', backdropFilter: 'blur(10px)',
          border: `1.5px solid ${timerBorder}`, padding: '8px 22px', borderRadius: 22,
          color: timerColor, fontWeight: 700, fontSize: 14.5,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
          animation: isCritical ? 'pulse-r 1s infinite' : isWarning ? 'warnPulse 1.4s infinite' : 'none',
        }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: isCritical ? '#dc3545' : isWarning ? '#F27125' : '#10b981', animation: 'blink 1s infinite' }} />
          <span>Thoi gian con lai: {fmtTime(timeLeft)}</span>
          {extCount > 0 && <span style={{ background: '#F27125', color: '#fff', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginLeft: 4 }}>+{extMinutes}ph</span>}
        </div>
      )}

      {/* Extension Modal */}
      {showExtModal && bookingId !== undefined && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100010, backgroundColor: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 16px 36px', animation: 'fadeIn 0.25s ease' }}>
          <div style={{ background: '#191C2A', borderRadius: 26, padding: '30px 24px 20px', width: '100%', maxWidth: 480, border: '1px solid rgba(255,152,0,0.3)', boxShadow: '0 0 40px rgba(255,152,0,0.2)', animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 32, margin: '0 auto 16px', background: 'rgba(255,152,0,0.12)', border: '1.5px solid rgba(255,152,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                &#9200;
              </div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Sap het thoi gian!</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15 }}>
                Con <span style={{ color: '#FF9800', fontWeight: 700 }}>{fmtTime(timeLeft)}</span> trong cuoc goi nay
              </div>
            </div>

            {/* Ext count */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
              Da gia han {extCount}/{maxExt} lan
            </div>

            {/* Feedback */}
            {extMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 10, padding: '10px 14px', marginBottom: 8, background: extMsg.ok ? 'rgba(76,175,80,0.18)' : 'rgba(244,67,54,0.18)', border: `1px solid ${extMsg.ok ? 'rgba(76,175,80,0.4)' : 'rgba(244,67,54,0.4)'}`, color: '#fff', fontSize: 13 }}>
                {extMsg.text}
              </div>
            )}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '18px 0' }} />

            {/* Extend buttons or limit msg */}
            {canExtend && allowedOptions.length > 0 ? (
              <>
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 13, marginBottom: 14 }}>Chon thoi gian gia han:</div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, overflowX: 'auto', paddingBottom: 10 }}>
                  {allowedOptions.map(mins => (
                    <button key={mins} onClick={() => handleExtend(mins)} disabled={isExtending}
                      style={{ minWidth: 80, flexShrink: 0, background: 'rgba(255,152,0,0.1)', border: '1.5px solid rgba(255,152,0,0.4)', borderRadius: 16, padding: '18px 0', cursor: isExtending ? 'not-allowed' : 'pointer', opacity: isExtending ? 0.5 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                      onMouseEnter={e => { if (!isExtending) e.currentTarget.style.background = 'rgba(255,152,0,0.22)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,152,0,0.1)'; }}>
                      <span style={{ fontSize: 18 }}>&#43;</span>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: 22 }}>+{mins}</span>
                      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>phut</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(255,152,0,0.08)', border: '1px solid rgba(255,152,0,0.22)', borderRadius: 12, padding: 14, marginBottom: 18 }}>
                <span>&#9888;&#65039;</span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6 }}>Da dat gioi han gia han ({maxExt} lan).<br />Cuoc goi se tu dong ket thuc khi het gio.</span>
              </div>
            )}

            {/* End call */}
            <button onClick={handleEndFromModal}
              style={{ width: '100%', padding: '15px 0', background: '#B71C1C', border: 'none', borderRadius: 14, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#C62828'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#B71C1C'; }}>
              &#128244; Ket thuc cuoc goi
            </button>

            {/* Dismiss */}
            {canExtend && (
              <button onClick={() => setShowExtModal(false)} style={{ width: '100%', padding: '10px 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer' }}>
                Dong canh bao &amp; tiep tuc goi
              </button>
            )}
          </div>
        </div>
      )}

      <div ref={containerRef} style={{ flex: 1, width: '100%' }} />
    </div>
  );
}
