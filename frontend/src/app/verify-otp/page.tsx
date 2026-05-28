'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

export default function VerifyOtpPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Lấy email đã lưu từ session storage sau khi quên mật khẩu thành công
    const storedEmail = sessionStorage.getItem('resetEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      router.replace('/forgot-password');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await fetchAPI('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword, confirmPassword })
      });

      // Thành công, xoá email khỏi session và chuyển về login
      sessionStorage.removeItem('resetEmail');
      router.push('/login?resetSuccess=true');
    } catch (err: any) {
      setError(err.message || 'Mã OTP không đúng hoặc đã hết hạn.');
      setLoading(false);
    }
  };

  if (!email) return null; // Wait for useEffect

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
                <p className="text-muted mt-2">Xác thực mã OTP</p>
                <div className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill mt-2">
                  <i className="bi bi-envelope-check me-1"></i> Đã gửi đến {email}
                </div>
              </div>

              {error && (
                <div className="alert alert-danger rounded-3 border-0 py-2" role="alert">
                  <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
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
              </form>
              
              <div className="text-center mt-4">
                <Link href="/forgot-password" className="text-decoration-none fw-medium text-muted hover-primary">
                  <i className="bi bi-arrow-left me-1"></i> Trở lại nhập Email
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
