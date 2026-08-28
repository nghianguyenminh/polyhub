'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Tags,
  GraduationCap,
  Flag,
  Settings,
  LogOut,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './AdminSidebar.module.css';

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Danh mục', path: '/admin/categories', icon: Tags },
  { name: 'Người dùng', path: '/admin/users', icon: Users },
  { name: 'Tài liệu', path: '/admin/documents', icon: FileText },
  { name: 'Mentors', path: '/admin/mentors', icon: GraduationCap },
  { name: 'Nghỉ phép', path: '/admin/vacations', icon: Calendar },
  { name: 'Báo cáo', path: '/admin/reports', icon: Flag },
  // { name: 'Cài đặt', path: '/admin/settings', icon: Settings },
];

interface AdminSidebarProps {
  isOpen?: boolean;
}

export default function AdminSidebar({ isOpen = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      {/* Brand / Logo */}
      <div className={styles.logoContainer}>
        <Link href="/admin" className={styles.logoText}>
          Poly<span className={styles.logoHighlight}>HUB</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className={styles.navContainer}>
        {navItems.map((item) => {
          const Icon = item.icon;
          // Exact match for the root dashboard, partial for sub-pages
          const isActive =
            item.path === '/admin'
              ? pathname === '/admin'
              : pathname?.startsWith(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''
                }`}
            >
              <Icon className={styles.icon} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className={styles.logoutContainer}>
        <button className={styles.logoutButton} onClick={logout}>
          <LogOut className={styles.icon} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
