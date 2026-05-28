'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI, API_BASE_URL } from '@/lib/api';
import Header from '@/components/layout/Header';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import '@/styles/chat.css';

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
      debug: (str) => {
        // console.log(str);
      },
      onConnect: () => {
        stompClient.subscribe(`/topic/chat/${roomId}`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          setMessages((prev) => [...prev, receivedMessage]);
          
          // Update last message in sidebar
          setAllUsers(prev => prev.map(u => {
            if (u.roomId === roomId) {
              return {
                ...u,
                lastMessage: receivedMessage.content,
                lastSenderId: receivedMessage.senderId,
                isLastMessageRead: false
              };
            }
            return u;
          }));
        });
      },
    });

    stompClient.activate();
    stompClientRef.current = stompClient;

    return () => {
      stompClient.deactivate();
    };
  }, [roomId, user]);

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

  return (
    <div className="chat-container vh-100 d-flex flex-column" style={{ paddingTop: '60px' }}>
      <div className="d-flex flex-grow-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="chat-sidebar border-end d-flex flex-column" style={{ width: '320px', flexShrink: 0 }}>
          <div className="p-3">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                <i className="bi bi-chevron-left fs-5"></i>
                <h5 className="fw-bold mb-0">Tin Nhắn</h5>
              </div>
            </div>
            <div className="search-box mb-3">
              <input type="text" className="form-control form-control-sm border-0 bg-light" placeholder="Tìm kiếm tin nhắn" />
            </div>
          </div>

          <div className="chat-list overflow-y-auto flex-grow-1 pb-3">
            {allUsers.map((u) => {
              const isActive = targetUser?.username === u.username;
              const isUnread = u.lastSenderId !== user?.username && !u.isLastMessageRead && u.lastMessage;
              
              return (
                <div 
                  key={u.username}
                  onClick={() => router.push(`/chat?userId=${u.username}`)}
                  className={`chat-item-card d-flex gap-3 p-3 text-decoration-none text-dark cursor-pointer mx-2 ${isActive ? 'active' : ''}`}
                >
                  <img 
                    src={u.avatar && u.avatar !== 'default.png' ? u.avatar : `https://ui-avatars.com/api/?name=${u.fullname}`} 
                    className="rounded-circle shadow-sm" 
                    width="48" 
                    height="48" 
                    alt="avatar"
                  />
                  <div className="flex-grow-1 overflow-hidden">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-1 fw-bold text-truncate">{u.fullname}</h6>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-1 gap-2">
                      <p className={`mb-0 text-muted small text-truncate opacity-75 ${isUnread ? 'unread-text' : ''}`}>
                        {u.lastMessage || 'Nhấn để trò chuyện'}
                      </p>
                      {isUnread && <span className="unread-dot"></span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="chat-main d-flex flex-column flex-grow-1 overflow-hidden position-relative">
          {targetUser ? (
            <>
              <header className="chat-header border-bottom p-3 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <img 
                    src={targetUser.avatar && targetUser.avatar !== 'default.png' ? targetUser.avatar : `https://ui-avatars.com/api/?name=${targetUser.fullname}`} 
                    className="rounded-circle shadow-sm" 
                    width="40" 
                    height="40" 
                    alt="avatar"
                  />
                  <div>
                    <h6 className="mb-0 fw-bold">{targetUser.fullname}</h6>
                    <span className="text-success small"><i className="bi bi-circle-fill me-1" style={{ fontSize: '8px' }}></i> Online</span>
                  </div>
                </div>
              </header>

              <div className="chat-messages p-4 flex-grow-1 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center mt-5 opacity-50">
                    <br/><br/>
                    <i className="bi bi-chat-square-quote fs-2" style={{ color: 'var(--poly-orange)' }}></i>
                    <p className="mt-3 fw-medium">Chưa có tin nhắn. Hãy là người bắt đầu câu chuyện! 👋</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isSent = msg.senderId === user?.username;
                    const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    if (isSent) {
                      return (
                        <div key={idx} className="d-flex flex-row-reverse gap-2 mb-3">
                          <div className="d-flex flex-column align-items-end" style={{ maxWidth: '75%' }}>
                            <div className="msg-bubble msg-sent">{msg.content}</div>
                            <div className="small mt-1 text-end text-muted opacity-75" style={{ fontSize: '10.5px', marginRight: '4px' }}>
                              {timeStr}
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={idx} className="d-flex gap-2 mb-3">
                          <img 
                            src={targetUser.avatar && targetUser.avatar !== 'default.png' ? targetUser.avatar : `https://ui-avatars.com/api/?name=${targetUser.fullname}`} 
                            className="rounded-circle shadow-sm flex-shrink-0" 
                            width="36" 
                            height="36" 
                            style={{ marginTop: '4px' }} 
                            alt="avatar"
                          />
                          <div className="d-flex flex-column align-items-start" style={{ maxWidth: '75%' }}>
                            <div className="msg-bubble msg-received">{msg.content}</div>
                            <div className="small mt-1 text-muted opacity-75" style={{ fontSize: '10.5px', marginLeft: '4px' }}>
                              {timeStr}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <footer className="chat-footer p-3 border-top">
                <form onSubmit={sendMessage} className="chat-input-wrapper d-flex align-items-center bg-white rounded-pill px-2 w-100 m-0">
                  <span className="attach-icon text-muted cursor-pointer me-2">
                    <i className="bi bi-paperclip fs-5"></i>
                  </span>
                  <input 
                    type="text" 
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="form-control border-0 bg-transparent shadow-none flex-grow-1 px-1" 
                    placeholder="Nhập tin nhắn..." 
                    autoComplete="off" 
                    style={{ outline: 'none' }} 
                  />
                  <button type="submit" className="btn send-btn p-0 border-0 shadow-none ms-2" disabled={!messageInput.trim()}>
                    <i className="bi bi-send-fill"></i>
                  </button>
                </form>
              </footer>
            </>
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100">
              <div className="text-center opacity-50">
                <i className="bi bi-chat-heart-fill" style={{ fontSize: '4rem', color: 'var(--poly-orange)' }}></i>
                <p className="mt-3 fw-medium fs-5">Chọn một người trong danh sách để bắt đầu trò chuyện</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="p-4 text-center"><div className="spinner-border text-primary" /></div>}>
        <ChatContent />
      </Suspense>
    </>
  );
}
