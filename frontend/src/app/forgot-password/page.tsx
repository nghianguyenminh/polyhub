'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import '@/styles/auth.css';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    document.body.classList.add('auth-body');
    return () => {
      document.body.classList.remove('auth-body');
    };
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      await fetchAPI('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      setStep(2);
      setSuccessMsg('Mã OTP đã được gửi đến email của bạn.');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await fetchAPI('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword, confirmPassword })
      });

      router.push('/login?resetSuccess=true');
    } catch (err: any) {
      setError(err.message || 'Mã OTP không đúng hoặc đã hết hạn.');
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="row w-100 justify-content-center">
        <div className="col-md-8 col-lg-5 col-xl-4">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body p-4 p-md-5">
              <div className="text-center mb-4">
                <Link href="/" className="text-decoration-none">
                  <h2 className="fw-bold text-primary mb-0" style={{ letterSpacing: '-1px' }}>Poly<span className="text-dark">HUB</span></h2>
                </Link>
                <p className="text-muted mt-2">
                  {step === 1 ? 'Khôi phục mật khẩu tài khoản' : 'Xác thực OTP và đặt lại mật khẩu'}
                </p>
                {step === 2 && (
                  <div className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill mt-2">
                    <i className="bi bi-envelope-check me-1"></i> Đã gửi đến {email}
                  </div>
                )}
              </div>

              {error && (
                <div className="alert alert-danger rounded-3 border-0 py-2" role="alert">
                  <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
                </div>
              )}

              {successMsg && (
                <div className="alert alert-success rounded-3 border-0 py-2" role="alert">
                  <i className="bi bi-check-circle-fill me-2"></i>{successMsg}
                </div>
              )}

              {step === 1 ? (
                <form onSubmit={handleSendOtp}>
                  <div className="mb-4">
                    <label htmlFor="email" className="form-label fw-medium text-dark">Email đăng nhập</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0 text-muted">
                        <i className="bi bi-envelope"></i>
                      </span>
                      <input 
                        type="email" 
                        className="form-control border-start-0 ps-0 shadow-none" 
                        id="email" 
                        placeholder="Nhập email của bạn..." 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="form-text mt-2 text-muted">
                      Hệ thống sẽ gửi một mã OTP gồm 6 chữ số đến email này.
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 py-2 rounded-3 fw-medium mb-3 shadow-sm"
                    disabled={loading}
                  >
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Đang gửi...</>
                    ) : (
                      'Gửi mã xác nhận'
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyAndReset}>
                  <div className="mb-3">
                    <label htmlFor="otp" className="form-label fw-medium text-dark">Mã OTP (6 số)</label>
                    <input 
                      type="text" 
                      className="form-control rounded-3 shadow-none text-center fs-5 tracking-widest py-2" 
                      id="otp" 
                      maxLength={6}
                      placeholder="• • • • • •" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      required 
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="newPassword" className="form-label fw-medium text-dark">Mật khẩu mới</label>
                    <input 
                      type="password" 
                      className="form-control rounded-3 shadow-none" 
                      id="newPassword" 
                      placeholder="Nhập mật khẩu mới..." 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required 
                      minLength={8}
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="form-label fw-medium text-dark">Xác nhận mật khẩu mới</label>
                    <input 
                      type="password" 
                      className="form-control rounded-3 shadow-none" 
                      id="confirmPassword" 
                      placeholder="Nhập lại mật khẩu mới..." 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required 
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 py-2 rounded-3 fw-medium shadow-sm"
                    disabled={loading}
                  >
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Đang xử lý...</>
                    ) : (
                      'Đổi mật khẩu'
                    )}
                  </button>
                  <div className="text-center mt-3">
                    <button 
                      type="button" 
                      className="btn btn-link text-decoration-none fw-medium text-muted hover-primary"
                      onClick={() => {
                        setStep(1);
                        setSuccessMsg('');
                        setError('');
                        setOtp('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                    >
                      Nhập lại Email
                    </button>
                  </div>
                </form>
              )}

              <div className="text-center mt-4">
                <Link href="/login" className="text-decoration-none fw-medium text-muted hover-primary">
                  <i className="bi bi-arrow-left me-1"></i> Quay lại Đăng nhập
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
