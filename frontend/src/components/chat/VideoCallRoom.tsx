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
  
  // 1. CHỐT CHẶN: Đảm bảo ZegoCloud chỉ joinRoom đúng 1 lần duy nhất
  const joinedRef = useRef(false);

  useEffect(() => {
    // Nếu chưa render DOM hoặc đã join phòng rồi thì bỏ qua
    if (!containerRef.current || joinedRef.current) return;
    
    // Đánh dấu là đã join phòng
    joinedRef.current = true;

    const initZego = async () => {
      try {
        // BẠN THAY 2 THÔNG SỐ NÀY BẰNG APP_ID VÀ SERVER_SECRET LẤY TỪ ZEGOCLOUD NHÉ
        const appID = 123456789; 
        const serverSecret = "chuoi_ky_tu_secret_cua_ban"; 

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          roomId,
          user.username,
          user.fullname || "Người dùng PolyHUB"
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);

        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall, 
          },
          showScreenSharingButton: true,
          
          // 2. KHẮC PHỤC LỖI THIẾT BỊ (NotFoundError)
          turnOnMicrophoneWhenJoining: false, // Vào phòng sẽ mặc định tắt mic
          turnOnCameraWhenJoining: false,     // Vào phòng sẽ mặc định tắt camera
          showPreJoinView: true,              // Hiện màn hình chờ để user tự test camera trước
          
          onLeaveRoom: () => {
            joinedRef.current = false; // Reset lại trạng thái nếu user rời phòng
            onLeaveRoom();
          },
        });
      } catch (err) {
        console.error("Lỗi khởi tạo ZegoCloud: ", err);
      }
    };

    initZego();

    // Hàm dọn dẹp khi Component bị tắt đi
    return () => {
      joinedRef.current = false;
    };
    
  // 3. Xóa hàm onLeaveRoom và user dạng object nguyên khối khỏi mảng dependency
  // Chỉ nên phụ thuộc vào các giá trị string (primitive values)
  // eslint-disable-next-line react-hooks/exhaustive-deps
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