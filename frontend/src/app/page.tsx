'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI, API_BASE_URL } from '@/lib/api';
import { Post } from '@/lib/types';
import Header from '@/components/layout/Header';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import PostCard from '@/components/post/PostCard';
import PostSkeleton from '@/components/post/PostSkeleton';
import '@/styles/home.css';
import SplashScreen from '@/components/layout/SplashScreen';


// Global cache for feed posts to prevent reload delay on navigation
let globalFeedCache: {
  posts: Post[];
  feedPage: number;
  totalPages: number;
  hasNext: boolean;
  lastFetch: number;
} | null = null;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export default function HomePage() {
  
  const { user, loading } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>(globalFeedCache ? globalFeedCache.posts : []);
  const [feedPage, setFeedPage] = useState(globalFeedCache ? globalFeedCache.feedPage : 0);
  const [totalPages, setTotalPages] = useState(globalFeedCache ? globalFeedCache.totalPages : 0);
  const [hasNext, setHasNext] = useState(globalFeedCache ? globalFeedCache.hasNext : false);
  const [feedLoading, setFeedLoading] = useState(globalFeedCache ? false : true);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  // Create post form states
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const loadFeed = useCallback(async (page = 0, force = false) => {
    // If loading first page and we have fresh cache, do not load
    if (page === 0 && !force && globalFeedCache && (Date.now() - globalFeedCache.lastFetch < CACHE_TTL)) {
      return;
    }

    if (loadingRef.current) return;
    loadingRef.current = true;
    if (page === 0 && (!globalFeedCache || globalFeedCache.posts.length === 0)) {
      setFeedLoading(true);
    }

    try {
      const data = await fetchAPI(`/api/v2/posts/feed?page=${page}&size=10`);
      
      setPosts((prev) => {
        const newPosts = page === 0 ? (data.posts || []) : [...prev, ...(data.posts || [])];
        
        // Update global cache
        globalFeedCache = {
          posts: newPosts,
          feedPage: data.currentPage || 0,
          totalPages: data.totalPages || 0,
          hasNext: !!data.hasNext,
          lastFetch: Date.now()
        };
        
        return newPosts;
      });
      
      setFeedPage(data.currentPage || 0);
      setTotalPages(data.totalPages || 0);
      setHasNext(!!data.hasNext);
    } catch (err) {
      console.error('Failed to load feed', err);
    } finally {
      setFeedLoading(false);
      loadingRef.current = false;
    }
  }, []);

  

  useEffect(() => {
    if (user) {
      loadFeed(0);
    }
  }, [user, loadFeed]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNext && !loadingRef.current) {
          loadFeed(feedPage + 1);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNext, feedPage, loadFeed]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPostImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setPostImage(null);
    setImagePreview(null);
  };

  const handleImproveText = async () => {
    if (!postContent.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/improve-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: postContent }),
      });
      if (res.ok) {
        const text = await res.text();
        setPostContent(text);
      }
    } catch (err) {
      console.error('AI improvement failed', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSuggestCaption = async () => {
    if (!postImage) return;
    setAiLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', postImage);

      const res = await fetch(`${API_BASE_URL}/api/ai/suggest-caption`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const caption = await res.text();
        setPostContent(caption);
      }
    } catch (err) {
      console.error('AI caption suggestion failed', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() && !postImage) return;

    setSubmitLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', postContent);
      if (postImage) {
        formData.append('image', postImage);
      }

      await fetchAPI('/api/v2/posts/create', {
        method: 'POST',
        body: formData,
        noRedirectOn401: true,
      });

      // Clear form
      setPostContent('');
      setPostImage(null);
      setImagePreview(null);

      // Close modal using bootstrap programmatic trigger or standard selectors
      const closeBtn = document.getElementById('closeCreatePostModal');
      if (closeBtn) closeBtn.click();

      // Refresh feed (force bypass cache)
      loadFeed(0, true);
    } catch (err) {
      console.error('Failed to create post', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
   
      <Header />
    
      <div className="app-container">
        <main className="w-100 d-flex justify-content-between">
          <LeftSidebar activeMenu="home" />

          {/* Main Feed Content */}
          <div className="poly-main-feed" style={{ maxWidth: '850px' }}>
            {/* Create Post trigger card */}
            <div className="poly-card p-3 bg-white">
              <div className="d-flex align-items-center gap-2">
                <img
                  src={user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                  className="rounded-circle border"
                  width="40"
                  height="40"
                  style={{ objectFit: 'cover' }}
                  alt="user avatar"
                />
                <input
                  type="text"
                  className="form-control rounded-pill bg-light border-0 py-2 px-3 "
                  placeholder={`Bạn đang nghĩ gì, ${user.fullname}?`}
                  style={{ cursor: 'pointer', fontSize: '14.5px' }}
                  readOnly
                  data-bs-toggle="modal"
                  data-bs-target="#createPostModal"
                />
              </div>

              <div className="d-flex justify-content-between px-1 mt-3">
                <button className="btn-ghost flex-grow-1" data-bs-toggle="modal" data-bs-target="#createPostModal">
                  <i className="bi bi-camera-reels text-danger me-2 fs-5"></i> Video
                </button>
                <button className="btn-ghost flex-grow-1" data-bs-toggle="modal" data-bs-target="#createPostModal">
                  <i className="bi bi-image text-success me-2 fs-5"></i> Ảnh/GIF
                </button>
                <button className="btn-ghost flex-grow-1" data-bs-toggle="modal" data-bs-target="#createPostModal">
                  <i className="bi bi-emoji-smile text-warning me-2 fs-5"></i> Cảm xúc
                </button>
              </div>
            </div>

            {/* Posts Feed list */}
            {feedLoading && posts.length === 0 ? (
              <div className="d-flex flex-column mt-3">
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </div>
            ) : posts.length === 0 ? (
              <div className="poly-card p-5 text-center text-muted bg-white">
                <i className="bi bi-chat-left-text fs-1 mb-2 d-block"></i>
                Chưa có bài viết nào hiển thị. Hãy kết nối thêm bạn bè!
              </div>
            ) : (
              <div>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} onPostUpdated={() => loadFeed(0, true)} />
                ))}

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="text-center py-4">
                  {feedLoading && posts.length > 0 && (
                    <div className="d-flex align-items-center justify-content-center gap-2 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                      <span style={{ fontSize: '14px' }}>Đang tải thêm bài viết...</span>
                    </div>
                  )}
                  {!hasNext && posts.length > 0 && !feedLoading && (
                    <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
                      <i className="bi bi-check-circle me-1"></i>Bạn đã xem hết bài viết
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <RightSidebar />
        </main>
      </div>

      {/* Modal Tạo Bài Đăng */}
      <div className="modal fade" id="createPostModal" tabIndex={-1} aria-labelledby="createPostModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleSubmitPost}>
              <div className="modal-header border-0 pb-0 position-relative">
                <h5 className="modal-title fw-bolder w-100 text-center" id="createPostModalLabel">Tạo bài viết</h5>
                <button
                  type="button"
                  className="btn border-0 shadow-none position-absolute rounded-circle p-2"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  id="closeCreatePostModal"
                  style={{ right: '15px', top: '12px', backgroundColor: '#e4e6eb', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <i className="bi bi-x fs-4"></i>
                </button>
              </div>
              <hr className="w-100 mb-0 mt-3" style={{ borderTop: '1px solid #ced0d4' }} />
              <div className="modal-body pt-3 pb-2">
                <div className="d-flex mb-2">
                  <img
                    src={user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                    className="rounded-circle border border-light shadow-sm me-3"
                    width="46"
                    height="46"
                    style={{ objectFit: 'cover' }}
                    alt="avatar"
                  />
                  <div className="flex-grow-1">
                    <div className="fw-bold" style={{ fontSize: '15px', color: '#050505' }}>{user.fullname}</div>
                    <div className="badge bg-light text-dark shadow-none border mt-1 d-inline-flex align-items-center" style={{ fontSize: '12px', fontWeight: '600', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', color: '#65676b !important' }}>
                      <i className="bi bi-globe-americas me-1"></i>Công khai <i className="bi bi-caret-down-fill ms-1" style={{ fontSize: '10px' }}></i>
                    </div>
                  </div>
                </div>

                <textarea
                  id="post-content"
                  className="form-control border-0 px-0 shadow-none w-100 mt-2 text-dark"
                  rows={3}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder={`Bạn đang nghĩ gì, ${user.fullname}?`}
                  required
                  style={{ resize: 'none', backgroundColor: 'transparent' }}
                />

                <div className="d-flex flex-wrap gap-2 mt-2 mb-3" id="topic-tags">
                  <span className="badge rounded-pill topic-pill">Học tập</span>
                  <span className="badge rounded-pill topic-pill">Hỏi đáp</span>
                  <span className="badge rounded-pill topic-pill">Tin tức</span>
                  <span className="badge rounded-pill topic-pill">Chia sẻ</span>
                </div>

                {imagePreview && (
                  <div className="mt-2 position-relative rounded overflow-hidden border">
                    <img src={imagePreview} className="img-fluid w-100" style={{ maxHeight: '350px', objectFit: 'cover' }} alt="preview" />
                    <button
                      type="button"
                      className="btn btn-light rounded-circle position-absolute shadow flex-center"
                      style={{ top: '10px', right: '10px', width: '34px', height: '34px', border: '1px solid #ced0d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={handleRemoveImage}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                )}

                {/* AI Auxiliary Buttons */}
                <div className="d-flex align-items-center gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm rounded-pill fw-medium"
                    onClick={handleImproveText}
                    disabled={aiLoading || !postContent.trim()}
                    title="Yêu cầu AI cải thiện nội dung bạn vừa nhập"
                  >
                    <i className="bi bi-magic me-1"></i>Cải thiện văn bản
                  </button>
                  {postImage && (
                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm rounded-pill fw-medium"
                      onClick={handleSuggestCaption}
                      disabled={aiLoading}
                      title="AI sẽ gợi ý nội dung phù hợp với bức ảnh"
                    >
                      <i className="bi bi-stars me-1"></i>Gợi ý từ ảnh
                    </button>
                  )}
                </div>

                {aiLoading && (
                  <p className="text-muted mt-2 mb-0" style={{ fontSize: '13px' }}><i className="spinner-border spinner-border-sm me-1" role="status"></i>AI đang suy nghĩ...</p>
                )}

                {/* Toolbar */}
                <div className="add-to-post-box p-2 d-flex align-items-center justify-content-between mt-3 border">
                  <span className="fw-semibold px-2" style={{ fontSize: '15px', color: '#050505' }}>Thêm vào bài viết</span>
                  <div className="d-flex gap-1 me-1">
                    <label htmlFor="post-image" className="modal-tool-icon cursor-pointer mb-0" title="Ảnh/Video">
                      <i className="bi bi-image text-success fs-5"></i>
                    </label>
                    <input type="file" id="post-image" accept="image/*" className="d-none" onChange={handleImageChange} />
                    <div className="modal-tool-icon cursor-pointer text-primary" title="Tag bạn bè">
                      <i className="bi bi-person-plus-fill fs-5"></i>
                    </div>
                    <div className="modal-tool-icon cursor-pointer text-warning" title="Cảm xúc">
                      <i className="bi bi-emoji-smile fs-5"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 pb-3 px-3">
                <button type="submit" className="btn w-100 fw-bold post-btn text-white fs-6 py-2" disabled={submitLoading}>
                  {submitLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Đang đăng...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill me-2"></i>Đăng
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
