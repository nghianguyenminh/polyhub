'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

import { Suspense } from 'react';

function TableSkeletonRow() {
  return (
    <tr className="placeholder-glow">
      <td className="ps-4 py-3">
        <div className="d-flex align-items-center gap-3">
          <div className="placeholder bg-secondary rounded" style={{ width: '40px', height: '40px', opacity: 0.15 }} />
          <div style={{ width: '100%' }}>
            <span className="placeholder col-8 bg-secondary rounded d-block mb-1" style={{ height: '15px', opacity: 0.15 }} />
            <span className="placeholder col-5 bg-secondary rounded d-block" style={{ height: '12px', opacity: 0.15 }} />
          </div>
        </div>
      </td>
      <td>
        <span className="placeholder col-6 bg-secondary rounded d-block mb-1" style={{ height: '15px', opacity: 0.15 }} />
        <span className="placeholder col-8 bg-secondary rounded d-block" style={{ height: '12px', opacity: 0.15 }} />
      </td>
      <td>
        <span className="placeholder col-4 bg-secondary rounded d-block" style={{ height: '15px', opacity: 0.15 }} />
      </td>
      <td>
        <span className="placeholder col-6 bg-secondary rounded-pill d-block" style={{ height: '22px', opacity: 0.15 }} />
      </td>
      <td>
        <span className="placeholder col-8 bg-secondary rounded d-block" style={{ height: '15px', opacity: 0.15 }} />
      </td>
      <td className="text-end pe-4">
        <span className="placeholder col-8 bg-secondary rounded d-inline-block" style={{ height: '30px', width: '80px', opacity: 0.15 }} />
      </td>
    </tr>
  );
}

