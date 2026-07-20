'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Post, Comment } from '@/lib/types';
import { fetchAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import MentorBadge from '@/components/common/MentorBadge';

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
  const [replyingTo, setReplyingTo] = useState<{ id: number, fullname: string } | null>(null);

  // --- Edit Comment state ---
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editCommentLoading, setEditCommentLoading] = useState(false);

  // --- Edit state ---
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editLoading, setEditLoading] = useState(false);
  // Auth context
  const { user } = useAuth();
  const viewerUsername = user?.username || '';

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (images: string[], startIndex: number) => {
    setLightboxImages(images);
    setLightboxIndex(startIndex);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxImages([]);
    setLightboxIndex(0);
    document.body.style.overflow = '';
  };

  const lightboxPrev = useCallback(() => {
    setLightboxIndex((i) => (i > 0 ? i - 1 : lightboxImages.length - 1));
  }, [lightboxImages.length]);

  const lightboxNext = useCallback(() => {
    setLightboxIndex((i) => (i < lightboxImages.length - 1 ? i + 1 : 0));
  }, [lightboxImages.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') lightboxPrev();
      if (e.key === 'ArrowRight') lightboxNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, lightboxPrev, lightboxNext]);

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

  const handleUpdatePost = async () => {
    if (!editContent.trim() || editLoading) return;
    setEditLoading(true);
    try {
      await fetchAPI(`/api/v2/posts/${post.id}`, {
        method: 'PUT',
        body: JSON.stringify({ content: editContent.trim() }),
      });
      setIsEditing(false);
      if (onPostUpdated) onPostUpdated();
    } catch (err: any) {
      showError(err?.message || 'Cập nhật bài viết thất bại');
    } finally {
      setEditLoading(false);
    }
  };

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
      const payload: any = { postId: post.id, content: commentText.trim() };
      if (replyingTo) {
        payload.parentId = replyingTo.id;
      }
      const newComment: Comment = await fetchAPI('/api/comments', {
        method: 'POST',
        body: JSON.stringify(payload),
        noRedirectOn401: true,
      });

      if (replyingTo) {
        setComments((prev) => prev.map(c => {
          if (c.id === replyingTo.id) {
            return { ...c, replies: [...(c.replies || []), newComment] };
          }
          return c;
        }));
      } else {
        setComments((prev) => [newComment, ...prev]);
      }
      
      setCommentsCount((c) => c + 1);
      setCommentText('');
      setReplyingTo(null);
    } catch (err: any) {
      showError(err?.message || 'Vui lòng đăng nhập để bình luận.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleEditComment = async (e: React.FormEvent, commentId: number) => {
    e.preventDefault();
    if (!editCommentText.trim() || editCommentLoading) return;
    setEditCommentLoading(true);
    try {
      const updatedComment: Comment = await fetchAPI(`/api/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ content: editCommentText.trim() }),
        noRedirectOn401: true,
      });
      setComments((prev) => prev.map(c => {
        if (c.id === commentId) return { ...c, ...updatedComment };
        if (c.replies && c.replies.some(r => r.id === commentId)) {
          return { ...c, replies: c.replies.map(r => r.id === commentId ? { ...r, ...updatedComment } : r) };
        }
        return c;
      }));
      setEditingCommentId(null);
      setEditCommentText('');
    } catch (err: any) {
      showError(err?.message || 'Chỉnh sửa bình luận thất bại.');
    } finally {
      setEditCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    try {
      await fetchAPI(`/api/comments/${commentId}`, {
        method: 'DELETE',
        noRedirectOn401: true,
      });
      setComments((prev) => {
        const newComments = prev.filter(c => c.id !== commentId);
        return newComments.map(c => {
          if (c.replies && c.replies.some(r => r.id === commentId)) {
            return { ...c, replies: c.replies.filter(r => r.id !== commentId) };
          }
          return c;
        });
      });
      setCommentsCount((c) => Math.max(0, c - 1));
    } catch (err: any) {
      showError(err?.message || 'Xóa bình luận thất bại.');
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

      <div className="poly-card bg-white">
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
              <div className="fw-bold text-dark" style={{ fontSize: '14.5px', lineHeight: '1.3', display: 'flex', alignItems: 'center' }}>
                <span style={{ display: 'inline-block', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {post.user?.fullname}
                </span>
                {post.user?.role?.id === 'MENTOR' && <MentorBadge size={15} />}
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
                        onClick={() => { setIsEditing(true); setEditContent(post.content); }}
                        style={{ fontSize: '14px', transition: 'background 0.15s' }}
                      >
                        <i className="bi bi-pencil" style={{ fontSize: '16px' }} />
                        Chỉnh sửa bài viết
                      </button>
                    </li>
                    <li><hr className="dropdown-divider my-1" /></li>
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
        {post.moderationStatus === 'PENDING_REVIEW' && (
          <div className="mx-3 mb-2 px-3 py-2 bg-warning bg-opacity-10 text-warning rounded-2 d-flex align-items-center gap-2" style={{ fontSize: '13px', border: '1px solid rgba(255,193,7,0.3)' }}>
            <i className="bi bi-hourglass-split text-warning"></i>
            <span className="fw-medium">Bài viết của bạn đang chờ quản trị viên kiểm duyệt. Hiện tại nó bị ẩn với người khác.</span>
          </div>
        )}
        <div className="px-3 pb-2">
          {isEditing ? (
            <div className="mb-2 mt-2">
              <textarea
                className="form-control mb-2"
                rows={3}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                style={{ fontSize: '14.5px', resize: 'none' }}
                disabled={editLoading}
              />
              <div className="d-flex justify-content-end gap-2">
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => { setIsEditing(false); setEditContent(post.content); }}
                  disabled={editLoading}
                >
                  Hủy
                </button>
                <button
                  className="btn btn-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #F27125, #FFC371)', border: 'none' }}
                  onClick={handleUpdatePost}
                  disabled={editLoading || !editContent.trim() || editContent === post.content}
                >
                  {editLoading ? <span className="spinner-border spinner-border-sm"></span> : 'Lưu'}
                </button>
              </div>
            </div>
          ) : (
            <div
              className="text-dark mb-2 mt-1"
              style={{ fontSize: '14.5px', whiteSpace: 'pre-wrap', lineHeight: '1.65', wordBreak: 'break-word' }}
            >
              {post.content}
            </div>
          )}
        </div>

        {/* ─── Post Images Gallery (Facebook-style: max 2 visible) ─── */}
        {(() => {
          const urls = (post.imageUrls && post.imageUrls.length > 0)
            ? post.imageUrls
            : (post.imageUrl ? [post.imageUrl] : []);
          if (urls.length === 0) return null;

          if (urls.length === 1) {
            return (
              <div
                className="image-letterbox-container small"
                style={{ height: '380px', borderTop: '1px solid rgba(0,0,0,0.04)', borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer' }}
                onClick={() => openLightbox(urls, 0)}
              >
                <div className="image-letterbox-bg" style={{ backgroundImage: `url(${urls[0]})` }}></div>
                <img src={urls[0]} className="image-letterbox-main" alt="post attachment" />
              </div>
            );
          }

          // 2+ images: show only 2 images, with +N overlay on the second if > 2
          const remaining = urls.length - 2;
          return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', borderTop: '1px solid rgba(0,0,0,0.04)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
              {urls.slice(0, 2).map((url, i) => (
                <div
                  key={i}
                  style={{ height: '280px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
                  onClick={() => openLightbox(urls, i)}
                >
                  <img
                    src={url}
                    alt={`post-img-${i}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                  {i === 1 && remaining > 0 && (
                    <div
                      style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '32px', fontWeight: '700',
                        letterSpacing: '1px',
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      +{remaining}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}

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
            {(() => {
              const shared = post.sharedPost!;
              const urls = (shared.imageUrls && shared.imageUrls.length > 0)
                ? shared.imageUrls
                : (shared.imageUrl ? [shared.imageUrl] : []);
              if (urls.length === 0) return null;

              if (urls.length === 1) {
                return (
                  <div className="image-letterbox-container small" style={{ height: '220px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="image-letterbox-bg" style={{ backgroundImage: `url(${urls[0]})` }}></div>
                    <img src={urls[0]} className="image-letterbox-main" alt="shared post" />
                  </div>
                );
              }

              return (
                <div style={{ display: 'grid', gridTemplateColumns: urls.length >= 3 ? '1fr 1fr 1fr' : '1fr 1fr', gap: '2px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  {urls.slice(0, 3).map((url, i) => (
                    <div key={i} style={{ height: '140px', overflow: 'hidden', position: 'relative' }}>
                      <img src={url} alt={`shared-img-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {i === 2 && urls.length > 3 && (
                        <div style={{
                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                          background: 'rgba(0,0,0,0.45)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '20px', fontWeight: '700',
                        }}>
                          +{urls.length - 3}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
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
            {replyingTo && (
              <div className="d-flex align-items-center justify-content-between bg-light rounded-3 px-3 py-2 mb-2" style={{ fontSize: '13px' }}>
                <div>
                  <span className="text-muted me-1">Đang trả lời</span>
                  <span className="fw-bold text-dark">{replyingTo.fullname}</span>
                </div>
                <button 
                  type="button" 
                  className="btn-close" 
                  style={{ fontSize: '10px' }} 
                  onClick={() => setReplyingTo(null)}
                ></button>
              </div>
            )}
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
                  <div key={c.id} className="d-flex flex-column gap-2" style={{ animation: 'polyFadeIn 0.2s ease-out' }}>
                    <div className="d-flex gap-2">
                      <img
                        src={c.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                        className="rounded-circle flex-shrink-0"
                        width="34" height="34"
                        style={{ objectFit: 'cover', border: '1.5px solid #f0f0f0' }}
                        alt="avatar"
                      />
                      <div className="w-100">
                        <div
                          className="rounded-3 px-3 py-2 d-inline-block position-relative"
                          style={{ background: '#f0f2f5', fontSize: '13.5px', maxWidth: '100%', borderRadius: '18px' }}
                        >
                          <div className="fw-bold text-dark" style={{ fontSize: '13px' }}>{c.fullname}</div>
                          {editingCommentId === c.id ? (
                            <form onSubmit={(e) => handleEditComment(e, c.id)} className="mt-1">
                              <input
                                type="text"
                                className="form-control rounded-pill border-0"
                                style={{ fontSize: '13.5px', padding: '6px 12px', minWidth: '200px' }}
                                value={editCommentText}
                                onChange={(e) => setEditCommentText(e.target.value)}
                                disabled={editCommentLoading}
                                autoFocus
                              />
                              <div className="d-flex justify-content-end gap-2 mt-1">
                                <span
                                  style={{ fontSize: '11px', cursor: 'pointer', color: '#65676B' }}
                                  onClick={() => { setEditingCommentId(null); setEditCommentText(''); }}
                                >
                                  Hủy
                                </span>
                                <span
                                  style={{ fontSize: '11px', cursor: 'pointer', color: '#F27125', fontWeight: 'bold' }}
                                  onClick={(e) => handleEditComment(e as any, c.id)}
                                >
                                  Lưu
                                </span>
                              </div>
                            </form>
                          ) : (
                            <div className="text-dark" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.45' }}>{c.content}</div>
                          )}

                          {/* 3-dot menu for comment owner */}
                          {c.username === viewerUsername && editingCommentId !== c.id && (
                            <div className="dropdown" style={{ position: 'absolute', top: '8px', right: '-24px' }}>
                              <button
                                className="btn btn-sm border-0 rounded-circle d-flex align-items-center justify-content-center p-0 text-muted"
                                data-bs-toggle="dropdown"
                                style={{ width: '24px', height: '24px' }}
                              >
                                <i className="bi bi-three-dots"></i>
                              </button>
                              <ul className="dropdown-menu shadow-sm" style={{ minWidth: '120px', padding: '4px', fontSize: '13px' }}>
                                <li>
                                  <button
                                    className="dropdown-item d-flex align-items-center gap-2 rounded-1 py-1 px-2"
                                    onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.content); }}
                                  >
                                    <i className="bi bi-pencil" style={{ fontSize: '14px' }}></i> Chỉnh sửa
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="dropdown-item d-flex align-items-center gap-2 rounded-1 py-1 px-2 text-danger"
                                    onClick={() => handleDeleteComment(c.id)}
                                  >
                                    <i className="bi bi-trash3" style={{ fontSize: '14px' }}></i> Xóa
                                  </button>
                                </li>
                              </ul>
                            </div>
                          )}
                        </div>
                        {editingCommentId !== c.id && (
                          <div className="d-flex align-items-center gap-3 mt-1 ms-3" style={{ fontSize: '11px', color: '#65676B' }}>
                            <span>{formatDate(c.createdAt)}{c.updatedAt && c.updatedAt !== c.createdAt && ' (đã chỉnh sửa)'}</span>
                            <span 
                              style={{ cursor: 'pointer', fontWeight: '600', transition: 'color 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#F27125'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#65676B'}
                              onClick={() => { setReplyingTo({ id: c.id, fullname: c.fullname }); commentInputRef.current?.focus(); }}
                            >
                              Trả lời
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nested Replies */}
                    {c.replies && c.replies.length > 0 && (
                      <div className="d-flex flex-column gap-2 mt-1" style={{ marginLeft: '42px' }}>
                        {c.replies.map((reply) => (
                          <div key={reply.id} className="d-flex gap-2">
                            <img
                              src={reply.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                              className="rounded-circle flex-shrink-0"
                              width="28" height="28"
                              style={{ objectFit: 'cover', border: '1.5px solid #f0f0f0' }}
                              alt="avatar"
                            />
                            <div className="w-100">
                              <div
                                className="rounded-3 px-3 py-2 d-inline-block position-relative"
                                style={{ background: '#f0f2f5', fontSize: '13.5px', maxWidth: '100%', borderRadius: '18px' }}
                              >
                                <div className="fw-bold text-dark" style={{ fontSize: '13px' }}>{reply.fullname}</div>
                                {editingCommentId === reply.id ? (
                                  <form onSubmit={(e) => handleEditComment(e, reply.id)} className="mt-1">
                                    <input
                                      type="text"
                                      className="form-control rounded-pill border-0"
                                      style={{ fontSize: '13.5px', padding: '6px 12px', minWidth: '200px' }}
                                      value={editCommentText}
                                      onChange={(e) => setEditCommentText(e.target.value)}
                                      disabled={editCommentLoading}
                                      autoFocus
                                    />
                                    <div className="d-flex justify-content-end gap-2 mt-1">
                                      <span
                                        style={{ fontSize: '11px', cursor: 'pointer', color: '#65676B' }}
                                        onClick={() => { setEditingCommentId(null); setEditCommentText(''); }}
                                      >
                                        Hủy
                                      </span>
                                      <span
                                        style={{ fontSize: '11px', cursor: 'pointer', color: '#F27125', fontWeight: 'bold' }}
                                        onClick={(e) => handleEditComment(e as any, reply.id)}
                                      >
                                        Lưu
                                      </span>
                                    </div>
                                  </form>
                                ) : (
                                  <div className="text-dark" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.45' }}>
                                    {reply.content}
                                  </div>
                                )}

                                {/* 3-dot menu for reply owner */}
                                {reply.username === viewerUsername && editingCommentId !== reply.id && (
                                  <div className="dropdown" style={{ position: 'absolute', top: '8px', right: '-24px' }}>
                                    <button
                                      className="btn btn-sm border-0 rounded-circle d-flex align-items-center justify-content-center p-0 text-muted"
                                      data-bs-toggle="dropdown"
                                      style={{ width: '24px', height: '24px' }}
                                    >
                                      <i className="bi bi-three-dots"></i>
                                    </button>
                                    <ul className="dropdown-menu shadow-sm" style={{ minWidth: '120px', padding: '4px', fontSize: '13px' }}>
                                      <li>
                                        <button
                                          className="dropdown-item d-flex align-items-center gap-2 rounded-1 py-1 px-2"
                                          onClick={() => { setEditingCommentId(reply.id); setEditCommentText(reply.content); }}
                                        >
                                          <i className="bi bi-pencil" style={{ fontSize: '14px' }}></i> Chỉnh sửa
                                        </button>
                                      </li>
                                      <li>
                                        <button
                                          className="dropdown-item d-flex align-items-center gap-2 rounded-1 py-1 px-2 text-danger"
                                          onClick={() => handleDeleteComment(reply.id)}
                                        >
                                          <i className="bi bi-trash3" style={{ fontSize: '14px' }}></i> Xóa
                                        </button>
                                      </li>
                                    </ul>
                                  </div>
                                )}
                              </div>
                              {editingCommentId !== reply.id && (
                                <div className="d-flex align-items-center gap-3 mt-1 ms-3" style={{ fontSize: '11px', color: '#65676B' }}>
                                  <span>{formatDate(reply.createdAt)}{reply.updatedAt && reply.updatedAt !== reply.createdAt && ' (đã chỉnh sửa)'}</span>
                                  <span 
                                    style={{ cursor: 'pointer', fontWeight: '600', transition: 'color 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#F27125'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#65676B'}
                                    onClick={() => { 
                                      setReplyingTo({ id: c.id, fullname: reply.fullname }); 
                                      commentInputRef.current?.focus(); 
                                      if (!commentText) setCommentText(`@${reply.username} `);
                                    }}
                                  >
                                    Trả lời
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Image Lightbox Modal ─── */}
      {lightboxOpen && lightboxImages.length > 0 && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            zIndex: 1060,
            background: 'rgba(0,0,0,0.92)',
            animation: 'polyFadeIn 0.2s ease-out',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            style={{
              position: 'absolute', top: '16px', right: '16px', zIndex: 10,
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: '#fff', fontSize: '20px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          >
            <i className="bi bi-x-lg"></i>
          </button>

          {/* Counter */}
          <div
            style={{
              position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
              color: '#fff', fontSize: '14px', fontWeight: '600',
              background: 'rgba(0,0,0,0.5)', padding: '4px 14px', borderRadius: '20px',
            }}
          >
            {lightboxIndex + 1} / {lightboxImages.length}
          </div>

          {/* Previous button */}
          {lightboxImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
              style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: 'none',
                color: '#fff', fontSize: '20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s, transform 0.2s',
                zIndex: 10,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
          )}

          {/* Image */}
          <img
            key={lightboxIndex}
            src={lightboxImages[lightboxIndex]}
            alt={`lightbox-${lightboxIndex}`}
            style={{
              maxWidth: '90vw', maxHeight: '85vh',
              objectFit: 'contain', borderRadius: '4px',
              animation: 'polyFadeIn 0.15s ease-out',
              userSelect: 'none',
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next button */}
          {lightboxImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: 'none',
                color: '#fff', fontSize: '20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s, transform 0.2s',
                zIndex: 10,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          )}

          {/* Thumbnail strip */}
          {lightboxImages.length > 1 && (
            <div
              style={{
                position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: '8px', padding: '8px 12px',
                background: 'rgba(0,0,0,0.5)', borderRadius: '12px',
                maxWidth: '90vw', overflowX: 'auto',
              }}
            >
              {lightboxImages.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`thumb-${i}`}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                  style={{
                    width: '48px', height: '48px', objectFit: 'cover',
                    borderRadius: '6px', cursor: 'pointer',
                    border: i === lightboxIndex ? '2px solid #F27125' : '2px solid transparent',
                    opacity: i === lightboxIndex ? 1 : 0.6,
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

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
