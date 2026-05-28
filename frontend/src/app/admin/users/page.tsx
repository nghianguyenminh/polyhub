'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

import { Suspense } from 'react';

function AdminUsersContent() {
  const [users, setUsers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pageParam = searchParams.get('page');

  useEffect(() => {
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    setCurrentPage(page);
    loadUsers(page);
  }, [pageParam]);

  const loadUsers = async (page: number) => {
    setLoading(true);
    try {
      const data = await fetchAPI(`/api/admin/users?page=${page}`);
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    router.push(`/admin/users?page=${page}`);
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-uppercase text-muted" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>
              <li className="breadcrumb-item"><Link href="/admin" className="text-decoration-none text-muted">Trang chủ</Link></li>
              <li className="breadcrumb-item"><span className="text-muted">Quản lý dữ liệu</span></li>
              <li className="breadcrumb-item active" aria-current="page">Người dùng</li>
            </ol>
          </nav>
          <h3 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Quản lý Người dùng</h3>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-2 fw-medium d-flex align-items-center gap-2">
            <i className="bi bi-file-earmark-spreadsheet fs-6"></i> Xuất Excel
          </button>
        </div>
      </div>

      <div className="filter-card bg-white rounded-3 shadow-sm border border-light p-4 mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-4 col-lg-5">
            <div className="search-input-wrapper position-relative">
              <i className="bi bi-search position-absolute text-muted" style={{ left: '14px', top: '50%', transform: 'translateY(-50%)' }}></i>
              <input type="text" className="form-control bg-light border-0 rounded-3 py-2" placeholder="Tìm kiếm theo tên, email, mssv..." style={{ paddingLeft: '40px', fontSize: '13.5px' }} />
            </div>
          </div>
          <div className="col-12 col-md-8 col-lg-7">
            <div className="d-flex gap-2 flex-wrap justify-content-md-end">
              <select className="form-select border-0 bg-light rounded-3 text-muted" style={{ width: '150px', fontSize: '13.5px' }}>
                <option value="">Tất cả Vai trò</option>
                <option value="USER">Sinh viên</option>
                <option value="MENTOR">Mentor</option>
                <option value="ADMIN">Quản trị viên</option>
              </select>
              <select className="form-select border-0 bg-light rounded-3 text-muted" style={{ width: '150px', fontSize: '13.5px' }}>
                <option value="">Tất cả Trạng thái</option>
                <option value="true">Hoạt động</option>
                <option value="false">Đã khóa</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="table-container bg-white rounded-3 shadow-sm border border-light overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle" style={{ fontSize: '13.5px' }}>
            <thead className="table-light">
              <tr>
                <th scope="col" className="ps-4">Người dùng</th>
                <th scope="col">Mã Sinh Viên</th>
                <th scope="col">Vai trò</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Ngày tham gia</th>
                <th scope="col" className="text-end pe-4">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">Không tìm thấy người dùng nào.</td>
                </tr>
              ) : (
                users.map(user => {
                  const roleName = user.role?.name || 'Chưa có';
                  const roleClass = user.role?.id === 'USER' ? 'bg-secondary bg-opacity-10 text-secondary' :
                                   (user.role?.id === 'SUPER_ADMIN' || user.role?.id === 'USER_ADMIN' || user.role?.id === 'CONTENT_ADMIN') ? 'bg-warning bg-opacity-25 text-warning-emphasis' :
                                   'bg-primary bg-opacity-10 text-primary';
                  
                  return (
                    <tr key={user.username} style={{ backgroundColor: user.active ? 'transparent' : '#FDFBFB' }}>
                      <td className="ps-4 py-3">
                        <div className="d-flex align-items-center gap-3">
                          <img 
                            src={user.avatar && user.avatar !== 'default.png' ? user.avatar : `https://ui-avatars.com/api/?name=${user.fullname}`} 
                            className="rounded-circle" width="36" height="36" alt="avatar" 
                            style={{ opacity: user.active ? 1 : 0.6 }}
                          />
                          <div style={{ lineHeight: '1.4' }}>
                            <div className={`fw-semibold ${user.active ? 'text-dark' : 'text-muted text-decoration-line-through'}`}>{user.fullname}</div>
                            <div className="text-muted" style={{ fontSize: '12px' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-muted fw-medium">{user.username}</td>
                      <td>
                        <span className={`badge ${roleClass} border-0 px-2 py-1`}>{roleName}</span>
                      </td>
                      <td>
                        <span className={`badge ${user.active ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'} border-0 px-2 py-1 d-inline-flex align-items-center gap-1`}>
                          <span className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: user.active ? '#198754' : '#dc3545' }}></span>
                          {user.active ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="text-muted">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="text-end pe-4">
                        <Link href={`/admin/users/${user.username}`} className="btn btn-sm btn-light border text-muted fw-medium d-inline-flex align-items-center gap-1" style={{ borderRadius: '8px', fontSize: '12.5px' }}>
                          <i className="bi bi-eye"></i> Chi tiết
                        </Link>
                      </td>
                    </tr>
                  );
                })
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

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center"><div className="spinner-border text-primary" /></div>}>
      <AdminUsersContent />
    </Suspense>
  );
}
