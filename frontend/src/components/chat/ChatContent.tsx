'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI, API_BASE_URL } from '@/lib/api';
import { Client } from '@stomp/stompjs';
import VideoCallRoom from '@/components/chat/VideoCallRoom';

export default function ChatContent() {
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
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);

  const EMOJIS = ['👍', '❤️', '😂', '😮', '😢'];

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
      const filtered = (history || []).filter(
        (m: any) => !m.type || m.type === 'TEXT' || m.type === 'CALL_ENDED'
      );
      setMessages(filtered);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  useEffect(() => {
    if (!roomId || !user) return;

    const SockJS = require('sockjs-client');
    const socket = new SockJS(`${API_BASE_URL}/ws-chat`);
    const stompClient = new Client({
      webSocketFactory: () => socket as any,
      debug: (_str) => { },
      onConnect: () => {
        stompClient.subscribe(`/topic/chat/${roomId}`, (message) => {
          const newMsg = JSON.parse(message.body);

          if (newMsg.type === 'CALL_OFFER') {
            if (newMsg.senderId !== user.username) {
              setIncomingCall(newMsg);
            }
            return;
          }

          if (newMsg.type === 'CALL_REJECT') {
            if (newMsg.senderId !== user.username) {
              setInCall(false);
              setIncomingCall(null);
            }
            return;
          }

          if (newMsg.type === 'CALL_ENDED') {
            setMessages((prev) => [...prev, newMsg]);
            setInCall(false);
            return;
          }

          if (newMsg.type === 'REACTION_UPDATED') {
            setMessages((prev) =>
              prev.map((m) => (m.id === newMsg.id ? { ...m, reactions: newMsg.reactions } : m))
            );
            return;
          }

          setMessages((prev) => [...prev, newMsg]);

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
    if (!roomId || !targetUser || !user || !stompClientRef.current) return;
    if (!stompClientRef.current.connected) {
      alert("Đang kết nối đến server chat, vui lòng thử lại sau giây lát.");
      return;
    }

    const callOfferMsg = {
      roomId: roomId,
      senderId: user.username,
      content: `${user.fullname || user.username} đang gọi video cho bạn`,
      type: "CALL_OFFER"
    };
    stompClientRef.current.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(callOfferMsg)
    });

    setInCall(true);
  };

  const handleLeaveRoom = () => {
    if (roomId && user && stompClientRef.current && stompClientRef.current.connected) {
      const callEndedMsg = {
        roomId: roomId,
        senderId: user.username,
        content: "Cuộc gọi video đã kết thúc",
        type: "CALL_ENDED"
      };
      stompClientRef.current.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(callEndedMsg)
      });
    }
    setInCall(false);
  };

  const handleSendReaction = (messageId: string, emoji: string) => {
    if (!stompClientRef.current || !roomId || !user) return;
    if (!stompClientRef.current.connected) return;

    const reactionMessage = {
      roomId: roomId,
      senderId: user.username,
      content: emoji,
      type: "REACTION",
      targetMessageId: messageId,
    };

    stompClientRef.current.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(reactionMessage)
    });
    setActiveReactionMsgId(null);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !stompClientRef.current || !roomId || !user) return;
    if (!stompClientRef.current.connected) {
      alert("Đang kết nối đến server chat, vui lòng thử lại sau giây lát.");
      return;
    }

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

      <main className="chat-main">
        {targetUser ? (
          <>
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
                {/* <button className="header-action-btn" onClick={handleStartVideoCall} title="Gọi video">
                  <i className="bi bi-camera-video-fill" />
                </button> */}
              </div>
            </header>

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

                  if (msg.type === 'CALL_ENDED') {
                    return (
                      <div key={idx} className="call-event-row">
                        <div className="call-event-badge">
                          <i className="bi bi-camera-video-fill" />
                          <span>
                            {isSent ? 'Bạn đã kết thúc cuộc gọi video' : `${targetUser.fullname} đã kết thúc cuộc gọi video`}
                          </span>
                          <span className="call-event-time">{timeStr}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={idx} className={`msg-row${isSent ? ' sent' : ' recv'}`}>
                      {!isSent && (
                        <img
                          src={getAvatarUrl(targetUser.avatar, targetUser.fullname)}
                          alt="avatar"
                          className="msg-avatar"
                        />
                      )}
                      <div className="msg-group" onMouseLeave={() => setActiveReactionMsgId(null)}>
                        {/* Reaction Trigger Button */}
                        {msg.id && (
                          <button
                            className="msg-reaction-btn"
                            onClick={() => setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id)}
                            title="Thả cảm xúc"
                          >
                            <i className="bi bi-emoji-smile" />
                          </button>
                        )}

                        {/* Reaction Picker Popup */}
                        {activeReactionMsgId === msg.id && (
                          <div className="reaction-picker">
                            {EMOJIS.map(emoji => (
                              <button
                                key={emoji}
                                className="reaction-emoji-btn"
                                onClick={() => handleSendReaction(msg.id, emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="msg-bubble-wrapper">
                          <div className={`msg-bubble${isSent ? ' msg-sent' : ' msg-received'}`}>
                            {msg.content}
                          </div>

                          {/* Reactions Display */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="msg-reactions-display">
                              {Array.from(new Set(Object.values(msg.reactions))).map((emoji: any, i) => (
                                <span key={i}>{emoji}</span>
                              ))}
                              <span style={{ marginLeft: 2, fontWeight: 600 }}>
                                {Object.keys(msg.reactions).length > 1 ? Object.keys(msg.reactions).length : ''}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="msg-time">{timeStr}</div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <footer className="chat-footer">
              <form onSubmit={sendMessage}>
                <div className="chat-input-bar">


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
          <div className="chat-no-selection">
            <div className="no-sel-icon">
              <i className="bi bi-chat-heart-fill" />
            </div>
            <h5>Chào mừng đến PolyHUB Chat</h5>
            <p>Chọn một người trong danh sách để bắt đầu cuộc trò chuyện</p>
          </div>
        )}

        {incomingCall && !inCall && (
          <div className="incoming-call-overlay">
            <div className="incoming-call-card">
              <div className="incoming-call-rings">
                <div className="ring ring-1" />
                <div className="ring ring-2" />
                <div className="ring ring-3" />
                <img
                  src={getAvatarUrl(targetUser?.avatar, targetUser?.fullname || 'Người dùng')}
                  alt={targetUser?.fullname}
                  className="incoming-call-avatar"
                />
              </div>
              <div className="incoming-call-info">
                <div className="incoming-call-name">{targetUser?.fullname || 'Ai đó'}</div>
                <div className="incoming-call-label">
                  <i className="bi bi-camera-video-fill" />
                  Đang gọi video cho bạn…
                </div>
              </div>
              <div className="incoming-call-actions">
                <button
                  className="call-action-btn call-reject"
                  title="Từ chối"
                  onClick={() => {
                    setIncomingCall(null);
                    if (!user) return;
                    stompClientRef.current?.publish({
                      destination: '/app/chat.sendMessage',
                      body: JSON.stringify({ roomId, senderId: user.username, content: "Đã từ chối cuộc gọi", type: "CALL_REJECT" })
                    });
                  }}
                >
                  <i className="bi bi-telephone-x-fill" />
                </button>
                <button
                  className="call-action-btn call-accept"
                  title="Trả lời"
                  onClick={() => { setInCall(true); setIncomingCall(null); }}
                >
                  <i className="bi bi-camera-video-fill" />
                </button>
              </div>
            </div>
          </div>
        )}

        {inCall && roomId && user && (
          <VideoCallRoom
            roomId={roomId}
            user={user}
            onLeaveRoom={handleLeaveRoom}
          />
        )}
      </main>
    </div>
  );
}
