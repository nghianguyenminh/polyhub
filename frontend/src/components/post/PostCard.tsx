'use client';

import React, { useState } from 'react';
import { Post } from '@/lib/types';
import { fetchAPI } from '@/lib/api';

interface PostCardProps {
  post: Post;
  onPostUpdated?: () => void;
}

export default function PostCard({ post, onPostUpdated }: PostCardProps) {
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [loading, setLoading] = useState(false);

  const handleToggleSave = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI(`/api/saved/posts/toggle?postId=${post.id}`, {
        method: 'POST',
      });
      setIsSaved(res.saved);
      if (onPostUpdated) onPostUpdated();
    } catch (err) {
      console.error('Failed to toggle save post', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="poly-card p-3 bg-white">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
          <img 
            src={post.user?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
            className="rounded-circle border me-2" 
            width="40" 
            height="40" 
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
          className={`btn btn-sm ${isSaved ? 'btn-warning' : 'btn-light'} border rounded-circle`} 
          style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={handleToggleSave}
          disabled={loading}
          title={isSaved ? "Hủy lưu" : "Lưu bài viết"}
        >
          <i className={`bi ${isSaved ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i>
        </button>
      </div>

      {/* Content */}
      <div className="post-text-content mb-3 text-dark" style={{ fontSize: '14.5px', whiteSpace: 'pre-wrap' }}>
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
              width="32" 
              height="32" 
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
          <div className="post-text-content mb-2 text-dark" style={{ fontSize: '13.5px', whiteSpace: 'pre-wrap' }}>
            {post.sharedPost.content}
          </div>
          {post.sharedPost.imageUrl && (
            <div className="image-letterbox-container small rounded-3" style={{ height: '220px' }}>
              <div className="image-letterbox-bg" style={{ backgroundImage: `url(${post.sharedPost.imageUrl})` }}></div>
              <img src={post.sharedPost.imageUrl} className="image-letterbox-main" alt="shared post attachment" />
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <hr style={{ margin: '8px 0', borderColor: 'var(--border-color)' }} />
      <div className="d-flex justify-content-between">
        <button className="btn-ghost flex-grow-1 py-1">
          <i className="bi bi-hand-thumbs-up me-2 fs-5"></i> Thích
        </button>
        <button className="btn-ghost flex-grow-1 py-1">
          <i className="bi bi-chat-square me-2 fs-5"></i> Bình luận ({post.commentsCount})
        </button>
        <button className="btn-ghost flex-grow-1 py-1">
          <i className="bi bi-reply-all me-2 fs-5" style={{ transform: 'scaleX(-1)' }}></i> Chia sẻ ({post.sharesCount})
        </button>
      </div>
    </div>
  );
}
