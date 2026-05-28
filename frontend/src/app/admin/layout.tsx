'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import '@/styles/admin/style.css';
import '@/styles/admin/sidebar.css';
import '@/styles/admin/components.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const isActive = (path: string) => {
    if (path === '/admin' && pathname === '/admin') return 'active';
    if (path !== '/admin' && pathname.startsWith(path)) return 'active';
    return '';
  };

  return (
    <div className="admin-body">
      <div className="admin-wrapper d-flex">
        {/* Sidebar */}
        <aside className="admin-sidebar" style={{ width: '260px', flexShrink: 0, backgroundColor: '#ffffff', borderRight: '1px solid #e9ecef', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <div className="admin-sidebar-header p-4 d-flex align-items-center gap-2">
            <div className="bg-poly text-white rounded p-1 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
              <i className="bi bi-shield-lock-fill fs-5"></i>
            </div>
            <h5 className="fw-bolder mb-0 text-dark" style={{ letterSpacing: '-0.5px' }}>PolyHUB <span className="text-poly">Admin</span></h5>
          </div>

          <div className="admin-sidebar-menu flex-grow-1 px-3 mt-2 overflow-y-auto">
            <div className="menu-title">Tổng quan</div>
            
            <Link href="/admin" className={`menu-item ${isActive('/admin')}`}>
              <i className="bi bi-grid-1x2-fill"></i>
              <span className="menu-text">Bảng điều khiển</span>
            </Link>

            <div className="menu-title">Quản lý</div>
            
            <Link href="/admin/users" className={`menu-item ${isActive('/admin/users')}`}>
              <i className="bi bi-people-fill"></i>
              <span className="menu-text">Người dùng</span>
            </Link>

            <Link href="/admin/documents" className={`menu-item ${isActive('/admin/documents')}`}>
              <i className="bi bi-file-earmark-text-fill"></i>
              <span className="menu-text">Tài liệu</span>
            </Link>

            <Link href="/admin/categories" className={`menu-item ${isActive('/admin/categories')}`}>
              <i className="bi bi-tags-fill"></i>
              <span className="menu-text">Chuyên ngành</span>
            </Link>

            <Link href="/admin/mentors" className={`menu-item ${isActive('/admin/mentors')}`}>
              <i className="bi bi-person-badge-fill"></i>
              <span className="menu-text">Kiểm duyệt Mentor</span>
            </Link>

            <div className="menu-title">Kiểm soát</div>

            <Link href="/admin/reports" className={`menu-item ${isActive('/admin/reports')}`}>
              <i className="bi bi-flag-fill"></i>
              <span className="menu-text">Báo cáo vi phạm</span>
            </Link>
          </div>

          <div className="admin-sidebar-footer p-3 border-top mt-auto">
            <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
              <img src={user?.avatar && user.avatar !== 'default.png' ? user.avatar : `https://ui-avatars.com/api/?name=${user?.fullname || 'Admin'}`} className="rounded-circle" width="36" height="36" alt="avatar" />
              <div className="overflow-hidden">
                <div className="fw-bold text-dark text-truncate" style={{ fontSize: '13px' }}>{user?.fullname || 'Admin'}</div>
                <div className="text-muted text-truncate" style={{ fontSize: '11px' }}>{user?.role === 'SUPER_ADMIN' ? 'Quản trị viên cấp cao' : 'Quản trị viên'}</div>
              </div>
            </div>
            <a href="/" className="btn btn-light btn-sm w-100 mt-2 fw-medium text-dark d-flex align-items-center justify-content-center border" style={{ fontSize: '13px' }}>
              <i className="bi bi-house-door me-2"></i> Về trang chủ
            </a>
          </div>
        </aside>

        <div className="admin-main flex-grow-1 d-flex flex-column" style={{ minWidth: 0, minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
          {/* Header */}
          <header className="admin-header border-bottom bg-white d-flex align-items-center justify-content-between px-4" style={{ height: '70px' }}>
            <div className="d-flex align-items-center gap-3">
              <button className="btn btn-light d-lg-none border-0 shadow-none">
                <i className="bi bi-list fs-4"></i>
              </button>
              <form className="d-none d-md-block position-relative" style={{ width: '300px' }}>
                <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }}></i>
                <input type="text" className="form-control form-control-sm bg-light border-0 rounded-pill ps-5 py-2 shadow-none" placeholder="Tìm kiếm nhanh..." />
              </form>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <div className="dropdown">
                <button className="btn btn-light position-relative rounded-circle border-0" style={{ width: '40px', height: '40px' }} data-bs-toggle="dropdown">
                  <i className="bi bi-bell fs-5 text-dark"></i>
                  <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                    <span className="visually-hidden">New alerts</span>
                  </span>
                </button>
                <div className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ width: '300px', borderRadius: '12px' }}>
                  <div className="p-3 border-bottom fw-bold text-dark">Thông báo mới</div>
                  <div className="p-3 text-center text-muted small">Không có thông báo nào</div>
                </div>
              </div>
              
              <div className="vr opacity-25"></div>
              
              <div className="dropdown">
                <button className="btn p-0 border-0 d-flex align-items-center gap-2" data-bs-toggle="dropdown">
                  <img src={user?.avatar && user.avatar !== 'default.png' ? user.avatar : `https://ui-avatars.com/api/?name=${user?.fullname || 'Admin'}`} className="rounded-circle border" width="36" height="36" alt="avatar" />
                  <div className="d-none d-md-block text-start" style={{ lineHeight: '1.2' }}>
                    <div className="fw-bold text-dark" style={{ fontSize: '13.5px' }}>{user?.fullname || 'Admin'}</div>
                  </div>
                  <i className="bi bi-chevron-down text-muted" style={{ fontSize: '12px' }}></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2" style={{ borderRadius: '12px' }}>
                  <li><Link className="dropdown-item py-2 text-dark" href="/profile"><i className="bi bi-person me-2"></i>Hồ sơ cá nhân</Link></li>
                  <li><Link className="dropdown-item py-2 text-dark" href="/settings"><i className="bi bi-gear me-2"></i>Cài đặt tài khoản</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item py-2 text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i>Đăng xuất</button></li>
                </ul>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="admin-content p-4 flex-grow-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
