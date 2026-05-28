'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      // Vì fetchAPI tự động chèn JWT nếu có, nhưng forgot-password là public, ta vẫn dùng được
      await fetchAPI('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      // Lưu email vào sessionStorage để chuyển sang trang Verify OTP
      sessionStorage.setItem('resetEmail', email);
      router.push('/verify-otp');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
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
                <p className="text-muted mt-2">Khôi phục mật khẩu tài khoản</p>
              </div>

              {error && (
                <div className="alert alert-danger rounded-3 border-0 py-2" role="alert">
                  <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
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
