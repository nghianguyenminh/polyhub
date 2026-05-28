'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Link from 'next/link';

export default function GroupsPage() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    // Tạm thời fetch categories thông qua API admin đã có sẵn (hoặc có thể public API sau)
    // Nếu có token, ta dùng token để lấy danh sách category
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8080/api/admin/categories', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          // Filter active categories for UI
          const activeCategories = data.categories?.filter((c: any) => c.status === 'ACTIVE') || [];
          setCategories(activeCategories);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  return (
    <>
      <Header />
      <div className="container-fluid bg-light min-vh-100 py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-1">Cộng đồng & Hội nhóm</h2>
              <p className="text-muted mb-0">Tham gia các nhóm học tập và thảo luận chuyên sâu</p>
            </div>
            <button className="btn btn-primary rounded-pill px-4 fw-medium shadow-sm" style={{ backgroundColor: '#4F46E5', border: 'none' }}>
              <i className="bi bi-people-fill me-2"></i>Tạo nhóm mới
            </button>
          </div>

          <div className="row g-4 mb-5">
            <div className="col-lg-8">
              <div className="input-group input-group-lg shadow-sm rounded-pill overflow-hidden">
                <span className="input-group-text bg-white border-0 ps-4 text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input type="text" className="form-control border-0 shadow-none bg-white" placeholder="Tìm kiếm tên nhóm, chủ đề..." />
                <button className="btn btn-primary px-4 fw-medium" style={{ backgroundColor: '#4F46E5', border: 'none' }}>Tìm kiếm</button>
              </div>
            </div>
            <div className="col-lg-4">
              <select className="form-select form-select-lg shadow-sm border-0 rounded-pill bg-white text-dark">
                <option value="">Tất cả chuyên ngành</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat.code}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <h5 className="fw-bold mb-4">Nhóm Gợi Ý Cho Bạn</h5>
          <div className="row g-4">
            {/* Group 1 */}
            <div className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                <div className="position-relative" style={{ height: '120px', backgroundColor: '#e2e8f0' }}>
                  <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80" className="w-100 h-100" style={{ objectFit: 'cover' }} alt="Cover" />
                </div>
                <div className="card-body p-4 pt-0 position-relative">
                  <div className="mb-3" style={{ marginTop: '-40px' }}>
                    <img src="https://ui-avatars.com/api/?name=IT&background=0D8ABC&color=fff" className="rounded-4 border border-4 border-white shadow-sm" width="80" height="80" alt="Icon" />
                  </div>
                  <h5 className="fw-bold mb-1">Lập trình Java / Spring Boot</h5>
                  <p className="text-muted small mb-3">Chuyên ngành CNTT • 1.2K thành viên</p>
                  <p className="text-dark small mb-4" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    Nơi trao đổi kiến thức, tài liệu và kinh nghiệm làm dự án thực tế với Java, Spring Boot, Hibernate...
                  </p>
                  <div className="d-flex align-items-center justify-content-between mt-auto">
                    <div className="avatar-group">
                      <img src="https://ui-avatars.com/api/?name=1" className="rounded-circle border border-white" width="28" height="28" alt="Avatar" />
                      <img src="https://ui-avatars.com/api/?name=2" className="rounded-circle border border-white ms-n2" width="28" height="28" alt="Avatar" />
                      <img src="https://ui-avatars.com/api/?name=3" className="rounded-circle border border-white ms-n2" width="28" height="28" alt="Avatar" />
                    </div>
                    <button className="btn btn-outline-primary rounded-pill btn-sm px-3 fw-medium">Tham gia</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Group 2 */}
            <div className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                <div className="position-relative" style={{ height: '120px', backgroundColor: '#e2e8f0' }}>
                  <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80" className="w-100 h-100" style={{ objectFit: 'cover' }} alt="Cover" />
                </div>
                <div className="card-body p-4 pt-0 position-relative">
                  <div className="mb-3" style={{ marginTop: '-40px' }}>
                    <img src="https://ui-avatars.com/api/?name=UI&background=F59E0B&color=fff" className="rounded-4 border border-4 border-white shadow-sm" width="80" height="80" alt="Icon" />
                  </div>
                  <h5 className="fw-bold mb-1">Cộng đồng UI/UX Designer</h5>
                  <p className="text-muted small mb-3">Chuyên ngành Thiết kế • 850 thành viên</p>
                  <p className="text-dark small mb-4" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    Chia sẻ tài nguyên Figma, review Portfolio và thảo luận xu hướng thiết kế giao diện người dùng mới nhất.
                  </p>
                  <div className="d-flex align-items-center justify-content-between mt-auto">
                    <div className="avatar-group">
                      <img src="https://ui-avatars.com/api/?name=4" className="rounded-circle border border-white" width="28" height="28" alt="Avatar" />
                      <img src="https://ui-avatars.com/api/?name=5" className="rounded-circle border border-white ms-n2" width="28" height="28" alt="Avatar" />
                    </div>
                    <button className="btn btn-outline-primary rounded-pill btn-sm px-3 fw-medium">Tham gia</button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Group 3 */}
            <div className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                <div className="position-relative" style={{ height: '120px', backgroundColor: '#e2e8f0' }}>
                  <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80" className="w-100 h-100" style={{ objectFit: 'cover' }} alt="Cover" />
                </div>
                <div className="card-body p-4 pt-0 position-relative">
                  <div className="mb-3" style={{ marginTop: '-40px' }}>
                    <img src="https://ui-avatars.com/api/?name=MK&background=10B981&color=fff" className="rounded-4 border border-4 border-white shadow-sm" width="80" height="80" alt="Icon" />
                  </div>
                  <h5 className="fw-bold mb-1">Digital Marketing Thực Chiến</h5>
                  <p className="text-muted small mb-3">Chuyên ngành Kinh tế • 2.5K thành viên</p>
                  <p className="text-dark small mb-4" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    Câu lạc bộ Marketing FPT Polytechnic. Nơi kết nối doanh nghiệp và sinh viên đam mê ngành truyền thông.
                  </p>
                  <div className="d-flex align-items-center justify-content-between mt-auto">
                    <div className="avatar-group">
                      <img src="https://ui-avatars.com/api/?name=6" className="rounded-circle border border-white" width="28" height="28" alt="Avatar" />
                      <img src="https://ui-avatars.com/api/?name=7" className="rounded-circle border border-white ms-n2" width="28" height="28" alt="Avatar" />
                      <img src="https://ui-avatars.com/api/?name=8" className="rounded-circle border border-white ms-n2" width="28" height="28" alt="Avatar" />
                      <div className="rounded-circle bg-light border border-white ms-n2 d-flex align-items-center justify-content-center text-muted small" style={{ width: '28px', height: '28px', zIndex: 1 }}>+</div>
                    </div>
                    <button className="btn btn-secondary rounded-pill btn-sm px-3 fw-medium text-white" disabled>Đã tham gia</button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
