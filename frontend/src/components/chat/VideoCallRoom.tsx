'use client';

import React, { useEffect, useRef } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

interface VideoCallRoomProps {
  roomId: string;
  user: { username: string; fullname: string };
  onLeaveRoom: () => void;
}

export default function VideoCallRoom({ roomId, user, onLeaveRoom }: VideoCallRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const joinedRef = useRef(false);
  const zpRef = useRef<any>(null); // Lưu trữ instance để dọn dẹp
  

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
        zpRef.current = zp; // Lưu lại

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
            joinedRef.current = false;
            setTimeout(() => {
              onLeaveRoom(); 
            }, 500);
          },
        });
      } catch (err) {
        console.error("Lỗi khởi tạo ZegoCloud: ", err);
        joinedRef.current = false;

       // THÊM ĐOẠN NÀY ĐỂ DỌN RÁC NẾU XẢY RA LỖI GIỮA CHỪNG
       try {
          if (zpRef.current) zpRef.current.destroy();
        } catch (e) {}

      }
    };

    initZego();

    // Dọn dẹp an toàn khi Component unmount
    return () => {
      try {
        if (zpRef.current) {
          zpRef.current.destroy(); 
        }
      } catch (error) {
        // Bỏ qua lỗi của Zego để không làm crash (sập) trang React
        console.warn("ZegoCloud tự dọn dẹp bị lỗi, nhưng React đã an toàn.");
      }
      joinedRef.current = false;
    };
  }, [roomId, user.username, user.fullname]);

  return (
    <div 
      className="video-call-overlay" 
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: '#111827', zIndex: 99999, display: 'flex', flexDirection: 'column'
      }}
    >
      <div ref={containerRef} style={{ flex: 1, width: '100%' }} />
    </div>
  );
}