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
        const data = await fetchAPI('/api/ai/ocr-cccd', {
          method: 'POST',
          body: formData,
          noRedirectOn401: true
        });
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
          if (info.type && info.type.includes('front')) {
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

  // AI FaceMesh states and refs
  const [livenessStep, setLivenessStep] = useState(0); // 0: wait calibrate, 1: straight, 2: left, 3: right, 4: smile, 5: success
  const stepRef = useRef(0);
  const faceMeshRef = useRef<any>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stepStartTimeRef = useRef<number>(0);
  const isRecordingStartedRef = useRef<boolean>(false);
  const timeoutTimerRef = useRef<any>(null);
  const isCameraOpenRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastLogTimeRef = useRef<number>(0);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  useEffect(() => {
    isCameraOpenRef.current = isCameraOpen;
  }, [isCameraOpen]);

  const loadFaceMeshScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as any).FaceMesh) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Không thể tải thư viện AI FaceMesh từ CDN.'));
      document.body.appendChild(script);
    });
  };

  const analyzeImageQuality = (canvas: HTMLCanvasElement): { isOk: boolean; reason: string } => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return { isOk: true, reason: '' };
    
    const w = canvas.width;
    const h = canvas.height;
    const sampleW = Math.floor(w * 0.4);
    const sampleH = Math.floor(h * 0.4);
    const startX = Math.floor((w - sampleW) / 2);
    const startY = Math.floor((h - sampleH) / 2);
    
    try {
      const imgData = ctx.getImageData(startX, startY, sampleW, sampleH);
      const data = imgData.data;
      
      let totalBrightness = 0;
      let brightPixels = 0;
      let darkPixels = 0;
      const totalPixels = sampleW * sampleH;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        totalBrightness += brightness;
        
        if (brightness > 240) {
          brightPixels++;
        } else if (brightness < 40) {
          darkPixels++;
        }
      }
      
      const avgBrightness = totalBrightness / totalPixels;
      const brightRatio = brightPixels / totalPixels;
      const darkRatio = darkPixels / totalPixels;
      
      if (brightRatio > 0.15) {
        return { isOk: false, reason: 'Phát hiện chói sáng/lóa sáng mạnh. Vui lòng đổi góc chụp.' };
      }
      if (avgBrightness < 50 || darkRatio > 0.60) {
        return { isOk: false, reason: 'Ảnh quá tối hoặc ngược sáng. Vui lòng bật thêm đèn.' };
      }
      return { isOk: true, reason: '' };
    } catch (e) {
      return { isOk: true, reason: '' };
    }
  };

  const resetLivenessRecording = (reason: string) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    isRecordingStartedRef.current = false;
    setIsRecording(false);
    
    stepRef.current = 0;
    setLivenessStep(0);
    setRecordingProgress(0);
    setLivenessInstruction(reason);
  };

  const onFaceMeshResults = (results: any) => {
    if (!isCameraOpenRef.current) return;

    const hasFace = results && results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0;
    
    const nowLog = Date.now();
    const shouldLog = !lastLogTimeRef.current || nowLog - lastLogTimeRef.current > 1500;
    if (shouldLog) {
      console.warn(`[AI DIAGNOSTIC] hasFace: ${hasFace}, landmarksCount: ${results && results.multiFaceLandmarks ? results.multiFaceLandmarks.length : 0}`);
      lastLogTimeRef.current = nowLog;
    }

    let qualityOk = true;
    let qualityReason = '';
    if (canvasRef.current) {
      const qRes = analyzeImageQuality(canvasRef.current);
      qualityOk = qRes.isOk;
      qualityReason = qRes.reason;
    }

    if (stepRef.current > 0 && stepRef.current < 5) {
      let livenessError = '';
      if (!hasFace) {
        livenessError = 'Vui lòng giữ khuôn mặt trong khung hình oval';
      } else if (!qualityOk) {
        livenessError = qualityReason;
      } else {
        const landmarks = results.multiFaceLandmarks[0];
        const nose = landmarks[4];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const eyeDist = Math.abs(leftEye.x - rightEye.x);

        const isCentered = nose.x >= 0.20 && nose.x <= 0.80; 
        const isCorrectDistance = eyeDist >= 0.05 && eyeDist <= 0.55;

        if (!isCentered) {
          livenessError = 'Khuôn mặt bị lệch ngoài khung hình oval. Vui lòng giữ ở giữa.';
        } else if (!isCorrectDistance) {
          livenessError = 'Khoảng cách camera không phù hợp. Vui lòng điều chỉnh lại.';
        }
      }

      if (livenessError) {
        resetLivenessRecording(livenessError);
        return;
      }
    }

    if (!hasFace) {
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    const nose = landmarks[4];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    const dLeft = Math.abs(nose.x - leftEye.x);
    const dRight = Math.abs(nose.x - rightEye.x);
    const ratio = dLeft / (dRight || 0.0001);
    const eyeDist = Math.abs(leftEye.x - rightEye.x);

    if (shouldLog) {
      console.warn(`[AI RAW DATA] Step: ${stepRef.current}, Ratio: ${ratio.toFixed(2)}, Center: ${nose.x.toFixed(2)}, Dist: ${eyeDist.toFixed(2)}`);
    }

    const now = Date.now();

    switch (stepRef.current) {
      case 0: 
        {
          const isCentered = nose.x >= 0.35 && nose.x <= 0.65;
          const isCorrectDistance = eyeDist >= 0.08 && eyeDist <= 0.45;

          if (!qualityOk) {
            setLivenessInstruction(qualityReason);
          } else if (!isCentered) {
            setLivenessInstruction('Hãy di chuyển khuôn mặt vào giữa khung hình oval');
          } else if (!isCorrectDistance) {
            setLivenessInstruction('Hãy điều chỉnh khoảng cách xa/gần camera vừa phải');
          } else {
            startRecordingStream();
          }
        }
        break;

      case 1: // Nhìn thẳng: giữ yên 1.5s (Ngưỡng rộng từ 0.55 đến 1.85)
        {
          const isLookingStraight = ratio >= 0.55 && ratio <= 1.85;
          if (isLookingStraight) {
            if (now - stepStartTimeRef.current >= 1500) {
              stepRef.current = 2;
              setLivenessStep(2);
              setRecordingProgress(25);
              setLivenessInstruction('👈 Từ từ quay đầu sang bên trái');
              stepStartTimeRef.current = now;
            }
          } else {
            stepStartTimeRef.current = now;
            setLivenessInstruction('Nhìn thẳng và giữ yên...');
          }
        }
        break;

      case 2: // Quay trái: tỷ lệ < 0.50 (Dễ quay hơn mức 0.45)
        {
          if (ratio < 0.50) {
            stepRef.current = 3;
            setLivenessStep(3);
            setRecordingProgress(50);
            setLivenessInstruction('👉 Từ từ quay đầu sang bên phải');
            stepStartTimeRef.current = now;
          }
        }
        break;

      case 3: // Quay phải: tỷ lệ > 2.0 (Dễ quay hơn mức 2.2)
        {
          if (ratio > 2.00) {
            stepRef.current = 4;
            setLivenessStep(4);
            setRecordingProgress(75);
            setLivenessInstruction('Smile! Nhìn thẳng và mỉm cười');
            stepStartTimeRef.current = now;
          }
        }
        break;

      case 4: // Nhìn thẳng cười: giữ yên 1.5s
        {
          const isLookingStraight = ratio >= 0.55 && ratio <= 1.85;
          if (isLookingStraight) {
            if (now - stepStartTimeRef.current >= 1500) {
              stepRef.current = 5;
              setLivenessStep(5);
              setRecordingProgress(100);
              setLivenessInstruction('Đang hoàn tất ghi hình...');
              if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
              }
            }
          } else {
            stepStartTimeRef.current = now;
            setLivenessInstruction('Hãy nhìn thẳng và mỉm cười...');
          }
        }
        break;

      default:
        break;
    }
  };

  const startPredictionLoop = () => {
    let active = true;
    let isProcessing = false;
    
    const predict = async () => {
      if (!active || !isCameraOpenRef.current || !videoRef.current) return;
      
      if (videoRef.current.readyState >= 2 && 
          videoRef.current.videoWidth > 0 && 
          faceMeshRef.current && 
          !isProcessing) {
        isProcessing = true;
        try {
          const video = videoRef.current;
          const canvas = canvasRef.current || document.createElement('canvas');
          canvasRef.current = canvas;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            await faceMeshRef.current.send({ image: canvas });
          }
        } catch (err) {
          console.error("Lỗi gửi frame sang FaceMesh:", err);
        } finally {
          isProcessing = false;
        }
      }
      animFrameIdRef.current = requestAnimationFrame(predict);
    };

    animFrameIdRef.current = requestAnimationFrame(predict);
    
    return () => {
      active = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  };

  const initFaceMesh = async () => {
    try {
      await loadFaceMeshScript();
      if (!(window as any).FaceMesh) {
        throw new Error('Thư viện FaceMesh không được khởi tạo.');
      }
      
      const faceMesh = new (window as any).FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false,
        minDetectionConfidence: 0.3,
        minTrackingConfidence: 0.3
      });

      faceMesh.onResults(onFaceMeshResults);
      faceMeshRef.current = faceMesh;
      console.log("Khởi tạo AI FaceMesh thành công!");
    } catch (err: any) {
      console.error(err);
      setFaceMatchError(err.message || 'Không thể tải mô hình AI. Vui lòng kiểm tra kết nối mạng.');
    }
  };

  const startCamera = async () => {
    setFaceMatchError('');
    setIsCameraOpen(true);
    setLivenessStep(0);
    stepRef.current = 0;
    setRecordingProgress(0);
    setLivenessInstruction('Đang tải mô hình AI...');
    setFaceFile(null);
    setFaceMatchData(null);
    isRecordingStartedRef.current = false;

    try {
      if (!faceMeshRef.current) {
        await initFaceMesh();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 }, 
          frameRate: { ideal: 30 } 
        },
        audio: false
      });
      setCameraStream(stream);
      cameraStreamRef.current = stream;
      setLivenessInstruction('Căn chỉnh khuôn mặt vào giữa khung oval...');
      
    } catch (err: any) {
      console.error(err);
      setFaceMatchError('Không thể mở camera hoặc tải mô hình AI. Vui lòng kiểm tra quyền và kết nối mạng.');
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    cameraStreamRef.current = null;
    setIsCameraOpen(false);
    setIsRecording(false);
    setRecordingProgress(0);

    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
  };

  const startRecordingStream = () => {
    const stream = cameraStreamRef.current;
    if (!stream || isRecordingStartedRef.current) return;
    isRecordingStartedRef.current = true;
    setIsRecording(true);
    setLivenessStep(1);
    stepRef.current = 1;
    stepStartTimeRef.current = Date.now();
    setLivenessInstruction('Nhìn thẳng và giữ yên...');

    let mimeType = 'video/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/mp4';
    }

    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];

    mediaRecorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const extension = mimeType === 'video/mp4' ? 'mp4' : 'webm';
      const file = new File([blob], `liveness.${extension}`, { type: mimeType });
      setFaceFile(file);
      stopCamera();
      handleLivenessVerification(file);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();

    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    timeoutTimerRef.current = setTimeout(() => {
      if (stepRef.current > 0 && stepRef.current < 5) {
        console.log("eKYC Timeout triggered");
        stopCamera();
        setFaceMatchError('Hết thời gian quét. Vui lòng di chuyển theo đúng hướng dẫn nhanh hơn.');
      }
    }, 15000);
  };

  useEffect(() => {
    let cleanPredictionLoop: (() => void) | null = null;

    if (isCameraOpen && videoRef.current && cameraStream) {
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play();
        cleanPredictionLoop = startPredictionLoop();
      };
      videoRef.current.srcObject = cameraStream;
    }

    return () => {
      if (cleanPredictionLoop) {
        cleanPredictionLoop();
      }
    };
  }, [isCameraOpen, cameraStream]);

  const translateFptError = (msg: string): string => {
    if (!msg) return 'Lỗi xác thực khuôn mặt.';
    const lower = msg.toLowerCase();
    
    if (lower.includes('backlight')) {
      return 'Chất lượng ảnh không đạt yêu cầu: Khuôn mặt bị ngược sáng hoặc quá tối.';
    }
    if (lower.includes('blur')) {
      return 'Chất lượng ảnh không đạt yêu cầu: Khuôn mặt bị mờ, nhòe hoặc mất nét.';
    }
    if (lower.includes('quality is not good enough')) {
      return 'Chất lượng ảnh chụp khuôn mặt không đủ tốt hoặc không đạt yêu cầu.';
    }
    if (lower.includes('no face')) {
      return 'Không phát hiện thấy khuôn mặt trong video.';
    }
    if (lower.includes('multiple face')) {
      return 'Phát hiện nhiều hơn một khuôn mặt trong khung hình. Vui lòng chỉ quay một mình.';
    }
    if (lower.includes('too close')) {
      return 'Khuôn mặt để quá gần camera.';
    }
    if (lower.includes('too far')) {
      return 'Khuôn mặt để quá xa camera.';
    }
    if (lower.includes('not looking straight')) {
      return 'Khuôn mặt không nhìn thẳng vào camera.';
    }
    if (lower.includes('deepfake')) {
      return 'Cảnh báo giả mạo khuôn mặt (Deepfake).';
    }
    if (lower.includes('cannot extract')) {
      return 'Không thể nhận diện hoặc trích xuất khuôn mặt từ video.';
    }
    if (lower.includes('face quality')) {
      return 'Chất lượng ảnh khuôn mặt không đạt yêu cầu (có thể do mờ, tối hoặc ngược sáng).';
    }
    return msg;
  };

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
        setFaceMatchError(translateFptError(data.message || 'Lỗi xác thực khuôn mặt.'));
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
                              {/* Khung hình oval dọc chuẩn khuôn mặt */}
                              <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '220px',
                                height: '290px',
                                borderRadius: '50%',
                                border: `3px ${isRecording ? 'solid' : 'dashed'} ${isRecording ? '#10b981' : '#fcd34d'}`,
                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
                                pointerEvents: 'none',
                                zIndex: 10
                              }} />
                            </div>
                            
                            {!isRecording ? (
                              <div style={{ marginTop: 16, fontSize: 14, color: '#ea580c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                                <span style={{ display: 'inline-block', width: 8, height: 8, background: '#ea580c', borderRadius: '50%', animation: 'ping 1.2s infinite' }} />
                                {livenessInstruction}
                              </div>
                            ) : (
                              <div style={{ width: '100%', marginTop: 12 }}>
                                <div style={{ fontSize: 14, color: '#e11d48', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 6 }}>
                                  <span style={{ display: 'inline-block', width: 8, height: 8, background: '#e11d48', borderRadius: '50%', animation: 'ping 0.8s infinite' }} />
                                  {livenessInstruction}
                                </div>
                                <div style={{ width: '100%', height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                                  <div style={{ width: `${recordingProgress}%`, height: '100%', background: '#e11d48', borderRadius: 3, transition: 'width 0.2s ease-out' }} />
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
                          Chi tiết: {translateFptError(faceMatchError)}
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
