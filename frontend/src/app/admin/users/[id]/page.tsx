'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

export default function AdminUserDetailPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'danger' } | null>(null);
  const [lockReason, setLockReason] = useState('');
  
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  useEffect(() => {
    loadUserDetail();
  }, [userId]);

  const loadUserDetail = async () => {
    setLoading(true);
    try {
      const result = await fetchAPI(`/api/admin/users/${userId}`);
      if (result.user?.role?.id === 'SUPER_ADMIN' || result.user?.role?.id === 'ADMIN') {
        alert('Không thể xem chi tiết tài khoản Admin/Super Admin');
        router.push('/admin/users');
        return;
      }
      setData(result);
    } catch (err) {
      console.error('Failed to fetch user detail', err);
      alert('Không có quyền truy cập hoặc tài khoản không tồn tại.');
      router.push('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const handleLockUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockReason.trim()) {
      alert("Vui lòng nhập lý do khóa.");
      return;
    }
    try {
      const result = await fetchAPI(`/api/admin/users/lock/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: lockReason })
      });
      setMessage({ text: result.message, type: 'success' });
      setLockReason('');
      loadUserDetail();
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi khi khóa tài khoản', type: 'danger' });
    }
  };

  const handleUnlockUser = async () => {
    if (!confirm('Bạn có chắc chắn muốn mở khóa tài khoản này?')) return;
    try {
      const result = await fetchAPI(`/api/admin/users/unlock/${userId}`, {
        method: 'POST'
      });
      setMessage({ text: result.message, type: 'success' });
      loadUserDetail();
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi khi mở khóa', type: 'danger' });
    }
  };

  const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const roleId = formData.get('roleId') as string;
    
    try {
      const result = await fetchAPI(`/api/admin/users/roles/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId })
      });
      setMessage({ text: result.message, type: 'success' });
      loadUserDetail();
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi khi thay đổi quyền', type: 'danger' });
    }
  };

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border text-primary" /></div>;
  }

  if (!data || !data.user) {
    return <div className="alert alert-danger">Không tìm thấy người dùng</div>;
  }

  const { user, userAdminCount, contentAdminCount, MAX_USER_ADMIN, MAX_CONTENT_ADMIN } = data;
  const roleId = user.role?.id || '';

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-uppercase text-muted" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>
              <li className="breadcrumb-item"><Link href="/admin/dashboard" className="text-decoration-none text-muted">Trang chủ</Link></li>
              <li className="breadcrumb-item"><Link href="/admin/users" className="text-decoration-none text-muted">Người dùng</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Hồ sơ chi tiết</li>
            </ol>
          </nav>
          <h3 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Hồ sơ Người dùng</h3>
        </div>
        <Link href="/admin/users" className="btn btn-light border btn-sm rounded-pill px-3 py-2 fw-medium d-flex align-items-center gap-2">
          <i className="bi bi-arrow-left"></i> Quay lại danh sách
        </Link>
      </div>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show rounded-3 border-0 shadow-sm`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-4">
          <div className="poly-card p-4 bg-white rounded-3 shadow-sm border border-light h-100 text-center">
            <div className="position-relative d-inline-block mb-3">
              <img 
                src={user.avatar && user.avatar !== 'default.png' ? user.avatar : `https://ui-avatars.com/api/?name=${user.fullname}`} 
                className="rounded-circle border border-3 border-white shadow-sm" 
                style={{ width: '120px', height: '120px', objectFit: 'cover' }} 
                alt="Avatar" 
              />
              <span className={`position-absolute bottom-0 end-0 p-2 border border-2 border-white rounded-circle ${user.active ? 'bg-success' : 'bg-danger'}`} style={{ transform: 'translate(-10px, -10px)' }}></span>
            </div>
            <h4 className="fw-bold mb-1">{user.fullname}</h4>
            <p className="text-muted mb-3">{user.email}</p>
            
            <div className="d-flex justify-content-center gap-2 mb-4">
              <span className={`badge ${user.role?.id === 'USER' ? 'bg-secondary bg-opacity-10 text-secondary' : 'bg-primary bg-opacity-10 text-primary'} px-3 py-2 rounded-pill`}>
                {user.role?.name || 'Chưa có vai trò'}
              </span>
              <span className={`badge ${user.active ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'} px-3 py-2 rounded-pill`}>
                {user.active ? 'Tài khoản hoạt động' : 'Đã bị khóa'}
              </span>
            </div>
            
            <div className="d-flex gap-2 justify-content-center">
              {user.active ? (
                <button 
                  className="btn btn-outline-danger fw-medium d-flex align-items-center gap-2" 
                  data-bs-toggle="modal" 
                  data-bs-target="#lockModal"
                >
                  <i className="bi bi-lock-fill"></i> Khóa tài khoản
                </button>
              ) : (
                <button 
                  className="btn btn-success fw-medium d-flex align-items-center gap-2" 
                  onClick={handleUnlockUser}
                >
                  <i className="bi bi-unlock-fill"></i> Mở khóa
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-8">
          <div className="poly-card p-4 bg-white rounded-3 shadow-sm border border-light h-100">
            <h5 className="fw-bold mb-4 border-bottom pb-2">Thông tin chi tiết</h5>
            
            <div className="row g-4 mb-4">
              <div className="col-sm-6">
                <div className="text-muted small fw-medium mb-1">Mã Sinh Viên / Username</div>
                <div className="fw-semibold text-dark p-2 bg-light rounded">{user.username}</div>
              </div>
              <div className="col-sm-6">
                <div className="text-muted small fw-medium mb-1">Họ và Tên</div>
                <div className="fw-semibold text-dark p-2 bg-light rounded">{user.fullname}</div>
              </div>
              <div className="col-sm-6">
                <div className="text-muted small fw-medium mb-1">Số điện thoại</div>
                <div className="fw-semibold text-dark p-2 bg-light rounded">{user.phone || 'Chưa cập nhật'}</div>
              </div>
              <div className="col-sm-6">
                <div className="text-muted small fw-medium mb-1">Chuyên ngành</div>
                <div className="fw-semibold text-dark p-2 bg-light rounded">{user.major || 'Chưa cập nhật'}</div>
              </div>
              <div className="col-sm-6">
                <div className="text-muted small fw-medium mb-1">Năm sinh</div>
                <div className="fw-semibold text-dark p-2 bg-light rounded">{user.yearOfBirth || 'Chưa cập nhật'}</div>
              </div>
              <div className="col-sm-6">
                <div className="text-muted small fw-medium mb-1">Ngày tham gia PolyHUB</div>
                <div className="fw-semibold text-dark p-2 bg-light rounded">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</div>
              </div>
            </div>

            <h5 className="fw-bold mb-3 border-bottom pb-2 mt-5">Phân quyền (Role Management)</h5>
            <form onSubmit={handleChangeRole} className="p-3 bg-light rounded-3 border">
              <div className="mb-3">
                <label className="form-label fw-medium text-dark">Chọn vai trò hệ thống</label>
                <select name="roleId" className="form-select bg-white" defaultValue={roleId}>
                  <option value="USER">Sinh viên (Người dùng tiêu chuẩn)</option>
                  <option value="MENTOR">Mentor (Giảng viên / Sinh viên xuất sắc)</option>
                  <option value="CONTENT_ADMIN" disabled={roleId !== 'CONTENT_ADMIN' && contentAdminCount >= MAX_CONTENT_ADMIN}>
                    Admin Quản lý Nội dung (Tối đa {MAX_CONTENT_ADMIN} - Hiện có {contentAdminCount})
                  </option>
                  <option value="USER_ADMIN" disabled={roleId !== 'USER_ADMIN' && userAdminCount >= MAX_USER_ADMIN}>
                    Admin Quản lý Người dùng (Tối đa {MAX_USER_ADMIN} - Hiện có {userAdminCount})
                  </option>
                  {roleId === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Quản trị viên cấp cao (Không thể gán tay)</option>}
                </select>
                <div className="form-text text-muted mt-2">
                  <i className="bi bi-info-circle me-1"></i> Lưu ý: Không thể cấp quyền Super Admin từ giao diện này.
                </div>
              </div>
              <button type="submit" className="btn btn-primary fw-medium" style={{ backgroundColor: '#4F46E5', border: 'none' }} disabled={roleId === 'SUPER_ADMIN'}>
                Cập nhật quyền hạn
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Lock Modal */}
      <div className="modal fade" id="lockModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4 border-0 shadow">
            <div className="modal-header border-bottom-0 pb-0">
              <h5 className="modal-title fw-bold">Khóa tài khoản</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form onSubmit={(e) => {
              const modalEl = document.getElementById('lockModal');
              const modal = (window as any).bootstrap?.Modal.getInstance(modalEl);
              modal?.hide();
              handleLockUser(e);
            }}>
              <div className="modal-body">
                <p className="text-muted mb-3">Bạn đang chuẩn bị khóa tài khoản của <b>{user.fullname}</b>. Người dùng sẽ bị đăng xuất và không thể đăng nhập lại vào hệ thống.</p>
                <div className="mb-3">
                  <label className="form-label fw-medium">Lý do khóa (bắt buộc)</label>
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    placeholder="Nhập lý do khóa để lưu log và thông báo qua email..." 
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer border-top-0 pt-0">
                <button type="button" className="btn btn-light" data-bs-dismiss="modal">Hủy bỏ</button>
                <button type="submit" className="btn btn-danger px-4">Xác nhận Khóa</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
