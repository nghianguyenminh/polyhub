'use client';

import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, FolderOpen, MoreVertical } from 'lucide-react';
import styles from './CategoryManagement.module.css';

// --- Mock Data ---
interface Category {
  id: string;
  name: string;
  description: string;
  documentCount: number;
}

const mockCategories: Category[] = [
  { id: '1', name: 'Công nghệ thông tin', description: 'Tài liệu, giáo trình về lập trình, mạng máy tính, AI...', documentCount: 1542 },
  { id: '2', name: 'Kinh tế & Quản trị', description: 'Tài liệu kế toán, marketing, thương mại điện tử', documentCount: 843 },
  { id: '3', name: 'Thiết kế đồ họa', description: 'Photoshop, Illustrator, UI/UX, Design thinking', documentCount: 421 },
  { id: '4', name: 'Ngoại ngữ', description: 'Tài liệu tiếng Anh, tiếng Nhật, tiếng Hàn...', documentCount: 950 },
  { id: '5', name: 'Kỹ thuật Cơ khí', description: 'Cơ điện tử, tự động hóa, vẽ kỹ thuật', documentCount: 234 },
];

export default function CategoryManagement() {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter categories based on search input
  const displayCategories = mockCategories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Chuyên ngành & Danh mục</h1>
          <p className={styles.pageSubtitle}>Quản lý và phân loại tài liệu trên hệ thống.</p>
        </div>
        <button className={styles.btnAdd}>
          <Plus size={18} />
          Thêm chuyên ngành
        </button>
      </header>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm chuyên ngành..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tên chuyên ngành</th>
                <th>Mô tả chi tiết</th>
                <th>Số lượng tài liệu</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {displayCategories.length > 0 ? (
                displayCategories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <div className={styles.categoryName}>
                        <div className={styles.catIcon}>
                          <FolderOpen size={16} />
                        </div>
                        {category.name}
                      </div>
                    </td>
                    <td>
                      <div className={styles.description} title={category.description}>
                        {category.description}
                      </div>
                    </td>
                    <td>
                      <strong>{category.documentCount.toLocaleString()}</strong> tài liệu
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        <button className={`${styles.actionBtn} ${styles.btnEdit}`} title="Chỉnh sửa">
                          <Edit2 size={16} />
                        </button>
                        <button className={`${styles.actionBtn} ${styles.btnDelete}`} title="Xóa">
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
