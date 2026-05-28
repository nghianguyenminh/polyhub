'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import Header from '@/components/layout/Header';
import { useParams } from 'next/navigation';

export default function MentorDetailPage() {
  const { id } = useParams();
  const [mentor, setMentor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadMentorDetail();
    }
  }, [id]);

  const loadMentorDetail = async () => {
    try {
      const data = await fetchAPI(`/api/mentors/${id}`);
      setMentor(data);
    } catch (err: any) {
      setError(err.message || 'Không tìm thấy thông tin Mentor');
    } finally {
      setLoading(false);
    }
  };

  const getFullImageUrl = (path: string | undefined) => {
    if (!path) return '/default-avatar.png';
    if (path.startsWith('http')) return path;
    return `http://localhost:8080${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Chưa cập nhật';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary" /></div>;

  if (error || !mentor) {
    return (
      <>
        <Header />
        <div className="container mt-5 text-center">
          <div className="alert alert-danger d-inline-block">
            <i className="bi bi-exclamation-triangle-fill me-2"></i> {error || 'Không tìm thấy Mentor'}
          </div>
          <div className="mt-3">
            <Link href="/mentors" className="btn btn-primary">Quay lại danh sách</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container-fluid bg-light min-vh-100 py-5">
        <div className="container">
          {/* Header Profile Section */}
          <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
            <div className="bg-primary bg-gradient p-5 position-relative" style={{ minHeight: '120px' }}>
            </div>
            <div className="card-body px-4 pb-4 px-md-5">
              <div className="d-flex flex-column flex-md-row align-items-center align-items-md-end" style={{ marginTop: '-60px' }}>
                <img 
                  src={getFullImageUrl(mentor.user?.avatar)} 
                  alt="Avatar" 
                  className="rounded-circle border border-4 border-white bg-white shadow-sm mb-3 mb-md-0"
                  style={{ width: '130px', height: '130px', objectFit: 'cover' }}
                />
                <div className="ms-md-4 mb-2 text-center text-md-start flex-grow-1">
                  <h3 className="fw-bold mb-1 text-dark d-flex align-items-center justify-content-center justify-content-md-start">
                    {mentor.fullname}
                    <i className="bi bi-patch-check-fill text-primary ms-2 fs-5" title="Đã xác thực Mentor"></i>
                  </h3>
                  <p className="text-muted mb-0 fw-medium">
                    <i className="bi bi-briefcase me-2"></i> {mentor.user?.major || 'Chưa cập nhật chuyên ngành'}
                  </p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                  <button className="btn btn-primary rounded-pill px-4 shadow-sm" style={{ backgroundColor: '#4F46E5', border: 'none' }}>
                    <i className="bi bi-chat-dots me-2"></i> Nhắn tin
                  </button>
                  <button className="btn btn-outline-secondary rounded-pill shadow-sm">
                    <i className="bi bi-person-plus"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Left Column: Info */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-4 border-bottom pb-2">Thông tin liên hệ</h5>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-3 d-flex align-items-start">
                      <div className="bg-light rounded-circle p-2 text-primary me-3">
                        <i className="bi bi-envelope"></i>
                      </div>
                      <div>
                        <small className="text-muted d-block">Email</small>
                        <span className="fw-medium text-dark">{mentor.email}</span>
                      </div>
                    </li>
                    <li className="mb-3 d-flex align-items-start">
                      <div className="bg-light rounded-circle p-2 text-primary me-3">
                        <i className="bi bi-telephone"></i>
                      </div>
                      <div>
                        <small className="text-muted d-block">Số điện thoại</small>
                        <span className="fw-medium text-dark">{mentor.phone || 'Đang ẩn'}</span>
                      </div>
                    </li>
                    <li className="mb-3 d-flex align-items-start">
                      <div className="bg-light rounded-circle p-2 text-primary me-3">
                        <i className="bi bi-calendar3"></i>
                      </div>
                      <div>
                        <small className="text-muted d-block">Ngày sinh</small>
                        <span className="fw-medium text-dark">{formatDate(mentor.birthday)}</span>
                      </div>
                    </li>
                    <li className="d-flex align-items-start">
                      <div className="bg-light rounded-circle p-2 text-primary me-3">
                        <i className="bi bi-calendar-check"></i>
                      </div>
                      <div>
                        <small className="text-muted d-block">Tham gia từ</small>
                        <span className="fw-medium text-dark">{formatDate(mentor.createdAt)}</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3">Tài liệu đính kèm</h5>
                  {mentor.cvFile && (
                    <a href={getFullImageUrl(mentor.cvFile)} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary w-100 rounded-3 mb-2 d-flex align-items-center justify-content-between">
                      <span><i className="bi bi-file-earmark-pdf me-2"></i> Hồ sơ CV</span>
                      <i className="bi bi-box-arrow-up-right"></i>
                    </a>
                  )}
                  {mentor.certificateFile && (
                    <a href={getFullImageUrl(mentor.certificateFile)} target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary w-100 rounded-3 mb-2 d-flex align-items-center justify-content-between">
                      <span><i className="bi bi-award me-2"></i> Chứng chỉ</span>
                      <i className="bi bi-box-arrow-up-right"></i>
                    </a>
                  )}
                  {mentor.degreeFile && (
                    <a href={getFullImageUrl(mentor.degreeFile)} target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary w-100 rounded-3 d-flex align-items-center justify-content-between">
                      <span><i className="bi bi-mortarboard me-2"></i> Bằng cấp</span>
                      <i className="bi bi-box-arrow-up-right"></i>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Bio */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-4 p-md-5">
                  <h4 className="fw-bold mb-4 border-bottom pb-2">Giới thiệu bản thân</h4>
                  <div className="bg-light p-4 rounded-4 mb-4 text-dark" style={{ whiteSpace: 'pre-line', lineHeight: '1.7' }}>
                    {mentor.introduction || 'Mentor này chưa cập nhật phần giới thiệu.'}
                  </div>

                  <h4 className="fw-bold mb-4 border-bottom pb-2 mt-5">Động lực chia sẻ</h4>
                  <div className="bg-light p-4 rounded-4 text-dark" style={{ whiteSpace: 'pre-line', lineHeight: '1.7' }}>
                    {mentor.motivation || 'Chưa cập nhật động lực.'}
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
