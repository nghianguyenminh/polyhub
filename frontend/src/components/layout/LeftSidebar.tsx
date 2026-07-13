'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';

interface LeftSidebarProps {
  activeMenu?: string;
}

export default function LeftSidebar({ activeMenu = 'home' }: LeftSidebarProps) {
  const [chatUsers, setChatUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchAPI('/api/chat-data')
      .then(res => {
        if (res.allUsers) {
          setChatUsers(res.allUsers.slice(0, 5));
        }
      })
      .catch(err => console.error("Lỗi tải chat sidebar", err));
  }, []);

  return (
    <div className="poly-sidebar-left d-none d-lg-block">
      <div className="sidebar-heading">MENU CHÍNH</div>

      <Link href="/" className={`poly-nav-item ${activeMenu === 'home' ? 'active' : ''}`}>
        <div className="nav-icon-box"><i className="bi bi-house-door-fill icon-grad icon-grad-main"></i></div>
        <span className="nav-text">Trang chủ</span>
      </Link>

      <Link href="/connections" className={`poly-nav-item ${activeMenu === 'connections' ? 'active' : ''}`}>
        <div className="nav-icon-box"><i className="bi bi-people-fill icon-grad icon-grad-main"></i></div>
        <span className="nav-text">Góc Kết nối</span>
      </Link>

      <Link href="/mentors" className={`poly-nav-item ${activeMenu === 'mentors' ? 'active' : ''}`}>
        <div className="nav-icon-box"><i className="bi bi-award-fill icon-grad icon-grad-main"></i></div>
        <span className="nav-text">Poly Mentors</span>
      </Link>

      <Link href="/bookings" className={`poly-nav-item ${activeMenu === 'bookings' ? 'active' : ''}`}>
        <div className="nav-icon-box"><i className="bi bi-calendar-check-fill icon-grad icon-grad-main"></i></div>
        <span className="nav-text">Lịch hẹn Call video</span>
      </Link>

      <Link href="/documents" className={`poly-nav-item ${activeMenu === 'documents' ? 'active' : ''}`}>
        <div className="nav-icon-box"><i className="bi bi-journal-bookmark-fill icon-grad icon-grad-main"></i></div>
        <span className="nav-text">Góc Tài liệu</span>
      </Link>

      <div className="sidebar-heading mt-4">PHÍM TẮT & KHÁM PHÁ</div>

      <Link href="/saved" className={`poly-nav-item ${activeMenu === 'saved' ? 'active' : ''}`}>
        <div className="nav-icon-box"><i className="bi bi-bookmark-fill icon-grad icon-grad-main"></i></div>
        <span className="nav-text">Đã lưu</span>
      </Link>

      <div className="sidebar-heading mt-4 d-flex justify-content-between align-items-center pe-3">
        <span>TIN NHẮN TRỰC TIẾP</span>
        <Link href="/chat" className="text-muted" title="Vào Chat"><i className="bi bi-chat-dots fs-6"></i></Link>
      </div>

      {chatUsers.length === 0 ? (
        <div className="text-muted mt-2" style={{ fontSize: '13px', padding: '0 15px' }}>Chưa có tin nhắn nào</div>
      ) : (
        chatUsers.map(user => {
          const isUnread = false; // Add logic if unread counts are returned by API
          return (
            <Link key={user.username} href={`/chat?u=${user.username}`} className="poly-nav-item user-msg-item text-decoration-none">
              <div className="position-relative me-3">
                <img
                  src={user.avatar && user.avatar !== 'default.png' ? user.avatar : `https://ui-avatars.com/api/?name=${user.fullname}&background=random`}
                  className="rounded-circle shadow-sm" width="32" height="32" style={{ objectFit: 'cover' }} alt="avatar"
                />
                <span className="position-absolute bottom-0 end-0 p-1 bg-success border border-light rounded-circle" style={{ transform: 'translate(25%, 25%)' }}></span>
              </div>
              <span className={`nav-text ${isUnread ? 'fw-bold text-dark' : 'fw-medium text-muted'}`} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.fullname}
              </span>
              {isUnread && (
                <span className="badge bg-danger ms-auto rounded-pill" style={{ fontSize: '10px' }}>1</span>
              )}
            </Link>
          )
        })
      )}
    </div>
  );
}
