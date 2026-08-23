'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI } from '@/lib/api';
import { ConnectionUser, Mentor } from '@/lib/types';
import Header from '@/components/layout/Header';
import LeftSidebar from '@/components/layout/LeftSidebar';
import '@/styles/mentors.css'; // shared card styles (mentor-profile-card, avatar, etc.)
import '@/styles/connections.css'; // connections-specific overrides
import RightSidebar from '@/components/layout/RightSidebar';

export default function ConnectionsPage() {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<ConnectionUser[]>([]);
  const [mentors, setMentors] = useState<Partial<Mentor>[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [isFetching, setIsFetching] = useState(true);

  const loadConnections = async (p = 1) => {
    setIsFetching(true);
    try {
      const params = new URLSearchParams();
      params.append('page', p.toString());
      if (keyword) params.append('keyword', keyword);

      // Backend returns map: { users: [...], recommendedMentors: [...], currentPage, totalPages }
      const data = await fetchAPI(`/api/connections?${params.toString()}`);
      
      setUsers(data.users || []);
      if (p === 1 && data.recommendedMentors) {
        setMentors(data.recommendedMentors);
      }
      setPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load connections', error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadConnections(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadConnections(1);
  };

  const handleFollowToggle = async (e: React.MouseEvent, targetUsername: string, isFollowing: boolean) => {
    e.preventDefault();
    if (!user) return;
    try {
      await fetchAPI(`/api/connections/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ targetUsername })
      });
      setUsers(prev => prev.map(u => u.username === targetUsername ? { ...u, isFollowing: !isFollowing } : u));
    } catch (err) {
      console.error('Follow failed', err);
    }
  };

  return (
    <>
     <Header />
    <div className="app-container">
      {/* Thêm pt-4 nếu ở trang chủ bạn có dùng pt-4 để đẩy nội dung xuống một chút */}
      <main className="w-100 d-flex justify-content-between pt-4">
        <LeftSidebar activeMenu="connections" />
        
        {/* SỬA CHÍNH Ở ĐÂY: Thêm flex-grow-1, mx-4 và minWidth: '0' */}
        <div className="poly-main-feed flex-grow-1 mx-4" style={{ maxWidth: '850px', minWidth: '0' }}>
          <div className="poly-card p-3 mb-4" style={{ background: 'linear-gradient(to right, #ffffff, #f0f7ff)' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <h5 className="fw-bold mb-1 text-dark">Góc Kết nối PolyHUB</h5>
                <div className="text-muted" style={{ fontSize: '13px' }}>Giao lưu, theo dõi và kết bạn với mọi người trong hệ thống</div>
              </div>
            </div>
              
              <form onSubmit={handleSearch} className="input-group mt-3 shadow-sm" style={{ borderRadius: '50rem', border: '1px solid rgba(8, 102, 255, 0.2)', background: 'white' }}>
                <span className="input-group-text bg-transparent border-0 text-primary ps-3 pe-2 py-2">
                  <i className="bi bi-search"></i>
                </span>
                <input 
                  type="text" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="form-control bg-transparent border-0 py-2 shadow-none" 
                  style={{ fontSize: '13.5px' }} 
                  placeholder="Tìm kiếm người dùng theo tên, email..."
                />
                <button type="submit" className="btn btn-primary px-4 fw-bold py-2" style={{ borderRadius: '0 50rem 50rem 0', fontSize: '13.5px' }}>Tìm kiếm</button>
              </form>
            </div>

            <div className="row row-cols-1 row-cols-md-2 g-3 mb-5">
              {isFetching ? (
                <div className="col-12 text-center my-5">
                  <div className="spinner-border text-primary" role="status"></div>
                </div>
              ) : users.length === 0 ? (
                <div className="col-12 text-center my-5 text-muted">
                  Không tìm thấy người dùng nào.
                </div>
              ) : (
                users.map(u => (
                  <div className="col" key={u.username}>
                    <div className="mentor-profile-card">
                      <div className="mentor-card-cover" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600")' }}></div>
                      
                      <div className="mentor-card-body">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="mentor-card-avatar-wrap">
                            <img 
                              src={u.avatar && u.avatar !== 'default.png' ? u.avatar : `https://ui-avatars.com/api/?name=${u.fullname}&background=random&rounded=true&size=128`} 
                              className="mentor-card-avatar" 
                              alt="avatar" 
                            />
                          </div>
                          {!u.isSelf && (
                            <button 
                              className={`btn btn-sm rounded-pill fw-bold ${u.isFollowing ? 'btn-primary' : 'btn-outline-primary'}`} 
                              style={{ fontSize: '12px', marginTop: '10px' }}
                              onClick={(e) => handleFollowToggle(e, u.username, u.isFollowing)}
                            >
                              <i className={`bi me-1 ${u.isFollowing ? 'bi-person-check-fill' : 'bi-person-plus-fill'}`}></i>
                              <span>{u.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}</span>
                            </button>
                          )}
                        </div>
                        
                        <div className="mt-2 mb-3">
                          <h5 className="fw-bold text-dark mb-0 d-flex align-items-center">
                            <span>{u.fullname}</span>
                          </h5>
                          <div className="text-muted" style={{ fontSize: '13px', fontWeight: 500 }}>
                            {u.major && <span className="badge bg-poly-soft text-poly me-1">{u.major}</span>}
                            <span>{u.email}</span>
                          </div>
                        </div>
                        
                        <p className="mentor-bio">{u.bio || 'Thành viên của cộng đồng PolyHUB. Luôn sẵn sàng chia sẻ và kết nối.'}</p>
                        
                        <div className="d-flex gap-2 mt-auto">
                          <Link href={`/profile/${u.username}`} className="btn btn-light flex-grow-1 rounded-pill fw-bold text-dark border shadow-sm btn-action text-center text-decoration-none">
                            Hồ sơ
                          </Link>
                          <Link href={`/chat?userId=${u.username}`} className="btn btn-primary flex-grow-1 rounded-pill fw-bold btn-action text-white text-decoration-none text-center">
                            <i className="bi bi-chat-dots-fill me-1"></i> Nhắn tin
                          </Link>
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
                    <button className="page-link" onClick={() => loadConnections(page - 1)} disabled={page === 1}><i className="bi bi-chevron-left"></i></button>
                  </li>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <li className={`page-item ${page === i + 1 ? 'active' : ''}`} key={i}>
                      <button className="page-link" onClick={() => loadConnections(i + 1)}>{i + 1}</button>
                    </li>
                  ))}
                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => loadConnections(page + 1)} disabled={page === totalPages}><i className="bi bi-chevron-right"></i></button>
                  </li>
                </ul>
              </nav>
            )}

          </div>
          <RightSidebar 
      
          />
        </main>
      </div>
    </>
  );
}
