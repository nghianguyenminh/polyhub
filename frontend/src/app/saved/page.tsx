'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI } from '@/lib/api';
import { Post, Document } from '@/lib/types';
import Header from '@/components/layout/Header';
import LeftSidebar from '@/components/layout/LeftSidebar';
import '@/styles/saved.css';

type SortOrder = 'newest' | 'oldest';

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
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [removingId, setRemovingId] = useState<number | null>(null);

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
    setRemovingId(postId);
    try {
      await fetchAPI(`/api/saved/togglePost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ postId: postId.toString() })
      });
      // Small delay for animation
      setTimeout(() => {
        loadSaved(page);
        setRemovingId(null);
      }, 300);
    } catch (err) {
      console.error('Unsave post failed', err);
      setRemovingId(null);
    }
  };

  const handleToggleSavedDoc = async (e: React.MouseEvent, docId: number) => {
    e.preventDefault();
    setRemovingId(docId);
    try {
      await fetchAPI(`/api/saved/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ documentId: docId.toString() })
      });
      setTimeout(() => {
        loadSaved(page);
        setRemovingId(null);
      }, 300);
    } catch (err) {
      console.error('Unsave doc failed', err);
      setRemovingId(null);
    }
  };

  const getDocIconClass = (docType: string) => {
    switch (docType) {
      case 'PDF': return { cls: 'pdf', icon: 'bi-file-earmark-pdf-fill' };
      case 'WORD': return { cls: 'word', icon: 'bi-file-earmark-word-fill' };
      case 'EXCEL': return { cls: 'excel', icon: 'bi-file-earmark-excel-fill' };
      case 'ZIP': return { cls: 'zip', icon: 'bi-file-earmark-zip-fill' };
      default: return { cls: 'other', icon: 'bi-file-earmark-fill' };
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const sortedPosts = [...savedPosts].sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
  });

  const sortedDocs = [...savedDocs].sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
  });

  const totalItems = type === 'posts' ? totalSavedPosts : totalSavedDocs;

  return (
    <>
      <Header />
      <div className="app-container">
        <main className="w-100 d-flex justify-content-between">
          <LeftSidebar activeMenu="saved" />
          
          <div className="poly-main-feed" style={{ maxWidth: '850px', width: '100%' }}>

            {/* ═══ Page Header ═══ */}
            <div className="sv-page-header">
              <div className="sv-header-row">
                <div className="sv-header-icon">
                  <i className="bi bi-bookmark-heart-fill"></i>
                </div>
                <div>
                  <h4 className="sv-header-title">Thư viện của bạn</h4>
                  <p className="sv-header-sub">
                    Nơi lưu trữ tất cả bài viết hữu ích và tài liệu quý giá bạn đã sưu tầm.
                  </p>
                </div>
              </div>
              <div className="sv-stats-row">
                <span className="sv-stat-badge">
                  <i className="bi bi-file-earmark-richtext"></i>
                  {totalSavedPosts} bài viết
                </span>
                <span className="sv-stat-badge">
                  <i className="bi bi-file-earmark-zip"></i>
                  {totalSavedDocs} tài liệu
                </span>
                <span className="sv-stat-badge">
                  <i className="bi bi-collection"></i>
                  {totalSavedPosts + totalSavedDocs} tổng cộng
                </span>
              </div>
            </div>

            {/* ═══ Tab Switcher ═══ */}
            <div className="sv-tabs-container">
              <button 
                className={`sv-tab-btn ${type === 'posts' ? 'active' : ''}`}
                onClick={() => setType('posts')}
              >
                <i className="bi bi-file-earmark-richtext"></i>
                Bài viết đã lưu
                <span className="sv-tab-count">{totalSavedPosts}</span>
              </button>
              <button 
                className={`sv-tab-btn ${type === 'documents' ? 'active' : ''}`}
                onClick={() => setType('documents')}
              >
                <i className="bi bi-file-earmark-zip"></i>
                Tài liệu đã lưu
                <span className="sv-tab-count">{totalSavedDocs}</span>
              </button>
            </div>

            {/* ═══ Filter Bar ═══ */}
            <div className="sv-filter-bar">
              <button className="sv-filter-btn active">
                <i className="bi bi-funnel"></i>
                Tất cả
              </button>
              <div className="sv-filter-divider"></div>
              <select 
                className="sv-sort-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              >
                <option value="newest">Mới nhất trước</option>
                <option value="oldest">Cũ nhất trước</option>
              </select>
              {totalItems > 0 && (
                <span style={{ fontSize: '13px', color: '#6c757d', marginLeft: 'auto', fontWeight: 500 }}>
                  Đang hiển thị {type === 'posts' ? sortedPosts.length : sortedDocs.length} / {totalItems} mục
                </span>
              )}
            </div>

            {/* ═══ Content List ═══ */}
            <div style={{ marginBottom: '40px' }}>
              {isFetching ? (
                <div className="sv-loading">
                  <div className="sv-spinner"></div>
                  <span className="sv-loading-text">Đang tải thư viện...</span>
                </div>
              ) : type === 'posts' ? (
                sortedPosts.length === 0 ? (
                  <div className="sv-empty">
                    <div className="sv-empty-icon">
                      <i className="bi bi-journal-bookmark"></i>
                    </div>
                    <div className="sv-empty-title">Chưa có bài viết nào</div>
                    <p className="sv-empty-sub">
                      Bạn chưa lưu bài viết nào. Hãy khám phá bảng tin và lưu lại những bài viết hay nhé!
                    </p>
                  </div>
                ) : (
                  sortedPosts.map((item, index) => (
                    <div 
                      className="sv-post-card" 
                      key={item.id}
                      style={{ 
                        animationDelay: `${index * 0.06}s`,
                        opacity: removingId === item.post.id ? 0.4 : 1,
                        transform: removingId === item.post.id ? 'scale(0.96)' : undefined,
                        transition: 'opacity 0.3s, transform 0.3s'
                      }}
                    >
                      {/* Saved status bar */}
                      <div className="sv-saved-bar">
                        <i className="bi bi-bookmark-fill"></i>
                        <span>Đã lưu vào</span>
                        <span className="sv-saved-bar-date">
                          {new Date(item.savedAt).toLocaleDateString('vi-VN', { 
                            day: '2-digit', month: '2-digit', year: 'numeric', 
                            hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      
                      {/* Author row */}
                      <div className="sv-post-author">
                        <div className="sv-post-author-left">
                          <img 
                            src={item.post.user?.avatar && item.post.user.avatar !== 'default.png' 
                              ? item.post.user.avatar 
                              : `https://ui-avatars.com/api/?name=${item.post.user?.fullname}&background=random`} 
                            className="sv-author-avatar" 
                            alt="Avatar" 
                          />
                          <div>
                            <Link 
                              href={`/profile/${item.post.user?.username}`} 
                              className="sv-author-name"
                            >
                              {item.post.user?.fullname || 'Ẩn danh'}
                            </Link>
                            <div className="sv-author-meta">
                              <i className="bi bi-calendar3"></i>
                              <span>{new Date(item.post.createdAt).toLocaleDateString('vi-VN')}</span>
                              <span>•</span>
                              <i className={item.post.isPrivate ? 'bi bi-lock-fill' : 'bi bi-globe-americas'}></i>
                              <span>{item.post.isPrivate ? 'Riêng tư' : 'Công khai'}</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => handleToggleSavedPost(e, item.post.id)} 
                          className="sv-btn-unsave"
                        >
                          <i className="bi bi-bookmark-x"></i>
                          Bỏ lưu
                        </button>
                      </div>
                      
                      {/* Content */}
                      {item.post.content && (
                        <div className="sv-post-content">{item.post.content}</div>
                      )}
                      
                      {/* Image */}
                      {item.post.imageUrl && (
                        <img 
                          src={item.post.imageUrl} 
                          className="sv-post-image" 
                          alt="Post" 
                        />
                      )}

                      {/* Footer stats */}
                      <div className="sv-post-footer">
                        <span className="sv-post-footer-stat">
                          <i className="bi bi-heart-fill" style={{ color: '#F27125' }}></i>
                          {item.post.likesCount || 0}
                        </span>
                        <span className="sv-post-footer-stat">
                          <i className="bi bi-chat-dots"></i>
                          {item.post.commentsCount || 0} bình luận
                        </span>
                        <span className="sv-post-footer-stat">
                          <i className="bi bi-share"></i>
                          {item.post.sharesCount || 0} chia sẻ
                        </span>
                      </div>
                    </div>
                  ))
                )
              ) : (
                sortedDocs.length === 0 ? (
                  <div className="sv-empty">
                    <div className="sv-empty-icon">
                      <i className="bi bi-folder2-open"></i>
                    </div>
                    <div className="sv-empty-title">Chưa có tài liệu nào</div>
                    <p className="sv-empty-sub">
                      Bạn chưa lưu tài liệu nào. Hãy ghé thăm kho tài liệu và tìm kiếm tài liệu hữu ích!
                    </p>
                  </div>
                ) : (
                  sortedDocs.map((item, index) => {
                    const { cls, icon } = getDocIconClass(item.document.documentType);
                    return (
                      <div 
                        className="sv-doc-card" 
                        key={item.id}
                        style={{ 
                          animationDelay: `${index * 0.06}s`,
                          opacity: removingId === item.document.id ? 0.4 : 1,
                          transform: removingId === item.document.id ? 'scale(0.96)' : undefined,
                          transition: 'opacity 0.3s, transform 0.3s'
                        }}
                      >
                        {/* Saved status bar */}
                        <div className="sv-saved-bar">
                          <i className="bi bi-bookmark-fill"></i>
                          <span>Đã lưu vào</span>
                          <span className="sv-saved-bar-date">
                            {new Date(item.savedAt).toLocaleDateString('vi-VN', { 
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Document body */}
                        <div className="sv-doc-body">
                          <div className={`sv-doc-icon-box ${cls}`}>
                            <i className={`bi ${icon}`}></i>
                          </div>
                          <div className="sv-doc-info">
                            <span className="sv-doc-category">
                              <i className="bi bi-tag-fill"></i>
                              {item.document.category?.name || 'Chuyên ngành'}
                            </span>
                            <h6 className="sv-doc-title">{item.document.title}</h6>
                            <div className="sv-doc-meta">
                              <span>
                                <i className="bi bi-person"></i>
                                {item.document.uploader?.fullname || 'Hệ thống'}
                              </span>
                              <span>
                                <i className="bi bi-file-earmark"></i>
                                {item.document.documentType}
                              </span>
                              {item.document.fileSize > 0 && (
                                <span>
                                  <i className="bi bi-hdd"></i>
                                  {formatFileSize(item.document.fileSize)}
                                </span>
                              )}
                              {item.document.downloadCount > 0 && (
                                <span>
                                  <i className="bi bi-download"></i>
                                  {item.document.downloadCount}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="sv-doc-actions">
                            <a 
                              href={`/api/documents/download/${item.document.id}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="sv-btn-download"
                            >
                              <i className="bi bi-download"></i>
                              Tải về
                            </a>
                            <button 
                              onClick={(e) => handleToggleSavedDoc(e, item.document.id)} 
                              className="sv-btn-unsave"
                            >
                              <i className="bi bi-bookmark-x"></i>
                              Bỏ lưu
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>

            {/* ═══ Pagination ═══ */}
            {!isFetching && totalPages > 1 && (
              <div className="sv-pagination">
                <button 
                  className="sv-page-btn" 
                  onClick={() => loadSaved(page - 1)} 
                  disabled={page === 1}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button 
                    className={`sv-page-btn ${page === i + 1 ? 'active' : ''}`} 
                    key={i}
                    onClick={() => loadSaved(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  className="sv-page-btn" 
                  onClick={() => loadSaved(page + 1)} 
                  disabled={page === totalPages}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}
