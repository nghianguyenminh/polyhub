'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, X, ShieldOff, Clock, UserCheck, UserX, Search } from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import styles from './MentorManagement.module.css';

export default function MentorManagement() {
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'danger' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [rejectReason, setRejectReason] = useState('');
  const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'REJECT' | 'REVOKE' | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const pageParam = searchParams.get('page');
  const statusParam = searchParams.get('status') || 'ALL';
  const keywordParam = searchParams.get('keyword') || ''; // Lấy keyword từ URL

  // 1. Xử lý tự động tìm kiếm (Debounce 0.5s)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm !== keywordParam) {
        // Cập nhật URL khi người dùng gõ xong
        router.push(`/admin/mentors?page=1&status=${statusParam}&keyword=${encodeURIComponent(searchTerm)}`);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusParam, keywordParam, router]);

  // 2. Load dữ liệu mỗi khi URL thay đổi (có page, status hoặc keyword mới)
  useEffect(() => {
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    setCurrentPage(page);
    setSearchTerm(keywordParam); // Giữ cho ô input đồng bộ với URL
    loadRequests(page, statusParam, keywordParam); // Truyền keyword vào hàm load
  }, [pageParam, statusParam, keywordParam]);

  // 3. Hàm gọi API (đã thêm keyword)
  const loadRequests = async (page: number, status: string, keyword: string) => {
    setLoading(true);
    try {
      const data = await fetchAPI(`/api/admin/mentors?page=${page}&status=${status}&keyword=${encodeURIComponent(keyword)}`);
      setRequests(data.requests || []);
      setTotalPages(data.totalPages || 1);
      setStats({
        pending: data.pendingCount || 0,
        approved: data.approvedCount || 0,
        rejected: data.rejectedCount || 0
      });
    } catch (err) {
      console.error('Failed to fetch mentor requests', err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Giữ nguyên keyword khi đổi trang hoặc lọc trạng thái
  const handlePageChange = (page: number) => {
    router.push(`/admin/mentors?page=${page}&status=${statusParam}&keyword=${encodeURIComponent(keywordParam)}`);
  };

  const handleStatusFilter = (status: string) => {
    router.push(`/admin/mentors?page=1&status=${status}&keyword=${encodeURIComponent(keywordParam)}`);
  };

  const handleApprove = async (id: number) => {
    try {
      const result = await fetchAPI(`/api/admin/mentors/${id}/approve`, { method: 'POST' });
      setMessage({ text: result.message, type: 'success' });
      loadRequests(currentPage, statusParam, keywordParam);
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi phê duyệt', type: 'danger' });
    }
  };

  const openModal = (id: number, type: 'REJECT' | 'REVOKE') => {
    setSelectedReqId(id);
    setActionType(type);
    setRejectReason('');
  };

  const closeModal = () => {
    setSelectedReqId(null);
    setActionType(null);
    setRejectReason('');
  };

  const handleRejectOrRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqId || !actionType || !rejectReason.trim()) return;

    try {
      const endpoint = actionType === 'REJECT' ? 'reject' : 'revoke';
      const result = await fetchAPI(`/api/admin/mentors/${selectedReqId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      });
      setMessage({ text: result.message, type: 'success' });
      closeModal();
      loadRequests(currentPage, statusParam, keywordParam);
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi xử lý', type: 'danger' });
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Kiểm duyệt Mentor</h1>
          <p className={styles.pageSubtitle}>Quản lý và phê duyệt yêu cầu trở thành người hướng dẫn.</p>
        </div>
      </header>

      {message && (
        <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertDanger}`}>
          <span>{message.text}</span>
          <button className={styles.closeAlert} onClick={() => setMessage(null)}><X size={16} /></button>
        </div>
      )}

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statWarning}`}>
          <div className={styles.statCardInner}>
            <div className={styles.statInfo}>
              <div className={styles.statLabel}>Chờ phê duyệt</div>
              <div className={styles.statValue}>{stats.pending}</div>
              <div className={styles.statDesc}>Đang chờ xem xét</div>
            </div>
            <div className={`${styles.statIconWrap} ${styles.statIconWarning}`}>
              <Clock size={24} />
            </div>
          </div>
          <div className={`${styles.statBar} ${styles.statBarWarning}`} />
        </div>
        <div className={`${styles.statCard} ${styles.statSuccess}`}>
          <div className={styles.statCardInner}>
            <div className={styles.statInfo}>
              <div className={styles.statLabel}>Mentor chính thức</div>
              <div className={styles.statValue}>{stats.approved}</div>
              <div className={styles.statDesc}>Đã được phê duyệt</div>
            </div>
            <div className={`${styles.statIconWrap} ${styles.statIconSuccess}`}>
              <UserCheck size={24} />
            </div>
          </div>
          <div className={`${styles.statBar} ${styles.statBarSuccess}`} />
        </div>
        <div className={`${styles.statCard} ${styles.statDanger}`}>
          <div className={styles.statCardInner}>
            <div className={styles.statInfo}>
              <div className={styles.statLabel}>Từ chối / Tước quyền</div>
              <div className={styles.statValue}>{stats.rejected}</div>
              <div className={styles.statDesc}>Không được chấp thuận</div>
            </div>
            <div className={`${styles.statIconWrap} ${styles.statIconDanger}`}>
              <UserX size={24} />
            </div>
          </div>
          <div className={`${styles.statBar} ${styles.statBarDanger}`} />
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className={styles.selectInput}
            value={statusParam}
            onChange={(e) => handleStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
            <option value="REVOKED">Tước quyền</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ứng viên</th>
                <th>Kinh nghiệm</th>
                <th>Link tham khảo</th>
                <th>Ngày đăng ký</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: '#4F46E5', fontWeight: 500 }}>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
                    Không có yêu cầu nào phù hợp.
                  </td>
                </tr>
              ) : (
                requests.map(req => (
                  <tr key={req.id}>
                    <td>
                      <div className={styles.userInfo}>
                        <img
                          src={req.user?.avatar && req.user.avatar !== 'default.png' ? req.user.avatar : `https://ui-avatars.com/api/?name=${req.fullname}`}
                          className={styles.avatar}
                          alt="avatar"
                        />
                        <div>
                          <div className={styles.userName}>{req.fullname}</div>
                          <div className={styles.userEmail}>{req.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.experienceText}>{req.experience}</div>
                    </td>
                    <td>
                      {req.portfolioLink ? (
                        <a href={req.portfolioLink} target="_blank" rel="noopener noreferrer" className={styles.portfolioLink}>
                          {req.portfolioLink}
                        </a>
                      ) : (
                        <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.875rem' }}>Không có</span>
                      )}
                    </td>
                    <td style={{ color: '#4b5563', fontSize: '0.875rem' }}>
                      {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      {req.status === 'PENDING' && <span className={`${styles.badge} ${styles.badgePending}`}>Chờ duyệt</span>}
                      {req.status === 'APPROVED' && <span className={`${styles.badge} ${styles.badgeApproved}`}>Đã duyệt</span>}
                      {req.status === 'REJECTED' && <span className={`${styles.badge} ${styles.badgeRejected}`}>Từ chối</span>}
                      {req.status === 'REVOKED' && <span className={`${styles.badge} ${styles.badgeRevoked}`}>Bị tước quyền</span>}
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        {req.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleApprove(req.id)} className={`${styles.btnAction} ${styles.btnApprove}`} title="Duyệt">
                              <Check size={16} /> Duyệt
                            </button>
                            <button onClick={() => openModal(req.id, 'REJECT')} className={`${styles.btnAction} ${styles.btnReject}`} title="Từ chối">
                              <X size={16} /> Từ chối
                            </button>
                          </>
                        )}
                        {req.status === 'APPROVED' && (
                          <button onClick={() => openModal(req.id, 'REVOKE')} className={`${styles.btnAction} ${styles.btnRevoke}`} title="Tước quyền">
                            <ShieldOff size={16} /> Tước quyền
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <div className={styles.pageInfo}>
              Trang <strong>{currentPage}</strong> / {totalPages}
            </div>
            <div className={styles.pageControls}>
              <button
                className={styles.pageBtn}
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className={styles.pageBtn}
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Tiếp
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject / Revoke Custom Modal */}
      {actionType && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              {actionType === 'REJECT' ? 'Từ chối Yêu cầu Mentor' : 'Tước quyền Mentor'}
            </div>
            <form onSubmit={handleRejectOrRevoke}>
              <div className={styles.modalBody}>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '16px' }}>
                  Vui lòng cung cấp lý do. Lý do này sẽ được gửi trực tiếp qua email cho người dùng.
                </p>
                <label className={styles.modalLabel}>Lý do</label>
                <textarea
                  className={`${styles.modalTextarea} ${actionType === 'REVOKE' ? styles.modalTextareaRevoke : ''}`}
                  required
                  placeholder="Nhập lý do tại đây..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.modalBtnCancel} onClick={closeModal}>
                  Hủy bỏ
                </button>
                <button type="submit" className={`${styles.modalBtnSubmit} ${actionType === 'REVOKE' ? styles.modalBtnSubmitWarning : ''}`}>
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}