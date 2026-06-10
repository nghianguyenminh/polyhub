'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI } from '@/lib/api';
import { Post, Document } from '@/lib/types';
import Header from '@/components/layout/Header';
import LeftSidebar from '@/components/layout/LeftSidebar';
import '@/styles/saved.css'; // Make sure you have or create saved.css if needed

export default function SavedPage() {
  const { user, loading } = useAuth();
  const [type, setType] = useState<'posts' | 'documents'>('posts');
  const [savedPosts, setSavedPosts] = useState<{ id: number, savedAt: string, post: Post }[]>([]);
  const [savedDocs, setSavedDocs] = useState<{ id: number, savedAt: string, document: Document }[]>([]);
  const [totalSavedPosts, setTotalSavedPosts] = useState(0);
  const [totalSavedDocs, setTotalSavedDocs] = useState(0);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFetching, setIsFetching] = useState(true);

  const loadSaved = async (p = 1) => {
    setIsFetching(true);
    try {
      const data = await fetchAPI(`/api/saved?type=${type}&page=${p}`);
      if (type === 'posts') {
        setSavedPosts(data.content || []);
      } else {
        setSavedDocs(data.content || []);
      }
      setTotalSavedPosts(data.totalSavedPosts || 0);
      setTotalSavedDocs(data.totalSavedDocs || 0);
      setPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load saved items', error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadSaved(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleToggleSavedPost = async (e: React.MouseEvent, postId: number) => {
    e.preventDefault();
    try {
      await fetchAPI(`/api/saved/togglePost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ postId: postId.toString() })
      });
      loadSaved(page); // Reload
    } catch (err) {
      console.error('Unsave post failed', err);
    }
  };

  const handleToggleSavedDoc = async (e: React.MouseEvent, docId: number) => {
    e.preventDefault();
    try {
      await fetchAPI(`/api/saved/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ documentId: docId.toString() })
      });
      loadSaved(page); // Reload
    } catch (err) {
      console.error('Unsave doc failed', err);
    }
  };

  const getDocIconAndClass = (docType: string) => {
    switch (docType) {
      case 'PDF': return { box: 'bg-danger-soft text-danger', icon: 'bi-file-earmark-pdf-fill' };
      case 'WORD': return { box: 'bg-primary-soft text-primary', icon: 'bi-file-earmark-word-fill' };
      case 'EXCEL': return { box: 'bg-success-soft text-success', icon: 'bi-file-earmark-excel-fill' };
      case 'ZIP': return { box: 'bg-warning-soft text-warning', icon: 'bi-file-earmark-zip-fill' };
      default: return { box: 'bg-info-soft text-info', icon: 'bi-file-earmark-fill' };
    }
  };

  return (
    <>
      <Header />
      <div className="app-container">
        <main className="w-100 d-flex justify-content-between">
          <LeftSidebar activeMenu="saved" />
          
          <div className="poly-main-feed" style={{ maxWidth: '850px', width: '100%' }}>
            <div className="poly-card p-3 mb-4 border-0 shadow-sm" style={{ backgroundColor: '#fdfdfd' }}>
              <div className="d-flex align-items-center gap-3">
                <div className="icon-box-lg bg-poly-soft text-poly rounded-circle" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-bookmark-fill fs-3"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-1 text-dark">Thư viện của bạn</h5>
                  <div className="text-muted" style={{ fontSize: '13.5px' }}>Nơi lưu trữ tất cả các bài viết hữu ích và tài liệu quý giá bạn đã sưu tầm.</div>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 mb-4 overflow-visible">
              <button className="filter-coursera shadow-sm fw-bold text-dark border-0">
                <i className="bi bi-sliders"></i> Lọc
              </button>
              <div className="vr mx-1 opacity-25"></div> 
              
              <div className="dropdown">
                <button className="filter-coursera dropdown-toggle border-0" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                  Loại nội dung <i className="bi bi-chevron-down ms-1" style={{ fontSize: '11px' }}></i>
                </button>
                <div className="dropdown-menu coursera-dropdown-menu shadow">
                  <div className="coursera-filter-header">Chọn loại nội dung</div>
                  <div className="coursera-filter-body">
                    <div className="form-check custom-radio mb-2">
                      <input 
                        className="form-check-input shadow-none" 
                        type="radio" 
                        name="type" 
                        id="s_type2" 
                        value="posts" 
                        checked={type === 'posts'}
                        onChange={() => setType('posts')}
                      />
                      <label className="form-check-label d-flex justify-content-between w-100" htmlFor="s_type2">
                        <span><i className="bi bi-file-earmark-richtext text-poly me-1"></i> Bài viết</span> 
                        <span className="text-muted">({totalSavedPosts})</span>
                      </label>
                    </div>
                    <div className="form-check custom-radio mb-2">
                      <input 
                        className="form-check-input shadow-none" 
                        type="radio" 
                        name="type" 
                        id="s_type3" 
                        value="documents" 
                        checked={type === 'documents'}
                        onChange={() => setType('documents')}
                      />
                      <label className="form-check-label d-flex justify-content-between w-100" htmlFor="s_type3">
                        <span><i className="bi bi-file-earmark-zip text-poly me-1"></i> Tài liệu</span> 
                        <span className="text-muted">({totalSavedDocs})</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="saved-items-list mb-5">
              {isFetching ? (
                <div className="text-center my-5">
                  <div className="spinner-border text-primary" role="status"></div>
                </div>
              ) : type === 'posts' ? (
                savedPosts.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-journal-x text-muted" style={{ fontSize: '3rem' }}></i>
                    <p className="text-muted mt-3">Bạn chưa lưu bài viết nào.</p>
                  </div>
                ) : (
                  savedPosts.map(item => (
                    <div className="poly-card p-0 mb-3 saved-item-wrapper" key={item.id}>
                      <div className="saved-status-bar text-muted border-bottom mb-0 p-2" style={{ backgroundColor: '#f8f9fa', fontSize: '12.5px' }}>
                        <i className="bi bi-bookmark-fill me-1 text-poly"></i> Bạn đã lưu bài viết này vào <span>{new Date(item.savedAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      
                      <div className="p-3 pb-2 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <img 
                            src={item.post.user?.avatar && item.post.user.avatar !== 'default.png' ? item.post.user.avatar : `https://ui-avatars.com/api/?name=${item.post.user?.fullname}&background=random`} 
                            className="rounded-circle border object-fit-cover" 
                            width="40" 
                            height="40" 
                            alt="Avatar" 
                          />
                          <div style={{ lineHeight: 1.3 }}>
                            <Link href={`/profile/${item.post.user?.username}`} className="fw-bold text-dark text-decoration-none" style={{ fontSize: '14.5px' }}>
                              {item.post.user?.fullname || 'Ẩn danh'}
                            </Link>
                            <div className="text-muted" style={{ fontSize: '13px' }}>
                              <span>{new Date(item.post.createdAt).toLocaleDateString('vi-VN')}</span> 
                              {' • '}
                              <i className={item.post.isPrivate ? 'bi bi-lock-fill' : 'bi bi-globe-americas'}></i>
                            </div>
                          </div>
                        </div>
                        <div className="d-flex gap-2 ms-auto">
                          <button onClick={(e) => handleToggleSavedPost(e, item.post.id)} className="btn btn-sm btn-light text-muted fw-bold rounded-pill px-3 btn-action-saved" style={{ fontSize: '13px' }}>
                            <i className="bi bi-bookmark-x me-1"></i> Bỏ lưu
                          </button>
                        </div>
                      </div>
                      
                      <div className="px-3 pb-2">
                        <p className="mb-0" style={{ fontSize: '14.5px', whiteSpace: 'pre-wrap' }}>{item.post.content}</p>
                      </div>
                      
                      {item.post.imageUrl && (
                        <div className="px-3 pb-3">
                          <img src={item.post.imageUrl} className="img-fluid rounded" alt="Post img" style={{ maxHeight: '400px', width: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>
                  ))
                )
              ) : (
                savedDocs.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-bookmark-dash text-muted" style={{ fontSize: '3rem' }}></i>
                    <p className="text-muted mt-3">Bạn chưa lưu tài liệu nào.</p>
                  </div>
                ) : (
                  savedDocs.map(item => {
                    const { box, icon } = getDocIconAndClass(item.document.documentType);
                    return (
                      <div className="poly-card p-0 mb-3 saved-item-wrapper" key={item.id}>
                        <div className="saved-status-bar text-muted p-2" style={{ backgroundColor: '#f8f9fa', fontSize: '12.5px' }}>
                          <i className="bi bi-bookmark-fill me-1 text-poly"></i> Bạn đã lưu tài liệu này vào <span>{new Date(item.savedAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                        
                        <div className="d-flex align-items-center gap-3 p-3">
                          <div className={`doc-icon-box rounded-3 ${box}`} style={{ width: '50px', height: '50px', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className={`bi ${icon}`}></i>
                          </div>
                          <div className="flex-grow-1">
                            <div className="mb-1">
                              <span className="badge bg-light text-dark border fw-normal" style={{ fontSize: '11px' }}>{item.document.category?.name || 'Chuyên ngành'}</span>
                            </div>
                            <h6 className="text-dark fw-bold mb-1" style={{ fontSize: '14px', lineHeight: 1.4 }}>{item.document.title}</h6>
                            <div className="text-muted" style={{ fontSize: '12px' }}>
                              Đăng bởi <span>{item.document.uploader?.fullname || 'Hệ thống'}</span> • <span>{item.document.documentType}</span>
                            </div>
                          </div>
                          
                          <div className="d-flex gap-2 ms-auto">
                            <button onClick={(e) => handleToggleSavedDoc(e, item.document.id)} className="btn btn-sm btn-light text-muted fw-bold rounded-pill px-3 btn-action-saved">
                              <i className="bi bi-bookmark-x me-1"></i> Bỏ lưu
                            </button>
                            <a href={`/api/documents/download/${item.document.id}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-poly-gradient fw-bold rounded-pill px-3 text-white text-decoration-none">
                              <i className="bi bi-download me-1"></i> Tải về
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>

            {!isFetching && totalPages > 1 && (
              <nav aria-label="Page navigation">
                <ul className="pagination poly-pagination justify-content-center mt-4 mb-5">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => loadSaved(page - 1)} disabled={page === 1}><i className="bi bi-chevron-left"></i></button>
                  </li>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <li className={`page-item ${page === i + 1 ? 'active' : ''}`} key={i}>
                      <button className="page-link" onClick={() => loadSaved(i + 1)}>{i + 1}</button>
                    </li>
                  ))}
                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => loadSaved(page + 1)} disabled={page === totalPages}><i className="bi bi-chevron-right"></i></button>
                  </li>
                </ul>
              </nav>
            )}

          </div>
        </main>
      </div>
    </>
  );
}
