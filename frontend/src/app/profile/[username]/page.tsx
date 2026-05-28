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
import '@/styles/profile.css';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const username = params.username as string;

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'settings'>('posts');

  // Form states for Settings
  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [major, setMajor] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState<boolean>(true);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status states
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pwErrorMsg, setPwErrorMsg] = useState('');
  const [pwSuccessMsg, setPwSuccessMsg] = useState('');

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      // 1. Fetch user profile
      const data = await fetchAPI(`/api/users/${username}`);
      setProfileUser(data);
      setIsFollowing(data.isFollowing || false);
      setIsOwner(data.isOwner || false);

      // Prepopulate settings form
      setFullname(data.fullname || '');
      setPhone(data.phone || '');
      setBio(data.bio || '');
      setMajor(data.major || '');
      setBirthday(data.birthday || '');
      setGender(data.gender !== undefined ? data.gender : true);

      // 2. Fetch user's posts
      const postsData = await fetchAPI(`/api/v2/posts/user/${username}?page=0&size=15`);
      setPosts(postsData.posts || []);
    } catch (err: any) {
      console.error('Failed to load profile', err);
      setErrorMsg(err.message || 'Lỗi tải trang cá nhân');
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username]);

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

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetchAPI(`/api/users/${username}`, {
        method: 'PUT',
        body: JSON.stringify({
          fullname,
          phone,
          bio,
          major,
          birthday,
          gender,
        }),
      });
      setSuccessMsg('Cập nhật thông tin cá nhân thành công!');
      setProfileUser(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Cập nhật thất bại');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErrorMsg('');
    setPwSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setPwErrorMsg('Mật khẩu xác nhận không khớp!');
      return;
    }

    try {
      await fetchAPI(`/api/users/${username}/password`, {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      setPwSuccessMsg('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwErrorMsg(err.message || 'Đổi mật khẩu thất bại');
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
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
        <button className="btn btn-primary" onClick={() => router.push('/')}>Quay lại trang chủ</button>
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
                  
                  <div className="avatar-wrapper position-relative z-2" style={{ marginTop: '-65px', marginBottom: '10px' }}>
                    <img 
                      src={profileUser.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                      alt="Avatar" 
                      className="profile-avatar border border-4 border-white rounded-circle shadow-sm" 
                      width="130" 
                      height="130" 
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
                    <h2 className="mb-1 fw-bold text-dark d-flex justify-content-center justify-content-md-start align-items-center gap-2">
                      {profileUser.fullname} 
                      <i className="bi bi-check-circle-fill text-primary" style={{ fontSize: '18px' }}></i>
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
                        <button className="btn btn-primary rounded-pill px-4 fw-medium shadow-sm bg-poly border-0"><i className="bi bi-plus-lg me-1"></i> Thêm vào tin</button>
                        <button 
                          className="btn btn-secondary bg-light border-0 rounded-pill px-4 fw-medium text-dark shadow-sm"
                          onClick={() => setActiveTab(activeTab === 'posts' ? 'settings' : 'posts')}
                        >
                          <i className="bi bi-pencil me-1"></i> {activeTab === 'posts' ? 'Chỉnh sửa' : 'Xem bài viết'}
                        </button>
                      </>
                    ) : (
                      <button 
                        className={`btn ${isFollowing ? 'btn-secondary bg-light text-dark border' : 'btn-primary bg-poly'} rounded-pill px-4 fw-medium shadow-sm border-0`}
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
                  <button 
                    className={`nav-link ${activeTab === 'posts' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('posts')}
                  >
                    Bài viết
                  </button>
                </li>
                {isOwner && (
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`} 
                      onClick={() => setActiveTab('settings')}
                    >
                      Cài đặt & Bảo mật
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* TAB PANELS */}
            {activeTab === 'posts' ? (
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
                  {posts.length === 0 ? (
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
            ) : (
              /* TAB PANEL: SETTINGS */
              <div className="settings-tab">
                <div className="poly-card p-0 mb-4 overflow-hidden bg-white">
                  <div className="p-4 border-bottom bg-light bg-opacity-50">
                    <h4 className="mb-1 fw-bold fs-5 text-dark"><i className="bi bi-gear-fill text-poly me-2"></i>Cài đặt tài khoản</h4>
                    <p className="text-muted mb-0 fs-6">Quản lý thông tin cá nhân và bảo mật tài khoản của bạn</p>
                  </div>

                  <div className="p-4 row g-4">
                    {/* Left side: Profile Info form */}
                    <div className="col-md-6 border-end-md pe-md-4">
                      <h5 className="fw-bold fs-6 mb-3 text-dark">Thông tin cá nhân</h5>
                      <form onSubmit={handleUpdateInfo}>
                        <div className="mb-3">
                          <label className="form-label fw-medium text-dark" style={{ fontSize: '14px' }}>Họ và Tên</label>
                          <input 
                            type="text" 
                            className="form-control form-control-poly text-dark" 
                            value={fullname}
                            onChange={(e) => setFullname(e.target.value)}
                            placeholder="Nhập họ tên..."
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-medium text-dark" style={{ fontSize: '14px' }}>Mã Sinh Viên</label>
                          <input 
                            type="text" 
                            className="form-control form-control-poly bg-light text-muted" 
                            value={profileUser.username} 
                            readOnly 
                          />
                          <small className="text-muted" style={{ fontSize: '12px' }}><i className="bi bi-info-circle me-1"></i>Mã SV không thể thay đổi</small>
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-medium text-dark" style={{ fontSize: '14px' }}>Email</label>
                          <input 
                            type="email" 
                            className="form-control form-control-poly bg-light text-muted" 
                            value={profileUser.email} 
                            readOnly 
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-medium text-dark" style={{ fontSize: '14px' }}>Số điện thoại</label>
                          <input 
                            type="text" 
                            className="form-control form-control-poly text-dark" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-medium text-dark" style={{ fontSize: '14px' }}>Chuyên ngành</label>
                          <input 
                            type="text" 
                            className="form-control form-control-poly text-dark" 
                            value={major}
                            onChange={(e) => setMajor(e.target.value)}
                            placeholder="VD: CNTT, Thiết kế đồ họa..."
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-medium text-dark" style={{ fontSize: '14px' }}>Giới thiệu ngắn (Bio)</label>
                          <textarea 
                            className="form-control form-control-poly text-dark" 
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={2}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-medium text-dark" style={{ fontSize: '14px' }}>Ngày sinh</label>
                          <input 
                            type="date" 
                            className="form-control form-control-poly text-dark" 
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-medium text-dark" style={{ fontSize: '14px' }}>Giới tính</label>
                          <select 
                            className="form-select form-control-poly text-dark" 
                            value={gender ? "true" : "false"}
                            onChange={(e) => setGender(e.target.value === "true")}
                          >
                            <option value="true">Nam</option>
                            <option value="false">Nữ</option>
                          </select>
                        </div>
                        <button type="submit" className="btn btn-primary btn-poly w-100 fw-semibold rounded-pill bg-poly border-0">Cập nhật thông tin</button>
                      </form>
                    </div>

                    {/* Right side: Password change form */}
                    <div className="col-md-6 ps-md-4">
                      <h5 className="fw-bold fs-6 mb-3 text-dark">Đổi mật khẩu</h5>
                      
                      {pwErrorMsg && <div className="alert alert-danger py-2" style={{ fontSize: '14px' }}>{pwErrorMsg}</div>}
                      {pwSuccessMsg && <div className="alert alert-success py-2" style={{ fontSize: '14px' }}>{pwSuccessMsg}</div>}

                      <form onSubmit={handleChangePassword}>
                        <div className="mb-3">
                          <label className="form-label fw-medium text-dark" style={{ fontSize: '14px' }}>Mật khẩu hiện tại</label>
                          <input 
                            type="password" 
                            className="form-control form-control-poly text-dark" 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••" 
                            required 
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-medium text-dark" style={{ fontSize: '14px' }}>Mật khẩu mới</label>
                          <input 
                            type="password" 
                            className="form-control form-control-poly text-dark" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Nhập mật khẩu mới" 
                            required 
                          />
                        </div>
                        <div className="mb-4">
                          <label className="form-label fw-medium text-dark" style={{ fontSize: '14px' }}>Xác nhận mật khẩu mới</label>
                          <input 
                            type="password" 
                            className="form-control form-control-poly text-dark" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Nhập lại mật khẩu mới" 
                            required 
                          />
                        </div>
                        <button type="submit" className="btn btn-dark w-100 fw-semibold rounded-pill">Đổi mật khẩu</button>
                      </form>
                    </div>
                  </div>
                </div>

                <div className="poly-card p-4 border border-danger border-opacity-25 bg-danger bg-opacity-10 mb-5">
                  <h5 className="fw-bold text-danger fs-6 mb-2"><i className="bi bi-exclamation-triangle-fill me-2"></i>Vùng nguy hiểm</h5>
                  <p className="text-danger opacity-75 mb-3" style={{ fontSize: '14px' }}>Khi bạn xóa tài khoản, toàn bộ dữ liệu, bài viết và tương tác của bạn sẽ bị xóa vĩnh viễn và không thể khôi phục lại được.</p>
                  <button className="btn btn-outline-danger font-weight-bold rounded-pill border-2 px-4 shadow-sm" style={{ fontSize: '14.5px' }}>Yêu cầu xóa tài khoản</button>
                </div>
              </div>
            )}
          </div>

          <RightSidebar />
        </main>
      </div>
    </>
  );
}
