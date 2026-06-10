'use client';

import React from 'react';
import Header from '@/components/layout/Header';

export default function VideosPage() {
  return (
    <>
      <Header />
      <div className="container-fluid bg-light min-vh-100 py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-5">
            <div>
              <h2 className="fw-bold mb-1">PolyHUB TV</h2>
              <p className="text-muted mb-0">Video bài giảng, chia sẻ kinh nghiệm và workshop từ Mentor</p>
            </div>
            <button className="btn btn-primary rounded-pill px-4 fw-medium shadow-sm" style={{ backgroundColor: '#4F46E5', border: 'none' }}>
              <i className="bi bi-cloud-upload me-2"></i>Tải video lên
            </button>
          </div>

          {/* Featured Video */}
          <div className="card border-0 shadow-sm rounded-4 mb-5 overflow-hidden">
            <div className="row g-0">
              <div className="col-lg-8 position-relative bg-dark d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80" className="w-100 h-100 position-absolute top-0 start-0" style={{ objectFit: 'cover', opacity: 0.6 }} alt="Featured Video" />
                <button className="btn btn-danger rounded-circle d-flex align-items-center justify-content-center shadow-lg position-relative z-index-1" style={{ width: '80px', height: '80px' }}>
                  <i className="bi bi-play-fill" style={{ fontSize: '2.5rem', marginLeft: '5px' }}></i>
                </button>
                <div className="position-absolute bottom-0 start-0 m-4 z-index-1">
                  <span className="badge bg-danger rounded-pill px-3 py-2 mb-2">Trực tiếp</span>
                  <h3 className="text-white fw-bold">Live: Giải đáp thắc mắc Đồ án Tốt nghiệp CNTT</h3>
                </div>
              </div>
              <div className="col-lg-4 bg-white border-start">
                <div className="p-4 d-flex flex-column h-100">
                  <h5 className="fw-bold mb-3">Thảo luận trực tiếp</h5>
                  <div className="flex-grow-1 bg-light rounded-3 p-3 mb-3 overflow-auto" style={{ maxHeight: '250px' }}>
                    <div className="d-flex mb-3">
                      <img src="https://ui-avatars.com/api/?name=Hieu" className="rounded-circle me-2" width="32" height="32" alt="Avatar" />
                      <div>
                        <span className="fw-bold small me-2">Hiếu Nguyễn</span>
                        <span className="small bg-white p-2 rounded-3 d-inline-block shadow-sm">Thầy cho em hỏi về mô hình MVC ạ?</span>
                      </div>
                    </div>
                    <div className="d-flex mb-3">
                      <img src="https://ui-avatars.com/api/?name=Lan" className="rounded-circle me-2" width="32" height="32" alt="Avatar" />
                      <div>
                        <span className="fw-bold small me-2">Lan Anh</span>
                        <span className="small bg-white p-2 rounded-3 d-inline-block shadow-sm">Cảm ơn chia sẻ của Mentor rất hữu ích!</span>
                      </div>
                    </div>
                  </div>
                  <div className="input-group mt-auto">
                    <input type="text" className="form-control rounded-pill rounded-end-0 border-end-0 bg-light" placeholder="Nhập bình luận..." />
                    <button className="btn btn-light border border-start-0 rounded-pill rounded-start-0 text-primary">
                      <i className="bi bi-send-fill"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Video Grid */}
          <h5 className="fw-bold mb-4">Video Đề Xuất</h5>
          <div className="row g-4">
            {/* Video 1 */}
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-transparent">
                <div className="position-relative mb-2 rounded-4 overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80" className="w-100 h-100" style={{ objectFit: 'cover' }} alt="Thumbnail" />
                  <span className="badge bg-dark position-absolute bottom-0 end-0 m-2 bg-opacity-75">12:45</span>
                </div>
                <div className="d-flex mt-2 px-1">
                  <img src="https://ui-avatars.com/api/?name=M1&background=0D8ABC&color=fff" className="rounded-circle me-3" width="40" height="40" alt="Channel" />
                  <div>
                    <h6 className="fw-bold mb-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>Hướng dẫn học Spring Boot cơ bản cho người mới bắt đầu phần 1</h6>
                    <p className="text-muted small mb-0">Mentor Trần Văn A</p>
                    <p className="text-muted small mb-0">1.2N lượt xem • 2 ngày trước</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Video 2 */}
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-transparent">
                <div className="position-relative mb-2 rounded-4 overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <img src="https://images.unsplash.com/photo-1542744094-24638ea0b3b5?w=800&q=80" className="w-100 h-100" style={{ objectFit: 'cover' }} alt="Thumbnail" />
                  <span className="badge bg-dark position-absolute bottom-0 end-0 m-2 bg-opacity-75">45:20</span>
                </div>
                <div className="d-flex mt-2 px-1">
                  <img src="https://ui-avatars.com/api/?name=MK&background=F59E0B&color=fff" className="rounded-circle me-3" width="40" height="40" alt="Channel" />
                  <div>
                    <h6 className="fw-bold mb-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>Digital Marketing 2026: Những xu hướng bạn không thể bỏ lỡ</h6>
                    <p className="text-muted small mb-0">Câu lạc bộ Marketing</p>
                    <p className="text-muted small mb-0">850 lượt xem • 1 tuần trước</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Video 3 */}
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-transparent">
                <div className="position-relative mb-2 rounded-4 overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <img src="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80" className="w-100 h-100" style={{ objectFit: 'cover' }} alt="Thumbnail" />
                  <span className="badge bg-dark position-absolute bottom-0 end-0 m-2 bg-opacity-75">08:15</span>
                </div>
                <div className="d-flex mt-2 px-1">
                  <img src="https://ui-avatars.com/api/?name=UI&background=10B981&color=fff" className="rounded-circle me-3" width="40" height="40" alt="Channel" />
                  <div>
                    <h6 className="fw-bold mb-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>Thiết kế giao diện người dùng đẹp mắt với Figma (Tips & Tricks)</h6>
                    <p className="text-muted small mb-0">Mentor Lê Thị B</p>
                    <p className="text-muted small mb-0">2.4N lượt xem • 1 tháng trước</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Video 4 */}
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-transparent">
                <div className="position-relative mb-2 rounded-4 overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80" className="w-100 h-100" style={{ objectFit: 'cover' }} alt="Thumbnail" />
                  <span className="badge bg-dark position-absolute bottom-0 end-0 m-2 bg-opacity-75">55:00</span>
                </div>
                <div className="d-flex mt-2 px-1">
                  <img src="https://ui-avatars.com/api/?name=HR&background=EC4899&color=fff" className="rounded-circle me-3" width="40" height="40" alt="Channel" />
                  <div>
                    <h6 className="fw-bold mb-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>Talkshow: Sinh viên làm sao để ghi điểm trong mắt nhà tuyển dụng?</h6>
                    <p className="text-muted small mb-0">Phòng Quan Hệ Doanh Nghiệp</p>
                    <p className="text-muted small mb-0">5N lượt xem • 2 tháng trước</p>
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
