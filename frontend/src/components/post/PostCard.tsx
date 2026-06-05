'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Post, Comment } from '@/lib/types';
import { fetchAPI } from '@/lib/api';

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
  return (
    <>
      {/* Error Toast */}
      {errorMsg && (
        <div
          style={{
            position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            background: '#1c1c1e', color: '#fff', borderRadius: '12px',
            padding: '12px 20px', fontSize: '14px', fontWeight: '500',
            zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', gap: '8px',
            animation: 'polyFadeIn 0.2s ease-out',
          }}
        >
          <i className="bi bi-exclamation-circle-fill" style={{ color: '#F27125' }}></i>
          {errorMsg}
        </div>
      )}
      <div className="poly-card p-3 bg-white">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center">
            <img
              src={post.user?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
              className="rounded-circle border me-2"
              width="42" height="42"
              style={{ objectFit: 'cover' }}
              alt="avatar"
            />
            <div>
              <div className="fw-bold text-dark" style={{ fontSize: '14.5px' }}>{post.user?.fullname}</div>
              <div className="text-muted" style={{ fontSize: '12px' }}>
                @{post.user?.username} &bull; {formatDate(post.createdAt)}
              </div>
            </div>
          </div>

          <button
            className={`btn btn-sm ${isSaved ? 'text-warning' : 'text-muted'} border-0 rounded-circle`}
            style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            onClick={handleToggleSave}
            disabled={saveLoading}
            title={isSaved ? 'Hủy lưu' : 'Lưu bài viết'}
          >
            <i className={`bi ${isSaved ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i>
          </button>
        </div>

        {/* Content */}
        <div className="post-text-content mb-3 text-dark" style={{ fontSize: '14.5px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
          {post.content}
        </div>

        {/* Post Image */}
        {post.imageUrl && (
          <div className="image-letterbox-container small rounded-3 mb-3" style={{ height: '350px' }}>
            <div className="image-letterbox-bg" style={{ backgroundImage: `url(${post.imageUrl})` }}></div>
            <img src={post.imageUrl} className="image-letterbox-main" alt="post attachment" />
          </div>
        )}

        {/* Nested Shared Post */}
        {post.sharedPost && (
          <div className="border rounded-3 p-3 bg-light mb-3">
            <div className="d-flex align-items-center mb-2">
              <img
                src={post.sharedPost.user?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                className="rounded-circle border me-2"
                width="32" height="32"
                style={{ objectFit: 'cover' }}
                alt="avatar"
              />
              <div>
                <div className="fw-bold text-dark" style={{ fontSize: '13.5px' }}>{post.sharedPost.user?.fullname}</div>
                <div className="text-muted" style={{ fontSize: '11px' }}>
                  @{post.sharedPost.user?.username} &bull; {formatDate(post.sharedPost.createdAt)}
                </div>
              </div>
            </div>
            <div className="post-text-content text-dark" style={{ fontSize: '13.5px', whiteSpace: 'pre-wrap' }}>
              {post.sharedPost.content}
            </div>
            {post.sharedPost.imageUrl && (
              <div className="image-letterbox-container small rounded-3 mt-2" style={{ height: '220px' }}>
                <div className="image-letterbox-bg" style={{ backgroundImage: `url(${post.sharedPost.imageUrl})` }}></div>
                <img src={post.sharedPost.imageUrl} className="image-letterbox-main" alt="shared post" />
              </div>
            )}
          </div>
        )}

        {/* Stats bar (likes / comments count) */}
        {(likesCount > 0 || commentsCount > 0 || sharesCount > 0) && (
          <div className="d-flex justify-content-between align-items-center px-1 mb-1" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {likesCount > 0 && (
              <span>
                <span style={{ fontSize: '15px' }}>👍</span> {likesCount.toLocaleString()}
              </span>
            )}
            <div className="ms-auto d-flex gap-2">
              {commentsCount > 0 && <span>{commentsCount.toLocaleString()} bình luận</span>}
              {sharesCount > 0 && <span>{sharesCount.toLocaleString()} lượt chia sẻ</span>}
            </div>
          </div>
        )}

        {/* Action Toolbar */}
        <hr style={{ margin: '8px 0', borderColor: 'var(--border-color)' }} />
        <div className="d-flex justify-content-between">
          {/* Like Button */}
          <button
            className="btn-ghost flex-grow-1 py-1"
            onClick={handleToggleLike}
            disabled={likeLoading}
            style={{ color: isLiked ? 'var(--poly-primary)' : undefined, fontWeight: isLiked ? '700' : '600', transition: 'color 0.2s' }}
          >
            <i
              className={`bi ${isLiked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'} me-2 fs-5`}
              style={{
                transform: likeAnim ? 'scale(1.35)' : 'scale(1)',
                transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                color: isLiked ? 'var(--poly-primary)' : undefined,
                display: 'inline-block',
              }}
            ></i>
            Thích
          </button>

          {/* Comment Button */}
          <button
            className="btn-ghost flex-grow-1 py-1"
            onClick={handleToggleComments}
            style={{ color: showComments ? 'var(--poly-primary)' : undefined }}
          >
            <i className={`bi ${showComments ? 'bi-chat-square-fill' : 'bi-chat-square'} me-2 fs-5`} style={{ color: showComments ? 'var(--poly-primary)' : undefined }}></i>
            Bình luận {commentsCount > 0 ? `(${commentsCount})` : ''}
          </button>

          {/* Share Button */}
          <button
            className="btn-ghost flex-grow-1 py-1"
            onClick={() => setShowShareModal(true)}
          >
            <i className="bi bi-reply-all me-2 fs-5" style={{ transform: 'scaleX(-1)', display: 'inline-block' }}></i>
            Chia sẻ {sharesCount > 0 ? `(${sharesCount})` : ''}
          </button>
        </div>

        {/* ─── Comment Section ─── */}
        {showComments && (
          <div className="mt-3">
            {/* Comment Input */}
            <form onSubmit={handleAddComment} className="d-flex gap-2 mb-3">
              <input
                ref={commentInputRef}
                type="text"
                className="form-control rounded-pill border-0 bg-light"
                placeholder="Viết bình luận..."
                style={{ fontSize: '14px' }}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={commentSubmitting}
              />
              <button
                type="submit"
                className="btn rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: '38px', height: '38px',
                  background: commentText.trim() ? 'linear-gradient(135deg, var(--poly-primary, #F27125), #FFC371)' : '#e4e6eb',
                  border: 'none', transition: 'all 0.2s',
                }}
                disabled={!commentText.trim() || commentSubmitting}
              >
                {commentSubmitting
                  ? <span className="spinner-border spinner-border-sm text-white"></span>
                  : <i className="bi bi-send-fill text-white" style={{ fontSize: '15px' }}></i>
                }
              </button>
            </form>

            {/* Comments List */}
            {commentsLoading ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm" style={{ color: 'var(--poly-primary)' }}></div>
              </div>
            ) : comments.length === 0 ? (
              <p className="text-muted text-center" style={{ fontSize: '13px' }}>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {comments.map((c) => (
                  <div key={c.id} className="d-flex gap-2">
                    <img
                      src={c.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                      className="rounded-circle flex-shrink-0"
                      width="34" height="34"
                      style={{ objectFit: 'cover' }}
                      alt="avatar"
                    />
                    <div
                      className="rounded-3 px-3 py-2"
                      style={{ background: '#f0f2f5', fontSize: '13.5px', maxWidth: '90%' }}
                    >
                      <div className="fw-bold text-dark" style={{ fontSize: '13px' }}>{c.fullname}</div>
                      <div className="text-dark" style={{ whiteSpace: 'pre-wrap' }}>{c.content}</div>
                      <div className="text-muted mt-1" style={{ fontSize: '11px' }}>{formatDate(c.createdAt)}</div>
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
    </>
  );
}
