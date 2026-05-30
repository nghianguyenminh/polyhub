'use client';

import React, { useState } from 'react';
import { Search, Plus, MoreVertical, ShieldAlert, GraduationCap, User } from 'lucide-react';
import styles from './UserManagement.module.css';

// --- Types & Mock Data ---
type Role = 'Admin' | 'Mentor' | 'Học viên';
type Status = 'Hoạt động' | 'Bị khóa';

interface UserData {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string; // Optional image URL
  role: Role;
  status: Status;
  joinDate: string;
}

const mockUsers: UserData[] = [
  { id: '1', name: 'Nguyễn Văn Mạnh', email: 'manhnv@fpt.edu.vn', role: 'Admin', status: 'Hoạt động', joinDate: '12/01/2023' },
  { id: '2', name: 'Trần Thị Hà', email: 'hatt@fpt.edu.vn', role: 'Mentor', status: 'Hoạt động', joinDate: '24/05/2023' },
  { id: '3', name: 'Lê Hoàng Phong', email: 'phonglh@fpt.edu.vn', role: 'Học viên', status: 'Hoạt động', joinDate: '02/09/2023' },
  { id: '4', name: 'Phạm Bảo Nam', email: 'nampb@fpt.edu.vn', role: 'Học viên', status: 'Bị khóa', joinDate: '15/10/2023' },
  { id: '5', name: 'Đinh Phương Thảo', email: 'thaodp@fpt.edu.vn', role: 'Mentor', status: 'Hoạt động', joinDate: '01/11/2023' },
];

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filtering Logic
  const displayUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'Admin': return <span className={`${styles.badge} ${styles.badgeAdmin}`}><ShieldAlert size={12} /> Admin</span>;
      case 'Mentor': return <span className={`${styles.badge} ${styles.badgeMentor}`}><GraduationCap size={12} /> Mentor</span>;
      case 'Học viên': return <span className={`${styles.badge} ${styles.badgeStudent}`}><User size={12} /> Học viên</span>;
    }
  };

  const getStatusBadge = (status: Status) => {
    const isActive = status === 'Hoạt động';
    return (
      <span className={`${styles.badge} ${isActive ? styles.statusActive : styles.statusBanned}`}>
        {status}
      </span>
    );
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Quản lý Người dùng</h1>
          <p className={styles.pageSubtitle}>Xem, điều chỉnh và phân quyền người dùng trong PolyHUB.</p>
        </div>
      </header>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm theo Tên hoặc Email..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className={styles.selectInput}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">Tất cả Vai trò</option>
            <option value="Admin">Admin</option>
            <option value="Mentor">Mentor</option>
            <option value="Học viên">Học viên</option>
          </select>

          <select 
            className={styles.selectInput}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">Tất cả Trạng thái</option>
            <option value="Hoạt động">Hoạt động</option>
            <option value="Bị khóa">Bị khóa</option>
          </select>
        </div>

        <button className={styles.btnAdd}>
          <Plus size={18} />
          Thêm tài khoản
        </button>
      </div>

      {/* Data Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Phân quyền</th>
                <th>Trạng thái</th>
                <th>Ngày tham gia</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {displayUsers.length > 0 ? (
                displayUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userInfo}>
                        <div className={styles.avatar}>
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className={styles.avatarImg} />
                          ) : (
                            getInitial(user.name)
                          )}
                        </div>
                        <div className={styles.userDetails}>
                          <span className={styles.userName}>{user.name}</span>
                          <span className={styles.userEmail}>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>{getStatusBadge(user.status)}</td>
                    <td>
                      <span className={styles.joinDate}>{user.joinDate}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className={styles.actionBtn} aria-label="Tùy chọn">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280' }}>
                    Không tìm thấy người dùng nào khớp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
