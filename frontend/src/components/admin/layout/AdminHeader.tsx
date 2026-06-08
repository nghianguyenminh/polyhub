'use client';

import Link from 'next/link';
import { Menu, Search, Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './AdminHeader.module.css';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user, logout } = useAuth();

  const getRoleName = (roleId?: string) => {
    switch (roleId) {
      case 'SUPER_ADMIN': return 'Quản trị viên cấp cao';
      case 'ADMIN': return 'Quản trị viên';
      case 'USER_ADMIN': return 'Quản lý người dùng';
      case 'CONTENT_ADMIN': return 'Quản lý nội dung';
      default: return 'Quản trị viên';
    }
  };

  return (
    <header className={styles.header}>
      {/* Left Section: Mobile Menu & Search */}
      <div className={styles.leftSection}>
        <button
          onClick={onMenuClick}
          className={styles.menuButton}
          aria-label="Toggle Sidebar"
        >
          <Menu size={24} />
        </button>

        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Tìm kiếm nội dung..."
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Right Section: Notifications & Profile */}
      <div className={styles.rightSection}>
        <button className={styles.iconButton} aria-label="Notifications">
          <Bell size={20} />
          <span className={styles.badge}></span>
        </button>

        <div className={styles.divider}></div>

        <Link href={`/profile/${user?.username}`} className={styles.profileButton} style={{ textDecoration: 'none' }}>
          <div className={styles.avatar}>
            {user?.avatar && user.avatar !== 'default.png' ? (
              <img 
                src={user.avatar.startsWith('http') ? user.avatar : `https://ui-avatars.com/api/?name=${user.fullname}`} 
                alt={user.fullname} 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
              />
            ) : (
              user?.fullname ? user.fullname.charAt(0).toUpperCase() : 'A'
            )}
          </div>
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{user?.fullname || 'Admin User'}</span>
            <span className={styles.profileRole}>{getRoleName(user?.role)}</span>
          </div>
        </Link>

        <div className={styles.divider}></div>

        <button className={styles.iconButton} onClick={logout} title="Đăng xuất" aria-label="Logout">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
