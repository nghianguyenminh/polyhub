'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

import CoinHistoryModal from '@/components/common/CoinHistoryModal';

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
  const { user, logout, refreshUser } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showCoinModal, setShowCoinModal] = useState(false);

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
          {/* Coin Balance Badge */}
          {user && (
            <div 
              className="d-flex align-items-center gap-1 px-3 py-1.5 rounded-pill shadow-sm text-dark me-1" 
              style={{ cursor: 'pointer', fontSize: '13px', fontWeight: 800, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '1px solid #f59e0b', transition: 'transform 0.15s ease' }}
              onClick={() => setShowCoinModal(true)}
              title="Số xu hiện có (Click để xem nhật ký)"
            >
              <span style={{ fontSize: '15px' }}>🪙</span>
              <span style={{ color: '#b45309' }}>{user.coins ?? 100} Xu</span>
            </div>
          )}

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
                  <h5 className="fw-bold mb-0" style={{ fontSize: '18px' }}>Thông Báo</h5>
                  {unreadCount > 0 && (
                    <button 
                      className="text-decoration-none fw-medium btn btn-link p-0 shadow-none border-0" 
                      style={{ color: 'var(--poly-primary)', fontSize: '13.5px' }} 
                      onClick={handleMarkAllAsRead}
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
                <div className="noti-list" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted" style={{ fontSize: '13.5px' }}>Không có thông báo nào.</div>
                  ) : (
                    notifications.map(noti => (
                      <div 
                        key={noti.id} 
                        className={`noti-item d-flex gap-2 p-3 border-bottom transition-all ${!noti.isRead ? 'bg-light bg-opacity-50' : ''}`}
                        onClick={() => handleNotificationClick(noti)}
                        style={{ cursor: 'pointer' }}
                      >
                        <img 
                          src={noti.sender && noti.sender.avatar && noti.sender.avatar !== 'default.png' ? noti.sender.avatar : `https://ui-avatars.com/api/?name=${noti.sender ? noti.sender.fullname : 'System'}`} 
                          className="rounded-circle" width="40" height="40" alt="avatar" 
                          style={{ objectFit: 'cover' }}
                        />
                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                          <p className="mb-1 text-wrap text-dark" style={{ fontSize: '13px' }}>
                            {noti.sender ? (
                              <strong>{noti.sender.fullname}</strong>
                            ) : (
                              <strong>Hệ thống</strong>
                            )}{' '}
                            {noti.message}
                          </p>
                          <p className="text-muted mb-0" style={{ fontSize: '11px' }}>
                            <i className="bi bi-clock me-1"></i>
                            {formatTimeAgo(noti.createdAt)}
                          </p>
                        </div>
                        {!noti.isRead && (
                          <div className="d-flex align-items-center justify-content-center ps-1">
                            <div className="bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                          </div>
                        )}
                      </div>
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

      <CoinHistoryModal
        isOpen={showCoinModal}
        onClose={() => setShowCoinModal(false)}
        coins={user?.coins ?? 100}
        onRefreshUser={refreshUser}
      />
    </header>
  );
}
