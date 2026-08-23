'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI } from '@/lib/api';
import { Mentor } from '@/lib/types';
import Header from '@/components/layout/Header';
import LeftSidebar from '@/components/layout/LeftSidebar';
import '@/styles/mentors.css';
import RightSidebar from '@/components/layout/RightSidebar';
import BookingModal from '@/components/mentors/BookingModal';

export default function MentorsPage() {
  const { user, loading } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState('newest');
  const [isFetching, setIsFetching] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const loadMentors = async (p = 1) => {
    setIsFetching(true);
    try {
      const params = new URLSearchParams();
      params.append('page', p.toString());
      if (keyword) params.append('keyword', keyword);
      if (sort) params.append('sort', sort);

      // The backend returns a map: { mentors: [...], currentPage: 1, totalPages: 5 }
      const data = await fetchAPI(`/api/mentors?${params.toString()}`);
      
      setMentors(data.mentors || []);
      setPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load mentors', error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadMentors(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadMentors(1);
  };

  return (
    <>
      <Header />
      <div className="app-container">
        <main className="w-100 d-flex justify-content-between">
          <LeftSidebar activeMenu="mentors" />
          
          <div className="poly-main-feed flex-grow-1 mx-4" style={{ maxWidth: '850px', minWidth: '0' }}>
            <div className="mentor-hero-card poly-card p-4 mb-4" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fffaf5 100%)' }}>
              <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-2">
                <div>
                  <h5 className="mentor-hero-title fw-bold mb-1 text-dark" style={{ fontSize: '19px' }}>Kết nối Mentor</h5>
                  <div className="mentor-hero-subtitle text-muted">Tìm kiếm chuyên gia để định hướng và hỗ trợ dự án của bạn</div>
                </div>
                <Link href="/mentors/register" className="mentor-cta-btn btn fw-bold rounded-pill px-4 py-2 d-flex align-items-center text-decoration-none text-white" style={{ fontSize: '13.5px' }}>
                  <i className="bi bi-stars me-2"></i>Trở thành Mentor
                </Link>
              </div>
              
              <form onSubmit={handleSearch} className="mentor-search-bar input-group mt-3">
                <span className="input-group-text bg-transparent border-0 mentor-search-icon ps-4 pe-2 py-2">
                  <i className="bi bi-search"></i>
                </span>
                <input 
                  type="text" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="mentor-search-input form-control bg-transparent border-0 py-2 shadow-none" 
                  placeholder="Tìm kiếm theo tên, email, giới thiệu..."
                />
                <button type="submit" className="mentor-search-submit btn px-4 fw-bold py-2 text-white border-0">
                  Tìm kiếm
                </button>
              </form>
            </div>

            <div className="mentor-filter-row d-flex align-items-center gap-2 mb-4 overflow-visible">
              <span className="mentor-filter-pill">
                <i className="bi bi-sliders"></i> Sắp xếp
              </span>
              <div className="mentor-filter-divider"></div>

              <select 
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="mentor-sort-select"
                style={{ width: 'auto' }}
              >
                <option value="newest">Mới tham gia (Mới nhất)</option>
                <option value="oldest">Gạo cội (Cũ nhất)</option>
              </select>
            </div>

            <div className="row row-cols-1 row-cols-md-2 g-3 mb-5">
              {isFetching ? (
                <div className="col-12 text-center my-5 py-4">
                  <div className="spinner-border" role="status" style={{ color: '#F27125', width: '2.5rem', height: '2.5rem' }}></div>
                </div>
              ) : mentors.length === 0 ? (
                <div className="col-12">
                  <div className="mentor-empty-state text-center">
                    <i className="bi bi-emoji-neutral mentor-empty-icon d-block"></i>
                    <div className="fw-semibold text-dark mb-1" style={{ fontSize: '14.5px' }}>Không tìm thấy Mentor nào phù hợp</div>
                    <div style={{ fontSize: '13px' }}>Thử đổi từ khóa tìm kiếm hoặc bộ lọc khác xem sao nhé.</div>
                  </div>
                </div>
              ) : (
                mentors.map(req => (
                  <div className="col" key={req.id}>
                    <div className="mentor-profile-card">
                      <div className="mentor-card-cover" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=600")' }}></div>
                      
                      <div className="mentor-card-body">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="mentor-card-avatar-wrap">
                            <img 
                              src={req.user?.avatar && req.user.avatar !== 'default.png' ? req.user.avatar : `https://ui-avatars.com/api/?name=${req.fullname}&background=random`} 
                              className="mentor-card-avatar" 
                              alt="avatar" 
                            />
                          </div>
                        </div>
                        
                        <div className="mt-2 mb-3">
                          <h5 className="mentor-card-name fw-bold text-dark mb-0 d-flex align-items-center">
                            <span>{req.fullname}</span>
                            <i className="bi bi-patch-check-fill mentor-verified-badge ms-1 fs-6" title="Đã xác thực"></i>
                          </h5>
                          <div className="mentor-card-headline mt-1">{req.introduction}</div>
                          {req.reviewCount !== undefined && req.reviewCount > 0 && (
                            <div className="d-flex align-items-center mt-1" style={{ fontSize: '13px' }}>
                              <span style={{ color: '#F5C518', fontWeight: 'bold', marginRight: '4px' }}>
                                <i className="bi bi-star-fill me-1"></i>
                                {req.averageRating?.toFixed(1)}
                              </span>
                              <span style={{ color: '#65676B' }}>
                                ({req.reviewCount} đánh giá)
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <p className="mentor-bio">{req.motivation}</p>
                        
                        <div className="d-flex flex-wrap gap-1 mb-3">
                          <span className="mentor-tag">Mentor</span>
                          <span className="mentor-tag">Polyhub</span>
                        </div>
                        
                        <div className="d-flex flex-column gap-2 mt-auto w-100">
                          <div className="d-flex gap-2">
                            <Link href={`/profile/${req.user?.username}`} className="mentor-btn-profile btn flex-grow-1 rounded-pill fw-bold text-dark btn-action text-center text-decoration-none">
                              Hồ sơ
                            </Link>
                            <Link href={`/chat?userId=${req.user?.username}`} className="mentor-btn-message btn flex-grow-1 rounded-pill fw-bold btn-action text-white text-decoration-none text-center border-0">
                              <i className="bi bi-chat-dots-fill me-1"></i> Nhắn tin
                            </Link>
                          </div>
                          <button 
                            onClick={() => {
                              setSelectedMentor(req);
                              setIsBookingOpen(true);
                            }}
                            className="mentor-btn-book btn w-100 rounded-pill fw-bold btn-action text-white border-0"
                          >
                            <i className="bi bi-calendar-check-fill me-1"></i> Đặt lịch hẹn
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {!isFetching && totalPages > 1 && (
              <nav aria-label="Page navigation">
                <ul className="pagination poly-pagination justify-content-center mt-4 mb-5">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => loadMentors(page - 1)} disabled={page === 1}><i className="bi bi-chevron-left"></i></button>
                  </li>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <li className={`page-item ${page === i + 1 ? 'active' : ''}`} key={i}>
                      <button className="page-link" onClick={() => loadMentors(i + 1)}>{i + 1}</button>
                    </li>
                  ))}
                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => loadMentors(page + 1)} disabled={page === totalPages}><i className="bi bi-chevron-right"></i></button>
                  </li>
                </ul>
              </nav>
            )}

          </div>
          <RightSidebar/>
        </main>
      </div>

      {selectedMentor && (
        <BookingModal 
          isOpen={isBookingOpen}
          onClose={() => {
            setIsBookingOpen(false);
            setSelectedMentor(null);
          }}
          mentor={selectedMentor}
        />
      )}
    </>
  );
}