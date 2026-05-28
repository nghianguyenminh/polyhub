'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

import { Suspense } from 'react';

function AdminMentorsContent() {
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'danger' } | null>(null);

  const [rejectReason, setRejectReason] = useState('');
  const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'REJECT' | 'REVOKE' | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  
  const pageParam = searchParams.get('page');
  const statusParam = searchParams.get('status') || 'ALL';

  useEffect(() => {
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    setCurrentPage(page);
    loadRequests(page, statusParam);
  }, [pageParam, statusParam]);

  const loadRequests = async (page: number, status: string) => {
    setLoading(true);
    try {
      const data = await fetchAPI(`/api/admin/mentors?page=${page}&status=${status}`);
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

  const handlePageChange = (page: number) => {
    router.push(`/admin/mentors?page=${page}&status=${statusParam}`);
  };

  const handleStatusFilter = (status: string) => {
    router.push(`/admin/mentors?page=1&status=${status}`);
  };

  const handleApprove = async (id: number) => {
    try {
      const result = await fetchAPI(`/api/admin/mentors/${id}/approve`, { method: 'POST' });
      setMessage({ text: result.message, type: 'success' });
      loadRequests(currentPage, statusParam);
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi phê duyệt', type: 'danger' });
    }
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
      
      const modalEl = document.getElementById('rejectModal');
      const modal = (window as any).bootstrap?.Modal.getInstance(modalEl);
      modal?.hide();

      setRejectReason('');
      setSelectedReqId(null);
      setActionType(null);
      loadRequests(currentPage, statusParam);
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi xử lý', type: 'danger' });
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-uppercase text-muted" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>
              <li className="breadcrumb-item"><Link href="/admin" className="text-decoration-none text-muted">Trang chủ</Link></li>
              <li className="breadcrumb-item"><span className="text-muted">Quản lý</span></li>
              <li className="breadcrumb-item active" aria-current="page">Kiểm duyệt Mentor</li>
            </ol>
          </nav>
          <h3 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Kiểm duyệt Mentor</h3>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show rounded-3 border-0 shadow-sm`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="poly-card p-3 bg-white rounded-3 shadow-sm border-0 border-start border-4 border-warning h-100">
            <div className="text-muted fw-medium" style={{ fontSize: '13px' }}>Chờ phê duyệt</div>
            <h3 className="fw-bold text-dark mt-1 mb-0">{stats.pending}</h3>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="poly-card p-3 bg-white rounded-3 shadow-sm border-0 border-start border-4 border-success h-100">
            <div className="text-muted fw-medium" style={{ fontSize: '13px' }}>Mentor chính thức</div>
            <h3 className="fw-bold text-dark mt-1 mb-0">{stats.approved}</h3>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="poly-card p-3 bg-white rounded-3 shadow-sm border-0 border-start border-4 border-danger h-100">
            <div className="text-muted fw-medium" style={{ fontSize: '13px' }}>Bị từ chối / Tước quyền</div>
            <h3 className="fw-bold text-dark mt-1 mb-0">{stats.rejected}</h3>
          </div>
        </div>
      </div>

      <div className="filter-card bg-white rounded-3 shadow-sm border border-light p-3 mb-4 d-flex gap-2">
        <button onClick={() => handleStatusFilter('ALL')} className={`btn btn-sm ${statusParam === 'ALL' ? 'btn-primary' : 'btn-outline-secondary'}`}>Tất cả</button>
        <button onClick={() => handleStatusFilter('PENDING')} className={`btn btn-sm ${statusParam === 'PENDING' ? 'btn-warning text-dark' : 'btn-outline-warning'}`}>Chờ duyệt</button>
        <button onClick={() => handleStatusFilter('APPROVED')} className={`btn btn-sm ${statusParam === 'APPROVED' ? 'btn-success' : 'btn-outline-success'}`}>Đã duyệt</button>
        <button onClick={() => handleStatusFilter('REJECTED')} className={`btn btn-sm ${statusParam === 'REJECTED' ? 'btn-danger' : 'btn-outline-danger'}`}>Từ chối</button>
      </div>

      <div className="table-container bg-white rounded-3 shadow-sm border border-light overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle" style={{ fontSize: '13.5px' }}>
            <thead className="table-light">
              <tr>
                <th scope="col" className="ps-4">Ứng viên</th>
                <th scope="col">Kinh nghiệm</th>
                <th scope="col">Link tham khảo</th>
                <th scope="col">Ngày đăng ký</th>
                <th scope="col">Trạng thái</th>
                <th scope="col" className="text-end pe-4">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-5"><div className="spinner-border text-primary" /></td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4 text-muted">Không có yêu cầu nào.</td></tr>
              ) : (
                requests.map(req => (
                  <tr key={req.id}>
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <img 
                          src={req.user?.avatar && req.user.avatar !== 'default.png' ? req.user.avatar : `https://ui-avatars.com/api/?name=${req.fullname}`} 
                          className="rounded-circle" width="36" height="36" alt="avatar" 
                        />
                        <div style={{ lineHeight: '1.4' }}>
                          <div className="fw-semibold text-dark">{req.fullname}</div>
                          <div className="text-muted" style={{ fontSize: '12px' }}>{req.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><div className="text-truncate" style={{ maxWidth: '200px' }}>{req.experience}</div></td>
                    <td>
                      {req.portfolioLink ? <a href={req.portfolioLink} target="_blank" rel="noopener noreferrer" className="text-truncate d-block" style={{ maxWidth: '150px' }}>{req.portfolioLink}</a> : <span className="text-muted fst-italic">Không có</span>}
                    </td>
                    <td className="text-muted">{new Date(req.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>
                      {req.status === 'PENDING' && <span className="badge bg-warning text-dark border-0 px-2 py-1">Chờ duyệt</span>}
                      {req.status === 'APPROVED' && <span className="badge bg-success bg-opacity-10 text-success border-0 px-2 py-1">Đã duyệt</span>}
                      {req.status === 'REJECTED' && <span className="badge bg-danger bg-opacity-10 text-danger border-0 px-2 py-1">Từ chối</span>}
                      {req.status === 'REVOKED' && <span className="badge bg-secondary bg-opacity-10 text-secondary border-0 px-2 py-1">Bị tước quyền</span>}
                    </td>
                    <td className="text-end pe-4">
                      {req.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleApprove(req.id)} className="btn btn-sm btn-outline-success me-2"><i className="bi bi-check-lg"></i> Duyệt</button>
                          <button onClick={() => { setSelectedReqId(req.id); setActionType('REJECT'); }} data-bs-toggle="modal" data-bs-target="#rejectModal" className="btn btn-sm btn-outline-danger"><i className="bi bi-x-lg"></i> Từ chối</button>
                        </>
                      )}
                      {req.status === 'APPROVED' && (
                        <button onClick={() => { setSelectedReqId(req.id); setActionType('REVOKE'); }} data-bs-toggle="modal" data-bs-target="#rejectModal" className="btn btn-sm btn-outline-warning"><i className="bi bi-slash-circle"></i> Tước quyền</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light bg-opacity-50">
            <div className="text-muted" style={{ fontSize: '13px' }}>Trang hiện tại: <b>{currentPage}</b> / <b>{totalPages}</b></div>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link shadow-none" onClick={() => handlePageChange(currentPage - 1)}>Trang trước</button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                    <button className="page-link shadow-none" onClick={() => handlePageChange(page)}>{page}</button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link shadow-none" onClick={() => handlePageChange(currentPage + 1)}>Trang tiếp</button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      {/* Reject / Revoke Modal */}
      <div className="modal fade" id="rejectModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4 border-0 shadow">
            <div className="modal-header border-bottom-0 pb-0">
              <h5 className="modal-title fw-bold">{actionType === 'REJECT' ? 'Từ chối Yêu cầu' : 'Tước quyền Mentor'}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form onSubmit={handleRejectOrRevoke}>
              <div className="modal-body">
                <p className="text-muted mb-3">Vui lòng cung cấp lý do. Lý do này sẽ được gửi trực tiếp qua email cho người dùng.</p>
                <div className="mb-3">
                  <label className="form-label fw-medium">Lý do</label>
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer border-top-0 pt-0">
                <button type="button" className="btn btn-light" data-bs-dismiss="modal">Hủy bỏ</button>
                <button type="submit" className={`btn ${actionType === 'REJECT' ? 'btn-danger' : 'btn-warning'}`}>Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminMentorsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center"><div className="spinner-border text-primary" /></div>}>
      <AdminMentorsContent />
    </Suspense>
  );
}
