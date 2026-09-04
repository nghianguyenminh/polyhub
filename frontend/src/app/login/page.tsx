'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import '@/styles/auth.css';
import SplashScreen from '@/components/layout/SplashScreen';

function LoginContent() {
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSplash, setShowSplash] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingState, setLoadingState] = useState(false);

  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [isPhoneAvailable, setIsPhoneAvailable] = useState(false);
  const [phoneString, setPhoneString] = useState('********89');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const showLogoutSuccess = searchParams.get('logout') === 'true';
  const showRegisterSuccess = searchParams.get('registerSuccess') === 'true';
  const showResetSuccess = searchParams.get('resetSuccess') === 'true';

  useEffect(() => {
  const token = searchParams.get('token');
  if (token) {
    localStorage.setItem('token', token);
    window.location.href = '/';
  }
}, [searchParams]);

  useEffect(() => {
    if (user) {
      if (user.role && ['SUPER_ADMIN', 'ADMIN', 'USER_ADMIN', 'CONTENT_ADMIN'].includes(user.role)) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [user, router]);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (!hasSeenSplash) {
      setShowSplash(true);
      sessionStorage.setItem('hasSeenSplash', 'true');
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particlesArray: Particle[] = [];
    const techIcons = ['\uF28E', '\uF30C', '\uF288', '\uF2A2', '\uF3E1', '\uF6B0'];

    const mouse = {
      x: null as number | null,
      y: null as number | null,
      radius: 150,
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    };

    const handleMouseOut = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);

    class Particle {
      x: number;
      y: number;
      size: number;
      icon: string;
      vx: number;
      vy: number;
      baseOpacity: number;
      opacity: number;
      opacityDirection: number;
      mass: number;

      constructor() {
        this.x = Math.random() * (canvas?.width || window.innerWidth);
        this.y = Math.random() * (canvas?.height || window.innerHeight);
        this.size = Math.random() * 12 + 12;
        this.icon = techIcons[Math.floor(Math.random() * techIcons.length)];
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.baseOpacity = Math.random() * 0.3 + 0.1;
        this.opacity = this.baseOpacity;
        this.opacityDirection = Math.random() > 0.5 ? 1 : -1;
        this.mass = this.size / 2;
      }

      update() {
        if (mouse.x !== null && mouse.y !== null) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < mouse.radius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouse.radius - distance) / mouse.radius;
            const directionX = forceDirectionX * force * (this.mass * 0.1);
            const directionY = forceDirectionY * force * (this.mass * 0.1);

            this.x += directionX;
            this.y += directionY;
          }
        }

        this.x += this.vx;
        this.y += this.vy;

        if (canvas) {
          if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
          if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;
        }

        this.opacity += 0.002 * this.opacityDirection;
        if (this.opacity >= 0.6) this.opacityDirection = -1;
        if (this.opacity <= 0.1) this.opacityDirection = 1;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(242, 113, 37, ${this.opacity})`;
        ctx.font = `${this.size}px "bootstrap-icons"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x, this.y);
      }
    }

    const init = () => {
      particlesArray = [];
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      let numberOfParticles = Math.floor((width * height) / 25000);
      if (numberOfParticles > 60) numberOfParticles = 60;
      if (width <= 768) numberOfParticles = 25;

      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
      }
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();

        for (let j = i; j < particlesArray.length; j++) {
          const dx = particlesArray[i].x - particlesArray[j].x;
          const dy = particlesArray[i].y - particlesArray[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            const lineOpacity = 0.15 - (distance / 120) * 0.15;
            ctx.strokeStyle = `rgba(242, 113, 37, ${lineOpacity})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
            ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      init();
    };

    window.addEventListener('resize', handleResize);

    document.fonts.ready.then(() => {
      init();
      animate();
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoadingState(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!');
      }

      if (data.status === 'REQUIRES_2FA') {
        setMaskedEmail(data.email);
        
        if (data.phone) {
          setIsPhoneAvailable(true);
          const phoneStr = String(data.phone);
          const maskedPhone = "********" + phoneStr.slice(-2);
          setPhoneString(maskedPhone);
        } else {
          setIsPhoneAvailable(false);
        }
        
        setStep(2);
        setLoadingState(false);
        return;
      }

      await login(username, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!');
      setLoadingState(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoadingState(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, code: otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Mã xác minh không hợp lệ!');
      }

      localStorage.setItem('token', data.token);

      if (data.user && data.user.role && ['SUPER_ADMIN', 'ADMIN', 'USER_ADMIN', 'CONTENT_ADMIN'].includes(data.user.role)) {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Xác minh thất bại!');
      setLoadingState(false);
    }
  };

  const handleTryOtherWay = async () => {
    if (!isPhoneAvailable) {
      setErrorMsg('Phương thức không khả dụng do bạn chưa xác minh số điện thoại.');
      return;
    }

    setLoadingState(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/send-2fa-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể gửi mã SMS. Vui lòng thử lại!');
      }

      setMethod('phone');
      setOtp('');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingState(false);
    }
  };

  return (
    <>
      {showSplash && <SplashScreen />}
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }} />

      <div className="auth-wrapper">
        <div className="auth-card" style={{ position: 'relative', zIndex: 10 }}>
          
          <div className="text-center mb-4 pb-2">
            <div className="d-inline-flex align-items-center justify-content-center mb-3 bg-poly-soft rounded-circle" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-hexagon-fill text-poly fs-4"></i>
            </div>
            <h1 className="auth-title text-dark">
              {step === 1 ? 'Chào mừng trở lại!' : 'Xác minh bảo mật'}
            </h1>
            <p className="auth-subtitle">
              {step === 1 
                ? 'Vui lòng đăng nhập vào tài khoản của bạn' 
                : method === 'email' 
                  ? 'Nhập mã 6 số được gửi về email của bạn' 
                  : 'Nhập mã 6 số được gửi về số điện thoại của bạn'}
            </p>
          </div>

          {errorMsg && (
            <div className="alert-custom alert-error">
              <i className="bi bi-exclamation-circle-fill"></i> {errorMsg}
            </div>
          )}

          {showLogoutSuccess && step === 1 && (
            <div className="alert-custom alert-success">
              <i className="bi bi-check-circle-fill"></i> Bạn đã đăng xuất thành công.
            </div>
          )}

          {showRegisterSuccess && step === 1 && (
            <div className="alert-custom alert-success">
              <i className="bi bi-check-circle-fill"></i> Đăng ký thành công! Vui lòng đăng nhập.
            </div>
          )}

          {showResetSuccess && step === 1 && (
            <div className="alert-custom alert-success">
              <i className="bi bi-check-circle-fill"></i> Mật khẩu đã được cấp lại thành công! Vui lòng đăng nhập.
            </div>
          )}

          {step === 1 ? (
            <>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="username">Email hoặc Mã sinh viên</label>
                  <div className="input-wrapper">
                    <i className="bi bi-person input-icon"></i>
                    <input 
                      type="text" 
                      className="form-control-custom" 
                      id="username" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nhập email hoặc mã sinh viên" 
                      required 
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label mb-0" htmlFor="password">Mật khẩu</label>
                    <Link href="/forgot-password" className="text-poly text-decoration-none fw-medium" style={{ fontSize: '13px' }}>Quên mật khẩu?</Link>
                  </div>
                  <div className="input-wrapper">
                    <i className="bi bi-lock input-icon"></i>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className="form-control-custom pe-5" 
                      id="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      required 
                    />
                    <button 
                      type="button" 
                      className="btn-toggle-pass" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="form-check custom-check mb-4">
                  <input type="checkbox" className="form-check-input shadow-none" id="remember-me" />
                  <label className="form-check-label" htmlFor="remember-me">Ghi nhớ đăng nhập</label>
                </div>

                <button type="submit" className="btn-submit" disabled={loadingState}>
                  {loadingState ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : 'Đăng nhập'}
                </button>
              </form>

              <div className="position-relative text-center mt-4 mb-3">
                <hr style={{ borderColor: '#E5E7EB', margin: 0 }} />
                <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted" style={{ fontSize: '14px' }}>
                  Hoặc
                </span>
              </div>

              <a 
                href={`${API_BASE_URL}/oauth2/authorization/google`} 
                className="btn-submit d-flex align-items-center justify-content-center text-decoration-none w-100"
                style={{ backgroundColor: '#ffffff', color: '#374151', border: '1px solid #D1D5DB' }}
              >
                <i className="bi bi-google me-2" style={{ color: '#EA4335' }}></i>
                Đăng nhập với Google
              </a>

              <div className="text-center mt-4 pt-2">
                <span style={{ fontSize: '14px', color: '#6B7280' }}>Chưa có tài khoản? </span>
                <Link href="/register" className="text-poly text-decoration-none fw-semibold" style={{ fontSize: '14px' }}>Đăng ký ngay</Link>
              </div>
            </>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div className="text-center mb-4">
                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                  {method === 'email' ? 'Mã xác minh đã được gửi đến:' : 'Mã xác minh SMS đã được gửi đến:'}
                </p>
                <strong className="text-dark d-block p-2 bg-light rounded border">
                  {method === 'email' ? maskedEmail : phoneString}
                </strong>
              </div>

              <div className="form-group mb-4">
                <label className="form-label text-center w-100" htmlFor="otp">Nhập mã OTP</label>
                <div className="input-wrapper">
                  <i className="bi bi-shield-lock input-icon"></i>
                  <input
                    type="text"
                    className="form-control-custom text-center fw-bold"
                    style={{ letterSpacing: '4px', fontSize: '18px' }}
                    id="otp"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="000000"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" className="btn-submit mb-3" disabled={loadingState}>
                {loadingState ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : 'Xác minh'}
              </button>

              <button 
                type="button" 
                className="btn btn-link text-decoration-none w-100" 
                style={{ color: '#6B7280', fontSize: '14px' }}
                onClick={() => {
                  setStep(1);
                  setMethod('email');
                  setErrorMsg('');
                }} 
                disabled={loadingState}
              >
                <i className="bi bi-arrow-left me-1"></i> Quay lại đăng nhập
              </button>
            </form>
          )}

        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}