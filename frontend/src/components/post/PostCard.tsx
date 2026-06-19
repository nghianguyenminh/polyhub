'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Post, Comment } from '@/lib/types';
import { fetchAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface PostCardProps {
  post: Post;
  onPostUpdated?: () => void;
}

export default function PostCard({ post, onPostUpdated }: PostCardProps) {
  // --- Save state ---
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [saveLoading, setSaveLoading] = useState(false);

  // --- Like state ---
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  // --- Comment state ---
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  // Auth context
  const { user } = useAuth();
  const viewerUsername = user?.username || '';

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  // Handlers
  const handleDeletePost = async () => {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    try {
      await fetchAPI(`/api/v2/posts/${post.id}`, { method: 'DELETE' });
      if (onPostUpdated) onPostUpdated();
    } catch (err: any) {
      showError(err?.message || 'Xóa bài viết thất bại');
    }
  };

  const handleTogglePrivacy = async () => {
    try {
      const res = await fetchAPI(`/api/v2/posts/${post.id}/privacy`, { method: 'PATCH' });
      if (onPostUpdated) onPostUpdated();
    } catch (err: any) {
      showError(err?.message || 'Thay đổi quyền thất bại');
    }
  };

  const submitReport = async (reason: string) => {
    try {
      await fetchAPI(`/api/v2/posts/${post.id}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
        noRedirectOn401: true,
      });
      setShowReportModal(false);
      alert('Cảm ơn bạn đã báo cáo. Quản trị viên sẽ xem xét.');
    } catch (err: any) {
      showError(err?.message || 'Báo cáo thất bại');
    }
  };

  // --- Share state ---
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCaption, setShareCaption] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [sharesCount, setSharesCount] = useState(post.sharesCount || 0);

  // --- Error toast ---
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3500);
  };

  // ─── Helpers ───────────────────────────────────────────────────────
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Vừa xong';
      if (diffMin < 60) return `${diffMin} phút trước`;
      const diffH = Math.floor(diffMin / 60);
      if (diffH < 24) return `${diffH} giờ trước`;
      const diffD = Math.floor(diffH / 24);
      if (diffD < 7) return `${diffD} ngày trước`;
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // ─── Handlers ──────────────────────────────────────────────────────

  const handleToggleSave = async () => {
    setSaveLoading(true);
    try {
      const res = await fetchAPI(`/api/saved/posts/toggle?postId=${post.id}`, { method: 'POST' });
      setIsSaved(res.saved);
      if (onPostUpdated) onPostUpdated();
    } catch (err) {
      console.error('Failed to toggle save', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (likeLoading) return;
    // Optimistic update
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount((c) => newIsLiked ? c + 1 : Math.max(0, c - 1));
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 600);
    setLikeLoading(true);
    try {
      const res = await fetchAPI(`/api/v2/posts/${post.id}/like`, {
        method: 'POST',
        noRedirectOn401: true,
      });
      setIsLiked(res.isLiked);
      setLikesCount(res.likesCount);
    } catch (err: any) {
      // Revert on error
      setIsLiked(!newIsLiked);
      setLikesCount((c) => !newIsLiked ? c + 1 : Math.max(0, c - 1));
      showError(err?.message || 'Vui lòng đăng nhập để thích bài viết.');
    } finally {
      setLikeLoading(false);
    }
  };

  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const data: Comment[] = await fetchAPI(`/api/comments/${post.id}`);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleToggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      loadComments();
    }
    if (next) {
      setTimeout(() => commentInputRef.current?.focus(), 150);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      const newComment: Comment = await fetchAPI('/api/comments', {
        method: 'POST',
        body: JSON.stringify({ postId: post.id, content: commentText.trim() }),
        noRedirectOn401: true,
      });
      setComments((prev) => [newComment, ...prev]);
      setCommentsCount((c) => c + 1);
      setCommentText('');
    } catch (err: any) {
      showError(err?.message || 'Vui lòng đăng nhập để bình luận.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (shareLoading) return;
    setShareLoading(true);
    try {
      await fetchAPI(`/api/v2/posts/${post.id}/share`, {
        method: 'POST',
        body: JSON.stringify({ content: shareCaption }),
        noRedirectOn401: true,
      });
      setShareSuccess(true);
      setSharesCount((c) => c + 1);
      setShareCaption('');
      setTimeout(() => {
        setShowShareModal(false);
        setShareSuccess(false);
        if (onPostUpdated) onPostUpdated();
      }, 1500);
    } catch (err: any) {
      showError(err?.message || 'Vui lòng đăng nhập để chia sẻ bài viết.');
      setShowShareModal(false);
    } finally {
      setShareLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────
  const isOwner = post.user?.username === viewerUsername;

  return (
    <>
      {/* Error Toast */}
      {errorMsg && (
        <div
          style={{
            position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #1c1c1e, #2c2c2e)', color: '#fff', borderRadius: '14px',
            padding: '14px 22px', fontSize: '14px', fontWeight: '500',
            zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', gap: '10px',
            animation: 'polyFadeIn 0.25s ease-out',
            backdropFilter: 'blur(12px)',
          }}
        >
          <i className="bi bi-exclamation-circle-fill" style={{ color: '#F27125', fontSize: '16px' }}></i>
          {errorMsg}
        </div>
      )}

      <div className="poly-card bg-white" style={{ overflow: 'hidden' }}>
        {/* ─── Header ─── */}
        <div className="d-flex justify-content-between align-items-center px-3 pt-3 pb-2">
          <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={post.user?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                className="rounded-circle"
                width="44" height="44"
                style={{ objectFit: 'cover', border: '2px solid #f0f0f0' }}
                alt="avatar"
              />
              {post.isPrivate && (
                <span
                  style={{
                    position: 'absolute', bottom: '-2px', right: '-2px',
                    background: '#fff', borderRadius: '50%', padding: '1px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <i className="bi bi-lock-fill" style={{ fontSize: '10px', color: '#F27125' }}></i>
                </span>
              )}
            </div>
            <div>
              <div className="fw-bold text-dark" style={{ fontSize: '14.5px', lineHeight: '1.3' }}>
                {post.user?.fullname}
              </div>
              <div className="d-flex align-items-center gap-1" style={{ fontSize: '12px', color: '#65676B' }}>
                <span>@{post.user?.username}</span>
                <span>&bull;</span>
                <span>{formatDate(post.createdAt)}</span>
                {post.isPrivate && (
                  <>
                    <span>&bull;</span>
                    <i className="bi bi-lock-fill" style={{ fontSize: '10px' }}></i>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-1">
            {/* Save button */}
            <button
              className="btn btn-sm border-0 rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: '36px', height: '36px',
                transition: 'all 0.2s ease',
                color: isSaved ? '#F27125' : '#65676B',
                background: isSaved ? 'rgba(242,113,37,0.08)' : 'transparent',
              }}
              onClick={handleToggleSave}
              disabled={saveLoading}
              title={isSaved ? 'Hủy lưu' : 'Lưu bài viết'}
            >
              <i className={`bi ${isSaved ? 'bi-bookmark-fill' : 'bi-bookmark'}`} style={{ fontSize: '16px' }}></i>
            </button>

            {/* Three‑dot menu */}
            <div className="dropdown">
              <button
                className="btn btn-sm border-0 rounded-circle d-flex align-items-center justify-content-center"
                id={`postMenuBtn-${post.id}`}
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{
                  width: '36px', height: '36px',
                  color: '#65676B',
                  transition: 'all 0.2s ease',
                }}
              >
                <i className="bi bi-three-dots" style={{ fontSize: '18px' }} />
              </button>
              <ul
                className="dropdown-menu dropdown-menu-end shadow-lg border-0"
                aria-labelledby={`postMenuBtn-${post.id}`}
                style={{ borderRadius: '12px', padding: '6px', minWidth: '220px', animation: 'polyFadeIn 0.15s ease-out' }}
              >
                {isOwner && (
                  <>
                    <li>
                      <button
                        className="dropdown-item d-flex align-items-center gap-2 rounded-2 py-2 px-3"
                        onClick={handleTogglePrivacy}
                        style={{ fontSize: '14px', transition: 'background 0.15s' }}
                      >
                        <i className={`bi ${post.isPrivate ? 'bi-globe' : 'bi-lock'}`} style={{ fontSize: '16px', color: '#F27125' }} />
                        {post.isPrivate ? 'Chuyển sang Công khai' : 'Chuyển sang Chỉ mình tôi'}
                      </button>
                    </li>
                    <li><hr className="dropdown-divider my-1" /></li>
                    <li>
                      <button
                        className="dropdown-item d-flex align-items-center gap-2 rounded-2 py-2 px-3"
                        onClick={handleDeletePost}
                        style={{ fontSize: '14px', color: '#dc3545', transition: 'background 0.15s' }}
                      >
                        <i className="bi bi-trash3" style={{ fontSize: '16px' }} />
                        Xóa bài viết
                      </button>
                    </li>
                  </>
                )}
                {!isOwner && (
                  <li>
                    <button
                      className="dropdown-item d-flex align-items-center gap-2 rounded-2 py-2 px-3"
                      onClick={() => setShowReportModal(true)}
                      style={{ fontSize: '14px', transition: 'background 0.15s' }}
                    >
                      <i className="bi bi-flag" style={{ fontSize: '16px', color: '#F27125' }} />
                      Báo cáo bài viết
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="px-3 pb-2">
          <div
            className="text-dark mb-2"
            style={{ fontSize: '14.5px', whiteSpace: 'pre-wrap', lineHeight: '1.65', wordBreak: 'break-word' }}
          >
            {post.content}
          </div>
        </div>

        {/* ─── Post Image ─── */}
        {post.imageUrl && (
          <div className="image-letterbox-container small" style={{ height: '380px', borderTop: '1px solid rgba(0,0,0,0.04)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
            <div className="image-letterbox-bg" style={{ backgroundImage: `url(${post.imageUrl})` }}></div>
            <img src={post.imageUrl} className="image-letterbox-main" alt="post attachment" />
          </div>
        )}

        {/* ─── Nested Shared Post ─── */}
        {post.sharedPost && (
          <div className="mx-3 mb-3 mt-2" style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="p-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <img
                  src={post.sharedPost.user?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                  className="rounded-circle"
                  width="32" height="32"
                  style={{ objectFit: 'cover', border: '1.5px solid #f0f0f0' }}
                  alt="avatar"
                />
                <div>
                  <div className="fw-bold text-dark" style={{ fontSize: '13.5px' }}>{post.sharedPost.user?.fullname}</div>
                  <div style={{ fontSize: '11px', color: '#65676B' }}>
                    @{post.sharedPost.user?.username} &bull; {formatDate(post.sharedPost.createdAt)}
                  </div>
                </div>
              </div>
              <div className="text-dark" style={{ fontSize: '13.5px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                {post.sharedPost.content}
              </div>
            </div>
            {post.sharedPost.imageUrl && (
              <div className="image-letterbox-container small" style={{ height: '220px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="image-letterbox-bg" style={{ backgroundImage: `url(${post.sharedPost.imageUrl})` }}></div>
                <img src={post.sharedPost.imageUrl} className="image-letterbox-main" alt="shared post" />
              </div>
            )}
          </div>
        )}

        {/* ─── Stats bar ─── */}
        {(likesCount > 0 || commentsCount > 0 || sharesCount > 0) && (
          <div className="d-flex justify-content-between align-items-center px-3 py-2" style={{ fontSize: '13px', color: '#65676B' }}>
            {likesCount > 0 ? (
              <span className="d-flex align-items-center gap-1">
                <span style={{
                  background: 'linear-gradient(135deg, #F27125, #FFC371)',
                  borderRadius: '50%', width: '20px', height: '20px',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="bi bi-hand-thumbs-up-fill text-white" style={{ fontSize: '11px' }}></i>
                </span>
                {likesCount.toLocaleString()}
              </span>
            ) : <span />}
            <div className="d-flex gap-3">
              {commentsCount > 0 && <span style={{ cursor: 'pointer' }} onClick={handleToggleComments}>{commentsCount.toLocaleString()} bình luận</span>}
              {sharesCount > 0 && <span>{sharesCount.toLocaleString()} chia sẻ</span>}
            </div>
          </div>
        )}

        {/* ─── Action Toolbar ─── */}
        <div className="px-3">
          <hr style={{ margin: '0 0 4px 0', borderColor: 'rgba(0,0,0,0.06)' }} />
        </div>
        <div className="d-flex justify-content-between px-2 pb-1">
          {/* Like */}
          <button
            className="btn-ghost flex-grow-1 py-2"
            onClick={handleToggleLike}
            disabled={likeLoading}
            style={{
              color: isLiked ? '#F27125' : undefined,
              fontWeight: isLiked ? '700' : '600',
              transition: 'all 0.2s ease',
              borderRadius: '8px',
            }}
          >
            <i
              className={`bi ${isLiked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'} me-2`}
              style={{
                fontSize: '1.15rem',
                transform: likeAnim ? 'scale(1.4) rotate(-12deg)' : 'scale(1) rotate(0)',
                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                color: isLiked ? '#F27125' : undefined,
                display: 'inline-block',
              }}
            ></i>
            Thích
          </button>

          {/* Comment */}
          <button
            className="btn-ghost flex-grow-1 py-2"
            onClick={handleToggleComments}
            style={{
              color: showComments ? '#F27125' : undefined,
              fontWeight: showComments ? '700' : '600',
              borderRadius: '8px',
            }}
          >
            <i className={`bi ${showComments ? 'bi-chat-dots-fill' : 'bi-chat-dots'} me-2`} style={{ fontSize: '1.1rem', color: showComments ? '#F27125' : undefined }}></i>
            Bình luận
          </button>

          {/* Share */}
          <button
            className="btn-ghost flex-grow-1 py-2"
            onClick={() => setShowShareModal(true)}
            style={{ borderRadius: '8px' }}
          >
            <i className="bi bi-share me-2" style={{ fontSize: '1.05rem' }}></i>
            Chia sẻ
          </button>
        </div>

        {/* ─── Comment Section ─── */}
        {showComments && (
          <div className="px-3 pb-3 pt-1">
            <hr style={{ margin: '0 0 12px 0', borderColor: 'rgba(0,0,0,0.06)' }} />
            {/* Comment Input */}
            <form onSubmit={handleAddComment} className="d-flex gap-2 mb-3 align-items-center">
              <input
                ref={commentInputRef}
                type="text"
                className="form-control rounded-pill border-0"
                placeholder="Viết bình luận..."
                style={{ fontSize: '14px', background: '#f0f2f5', padding: '10px 16px' }}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={commentSubmitting}
              />
              <button
                type="submit"
                className="btn rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: '38px', height: '38px',
                  background: commentText.trim() ? 'linear-gradient(135deg, #F27125, #FFC371)' : '#e4e6eb',
                  border: 'none', transition: 'all 0.25s ease',
                  transform: commentText.trim() ? 'scale(1)' : 'scale(0.95)',
                }}
                disabled={!commentText.trim() || commentSubmitting}
              >
                {commentSubmitting
                  ? <span className="spinner-border spinner-border-sm text-white"></span>
                  : <i className="bi bi-send-fill text-white" style={{ fontSize: '14px' }}></i>
                }
              </button>
            </form>

            {/* Comments List */}
            {commentsLoading ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm" style={{ color: '#F27125' }}></div>
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center mb-0" style={{ fontSize: '13px', color: '#65676B' }}>
                Chưa có bình luận nào. Hãy là người đầu tiên! 💬
              </p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {comments.map((c) => (
                  <div key={c.id} className="d-flex gap-2" style={{ animation: 'polyFadeIn 0.2s ease-out' }}>
                    <img
                      src={c.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                      className="rounded-circle flex-shrink-0"
                      width="34" height="34"
                      style={{ objectFit: 'cover', border: '1.5px solid #f0f0f0' }}
                      alt="avatar"
                    />
                    <div
                      className="rounded-3 px-3 py-2"
                      style={{ background: '#f0f2f5', fontSize: '13.5px', maxWidth: '88%', borderRadius: '18px' }}
                    >
                      <div className="fw-bold text-dark" style={{ fontSize: '13px' }}>{c.fullname}</div>
                      <div className="text-dark" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.45' }}>{c.content}</div>
                      <div style={{ fontSize: '11px', color: '#65676B', marginTop: '4px' }}>{formatDate(c.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Share Modal ─── */}
      {showShareModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ zIndex: 1055, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowShareModal(false); setShareCaption(''); setShareSuccess(false); } }}
        >
          <div
            className="bg-white rounded-4 shadow-lg"
            style={{ width: '100%', maxWidth: '480px', margin: '0 16px', overflow: 'hidden', animation: 'polyFadeIn 0.2s ease-out' }}
          >
            {/* Modal Header */}
            <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
              <h6 className="fw-bold mb-0" style={{ fontSize: '16px' }}>Chia sẻ bài viết</h6>
              <button
                className="btn border-0 rounded-circle p-0 d-flex align-items-center justify-content-center"
                style={{ width: '32px', height: '32px', background: '#e4e6eb' }}
                onClick={() => { setShowShareModal(false); setShareCaption(''); setShareSuccess(false); }}
              >
                <i className="bi bi-x fs-5"></i>
              </button>
            </div>

            {shareSuccess ? (
              <div className="text-center py-5">
                <div style={{ fontSize: '48px' }}>🎉</div>
                <p className="fw-bold mt-2 mb-0" style={{ color: 'var(--poly-primary)' }}>Đã chia sẻ thành công!</p>
              </div>
            ) : (
              <div className="p-4">
                {/* Caption input */}
                <textarea
                  className="form-control border-0 bg-light rounded-3 mb-3"
                  rows={3}
                  placeholder="Thêm chú thích của bạn..."
                  style={{ resize: 'none', fontSize: '14px' }}
                  value={shareCaption}
                  onChange={(e) => setShareCaption(e.target.value)}
                />

                {/* Preview of original post */}
                <div className="border rounded-3 p-3 bg-light mb-4" style={{ fontSize: '13.5px' }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <img
                      src={post.user?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                      className="rounded-circle"
                      width="28" height="28"
                      style={{ objectFit: 'cover' }}
                      alt="avatar"
                    />
                    <span className="fw-bold">{post.user?.fullname}</span>
                  </div>
                  <div className="text-muted" style={{ whiteSpace: 'pre-wrap', maxHeight: '80px', overflow: 'hidden' }}>
                    {post.content}
                  </div>
                </div>

                <button
                  className="btn w-100 fw-bold text-white py-2 rounded-pill post-btn"
                  onClick={handleShare}
                  disabled={shareLoading}
                >
                  {shareLoading
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Đang chia sẻ...</>
                    : <><i className="bi bi-reply-all me-2" style={{ transform: 'scaleX(-1)', display: 'inline-block' }}></i>Chia sẻ ngay</>
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Report Modal ─── */}
      {showReportModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ zIndex: 1055, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowReportModal(false); setReportReason(''); setCustomReason(''); } }}
        >
          <div
            className="bg-white rounded-4 shadow-lg"
            style={{ width: '100%', maxWidth: '480px', margin: '0 16px', overflow: 'hidden', animation: 'polyFadeIn 0.2s ease-out' }}
          >
            {/* Modal Header */}
            <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
              <h6 className="fw-bold mb-0" style={{ fontSize: '16px' }}>Báo cáo bài viết</h6>
              <button
                className="btn border-0 rounded-circle p-0 d-flex align-items-center justify-content-center"
                style={{ width: '32px', height: '32px', background: '#e4e6eb' }}
                onClick={() => { setShowReportModal(false); setReportReason(''); setCustomReason(''); }}
              >
                <i className="bi bi-x fs-5"></i>
              </button>
            </div>

            <div className="p-4">
              <p className="text-muted mb-3" style={{ fontSize: '13.5px' }}>Chọn lý do bạn muốn báo cáo bài viết này:</p>

              {['Spam hoặc lừa đảo', 'Quấy rối hoặc bắt nạt', 'Ngôn từ thù hận', 'Bạo lực hoặc nội dung nguy hiểm', 'Nội dung không phù hợp'].map((reason) => (
                <label key={reason} className="d-flex align-items-center gap-2 mb-2 p-2 rounded-3" style={{ cursor: 'pointer', background: reportReason === reason ? '#fff3e8' : 'transparent', border: reportReason === reason ? '1px solid #F27125' : '1px solid transparent', transition: 'all 0.15s' }}>
                  <input type="radio" name="reportReason" value={reason} checked={reportReason === reason} onChange={() => setReportReason(reason)} style={{ accentColor: '#F27125' }} />
                  <span style={{ fontSize: '14px' }}>{reason}</span>
                </label>
              ))}

              <label className="d-flex align-items-center gap-2 mb-2 p-2 rounded-3" style={{ cursor: 'pointer', background: reportReason === 'other' ? '#fff3e8' : 'transparent', border: reportReason === 'other' ? '1px solid #F27125' : '1px solid transparent', transition: 'all 0.15s' }}>
                <input type="radio" name="reportReason" value="other" checked={reportReason === 'other'} onChange={() => setReportReason('other')} style={{ accentColor: '#F27125' }} />
                <span style={{ fontSize: '14px' }}>Khác</span>
              </label>

              {reportReason === 'other' && (
                <textarea
                  className="form-control border-0 bg-light rounded-3 mt-2 mb-2"
                  rows={3}
                  placeholder="Mô tả chi tiết lý do..."
                  style={{ resize: 'none', fontSize: '14px' }}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                />
              )}

              <button
                className="btn w-100 fw-bold text-white py-2 rounded-pill mt-3"
                style={{ background: 'linear-gradient(135deg, #F27125, #FFC371)', border: 'none' }}
                disabled={!reportReason || (reportReason === 'other' && !customReason.trim())}
                onClick={() => submitReport(reportReason === 'other' ? customReason : reportReason)}
              >
                <i className="bi bi-flag me-2"></i>Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
