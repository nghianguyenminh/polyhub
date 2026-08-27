'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHr < 24) return `${diffHr} giờ trước`;
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

export default function Header() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const loadNotifications = async () => {
    try {
      const data = await fetchAPI('/api/notifications?page=1&size=20');
      const newNotifications = data.notifications || [];
      const newUnreadCount = data.unreadCount || 0;

      // Hiển thị Toast nếu có thông báo mới
      if (newUnreadCount > unreadCount && unreadCount !== 0) {
        const newNoti = newNotifications.find((n: any) => !n.isRead);
        if (newNoti) {
          toast.showInfo(`🔔 ${newNoti.message || 'Bạn có thông báo mới'}`);
        } else {
          toast.showInfo('🔔 Bạn có thông báo mới. Hãy kiểm tra hộp thư của bạn.');
        }
      }

      setNotifications(newNotifications);
      setUnreadCount(newUnreadCount);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Tự động kiểm tra thông báo mới sau mỗi 15 giây
      const interval = setInterval(loadNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await fetchAPI(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetchAPI('/api/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  const handleNotificationClick = async (noti: any) => {
    if (!noti.isRead) {
      await handleMarkAsRead(noti.id);
    }
    if (noti.type === 'FOLLOW' && noti.sender) {
      router.push(`/profile/${noti.sender.username}`);
    } else {
      router.push('/');
    }
  };

  return (
    <header className="poly-header fixed-top d-flex align-items-center px-3 px-md-4">
      <div className="d-flex align-items-center w-100 mx-auto justify-content-between" style={{ maxWidth: '100%' }}>

        <Link href="/" className="text-decoration-none d-flex align-items-center me-4">
          <h3 className="mb-0 fw-bold text-poly" style={{ letterSpacing: '-0.5px' }}>PolyHUB</h3>
        </Link>

        <div className="d-flex align-items-center gap-3">
          {/* Notifications Dropdown */}
          {user && (
            <div className="dropdown">
              <button
                className="btn-icon-circle position-relative shadow-none border-0"
                id="notificationDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                data-bs-auto-close="outside"
              >
                <i className="bi bi-bell-fill fs-5"></i>
                {unreadCount > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light"
                    style={{ marginTop: '10px', marginLeft: '-10px', fontSize: '9px', padding: '3px 5px' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <div className="dropdown-menu dropdown-menu-end poly-noti-dropdown p-0 shadow-lg border-0 mt-2" aria-labelledby="notificationDropdown" style={{ width: '380px', borderRadius: '16px', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
                <div className="p-3 d-flex justify-content-between align-items-center border-bottom bg-white">
                  <h5 className="fw-bold mb-0" style={{ fontSize: '18px', color: '#1c1e21' }}>Thông Báo</h5>
                  {unreadCount > 0 && (
                    <button
                      className="text-decoration-none fw-semibold btn btn-link p-0 shadow-none border-0"
                      style={{ color: 'var(--poly-orange, #F27125)', fontSize: '13.5px' }}
                      onClick={handleMarkAllAsRead}
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
                <div className="noti-list custom-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
                  {notifications.length === 0 ? (
                    <div className="p-5 text-center text-muted d-flex flex-column align-items-center">
                      <div className="mb-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', backgroundColor: '#f0f2f5' }}>
                        <i className="bi bi-bell-slash fs-3 text-secondary"></i>
                      </div>
                      <span className="fw-medium" style={{ fontSize: '14px' }}>Bạn chưa có thông báo nào.</span>
                    </div>
                  ) : (
                    notifications.map(noti => {
                      const isSystem = !noti.sender;
                      let displayTitle = isSystem ? 'Hệ thống' : noti.sender.fullname;
                      let displayBody = noti.message || '';

                      // Extract title in brackets if exists
                      const match = displayBody.match(/^【(.*?)】\s*(.*)$/);
                      if (match) {
                        displayTitle = match[1];
                        displayBody = match[2];
                      }

                      return (
                        <div
                          key={noti.id}
                          className={`noti-item d-flex gap-3 p-3 border-bottom transition-all position-relative`}
                          onClick={() => handleNotificationClick(noti)}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: !noti.isRead ? '#fff0e6' : '#ffffff',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = !noti.isRead ? '#ffe5d3' : '#f0f2f5')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = !noti.isRead ? '#fff0e6' : '#ffffff')}
                        >
                          {isSystem ? (
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-sm"
                              style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, var(--poly-orange, #F27125), #ff8a47)' }}
                            >
                              <i className="bi bi-robot fs-5"></i>
                            </div>
                          ) : (
                            <img
                              src={noti.sender.avatar && noti.sender.avatar !== 'default.png' ? noti.sender.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(noti.sender.fullname)}&background=random`}
                              className="rounded-circle flex-shrink-0 shadow-sm" width="48" height="48" alt="avatar"
                              style={{ objectFit: 'cover' }}
                            />
                          )}
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <strong className="text-truncate d-block" style={{ fontSize: '14px', color: '#050505', maxWidth: '85%' }}>
                                {displayTitle}
                              </strong>
                              {!noti.isRead && (
                                <span className="rounded-circle bg-danger flex-shrink-0 mt-1" style={{ width: '10px', height: '10px', boxShadow: '0 0 6px rgba(220,53,69,0.5)' }}></span>
                              )}
                            </div>
                            <p className="mb-1 text-wrap" style={{ fontSize: '13.5px', color: '#65676b', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {displayBody}
                            </p>
                            <span className="fw-medium" style={{ fontSize: '11.5px', color: !noti.isRead ? 'var(--poly-orange, #F27125)' : '#8a8d91' }}>
                              {formatTimeAgo(noti.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="p-3 border-top bg-white d-flex justify-content-center align-items-center">
                  <Link href="/bookings" className="btn w-100 rounded-pill fw-bold fs-7 shadow-sm" style={{ backgroundColor: '#fff0e6', color: 'var(--poly-orange, #F27125)', transition: '0.2s', border: '1px solid #ffe5d3' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--poly-orange, #F27125)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff0e6'; e.currentTarget.style.color = 'var(--poly-orange, #F27125)'; }}>
                    <i className="bi bi-camera-video-fill me-2"></i>Xem lịch hẹn call video
                  </Link>
                </div>
              </div>
            </div>
          )}

          {user && (
            <Link href="/chat" className="btn-icon-circle text-decoration-none shadow-none border-0 d-flex align-items-center justify-content-center">
              <i className="bi bi-chat-dots-fill fs-5"></i>
            </Link>
          )}

          {user ? (
            <div className="dropdown">
              <a href="#" className="d-flex align-items-center text-decoration-none border-0 shadow-none" id="dropdownUser" data-bs-toggle="dropdown" aria-expanded="false">
                <img
                  src={user.avatar && user.avatar !== 'default.png' ? user.avatar : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                  alt="User"
                  width="38"
                  height="38"
                  className="rounded-circle border border-2 border-white shadow-sm"
                  style={{ objectFit: 'cover' }}
                />
              </a>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2" aria-labelledby="dropdownUser" style={{ borderRadius: '10px' }}>
                {user && user.role && ['SUPER_ADMIN', 'ADMIN', 'USER_ADMIN', 'CONTENT_ADMIN'].includes(user.role) && (
                  <li>
                    <Link className="dropdown-item py-2 fw-medium d-flex align-items-center" href="/admin">
                      <i className="bi bi-shield-lock fs-5 me-2 text-muted"></i> Trang quản trị (Admin)
                    </Link>
                  </li>
                )}
                <li>
                  <Link className="dropdown-item py-2 fw-medium d-flex align-items-center" href={`/profile/${user.username}`}>
                    <i className="bi bi-person-circle fs-5 me-2 text-muted"></i> Trang cá nhân
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item py-2 fw-medium d-flex align-items-center" href="/settings">
                    <i className="bi bi-gear fs-5 me-2 text-muted"></i> Cài đặt & Quyền riêng tư
                  </Link>
                </li>
                {/* <li>
                  <Link className="dropdown-item py-2 fw-medium d-flex align-items-center" href="/wallet">
                    <i className="bi bi-wallet2 fs-5 me-2 text-muted"></i> Ví của tôi
                  </Link>
                </li> */}
                <li><hr className="dropdown-divider opacity-10" /></li>
                <li>
                  <button className="dropdown-item py-2 fw-medium text-danger d-flex align-items-center btn btn-link w-100 text-start border-0 shadow-none" onClick={logout}>
                    <i className="bi bi-box-arrow-right fs-5 me-2"></i> Đăng xuất
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <Link href="/login" className="btn btn-poly-gradient text-white rounded-pill px-3 py-1 fw-bold fs-7 text-decoration-none" style={{ background: 'linear-gradient(135deg, #F27125, #FF9E67)' }}>
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
