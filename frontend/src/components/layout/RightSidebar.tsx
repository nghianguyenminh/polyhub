'use client';

import React from 'react';
import Link from 'next/link';

export default function RightSidebar() {
  return (
    <div className="poly-sidebar-right d-none d-xl-block">
      <div className="text-muted fw-bold mb-3 mt-2" style={{ fontSize: '12px', letterSpacing: '0.5px' }}>GỢI Ý KẾT NỐI MENTOR</div>
      
      <div className="mentor-suggestion-card mb-3">
        <div className="mentor-cover" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=400')" }}></div>
        <div className="mentor-info">
          <img src="https://ui-avatars.com/api/?name=Tan+Dung&background=random" className="mentor-avatar" alt="avatar" />
          <div className="d-flex justify-content-between align-items-center mt-1">
            <div>
              <div className="fw-bold text-dark" style={{ fontSize: '14px' }}>Mr. Tấn Dũng</div>
              <div className="text-muted" style={{ fontSize: '12px' }}>Chuyên gia Backend</div>
            </div>
            <button className="btn-icon-circle bg-light text-poly" style={{ width: '32px', height: '32px' }}><i className="bi bi-person-plus-fill"></i></button>
          </div>
          <div className="mt-2 d-flex gap-1 flex-wrap">
            <span className="badge bg-light text-dark border fw-normal" style={{ fontSize: '11px' }}>Spring Boot</span>
            <span className="badge bg-light text-dark border fw-normal" style={{ fontSize: '11px' }}>MySQL</span>
          </div>
        </div>
      </div>
      
      <div className="mentor-suggestion-card mb-3">
        <div className="mentor-cover" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=400')" }}></div>
        <div className="mentor-info">
          <img src="https://ui-avatars.com/api/?name=Mai+Anh&background=random" className="mentor-avatar" alt="avatar" />
          <div className="d-flex justify-content-between align-items-center mt-1">
            <div>
              <div className="fw-bold text-dark" style={{ fontSize: '14px' }}>Ms. Mai Anh</div>
              <div className="text-muted" style={{ fontSize: '12px' }}>UI/UX Designer</div>
            </div>
            <button className="btn-icon-circle bg-light text-poly" style={{ width: '32px', height: '32px' }}><i className="bi bi-person-plus-fill"></i></button>
          </div>
          <div className="mt-2 d-flex gap-1 flex-wrap">
            <span className="badge bg-light text-dark border fw-normal" style={{ fontSize: '11px' }}>Figma</span>
            <span className="badge bg-light text-dark border fw-normal" style={{ fontSize: '11px' }}>User Research</span>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3 mt-4">
        <div className="text-muted fw-bold" style={{ fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>TÀI LIỆU MỚI NHẤT</div>
        <Link href="/documents" className="text-decoration-none text-poly fw-medium" style={{ fontSize: '13px' }}>Xem tất cả</Link>
      </div>
      
      {/* Document Item 1 */}
      <div className="d-flex align-items-center mb-3 p-2 bg-white rounded-3 border" style={{ transition: 'all 0.2s ease', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div className="bg-danger bg-opacity-10 text-danger rounded-3 d-flex justify-content-center align-items-center me-3" style={{ width: '44px', height: '44px', flexShrink: 0 }}>
          <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
        </div>
        <div className="flex-grow-1 overflow-hidden">
          <div className="fw-bold text-dark text-truncate mb-1" style={{ fontSize: '13px' }} title="Hướng dẫn Spring Boot 3.x">Hướng dẫn Spring Boot 3.x</div>
          <div className="d-flex align-items-center">
            <span className="badge bg-light text-secondary border fw-normal me-2" style={{ fontSize: '10px' }}>PDF</span>
            <span className="text-muted" style={{ fontSize: '11px' }}><i className="bi bi-clock me-1"></i>2 giờ trước</span>
          </div>
        </div>
        <button className="btn btn-sm btn-light rounded-circle text-muted ms-1" style={{ width: '30px', height: '30px', flexShrink: 0, border: '1px solid var(--border-color)' }}>
          <i className="bi bi-download" style={{ fontSize: '12px' }}></i>
        </button>
      </div>

      {/* Document Item 2 */}
      <div className="d-flex align-items-center mb-3 p-2 bg-white rounded-3 border" style={{ transition: 'all 0.2s ease', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex justify-content-center align-items-center me-3" style={{ width: '44px', height: '44px', flexShrink: 0 }}>
          <i className="bi bi-file-earmark-word-fill fs-5"></i>
        </div>
        <div className="flex-grow-1 overflow-hidden">
          <div className="fw-bold text-dark text-truncate mb-1" style={{ fontSize: '13px' }} title="Mẫu đồ án tốt nghiệp IT">Mẫu đồ án tốt nghiệp IT</div>
          <div className="d-flex align-items-center">
            <span className="badge bg-light text-secondary border fw-normal me-2" style={{ fontSize: '10px' }}>DOCX</span>
            <span className="text-muted" style={{ fontSize: '11px' }}><i className="bi bi-clock me-1"></i>Hôm qua</span>
          </div>
        </div>
        <button className="btn btn-sm btn-light rounded-circle text-muted ms-1" style={{ width: '30px', height: '30px', flexShrink: 0, border: '1px solid var(--border-color)' }}>
          <i className="bi bi-download" style={{ fontSize: '12px' }}></i>
        </button>
      </div>
      
      {/* Document Item 3 */}
      <div className="d-flex align-items-center mb-1 p-2 bg-white rounded-3 border" style={{ transition: 'all 0.2s ease', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div className="bg-warning bg-opacity-10 text-warning rounded-3 d-flex justify-content-center align-items-center me-3" style={{ width: '44px', height: '44px', flexShrink: 0 }}>
          <i className="bi bi-file-earmark-zip-fill fs-5"></i>
        </div>
        <div className="flex-grow-1 overflow-hidden">
          <div className="fw-bold text-dark text-truncate mb-1" style={{ fontSize: '13px' }} title="Source code mẫu ReactJS">Source code mẫu ReactJS</div>
          <div className="d-flex align-items-center">
            <span className="badge bg-light text-secondary border fw-normal me-2" style={{ fontSize: '10px' }}>ZIP</span>
            <span className="text-muted" style={{ fontSize: '11px' }}><i className="bi bi-clock me-1"></i>3 ngày trước</span>
          </div>
        </div>
        <button className="btn btn-sm btn-light rounded-circle text-muted ms-1" style={{ width: '30px', height: '30px', flexShrink: 0, border: '1px solid var(--border-color)' }}>
          <i className="bi bi-download" style={{ fontSize: '12px' }}></i>
        </button>
      </div>
    </div>
  );
}
