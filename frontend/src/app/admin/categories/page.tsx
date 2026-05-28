'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'danger' } | null>(null);

  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');

  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI('/api/admin/categories');
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await fetchAPI('/api/admin/categories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCode, name: newName })
      });
      setMessage({ text: result.message, type: 'success' });
      setNewCode('');
      setNewName('');
      closeModal('addMajorModal');
      loadCategories();
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi thêm chuyên ngành', type: 'danger' });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    try {
      const result = await fetchAPI(`/api/admin/categories/edit/${editId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName })
      });
      setMessage({ text: result.message, type: 'success' });
      setEditId(null);
      setEditName('');
      closeModal('editMajorModal');
      loadCategories();
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi sửa chuyên ngành', type: 'danger' });
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const result = await fetchAPI(`/api/admin/categories/toggle-status/${id}`, { method: 'POST' });
      setMessage({ text: result.message, type: 'success' });
      loadCategories();
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi đổi trạng thái', type: 'danger' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chuyên ngành này?')) return;
    try {
      const result = await fetchAPI(`/api/admin/categories/delete/${id}`, { method: 'POST' });
      setMessage({ text: result.message, type: 'success' });
      loadCategories();
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi xóa chuyên ngành', type: 'danger' });
    }
  };

  const closeModal = (modalId: string) => {
    const modalEl = document.getElementById(modalId);
    const modal = (window as any).bootstrap?.Modal.getInstance(modalEl);
    modal?.hide();
  };

  const openEditModal = (cat: any) => {
    setEditId(cat.id);
    setEditName(cat.name);
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-uppercase text-muted" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>
              <li className="breadcrumb-item"><Link href="/admin" className="text-decoration-none text-muted">Trang chủ</Link></li>
              <li className="breadcrumb-item"><span className="text-muted">Quản lý nội dung</span></li>
              <li className="breadcrumb-item active" aria-current="page">Chuyên ngành</li>
            </ol>
          </nav>
          <h3 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Quản lý Chuyên ngành</h3>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary btn-sm rounded-pill px-3 py-2 fw-medium d-flex align-items-center gap-2 shadow-sm" style={{ backgroundColor: '#4F46E5', border: 'none' }} data-bs-toggle="modal" data-bs-target="#addMajorModal">
            <i className="bi bi-plus-circle fs-6"></i> Thêm chuyên ngành
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show rounded-3 border-0 shadow-sm`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      <div className="table-container bg-white rounded-3 shadow-sm border border-light overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle" style={{ fontSize: '13.5px' }}>
            <thead className="table-light">
              <tr>
                <th scope="col" className="ps-4">Mã CN</th>
                <th scope="col">Tên Chuyên ngành</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Số tài liệu</th>
                <th scope="col" className="text-end pe-4">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-5"><div className="spinner-border text-primary" /></td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-4 text-muted">Không có chuyên ngành nào.</td></tr>
              ) : (
                categories.map(cat => (
                  <tr key={cat.id}>
                    <td className="ps-4 fw-bold text-poly">{cat.code}</td>
                    <td className="fw-medium text-dark">{cat.name}</td>
                    <td>
                      <span className={`badge ${cat.active ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'} border-0 px-2 py-1`}>
                        {cat.active ? 'Hoạt động' : 'Đã ẩn'}
                      </span>
                    </td>
                    <td className="text-muted fw-medium">{cat.documents?.length || 0}</td>
                    <td className="text-end pe-4">
                      <button 
                        onClick={() => handleToggleStatus(cat.id)}
                        className={`btn btn-sm ${cat.active ? 'btn-outline-warning' : 'btn-outline-success'} me-2`} 
                        title={cat.active ? 'Ẩn' : 'Hiện'}
                      >
                        <i className={`bi ${cat.active ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                      <button 
                        onClick={() => openEditModal(cat)}
                        data-bs-toggle="modal" data-bs-target="#editMajorModal"
                        className="btn btn-sm btn-outline-primary me-2" 
                        title="Sửa"
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id)}
                        className="btn btn-sm btn-outline-danger" 
                        title="Xóa"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <div className="modal fade" id="addMajorModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4 border-0 shadow">
            <div className="modal-header border-bottom-0 pb-0">
              <h5 className="modal-title fw-bold">Thêm Chuyên ngành</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-medium">Mã chuyên ngành</label>
                  <input type="text" className="form-control" required placeholder="VD: CNTT" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">Tên chuyên ngành</label>
                  <input type="text" className="form-control" required placeholder="VD: Công nghệ thông tin" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer border-top-0 pt-0">
                <button type="button" className="btn btn-light" data-bs-dismiss="modal">Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#4F46E5', border: 'none' }}>Thêm mới</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <div className="modal fade" id="editMajorModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4 border-0 shadow">
            <div className="modal-header border-bottom-0 pb-0">
              <h5 className="modal-title fw-bold">Sửa Chuyên ngành</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-medium">Tên chuyên ngành</label>
                  <input type="text" className="form-control" required value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer border-top-0 pt-0">
                <button type="button" className="btn btn-light" data-bs-dismiss="modal">Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#4F46E5', border: 'none' }}>Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
