'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import CustomDatePicker from '@/components/common/CustomDatePicker';
import { useToast } from '@/contexts/ToastContext';
import '@/styles/mentors.css';
import '@/styles/mentorRegister.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StepProps {
  visible: boolean;
  direction: 'forward' | 'backward';
}

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Cá nhân', icon: '👤', title: 'Thông tin cá nhân' },
  { id: 2, label: 'Kinh nghiệm', icon: '💼', title: 'Kinh nghiệm & Động lực' },
  { id: 3, label: 'Hồ sơ', icon: '📎', title: 'Hồ sơ đính kèm' },
  { id: 4, label: 'Xác nhận', icon: '✅', title: 'Xác nhận & Gửi' },
];





export default function MentorRegisterPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [userStatus, setUserStatus] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [agreed, setAgreed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  // Form states
  const [fullname, setFullname] = useState('');
  const [cccdNumber, setCccdNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [motivation, setMotivation] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [degreeFile, setDegreeFile] = useState<File | null>(null);

  useEffect(() => { checkStatus(); }, []);

  useEffect(() => {
    if (user) {
      setFullname(prev => prev || user.fullname || '');
      setEmail(prev => prev || user.email || '');
      setPhone(prev => prev || user.phone || '');
      if (user.birthday) {
        const birthdayStr = user.birthday;
        setBirthday(prev => prev || birthdayStr.split('T')[0]);
      }
    }
  }, [user]);

  const checkStatus = async () => {
    try {
      const data = await fetchAPI('/api/mentors/status');
      setUserStatus(data);
      if (data.isMentor) router.push('/mentors');
    } catch {
      router.push('/login');
    } finally {
      setPageLoading(false);
    }
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      // 1. Validate Họ và Tên (Không chứa số và ký tự đặc biệt, tối thiểu 2 ký tự)
      if (!fullname.trim()) {
        errs.fullname = 'Vui lòng nhập họ tên đầy đủ';
      } else if (fullname.trim().length < 2) {
        errs.fullname = 'Họ tên phải có ít nhất 2 ký tự';
      } else if (!/^[\p{L}\s]+$/u.test(fullname.trim())) {
        errs.fullname = 'Họ tên không chứa số hoặc ký tự đặc biệt';
      }

      // 2. Validate CCCD/CMND (Chính xác 9 hoặc 12 chữ số)
      const cleanCCCD = cccdNumber.replace(/\s/g, '');
      if (!cleanCCCD) {
        errs.cccdNumber = 'Vui lòng nhập số CCCD/CMND';
      } else if (!/^\d+$/.test(cleanCCCD)) {
        errs.cccdNumber = 'CCCD/CMND chỉ được chứa các chữ số';
      } else if (cleanCCCD.length !== 9 && cleanCCCD.length !== 12) {
        errs.cccdNumber = 'Số CCCD phải có 12 chữ số (hoặc CMND 9 chữ số)';
      } else if (cleanCCCD.length === 12) {
        const provinceCode = parseInt(cleanCCCD.slice(0, 3), 10);
        if (provinceCode < 1 || provinceCode > 96) {
          errs.cccdNumber = 'Mã tỉnh/thành phố trên CCCD (3 số đầu) không hợp lệ';
        }

        if (birthday) {
          const birthYear = new Date(birthday).getFullYear();
          const birthYearSuffix = birthYear.toString().slice(-2);
          const cccdYearSuffix = cleanCCCD.slice(4, 6);
          if (cccdYearSuffix !== birthYearSuffix) {
            // errs.cccdNumber = 'Năm sinh trên CCCD (số thứ 5 & 6) không khớp với ngày sinh';
          }
          else {
            // Kiểm tra chữ số thứ 4: Mã thế kỷ và giới tính
            const genderDigit = parseInt(cleanCCCD.charAt(3), 10);
            let expectedDigitNam: number | null = null;
            let expectedDigitNu: number | null = null;

            if (birthYear >= 1900 && birthYear <= 1999) {
              expectedDigitNam = 0;
              expectedDigitNu = 1;
            } else if (birthYear >= 2000 && birthYear <= 2099) {
              expectedDigitNam = 2;
              expectedDigitNu = 3;
            } else if (birthYear >= 2100 && birthYear <= 2199) {
              expectedDigitNam = 4;
              expectedDigitNu = 5;
            } else if (birthYear >= 2200 && birthYear <= 2299) {
              expectedDigitNam = 6;
              expectedDigitNu = 7;
            } else if (birthYear >= 1800 && birthYear <= 1899) {
              expectedDigitNam = 8;
              expectedDigitNu = 9;
            }

            if (expectedDigitNam !== null && expectedDigitNu !== null) {
              if (user && user.gender !== undefined) {
                const expectedDigit = user.gender ? expectedDigitNam : expectedDigitNu;
                if (genderDigit !== expectedDigit) {
                  const genderText = user.gender ? 'Nam' : 'Nữ';
                  const centuryText = birthYear >= 2000 ? 'thế kỷ 21' : 'thế kỷ 20';
                  errs.cccdNumber = `Ký tự thứ 4 phải là ${expectedDigit} (dành cho giới tính ${genderText} sinh vào ${centuryText})`;
                }
              } else {
                if (genderDigit !== expectedDigitNam && genderDigit !== expectedDigitNu) {
                  errs.cccdNumber = `Ký tự thứ 4 không khớp với mã thế kỷ sinh ${birthYear}`;
                }
              }
            }
          }
        }
      }

      // 3. Validate Email (Chuẩn RFC 5322)
      if (!email.trim()) {
        errs.email = 'Vui lòng nhập email';
      } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
        errs.email = 'Định dạng email không hợp lệ (VD: ten@domain.com)';
      }

      // 4. Validate Số điện thoại (Chuẩn Việt Nam: 10 số, bắt đầu bằng 03,05,07,08,09)
      if (!phone.trim()) {
        errs.phone = 'Vui lòng nhập số điện thoại';
      } else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(phone.replace(/\s/g, ''))) {
        errs.phone = 'Số điện thoại không hợp lệ';
      }

      // 5. Validate Ngày sinh (Phải đủ 18 tuổi)
      if (!birthday) {
        errs.birthday = 'Vui lòng chọn ngày sinh';
      } else {
        const birthDate = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          errs.birthday = 'Bạn phải đủ 18 tuổi để trở thành Mentor';
        } else if (age > 100) {
          errs.birthday = 'Năm sinh không hợp lệ';
        }
      }
    }

    if (step === 2) {
      // 6. Validate Textarea (Kiểm soát số lượng ký tự tối thiểu để đảm bảo chất lượng nội dung)
      if (!introduction.trim()) {
        errs.introduction = 'Vui lòng điền phần giới thiệu bản thân';
      } else if (introduction.trim().length < 50) {
        errs.introduction = 'Nội dung quá ngắn. Vui lòng nhập tối thiểu 50 ký tự';
      }

      if (!motivation.trim()) {
        errs.motivation = 'Vui lòng điền động lực của bạn';
      } else if (motivation.trim().length < 50) {
        errs.motivation = 'Nội dung quá ngắn. Vui lòng nhập tối thiểu 50 ký tự';
      }
    }

    if (step === 3) {
      // 7. Validate File (Bắt lỗi cả dung lượng và định dạng mở rộng)
      const MAX_CV_SIZE = 10 * 1024 * 1024; // 10MB
      const MAX_OTHER_SIZE = 5 * 1024 * 1024; // 5MB
      const ALLOWED_DOCS = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const ALLOWED_IMAGES = ['image/jpeg', 'image/png'];

      if (!cvFile) {
        errs.cvFile = 'Vui lòng tải lên CV của bạn';
      } else {
        if (cvFile.size > MAX_CV_SIZE) {
          errs.cvFile = 'Dung lượng CV vượt quá giới hạn 10MB';
        }
        if (!ALLOWED_DOCS.includes(cvFile.type)) {
          errs.cvFile = 'Định dạng CV không hợp lệ (Chỉ nhận PDF, DOC, DOCX)';
        }
      }

      if (certificateFile) {
        if (certificateFile.size > MAX_OTHER_SIZE) {
          errs.certificateFile = 'Dung lượng chứng chỉ vượt quá giới hạn 5MB';
        }
        if (![...ALLOWED_DOCS, ...ALLOWED_IMAGES].includes(certificateFile.type)) {
          errs.certificateFile = 'Định dạng chứng chỉ không hợp lệ';
        }
      }

      if (degreeFile) {
        if (degreeFile.size > MAX_OTHER_SIZE) {
          errs.degreeFile = 'Dung lượng bằng cấp vượt quá giới hạn 5MB';
        }
        if (![...ALLOWED_DOCS, ...ALLOWED_IMAGES].includes(degreeFile.type)) {
          errs.degreeFile = 'Định dạng bằng cấp không hợp lệ';
        }
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (!validateStep(currentStep)) return;
    setDirection('forward');
    setCurrentStep(s => Math.min(s + 1, 4));
    setError('');
  };

  const goBack = () => {
    setDirection('backward');
    setCurrentStep(s => Math.max(s - 1, 1));
    setFieldErrors({});
    setError('');
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!agreed) { setError('Vui lòng đồng ý với điều khoản trước khi gửi.'); return; }
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('fullname', fullname);
    formData.append('cccdNumber', cccdNumber);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('birthday', birthday);
    formData.append('introduction', introduction);
    formData.append('motivation', motivation);
    formData.append('cvFile', cvFile!);
    if (certificateFile) formData.append('certificateFile', certificateFile);
    if (degreeFile) formData.append('degreeFile', degreeFile);

    try {
      await fetchAPI('/api/mentors/register', {
        method: 'POST',
        body: formData,
      });

      setUserStatus({ hasRequest: true, requestStatus: 'PENDING' });
      showSuccess('Gửi hồ sơ thành công! Vui lòng chờ BQT xét duyệt.');
      router.push('/mentors');
    } catch (err: any) {
      showError(err.message || 'Lỗi khi gửi hồ sơ');
      setError(err.message || 'Lỗi khi gửi hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const progressPct = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  const FileZone = ({
    label, hint, required, file, onChange, accept, id
  }: {
    label: string; hint: string; required?: boolean;
    file: File | null; onChange: (f: File | null) => void;
    accept: string; id: string;
  }) => (
    <div className="mr-field">
      <label className="mr-label">{label}{required && <span>*</span>}</label>
      <div className={`mr-file-zone ${file ? 'has-file' : ''}`}>
        <input
          type="file" accept={accept} id={id}
          onChange={e => onChange(e.target.files?.[0] || null)}
        />
        <div className="mr-file-icon">{file ? '✅' : '📁'}</div>
        {file ? (
          <div className="mr-file-name">📄 {file.name}</div>
        ) : (
          <>
            <div className="mr-file-text">
              <strong>Kéo thả file hoặc nhấn để chọn</strong>
            </div>
            <div className="mr-file-sub">{hint}</div>
          </>
        )}
      </div>
      {fieldErrors[id] && <div className="mr-field-error">⚠ {fieldErrors[id]}</div>}
    </div>
  );

  // ── Page states ─────────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <>

        <Header />
        <div className="mr-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="mr-spinner" style={{ width: 56, height: 56 }} />
            <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 16 }}>Đang tải...</p>
          </div>
        </div>
      </>
    );
  }

  // Pending / Approved state
  if (userStatus?.hasRequest && (userStatus.requestStatus === 'PENDING' || userStatus.requestStatus === 'APPROVED')) {
    return (
      <>

        <Header />
        <div className="mr-root">
          <div className="mr-particle mr-particle-1" />
          <div className="mr-particle mr-particle-2" />
          <div className="mr-wrapper" style={{ maxWidth: 560, textAlign: 'center' }}>
            <div className="mr-card" style={{ animationDelay: '0.1s' }}>
              <div className="mr-pending-icon">⏳</div>
              <h2 style={{ color: '#111827', fontWeight: 800, marginBottom: 12 }}>
                Hồ sơ đang được xét duyệt
              </h2>
              <p style={{ color: '#4B5563', lineHeight: 1.7, marginBottom: 24 }}>
                Cảm ơn bạn đã đăng ký! Ban Quản Trị đang xem xét hồ sơ của bạn.<br />
                Quá trình này thường mất từ <strong style={{ color: '#F27125' }}>1–3 ngày làm việc</strong>.
              </p>
              <Link href="/mentors" className="mr-btn mr-btn-primary" style={{ justifyContent: 'center' }}>
                ← Quay lại trang Mentor
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>

      <Header />
      <div className="mr-root">
        <div className="mr-particle mr-particle-1" />
        <div className="mr-particle mr-particle-2" />

        <div className="mr-wrapper">
          {/* Hero */}
          <div className="mr-hero">
            <div className="mr-hero-badge">
              <span>🎓</span> PolyHUB Mentor Program
            </div>
            <h1>Đăng Ký Trở Thành Mentor</h1>
            <p>Chia sẻ kiến thức · Lan tỏa giá trị · Xây dựng cộng đồng PolyHUB</p>
          </div>

          {/* Stepper */}
          <div className="mr-stepper">
            {STEPS.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className="mr-step-item">
                  <div className={`mr-step-circle ${currentStep === step.id ? 'active' : currentStep > step.id ? 'done' : ''}`}>
                    {currentStep <= step.id ? step.icon : ''}
                  </div>
                  <span className={`mr-step-label ${currentStep === step.id ? 'active' : currentStep > step.id ? 'done' : ''}`}>
                    {step.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="mr-step-connector">
                    <div
                      className="mr-step-connector-fill"
                      style={{ width: currentStep > step.id ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Rejected banner */}
          {userStatus?.hasRequest && userStatus.requestStatus === 'REJECTED' && (
            <div className="mr-alert mr-alert-warning" style={{ marginBottom: 24 }}>
              <span className="mr-alert-icon">⚠️</span>
              <div>
                <div className="mr-alert-title">Hồ sơ trước đó đã bị từ chối</div>
                <div className="mr-alert-body">
                  Lý do: {userStatus.rejectionReason}<br />
                  Bạn có thể điều chỉnh và nộp lại hồ sơ bên dưới.
                </div>
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="mr-alert mr-alert-danger" style={{ marginBottom: 24 }}>
              <span className="mr-alert-icon">❌</span>
              <div>
                <div className="mr-alert-title">Có lỗi xảy ra</div>
                <div className="mr-alert-body">{error}</div>
              </div>
            </div>
          )}

          {/* Main Card */}
          <div className="mr-card">

            {/* ── STEP 1: Personal info ── */}
            {currentStep === 1 && (
              <div className={`mr-step-panel ${direction === 'backward' ? 'backward' : ''}`}>
                <div className="mr-step-header">
                  <div className="mr-step-icon">👤</div>
                  <div>
                    <div className="mr-step-title">Thông tin cá nhân</div>
                    <div className="mr-step-subtitle">Cung cấp thông tin định danh cơ bản của bạn</div>
                  </div>
                </div>

                <div className="mr-row">
                  <div className="mr-field">
                    <label className="mr-label">Họ và tên đầy đủ <span>*</span></label>
                    <input
                      className={`mr-input ${fieldErrors.fullname ? 'error-field' : ''}`}
                      placeholder="Nguyễn Văn A"
                      value={fullname}
                      onChange={e => { setFullname(e.target.value); setFieldErrors(p => ({ ...p, fullname: '' })); }}
                    />
                    {fieldErrors.fullname && <div className="mr-field-error">⚠ {fieldErrors.fullname}</div>}
                  </div>
                  <div className="mr-field">
                    <label className="mr-label">Số CCCD / CMND <span>*</span></label>
                    <input
                      className={`mr-input ${fieldErrors.cccdNumber ? 'error-field' : ''}`}
                      placeholder="012345678901"
                      value={cccdNumber}
                      onChange={e => { setCccdNumber(e.target.value); setFieldErrors(p => ({ ...p, cccdNumber: '' })); }}
                    />
                    {fieldErrors.cccdNumber && <div className="mr-field-error">⚠ {fieldErrors.cccdNumber}</div>}
                  </div>
                </div>

                <div className="mr-row">
                  <div className="mr-field">
                    <label className="mr-label">Email liên hệ <span>*</span></label>
                    <input
                      type="email"
                      className={`mr-input ${fieldErrors.email ? 'error-field' : ''}`}
                      placeholder="example@gmail.com"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })); }}
                      disabled
                    />
                    {fieldErrors.email && <div className="mr-field-error">⚠ {fieldErrors.email}</div>}
                  </div>
                  <div className="mr-field">
                    <label className="mr-label">Số điện thoại <span>*</span></label>
                    <input
                      type="tel"
                      className={`mr-input ${fieldErrors.phone ? 'error-field' : ''}`}
                      placeholder="0901 234 567"
                      value={phone}
                      onChange={e => { setPhone(e.target.value); setFieldErrors(p => ({ ...p, phone: '' })); }}
                    />
                    {fieldErrors.phone && <div className="mr-field-error">⚠ {fieldErrors.phone}</div>}
                  </div>
                </div>

                <div className="mr-field" style={{ maxWidth: 280 }}>
                  <label className="mr-label">Ngày sinh <span>*</span></label>
                  <CustomDatePicker
                    id="birthday"
                    value={birthday}
                    onChange={val => { setBirthday(val); setFieldErrors(p => ({ ...p, birthday: '' })); }}
                    error={!!fieldErrors.birthday}
                    placeholder="Chọn ngày sinh"
                  />
                  {fieldErrors.birthday && <div className="mr-field-error">⚠ {fieldErrors.birthday}</div>}
                </div>
              </div>
            )}

            {/* ── STEP 2: Experience ── */}
            {currentStep === 2 && (
              <div className={`mr-step-panel ${direction === 'backward' ? 'backward' : ''}`}>
                <div className="mr-step-header">
                  <div className="mr-step-icon">💼</div>
                  <div>
                    <div className="mr-step-title">Kinh nghiệm & Động lực</div>
                    <div className="mr-step-subtitle">Chia sẻ về chuyên môn và lý do bạn muốn trở thành Mentor</div>
                  </div>
                </div>

                <div className="mr-field">
                  <label className="mr-label">Giới thiệu bản thân & Kinh nghiệm <span>*</span></label>
                  <textarea
                    className={`mr-input mr-textarea ${fieldErrors.introduction ? 'error-field' : ''}`}
                    placeholder="Ví dụ: Tôi đã có 3 năm kinh nghiệm lập trình Java, từng tham gia dự án thương mại điện tử cho công ty ABC..."
                    value={introduction}
                    onChange={e => { setIntroduction(e.target.value); setFieldErrors(p => ({ ...p, introduction: '' })); }}
                    rows={5}
                  />
                  <div className="mr-hint">Mô tả ngắn về chuyên môn, dự án đã làm hoặc thành tích nổi bật.</div>
                  {fieldErrors.introduction && <div className="mr-field-error">⚠ {fieldErrors.introduction}</div>}
                </div>

                <div className="mr-field">
                  <label className="mr-label">Động lực trở thành Mentor <span>*</span></label>
                  <textarea
                    className={`mr-input mr-textarea ${fieldErrors.motivation ? 'error-field' : ''}`}
                    placeholder="Vì sao bạn muốn tham gia chia sẻ kiến thức cùng cộng đồng PolyHUB?"
                    value={motivation}
                    onChange={e => { setMotivation(e.target.value); setFieldErrors(p => ({ ...p, motivation: '' })); }}
                    rows={4}
                  />
                  {fieldErrors.motivation && <div className="mr-field-error">⚠ {fieldErrors.motivation}</div>}
                </div>
              </div>
            )}

            {/* ── STEP 3: Documents ── */}
            {currentStep === 3 && (
              <div className={`mr-step-panel ${direction === 'backward' ? 'backward' : ''}`}>
                <div className="mr-step-header">
                  <div className="mr-step-icon">📎</div>
                  <div>
                    <div className="mr-step-title">Hồ sơ đính kèm</div>
                    <div className="mr-step-subtitle">Tải lên tài liệu xác thực năng lực của bạn</div>
                  </div>
                </div>

                <FileZone
                  id="cvFile" label="Tải lên CV" required
                  hint="PDF, DOC, DOCX — Tối đa 10MB"
                  accept=".pdf,.doc,.docx"
                  file={cvFile}
                  onChange={f => { setCvFile(f); setFieldErrors(p => ({ ...p, cvFile: '' })); }}
                />

                <div className="mr-row">
                  <FileZone
                    id="certificateFile" label="Chứng chỉ liên quan (nếu có)"
                    hint="PDF, JPG, PNG — Tối đa 5MB"
                    accept=".pdf,.jpg,.jpeg,.png"
                    file={certificateFile}
                    onChange={setCertificateFile}
                  />
                  <FileZone
                    id="degreeFile" label="Bằng cấp chuyên môn (nếu có)"
                    hint="PDF, JPG, PNG — Tối đa 5MB"
                    accept=".pdf,.jpg,.jpeg,.png"
                    file={degreeFile}
                    onChange={setDegreeFile}
                  />
                </div>

                <div className="mr-alert mr-alert-info" style={{ marginTop: 8 }}>
                  <span className="mr-alert-icon">💡</span>
                  <div className="mr-alert-body">
                    Các tài liệu của bạn được bảo mật và chỉ dùng để xét duyệt nội bộ. Chỉ CV là bắt buộc — chứng chỉ và bằng cấp là không bắt buộc nhưng sẽ giúp hồ sơ của bạn nổi bật hơn.
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 4: Review & Submit ── */}
            {currentStep === 4 && (
              <div className={`mr-step-panel ${direction === 'backward' ? 'backward' : ''}`}>
                <div className="mr-step-header">
                  <div className="mr-step-icon">✅</div>
                  <div>
                    <div className="mr-step-title">Xác nhận thông tin</div>
                    <div className="mr-step-subtitle">Kiểm tra lại toàn bộ thông tin trước khi gửi</div>
                  </div>
                </div>

                {/* Personal review */}
                <div className="mr-review-card">
                  <div className="mr-review-header">👤 Thông tin cá nhân</div>
                  {[
                    ['Họ tên', fullname],
                    ['CCCD/CMND', cccdNumber],
                    ['Email', email],
                    ['Điện thoại', phone],
                    ['Ngày sinh', birthday],
                  ].map(([k, v]) => (
                    <div className="mr-review-row" key={k}>
                      <span className="mr-review-key">{k}</span>
                      <span className="mr-review-val">{v || '—'}</span>
                    </div>
                  ))}
                </div>

                {/* Experience review */}
                <div className="mr-review-card">
                  <div className="mr-review-header">💼 Kinh nghiệm & Động lực</div>
                  <div className="mr-review-row">
                    <span className="mr-review-key">Giới thiệu</span>
                    <span className="mr-review-val long">{introduction.slice(0, 150)}{introduction.length > 150 ? '...' : ''}</span>
                  </div>
                  <div className="mr-review-row">
                    <span className="mr-review-key">Động lực</span>
                    <span className="mr-review-val long">{motivation.slice(0, 120)}{motivation.length > 120 ? '...' : ''}</span>
                  </div>
                </div>

                {/* Documents review */}
                <div className="mr-review-card">
                  <div className="mr-review-header">📎 Hồ sơ đính kèm</div>
                  {[
                    ['CV', cvFile?.name],
                    ['Chứng chỉ', certificateFile?.name],
                    ['Bằng cấp', degreeFile?.name],
                  ].map(([k, v]) => (
                    <div className="mr-review-row" key={k}>
                      <span className="mr-review-key">{k}</span>
                      <span className="mr-review-val" style={{ color: v ? '#6ee7b7' : 'rgba(255,255,255,0.25)' }}>
                        {v ? `📄 ${v}` : 'Không có'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Agreement */}
                <div
                  className={`mr-check-wrapper ${agreed ? 'checked' : ''}`}
                  onClick={() => setAgreed(!agreed)}
                  style={{ marginTop: 20 }}
                >
                  <div className={`mr-check-box ${agreed ? 'checked' : ''}`}>
                    {agreed && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                  </div>
                  <span className="mr-check-text">
                    Tôi cam kết những thông tin và tài liệu cung cấp là <strong style={{ color: 'rgba(255,255,255,0.85)' }}>hoàn toàn chính xác</strong>. Tôi đồng ý với các điều khoản và quy định của PolyHUB đối với vai trò Mentor.
                  </span>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mr-nav">
              <div>
                {currentStep > 1 ? (
                  <button className="mr-btn mr-btn-ghost" onClick={goBack}>
                    ← Quay lại
                  </button>
                ) : (
                  <Link href="/mentors" className="mr-btn mr-btn-ghost">
                    ✕ Hủy bỏ
                  </Link>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                  Bước {currentStep}/{STEPS.length}
                </span>
                {currentStep < 4 ? (
                  <button className="mr-btn mr-btn-primary" onClick={goNext}>
                    Tiếp theo →
                  </button>
                ) : (
                  <button
                    className="mr-btn mr-btn-success"
                    onClick={handleSubmit}
                    disabled={loading || !agreed}
                  >
                    {loading ? (
                      <>
                        <span style={{
                          display: 'inline-block',
                          width: 16, height: 16,
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          animation: 'spin 0.7s linear infinite',
                        }} />
                        Đang gửi...
                      </>
                    ) : (
                      '🚀 Gửi Hồ Sơ'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Step indicator dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            {STEPS.map(s => (
              <div key={s.id} style={{
                width: currentStep === s.id ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: currentStep === s.id
                  ? 'linear-gradient(90deg,#7c3aed,#4f46e5)'
                  : currentStep > s.id ? '#10b981' : 'rgba(136, 63, 63, 0.15)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
