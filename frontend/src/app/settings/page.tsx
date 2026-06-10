'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI } from '@/lib/api';
import Header from '@/components/layout/Header';
import LeftSidebar from '@/components/layout/LeftSidebar';
import '@/styles/legacy_static/client/css/settings.css';

type SettingTab = 'account' | 'security' | 'privacy' | 'notifications' | 'display';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<SettingTab>('account');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Tab 1: Account Info State
  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [major, setMajor] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState<boolean>(true);

  // Tab 2: Security & Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordStrengthText, setPasswordStrengthText] = useState('Chưa có');
  const [passwordMatchValid, setPasswordMatchValid] = useState<boolean | null>(null);

  // Tab 3: Privacy State
  const [whoCanSeeFollowers, setWhoCanSeeFollowers] = useState('private');
  const [whoCanMessage, setWhoCanMessage] = useState('everyone');

  // Tab 4: Notifications State
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyComment, setNotifyComment] = useState(true);
  const [notifyLike, setNotifyLike] = useState(true);
  const [notifyFollow, setNotifyFollow] = useState(true);
  const [notifyRecommend, setNotifyRecommend] = useState(false);

  // Tab 5: Appearance/Display State
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');

  // Load User Data & LocalStorage properties
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      setFullname(user.fullname || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setMajor(user.major || '');
      setBirthday(user.birthday || '');
      setGender(user.gender !== undefined ? user.gender : true);
    }

    // Load LocalStorage parameters
    if (typeof window !== 'undefined') {
      const stored2FA = localStorage.getItem('polyhub_2fa');
      if (stored2FA) setIs2FAEnabled(stored2FA === 'true');

      const storedSeeFollowers = localStorage.getItem('polyhub_privacy_see_followers');
      if (storedSeeFollowers) setWhoCanSeeFollowers(storedSeeFollowers);

      const storedMessage = localStorage.getItem('polyhub_privacy_message');
      if (storedMessage) setWhoCanMessage(storedMessage);

      const storedNotifyEmail = localStorage.getItem('polyhub_notify_email');
      if (storedNotifyEmail) setNotifyEmail(storedNotifyEmail === 'true');

      const storedNotifyComment = localStorage.getItem('polyhub_notify_comment');
      if (storedNotifyComment) setNotifyComment(storedNotifyComment === 'true');

      const storedNotifyLike = localStorage.getItem('polyhub_notify_like');
      if (storedNotifyLike) setNotifyLike(storedNotifyLike === 'true');

      const storedNotifyFollow = localStorage.getItem('polyhub_notify_follow');
      if (storedNotifyFollow) setNotifyFollow(storedNotifyFollow === 'true');

      const storedNotifyRecommend = localStorage.getItem('polyhub_notify_recommend');
      if (storedNotifyRecommend) setNotifyRecommend(storedNotifyRecommend === 'true');

      const storedTheme = localStorage.getItem('polyhub_theme');
      if (storedTheme) setThemeMode(storedTheme as 'light' | 'dark');

      const storedLang = localStorage.getItem('polyhub_language');
      if (storedLang) setLanguage(storedLang as 'vi' | 'en');
    }
  }, [user, authLoading, router]);

  // Sync tab from URL hash if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as SettingTab;
      if (['account', 'security', 'privacy', 'notifications', 'display'].includes(hash)) {
        setActiveTab(hash);
      }
    }
  }, []);

  const handleTabChange = (tab: SettingTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
    setSuccessMsg('');
    setErrorMsg('');
  };

  // Submit Account Info Update
  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await fetchAPI(`/api/users/${user.username}`, {
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
      setSuccessMsg('Cập nhật thông tin tài khoản thành công!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Cập nhật thông tin thất bại.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu nhập lại không khớp!');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 8 ký tự!');
      return;
    }

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await fetchAPI(`/api/users/${user.username}/password`, {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      setSuccessMsg('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStrength(0);
      setPasswordStrengthText('Chưa có');
      setPasswordMatchValid(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Đổi mật khẩu thất bại. Mật khẩu hiện tại có thể không đúng.');
    } finally {
      setLoading(false);
    }
  };

  // Password Logic checks
  const handleNewPasswordChange = (val: string) => {
    setNewPassword(val);
    
    // Evaluate strength
    let strength = 0;
    if (val.length > 0) {
      if (val.length >= 8) strength++;
      if (/[A-Z]/.test(val)) strength++;
      if (/[0-9]/.test(val)) strength++;
      if (/[^A-Za-z0-9]/.test(val)) strength++;
    }
    setPasswordStrength(strength);

    if (val.length === 0) {
      setPasswordStrengthText('Chưa có');
    } else if (strength <= 1 || val.length < 8) {
      setPasswordStrengthText('Yếu (Quá ngắn hoặc thiếu ký tự)');
    } else if (strength === 2 || strength === 3) {
      setPasswordStrengthText('Trung bình (Nên thêm chữ hoa/số/ký tự)');
    } else if (strength === 4) {
      setPasswordStrengthText('Mạnh (Bảo mật tốt)');
    }

    // Match check
    if (confirmPassword.length > 0) {
      setPasswordMatchValid(val === confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    if (val.length === 0) {
      setPasswordMatchValid(null);
    } else {
      setPasswordMatchValid(newPassword === val);
    }
  };

  // Handle 2FA Switch Toggle
  const handleToggle2FA = (checked: boolean) => {
    setIs2FAEnabled(checked);
    localStorage.setItem('polyhub_2fa', checked ? 'true' : 'false');
    setSuccessMsg(checked ? 'Đã bật xác thực 2 yếu tố!' : 'Đã tắt xác thực 2 yếu tố.');
  };

  // Handle Privacy Updates
  const handlePrivacySave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('polyhub_privacy_see_followers', whoCanSeeFollowers);
    localStorage.setItem('polyhub_privacy_message', whoCanMessage);
    setSuccessMsg('Đã lưu cấu hình quyền riêng tư!');
  };

  // Handle Notifications Switch Updates
  const handleNotifySave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('polyhub_notify_email', notifyEmail ? 'true' : 'false');
    localStorage.setItem('polyhub_notify_comment', notifyComment ? 'true' : 'false');
    localStorage.setItem('polyhub_notify_like', notifyLike ? 'true' : 'false');
    localStorage.setItem('polyhub_notify_follow', notifyFollow ? 'true' : 'false');
    localStorage.setItem('polyhub_notify_recommend', notifyRecommend ? 'true' : 'false');
    setSuccessMsg('Đã lưu cấu hình thông báo thành công!');
  };

  // Handle Theme Options
  const handleThemeModeSelect = (mode: 'light' | 'dark') => {
    setThemeMode(mode);
    localStorage.setItem('polyhub_theme', mode);
    setSuccessMsg(`Đã chuyển đổi sang Giao diện ${mode === 'light' ? 'Sáng' : 'Tối'}!`);
  };

  // Handle Language Option Change
  const handleLanguageSelect = (lang: 'vi' | 'en') => {
    setLanguage(lang);
    localStorage.setItem('polyhub_language', lang);
    setSuccessMsg(`Đã đổi ngôn ngữ sang ${lang === 'vi' ? 'Tiếng Việt' : 'English'}!`);
  };

  if (authLoading || !user) {
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
          <LeftSidebar activeMenu="profile" />
          
          <div className="settings-container w-100 mx-auto" style={{ maxWidth: '950px', padding: '20px 0' }}>
            <h2 className="fw-bold mb-4 px-2 px-md-0"><i className="bi bi-gear-fill me-2 text-poly"></i>Cài đặt & Quyền riêng tư</h2>

            {successMsg && (
              <div className="alert alert-success alert-dismissible fade show rounded-3 border-0 shadow-sm py-3 mb-4 mx-2 mx-md-0" role="alert">
                <i className="bi bi-check-circle-fill me-2"></i> {successMsg}
                <button type="button" className="btn-close" onClick={() => setSuccessMsg('')}></button>
              </div>
            )}

            {errorMsg && (
              <div className="alert alert-danger alert-dismissible fade show rounded-3 border-0 shadow-sm py-3 mb-4 mx-2 mx-md-0" role="alert">
                <i className="bi bi-exclamation-circle-fill me-2"></i> {errorMsg}
                <button type="button" className="btn-close" onClick={() => setErrorMsg('')}></button>
              </div>
            )}

            <div className="row g-4">
              {/* Left Sidebar Navigation */}
              <div className="col-md-4">
                <div className="poly-card p-0 overflow-hidden sticky-top" style={{ top: '80px', zIndex: 10, backgroundColor: 'white' }}>
                  <div className="list-group list-group-flush settings-nav">
                    <button 
                      onClick={() => handleTabChange('account')} 
                      className={`list-group-item list-group-item-action d-flex align-items-center text-start border-0 ${activeTab === 'account' ? 'active' : ''}`}
                    >
                      <div className="settings-icon-wrapper rounded-circle me-3 d-flex align-items-center justify-content-center">
                        <i className="bi bi-person-circle"></i>
                      </div>
                      <div>
                        <h6 className="mb-0 fw-semibold">Thông tin tài khoản</h6>
                        <small className="text-muted d-block" style={{ fontSize: '12px' }}>Họ tên, email, liên hệ</small>
                      </div>
                    </button>
                    <button 
                      onClick={() => handleTabChange('security')} 
                      className={`list-group-item list-group-item-action d-flex align-items-center text-start border-0 ${activeTab === 'security' ? 'active' : ''}`}
                    >
                      <div className="settings-icon-wrapper rounded-circle me-3 d-flex align-items-center justify-content-center">
                        <i className="bi bi-shield-lock-fill"></i>
                      </div>
                      <div>
                        <h6 className="mb-0 fw-semibold">Mật khẩu & Bảo mật</h6>
                        <small className="text-muted d-block" style={{ fontSize: '12px' }}>Đổi mật khẩu, 2FA</small>
                      </div>
                    </button>
                    <button 
                      onClick={() => handleTabChange('privacy')} 
                      className={`list-group-item list-group-item-action d-flex align-items-center text-start border-0 ${activeTab === 'privacy' ? 'active' : ''}`}
                    >
                      <div className="settings-icon-wrapper rounded-circle me-3 d-flex align-items-center justify-content-center">
                        <i className="bi bi-eye-fill"></i>
                      </div>
                      <div>
                        <h6 className="mb-0 fw-semibold">Quyền riêng tư</h6>
                        <small className="text-muted d-block" style={{ fontSize: '12px' }}>Kiểm soát chia sẻ & ẩn dữ liệu</small>
                      </div>
                    </button>
                    <button 
                      onClick={() => handleTabChange('notifications')} 
                      className={`list-group-item list-group-item-action d-flex align-items-center text-start border-0 ${activeTab === 'notifications' ? 'active' : ''}`}
                    >
                      <div className="settings-icon-wrapper rounded-circle me-3 d-flex align-items-center justify-content-center">
                        <i className="bi bi-bell-fill"></i>
                      </div>
                      <div>
                        <h6 className="mb-0 fw-semibold">Thông báo</h6>
                        <small className="text-muted d-block" style={{ fontSize: '12px' }}>Tùy chỉnh nhận thông báo</small>
                      </div>
                    </button>
                    <button 
                      onClick={() => handleTabChange('display')} 
                      className={`list-group-item list-group-item-action d-flex align-items-center text-start border-0 ${activeTab === 'display' ? 'active' : ''}`}
                    >
                      <div className="settings-icon-wrapper rounded-circle me-3 d-flex align-items-center justify-content-center">
                        <i className="bi bi-palette-fill"></i>
                      </div>
                      <div>
                        <h6 className="mb-0 fw-semibold">Hiển thị & Giao diện</h6>
                        <small className="text-muted d-block" style={{ fontSize: '12px' }}>Chủ đề sáng/tối, ngôn ngữ</small>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Content Area */}
              <div className="col-md-8">
                <div className="tab-content">
                  
                  {/* TAB 1: ACCOUNT INFO */}
                  {activeTab === 'account' && (
                    <div className="poly-card p-4 bg-white rounded-3 shadow-sm border border-light">
                      <h4 className="fw-bold mb-1 text-dark">Thông tin cá nhân</h4>
                      <p className="text-muted mb-4" style={{ fontSize: '14.5px' }}>Quản lý thông tin định danh của bạn trên hệ thống PolyHUB.</p>
                      
                      <form onSubmit={handleUpdateAccount}>
                        <div className="row g-3 mb-3">
                          <div className="col-sm-6">
                            <label className="form-label fw-medium text-dark" style={{ fontSize: '14px' }}>Họ và Tên</label>
                            <input 
                              type="text" 
                              className="form-control form-control-poly text-dark" 
                              value={fullname}
                              onChange={(e) => setFullname(e.target.value)}
                              placeholder="Họ và tên của bạn"
                              required
                            />
                          </div>
                          <div className="col-sm-6">
                            <label className="form-label fw-medium text-dark" style={{ fontSize: '14px' }}>Mã Sinh Viên</label>
                            <input 
                              type="text" 
                              className="form-control form-control-poly bg-light text-muted" 
                              value={user.username} 
                              readOnly 
                            />
                          </div>
                        </div>
                        
                        <div className="row g-3 mb-3">
                          <div className="col-sm-6">
                            <label className="form-label fw-medium text-dark" style={{ fontSize: '14px' }}>Điện thoại</label>
                            <input 
                              type="tel" 
                              className="form-control form-control-poly text-dark" 
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="Nhập số điện thoại"
                            />
                          </div>
                          <div className="col-sm-6">
                            <label className="form-label fw-medium text-dark" style={{ fontSize: '14px' }}>Email liên hệ</label>
                            <input 
                              type="email" 
                              className="form-control form-control-poly bg-light text-muted" 
                              value={user.email} 
                              readOnly 
                            />
                          </div>
                        </div>

                        <div className="row g-3 mb-3">
                          <div className="col-sm-6">
                            <label className="form-label fw-medium text-dark" style={{ fontSize: '14px' }}>Chuyên ngành</label>
                            <input 
                              type="text" 
                              className="form-control form-control-poly text-dark" 
                              value={major}
                              onChange={(e) => setMajor(e.target.value)}
                              placeholder="VD: Thiết kế trang web, Agile..."
                            />
                          </div>
                          <div className="col-sm-6">
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

                        <div className="mb-4">
                          <label className="form-label fw-medium text-dark" style={{ fontSize: '14px' }}>Giới thiệu ngắn (Tiểu sử)</label>
                          <textarea 
                            className="form-control form-control-poly text-dark" 
                            rows={3} 
                            placeholder="Viết vài dòng giới thiệu về bản thân bạn..." 
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                          ></textarea>
                        </div>
                        
                        <div className="d-flex justify-content-end">
                          <button type="submit" disabled={loading} className="btn btn-poly fw-semibold px-4 rounded-pill">
                            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* TAB 2: SECURITY */}
                  {activeTab === 'security' && (
                    <div className="poly-card p-4 bg-white rounded-3 shadow-sm border border-light">
                      <div className="d-flex align-items-center mb-4">
                        <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px' }}>
                          <i className="bi bi-key-fill text-poly fs-4"></i>
                        </div>
                        <div>
                          <h4 className="fw-bold mb-1 text-dark">Đổi mật khẩu</h4>
                          <p className="text-muted mb-0" style={{ fontSize: '14px' }}>Bảo vệ tài khoản bằng mật khẩu mạnh và an toàn.</p>
                        </div>
                      </div>

                      <form onSubmit={handleChangePassword} className="mb-4">
                        <div className="mb-3">
                          <label className="form-label fw-semibold text-dark" style={{ fontSize: '14px' }}>Mật khẩu hiện tại</label>
                          <input 
                            type="password" 
                            className="form-control form-control-poly text-dark" 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Nhập mật khẩu đang sử dụng"
                            required
                          />
                        </div>
                        
                        <div className="row g-3 mb-3">
                          <div className="col-md-6">
                            <label className="form-label fw-semibold text-dark" style={{ fontSize: '14px' }}>Mật khẩu mới</label>
                            <input 
                              type="password" 
                              className="form-control form-control-poly text-dark" 
                              value={newPassword}
                              onChange={(e) => handleNewPasswordChange(e.target.value)}
                              placeholder="Tối thiểu 8 ký tự"
                              required
                            />
                            {newPassword.length > 0 && (
                              <>
                                <div className="progress mt-2" style={{ height: '5px' }}>
                                  <div 
                                    className={`progress-bar ${passwordStrength <= 1 ? 'bg-danger' : passwordStrength <= 3 ? 'bg-warning' : 'bg-success'}`} 
                                    role="progressbar" 
                                    style={{ width: `${(passwordStrength / 4) * 100}%` }}
                                  ></div>
                                </div>
                                <small className="text-muted mt-1 d-block" style={{ fontSize: '11px' }}>
                                  Độ mạnh: <span className="fw-medium">{passwordStrengthText}</span>
                                </small>
                              </>
                            )}
                          </div>
                          
                          <div className="col-md-6">
                            <label className="form-label fw-semibold text-dark" style={{ fontSize: '14px' }}>Xác nhận mật khẩu mới</label>
                            <input 
                              type="password" 
                              className="form-control form-control-poly text-dark" 
                              value={confirmPassword}
                              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                              placeholder="Nhập lại mật khẩu mới"
                              required
                            />
                            {passwordMatchValid !== null && (
                              <small className={`mt-1 d-block fw-medium ${passwordMatchValid ? 'text-success' : 'text-danger'}`} style={{ fontSize: '12px' }}>
                                <i className={`bi ${passwordMatchValid ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-1`}></i>
                                {passwordMatchValid ? 'Mật khẩu khớp nhau' : 'Mật khẩu nhập lại không khớp'}
                              </small>
                            )}
                          </div>
                        </div>

                        <div className="d-flex justify-content-end pt-3 border-top">
                          <button 
                            type="submit" 
                            disabled={loading || passwordMatchValid === false || newPassword.length < 8} 
                            className="btn btn-poly fw-semibold px-4 rounded-pill"
                          >
                            {loading ? 'Đang đổi...' : 'Cập nhật mật khẩu'}
                          </button>
                        </div>
                      </form>

                      {/* 2FA Section */}
                      <div className="border-top pt-4">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h5 className="fw-bold mb-1 text-dark">Xác thực 2 yếu tố (2FA)</h5>
                            <p className="text-muted mb-0" style={{ fontSize: '13.5px' }}>Bảo vệ tài khoản của bạn bằng lớp bảo mật thứ hai.</p>
                          </div>
                          <div className="form-switch">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              role="switch" 
                              checked={is2FAEnabled}
                              onChange={(e) => handleToggle2FA(e.target.checked)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: PRIVACY */}
                  {activeTab === 'privacy' && (
                    <div className="poly-card p-4 bg-white rounded-3 shadow-sm border border-light">
                      <h4 className="fw-bold mb-1 text-dark">Quyền riêng tư</h4>
                      <p className="text-muted mb-4" style={{ fontSize: '14.5px' }}>Kiểm soát tính riêng tư của dữ liệu cá nhân.</p>

                      <form onSubmit={handlePrivacySave} className="mb-4">
                        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                          <div>
                            <h6 className="fw-semibold mb-1 text-dark" style={{ fontSize: '14.5px' }}>Ai có thể xem danh sách theo dõi của bạn?</h6>
                            <span className="text-muted d-block" style={{ fontSize: '12.5px' }}>Giới hạn người có thể thấy bạn bè/người bạn theo dõi.</span>
                          </div>
                          <select 
                            className="form-select form-control-poly w-auto d-inline-block text-dark"
                            value={whoCanSeeFollowers}
                            onChange={(e) => setWhoCanSeeFollowers(e.target.value)}
                          >
                            <option value="public">Công khai</option>
                            <option value="friends">Bạn bè</option>
                            <option value="private">Chỉ mình tôi</option>
                          </select>
                        </div>

                        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                          <div>
                            <h6 className="fw-semibold mb-1 text-dark" style={{ fontSize: '14.5px' }}>Ai có thể nhắn tin cho bạn?</h6>
                            <span className="text-muted d-block" style={{ fontSize: '12.5px' }}>Kiểm soát ai sẽ được phép gửi tin nhắn trực tiếp.</span>
                          </div>
                          <select 
                            className="form-select form-control-poly w-auto d-inline-block text-dark"
                            value={whoCanMessage}
                            onChange={(e) => setWhoCanMessage(e.target.value)}
                          >
                            <option value="everyone">Mọi người</option>
                            <option value="friends">Chỉ bạn bè</option>
                          </select>
                        </div>

                        <div className="d-flex justify-content-end">
                          <button type="submit" className="btn btn-poly fw-semibold px-4 rounded-pill">Lưu cấu hình</button>
                        </div>
                      </form>

                      {/* Danger zone */}
                      <div className="p-4 border border-danger border-opacity-25 rounded-3 bg-danger bg-opacity-10 mt-3">
                        <h5 className="fw-bold text-danger mb-2"><i className="bi bi-exclamation-triangle-fill me-2"></i>Vùng nguy hiểm</h5>
                        <p className="text-danger opacity-75 mb-3" style={{ fontSize: '13.5px' }}>Khi bạn xóa tài khoản, toàn bộ dữ liệu, bài viết và tương tác của bạn sẽ bị xóa vĩnh viễn và không thể khôi phục lại được.</p>
                        <button className="btn btn-outline-danger fw-semibold rounded-pill px-4" onClick={() => alert('Yêu cầu xóa tài khoản đã được chuyển tới BQT. Chúng tôi sẽ gửi mail xác nhận trong 24 giờ.')}>Yêu cầu xóa tài khoản</button>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: NOTIFICATIONS */}
                  {activeTab === 'notifications' && (
                    <div className="poly-card p-4 bg-white rounded-3 shadow-sm border border-light">
                      <h4 className="fw-bold mb-4 text-dark">Cài đặt thông báo</h4>

                      <form onSubmit={handleNotifySave}>
                        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                          <div>
                            <h6 className="fw-semibold mb-1 text-dark" style={{ fontSize: '14.5px' }}>Thông báo qua Email</h6>
                            <span className="text-muted d-block" style={{ fontSize: '12.5px' }}>Nhận email tổng hợp các thông báo chưa đọc.</span>
                          </div>
                          <div className="form-switch">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              role="switch" 
                              checked={notifyEmail}
                              onChange={(e) => setNotifyEmail(e.target.checked)}
                            />
                          </div>
                        </div>

                        <h6 className="fw-bold mb-3 text-poly mt-4">Thông báo ứng dụng (Push Notifications)</h6>
                        
                        <div className="d-flex flex-column gap-3 mb-4">
                          <label className="d-flex align-items-center custom-checkbox cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="form-check-input shadow-none mt-0 me-3" 
                              checked={notifyComment}
                              onChange={(e) => setNotifyComment(e.target.checked)}
                              style={{ width: '20px', height: '20px' }}
                            />
                            <span style={{ fontSize: '14.5px' }} className="fw-medium text-dark">Có người bình luận bài viết của bạn</span>
                          </label>
                          <label className="d-flex align-items-center custom-checkbox cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="form-check-input shadow-none mt-0 me-3" 
                              checked={notifyLike}
                              onChange={(e) => setNotifyLike(e.target.checked)}
                              style={{ width: '20px', height: '20px' }}
                            />
                            <span style={{ fontSize: '14.5px' }} className="fw-medium text-dark">Có người thích bài viết của bạn</span>
                          </label>
                          <label className="d-flex align-items-center custom-checkbox cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="form-check-input shadow-none mt-0 me-3" 
                              checked={notifyFollow}
                              onChange={(e) => setNotifyFollow(e.target.checked)}
                              style={{ width: '20px', height: '20px' }}
                            />
                            <span style={{ fontSize: '14.5px' }} className="fw-medium text-dark">Có người theo dõi mới</span>
                          </label>
                          <label className="d-flex align-items-center custom-checkbox cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="form-check-input shadow-none mt-0 me-3" 
                              checked={notifyRecommend}
                              onChange={(e) => setNotifyRecommend(e.target.checked)}
                              style={{ width: '20px', height: '20px' }}
                            />
                            <span style={{ fontSize: '14.5px' }} className="fw-medium text-dark">Đề xuất khóa học/Nhóm mới</span>
                          </label>
                        </div>

                        <div className="d-flex justify-content-end">
                          <button type="submit" className="btn btn-poly fw-semibold px-4 rounded-pill">Lưu cài đặt</button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* TAB 5: DISPLAY */}
                  {activeTab === 'display' && (
                    <div className="poly-card p-4 bg-white rounded-3 shadow-sm border border-light">
                      <h4 className="fw-bold mb-4 text-dark">Giao diện hệ thống</h4>
                      
                      <h6 className="fw-semibold mb-3 text-dark">Chế độ hiển thị</h6>
                      <div className="d-flex gap-3 mb-4">
                        <div className="theme-option text-center">
                          <div 
                            onClick={() => handleThemeModeSelect('light')}
                            className={`border rounded p-2 mb-2 shadow-sm cursor-pointer ${themeMode === 'light' ? 'active-theme' : ''}`} 
                            style={{ width: '120px', height: '80px', backgroundColor: '#ffffff' }}
                          >
                            <div className="w-100 bg-light rounded mb-1" style={{ height: '15px' }}></div>
                            <div className="w-75 bg-light rounded" style={{ height: '30px' }}></div>
                          </div>
                          <span className="fw-medium text-dark" style={{ fontSize: '13.5px' }}>Giao diện Sáng</span>
                        </div>
                        <div className="theme-option text-center">
                          <div 
                            onClick={() => handleThemeModeSelect('dark')}
                            className={`border rounded p-2 mb-2 shadow-sm cursor-pointer ${themeMode === 'dark' ? 'active-theme' : ''}`} 
                            style={{ width: '120px', height: '80px', backgroundColor: '#1e293b' }}
                          >
                            <div className="w-100 bg-secondary bg-opacity-25 rounded mb-1" style={{ height: '15px' }}></div>
                            <div className="w-75 bg-secondary bg-opacity-25 rounded" style={{ height: '30px' }}></div>
                          </div>
                          <span className="fw-medium text-dark" style={{ fontSize: '13.5px' }}>Giao diện Tối</span>
                        </div>
                      </div>

                      <div className="border-top pt-4">
                        <h6 className="fw-semibold mb-3 text-dark">Ngôn ngữ</h6>
                        <select 
                          className="form-select form-control-poly w-50 text-dark"
                          value={language}
                          onChange={(e) => handleLanguageSelect(e.target.value as 'vi' | 'en')}
                        >
                          <option value="vi">🇻🇳 Tiếng Việt</option>
                          <option value="en">🇺🇸 English</option>
                        </select>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
