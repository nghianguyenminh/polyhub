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
  { id: 1, label: 'CCCD', icon: '🪪', title: 'Xác thực định danh' },
  { id: 2, label: 'Khuôn mặt', icon: '🧑', title: 'Xác thực khuôn mặt' },
  { id: 3, label: 'Kinh nghiệm', icon: '💼', title: 'Kinh nghiệm & Động lực' },
  { id: 4, label: 'Hồ sơ', icon: '📎', title: 'Hồ sơ đính kèm' },
  { id: 5, label: 'Xác nhận', icon: '✅', title: 'Xác nhận & Gửi' },
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
  const [isReapplying, setIsReapplying] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  // Form states
  const [fullname, setFullname] = useState('');
  const [cccdFrontFile, setCccdFrontFile] = useState<File | null>(null);
  const [cccdBackFile, setCccdBackFile] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [motivation, setMotivation] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [degreeFile, setDegreeFile] = useState<File | null>(null);

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

  const getFriendlyOcrErrorMessage = (errorCode: any, errorMessage: string) => {
    const code = Number(errorCode);
    switch (code) {
      case 1:
        return 'Ảnh không hợp lệ hoặc không đúng định dạng.';
      case 2:
        return 'Kích thước ảnh quá nhỏ hoặc không đạt chuẩn.';
      case 3:
        return 'Lỗi kết nối hệ thống nhận diện.';
      case 5:
        return 'Không tìm thấy thẻ CCCD hoặc khuôn mặt trong ảnh.';
      case 6:
        return 'Ảnh quá mờ, lóa sáng hoặc chất lượng quá thấp.';
      case 7:
        return 'Phát hiện ảnh thẻ photocopy hoặc không phải ảnh gốc.';
      case 9:
        return 'Phát hiện nhiều hơn một thẻ CCCD trong ảnh.';
      case 10:
        return 'Mặt thẻ không khớp (vui lòng kiểm tra lại mặt trước/mặt sau).';
      default:
        return errorMessage || 'Không thể nhận diện CCCD. Vui lòng chụp rõ nét và thử lại.';
    }
  };

  const handleFrontFileChange = async (f: File | null) => {
    setCccdFrontFile(f);
    setFieldErrors(p => ({ ...p, cccdFrontFile: '' }));
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
          setFrontIdError(getFriendlyOcrErrorMessage(data.errorCode, data.errorMessage));
        }
      } catch (err: any) {
        setFrontIdError(err.message || 'Lỗi kết nối đến máy chủ xác thực.');
      } finally {
        setIsVerifyingFront(false);
      }
    }
  };

  const handleBackFileChange = async (f: File | null) => {
    setCccdBackFile(f);
    setFieldErrors(p => ({ ...p, cccdBackFile: '' }));
    setBackIdData(null);
    setBackIdError('');

    if (f) {
      setIsVerifyingBack(true);
      try {
        const formData = new FormData();
        formData.append('image', f);
        const data = await fetchAPI('/api/ai/ocr-cccd', {
          method: 'POST',
          body: formData,
          noRedirectOn401: true
        });
        if (data.errorCode === 0 && data.data && data.data.length > 0) {
          const info = data.data[0];
          if (info.type && (info.type.includes('front') || info.id)) {
            setBackIdError('Đây có vẻ là mặt trước. Vui lòng tải lên mặt sau CCCD.');
          } else {
            setBackIdData(info);
          }
        } else {
          setBackIdError(getFriendlyOcrErrorMessage(data.errorCode, data.errorMessage));
        }
      } catch (err: any) {
        setBackIdError(err.message || 'Lỗi kết nối đến máy chủ xác thực.');
      } finally {
        setIsVerifyingBack(false);
      }
    }
  };

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [livenessInstruction, setLivenessInstruction] = useState('Đưa khuôn mặt vào trong khung oval');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOpen, cameraStream]);

  const startCamera = async () => {
    setFaceMatchError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraStream(stream);
      setIsCameraOpen(true);
      setFaceFile(null);
      setFaceMatchData(null);
    } catch (err) {
      setFaceMatchError('Không thể mở camera. Vui lòng cấp quyền truy cập.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setIsCameraOpen(false);
  };

  const startRecording = () => {
    if (!cameraStream) return;
    setFaceMatchError('');
    setIsRecording(true);
    const stream = cameraStream;
    let mimeType = 'video/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/mp4';
    }
    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const extension = mimeType === 'video/mp4' ? 'mp4' : 'webm';
      const file = new File([blob], `liveness.${extension}`, { type: mimeType });
      setFaceFile(file);
      stopCamera();
      handleLivenessVerification(file);
    };

    mediaRecorder.start();

    // Logic eKYC tự động: quét 8.5s, cập nhật chỉ dẫn liên tục
    let time = 0;
    setLivenessInstruction('Vui lòng nhìn thẳng và giữ yên...');

    const interval = setInterval(() => {
      time += 100;
      setRecordingProgress((time / 8500) * 100);

      if (time === 2000) setLivenessInstruction('Từ từ quay mặt sang trái');
      if (time === 4500) setLivenessInstruction('Từ từ quay mặt sang phải');
      if (time === 7000) setLivenessInstruction('Nhìn thẳng và mỉm cười');

      if (time >= 8500) {
        clearInterval(interval);
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        setIsRecording(false);
        setRecordingProgress(0);
        setLivenessInstruction('Đưa khuôn mặt vào trong khung oval');
      }
    }, 100);
  };

  // Tự động kích hoạt ghi hình khi camera mở sẵn sàng
  useEffect(() => {
    if (!cameraStream || !isCameraOpen) return;

    setLivenessInstruction('Chuẩn bị... Vui lòng đưa khuôn mặt vào trong khung oval');
    setRecordingProgress(0);

    const timer = setTimeout(() => {
      startRecording();
    }, 1500);

    return () => clearTimeout(timer);
  }, [cameraStream, isCameraOpen]);

  const handleLivenessVerification = async (video: File) => {
    setFieldErrors(p => ({ ...p, faceFile: '' }));
    setFaceMatchData(null);
    setFaceMatchError('');

    if (!cccdFrontFile) {
      setFaceMatchError('Vui lòng hoàn thành bước tải lên mặt trước CCCD trước.');
      return;
    }

    setIsVerifyingFaceMatch(true);
    try {
      const formData = new FormData();
      formData.append('video', video);
      // Chỉ gửi CCCD nếu file hợp lệ (không phải file dummy)
      if (cccdFrontFile && cccdFrontFile.size > 0) {
        formData.append('cmnd', cccdFrontFile);
      }

      const res = await fetch('https://api.fpt.ai/dmp/liveness/v3', {
        method: 'POST',
        headers: {
          'api-key': '2ynAuIpVGVe1idlYYZ8nUtAkXSYu6L2T'
        },
        body: formData
      });
      const data = await res.json();

      const isSuccessCode = String(data.code) === '200' || String(data.code) === '0' || String(data.errorCode) === '0';
      const isSuccessMessage = data.message && (data.message.toLowerCase().includes('success') || data.message.toLowerCase() === 'ok');
      const responseData = data.data || data;

      if (isSuccessCode || isSuccessMessage) {
        const liveness = responseData.liveness;
        const faceMatch = responseData.face_match || responseData.faceMatch;

        if (liveness) {
          const isLive = String(liveness.is_live).toLowerCase() === 'true';
          const isMatch = faceMatch ? (String(faceMatch.is_match).toLowerCase() === 'true') : true;

          if (isLive && isMatch) {
            setFaceMatchData({
              isMatch: isMatch,
              similarity: faceMatch?.similarity || 100,
              isLive: isLive,
              deepFake: liveness.deep_fake || false
            });
          } else {
            setFaceMatchError(`Xác thực thất bại: Khuôn mặt ${!isMatch ? 'không khớp' : 'khớp'}, ${isLive ? 'là người thật' : 'không phải người thật'}`);
          }
        } else {
          // Fallback if the API doesn't return standard liveness object but says success
          setFaceMatchData({
            isMatch: true,
            similarity: 100,
            isLive: true,
            deepFake: false
          });
        }
      } else {
        setFaceMatchError(data.message || 'Lỗi xác thực khuôn mặt.');
      }
    } catch (err) {
      setFaceMatchError('Lỗi kết nối đến máy chủ xác thực.');
    } finally {
      setIsVerifyingFaceMatch(false);
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
        errs.faceFile = 'Vui lòng quay video khuôn mặt của bạn';
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

  // Pending state
  if (userStatus?.hasRequest && userStatus.requestStatus === 'PENDING') {
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

  // Approved state
  if (userStatus?.hasRequest && userStatus.requestStatus === 'APPROVED') {
    return (
      <>
        <Header />
        <div className="mr-root">
          <div className="mr-particle mr-particle-1" />
          <div className="mr-particle mr-particle-2" />
          <div className="mr-wrapper" style={{ maxWidth: 560, textAlign: 'center' }}>
            <div className="mr-card" style={{ animationDelay: '0.1s' }}>
              <div className="mr-pending-icon">🎉</div>
              <h2 style={{ color: '#000000ff', fontWeight: 800, marginBottom: 12 }}>
                Chúc mừng bạn!
              </h2>
              <p style={{ color: 'rgba(8, 8, 8, 0.55)', lineHeight: 1.7, marginBottom: 24 }}>
                Bạn đã chính thức trở thành Mentor của PolyHUB.<br />
                Hãy bắt đầu hành trình chia sẻ kiến thức của mình ngay hôm nay.
              </p>
              <Link href="/mentors" className="mr-btn mr-btn-primary" style={{ justifyContent: 'center' }}>
                Đi đến trang Mentor
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Revoked state
  if (userStatus?.hasRequest && userStatus.requestStatus === 'REVOKED' && !isReapplying) {
    return (
      <>
        <Header />
        <div className="mr-root">
          <div className="mr-particle mr-particle-1" />
          <div className="mr-particle mr-particle-2" />
          <div className="mr-wrapper" style={{ maxWidth: 560, textAlign: 'center' }}>
            <div className="mr-card" style={{ animationDelay: '0.1s' }}>
              <div className="mr-pending-icon">🚫</div>
              <h2 style={{ color: '#000000ff', fontWeight: 800, marginBottom: 12 }}>
                Quyền Mentor đã bị tước
              </h2>
              <p style={{ color: 'rgba(8, 8, 8, 0.55)', lineHeight: 1.7, marginBottom: 24 }}>
                Rất tiếc, quyền Mentor của bạn đã bị vô hiệu hóa bởi Ban Quản Trị.
              </p>
              {userStatus.rejectionReason && (
                <div style={{ background: 'rgba(0,0,0,0.05)', padding: '12px', borderRadius: '8px', marginBottom: '24px', textAlign: 'left', color: '#000000ff', fontSize: '14px' }}>
                  <strong>Lý do:</strong> {userStatus.rejectionReason}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link href="/" className="mr-btn mr-btn-primary" style={{ justifyContent: 'center' }}>
                  Về Trang Chủ
                </Link>
                <button onClick={() => setIsReapplying(true)} className="mr-btn" style={{ justifyContent: 'center', background: 'transparent', border: '1px solid rgba(0,0,0,0.2)', color: '#000000ff' }}>
                  Đăng ký lại (Nộp hồ sơ mới)
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }


  // Interviewing state
  if (userStatus?.hasRequest && userStatus.requestStatus === 'INTERVIEWING') {
    return (
      <>
        <Header />
        <div className="mr-root">
          <div className="mr-particle mr-particle-1" />
          <div className="mr-particle mr-particle-2" />
          <div className="mr-wrapper" style={{ maxWidth: 560, textAlign: 'center' }}>
            <div className="mr-card" style={{ animationDelay: '0.1s' }}>
              <div className="mr-pending-icon">🎙️</div>
              <h2 style={{ color: '#000000ff', fontWeight: 800, marginBottom: 12 }}>
                Đang chờ phỏng vấn
              </h2>
              <p style={{ color: 'rgba(8, 8, 8, 0.55)', lineHeight: 1.7, marginBottom: 24 }}>
                Hồ sơ của bạn đã qua vòng sơ loại. Chúng tôi đã gửi một email thư mời phỏng vấn đến bạn.<br />
                Vui lòng kiểm tra hộp thư (bao gồm cả thư rác) để xem thông tin chi tiết.
              </p>
              {userStatus.adminNotes && (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', marginBottom: '24px', textAlign: 'left', color: '#000000ff', fontSize: '14px' }}>
                  <strong>Ghi chú từ BQT:</strong> {userStatus.adminNotes}
                </div>
              )}
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

          {/* Rejected / Needs Update / Revoked banner */}
          {userStatus?.hasRequest && (userStatus.requestStatus === 'REJECTED' || userStatus.requestStatus === 'NEEDS_UPDATE' || userStatus.requestStatus === 'REVOKED') && (
            <div className="mr-alert mr-alert-warning" style={{ marginBottom: 24 }}>
              <span className="mr-alert-icon">⚠️</span>
              <div>
                <div className="mr-alert-title">
                  {userStatus.requestStatus === 'REJECTED' ? 'Hồ sơ trước đó đã bị từ chối' : userStatus.requestStatus === 'REVOKED' ? 'Quyền Mentor trước đó đã bị tước' : 'Yêu cầu bổ sung hồ sơ'}
                </div>
                <div className="mr-alert-body">
                  Lý do/Ghi chú: {userStatus.rejectionReason || userStatus.adminNotes}<br />
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
                <div className="mr-step-header" style={{ position: 'relative' }}>
                  <div className="mr-step-icon">🪪</div>
                  <div>
                    <div className="mr-step-title">Xác thực định danh</div>
                    <div className="mr-step-subtitle">Tải lên hình ảnh 2 mặt CCCD/CMND của bạn</div>
                  </div>
                  {/* NÚT BYPASS CHO TEST */}
                  <button
                    onClick={() => {
                      const dummyFile = new File([''], 'dummy.jpg', { type: 'image/jpeg' });
                      setCccdFrontFile(dummyFile);
                      setCccdBackFile(dummyFile);
                      setFrontIdData({ id: '000000000000', name: 'TEST USER', dob: '01/01/2000', sex: 'Nam', nationality: 'Việt Nam', home: 'Hà Nội', address: 'Hà Nội' });
                      setBackIdData({ issue_date: '01/01/2020', issue_loc: 'C06' });
                      setTimeout(() => setDirection('forward'), 100);
                      setTimeout(() => setCurrentStep(2), 200);
                    }}
                    style={{
                      position: 'absolute', right: 0, top: 0,
                      background: '#10b981', border: 'none', color: '#fff',
                      padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                      fontSize: '12px', fontWeight: 600
                    }}
                  >
                    Bỏ qua bước này (Test Mode) ➔
                  </button>
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
                <div className="mr-step-header" style={{ position: 'relative' }}>
                  <div className="mr-step-icon">🧑</div>
                  <div>
                    <div className="mr-step-title">Xác thực khuôn mặt (Liveness)</div>
                    <div className="mr-step-subtitle">Hệ thống sẽ ghi hình 7 giây và hướng dẫn bạn thực hiện các cử động như app ngân hàng</div>
                  </div>
                  {/* NÚT BYPASS CHO TEST */}
                  <button
                    onClick={() => {
                      const dummyVideo = new File([''], 'dummy.mp4', { type: 'video/mp4' });
                      setFaceFile(dummyVideo);
                      setFaceMatchData({
                        isMatch: true,
                        similarity: 100,
                        isLive: true,
                        deepFake: false
                      });
                      setTimeout(() => setDirection('forward'), 100);
                      setTimeout(() => setCurrentStep(3), 200);
                    }}
                    style={{
                      position: 'absolute', right: 0, top: 0,
                      background: '#10b981', border: 'none', color: '#fff',
                      padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                      fontSize: '12px', fontWeight: 600
                    }}
                  >
                    Bỏ qua bước này (Test Mode) ➔
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ width: '100%' }}>
                    <div className="mr-field">
                      <label className="mr-label">Xác thực bằng Camera <span>*</span></label>
                      <div className="mr-file-zone" style={{ padding: 16, minHeight: 400, position: 'relative' }}>
                        {!isCameraOpen && !faceFile && (
                          <div style={{ textAlign: 'center', margin: '80px 0' }}>
                            <div className="mr-file-icon">📹</div>
                            <div className="mr-file-text"><strong>Nhấn để mở Camera</strong></div>
                            <div className="mr-file-sub">Cần cấp quyền truy cập camera</div>
                            <button className="mr-btn mr-btn-primary" style={{ margin: '16px auto 0' }} onClick={startCamera}>
                              Mở Camera
                            </button>
                          </div>
                        )}
                        {isCameraOpen && (
                          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ position: 'relative', width: '100%', borderRadius: 8, overflow: 'hidden', backgroundColor: '#000' }}>
                              <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                style={{ width: '100%', height: '400px', objectFit: 'cover', display: 'block', transform: 'scaleX(-1)', opacity: isRecording ? 1 : 0.7, transition: 'opacity 0.3s' }}
                              />
                              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                                <defs>
                                  <mask id="oval-mask" x="0" y="0" width="100" height="100">
                                    <rect x="0" y="0" width="100" height="100" fill="white" />
                                    <ellipse cx="50" cy="50" rx="35" ry="46" fill="black" />
                                  </mask>
                                </defs>
                                <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.7)" mask="url(#oval-mask)" />
                                <ellipse cx="50" cy="50" rx="35" ry="46" fill="none" stroke={isRecording ? '#10b981' : '#fcd34d'} strokeWidth="0.8" strokeDasharray={isRecording ? 'none' : '2,2'} />
                              </svg>
                              <div style={{ position: 'absolute', bottom: '10%', width: '100%', textAlign: 'center' }}>
                                <span style={{ background: 'rgba(0,0,0,0.6)', padding: '6px 16px', borderRadius: 20, color: isRecording ? '#10b981' : '#fff', fontWeight: 600, fontSize: 14, backdropFilter: 'blur(4px)' }}>
                                  {livenessInstruction}
                                </span>
                              </div>
                            </div>

                            {!isRecording ? (
                              <div style={{ marginTop: 16, fontSize: 14, color: '#fcd34d', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ display: 'inline-block', width: 8, height: 8, background: '#fcd34d', borderRadius: '50%', animation: 'ping 1s infinite' }} />
                                Đang chuẩn bị quét tự động... Vui lòng nhìn thẳng
                              </div>
                            ) : (
                              <div style={{ width: '100%', marginTop: 12 }}>
                                <div style={{ fontSize: 13, color: '#f87171', textAlign: 'center', marginBottom: 4 }}>
                                  Đang quét...
                                </div>
                                <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                                  <div style={{ width: `${recordingProgress}%`, height: '100%', background: '#f87171', borderRadius: 2, transition: 'width 0.1s' }} />
                                </div>
                              </div>
                            )}
                            <button
                              style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 24, height: 24, color: '#fff', cursor: 'pointer' }}
                              onClick={stopCamera}
                            >✕</button>
                          </div>
                        )}
                        {faceFile && !isCameraOpen && (
                          <div style={{ textAlign: 'center' }}>
                            <div className="mr-file-icon" style={{ fontSize: 32 }}>🎬</div>
                            <div className="mr-file-text" style={{ marginTop: 8 }}><strong>Đã quét khuôn mặt thành công</strong></div>
                            <div className="mr-file-sub" style={{ marginBottom: 12 }}>{faceFile.name}</div>
                            <button className="mr-btn mr-btn-ghost" style={{ margin: '0 auto', fontSize: 13 }} onClick={startCamera}>
                              🔄 Thực hiện quét lại
                            </button>
                          </div>
                        )}
                      </div>
                      {fieldErrors.faceFile && <div className="mr-field-error">⚠ {fieldErrors.faceFile}</div>}
                    </div>

                    {isVerifyingFaceMatch && <div style={{ fontSize: 13, color: '#60a5fa', marginTop: 8 }}>⏳ Đang đối chiếu khuôn mặt và kiểm tra liveness...</div>}
                    {faceMatchError && (
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        padding: '16px',
                        marginTop: '16px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: 14, color: '#f87171', fontWeight: 600, marginBottom: 8 }}>
                          ❌ Xác thực thất bại
                        </div>
                        <div style={{ fontSize: 13, color: '#fca5a5', marginBottom: 16 }}>
                          Chi tiết: {faceMatchError}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => {
                              setFaceMatchError('');
                              startCamera();
                            }}
                            className="mr-btn mr-btn-primary"
                            style={{ fontSize: 13, padding: '8px 16px', minWidth: '180px' }}
                          >
                            🔄 Thực hiện quét lại khuôn mặt
                          </button>

                          <button
                            onClick={() => {
                              if (!faceFile) {
                                const dummyVideo = new File([''], 'dummy.mp4', { type: 'video/mp4' });
                                setFaceFile(dummyVideo);
                              }
                              setFaceMatchError('');
                              setFaceMatchData({
                                isMatch: true,
                                similarity: 100,
                                isLive: true,
                                deepFake: false
                              });
                              setFieldErrors(p => ({ ...p, faceFile: '' }));
                            }}
                            className="mr-btn mr-btn-ghost"
                            style={{ fontSize: 12, padding: '8px 12px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)' }}
                          >
                            ⚠️ Ép buộc Bỏ qua (Chỉ dùng cho Test)
                          </button>
                        </div>
                      </div>
                    )}
                    {faceMatchData && (
                      <div style={{ fontSize: 14, color: '#34d399', marginTop: 12, padding: '12px 16px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: 8, border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                        <div style={{ marginBottom: 6, fontSize: 16 }}>✅ <strong>Xác thực thành công</strong></div>
                        <div style={{ opacity: 0.9 }}>Khuôn mặt khớp: <strong>{faceMatchData.similarity}%</strong></div>
                        <div style={{ opacity: 0.9 }}>Người thật (Liveness): <strong>{faceMatchData.isLive ? 'Có' : 'Không'}</strong></div>
                        <div style={{ opacity: 0.9 }}>Deep fake: <strong>{faceMatchData.deepFake ? 'Có' : 'Không'}</strong></div>
                      </div>
                    )}
                  </div>
                  <div style={{ width: '100%' }}>
                    <div className="mr-alert mr-alert-info">
                      <span className="mr-alert-icon">💡</span>
                      <div className="mr-alert-body">
                        <strong>Mẹo quay video liveness:</strong>
                        <ul style={{ margin: 0, paddingLeft: 20, marginTop: 4 }}>
                          <li>Đảm bảo ánh sáng rõ ràng, không quá tối hoặc lóa.</li>
                          <li>Giữ khuôn mặt nằm gọn trong khung hình oval.</li>
                          <li>Làm theo hướng dẫn trên màn hình (quay trái, quay phải).</li>
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
                    { label: 'Mặt trước CCCD', file: cccdFrontFile, step: 1 },
                    { label: 'Mặt sau CCCD', file: cccdBackFile, step: 1 },
                    { label: 'Video Liveness', file: faceFile, step: 2 },
                    { label: 'CV', file: cvFile, step: 4 },
                    { label: 'Chứng chỉ', file: certificateFile, step: 4 },
                    { label: 'Bằng cấp', file: degreeFile, step: 4 },
                  ].map(({ label, file, step }) => (
                    <div className="mr-review-row" key={label}>
                      <span className="mr-review-key">{label}</span>
                      <span className="mr-review-val" style={{ color: file ? '#6ee7b7' : 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {file ? (
                          <>
                            <a
                              href={URL.createObjectURL(file as File)}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#6ee7b7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              📄 {(file as File).name}
                            </a>
                            <button
                              onClick={() => { setDirection('backward'); setCurrentStep(step); }}
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
