'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

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
                <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" style={{ marginTop: '8px', marginLeft: '-8px' }}></span>
              </button>

              <div className="dropdown-menu dropdown-menu-end poly-noti-dropdown p-0 shadow-lg border-0 mt-2" aria-labelledby="notificationDropdown">
                <div className="p-3 d-flex justify-content-between align-items-center border-bottom">
                  <h5 className="fw-bold mb-0" style={{ fontSize: '18px' }}>Thông Báo</h5>
                  <button className="text-decoration-none fw-medium btn btn-link p-0 shadow-none border-0" style={{ color: 'var(--poly-primary)', fontSize: '13.5px' }}>Đánh dấu đã đọc</button>
                </div>
                <div className="noti-list">
                  <div className="noti-item d-flex gap-2">
                    <img src="https://i.pinimg.com/736x/26/b3/0a/26b30a7f16b20c714d782e60910788ce.jpg" className="rounded-circle" width="56" height="56" alt="avatar" />
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <p className="mb-1 text-wrap text-dark" style={{ color: 'var(--text-main)' }}>
                        <strong>Nguyễn Thế Trung</strong> gửi lời mời tham gia nhóm <strong>Nhóm lập trình game (unity) Nâng cao</strong>
                      </p>
                      <p className="text-primary fw-semibold mb-2" style={{ fontSize: '12.5px' }}><i className="bi bi-clock me-1"></i>Vài giây trước</p>
                      <div className="d-flex gap-2 mt-1">
                        <button className="btn btn-poly-gradient text-white border-0 py-1 flex-grow-1" style={{ borderRadius: '6px' }}>Chấp nhận</button>
                        <button className="btn btn-light fw-bold border py-1 flex-grow-1" style={{ borderRadius: '6px', background: '#e4e6eb' }}>Bỏ qua</button>
                      </div>
                    </div>
                    <div className="d-flex flex-column align-items-center justify-content-center px-1">
                      <div className="bg-primary rounded-circle" style={{ width: '12px', height: '12px', boxShadow: '0 0 0 3px rgba(24, 119, 242, 0.2)' }}></div>
                    </div>
                  </div>
                </div>
                <div className="p-2 border-top d-flex justify-content-center align-items-center">
                  <a href="#" className="text-decoration-none fw-bold text-center w-100 py-1" style={{ color: 'var(--poly-primary)', fontSize: '14px', transition: '0.2s' }}>Xem tất cả thông báo</a>
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
                  src={user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                  alt="User" 
                  width="38" 
                  height="38" 
                  className="rounded-circle border border-2 border-white shadow-sm" 
                  style={{ objectFit: 'cover' }}
                />
              </a>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2" aria-labelledby="dropdownUser" style={{ borderRadius: '10px' }}>
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
          ) :
           (
            <Link href="/login"  style={{ borderRadius: '8px', fontWeight: 600 }}>
              
            </Link>
          )
          }
        </div>
      </div>
    </header>
  );
}
