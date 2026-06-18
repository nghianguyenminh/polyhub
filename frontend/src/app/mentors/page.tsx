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
            <div className="poly-card p-3 mb-4" style={{ background: 'linear-gradient(to right, #ffffff, #fffaf5)' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <h5 className="fw-bold mb-1 text-dark">Kết nối Mentor</h5>
                  <div className="text-muted" style={{ fontSize: '13px' }}>Tìm kiếm chuyên gia để định hướng và hỗ trợ dự án của bạn</div>
                </div>
                <Link href="/mentors/register" className="btn btn-poly-gradient fw-bold rounded-pill px-3 py-2 shadow-sm d-flex align-items-center text-decoration-none text-white" style={{ fontSize: '13.5px' }}>
                  Trở thành Mentor
                </Link>
              </div>
              
              <form onSubmit={handleSearch} className="input-group mt-3 shadow-sm" style={{ borderRadius: '50rem', border: '1px solid rgba(242, 113, 37, 0.2)', background: 'white' }}>
                <span className="input-group-text bg-transparent border-0 text-poly ps-3 pe-2 py-2">
                  <i className="bi bi-search"></i>
                </span>
                <input 
                  type="text" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="form-control bg-transparent border-0 py-2 shadow-none" 
                  style={{ fontSize: '13.5px' }} 
                  placeholder="Tìm kiếm theo tên, email, giới thiệu..."
                />
                <button type="submit" className="btn btn-poly-gradient px-4 fw-bold py-2" style={{ borderRadius: '0 50rem 50rem 0', fontSize: '13.5px' }}>Tìm kiếm</button>
              </form>
            </div>

            <div className="d-flex align-items-center gap-2 mb-4 overflow-visible">
              <button className="filter-coursera shadow-sm fw-bold text-dark border-0">
                <i className="bi bi-sliders"></i> Sắp xếp
              </button>
              <div className="vr mx-1 opacity-25"></div> 
              
              <select 
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="form-select form-select-sm shadow-sm cursor-pointer" 
                style={{ borderRadius: '50rem', paddingLeft: '1rem', paddingRight: '2rem', fontSize: '13.5px', fontWeight: 500, width: 'auto' }}
              >
                <option value="newest">Mới tham gia (Mới nhất)</option>
                <option value="oldest">Gạo cội (Cũ nhất)</option>
              </select>
            </div>

            <div className="row row-cols-1 row-cols-md-2 g-3 mb-5">
              {isFetching ? (
                <div className="col-12 text-center my-5">
                  <div className="spinner-border text-primary" role="status"></div>
                </div>
              ) : mentors.length === 0 ? (
                <div className="col-12 text-center my-5 text-muted">
                  Không tìm thấy Mentor nào phù hợp.
                </div>
              ) : (
                mentors.map(req => (
                  <div className="col" key={req.id}>
                    <div className="mentor-profile-card">
                      <div className="mentor-card-cover" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=600")' }}></div>
                      
                      <div className="mentor-card-body">
                        <div className="d-flex justify-content-between align-items-start">
                          <img 
                            src={req.user?.avatar && req.user.avatar !== 'default.png' ? req.user.avatar : `https://ui-avatars.com/api/?name=${req.fullname}&background=random`} 
                            className="mentor-card-avatar" 
                            alt="avatar" 
                          />
                        </div>
                        
                        <div className="mt-2 mb-3">
                          <h5 className="fw-bold text-dark mb-0 d-flex align-items-center">
                            <span>{req.fullname}</span>
                            <i className="bi bi-patch-check-fill text-primary ms-1 fs-6" title="Đã xác thực" style={{ background: '-webkit-linear-gradient(45deg, #f27121, #e94057)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}></i>
                          </h5>
                          <div className="text-muted" style={{ fontSize: '13px', fontWeight: 500 }}>{req.introduction}</div>
                        </div>
                        
                        <p className="mentor-bio">{req.motivation}</p>
                        
                        <div className="d-flex flex-wrap gap-1 mb-3">
                          <span className="mentor-tag">Mentor</span>
                          <span className="mentor-tag">Polyhub</span>
                        </div>
                        
                        <div className="d-flex flex-column gap-2 mt-auto w-100">
                          <div className="d-flex gap-2">
                            <Link href={`/profile/${req.user?.username}`} className="btn btn-light flex-grow-1 rounded-pill fw-bold text-dark border shadow-sm btn-action text-center text-decoration-none">
                              Hồ sơ
                            </Link>
                            <Link href={`/chat?userId=${req.user?.username}`} className="btn btn-poly-gradient flex-grow-1 rounded-pill fw-bold btn-action text-white text-decoration-none text-center">
                              <i className="bi bi-chat-dots-fill me-1"></i> Nhắn tin
                            </Link>
                          </div>
                          <button 
                            onClick={() => {
                              setSelectedMentor(req);
                              setIsBookingOpen(true);
                            }}
                            className="btn w-100 rounded-pill fw-bold btn-action text-white border-0 shadow-sm"
                            style={{ background: 'linear-gradient(135deg, #F27125 0%, #FF9E67 100%)' }}
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
