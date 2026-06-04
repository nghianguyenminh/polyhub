'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI, API_BASE_URL } from '@/lib/api';
import Header from '@/components/layout/Header';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import '@/styles/chat.css';
import VideoCallRoom from '@/components/chat/VideoCallRoom';

function ChatContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get('userId');

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');

  const stompClientRef = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const [inCall, setInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadChatData = async () => {
      try {
        const url = `/api/chat-data${userIdParam ? `?userId=${userIdParam}` : ''}`;
        const data = await fetchAPI(url);

        setAllUsers(data.allUsers || []);
        if (data.targetUser) setTargetUser(data.targetUser);
        if (data.roomId) {
          setRoomId(data.roomId);
          roomIdRef.current = data.roomId;
          loadChatHistory(data.roomId);
        }
      } catch (err) {
        console.error('Failed to load chat data', err);
      }
    };
    if (user) loadChatData();
  }, [userIdParam, user]);

  const loadChatHistory = async (id: string) => {
    try {
      const history = await fetchAPI(`/api/chat/history?roomId=${id}`);
      setMessages(history || []);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  useEffect(() => {
    if (!roomId || !user) return;

    const socket = new SockJS(`${API_BASE_URL}/ws-chat`);
    const stompClient = new Client({
      webSocketFactory: () => socket as any,
      debug: (_str) => { },
      onConnect: () => {
        // Lắng nghe tin nhắn từ kênh chat
        stompClient.subscribe(`/topic/chat/${roomId}`, (message) => {
          const newMsg = JSON.parse(message.body);

          // 1. Kiểm tra nếu là lời mời gọi video
          if (newMsg.type === 'CALL_OFFER' && newMsg.senderId !== user.username) {
            setIncomingCall(newMsg);
            return; 
          }

          // 2. Kiểm tra nếu đối phương từ chối
          if (newMsg.type === 'CALL_REJECT' && newMsg.senderId !== user.username) {
            setInCall(false);
            alert("Đối phương đang bận hoặc đã từ chối cuộc gọi.");
            return;
          }

          // 3. Nếu là tin nhắn TEXT bình thường thì cập nhật vào khung chat
          setMessages((prev) => [...prev, newMsg]);

          // Cập nhật lại danh sách người dùng bên Sidebar
          const now = new Date().toISOString();
          setAllUsers(prev => {
            const updated = prev.map(u => {
              if (u.roomId === roomId) {
                return {
                  ...u,
                  lastMessage: newMsg.content,
                  lastSenderId: newMsg.senderId,
                  lastUpdated: now,
                  isLastMessageRead: false
                };
              }
              return u;
            });
            // Sắp xếp lại người nhắn gần nhất lên đầu
            return [...updated].sort((a, b) => {
              const da = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
              const db = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
              return db - da;
            });
          });
        });
      },
    });

    stompClient.activate();
    stompClientRef.current = stompClient;

    return () => {
      stompClient.deactivate();
    };
  }, [roomId, user]);


  const handleStartVideoCall = () => {
    // Thêm !user vào câu điều kiện
    if (!roomId || !targetUser || !user || !stompClientRef.current) return;

    // 1. Gửi tín hiệu gọi video qua WebSocket
    const callOfferMsg = {
      roomId: roomId,
      senderId: user.username, // Bây giờ TypeScript đã hiểu user chắc chắn có dữ liệu
      content: "Đang gọi video...",
      type: "CALL_OFFER"
    };
    stompClientRef.current.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(callOfferMsg)
    });

    // 2. Mở thẳng phòng chờ video
    setInCall(true);
  };


  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !stompClientRef.current || !roomId || !user) return;

    const chatMessage = {
      roomId: roomId,
      senderId: user.username,
      content: messageInput.trim(),
      isRead: false,
      timestamp: new Date().toISOString()
    };

    stompClientRef.current.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(chatMessage)
    });

    setMessageInput('');
  };

  const getAvatarUrl = (avatar: string | null, fullname: string) =>
    avatar && avatar !== 'default.png'
      ? avatar
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(fullname)}&background=F27125&color=fff&bold=true`;

  return (
    <div className="chat-page-wrapper">
      {/* ── Sidebar ── */}
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <button className="sidebar-back-btn" onClick={() => router.push('/')}>
            <i className="bi bi-chevron-left" />
            <span>Tin Nhắn</span>
          </button>

          <div className="sidebar-search">
            <i className="bi bi-search" />
            <input type="text" placeholder="Tìm kiếm tin nhắn…" />
          </div>
        </div>

        <div className="chat-list">
          {allUsers.map((u) => {
            const isActive = targetUser?.username === u.username;
            const isUnread =
              u.lastSenderId !== user?.username &&
              !u.isLastMessageRead &&
              u.lastMessage;

            return (
              <div
                key={u.username}
                onClick={() => router.push(`/chat?userId=${u.username}`)}
                className={`chat-item-card${isActive ? ' active' : ''}`}
              >
                <div className="avatar-wrapper">
                  <img
                    src={getAvatarUrl(u.avatar, u.fullname)}
                    alt={u.fullname}
                  />
                  {/* Uncomment to show online status: */}
                  {/* <span className="online-dot" /> */}
                </div>

                <div className="chat-item-info">
                  <div className="chat-item-name">{u.fullname}</div>
                  <div className={`chat-item-preview${isUnread ? ' unread-text' : ''}`}>
                    <span>{u.lastMessage || 'Nhấn để trò chuyện'}</span>
                  </div>
                </div>

                {isUnread && <span className="unread-dot" />}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── Main chat ── */}
      <main className="chat-main">
        {targetUser ? (
          <>
            {/* Header */}
            <header className="chat-header">
              <div className="chat-header-info">
                <img
                  src={getAvatarUrl(targetUser.avatar, targetUser.fullname)}
                  alt={targetUser.fullname}
                  className="chat-header-avatar"
                />
                <div>
                  <div className="chat-header-name">{targetUser.fullname}</div>
                  <div className="chat-header-status">
                    <i className="bi bi-circle-fill" />
                    Online
                  </div>
                </div>
              </div>

              <div className="chat-header-actions">
                <button className="header-action-btn" onClick={handleStartVideoCall}  title="Gọi video">
                  <i className="bi bi-camera-video-fill" />
                </button>
              </div>
            </header>

            {/* Messages */}
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-empty-state">
                  <div className="empty-icon">
                    <i className="bi bi-chat-square-quote-fill" />
                  </div>
                  <p>Chưa có tin nhắn nào. Hãy là người bắt đầu câu chuyện! 👋</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isSent = msg.senderId === user?.username;
                  const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div key={idx} className={`msg-row${isSent ? ' sent' : ' recv'}`}>
                      {!isSent && (
                        <img
                          src={getAvatarUrl(targetUser.avatar, targetUser.fullname)}
                          alt="avatar"
                          className="msg-avatar"
                        />
                      )}
                      <div className="msg-group">
                        <div className={`msg-bubble${isSent ? ' msg-sent' : ' msg-received'}`}>
                          {msg.content}
                        </div>
                        <div className="msg-time">{timeStr}</div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer input */}
            <footer className="chat-footer">
              <form onSubmit={sendMessage}>
                <div className="chat-input-bar">
                  <button type="button" className="attach-btn" title="Đính kèm tệp">
                    <i className="bi bi-paperclip" />
                  </button>

                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Nhập tin nhắn…"
                    autoComplete="off"
                  />

                  <button
                    type="submit"
                    className="send-btn"
                    disabled={!messageInput.trim()}
                    title="Gửi"
                  >
                    <i className="bi bi-send-fill" />
                  </button>
                </div>
              </form>
            </footer>
          </>
        ) : (
          /* No conversation selected */
          <div className="chat-no-selection">
            <div className="no-sel-icon">
              <i className="bi bi-chat-heart-fill" />
            </div>
            <h5>Chào mừng đến PolyHUB Chat</h5>
            <p>Chọn một người trong danh sách để bắt đầu cuộc trò chuyện</p>
          </div>
        )}

        {/* POP-UP CÓ NGƯỜI GỌI TỚI */}
    {incomingCall && !inCall && (
      <div className="incoming-call-modal shadow-lg rounded-4 p-4 text-center bg-white" style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
        <h5 className="mb-3 text-dark fw-bold">Có cuộc gọi video tới</h5>
        <div className="d-flex gap-3 justify-content-center">
          <button 
            className="btn btn-success rounded-pill px-4" 
            onClick={() => { setInCall(true); setIncomingCall(null); }}
          >
            <i className="bi bi-telephone-fill me-2"></i> Trả lời
          </button>
          <button 
            className="btn btn-danger rounded-pill px-4" 
            onClick={() => {
              setIncomingCall(null);
              if (!user) return; // Thêm dòng này để loại bỏ lỗi 'user' is possibly 'null'
              stompClientRef.current?.publish({
                destination: '/app/chat.sendMessage',
                body: JSON.stringify({ roomId, senderId: user.username, content: "Đã từ chối cuộc gọi", type: "CALL_REJECT" })
              });
            }}
          >
            Từ chối
          </button>
        </div>
      </div>
    )}

    {/* COMPONENT VIDEO CALL (Thêm && user vào điều kiện hiển thị) */}
    {inCall && roomId && user && (
      <VideoCallRoom 
        roomId={roomId} 
        user={user} 
        onLeaveRoom={() => setInCall(false)} 
      />
    )}
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div
            style={{
              height: 'calc(100vh - 60px)',
              marginTop: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                border: '3px solid #F0F2F5',
                borderTop: '3px solid #F27125',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        }
      >
        <ChatContent />
      </Suspense>
    </>
  );
}
