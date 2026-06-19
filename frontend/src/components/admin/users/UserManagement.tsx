'use client';

import React, { useEffect, useState } from 'react';
import { Search, Plus, MoreVertical, ShieldAlert, GraduationCap, User, X, Mail, Phone, Calendar, Shield, Lock, Unlock, Settings, KeyRound, Cpu, Layers, FileText, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAPI } from '@/lib/api';
import styles from './UserManagement.module.css';

export default function UserManagement() {
  const [canModifyRole, setCanModifyRole] = useState(false);
  
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pageMessage, setPageMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // Fetch current user's role on client-side mount only
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const currentUser = await fetchAPI('/api/auth/me');
        if (currentUser) {
          setCurrentUserRole(currentUser.role);
          if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') {
            setCanModifyRole(true);
          }
        }
      } catch (err) {
        console.error('Failed to load current user role:', err);
      }
    };
    fetchCurrentUser();
  }, []);

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

  // Add User States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    username: '',
    fullname: '',
    email: '',
    password: '',
    roleId: 'USER_ADMIN',
    phone: '',
    birthday: '',
  });
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

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
      setPageMessage(null);
    } catch (err: any) {
      console.error('Failed to load users', err);
      setPageMessage({ text: err.message || 'Không thể tải dữ liệu người dùng.', type: 'error' });
      setUsers([]);
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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);
    setIsSubmittingAdd(true);

    try {
      const res = await fetchAPI('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });

      setAddSuccess(res.message || 'Tạo tài khoản thành công!');
      // Clear form
      setAddForm({
        username: '',
        fullname: '',
        email: '',
        password: '',
        roleId: 'USER_ADMIN',
        phone: '',
        birthday: '',
      });
      // Reload user list
      loadUsers();
      // Delay closing modal
      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddSuccess(null);
      }, 1500);
    } catch (err: any) {
      setAddError(err.message || 'Có lỗi xảy ra khi tạo tài khoản.');
    } finally {
      setIsSubmittingAdd(false);
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



  return (
    <div className={styles.container}>
      {/* Page Header */}
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Quản lý Người dùng</h1>
          <p className={styles.pageSubtitle}>Xem, điều chỉnh và phân quyền người dùng trong PolyHUB.</p>
        </div>
      </header>

      {/* Messages */}
      {pageMessage && (
        <div 
          className={`${styles.alert} ${pageMessage.type === 'success' ? styles.alertSuccess : styles.alertDanger}`}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            background: pageMessage.type === 'success' ? '#def7ec' : '#fde8e8',
            color: pageMessage.type === 'success' ? '#03543f' : '#9b1c1c',
            border: pageMessage.type === 'success' ? '1px solid #bcf0da' : '1px solid #fbd5d5',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          <span>{pageMessage.text}</span>
          <button 
            style={{ 
              marginLeft: 'auto', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: 'inherit',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }} 
            onClick={() => setPageMessage(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

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

        {canModifyRole && (
          <button className={styles.btnAdd} onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} />
            Thêm tài khoản
          </button>
        )}
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
                      {user.username === 'superadmin' || user.role?.id === 'SUPER_ADMIN' ? (
                        <button 
                          className={styles.viewDetailsBtn} 
                          disabled
                          style={{ opacity: 0.5, cursor: 'not-allowed' }}
                          title="Không thể xem chi tiết tài khoản Super Admin"
                        >
                          <Eye size={14} /> Chi tiết
                        </button>
                      ) : (
                        <button 
                          className={styles.viewDetailsBtn} 
                          onClick={() => openDetailModal(user.username)}
                        >
                          <Eye size={14} /> Chi tiết
                        </button>
                      )}
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
      <AnimatePresence>
        {(selectedUser || detailLoading) && (
          <motion.div 
            className={`${styles.modalOverlay} ${styles.cyberOverlay}`} 
            onClick={closeDetailModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <motion.div 
              className={`${styles.modalContent} ${styles.cyberModal}`} 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
            <div className={`${styles.modalHeader} ${styles.cyberHeader}`}>
              <h2 className={styles.cyberModalTitle}>
                {detailLoading ? 'SYSTEM CHECKING...' : `CORE INTERFACE: ${selectedUser.username}`}
              </h2>
              <button className={styles.cyberCloseBtn} onClick={closeDetailModal}>
                <X size={20} />
              </button>
            </div>
            
            {detailLoading ? (
              <div className={styles.cyberBody} style={{ textAlign: 'center', padding: '48px 24px', fontFamily: 'monospace', color: '#06b6d4' }}>
                <Cpu size={24} className={styles.spinIcon} /> ĐANG TRUY XUẤT CƠ SỞ DỮ LIỆU...
              </div>
            ) : selectedUser && (
              <div className={styles.cyberBody}>
                {actionMessage && (
                  <div className={`${styles.cyberAlert} ${actionMessage.type === 'success' ? styles.cyberAlertSuccess : styles.cyberAlertError}`}>
                    <Cpu size={14} className={styles.pulseIcon} /> {actionMessage.text}
                  </div>
                )}

                {/* Section 1: Thông tin cá nhân */}
                <div className={styles.cyberSection}>
                  <div className={styles.cyberSectionTitle}>
                    <Cpu size={14} /> SYSTEM CORE: PROFILE DATA
                  </div>
                  <div className={styles.cyberProfileGrid}>
                    <div className={styles.cyberAvatarWrapper}>
                      <div className={styles.cyberAvatarHexagon}>
                        {selectedUser.avatar && selectedUser.avatar !== 'default.png' ? (
                          <img 
                            src={selectedUser.avatar.startsWith('http') ? selectedUser.avatar : `https://ui-avatars.com/api/?name=${selectedUser.fullname}`} 
                            alt={selectedUser.fullname} 
                            className={styles.cyberAvatarImg} 
                          />
                        ) : (
                          <span className={styles.cyberAvatarInitial}>{getInitial(selectedUser.fullname)}</span>
                        )}
                      </div>
                      <div className={styles.cyberStatusIndicator}>
                        <span className={`${styles.statusDot} ${selectedUser.active ? styles.dotActive : styles.dotLocked}`} />
                        <span className={styles.statusText}>{selectedUser.active ? 'ACTIVE' : 'LOCKED'}</span>
                      </div>
                    </div>

                    <div className={styles.cyberProfileInfo}>
                      <div className={styles.cyberInfoItem}>
                        <span className={styles.cyberInfoLabel}><User size={12} /> HỌ VÀ TÊN</span>
                        <span className={styles.cyberInfoValue}>{selectedUser.fullname}</span>
                      </div>
                      <div className={styles.cyberInfoItem}>
                        <span className={styles.cyberInfoLabel}><Mail size={12} /> EMAIL ĐĂNG KÝ</span>
                        <span className={styles.cyberInfoValue}>{selectedUser.email}</span>
                      </div>
                      <div className={styles.cyberInfoItem}>
                        <span className={styles.cyberInfoLabel}><Phone size={12} /> SỐ ĐIỆN THOẠI</span>
                        <span className={styles.cyberInfoValue}>{selectedUser.phone || 'CHƯA CUNG CẤP'}</span>
                      </div>
                      <div className={styles.cyberInfoItem}>
                        <span className={styles.cyberInfoLabel}><User size={12} /> GIỚI TÍNH</span>
                        <span className={styles.cyberInfoValue}>
                          {selectedUser.gender === true ? 'Nam' : selectedUser.gender === false ? 'Nữ' : 'CHƯA CUNG CẤP'}
                        </span>
                      </div>
                      <div className={styles.cyberInfoItem}>
                        <span className={styles.cyberInfoLabel}><Calendar size={12} /> NGÀY SINH</span>
                        <span className={styles.cyberInfoValue}>
                          {selectedUser.birthday ? new Date(selectedUser.birthday).toLocaleDateString('vi-VN') : 'CHƯA CUNG CẤP'}
                        </span>
                      </div>
                      <div className={styles.cyberInfoItem}>
                        <span className={styles.cyberInfoLabel}><Layers size={12} /> CHUYÊN NGÀNH</span>
                        <span className={styles.cyberInfoValue}>{selectedUser.major || 'CHƯA CUNG CẤP'}</span>
                      </div>
                      <div className={styles.cyberInfoItem}>
                        <span className={styles.cyberInfoLabel}><Calendar size={12} /> NGÀY THAM GIA</span>
                        <span className={styles.cyberInfoValue}>
                          {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </span>
                      </div>
                      <div className={styles.cyberInfoItem}>
                        <span className={styles.cyberInfoLabel}><Shield size={12} /> VAI TRÒ HỆ THỐNG</span>
                        <span className={styles.cyberInfoValue}>{getRoleBadge(selectedUser.role?.id, selectedUser.role?.name)}</span>
                      </div>
                    </div>
                  </div>
                  {selectedUser.bio && (
                    <div className={styles.cyberBioBlock}>
                      <span className={styles.cyberBioLabel}><FileText size={12} /> TIỂU SỬ / BIOGRAPHY</span>
                      <p className={styles.cyberBioText}>{selectedUser.bio}</p>
                    </div>
                  )}
                </div>

                {/* Section 2: Phân quyền */}
                {canModifyRole && (
                  <div className={styles.cyberSection}>
                    <div className={styles.cyberSectionTitle}>
                      <Settings size={14} /> MODULE QUẢN TRỊ: DELEGATE ROLE
                    </div>
                    <form onSubmit={handleChangeRole} className={styles.cyberForm}>
                      <label htmlFor="roleSelect" className={styles.cyberFormLabel}>CẬP NHẬT PHÂN QUYỀN HỆ THỐNG</label>
                      <div className={styles.cyberActionRow}>
                        <select
                          id="roleSelect"
                          className={styles.cyberSelect}
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                        >
                          <option value="USER">Sinh viên (USER)</option>
                          <option value="USER_ADMIN">Admin Người dùng (USER_ADMIN)</option>
                          <option value="CONTENT_ADMIN">Admin Nội dung (CONTENT_ADMIN)</option>
                        </select>
                        <button type="submit" className={styles.cyberBtn}>
                          <KeyRound size={14} /> GHI ĐÈ
                        </button>
                      </div>
                      {rolesCountInfo && (
                        <div className={styles.cyberLimitGrid}>
                          <div className={styles.cyberLimitItem}>
                            <span>USER_ADMIN CORE SLOTS:</span>
                            <strong>{rolesCountInfo.userAdminCount} / {rolesCountInfo.MAX_USER_ADMIN}</strong>
                          </div>
                          <div className={styles.cyberLimitItem}>
                            <span>CONTENT_ADMIN CORE SLOTS:</span>
                            <strong>{rolesCountInfo.contentAdminCount} / {rolesCountInfo.MAX_CONTENT_ADMIN}</strong>
                          </div>
                        </div>
                      )}
                    </form>
                  </div>
                )}

                {/* Section 3: Thao tác khóa/mở khóa */}
                {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'USER_ADMIN') && (
                  <div className={styles.cyberSection}>
                    <div className={styles.cyberSectionTitle}>
                      <Lock size={14} /> MODULE BẢO MẬT: ACCOUNT SECURITY
                    </div>
                    {selectedUser.active ? (
                      <form onSubmit={handleLockUser} className={styles.cyberForm}>
                        <label htmlFor="lockReasonInput" className={styles.cyberFormLabel}>LÝ DO KHÓA TÀI KHOẢN (LOG ENTRY)</label>
                        <div className={styles.cyberActionRow}>
                          <input
                            id="lockReasonInput"
                            type="text"
                            placeholder="Nhập lý do thực hiện đình chỉ..."
                            className={styles.cyberInput}
                            value={lockReason}
                            onChange={(e) => setLockReason(e.target.value)}
                            required
                          />
                          <button type="submit" className={`${styles.cyberBtn} ${styles.cyberBtnLock}`}>
                            <Lock size={14} /> ĐÌNH CHỈ
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className={styles.cyberUnlockRow}>
                        <div className={styles.cyberStatusMessage}>
                          <ShieldAlert size={16} className={styles.warnIcon} />
                          <span>Tài khoản hiện đang bị đình chỉ quyền truy cập hệ thống.</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={handleUnlockUser} 
                          className={`${styles.cyberBtn} ${styles.cyberBtnUnlock}`}
                        >
                          <Unlock size={14} /> BÃI BỎ ĐÌNH CHỈ
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Modal Thêm tài khoản mới (Chỉ dành cho SUPER_ADMIN và ADMIN) */}
      <AnimatePresence>
        {isAddModalOpen && canModifyRole && (
          <motion.div 
            className={`${styles.modalOverlay} ${styles.cyberOverlay}`} 
            onClick={() => setIsAddModalOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <motion.div 
              className={`${styles.modalContent} ${styles.cyberModal}`} 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
            <div className={`${styles.modalHeader} ${styles.cyberHeader}`}>
              <h2 className={styles.cyberModalTitle}>Tạo tài khoản Admin con</h2>
              <button className={styles.cyberCloseBtn} onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.cyberBody}>
              {addError && <div className={`${styles.cyberAlert} ${styles.cyberAlertError}`}>{addError}</div>}
              {addSuccess && <div className={`${styles.cyberAlert} ${styles.cyberAlertSuccess}`}>{addSuccess}</div>}
              <form onSubmit={handleAddUser} className={styles.cyberForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="addUsername" className={styles.cyberFormLabel}>Tên đăng nhập (Username) *</label>
                  <input
                    id="addUsername"
                    type="text"
                    placeholder="Nhập tên đăng nhập..."
                    className={styles.cyberInput}
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    required
                    maxLength={20}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="addFullname" className={styles.cyberFormLabel}>Họ và tên *</label>
                  <input
                    id="addFullname"
                    type="text"
                    placeholder="Nhập họ và tên..."
                    className={styles.cyberInput}
                    value={addForm.fullname}
                    onChange={(e) => setAddForm({ ...addForm, fullname: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="addEmail" className={styles.cyberFormLabel}>Email *</label>
                  <input
                    id="addEmail"
                    type="email"
                    placeholder="Nhập địa chỉ email..."
                    className={styles.cyberInput}
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="addPassword" className={styles.cyberFormLabel}>Mật khẩu *</label>
                  <input
                    id="addPassword"
                    type="password"
                    placeholder="Nhập mật khẩu..."
                    className={styles.cyberInput}
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="addPhone" className={styles.cyberFormLabel}>Số điện thoại</label>
                  <input
                    id="addPhone"
                    type="tel"
                    placeholder="Nhập số điện thoại..."
                    className={styles.cyberInput}
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="addBirthday" className={styles.cyberFormLabel}>Ngày sinh</label>
                  <input
                    id="addBirthday"
                    type="date"
                    className={styles.cyberInput}
                    value={addForm.birthday}
                    onChange={(e) => setAddForm({ ...addForm, birthday: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="addRole" className={styles.cyberFormLabel}>Vai trò Admin con *</label>
                  <select
                    id="addRole"
                    className={styles.cyberSelect}
                    value={addForm.roleId}
                    onChange={(e) => setAddForm({ ...addForm, roleId: e.target.value })}
                  >
                    <option value="USER_ADMIN">Admin Người dùng (Tối đa 2)</option>
                    <option value="CONTENT_ADMIN">Admin Nội dung (Tối đa 2)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button 
                    type="button" 
                    className={styles.cyberBtnCancel} 
                    onClick={() => setIsAddModalOpen(false)}
                    disabled={isSubmittingAdd}
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    className={styles.cyberBtn}
                    disabled={isSubmittingAdd}
                  >
                    {isSubmittingAdd ? 'Đang tạo...' : 'Tạo tài khoản'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}
