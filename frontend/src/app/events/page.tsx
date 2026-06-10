'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Link from 'next/link';

export default function EventsPage() {
  return (
    <>
      <Header />
      <div className="container-fluid bg-light min-vh-100 py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-5">
            <div>
              <h2 className="fw-bold mb-1">Sự kiện nổi bật</h2>
              <p className="text-muted mb-0">Khám phá và tham gia các sự kiện mới nhất tại FPT Polytechnic</p>
            </div>
            <button className="btn btn-primary rounded-pill px-4 fw-medium shadow-sm" style={{ backgroundColor: '#4F46E5', border: 'none' }}>
              <i className="bi bi-calendar-plus me-2"></i>Tạo sự kiện
            </button>
          </div>

          <div className="row g-4">
            {/* Event Card 1 */}
            <div className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                <div className="position-relative">
                  <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80" className="card-img-top" alt="Event" style={{ height: '200px', objectFit: 'cover' }} />
                  <div className="position-absolute top-0 end-0 m-3">
                    <span className="badge bg-danger rounded-pill px-3 py-2 shadow">Sắp diễn ra</span>
                  </div>
                </div>
                <div className="card-body p-4">
                  <div className="d-flex text-primary mb-2 small fw-bold">
                    <span className="me-3"><i className="bi bi-calendar-event me-1"></i> 15/10/2026</span>
                    <span><i className="bi bi-clock me-1"></i> 08:00 - 11:30</span>
                  </div>
                  <h5 className="fw-bold mb-2">Hội thảo: Tương lai của Trí tuệ Nhân tạo (AI) trong Kỷ nguyên mới</h5>
                  <p className="text-muted small mb-3"><i className="bi bi-geo-alt-fill me-1"></i> Hội trường tòa T, FPT Polytechnic Hà Nội</p>
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar-group me-2">
                      <img src="https://ui-avatars.com/api/?name=A" className="rounded-circle border border-white" width="30" height="30" alt="Avatar" />
                      <img src="https://ui-avatars.com/api/?name=B" className="rounded-circle border border-white ms-n2" width="30" height="30" alt="Avatar" />
                      <img src="https://ui-avatars.com/api/?name=C" className="rounded-circle border border-white ms-n2" width="30" height="30" alt="Avatar" />
                    </div>
                    <span className="small text-muted">+120 người sẽ tham gia</span>
                  </div>
                  <button className="btn btn-outline-primary w-100 rounded-pill fw-medium">Đăng ký tham gia</button>
                </div>
              </div>
            </div>

            {/* Event Card 2 */}
            <div className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                <div className="position-relative">
                  <img src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80" className="card-img-top" alt="Event" style={{ height: '200px', objectFit: 'cover' }} />
                  <div className="position-absolute top-0 end-0 m-3">
                    <span className="badge bg-success rounded-pill px-3 py-2 shadow">Đang diễn ra</span>
                  </div>
                </div>
                <div className="card-body p-4">
                  <div className="d-flex text-primary mb-2 small fw-bold">
                    <span className="me-3"><i className="bi bi-calendar-event me-1"></i> Hôm nay</span>
                    <span><i className="bi bi-clock me-1"></i> Cả ngày</span>
                  </div>
                  <h5 className="fw-bold mb-2">Ngày hội việc làm - IT Job Fair 2026</h5>
                  <p className="text-muted small mb-3"><i className="bi bi-geo-alt-fill me-1"></i> Sân trường FPT Polytechnic</p>
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar-group me-2">
                      <img src="https://ui-avatars.com/api/?name=X" className="rounded-circle border border-white" width="30" height="30" alt="Avatar" />
                      <img src="https://ui-avatars.com/api/?name=Y" className="rounded-circle border border-white ms-n2" width="30" height="30" alt="Avatar" />
                    </div>
                    <span className="small text-muted">+500 người đang tham gia</span>
                  </div>
                  <button className="btn btn-primary w-100 rounded-pill fw-medium">Xem chi tiết</button>
                </div>
              </div>
            </div>

            {/* Event Card 3 */}
            <div className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                <div className="position-relative">
                  <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80" className="card-img-top" alt="Event" style={{ height: '200px', objectFit: 'cover', filter: 'grayscale(100%)' }} />
                  <div className="position-absolute top-0 end-0 m-3">
                    <span className="badge bg-secondary rounded-pill px-3 py-2 shadow">Đã kết thúc</span>
                  </div>
                </div>
                <div className="card-body p-4">
                  <div className="d-flex text-secondary mb-2 small fw-bold">
                    <span className="me-3"><i className="bi bi-calendar-event me-1"></i> 01/09/2026</span>
                    <span><i className="bi bi-clock me-1"></i> 14:00 - 16:00</span>
                  </div>
                  <h5 className="fw-bold mb-2 text-muted">Workshop: Kỹ năng viết CV ấn tượng dành cho Fresher</h5>
                  <p className="text-muted small mb-3"><i className="bi bi-geo-alt-fill me-1"></i> Online qua Google Meet</p>
                  <div className="d-flex align-items-center mb-3">
                    <span className="small text-muted"><i className="bi bi-check-circle-fill text-success me-1"></i> 250 người đã tham gia</span>
                  </div>
                  <button className="btn btn-light w-100 rounded-pill fw-medium" disabled>Xem lại video</button>
                </div>
              </div>
            </div>

          </div>
          
          <div className="text-center mt-5">
            <button className="btn btn-outline-secondary rounded-pill px-4">Tải thêm sự kiện <i className="bi bi-chevron-down ms-1"></i></button>
          </div>
        </div>
      </div>
    </>
  );
}
