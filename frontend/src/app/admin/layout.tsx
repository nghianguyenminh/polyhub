'use client';

import React, { useState } from 'react';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import styles from '@/components/admin/layout/AdminLayout.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className={styles.layoutContainer}>
      <AdminSidebar isOpen={isSidebarOpen} />
      
      {/* Overlay Backdrop for Mobile */}
      <div 
        className={`${styles.overlay} ${isSidebarOpen ? styles.overlayVisible : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <div className={styles.mainContent}>
        <AdminHeader onMenuClick={toggleSidebar} />
        
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
