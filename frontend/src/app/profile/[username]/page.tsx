'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI, API_BASE_URL } from '@/lib/api';
import { Post, User } from '@/lib/types';
import Header from '@/components/layout/Header';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import PostCard from '@/components/post/PostCard';
import PostSkeleton from '@/components/post/PostSkeleton';
import '@/styles/profile.css';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const username = params.username as string;

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  // Status states
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      // 1. Fetch user profile
      const data = await fetchAPI(`/api/users/${username}`);
      setProfileUser(data);
      setIsFollowing(data.isFollowing || false);
      setIsOwner(data.isOwner || false);

      // Profile loaded successfully
      setProfileLoading(false);

      // 2. Fetch user's posts
      setPostsLoading(true);
      const postsData = await fetchAPI(`/api/v2/posts/user/${username}?page=0&size=15`);
      setPosts(postsData.posts || []);
    } catch (err: any) {
      console.error('Failed to load profile', err);
      setErrorMsg(err.message || 'Lỗi tải trang cá nhân');
    } finally {
      setProfileLoading(false);
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'settings') {
        router.push('/settings');
      }
    }
  }, [username, router]);

  const handleFollowToggle = async () => {
    try {
      const res = await fetchAPI(`/api/connections/follow?targetUsername=${username}`, {
        method: 'POST',
      });
      setIsFollowing(res.isFollowing);
      if (profileUser) {
        setProfileUser({
          ...profileUser,
          followersCount: (profileUser.followersCount || 0) + (res.isFollowing ? 1 : -1),
        });
      }
    } catch (err: any) {
      console.error('Failed to toggle follow', err);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('cover', file);

      try {
        const res = await fetchAPI(`/api/users/${username}/cover`, {
          method: 'PUT',
          body: formData,
        });
        if (profileUser) {
          setProfileUser({ ...profileUser, coverImage: res.coverImage });
        }
        setSuccessMsg('Cập nhật ảnh bìa thành công!');
      } catch (err: any) {
        setErrorMsg(err.message || 'Lỗi tải ảnh bìa');
      }
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('avatar', file);

      try {
        const res = await fetchAPI(`/api/users/${username}/avatar`, {
          method: 'PUT',
          body: formData,
        });
        if (profileUser) {
          setProfileUser({ ...profileUser, avatar: res.avatar });
        }
        setSuccessMsg('Cập nhật ảnh đại diện thành công!');
      } catch (err: any) {
        setErrorMsg(err.message || 'Lỗi tải ảnh đại diện');
      }
    }
  };

  // No settings handlers needed on profile page

  if (authLoading || profileLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="spinner-border text-poly" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="text-center p-5 bg-light min-vh-100">
        <h3>Không tìm thấy trang cá nhân</h3>
        <p className="text-muted">Người dùng không tồn tại hoặc đã bị khóa tài khoản.</p>
        <button className="btn btn-poly-gradient text-white border-0" onClick={() => router.push('/')}>Quay lại trang chủ</button>
      </div>
    );
  }

  return (
    <>
      <Header />

      <div className="app-container">
        <main className="w-100 d-flex justify-content-between">
          <LeftSidebar activeMenu="profile" />

          {/* Profile Content */}
          <div className="profile-container w-100 mx-auto" style={{ maxWidth: '900px' }}>

            {/* Alerts */}
            {successMsg && <div className="alert alert-success alert-dismissible fade show">{successMsg}</div>}
            {errorMsg && <div className="alert alert-danger alert-dismissible fade show">{errorMsg}</div>}

            {/* PROFILE HEADER CARD */}
            <div className="poly-card profile-header-card mb-3 overflow-hidden bg-white">
              {/* Cover Image */}
              <div className="profile-cover position-relative">
                <img
                  src={profileUser.coverImage || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809'}
                  alt="Cover"
                  className="w-100 object-fit-cover"
                  style={{ height: '250px' }}
                />

                {isOwner && (
                  <div className="position-absolute bottom-0 end-0 m-3">
                    <label className="btn btn-light shadow-sm btn-edit-cover rounded-pill fw-medium px-3 py-1 mb-0 cursor-pointer text-dark">
                      <i className="bi bi-camera me-1"></i> Sửa ảnh bìa
                      <input type="file" className="d-none" accept="image/*" onChange={handleCoverUpload} />
                    </label>
                  </div>
                )}
              </div>

              {/* Profile Info details */}
              <div className="profile-info px-4 pb-4 position-relative">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center align-items-md-end text-center text-md-start">

                  <div className="avatar-wrapper position-relative z-2 flex-shrink-0" style={{ width: '130px', height: '130px', marginTop: '-65px', marginBottom: '10px' }}>
                    <img
                      src={profileUser.avatar && profileUser.avatar !== 'default.png' ? profileUser.avatar : `https://ui-avatars.com/api/?name=${profileUser.fullname}&background=random&rounded=true&size=130`}
                      alt="Avatar"
                      className="profile-avatar border border-4 border-white rounded-circle shadow-sm w-100 h-100"
                      style={{ objectFit: 'cover', background: '#fff' }}
                    />
                    {isOwner && (
                      <div className="position-absolute bottom-0 end-0">
                        <label className="btn btn-light rounded-circle shadow-sm p-2 btn-edit-avatar mb-0 cursor-pointer" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="bi bi-camera-fill text-dark"></i>
                          <input type="file" className="d-none" accept="image/*" onChange={handleAvatarUpload} />
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="flex-grow-1 ms-md-4 mb-3 mb-md-0 w-100">
                    <h2 className="mb-1 fw-bold text-dark d-flex justify-content-center justify-content-md-start align-items-center flex-wrap gap-2">
                      <span className="d-flex align-items-center gap-1">
                        {profileUser.fullname}
                        <i className="bi bi-check-circle-fill text-poly ms-1" style={{ fontSize: '20px' }} title="Tài khoản xác thực"></i>
                      </span>
                      {profileUser.role === 'MENTOR' && (
                        <span className="badge d-flex align-items-center gap-1 px-2 py-1 fw-bold shadow-sm"
                          style={{
                            background: 'linear-gradient(135deg, #F27125, #FF9E67)',
                            color: '#fff',
                            fontSize: '12px',
                            borderRadius: '20px',
                            letterSpacing: '0.5px',
                            transform: 'translateY(-2px)'
                          }}>
                          <i className="bi bi-star-fill text-warning" style={{ fontSize: '11px', textShadow: '0 0 2px rgba(255,255,255,0.5)' }}></i> MENTOR
                        </span>
                      )}
                    </h2>
                    <p className="text-muted mb-1 fw-medium" style={{ fontSize: '15px' }}>
                      @{profileUser.username}
                      {profileUser.major && ` • SV Ngành ${profileUser.major}`}
                    </p>
                    <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
                      <strong>{profileUser.followersCount || 0}</strong> người theo dõi &bull; <strong>{profileUser.followingCount || 0}</strong> Đang theo dõi
                    </p>
                  </div>

                  <div className="d-flex gap-2 justify-content-center w-100 w-md-auto mb-2 mb-md-0">
                    {isOwner ? (
                      <>
                        {/* <button className="btn btn-primary rounded-pill px-4 fw-medium shadow-sm bg-poly border-0"><i className="bi bi-plus-lg me-1"></i> Thêm vào tin</button> */}
                        <button
                          className="btn btn-poly-gradient border-0 text-white rounded-pill px-4 fw-medium shadow-sm"
                          onClick={() => router.push('/settings')}
                        >
                          <i className="bi bi-pencil me-1"></i> Chỉnh sửa
                        </button>
                      </>
                    ) : (
                      <button
                        className={`btn ${isFollowing ? 'btn-secondary bg-light text-dark border' : 'btn-poly-gradient text-white'} rounded-pill px-4 fw-medium shadow-sm border-0`}
                        onClick={handleFollowToggle}
                      >
                        <i className={`bi ${isFollowing ? 'bi-person-check-fill' : 'bi-person-plus-fill'} me-1`}></i>
                        {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                      </button>
                    )}
                  </div>
                </div>

                <p className="mt-3 mb-0 text-center text-md-start text-dark" style={{ fontSize: '14.5px' }}>
                  {profileUser.bio || 'Chưa có thông tin giới thiệu.'}
                </p>
              </div>

              {/* Profile Nav Tabs */}
              <ul className="nav profile-nav-tabs px-3 border-top">
                <li className="nav-item">
                  <button className="nav-link active">
                    Bài viết
                  </button>
                </li>
              </ul>
            </div>

            {/* TAB PANELS */}
            <div className="row">
              {/* Left Column: Intro */}
              <div className="col-lg-4 d-none d-lg-block">
                <div className="poly-card p-3 mb-3 bg-white">
                  <h5 className="fw-bold mb-3 fs-6 text-dark">Giới thiệu</h5>
                  <div className="d-flex align-items-center mb-2 text-muted" style={{ fontSize: '14.5px' }}>
                    <i className="bi bi-mortarboard-fill fs-5 me-2 text-center" style={{ width: '20px' }}></i>
                    <span>{profileUser.major ? `Sinh viên ngành ${profileUser.major}` : 'Sinh viên tại FPT Polytechnic'}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2 text-muted" style={{ fontSize: '14.5px' }}>
                    <i className="bi bi-geo-alt-fill fs-5 me-2 text-center" style={{ width: '20px' }}></i> Việt Nam
                  </div>
                  <div className="d-flex align-items-center mb-2 text-muted" style={{ fontSize: '14.5px' }}>
                    <i className="bi bi-envelope-fill fs-5 me-2 text-center" style={{ width: '20px' }}></i> <span>{profileUser.email}</span>
                  </div>
                  {profileUser.phone && (
                    <div className="d-flex align-items-center mb-2 text-muted" style={{ fontSize: '14.5px' }}>
                      <i className="bi bi-telephone-fill fs-5 me-2 text-center" style={{ width: '20px' }}></i> <span>{profileUser.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: User Posts */}
              <div className="col-lg-8 col-12">
                {postsLoading ? (
                  <div className="d-flex flex-column gap-3">
                    <PostSkeleton />
                    <PostSkeleton />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="poly-card p-5 text-center text-muted bg-white">
                    <i className="bi bi-journal-x fs-1 d-block mb-2"></i>
                    Chưa có bài viết nào được đăng bởi người dùng này.
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard key={post.id} post={post} onPostUpdated={loadProfile} />
                  ))
                )}
              </div>
            </div>
          </div>

          <RightSidebar />
        </main>
      </div>
    </>
  );
}
