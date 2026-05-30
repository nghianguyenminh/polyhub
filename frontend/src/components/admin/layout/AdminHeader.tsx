'use client';

import { Menu, Search, Bell } from 'lucide-react';
import styles from './AdminHeader.module.css';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
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

        <button className={styles.profileButton}>
          <div className={styles.avatar}>A</div>
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>Admin User</span>
            <span className={styles.profileRole}>Quản trị viên</span>
          </div>
        </button>
      </div>
    </header>
  );
}
