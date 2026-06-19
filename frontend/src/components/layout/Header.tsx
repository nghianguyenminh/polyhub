'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI } from '@/lib/api';

interface SystemNotification {
  id: number;
  title: string;
  content: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export default function Header() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const loadNotifications = async () => {
    try {
      const data = await fetchAPI('/api/notifications');
      setNotifications(data || []);
      
      const countRes = await fetchAPI('/api/notifications/unread-count');
      setUnreadCount(countRes.count || 0);
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

  const handleMarkAllAsRead = async () => {
    try {
      await fetchAPI('/api/notifications/read', { method: 'PUT' });
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const noti = notifications.find(n => n.id === id);
      if (noti && !noti.isRead) {
        await fetchAPI(`/api/notifications/${id}/read`, { method: 'PUT' });
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      const diff = Date.now() - new Date(timeStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Vừa xong';
      if (mins < 60) return `${mins} phút trước`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs} giờ trước`;
      return new Date(timeStr).toLocaleDateString('vi-VN');
    } catch (e) {
      return 'Vài giây trước';
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

              <div className="dropdown-menu dropdown-menu-end poly-noti-dropdown p-0 shadow-lg border-0 mt-2" aria-labelledby="notificationDropdown">
                <div className="p-3 d-flex justify-content-between align-items-center border-bottom">
                  <h5 className="fw-bold mb-0" style={{ fontSize: '16px' }}>Thông Báo</h5>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-decoration-none fw-semibold btn btn-link p-0 shadow-none border-0 fs-7" 
                      style={{ color: '#F27125' }}
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
                <div className="noti-list" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div className="text-center py-4 text-muted fs-7">
                      Không có thông báo nào.
                    </div>
                  ) : (
                    notifications.map((noti) => (
                      <Link 
                        key={noti.id}
                        href={noti.link || '#'} 
                        onClick={() => handleMarkAsRead(noti.id)}
                        className={`noti-item d-flex gap-2 text-decoration-none p-3 border-bottom transition-all ${!noti.isRead ? 'bg-light bg-opacity-75' : ''}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="flex-shrink-0">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center text-white" 
                            style={{ 
                              width: '40px', 
                              height: '40px', 
                              backgroundColor: !noti.isRead ? '#F27125' : '#6c757d',
                              fontSize: '16px' 
                            }}
                          >
                            <i className="bi bi-calendar-check-fill"></i>
                          </div>
                        </div>
                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                          <h6 className={`mb-1 fs-7 text-dark ${!noti.isRead ? 'fw-bold' : 'fw-semibold'}`}>
                            {noti.title}
                          </h6>
                          <p className="mb-1 text-wrap text-muted fs-8" style={{ lineHeight: '1.4' }}>
                            {noti.content}
                          </p>
                          <span className="text-muted fs-9">
                            <i className="bi bi-clock me-1"></i>
                            {formatTime(noti.createdAt)}
                          </span>
                        </div>
                        {!noti.isRead && (
                          <div className="d-flex align-items-center justify-content-center ps-1">
                            <div className="bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                          </div>
                        )}
                      </Link>
                    ))
                  )}
                </div>
                <div className="p-2 border-top d-flex justify-content-center align-items-center">
                  <Link href="/bookings" className="text-decoration-none fw-bold text-center w-100 py-1 fs-7" style={{ color: '#F27125', transition: '0.2s' }}>
                    Xem lịch hẹn call video
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
