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
  { id: 1, label: 'CCCD',       icon: '🪪', title: 'Xác thực định danh' },
  { id: 2, label: 'Khuôn mặt',  icon: '🧑', title: 'Xác thực khuôn mặt' },
  { id: 3, label: 'Kinh nghiệm', icon: '💼', title: 'Kinh nghiệm & Động lực' },
  { id: 4, label: 'Hồ sơ',      icon: '📎', title: 'Hồ sơ đính kèm' },
  { id: 5, label: 'Xác nhận',   icon: '✅', title: 'Xác nhận & Gửi' },
];





export default function MentorRegisterPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading]       = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError]           = useState('');
  const [userStatus, setUserStatus] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection]   = useState<'forward' | 'backward'>('forward');
  const [agreed, setAgreed]         = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  // Form states
  const [fullname, setFullname]             = useState('');
  const [cccdFrontFile, setCccdFrontFile]   = useState<File | null>(null);
  const [cccdBackFile, setCccdBackFile]     = useState<File | null>(null);
  const [email, setEmail]                   = useState('');
  const [phone, setPhone]                   = useState('');
  const [birthday, setBirthday]             = useState('');
  const [introduction, setIntroduction]     = useState('');
  const [motivation, setMotivation]         = useState('');
  const [cvFile, setCvFile]                 = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [degreeFile, setDegreeFile]         = useState<File | null>(null);

  // States cho FPT AI ID Recognition
  const [isVerifyingFront, setIsVerifyingFront] = useState(false);
  const [frontIdData, setFrontIdData] = useState<any>(null);
  const [frontIdError, setFrontIdError] = useState('');

  const [isVerifyingBack, setIsVerifyingBack] = useState(false);
  const [backIdData, setBackIdData] = useState<any>(null);
  const [backIdError, setBackIdError] = useState('');

  // States cho FPT AI Face Match
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [isVerifyingFaceMatch, setIsVerifyingFaceMatch] = useState(false);
  const [faceMatchData, setFaceMatchData] = useState<any>(null);
  const [faceMatchError, setFaceMatchError] = useState('');

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

  const handleFrontFileChange = async (f: File | null) => {
    setCccdFrontFile(f);
    setFieldErrors(p => ({...p, cccdFrontFile: ''}));
    setFrontIdData(null);
    setFrontIdError('');

    if (f) {
      setIsVerifyingFront(true);
      try {
        const formData = new FormData();
        formData.append('image', f);
        const res = await fetch('https://api.fpt.ai/vision/idr/vnm', {
          method: 'POST',
          headers: {
            'api-key': '2ynAuIpVGVe1idlYYZ8nUtAkXSYu6L2T'
          },
          body: formData
        });
        const data = await res.json();
        if (data.errorCode === 0 && data.data && data.data.length > 0) {
          const info = data.data[0];
          if (info.type && info.type.includes('back')) {
            setFrontIdError('Đây có vẻ là mặt sau. Vui lòng tải lên mặt trước CCCD.');
          } else {
            setFrontIdData(info);
          }
        } else {
          setFrontIdError(data.errorMessage || 'Không thể nhận diện CCCD.');
        }
      } catch (err) {
        setFrontIdError('Lỗi kết nối đến máy chủ xác thực.');
      } finally {
        setIsVerifyingFront(false);
      }
    }
  };

  const handleBackFileChange = async (f: File | null) => {
    setCccdBackFile(f);
    setFieldErrors(p => ({...p, cccdBackFile: ''}));
    setBackIdData(null);
    setBackIdError('');

    if (f) {
      setIsVerifyingBack(true);
      try {
        const formData = new FormData();
        formData.append('image', f);
        const res = await fetch('https://api.fpt.ai/vision/idr/vnm', {
          method: 'POST',
          headers: {
            'api-key': '2ynAuIpVGVe1idlYYZ8nUtAkXSYu6L2T'
          },
          body: formData
        });
        const data = await res.json();
        if (data.errorCode === 0 && data.data && data.data.length > 0) {
          const info = data.data[0];
          if (info.type && (info.type.includes('front') || info.id)) {
            setBackIdError('Đây có vẻ là mặt trước. Vui lòng tải lên mặt sau CCCD.');
          } else {
            setBackIdData(info);
          }
        } else {
          setBackIdError(data.errorMessage || 'Không thể nhận diện CCCD.');
        }
      } catch (err) {
        setBackIdError('Lỗi kết nối đến máy chủ xác thực.');
      } finally {
        setIsVerifyingBack(false);
      }
    }
  };

  const handleFaceFileChange = async (f: File | null) => {
    setFaceFile(f);
    setFieldErrors(p => ({...p, faceFile: ''}));
    setFaceMatchData(null);
    setFaceMatchError('');

    if (f) {
      if (!cccdFrontFile) {
        setFaceMatchError('Vui lòng hoàn thành bước tải lên mặt trước CCCD trước.');
        return;
      }

      setIsVerifyingFaceMatch(true);
      try {
        const formData = new FormData();
        formData.append('file[]', cccdFrontFile);
        formData.append('file[]', f);

        const res = await fetch('https://api.fpt.ai/dmp/checkface/v1', {
          method: 'POST',
          headers: {
            'api-key': '2ynAuIpVGVe1idlYYZ8nUtAkXSYu6L2T'
          },
          body: formData
        });
        const data = await res.json();
        if (data.code === '200' && data.data) {
          if (data.data.isMatch) {
            setFaceMatchData(data.data);
          } else {
            setFaceMatchError(`Khuôn mặt không khớp (Độ tương đồng: ${data.data.similarity}%). Vui lòng thử lại.`);
          }
        } else {
          setFaceMatchError(data.message || 'Lỗi xác thực khuôn mặt.');
        }
      } catch (err) {
        setFaceMatchError('Lỗi kết nối đến máy chủ xác thực.');
      } finally {
        setIsVerifyingFaceMatch(false);
      }
    }
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      const MAX_IMG_SIZE = 5 * 1024 * 1024; // 5MB
      const ALLOWED_IMAGES = ['image/jpeg', 'image/png'];

      if (!cccdFrontFile) {
        errs.cccdFrontFile = 'Vui lòng tải lên ảnh mặt trước CCCD';
      } else if (cccdFrontFile.size > MAX_IMG_SIZE) {
        errs.cccdFrontFile = 'Dung lượng ảnh vượt quá 5MB';
      } else if (!ALLOWED_IMAGES.includes(cccdFrontFile.type)) {
        errs.cccdFrontFile = 'Chỉ chấp nhận file ảnh JPG, PNG';
      } else if (isVerifyingFront) {
        errs.cccdFrontFile = 'Đang xác thực ảnh mặt trước, vui lòng chờ...';
      } else if (frontIdError) {
        errs.cccdFrontFile = frontIdError;
      } else if (!frontIdData) {
        errs.cccdFrontFile = 'Chưa xác thực được mặt trước CCCD';
      }

      if (!cccdBackFile) {
        errs.cccdBackFile = 'Vui lòng tải lên ảnh mặt sau CCCD';
      } else if (cccdBackFile.size > MAX_IMG_SIZE) {
        errs.cccdBackFile = 'Dung lượng ảnh vượt quá 5MB';
      } else if (!ALLOWED_IMAGES.includes(cccdBackFile.type)) {
        errs.cccdBackFile = 'Chỉ chấp nhận file ảnh JPG, PNG';
      } else if (isVerifyingBack) {
        errs.cccdBackFile = 'Đang xác thực ảnh mặt sau, vui lòng chờ...';
      } else if (backIdError) {
        errs.cccdBackFile = backIdError;
      } else if (!backIdData) {
        errs.cccdBackFile = 'Chưa xác thực được mặt sau CCCD';
      }
    }

    if (step === 2) {
      if (!faceFile) {
        errs.faceFile = 'Vui lòng tải lên ảnh chụp khuôn mặt của bạn';
      } else if (isVerifyingFaceMatch) {
        errs.faceFile = 'Đang xác thực khuôn mặt, vui lòng chờ...';
      } else if (faceMatchError) {
        errs.faceFile = faceMatchError;
      } else if (!faceMatchData) {
        errs.faceFile = 'Chưa xác thực khuôn mặt thành công';
      }
    }

    if (step === 3) {
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

    if (step === 4) {
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
    setCurrentStep(s => Math.min(s + 1, STEPS.length));
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
    
    const errs: Record<string, string> = {};
    if (!email.trim()) {
      errs.email = 'Vui lòng nhập email';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      errs.email = 'Định dạng email không hợp lệ (VD: ten@domain.com)';
    }

    if (!phone.trim()) {
      // no-op, removed phone validation
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError('Vui lòng kiểm tra lại thông tin liên hệ');
      return;
    }

    setLoading(true);
    setError('');

    let finalFullname = fullname;
    let finalBirthday = birthday;
    if (frontIdData) {
      finalFullname = frontIdData.name || finalFullname;
      if (frontIdData.dob) {
        const parts = frontIdData.dob.split('/');
        if (parts.length === 3) {
           finalBirthday = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
    }

    const formData = new FormData();
    formData.append('fullname', finalFullname);
    formData.append('cccdFrontFile', cccdFrontFile!);
    formData.append('cccdBackFile', cccdBackFile!);
    formData.append('faceFile', faceFile!);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('birthday', finalBirthday);
    formData.append('introduction', introduction);
    formData.append('motivation', motivation);
    formData.append('cvFile', cvFile!);
    if (certificateFile) formData.append('certificateFile', certificateFile);
    if (degreeFile)      formData.append('degreeFile', degreeFile);

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
  }) => {
    const isImage = file?.type.startsWith('image/');
    
    return (
      <div className="mr-field">
        <label className="mr-label">{label}{required && <span>*</span>}</label>
        <div className={`mr-file-zone ${file ? 'has-file' : ''}`} style={isImage ? { padding: '8px', minHeight: '160px' } : {}}>
          <input
            type="file" accept={accept} id={id}
            onChange={e => onChange(e.target.files?.[0] || null)}
          />
          {file ? (
            isImage ? (
              <div style={{ width: '100%', height: '140px', position: 'relative', borderRadius: '6px', overflow: 'hidden', pointerEvents: 'none' }}>
                <img 
                  src={URL.createObjectURL(file)} 
                  alt="preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: 'rgba(255,255,255,0.05)' }} 
                />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', padding: '6px', fontSize: '12px', textAlign: 'center', color: '#fff', fontWeight: 500 }}>
                  Nhấn để tải ảnh khác lên
                </div>
              </div>
            ) : (
              <>
                <div className="mr-file-icon">✅</div>
                <div className="mr-file-name">📄 {file.name}</div>
              </>
            )
          ) : (
            <>
              <div className="mr-file-icon">📁</div>
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
  };

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
              <h2 style={{ color: '#fff', fontWeight: 800, marginBottom: 12 }}>
                Hồ sơ đang được xét duyệt
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 24 }}>
                Cảm ơn bạn đã đăng ký! Ban Quản Trị đang xem xét hồ sơ của bạn.<br />
                Quá trình này thường mất từ <strong style={{ color: '#c4b5fd' }}>1–3 ngày làm việc</strong>.
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

            {/* ── STEP 1: Verification ── */}
            {currentStep === 1 && (
              <div className={`mr-step-panel ${direction === 'backward' ? 'backward' : ''}`}>
                <div className="mr-step-header">
                  <div className="mr-step-icon">🪪</div>
                  <div>
                    <div className="mr-step-title">Xác thực định danh</div>
                    <div className="mr-step-subtitle">Tải lên hình ảnh 2 mặt CCCD/CMND của bạn</div>
                  </div>
                </div>

                <div className="mr-row">
                  <div style={{ flex: 1 }}>
                    <FileZone
                      id="cccdFrontFile" label="Mặt trước CCCD/CMND" required
                      hint="JPG, PNG — Tối đa 5MB"
                      accept=".jpg,.jpeg,.png"
                      file={cccdFrontFile}
                      onChange={handleFrontFileChange}
                    />
                    {isVerifyingFront && <div style={{ fontSize: 13, color: '#60a5fa', marginTop: 8 }}>⏳ Đang xác thực thông tin...</div>}
                    {frontIdError && <div style={{ fontSize: 13, color: '#f87171', marginTop: 8 }}>❌ {frontIdError}</div>}
                    {frontIdData && (
                      <div style={{ fontSize: 13, color: '#34d399', marginTop: 8, padding: '8px 12px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: 6, border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                        <div style={{ marginBottom: 4 }}>✅ <strong>Nhận diện hợp lệ</strong></div>
                        <div style={{ opacity: 0.9 }}>Số CCCD: <strong>{frontIdData.id}</strong></div>
                        <div style={{ opacity: 0.9 }}>Họ tên: <strong>{frontIdData.name}</strong></div>
                        <div style={{ opacity: 0.9 }}>Ngày sinh: {frontIdData.dob}</div>
                        <div style={{ opacity: 0.9 }}>Giới tính: {frontIdData.sex}</div>
                        <div style={{ opacity: 0.9 }}>Quốc tịch: {frontIdData.nationality}</div>
                        <div style={{ opacity: 0.9, marginTop: 4 }}>🏠 Quê quán: {frontIdData.home}</div>
                        <div style={{ opacity: 0.9, marginTop: 4 }}>📍 Thường trú: {frontIdData.address}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <FileZone
                      id="cccdBackFile" label="Mặt sau CCCD/CMND" required
                      hint="JPG, PNG — Tối đa 5MB"
                      accept=".jpg,.jpeg,.png"
                      file={cccdBackFile}
                      onChange={handleBackFileChange}
                    />
                    {isVerifyingBack && <div style={{ fontSize: 13, color: '#60a5fa', marginTop: 8 }}>⏳ Đang xác thực thông tin...</div>}
                    {backIdError && <div style={{ fontSize: 13, color: '#f87171', marginTop: 8 }}>❌ {backIdError}</div>}
                    {backIdData && (
                      <div style={{ fontSize: 13, color: '#34d399', marginTop: 8, padding: '8px 12px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: 6, border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                        <div style={{ marginBottom: 4 }}>✅ <strong>Nhận diện hợp lệ</strong></div>
                        <div style={{ opacity: 0.9 }}>Ngày cấp: {backIdData.issue_date}</div>
                        {backIdData.issue_loc && <div style={{ opacity: 0.9, marginTop: 4 }}>🏢 Nơi cấp: {backIdData.issue_loc}</div>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Face Match ── */}
            {currentStep === 2 && (
              <div className={`mr-step-panel ${direction === 'backward' ? 'backward' : ''}`}>
                <div className="mr-step-header">
                  <div className="mr-step-icon">🧑</div>
                  <div>
                    <div className="mr-step-title">Xác thực khuôn mặt</div>
                    <div className="mr-step-subtitle">Tải lên ảnh chụp chân dung rõ nét để đối chiếu với CCCD</div>
                  </div>
                </div>

                <div className="mr-row">
                  <div style={{ flex: 1 }}>
                    <FileZone
                      id="faceFile" label="Ảnh chụp khuôn mặt" required
                      hint="JPG, PNG — Tối đa 5MB"
                      accept=".jpg,.jpeg,.png"
                      file={faceFile}
                      onChange={handleFaceFileChange}
                    />
                    {isVerifyingFaceMatch && <div style={{ fontSize: 13, color: '#60a5fa', marginTop: 8 }}>⏳ Đang đối chiếu khuôn mặt...</div>}
                    {faceMatchError && <div style={{ fontSize: 13, color: '#f87171', marginTop: 8 }}>❌ {faceMatchError}</div>}
                    {faceMatchData && (
                      <div style={{ fontSize: 13, color: '#34d399', marginTop: 8, padding: '8px 12px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: 6, border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                        <div style={{ marginBottom: 4 }}>✅ <strong>Khuôn mặt khớp với CCCD</strong></div>
                        <div style={{ opacity: 0.9 }}>Độ tương đồng: <strong>{faceMatchData.similarity}%</strong></div>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
                    <div className="mr-alert mr-alert-info">
                      <span className="mr-alert-icon">💡</span>
                      <div className="mr-alert-body">
                        <strong>Mẹo chụp ảnh:</strong>
                        <ul style={{ margin: 0, paddingLeft: 20, marginTop: 4 }}>
                          <li>Chụp rõ nét, không bị lóa sáng hoặc quá tối</li>
                          <li>Không đeo kính râm hoặc khẩu trang</li>
                          <li>Nhìn thẳng vào khung hình</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Experience ── */}
            {currentStep === 3 && (
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
                    onChange={e => { setIntroduction(e.target.value); setFieldErrors(p => ({...p, introduction: ''})); }}
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
                    onChange={e => { setMotivation(e.target.value); setFieldErrors(p => ({...p, motivation: ''})); }}
                    rows={4}
                  />
                  {fieldErrors.motivation && <div className="mr-field-error">⚠ {fieldErrors.motivation}</div>}
                </div>
              </div>
            )}

            {/* ── STEP 4: Documents ── */}
            {currentStep === 4 && (
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
                  onChange={f => { setCvFile(f); setFieldErrors(p => ({...p, cvFile: ''})); }}
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

            {/* ── STEP 5: Review & Submit ── */}
            {currentStep === 5 && (
              <div className={`mr-step-panel ${direction === 'backward' ? 'backward' : ''}`}>
                <div className="mr-step-header">
                  <div className="mr-step-icon">✅</div>
                  <div>
                    <div className="mr-step-title">Xác nhận thông tin</div>
                    <div className="mr-step-subtitle">Kiểm tra lại toàn bộ thông tin trước khi gửi</div>
                  </div>
                </div>

                {/* Personal & Contact info from CCCD */}
                <div className="mr-review-card">
                  <div className="mr-review-header">👤 Thông tin cá nhân & Liên hệ</div>
                  <div className="mr-review-row">
                    <span className="mr-review-key">Họ tên</span>
                    <span className="mr-review-val" style={{ fontWeight: 600 }}>{frontIdData?.name || fullname || '—'}</span>
                  </div>
                  <div className="mr-review-row">
                    <span className="mr-review-key">Ngày sinh</span>
                    <span className="mr-review-val">{frontIdData?.dob || birthday || '—'}</span>
                  </div>
                  
                  <div className="mr-review-row">
                    <span className="mr-review-key">Email liên hệ</span>
                    <span className="mr-review-val">{email || '—'}</span>
                  </div>
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
                  <div className="mr-review-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📎 Hồ sơ đính kèm</span>
                  </div>
                  {[
                    ['Mặt trước CCCD', cccdFrontFile, 1],
                    ['Mặt sau CCCD', cccdBackFile, 1],
                    ['Ảnh chân dung', faceFile, 2],
                    ['CV', cvFile, 4],
                    ['Chứng chỉ', certificateFile, 4],
                    ['Bằng cấp', degreeFile, 4],
                  ].map(([k, f, stepIndex]) => (
                    <div className="mr-review-row" key={k as string}>
                      <span className="mr-review-key">{k}</span>
                      <span className="mr-review-val" style={{ color: f ? '#6ee7b7' : 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {f ? (
                          <>
                            <a 
                              href={URL.createObjectURL(f as File)} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ color: '#6ee7b7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              📄 {(f as File).name}
                            </a>
                            <button 
                              onClick={() => { setDirection('backward'); setCurrentStep(stepIndex as number); }}
                              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 11, color: '#fff', cursor: 'pointer' }}
                            >
                              Sửa
                            </button>
                          </>
                        ) : 'Không có'}
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
                {currentStep < STEPS.length ? (
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