function AdminDocumentsContent() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'danger' | 'warning' } | null>(null);

  const [takedownReason, setTakedownReason] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);

  // Cache categories list for filter dropdown
  const [categories, setCategories] = useState<any[]>([]);
  const [hasLoadedCategories, setHasLoadedCategories] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  
  const pageParam = searchParams.get('page');
  const keywordParam = searchParams.get('keyword') || '';
  const categoryIdParam = searchParams.get('category_id') || '';
  const statusParam = searchParams.get('status') || '';

  // Form inputs
  const [keywordInput, setKeywordInput] = useState(keywordParam);
  const [statusInput, setStatusInput] = useState(statusParam);
  const [categoryInput, setCategoryInput] = useState(categoryIdParam);

  // Sync inputs when params change
  useEffect(() => {
    setKeywordInput(keywordParam);
    setStatusInput(statusParam);
    setCategoryInput(categoryIdParam);
  }, [keywordParam, categoryIdParam, statusParam]);

  useEffect(() => {
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    setCurrentPage(page);
    loadDocuments(page, keywordParam, categoryIdParam, statusParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageParam, keywordParam, categoryIdParam, statusParam]);

  const loadDocuments = async (page: number, keyword: string, categoryId: string, status: string) => {
    setLoading(true);
    try {
      let url = `/api/admin/documents?page=${page}`;
      if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
      if (categoryId) url += `&category_id=${categoryId}`;
      if (status) url += `&status=${status}`;
      if (!hasLoadedCategories) {
        url += `&include_categories=true`;
      }

      const data = await fetchAPI(url);
      setDocuments(data.documents || []);
      setTotalPages(data.totalPages || 1);
      if (data.categories) {
        setCategories(data.categories);
        setHasLoadedCategories(true);
      }
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('page', '1');
    if (keywordInput.trim()) params.set('keyword', keywordInput.trim());
    if (categoryInput) params.set('category_id', categoryInput);
    if (statusInput) params.set('status', statusInput);
    router.push(`/admin/documents?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setKeywordInput('');
    setStatusInput('');
    setCategoryInput('');
    router.push('/admin/documents?page=1');
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/admin/documents?${params.toString()}`);
  };

  const handleApprove = async (id: number) => {
    try {
      const result = await fetchAPI(`/api/admin/documents/${id}/approve`, { method: 'POST' });
      setMessage({ text: result.message, type: 'success' });
      loadDocuments(currentPage, keywordParam, categoryIdParam, statusParam);
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi duyệt tài liệu', type: 'danger' });
    }
  };

  const handleTakedown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !takedownReason.trim()) return;
    
    try {
      const result = await fetchAPI(`/api/admin/documents/${selectedDocId}/takedown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: takedownReason })
      });
      setMessage({ text: result.message, type: 'warning' });
      setSelectedDocId(null);
      setTakedownReason('');
      
      const modalEl = document.getElementById('takedownModal');
      const modal = (window as any).bootstrap?.Modal.getInstance(modalEl);
      modal?.hide();

      loadDocuments(currentPage, keywordParam, categoryIdParam, statusParam);
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi từ chối/gỡ', type: 'danger' });
    }
  };

  const handleRestore = async (id: number) => {
    try {
      const result = await fetchAPI(`/api/admin/documents/${id}/restore`, { method: 'POST' });
      setMessage({ text: result.message, type: 'success' });
      loadDocuments(currentPage, keywordParam, categoryIdParam, statusParam);
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi phục hồi', type: 'danger' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn tài liệu này? Không thể khôi phục!')) return;
    try {
      const result = await fetchAPI(`/api/admin/documents/${id}/delete`, { method: 'POST' });
      setMessage({ text: result.message, type: 'success' });
      loadDocuments(currentPage, keywordParam, categoryIdParam, statusParam);
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi xóa', type: 'danger' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="badge bg-warning text-dark border-0 px-2 py-1">Chờ duyệt</span>;
      case 'APPROVED': return <span className="badge bg-success bg-opacity-10 text-success border-0 px-2 py-1">Đã duyệt</span>;
      case 'REJECTED': return <span className="badge bg-danger bg-opacity-10 text-danger border-0 px-2 py-1">Bị từ chối</span>;
      case 'TAKEDOWN': return <span className="badge bg-secondary bg-opacity-10 text-secondary border-0 px-2 py-1">Đã gỡ</span>;
      default: return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-uppercase text-muted" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>
              <li className="breadcrumb-item"><Link href="/admin" className="text-decoration-none text-muted">Trang chủ</Link></li>
              <li className="breadcrumb-item"><span className="text-muted">Quản lý nội dung</span></li>
              <li className="breadcrumb-item active" aria-current="page">Tài liệu</li>
            </ol>
          </nav>
          <h3 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Quản lý Tài liệu</h3>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show rounded-3 border-0 shadow-sm`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="poly-card p-3 mb-4 bg-white rounded-3 shadow-sm border border-light">
        <form onSubmit={handleFilterSubmit} className="row g-3 align-items-center">
          <div className="col-12 col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 text-muted"><i className="bi bi-search"></i></span>
              <input 
                type="text" 
                className="form-control border-start-0 shadow-none" 
                placeholder="Tìm mã môn, tên tài liệu..." 
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                style={{ fontSize: '13.5px' }}
              />
            </div>
          </div>
          <div className="col-12 col-sm-6 col-md-3">
            <select 
              className="form-select shadow-none text-muted" 
              value={statusInput}
              onChange={e => setStatusInput(e.target.value)}
              style={{ fontSize: '13.5px' }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Bị từ chối</option>
              <option value="TAKEDOWN">Đã gỡ</option>
            </select>
          </div>
          <div className="col-12 col-sm-6 col-md-3">
            <select 
              className="form-select shadow-none text-muted" 
              value={categoryInput}
              onChange={e => setCategoryInput(e.target.value)}
              style={{ fontSize: '13.5px' }}
            >
              <option value="">Tất cả chuyên ngành</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-2 d-flex gap-2">
            <button type="submit" className="btn btn-poly-gradient w-100 fw-bold px-3 py-2 text-white border-0" style={{ fontSize: '13.5px', borderRadius: '6px' }}>Lọc</button>
            <button type="button" onClick={handleClearFilters} className="btn btn-light border px-3" style={{ borderRadius: '6px' }} title="Xóa bộ lọc"><i className="bi bi-arrow-clockwise"></i></button>
          </div>
        </form>
      </div>

      <div className="table-container bg-white rounded-3 shadow-sm border border-light overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle" style={{ fontSize: '13.5px' }}>
            <thead className="table-light">
              <tr>
                <th scope="col" className="ps-4">Tài liệu & Tác giả</th>
                <th scope="col">Loại / Chuyên ngành</th>
                <th scope="col">Lượt tải</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Ngày đăng</th>
                <th scope="col" className="text-end pe-4">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableSkeletonRow key={idx} />
                ))
              ) : documents.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4 text-muted">Không có tài liệu nào.</td></tr>
              ) : (
                documents.map(doc => (
                  <tr key={doc.id} style={{ backgroundColor: (doc.status === 'REJECTED' || doc.status === 'TAKEDOWN') ? '#FDFBFB' : 'transparent' }}>
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-light d-flex align-items-center justify-content-center rounded" style={{ width: '40px', height: '40px' }}>
                          <i className={`bi fs-5 text-muted ${doc.documentType === 'PDF' ? 'bi-file-earmark-pdf-fill text-danger' : doc.documentType === 'DOCX' ? 'bi-file-earmark-word-fill text-primary' : 'bi-file-earmark-text-fill text-primary'}`}></i>
                        </div>
                        <div>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="fw-semibold text-dark text-decoration-none d-block text-truncate" style={{ maxWidth: '250px' }}>
                            {doc.title}
                          </a>
                          <div className="text-muted" style={{ fontSize: '12px' }}>Bởi: {doc.uploader?.fullname || doc.uploader?.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-dark fw-medium">{doc.documentType}</div>
                      <div className="text-muted" style={{ fontSize: '12px' }}>{doc.category?.name || 'Chưa phân loại'}</div>
                    </td>
                    <td className="fw-medium text-dark">{doc.downloadCount}</td>
                    <td>{getStatusBadge(doc.status)}</td>
                    <td className="text-muted">{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="text-end pe-4">
                      {doc.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleApprove(doc.id)} className="btn btn-sm btn-outline-success me-2" title="Duyệt">
                            <i className="bi bi-check-lg"></i>
                          </button>
                          <button onClick={() => setSelectedDocId(doc.id)} data-bs-toggle="modal" data-bs-target="#takedownModal" className="btn btn-sm btn-outline-danger" title="Từ chối">
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </>
                      )}
                      {doc.status === 'APPROVED' && (
                        <button onClick={() => setSelectedDocId(doc.id)} data-bs-toggle="modal" data-bs-target="#takedownModal" className="btn btn-sm btn-outline-warning" title="Gỡ">
                          <i className="bi bi-shield-x"></i> Gỡ
                        </button>
                      )}
                      {(doc.status === 'REJECTED' || doc.status === 'TAKEDOWN') && (
                        <>
                          <button onClick={() => handleRestore(doc.id)} className="btn btn-sm btn-outline-info me-2" title="Khôi phục">
                            <i className="bi bi-arrow-counterclockwise"></i>
                          </button>
                          <button onClick={() => handleDelete(doc.id)} className="btn btn-sm btn-outline-danger" title="Xóa vĩnh viễn">
                            <i className="bi bi-trash"></i>
                          </button>
                        </>
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

      {/* Takedown Modal */}
      <div className="modal fade" id="takedownModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4 border-0 shadow">
            <div className="modal-header border-bottom-0 pb-0">
              <h5 className="modal-title fw-bold">Từ chối / Gỡ tài liệu</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form onSubmit={handleTakedown}>
              <div className="modal-body">
                <p className="text-muted mb-3">Tài liệu này sẽ bị ẩn khỏi hệ thống. Vui lòng cung cấp lý do (sẽ được gửi email cho tác giả).</p>
                <div className="mb-3">
                  <label className="form-label fw-medium">Lý do</label>
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    required
                    value={takedownReason}
                    onChange={(e) => setTakedownReason(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer border-top-0 pt-0">
                <button type="button" className="btn btn-light" data-bs-dismiss="modal">Hủy bỏ</button>
                <button type="submit" className="btn btn-danger px-4">Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminDocumentsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center"><div className="spinner-border text-primary" /></div>}>
      <AdminDocumentsContent />
    </Suspense>
  );
}
