'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

import { Suspense } from 'react';

function AdminReportsContent() {
  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, resolved: 0, falseCount: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'danger' } | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pageParam = searchParams.get('page');

  useEffect(() => {
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    setCurrentPage(page);
    loadReports(page);
  }, [pageParam]);

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

  const loadReports = async (page: number) => {
    setLoading(true);
    try {
      const data = await fetchAPI(`/api/admin/reports?page=${page}`);
      setReports(data.reports || []);
      setTotalPages(data.totalPages || 1);
      setStats({
        pending: data.pendingCount || 0,
        resolved: data.resolvedCount || 0,
        falseCount: data.falseCount || 0
      });
    } catch (err: any) {
      console.error('Failed to fetch reports', err);
      setMessage({ text: err.message || 'Lỗi tải danh sách báo cáo vi phạm', type: 'danger' });
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    router.push(`/admin/reports?page=${page}`);
  };

  const handleApprove = async (id: number) => {
    if (!confirm('Hành động này sẽ XÓA bài viết và xử lý báo cáo. Bạn có chắc không?')) return;
    try {
      const result = await fetchAPI(`/api/admin/reports/${id}/approve`, { method: 'POST' });
      setMessage({ text: result.message, type: 'success' });
      loadReports(currentPage);
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi xử lý báo cáo', type: 'danger' });
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Từ chối báo cáo này (Báo cáo sai sự thật)? Báo cáo sẽ bị xóa.')) return;
    try {
      const result = await fetchAPI(`/api/admin/reports/${id}/reject`, { method: 'POST' });
      setMessage({ text: result.message, type: 'success' });
      loadReports(currentPage);
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi từ chối báo cáo', type: 'danger' });
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-uppercase text-muted" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>
              <li className="breadcrumb-item"><Link href="/admin" className="text-decoration-none text-muted">Trang chủ</Link></li>
              <li className="breadcrumb-item"><span className="text-muted">Kiểm soát</span></li>
              <li className="breadcrumb-item active" aria-current="page">Báo cáo vi phạm</li>
            </ol>
          </nav>
          <h3 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Xử lý Báo cáo</h3>
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
            <div className="text-muted fw-medium" style={{ fontSize: '13px' }}>Đang chờ xử lý</div>
            <h3 className="fw-bold text-dark mt-1 mb-0">{stats.pending}</h3>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="poly-card p-3 bg-white rounded-3 shadow-sm border-0 border-start border-4 border-success h-100">
            <div className="text-muted fw-medium" style={{ fontSize: '13px' }}>Đã xử lý (Xóa bài)</div>
            <h3 className="fw-bold text-dark mt-1 mb-0">{stats.resolved}</h3>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="poly-card p-3 bg-white rounded-3 shadow-sm border-0 border-start border-4 border-danger h-100">
            <div className="text-muted fw-medium" style={{ fontSize: '13px' }}>Báo cáo sai</div>
            <h3 className="fw-bold text-dark mt-1 mb-0">{stats.falseCount}</h3>
          </div>
        </div>
      </div>

      <div className="table-container bg-white rounded-3 shadow-sm border border-light overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle" style={{ fontSize: '13.5px' }}>
            <thead className="table-light">
              <tr>
                <th scope="col" className="ps-4">Nội dung báo cáo</th>
                <th scope="col">Người bị báo cáo</th>
                <th scope="col">Người báo cáo</th>
                <th scope="col">Ngày gửi</th>
                <th scope="col" className="text-end pe-4">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-5"><div className="spinner-border text-primary" /></td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-4 text-muted">Không có báo cáo vi phạm nào.</td></tr>
              ) : (
                reports.map(report => (
                  <tr key={report.id}>
                    <td className="ps-4 py-3">
                      <div className="fw-semibold text-danger mb-1">
                        <i className="bi bi-exclamation-triangle-fill me-1"></i> {report.reason}
                      </div>
                      <div className="text-muted text-truncate" style={{ maxWidth: '300px', fontSize: '12px' }}>
                        Bài viết: {report.post?.content || 'Đã bị xóa'}
                      </div>
                    </td>
                    <td>
                      {report.post?.user ? (
                        <div className="d-flex align-items-center gap-2">
                          <img 
                            src={report.post.user.avatar && report.post.user.avatar !== 'default.png' ? report.post.user.avatar : `https://ui-avatars.com/api/?name=${report.post.user.fullname}`} 
                            className="rounded-circle" width="24" height="24" alt="avatar" 
                          />
                          <span className="fw-medium text-dark">{report.post.user.fullname}</span>
                        </div>
                      ) : (
                        <span className="text-muted fst-italic">Không rõ</span>
                      )}
                    </td>
                    <td>
                      {report.reporter ? (
                        <span className="text-muted">{report.reporter.fullname}</span>
                      ) : (
                        <span className="text-muted">Ẩn danh</span>
                      )}
                    </td>
                    <td className="text-muted">
                      {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="text-end pe-4">
                      {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'CONTENT_ADMIN') ? (
                        <>
                          <button 
                            onClick={() => handleApprove(report.id)} 
                            className="btn btn-sm btn-outline-danger me-2" 
                            title="Xóa bài viết (Đồng ý báo cáo)"
                          >
                            <i className="bi bi-trash"></i> Xóa bài
                          </button>
                          <button 
                            onClick={() => handleReject(report.id)} 
                            className="btn btn-sm btn-outline-secondary" 
                            title="Từ chối (Báo cáo sai)"
                          >
                            <i className="bi bi-x-circle"></i> Từ chối
                          </button>
                        </>
                      ) : (
                        <span className="text-muted fst-italic" style={{ fontSize: '12.5px' }}>Xem duy nhất</span>
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
            <div className="text-muted" style={{ fontSize: '13px' }}>
              Trang hiện tại: <b>{currentPage}</b> / <b>{totalPages}</b>
            </div>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link shadow-none" onClick={() => handlePageChange(currentPage - 1)}>Trang trước</button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                    <button 
                      className="page-link shadow-none" 
                      style={currentPage === page ? { backgroundColor: '#4F46E5', borderColor: '#4F46E5' } : {}}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
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
    </>
  );
}

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center"><div className="spinner-border text-primary" /></div>}>
      <AdminReportsContent />
    </Suspense>
  );
}
