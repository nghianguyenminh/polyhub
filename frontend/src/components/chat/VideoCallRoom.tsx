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

  useEffect(() => {
    if (!containerRef.current) return;

    const initZego = async () => {
      // BẠN THAY 2 THÔNG SỐ NÀY BẰNG APP_ID VÀ SERVER_SECRET LẤY TỪ ZEGOCLOUD CONSOLE NHÉ
      const appID = 123456789; // Dạng số
      const serverSecret = "chuoi_ky_tu_secret_cua_ban"; 

      // 1. Tạo Token xác thực (Tạm thời chạy ở Client để test, sau này ta có thể chuyển vào Backend)
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomId,
        user.username,
        user.fullname || "Người dùng PolyHUB"
      );

      // 2. Khởi tạo đối tượng UI Kit
      const zp = ZegoUIKitPrebuilt.create(kitToken);

      // 3. Render giao diện gọi video vào thẻ div container
      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall, // Chế độ gọi 1-1
        },
        showScreenSharingButton: true, // Kích hoạt tính năng share màn hình cực kỳ quan trọng cho Mentor
        onLeaveRoom: () => {
          onLeaveRoom(); // Đóng component khi ấn nút cúp máy
        },
      });
    };

    initZego();
  }, [roomId, user, onLeaveRoom]);

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