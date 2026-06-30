'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI } from '@/lib/api';
import CustomDatePicker from '@/components/common/CustomDatePicker';
import '@/styles/auth.css';

export default function RegisterPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loadingState, setLoadingState] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    document.body.classList.add('auth-body');
    return () => {
      document.body.classList.remove('auth-body');
    };
  }, []);

  // Particle background effect
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
    setSuccessMsg('');
    
    const errs: Record<string, string> = {};

    // 1. Validate fullname
    const cleanFullname = fullname.trim();
    if (!cleanFullname) {
      errs.fullname = 'Vui lòng nhập họ và tên';
    } else if (cleanFullname.length < 2) {
      errs.fullname = 'Họ tên phải có ít nhất 2 ký tự';
    } else if (!/^[\p{L}\s]+$/u.test(cleanFullname)) {
      errs.fullname = 'Họ tên không chứa số hoặc ký tự đặc biệt';
    }

    // 2. Validate username (Mã sinh viên FPT: VD PS12345, PC12345)
    const cleanUsername = username.trim().toUpperCase();
    if (!cleanUsername) {
      errs.username = 'Vui lòng nhập mã sinh viên';
    } else if (!/^[A-Z]{2}\d{5}$/.test(cleanUsername)) {
      errs.username = 'Mã sinh viên không hợp lệ (VD: PS12345, PC12345)';
    }

    // 3. Validate email (Chấp nhận fpt.edu.vn và fe.edu.vn)
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      errs.email = 'Vui lòng nhập email';
    } else if (!/^[a-zA-Z0-9._%+-]+@(fpt\.edu\.vn|fe\.edu\.vn)$/i.test(cleanEmail)) {
      errs.email = 'Vui lòng sử dụng email FPT Polytechnic (@fpt.edu.vn hoặc @fe.edu.vn)';
    }

    // 4. Validate phone
    const cleanPhone = phone.trim();
    if (cleanPhone) {
      if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(cleanPhone)) {
        errs.phone = 'Số điện thoại không hợp lệ (Bắt đầu bằng 03,05,07,08,09)';
      }
    }

    // 5. Validate birthday
    if (birthday) {
      const birthDate = new Date(birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 15) {
        errs.birthday = 'Bạn phải từ 15 tuổi trở lên';
      } else if (age > 80) {
        errs.birthday = 'Năm sinh không hợp lệ';
      }
    }

    // 6. Validate password
    if (!password) {
      errs.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
      errs.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    // 7. Validate confirmPassword
    if (!confirmPassword) {
      errs.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Mật khẩu xác nhận không khớp!';
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setErrorMsg('Vui lòng kiểm tra lại thông tin nhập liệu.');
      return;
    }

    setFieldErrors({});
    setLoadingState(true);

    try {
      await fetchAPI('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullname: cleanFullname,
          username: cleanUsername,
          email: cleanEmail,
          password,
          confirmPassword,
          phone: cleanPhone || null,
          birthday: birthday || null,
        }),
      });
      setSuccessMsg('Đăng ký thành công! Đang chuyển hướng...');
      setTimeout(() => {
        router.push('/login?registerSuccess=true');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng ký thất bại. Vui lòng thử lại!');
      setLoadingState(false);
    }
  };

  return (
    <>
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }} />

      <div className="auth-wrapper">
        <div className="auth-card" style={{ maxWidth: '500px', position: 'relative', zIndex: 10 }}>
          
          <div className="text-center mb-4 pb-2">
            <div className="d-inline-flex align-items-center justify-content-center mb-3 bg-poly-soft rounded-circle" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-person-plus-fill text-poly fs-4"></i>
            </div>
            <h1 className="auth-title text-dark">Tạo tài khoản mới</h1>
            <p className="auth-subtitle">Tham gia cộng đồng PolyHUB ngay hôm nay</p>
          </div>

          {errorMsg && (
            <div className="alert-custom alert-error">
              <i className="bi bi-exclamation-circle-fill"></i> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="alert-custom alert-success">
              <i className="bi bi-check-circle-fill"></i> {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 form-group">
                <label className="form-label" htmlFor="fullname">Họ và tên</label>
                <div className="input-wrapper">
                  <i className="bi bi-person-badge input-icon"></i>
                  <input 
                    type="text" 
                    className={`form-control-custom ${fieldErrors.fullname ? 'error-field' : ''}`} 
                    id="fullname" 
                    value={fullname}
                    onChange={(e) => { setFullname(e.target.value); setFieldErrors(p => ({...p, fullname: ''})); }}
                    placeholder="Nhập họ và tên" 
                    required 
                    autoFocus
                  />
                </div>
                {fieldErrors.fullname && <span className="auth-field-error">⚠ {fieldErrors.fullname}</span>}
              </div>
              <div className="col-md-6 form-group">
                <label className="form-label" htmlFor="username">Mã sinh viên</label>
                <div className="input-wrapper">
                  <i className="bi bi-card-text input-icon"></i>
                  <input 
                    type="text" 
                    className={`form-control-custom ${fieldErrors.username ? 'error-field' : ''}`} 
                    id="username" 
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setFieldErrors(p => ({...p, username: ''})); }}
                    placeholder="VD: PS12345" 
                    required 
                  />
                </div>
                {fieldErrors.username && <span className="auth-field-error">⚠ {fieldErrors.username}</span>}
              </div>
            </div>

            <div className="row">
              <div className="col-12 form-group">
                <label className="form-label" htmlFor="email">Địa chỉ Email</label>
                <div className="input-wrapper">
                  <i className="bi bi-envelope input-icon"></i>
                  <input 
                    type="email" 
                    className={`form-control-custom ${fieldErrors.email ? 'error-field' : ''}`} 
                    id="email" 
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({...p, email: ''})); }}
                    placeholder="VD: email@fpt.edu.vn" 
                    required 
                  />
                </div>
                {fieldErrors.email && <span className="auth-field-error">⚠ {fieldErrors.email}</span>}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 form-group">
                <label className="form-label" htmlFor="phone">Số điện thoại</label>
                <div className="input-wrapper">
                  <i className="bi bi-telephone input-icon"></i>
                  <input 
                    type="tel" 
                    className={`form-control-custom ${fieldErrors.phone ? 'error-field' : ''}`} 
                    id="phone" 
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setFieldErrors(p => ({...p, phone: ''})); }}
                    placeholder="VD: 0912345678" 
                  />
                </div>
                {fieldErrors.phone && <span className="auth-field-error">⚠ {fieldErrors.phone}</span>}
              </div>
              <div className="col-md-6 form-group">
                <label className="form-label" htmlFor="birthday">Ngày sinh</label>
                <CustomDatePicker
                  id="birthday"
                  value={birthday}
                  onChange={(val) => { setBirthday(val); setFieldErrors(p => ({...p, birthday: ''})); }}
                  error={!!fieldErrors.birthday}
                  placeholder="Chọn ngày sinh"
                />
                {fieldErrors.birthday && <span className="auth-field-error" style={{ marginTop: '6px' }}>⚠ {fieldErrors.birthday}</span>}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 form-group">
                <label className="form-label" htmlFor="password">Mật khẩu</label>
                <div className="input-wrapper">
                  <i className="bi bi-lock input-icon"></i>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    className={`form-control-custom pe-5 ${fieldErrors.password ? 'error-field' : ''}`} 
                    id="password" 
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({...p, password: ''})); }}
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
                {fieldErrors.password && <span className="auth-field-error">⚠ {fieldErrors.password}</span>}
              </div>
              <div className="col-md-6 form-group">
                <label className="form-label" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                <div className="input-wrapper">
                  <i className="bi bi-shield-lock input-icon"></i>
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    className={`form-control-custom pe-5 ${fieldErrors.confirmPassword ? 'error-field' : ''}`} 
                    id="confirmPassword" 
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(p => ({...p, confirmPassword: ''})); }}
                    placeholder="••••••••" 
                    required 
                  />
                  <button 
                    type="button" 
                    className="btn-toggle-pass" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
                {fieldErrors.confirmPassword && <span className="auth-field-error">⚠ {fieldErrors.confirmPassword}</span>}
              </div>
            </div>

            <div className="form-check custom-check mb-4 mt-2">
              <input type="checkbox" className="form-check-input shadow-none" id="agree-terms" required />
              <label className="form-check-label" htmlFor="agree-terms">
                Tôi đồng ý với các <a href="#" className="text-poly text-decoration-none fw-medium">Điều khoản & Dịch vụ</a>
              </label>
            </div>

            <button type="submit" className="btn-submit" disabled={loadingState}>
              {loadingState ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : 'Đăng ký tài khoản'}
            </button>
          </form>

          <div className="text-center mt-4 pt-2">
            <span style={{ fontSize: '14px', color: '#6B7280' }}>Đã có tài khoản? </span>
            <Link href="/login" className="text-poly text-decoration-none fw-semibold" style={{ fontSize: '14px' }}>Đăng nhập</Link>
          </div>

        </div>
      </div>
    </>
  );
}
