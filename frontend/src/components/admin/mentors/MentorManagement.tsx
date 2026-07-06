'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, X, ShieldOff, Clock, UserCheck, UserX, Search, Eye, User, Mail, Phone, CreditCard, Calendar, BookOpen, Lightbulb, Link2, FileText } from 'lucide-react';
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
  const [actionType, setActionType] = useState<'REJECT' | 'REVOKE' | 'REQUEST_UPDATE' | 'INTERVIEW' | null>(null);

  // Detail View Modal State
  const [viewingMentor, setViewingMentor] = useState<any | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

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

  // Fetch current user's role on client-side mount only
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const currentUser = await fetchAPI('/api/auth/me');
        if (currentUser) {
          setCurrentUserRole(currentUser.role);
        }
      } catch (err) {
        console.error('Failed to load current user role:', err);
      }
    };
    fetchCurrentUser();
  }, []);

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
      setMessage(null);
    } catch (err: any) {
      console.error('Failed to fetch mentor requests', err);
      setMessage({ text: err.message || 'Lỗi tải danh sách yêu cầu Mentor', type: 'danger' });
      setRequests([]);
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
    if (!window.confirm('Bạn có chắc chắn muốn duyệt Mentor này?')) return;
    try {
      const result = await fetchAPI(`/api/admin/mentors/${id}/approve`, { method: 'POST' });
      setMessage({ text: result.message, type: 'success' });
      loadRequests(currentPage, statusParam, keywordParam);
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi phê duyệt', type: 'danger' });
    }
  };

  const openModal = (id: number, type: 'REJECT' | 'REVOKE' | 'REQUEST_UPDATE' | 'INTERVIEW') => {
    setSelectedReqId(id);
    setActionType(type);
    setRejectReason('');
  };

  const closeModal = () => {
    setSelectedReqId(null);
    setActionType(null);
    setRejectReason('');
  };

  const openDetailModal = (req: any) => setViewingMentor(req);
  const closeDetailModal = () => setViewingMentor(null);

  const handleRejectOrRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqId || !actionType || !rejectReason.trim()) return;

    try {
      let endpoint = '';
      if (actionType === 'REJECT') endpoint = 'reject';
      else if (actionType === 'REVOKE') endpoint = 'revoke';
      else if (actionType === 'REQUEST_UPDATE') endpoint = 'request-update';
      else if (actionType === 'INTERVIEW') endpoint = 'interview';

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

  const handleViewDocument = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    if (!url) return;

    // Chuẩn hoá sang HTTPS để trình duyệt không chặn "insecure download"
    let secureUrl = url.replace('http://', 'https://');

    // Hỗ trợ các tệp cũ tải lên dạng raw không có đuôi mở rộng
    const isRaw = secureUrl.includes('/raw/upload/');
    const hasExtension = secureUrl.match(/\.[a-zA-Z0-9]+$/) !== null;
    if (isRaw && !hasExtension) {
      secureUrl = `${secureUrl}/cv.pdf`;
    }

    const lowerUrl = secureUrl.toLowerCase();
    const isPdf = lowerUrl.endsWith('.pdf') || lowerUrl.includes('/pdf');
    const isDocx = lowerUrl.endsWith('.docx') || lowerUrl.endsWith('.doc');

    if (isPdf || isDocx) {
      // Dùng Google Docs Viewer để hiển thị PDF/DOCX trực tiếp trong trình duyệt,
      // tránh trường hợp trình duyệt tải file về thay vì xem.
      // Điều này hoạt động cho cả URL dạng /raw/upload/ lẫn /image/upload/.
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(secureUrl)}&embedded=true`;
      window.open(viewerUrl, '_blank');
    } else {
      // Các file khác (ảnh, zip,...) mở trực tiếp
      window.open(secureUrl, '_blank');
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
            <option value="NEEDS_UPDATE">Yêu cầu bổ sung</option>
            <option value="INTERVIEWING">Đang phỏng vấn</option>
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
                <th>Ngày đăng ký làm Mentor</th>
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
                      {req.status === 'NEEDS_UPDATE' && <span className={`${styles.badge}`} style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>Cần bổ sung</span>}
                      {req.status === 'INTERVIEWING' && <span className={`${styles.badge}`} style={{ backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' }}>Đang phỏng vấn</span>}
                      {req.status === 'APPROVED' && <span className={`${styles.badge} ${styles.badgeApproved}`}>Đã duyệt</span>}
                      {req.status === 'REJECTED' && <span className={`${styles.badge} ${styles.badgeRejected}`}>Từ chối</span>}
                      {req.status === 'REVOKED' && <span className={`${styles.badge} ${styles.badgeRevoked}`}>Bị tước quyền</span>}
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        <button onClick={() => openDetailModal(req)} className={`${styles.btnAction} ${styles.btnDetail}`} title="Xem chi tiết">
                          <Eye size={16} /> Chi tiết
                        </button>
                        {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'USER_ADMIN') && (
                          <>
                            {req.status === 'PENDING' && (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={() => openModal(req.id, 'REQUEST_UPDATE')} className={`${styles.btnAction} ${styles.btnReject}`} title="Yêu cầu sửa" style={{ backgroundColor: '#f59e0b', color: 'white', borderColor: '#f59e0b' }}>
                                  <FileText size={16} /> Bổ sung
                                </button>
                                <button onClick={() => openModal(req.id, 'INTERVIEW')} className={`${styles.btnAction} ${styles.btnApprove}`} title="Phỏng vấn" style={{ backgroundColor: '#3b82f6', color: 'white', borderColor: '#3b82f6' }}>
                                  <UserCheck size={16} /> Phỏng vấn
                                </button>
                                <button onClick={() => openModal(req.id, 'REJECT')} className={`${styles.btnAction} ${styles.btnReject}`} title="Từ chối">
                                  <X size={16} /> Từ chối
                                </button>
                                <button onClick={() => handleApprove(req.id)} className={`${styles.btnAction} ${styles.btnApprove}`} title="Duyệt thẳng">
                                  <Check size={16} /> Duyệt
                                </button>
                              </div>
                            )}
                            {req.status === 'INTERVIEWING' && (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={() => handleApprove(req.id)} className={`${styles.btnAction} ${styles.btnApprove}`} title="Duyệt">
                                  <Check size={16} /> Duyệt
                                </button>
                                <button onClick={() => openModal(req.id, 'REJECT')} className={`${styles.btnAction} ${styles.btnReject}`} title="Từ chối">
                                  <X size={16} /> Từ chối
                                </button>
                              </div>
                            )}
                            {req.status === 'NEEDS_UPDATE' && (
                              <button onClick={() => openModal(req.id, 'REJECT')} className={`${styles.btnAction} ${styles.btnReject}`} title="Từ chối (Hồ sơ treo quá lâu)">
                                <X size={16} /> Từ chối
                              </button>
                            )}
                            {req.status === 'APPROVED' && (
                              <button onClick={() => openModal(req.id, 'REVOKE')} className={`${styles.btnAction} ${styles.btnRevoke}`} title="Tước quyền">
                                <ShieldOff size={16} /> Tước quyền
                              </button>
                            )}
                          </>
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
              {actionType === 'REJECT' ? 'Từ chối Yêu cầu Mentor' :
                actionType === 'REVOKE' ? 'Tước quyền Mentor' :
                  actionType === 'REQUEST_UPDATE' ? 'Yêu cầu bổ sung hồ sơ' : 'Gửi thư mời phỏng vấn'}
            </div>
            <form onSubmit={handleRejectOrRevoke}>
              <div className={styles.modalBody}>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '16px' }}>
                  Vui lòng cung cấp nội dung (Lý do/Ghi chú). Nội dung này sẽ được gửi trực tiếp qua email cho người dùng.
                </p>
                <label className={styles.modalLabel}>
                  {actionType === 'INTERVIEW' ? 'Thông tin & Lịch phỏng vấn' :
                    actionType === 'REQUEST_UPDATE' ? 'Nội dung cần bổ sung' :
                    actionType === 'REJECT' ? 'Lý do từ chối' : 'Lý do tước quyền'}
                </label>
                <textarea
                  className={`${styles.modalTextarea} ${actionType === 'REVOKE' ? styles.modalTextareaRevoke : ''}`}
                  required
                  placeholder={
                    actionType === 'INTERVIEW' ? 'Nhập thời gian, link Google Meet...' :
                    actionType === 'REQUEST_UPDATE' ? 'Nhập các giấy tờ hoặc thông tin cần ứng viên cung cấp thêm...' :
                    'Nhập lý do tại đây...'
                  }
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

      {/* ── Mentor Detail Modal ── */}
      {viewingMentor && (
        <div className={styles.detailOverlay} onClick={closeDetailModal}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className={styles.detailHeader}>
              <div className={styles.detailHeaderLeft}>
                <img
                  src={viewingMentor.user?.avatar && viewingMentor.user.avatar !== 'default.png'
                    ? viewingMentor.user.avatar
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(viewingMentor.fullname)}&size=80&background=4F46E5&color=fff`}
                  className={styles.detailAvatar}
                  alt="avatar"
                />
                <div>
                  <div className={styles.detailName}>{viewingMentor.fullname}</div>
                  <div className={styles.detailEmail}>{viewingMentor.email}</div>
                  <div style={{ marginTop: 8 }}>
                    {viewingMentor.status === 'PENDING' && <span className={`${styles.badge} ${styles.badgePending}`}>⏳ Chờ duyệt</span>}
                    {viewingMentor.status === 'NEEDS_UPDATE' && <span className={`${styles.badge}`} style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>📝 Cần bổ sung</span>}
                    {viewingMentor.status === 'INTERVIEWING' && <span className={`${styles.badge}`} style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>🎙️ Đang phỏng vấn</span>}
                    {viewingMentor.status === 'APPROVED' && <span className={`${styles.badge} ${styles.badgeApproved}`}>✅ Đã duyệt</span>}
                    {viewingMentor.status === 'REJECTED' && <span className={`${styles.badge} ${styles.badgeRejected}`}>❌ Từ chối</span>}
                    {viewingMentor.status === 'REVOKED' && <span className={`${styles.badge} ${styles.badgeRevoked}`}>🚫 Tước quyền</span>}
                  </div>
                </div>
              </div>
              <button className={styles.detailClose} onClick={closeDetailModal} title="Đóng">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className={styles.detailBody}>

              {/* Section: Thông tin cá nhân */}
              <div className={styles.detailSection}>
                <div className={styles.detailSectionTitle}>
                  <User size={15} /> Thông tin cá nhân
                </div>
                <div className={styles.detailGrid}>
                  <div className={styles.detailField}>
                    <div className={styles.detailFieldLabel}><CreditCard size={13} /> Số CCCD / CMND</div>
                    <div className={styles.detailFieldValue}>{viewingMentor.cccdNumber || '—'}</div>
                  </div>
                  <div className={styles.detailField}>
                    <div className={styles.detailFieldLabel}><Mail size={13} /> Email</div>
                    <div className={styles.detailFieldValue}>{viewingMentor.email || '—'}</div>
                  </div>
                  <div className={styles.detailField}>
                    <div className={styles.detailFieldLabel}><Calendar size={13} /> Ngày sinh</div>
                    <div className={styles.detailFieldValue}>
                      {viewingMentor.birthday
                        ? new Date(viewingMentor.birthday).toLocaleDateString('vi-VN')
                        : '—'}
                    </div>
                  </div>
                  <div className={styles.detailField}>
                    <div className={styles.detailFieldLabel}><Calendar size={13} /> Ngày đăng ký</div>
                    <div className={styles.detailFieldValue}>
                      {new Date(viewingMentor.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Kinh nghiệm & Động lực */}
              <div className={styles.detailSection}>
                <div className={styles.detailSectionTitle}>
                  <BookOpen size={15} /> Kinh nghiệm &amp; Động lực
                </div>
                {viewingMentor.experience && (
                  <div className={styles.detailField} style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.detailFieldLabel}><BookOpen size={13} /> Giới thiệu &amp; Kinh nghiệm</div>
                    <div className={`${styles.detailFieldValue} ${styles.detailTextBlock}`}>{viewingMentor.experience}</div>
                  </div>
                )}
                {viewingMentor.introduction && (
                  <div className={styles.detailField} style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.detailFieldLabel}><BookOpen size={13} /> Giới thiệu bản thân</div>
                    <div className={`${styles.detailFieldValue} ${styles.detailTextBlock}`}>{viewingMentor.introduction}</div>
                  </div>
                )}
                {viewingMentor.motivation && (
                  <div className={styles.detailField} style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.detailFieldLabel}><Lightbulb size={13} /> Động lực trở thành Mentor</div>
                    <div className={`${styles.detailFieldValue} ${styles.detailTextBlock}`}>{viewingMentor.motivation}</div>
                  </div>
                )}
              </div>

              {/* Section: Hồ sơ & Liên kết */}
              <div className={styles.detailSection}>
                <div className={styles.detailSectionTitle}>
                  <FileText size={15} /> Hồ sơ &amp; Liên kết
                </div>
                <div className={styles.detailGrid}>
                  {viewingMentor.portfolioLink && (
                    <div className={styles.detailField}>
                      <div className={styles.detailFieldLabel}><Link2 size={13} /> Link Portfolio / LinkedIn</div>
                      <a
                        href={viewingMentor.portfolioLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.detailLink}
                      >
                        {viewingMentor.portfolioLink}
                      </a>
                    </div>
                  )}
                  {viewingMentor.cccdFrontFile && (
                    <div className={styles.detailField}>
                      <div className={styles.detailFieldLabel}><FileText size={13} /> Mặt trước CCCD</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a
                          href="#"
                          onClick={(e) => handleViewDocument(e, viewingMentor.cccdFrontFile)}
                          className={styles.detailFileChip}
                        >
                          🖼️ Xem Ảnh
                        </a>
                        <a
                          href={viewingMentor.cccdFrontFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.detailFileChip}
                          style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
                          title="Tải trực tiếp từ Cloudinary"
                        >
                          📥 Tải về
                        </a>
                      </div>
                    </div>
                  )}
                  {viewingMentor.cccdBackFile && (
                    <div className={styles.detailField}>
                      <div className={styles.detailFieldLabel}><FileText size={13} /> Mặt sau CCCD</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a
                          href="#"
                          onClick={(e) => handleViewDocument(e, viewingMentor.cccdBackFile)}
                          className={styles.detailFileChip}
                        >
                          🖼️ Xem Ảnh
                        </a>
                        <a
                          href={viewingMentor.cccdBackFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.detailFileChip}
                          style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
                          title="Tải trực tiếp từ Cloudinary"
                        >
                          📥 Tải về
                        </a>
                      </div>
                    </div>
                  )}
                  {viewingMentor.faceFile && (
                    <div className={styles.detailField}>
                      <div className={styles.detailFieldLabel}><FileText size={13} /> Ảnh chân dung</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a
                          href="#"
                          onClick={(e) => handleViewDocument(e, viewingMentor.faceFile)}
                          className={styles.detailFileChip}
                        >
                          🖼️ Xem Ảnh
                        </a>
                        <a
                          href={viewingMentor.faceFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.detailFileChip}
                          style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
                          title="Tải trực tiếp từ Cloudinary"
                        >
                          📥 Tải về
                        </a>
                      </div>
                    </div>
                  )}
                  {viewingMentor.cvFile && (
                    <div className={styles.detailField}>
                      <div className={styles.detailFieldLabel}><FileText size={13} /> CV</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a
                          href="#"
                          onClick={(e) => handleViewDocument(e, viewingMentor.cvFile)}
                          className={styles.detailFileChip}
                        >
                          📄 Xem CV
                        </a>
                        <a
                          href={viewingMentor.cvFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.detailFileChip}
                          style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
                          title="Tải trực tiếp từ Cloudinary"
                        >
                          📥 Tải về
                        </a>
                      </div>
                    </div>
                  )}
                  {viewingMentor.certificateFile && (
                    <div className={styles.detailField}>
                      <div className={styles.detailFieldLabel}><FileText size={13} /> Chứng chỉ</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a
                          href="#"
                          onClick={(e) => handleViewDocument(e, viewingMentor.certificateFile)}
                          className={styles.detailFileChip}
                        >
                          📜 Xem Chứng chỉ
                        </a>
                        <a
                          href={viewingMentor.certificateFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.detailFileChip}
                          style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
                          title="Tải trực tiếp từ Cloudinary"
                        >
                          📥 Tải về
                        </a>
                      </div>
                    </div>
                  )}
                  {viewingMentor.degreeFile && (
                    <div className={styles.detailField}>
                      <div className={styles.detailFieldLabel}><FileText size={13} /> Bằng cấp</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a
                          href="#"
                          onClick={(e) => handleViewDocument(e, viewingMentor.degreeFile)}
                          className={styles.detailFileChip}
                        >
                          🎓 Xem Bằng cấp
                        </a>
                        <a
                          href={viewingMentor.degreeFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.detailFileChip}
                          style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
                          title="Tải trực tiếp từ Cloudinary"
                        >
                          📥 Tải về
                        </a>
                      </div>
                    </div>
                  )}
                  {!viewingMentor.portfolioLink && !viewingMentor.cvFile && !viewingMentor.certificateFile && !viewingMentor.degreeFile && !viewingMentor.faceFile && (
                    <div style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.875rem', padding: '8px 0' }}>
                      Không có tài liệu đính kèm.
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes if any */}
              {viewingMentor.adminNotes && (
                <div className={styles.detailSection}>
                  <div className={styles.detailSectionTitle} style={{ color: '#b91c1c' }}>
                    <FileText size={15} /> Ghi chú của Admin / Phỏng vấn
                  </div>
                  <div className={`${styles.detailFieldValue} ${styles.detailTextBlock} ${styles.detailRejectBlock}`} style={{ backgroundColor: '#fef3c7', color: '#92400e', borderLeftColor: '#f59e0b' }}>
                    {viewingMentor.adminNotes}
                  </div>
                </div>
              )}

              {/* Rejection reason if any */}
              {(viewingMentor.status === 'REJECTED' || viewingMentor.status === 'REVOKED') && viewingMentor.rejectionReason && (
                <div className={styles.detailSection}>
                  <div className={styles.detailSectionTitle} style={{ color: '#b91c1c' }}>
                    <X size={15} /> Lý do từ chối / tước quyền
                  </div>
                  <div className={`${styles.detailFieldValue} ${styles.detailTextBlock} ${styles.detailRejectBlock}`}>
                    {viewingMentor.rejectionReason}
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className={styles.detailFooter}>
              <button className={styles.modalBtnCancel} onClick={closeDetailModal}>
                Đóng
              </button>
              {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'USER_ADMIN') && (
                <>
                  {viewingMentor.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        className={`${styles.btnAction} ${styles.btnApprove}`}
                        style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', borderColor: '#3b82f6' }}
                        onClick={() => { closeDetailModal(); openModal(viewingMentor.id, 'INTERVIEW'); }}
                      >
                        <UserCheck size={16} /> Phỏng vấn
                      </button>
                      <button
                        className={`${styles.btnAction} ${styles.btnReject}`}
                        style={{ padding: '8px 16px', backgroundColor: '#f59e0b', color: 'white', borderColor: '#f59e0b' }}
                        onClick={() => { closeDetailModal(); openModal(viewingMentor.id, 'REQUEST_UPDATE'); }}
                      >
                        <FileText size={16} /> Yêu cầu bổ sung
                      </button>
                      <button
                        className={`${styles.btnAction} ${styles.btnApprove}`}
                        style={{ padding: '8px 16px' }}
                        onClick={() => { closeDetailModal(); handleApprove(viewingMentor.id); }}
                      >
                        <Check size={16} /> Duyệt ngay
                      </button>
                      <button
                        className={`${styles.btnAction} ${styles.btnReject}`}
                        style={{ padding: '8px 16px' }}
                        onClick={() => { closeDetailModal(); openModal(viewingMentor.id, 'REJECT'); }}
                      >
                        <X size={16} /> Từ chối
                      </button>
                    </div>
                  )}
                  {viewingMentor.status === 'INTERVIEWING' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className={`${styles.btnAction} ${styles.btnApprove}`}
                        style={{ padding: '8px 16px' }}
                        onClick={() => { closeDetailModal(); handleApprove(viewingMentor.id); }}
                      >
                        <Check size={16} /> Duyệt
                      </button>
                      <button
                        className={`${styles.btnAction} ${styles.btnReject}`}
                        style={{ padding: '8px 16px' }}
                        onClick={() => { closeDetailModal(); openModal(viewingMentor.id, 'REJECT'); }}
                      >
                        <X size={16} /> Từ chối
                      </button>
                    </div>
                  )}
                  {viewingMentor.status === 'NEEDS_UPDATE' && (
                    <button
                      className={`${styles.btnAction} ${styles.btnReject}`}
                      style={{ padding: '8px 16px' }}
                      onClick={() => { closeDetailModal(); openModal(viewingMentor.id, 'REJECT'); }}
                    >
                      <X size={16} /> Từ chối
                    </button>
                  )}
                  {viewingMentor.status === 'APPROVED' && (
                    <button
                      className={`${styles.btnAction} ${styles.btnRevoke}`}
                      style={{ padding: '8px 16px' }}
                      onClick={() => { closeDetailModal(); openModal(viewingMentor.id, 'REVOKE'); }}
                    >
                      <ShieldOff size={16} /> Tước quyền
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}