'use client';

import React, { useEffect, useState } from 'react';
import { Search, Plus, MoreVertical, ShieldAlert, GraduationCap, User, X } from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import styles from './UserManagement.module.css';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [rolesCountInfo, setRolesCountInfo] = useState<{
    userAdminCount: number;
    contentAdminCount: number;
    MAX_USER_ADMIN: number;
    MAX_CONTENT_ADMIN: number;
  } | null>(null);

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/users?page=${currentPage}`;
      if (searchTerm.trim() !== '') {
        url += `&keyword=${encodeURIComponent(searchTerm.trim())}`;
      }
      if (roleFilter !== 'All') {
        url += `&role=${encodeURIComponent(roleFilter)}`;
      }
      if (statusFilter !== 'All') {
        const isActive = statusFilter === 'active';
        url += `&active=${isActive}`;
      }
      
      const res = await fetchAPI(url);
      setUsers(res.users || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setCurrentPage(1);
      setSearchTerm(searchInput);
    }
  };

  const handleSearchBlur = () => {
    setCurrentPage(1);
    setSearchTerm(searchInput);
  };

  const openDetailModal = async (username: string) => {
    setDetailLoading(true);
    setActionMessage(null);
    setLockReason('');
    try {
      const res = await fetchAPI(`/api/admin/users/${username}`);
      setSelectedUser(res.user);
      setSelectedRole(res.user?.role?.id || '');
      setRolesCountInfo({
        userAdminCount: res.userAdminCount,
        contentAdminCount: res.contentAdminCount,
        MAX_USER_ADMIN: res.MAX_USER_ADMIN,
        MAX_CONTENT_ADMIN: res.MAX_CONTENT_ADMIN,
      });
    } catch (err) {
      console.error('Failed to load user details', err);
      alert('Không thể tải thông tin chi tiết người dùng này.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setSelectedUser(null);
    setRolesCountInfo(null);
  };

  const handleLockUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockReason.trim()) {
      setActionMessage({ text: 'Vui lòng nhập lý do khóa tài khoản.', type: 'error' });
      return;
    }

    try {
      const res = await fetchAPI(`/api/admin/users/lock/${selectedUser.username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: lockReason }),
      });
      setActionMessage({ text: res.message || 'Khóa tài khoản thành công.', type: 'success' });
      setLockReason('');
      
      // Reload current user details in modal and reload list
      await openDetailModal(selectedUser.username);
      loadUsers();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Khóa tài khoản thất bại.', type: 'error' });
    }
  };

  const handleUnlockUser = async () => {
    try {
      const res = await fetchAPI(`/api/admin/users/unlock/${selectedUser.username}`, {
        method: 'POST',
      });
      setActionMessage({ text: res.message || 'Mở khóa tài khoản thành công.', type: 'success' });
      
      // Reload current user details in modal and reload list
      await openDetailModal(selectedUser.username);
      loadUsers();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Mở khóa tài khoản thất bại.', type: 'error' });
    }
  };

  const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setActionMessage({ text: 'Vui lòng chọn vai trò.', type: 'error' });
      return;
    }

    try {
      const res = await fetchAPI(`/api/admin/users/roles/${selectedUser.username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: selectedRole }),
      });
      setActionMessage({ text: res.message || 'Cập nhật vai trò thành công.', type: 'success' });
      
      // Reload current user details in modal and reload list
      await openDetailModal(selectedUser.username);
      loadUsers();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Cập nhật vai trò thất bại.', type: 'error' });
    }
  };

  const getRoleBadge = (roleId: string, roleName: string) => {
    switch (roleId) {
      case 'SUPER_ADMIN': 
        return <span className={`${styles.badge} ${styles.badgeAdmin}`}><ShieldAlert size={12} /> Super Admin</span>;
      case 'USER_ADMIN':
        return <span className={`${styles.badge} ${styles.badgeAdmin}`}><ShieldAlert size={12} /> Admin Người dùng</span>;
      case 'CONTENT_ADMIN':
        return <span className={`${styles.badge} ${styles.badgeAdmin}`}><ShieldAlert size={12} /> Admin Nội dung</span>;
      case 'ADMIN':
        return <span className={`${styles.badge} ${styles.badgeAdmin}`}><ShieldAlert size={12} /> Admin</span>;
      case 'MENTOR': 
        return <span className={`${styles.badge} ${styles.badgeMentor}`}><GraduationCap size={12} /> Mentor</span>;
      case 'USER': 
      default:
        return <span className={`${styles.badge} ${styles.badgeStudent}`}><User size={12} /> Sinh viên</span>;
    }
  };

  const getStatusBadge = (active: boolean) => {
    return (
      <span className={`${styles.badge} ${active ? styles.statusActive : styles.statusBanned}`}>
        {active ? 'Hoạt động' : 'Bị khóa'}
      </span>
    );
  };

  const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : 'U';

  // Check if current user is SUPER_ADMIN or ADMIN
  const canModifyRole = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

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
              placeholder="Tìm kiếm theo Tên, Email hoặc Username... (Ấn Enter)"
              className={styles.searchInput}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onBlur={handleSearchBlur}
            />
          </div>
          
          <select 
            className={styles.selectInput}
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">Tất cả Vai trò</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="USER_ADMIN">Admin Người dùng</option>
            <option value="CONTENT_ADMIN">Admin Nội dung</option>
            <option value="MENTOR">Mentor</option>
            <option value="USER">Sinh viên</option>
          </select>

          <select 
            className={styles.selectInput}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">Tất cả Trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="locked">Bị khóa</option>
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
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280' }}>
                    Đang tải dữ liệu người dùng...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.username}>
                    <td>
                      <div className={styles.userInfo}>
                        <div className={styles.avatar}>
                          {user.avatar && user.avatar !== 'default.png' ? (
                            <img 
                              src={user.avatar.startsWith('http') ? user.avatar : `https://ui-avatars.com/api/?name=${user.fullname}`} 
                              alt={user.fullname} 
                              className={styles.avatarImg} 
                            />
                          ) : (
                            getInitial(user.fullname)
                          )}
                        </div>
                        <div className={styles.userDetails}>
                          <span className={styles.userName}>{user.fullname}</span>
                          <span className={styles.userEmail}>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{getRoleBadge(user.role?.id, user.role?.name)}</td>
                    <td>{getStatusBadge(user.active)}</td>
                    <td>
                      <span className={styles.joinDate}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Chưa rõ'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className={styles.viewDetailsBtn} 
                        onClick={() => openDetailModal(user.username)}
                      >
                        Chi tiết
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

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className={styles.pagination}>
            <span className={styles.pageInfo}>
              Trang {currentPage} trên {totalPages}
            </span>
            <div className={styles.pageControls}>
              <button 
                className={styles.pageBtn}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  className={`${styles.pageBtn} ${pageNum === currentPage ? styles.pageBtnActive : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
              <button 
                className={styles.pageBtn}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Chi tiết người dùng */}
      {(selectedUser || detailLoading) && (
        <div className={styles.modalOverlay} onClick={closeDetailModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {detailLoading ? 'Đang tải thông tin...' : `Chi tiết tài khoản: ${selectedUser.username}`}
              </h2>
              <button className={styles.btnCloseModal} onClick={closeDetailModal}>
                <X size={20} />
              </button>
            </div>
            
            {detailLoading ? (
              <div className={styles.modalBody} style={{ textAlign: 'center', padding: '48px 24px' }}>
                Đang tải dữ liệu chi tiết người dùng...
              </div>
            ) : selectedUser && (
              <div className={styles.modalBody}>
                {actionMessage && (
                  <div className={`${styles.alertBox} ${actionMessage.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
                    {actionMessage.text}
                  </div>
                )}

                {/* Section 1: Thông tin cá nhân */}
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>Thông tin cá nhân</h3>
                  <div className={styles.profileGrid}>
                    <div className={styles.profileAvatar}>
                      {selectedUser.avatar && selectedUser.avatar !== 'default.png' ? (
                        <img 
                          src={selectedUser.avatar.startsWith('http') ? selectedUser.avatar : `https://ui-avatars.com/api/?name=${selectedUser.fullname}`} 
                          alt={selectedUser.fullname} 
                          className={styles.profileAvatarImg} 
                        />
                      ) : (
                        getInitial(selectedUser.fullname)
                      )}
                    </div>
                    <div className={styles.profileInfo}>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Họ và Tên</span>
                        <span className={styles.infoValue}>{selectedUser.fullname}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Email</span>
                        <span className={styles.infoValue}>{selectedUser.email}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Số điện thoại</span>
                        <span className={styles.infoValue}>{selectedUser.phone || 'Chưa cung cấp'}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Giới tính</span>
                        <span className={styles.infoValue}>
                          {selectedUser.gender === true ? 'Nam' : selectedUser.gender === false ? 'Nữ' : 'Chưa cung cấp'}
                        </span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Ngày sinh</span>
                        <span className={styles.infoValue}>
                          {selectedUser.birthday ? new Date(selectedUser.birthday).toLocaleDateString('vi-VN') : 'Chưa cung cấp'}
                        </span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Chuyên ngành</span>
                        <span className={styles.infoValue}>{selectedUser.major || 'Chưa chọn'}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Ngày tham gia</span>
                        <span className={styles.infoValue}>
                          {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('vi-VN') : 'Chưa rõ'}
                        </span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Trạng thái</span>
                        <span className={styles.infoValue}>{getStatusBadge(selectedUser.active)}</span>
                      </div>
                    </div>
                  </div>
                  {selectedUser.bio && (
                    <div className={styles.infoItem} style={{ marginTop: '16px' }}>
                      <span className={styles.infoLabel}>Tiểu sử (Bio)</span>
                      <span className={styles.infoValue} style={{ fontWeight: 'normal', color: '#4b5563' }}>{selectedUser.bio}</span>
                    </div>
                  )}
                </div>

                {/* Section 2: Phân quyền (SUPER_ADMIN / ADMIN) */}
                {canModifyRole && (
                  <div className={styles.modalSection}>
                    <h3 className={styles.modalSectionTitle}>Thay đổi phân quyền</h3>
                    <form onSubmit={handleChangeRole} className={styles.formGroup}>
                      <label htmlFor="roleSelect" className={styles.formLabel}>Vai trò người dùng</label>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <select
                          id="roleSelect"
                          className={styles.selectInput}
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          style={{ flex: 1 }}
                        >
                          <option value="USER">Sinh viên</option>
                          <option value="USER_ADMIN">Admin Người dùng (Tối đa 2)</option>
                          <option value="CONTENT_ADMIN">Admin Nội dung (Tối đa 2)</option>
                        </select>
                        <button type="submit" className={styles.btnSubmit}>
                          Cập nhật vai trò
                        </button>
                      </div>
                      {rolesCountInfo && (
                        <div style={{ marginTop: '8px' }}>
                          <span className={styles.limitBadge}>
                            Admin Người dùng hiện tại: <strong>{rolesCountInfo.userAdminCount} / {rolesCountInfo.MAX_USER_ADMIN}</strong>
                          </span>
                          <span className={styles.limitBadge}>
                            Admin Nội dung hiện tại: <strong>{rolesCountInfo.contentAdminCount} / {rolesCountInfo.MAX_CONTENT_ADMIN}</strong>
                          </span>
                        </div>
                      )}
                    </form>
                  </div>
                )}

                {/* Section 3: Thao tác khóa/mở khóa */}
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>Trạng thái tài khoản</h3>
                  {selectedUser.active ? (
                    <form onSubmit={handleLockUser} className={styles.formGroup}>
                      <label htmlFor="lockReasonInput" className={styles.formLabel}>Lý do khóa tài khoản</label>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <input
                          id="lockReasonInput"
                          type="text"
                          placeholder="Nhập lý do khóa tài khoản..."
                          className={styles.formInput}
                          value={lockReason}
                          onChange={(e) => setLockReason(e.target.value)}
                          style={{ flex: 1 }}
                          required
                        />
                        <button type="submit" className={`${styles.btnSubmit} ${styles.btnLock}`}>
                          Khóa tài khoản
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: '#ef4444', fontWeight: 500 }}>
                        Tài khoản này đang bị khóa.
                      </span>
                      <button 
                        type="button" 
                        onClick={handleUnlockUser} 
                        className={`${styles.btnSubmit} ${styles.btnUnlock}`}
                      >
                        Mở khóa tài khoản
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
