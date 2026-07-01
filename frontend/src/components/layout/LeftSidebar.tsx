'use client';

import React from 'react';
import Link from 'next/link';

interface LeftSidebarProps {
  activeMenu?: string;
}

export default function LeftSidebar({ activeMenu = 'home' }: LeftSidebarProps) {
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

      <div className="sidebar-heading mt-4">TIN NHẮN TRỰC TIẾP</div>
      
      <a href="#" className="poly-nav-item user-msg-item">
        <div className="position-relative me-3">
          <img src="https://i.pinimg.com/1200x/6d/7f/72/6d7f72dc3b314ea337807512a793dabe.jpg" className="rounded-circle shadow-sm" width="32" height="32" style={{ objectFit: 'cover' }} alt="avatar" />
          <span className="position-absolute bottom-0 end-0 p-1 bg-success border border-light rounded-circle" style={{ transform: 'translate(25%, 25%)' }}></span>
        </div>
        <span className="nav-text fw-medium">Bảo Châu</span>
        <span className="badge bg-danger ms-auto rounded-pill" style={{ fontSize: '10px' }}>2</span>
      </a>
      
      <a href="#" className="poly-nav-item user-msg-item">
        <div className="position-relative me-3">
          <img src="https://i.pinimg.com/736x/99/30/d6/9930d6bbdbf74a38687d92b297cee737.jpg" className="rounded-circle shadow-sm" width="32" height="32" style={{ objectFit: 'cover' }} alt="avatar" />
        </div>
        <span className="nav-text fw-medium text-muted">Anh Khoa</span>
      </a>
    </div>
  );
}
