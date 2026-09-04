'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI } from '@/lib/api';
import Header from '@/components/layout/Header';
import LeftSidebar from '@/components/layout/LeftSidebar';

type SettingTab = 'account' | 'security' | 'display';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<SettingTab>('account');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [token, setToken] = useState<string | null>(null);

  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [major, setMajor] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState<boolean>(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordStrengthText, setPasswordStrengthText] = useState('Chưa có');
  const [passwordMatchValid, setPasswordMatchValid] = useState<boolean | null>(null);

  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');

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

    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);

      const storedTheme = localStorage.getItem('polyhub_theme') as 'light' | 'dark';
      if (storedTheme) {
        setThemeMode(storedTheme);
        applyThemeToDOM(storedTheme);
      }

      const storedLang = localStorage.getItem('polyhub_language');
      if (storedLang) setLanguage(storedLang as 'vi' | 'en');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetch2FAStatus = async () => {
      if (!user) return;
      try {
        const timestamp = new Date().getTime();
        const data = await fetchAPI(`/api/users/${user.username}?t=${timestamp}`, {
          method: 'GET'
        });
        
        setIs2FAEnabled(data.IsTwoFactorEnabled ?? false);
      } catch (err) {
      }
    };

    fetch2FAStatus();
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as SettingTab;
      if (['account', 'security', 'display'].includes(hash)) {
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

  const handleNewPasswordChange = (val: string) => {
    setNewPassword(val);
    
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

  const handleToggle2FA = async (checked: boolean) => {
    if (!user) return; 

    const actionText = checked ? "bật" : "tắt";
    const confirmAction = window.confirm(`Bạn có chắc chắn muốn ${actionText} xác minh 2 bước?`);
    
    if (!confirmAction) {
      return; 
    }

    setIs2FAEnabled(checked);
    setErrorMsg('');
    
    try {
      const data = await fetchAPI(`/api/users/${user.username}/toggle-2fa`, {
        method: 'PUT',
        body: JSON.stringify({ enable: checked }),
      });

      setSuccessMsg(data.message || (checked ? 'Đã bật xác thực 2 yếu tố!' : 'Đã tắt xác thực 2 yếu tố.'));
    } catch (err: any) {
      setIs2FAEnabled(!checked); 
      setErrorMsg(err.message || 'Không thể thay đổi cài đặt 2FA lúc này.');
    }
  };

  const applyThemeToDOM = (mode: 'light' | 'dark') => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-bs-theme', mode); 
      if (mode === 'dark') {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }
  };

  const handleThemeModeSelect = (mode: 'light' | 'dark') => {
    setThemeMode(mode);
    localStorage.setItem('polyhub_theme', mode);
    applyThemeToDOM(mode);
    setSuccessMsg(`Đã chuyển đổi sang Giao diện ${mode === 'light' ? 'Sáng' : 'Tối'}!`);
  };

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
      <style dangerouslySetInnerHTML={{
        __html: `
          [data-bs-theme="dark"], .dark-mode {
            --bs-body-color: #f8f9fa;
            --bs-heading-color: #ffffff;
          }
          [data-bs-theme="dark"] .text-dark,
          .dark-mode .text-dark,
          [data-bs-theme="dark"] h1, 
          [data-bs-theme="dark"] h2, 
          [data-bs-theme="dark"] h4, 
          [data-bs-theme="dark"] h6 {
            color: #f8f9fa !important;
          }
          [data-bs-theme="dark"] .text-muted,
          .dark-mode .text-muted,
          [data-bs-theme="dark"] small,
          [data-bs-theme="dark"] span,
          [data-bs-theme="dark"] p {
            color: #adb5bd !important;
          }
          [data-bs-theme="dark"] .poly-card,
          [data-bs-theme="dark"] .settings-nav {
            background-color: #1e293b !important;
            border-color: #334155 !important;
          }
          [data-bs-theme="dark"] .list-group-item {
            color: #e2e8f0;
            background-color: transparent !important;
          }
          [data-bs-theme="dark"] .list-group-item:hover,
          [data-bs-theme="dark"] .list-group-item.active {
            background-color: #334155 !important;
            color: #ffffff !important;
          }
          [data-bs-theme="dark"] aside,
          [data-bs-theme="dark"] .left-sidebar,
          [data-bs-theme="dark"] a,
          [data-bs-theme="dark"] .menu-item,
          [data-bs-theme="dark"] li {
            color: #e2e8f0 !important;
          }
          [data-bs-theme="dark"] .alert-success {
            background-color: #064e3b !important;
            color: #34d399 !important;
            border-color: #065f46 !important;
          }
          [data-bs-theme="dark"] .settings-icon-wrapper {
            background-color: #334155 !important;
          }
        `
      }} />
      <Header />
      <div className="app-container">
        <main className="w-100 d-flex justify-content-between">
          <LeftSidebar activeMenu="profile" />
          
          <div className="settings-container w-100 mx-auto" style={{ maxWidth: '950px', padding: '20px 0' }}>
            <h2 className="fw-bold mb-4 px-2 px-md-0"><i className="bi bi-gear-fill me-2 text-poly"></i>Cài đặt</h2>

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
              <div className="col-md-4">
                <div className="poly-card p-0 overflow-hidden sticky-top" style={{ top: '80px', zIndex: 10, backgroundColor: 'var(--bs-body-bg, white)' }}>
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

              <div className="col-md-8">
                <div className="tab-content">
                  
                  {activeTab === 'account' && (
                    <div className="poly-card p-4 rounded-3 shadow-sm border border-light" style={{ backgroundColor: 'var(--bs-body-bg, white)' }}>
                      <h4 className="fw-bold mb-1">Thông tin cá nhân</h4>
                      <p className="text-muted mb-4" style={{ fontSize: '14.5px' }}>Quản lý thông tin định danh của bạn trên hệ thống PolyHUB.</p>
                      
                      <form onSubmit={handleUpdateAccount}>
                        <div className="row g-3 mb-3">
                          <div className="col-sm-6">
                            <label className="form-label fw-medium" style={{ fontSize: '14px' }}>Họ và Tên</label>
                            <input 
                              type="text" 
                              className="form-control form-control-poly" 
                              value={fullname}
                              onChange={(e) => setFullname(e.target.value)}
                              placeholder="Họ và tên của bạn"
                              required
                            />
                          </div>
                          <div className="col-sm-6">
                            <label className="form-label fw-medium" style={{ fontSize: '14px' }}>Mã Sinh Viên</label>
                            <input 
                              type="text" 
                              className="form-control form-control-poly bg-secondary bg-opacity-10 text-muted" 
                              value={user.username} 
                              readOnly 
                            />
                          </div>
                        </div>
                        
                        <div className="row g-3 mb-3">
                          <div className="col-sm-6">
                            <label className="form-label fw-medium" style={{ fontSize: '14px' }}>Điện thoại</label>
                            <input 
                              type="tel" 
                              className="form-control form-control-poly" 
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="Nhập số điện thoại"
                            />
                          </div>
                          <div className="col-sm-6">
                            <label className="form-label fw-medium" style={{ fontSize: '14px' }}>Email liên hệ</label>
                            <input 
                              type="email" 
                              className="form-control form-control-poly bg-secondary bg-opacity-10 text-muted" 
                              value={user.email} 
                              readOnly 
                            />
                          </div>
                        </div>

                        <div className="row g-3 mb-3">
                          <div className="col-sm-6">
                            <label className="form-label fw-medium" style={{ fontSize: '14px' }}>Chuyên ngành</label>
                            <input 
                              type="text" 
                              className="form-control form-control-poly" 
                              value={major}
                              onChange={(e) => setMajor(e.target.value)}
                              placeholder="VD: Thiết kế trang web, Agile..."
                            />
                          </div>
                          <div className="col-sm-6">
                            <label className="form-label fw-medium" style={{ fontSize: '14px' }}>Giới tính</label>
                            <select 
                              className="form-select form-control-poly" 
                              value={gender ? "true" : "false"}
                              onChange={(e) => setGender(e.target.value === "true")}
                            >
                              <option value="true">Nam</option>
                              <option value="false">Nữ</option>
                            </select>
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-medium" style={{ fontSize: '14px' }}>Ngày sinh</label>
                          <input 
                            type="date" 
                            className="form-control form-control-poly" 
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                          />
                        </div>

                        <div className="mb-4">
                          <label className="form-label fw-medium" style={{ fontSize: '14px' }}>Giới thiệu ngắn (Tiểu sử)</label>
                          <textarea 
                            className="form-control form-control-poly" 
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

                  {activeTab === 'security' && (
                    <div className="poly-card p-4 rounded-3 shadow-sm border border-light" style={{ backgroundColor: 'var(--bs-body-bg, white)' }}>
                      <div className="d-flex align-items-center mb-4">
                        <div className="rounded-circle bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px' }}>
                          <i className="bi bi-key-fill text-poly fs-4"></i>
                        </div>
                        <div>
                          <h4 className="fw-bold mb-1">Đổi mật khẩu</h4>
                          <p className="text-muted mb-0" style={{ fontSize: '14px' }}>Bảo vệ tài khoản bằng mật khẩu mạnh và an toàn.</p>
                        </div>
                      </div>

                      <form onSubmit={handleChangePassword} className="mb-4">
                        <div className="mb-3">
                          <label className="form-label fw-semibold" style={{ fontSize: '14px' }}>Mật khẩu hiện tại</label>
                          <input 
                            type="password" 
                            className="form-control form-control-poly" 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Nhập mật khẩu đang sử dụng"
                            required
                          />
                        </div>
                        
                        <div className="row g-3 mb-3">
                          <div className="col-md-6">
                            <label className="form-label fw-semibold" style={{ fontSize: '14px' }}>Mật khẩu mới</label>
                            <input 
                              type="password" 
                              className="form-control form-control-poly" 
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
                            <label className="form-label fw-semibold" style={{ fontSize: '14px' }}>Xác nhận mật khẩu mới</label>
                            <input 
                              type="password" 
                              className="form-control form-control-poly" 
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

                      <div className="border-top pt-4">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h5 className="fw-bold mb-1">Xác thực 2 yếu tố (2FA)</h5>
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

                  {activeTab === 'display' && (
                    <div className="poly-card p-4 rounded-3 shadow-sm border border-light" style={{ backgroundColor: 'var(--bs-body-bg, white)' }}>
                      <h4 className="fw-bold mb-4">Giao diện hệ thống</h4>
                      
                      <h6 className="fw-semibold mb-3">Chế độ hiển thị</h6>
                      <div className="d-flex gap-3 mb-4">
                        <div className="theme-option text-center">
                          <div 
                            onClick={() => handleThemeModeSelect('light')}
                            className={`border rounded p-2 mb-2 shadow-sm cursor-pointer ${themeMode === 'light' ? 'border-primary border-2' : ''}`} 
                            style={{ width: '120px', height: '80px', backgroundColor: '#ffffff' }}
                          >
                            <div className="w-100 bg-light rounded mb-1" style={{ height: '15px' }}></div>
                            <div className="w-75 bg-light rounded" style={{ height: '30px' }}></div>
                          </div>
                          <span className="fw-medium" style={{ fontSize: '13.5px' }}>Giao diện Sáng</span>
                        </div>
                        <div className="theme-option text-center">
                          <div 
                            onClick={() => handleThemeModeSelect('dark')}
                            className={`border rounded p-2 mb-2 shadow-sm cursor-pointer ${themeMode === 'dark' ? 'border-primary border-2' : ''}`} 
                            style={{ width: '120px', height: '80px', backgroundColor: '#1e293b' }}
                          >
                            <div className="w-100 bg-secondary bg-opacity-25 rounded mb-1" style={{ height: '15px' }}></div>
                            <div className="w-75 bg-secondary bg-opacity-25 rounded" style={{ height: '30px' }}></div>
                          </div>
                          <span className="fw-medium" style={{ fontSize: '13.5px' }}>Giao diện Tối</span>
                        </div>
                      </div>

                      <div className="border-top pt-4">
                        <h6 className="fw-semibold mb-3">Ngôn ngữ</h6>
                        <select 
                          className="form-select form-control-poly w-50"
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