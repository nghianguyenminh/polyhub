'use client';

import React, { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';

import {
  Search,
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import styles from './CategoryManagement.module.css';

interface Category {
  id: number;
  code: string;
  name: string;
  active: boolean;
}

interface ToastMessage {
  id: number;
  type: 'success' | 'error';
  text: string;
}

export default function CategoryManagement() {
  // SEARCH
  const [searchTerm, setSearchTerm] = useState('');

  // DATA
  const [categories, setCategories] = useState<Category[]>([]);

  // FORM CONTROL (Trạng thái ẩn/hiện Modal)
  const [isOpenModal, setIsOpenModal] = useState(false);

  // FORM INPUTS
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  // EDIT
  const [editingId, setEditingId] = useState<number | null>(null);

  // TOAST NOTIFICATIONS STATE
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Hàm kích hoạt thông báo đẹp mắt thay cho alert() và chặn đứng màn hình đỏ
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, text }]);
    // Tự động tắt sau 3 giây
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // ==========================================
  // Hàm xử lý kiểm tra lỗi hệ thống từ API
  // ==========================================
  const handleApiError = (error: any, defaultMessage: string) => {
    console.error('Chi tiết lỗi hệ thống từ API:', error);
    const errMsg = error?.message || '';
    
    if (errMsg.includes('401') || errMsg.includes('Unauthorized') || errMsg.includes('đăng nhập')) {
      showToast('Phiên làm việc lỗi hoặc chưa xác thực (401)!', 'error');
    } else if (errMsg.includes('403') || errMsg.includes('Forbidden') || errMsg.includes('quyền')) {
      showToast('Bạn không có quyền thực hiện hành động này (403)!', 'error');
    } else {
      showToast(errMsg || defaultMessage, 'error');
    }
  };

  // =========================
  // GET ALL CATEGORY
  // =========================
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await fetchAPI('/api/admin/categories');
      setCategories(data);
    } catch (error: any) {
      handleApiError(error, 'Không thể tải danh sách chuyên ngành.');
    }
  };

  // Đóng modal và reset form
  const handleCloseModal = () => {
    setIsOpenModal(false);
    setEditingId(null);
    setCode('');
    setName('');
  };

  // =========================
  // CREATE
  // =========================
  const handleAddCategory = async () => {
    if (!code || !name) {
      showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
      return;
    }

    try {
      // Gọi API admin để thêm chuyên ngành
      await fetchAPI('/api/admin/categories/create', {
        method: 'POST',
        body: JSON.stringify({ code, name }),
      });

      showToast('Thêm chuyên ngành mới thành công!');
      handleCloseModal();
      fetchCategories(); // Tải lại danh sách
    } catch (error: any) {
      handleApiError(error, 'Thêm thất bại!');
    }
  };
  // =========================
  // TOGGLE STATUS (Nút bật mở trạng thái)
  // =========================
  const handleToggleStatus = async (id: number) => {
    const currentCat = categories.find(c => c.id === id);
    if (!currentCat) return;

    try {
      // Gọi API admin để bật/tắt trạng thái
      await fetchAPI(`/api/admin/categories/toggle-status/${id}`, {
        method: 'POST',
        noRedirectOn401: true,
      });

      setCategories(prev =>
        prev.map(cat => cat.id === id ? { ...cat, active: !cat.active } : cat)
      );
      
      showToast(`Đã ${currentCat.active ? 'Khóa' : 'Mở'} chuyên ngành ${currentCat.code}`);
    } catch (error: any) {
      handleApiError(error, 'Không thể thay đổi trạng thái!');
    }
  };

  // =========================
  // DELETE
  // =========================
  const handleDeleteCategory = async (id: number) => {
    const confirmDelete = confirm('Bạn có chắc chắn muốn xóa chuyên ngành này không?');
    if (!confirmDelete) return;

    try {
      // Gọi API admin để xóa chuyên ngành
      await fetchAPI(`/api/admin/categories/delete/${id}`, {
        method: 'POST',
        noRedirectOn401: true,
      });
      showToast('Xóa chuyên ngành thành công!');
      fetchCategories();
    } catch (error: any) {
      handleApiError(error, 'Xóa thất bại! Chuyên ngành này có thể đang chứa tài liệu.');
    }
  };

  // =========================
  // EDIT CLICK
  // =========================
  const handleEditClick = (category: Category) => {
    setEditingId(category.id);
    setCode(category.code);
    setName(category.name);
    setIsOpenModal(true);
  };

  // =========================
  // UPDATE
  // =========================
  const handleUpdateCategory = async () => {
    if (!editingId) return;

    try {
      // Gọi API admin để cập nhật tên chuyên ngành
      await fetchAPI(`/api/admin/categories/edit/${editingId}`, {
        method: 'POST',
        noRedirectOn401: true,
        body: JSON.stringify({
          name: name.trim(),
        }),
      });

      showToast('Cập nhật thông tin thành công!');
      handleCloseModal();
      
      // Đợi 200ms để đảm bảo DB đã update xong rồi mới fetch lại
      setTimeout(() => fetchCategories(), 200);
    } catch (error: any) {
      handleApiError(error, 'Cập nhật thông tin thất bại!');
    }
  };

  // =========================
  // SEARCH FILTER
  // =========================
  const displayCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      
      {/* GIAO DIỆN HỘP THÔNG BÁO (TOAST CONTAINER) Ở GÓC MÀN HÌNH */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 9999,
        pointerEvents: 'none'
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              borderRadius: '8px',
              backgroundColor: toast.type === 'success' ? '#DEF7EC' : '#FDE8E8',
              color: toast.type === 'success' ? '#03543F' : '#9B1C1C',
              border: `1px solid ${toast.type === 'success' ? '#BCF0DA' : '#FBD5D5'}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              minWidth: '280px',
              maxWidth: '400px',
              animation: 'slideIn 0.3s ease-out forwards',
              pointerEvents: 'auto'
            }}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} style={{ color: '#0E9F6E', flexShrink: 0 }} />
            ) : (
              <AlertCircle size={18} style={{ color: '#E11D48', flexShrink: 0 }} />
            )}
            <span style={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.4 }}>{toast.text}</span>
          </div>
        ))}
      </div>

      {/* CSS ANIMATION CHO TOAST */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* HEADER */}
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Chuyên ngành & Danh mục</h1>
          <p className={styles.pageSubtitle}>
            Quản lý và phân loại tài liệu trên hệ thống.
          </p>
        </div>
      </header>

      {/* TOOLBAR & BUTTON */}
      <div className={styles.toolbar} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className={styles.searchContainer} style={{ flex: 1, marginRight: '16px' }}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm mã hoặc tên chuyên ngành..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          className={styles.btnAdd}
          onClick={() => setIsOpenModal(true)}
        >
          <Plus size={18} /> Thêm chuyên ngành
        </button>
      </div>

      {/* MODAL FORM */}
      {isOpenModal && (
        <div style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0, left: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: '12px',
            width: '400px',
            boxShadow: '0 4px 25px rgba(0,0,0,0.15)',
            position: 'relative'
          }}>
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                color: '#666',
                padding: '4px',
                borderRadius: '50%'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ marginBottom: '16px', marginTop: 0, fontSize: '18px', fontWeight: 600 }}>
              {editingId ? 'Cập nhật chuyên ngành' : 'Thêm chuyên ngành mới'}
            </h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Mã chuyên ngành</label>
              <input
                type="text"
                placeholder="Ví dụ: MOB, SOF, WEB..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={editingId !== null}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  boxSizing: 'border-box',
                  backgroundColor: editingId !== null ? '#f5f5f5' : '#fff'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Tên chuyên ngành</label>
              <input
                type="text"
                placeholder="Ví dụ: Lập trình Mobile..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={handleCloseModal}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                Hủy
              </button>

              {editingId ? (
                <button
                  className={styles.btnAdd}
                  onClick={handleUpdateCategory}
                  style={{ padding: '10px 16px', fontSize: '14px', fontWeight: 500 }}
                >
                  Cập nhật
                </button>
              ) : (
                <button
                  className={styles.btnAdd}
                  onClick={handleAddCategory}
                  style={{ padding: '10px 16px', fontSize: '14px', fontWeight: 500 }}
                >
                  Lưu lại
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên chuyên ngành</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {displayCategories.length > 0 ? (
                displayCategories.map((category) => (
                  <tr key={category.id}>
                    <td><strong>{category.code}</strong></td>
                    <td>
                      <div className={styles.categoryName}>
                        <div className={styles.catIcon}>
                          <FolderOpen size={16} />
                        </div>
                        {category.name}
                      </div>
                    </td>
                    <td>
                      {/* GIAO DIỆN NÚT BẬT MỞ (TOGGLE SWITCH) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{
                          position: 'relative',
                          display: 'inline-block',
                          width: '44px',
                          height: '24px',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="checkbox"
                            checked={category.active || false}
                            onChange={() => handleToggleStatus(category.id)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: category.active ? '#4F46E5' : '#ccc',
                            transition: '0.3s',
                            borderRadius: '24px'
                          }}>
                            <span style={{
                              position: 'absolute',
                              content: '""',
                              height: '18px',
                              width: '18px',
                              left: category.active ? '22px' : '4px',
                              bottom: '3px',
                              backgroundColor: 'white',
                              transition: '0.3s',
                              borderRadius: '50%'
                            }} />
                          </span>
                        </label>
                        <span style={{ fontSize: '13px', color: category.active ? '#4F46E5' : '#666', fontWeight: 500 }}>
                          {category.active ? 'Mở' : 'Khóa'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        <button
                          className={`${styles.actionBtn} ${styles.btnEdit}`}
                          title="Chỉnh sửa"
                          onClick={() => handleEditClick(category)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.btnDelete}`}
                          title="Xóa"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    <div className={styles.emptyState}>
                      <FolderOpen size={48} />
                      <p>Không tìm thấy chuyên ngành nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}