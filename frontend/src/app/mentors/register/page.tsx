'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import Header from '@/components/layout/Header';

export default function MentorRegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userStatus, setUserStatus] = useState<any>(null);
  
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

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const data = await fetchAPI('/api/mentors/status');
      setUserStatus(data);
      if (data.isMentor) {
        router.push('/mentors');
      }
    } catch (err) {
      router.push('/login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvFile) {
      setError('Vui lòng đính kèm CV nộp hồ sơ.');
      return;
    }

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
    formData.append('cvFile', cvFile);
    if (certificateFile) formData.append('certificateFile', certificateFile);
    if (degreeFile) formData.append('degreeFile', degreeFile);

    try {
      const data = await fetchAPI('/api/mentors/register', {
        method: 'POST',
        body: formData
      });

      alert('Gửi hồ sơ thành công! Vui lòng chờ BQT xét duyệt.');
      router.push('/mentors');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi gửi hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  if (!userStatus) return <div className="text-center mt-5"><div className="spinner-border text-primary" /></div>;

  return (
    <>
      <Header />
      <div className="container-fluid bg-light min-vh-100 py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-4 p-md-5">
                  <div className="text-center mb-5">
                    <h2 className="fw-bold mb-3 text-dark">Đăng Ký Trở Thành Mentor</h2>
                    <p className="text-muted fs-5">Chia sẻ kiến thức - Lan tỏa giá trị cộng đồng PolyHUB</p>
                  </div>

                  {userStatus.hasRequest && (userStatus.requestStatus === 'PENDING' || userStatus.requestStatus === 'APPROVED') ? (
                    <div className="alert alert-info rounded-3 border-0 py-3 text-center">
                      <i className="bi bi-info-circle-fill fs-4 d-block mb-2 text-info"></i>
                      <h5 className="fw-bold">Bạn đã có yêu cầu đăng ký đang xử lý</h5>
                      <p className="mb-0 text-muted">Vui lòng chờ Ban Quản Trị xem xét hồ sơ của bạn. Quá trình này có thể mất từ 1-3 ngày làm việc.</p>
                      <Link href="/mentors" className="btn btn-outline-info mt-3 rounded-pill px-4">Quay lại danh sách</Link>
                    </div>
                  ) : (
                    <>
                      {userStatus.hasRequest && userStatus.requestStatus === 'REJECTED' && (
                        <div className="alert alert-danger rounded-3 border-0 py-3 mb-4">
                          <h6 className="fw-bold"><i className="bi bi-exclamation-triangle-fill me-2"></i> Hồ sơ trước đó của bạn đã bị từ chối</h6>
                          <p className="mb-0 small">Lý do: {userStatus.rejectionReason}</p>
                          <hr />
                          <p className="mb-0 small">Bạn có thể điều chỉnh lại hồ sơ và nộp lại bên dưới.</p>
                        </div>
                      )}

                      {error && (
                        <div className="alert alert-danger rounded-3 border-0 py-2 mb-4" role="alert">
                          <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className="needs-validation">
                        <h5 className="fw-bold mb-3 border-bottom pb-2">1. Thông tin cá nhân cơ bản</h5>
                        <div className="row g-3 mb-4">
                          <div className="col-md-6">
                            <label className="form-label fw-medium">Họ và tên đầy đủ <span className="text-danger">*</span></label>
                            <input type="text" className="form-control rounded-3" value={fullname} onChange={e => setFullname(e.target.value)} required />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-medium">Số CCCD/CMND <span className="text-danger">*</span></label>
                            <input type="text" className="form-control rounded-3" value={cccdNumber} onChange={e => setCccdNumber(e.target.value)} required />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-medium">Email liên hệ <span className="text-danger">*</span></label>
                            <input type="email" className="form-control rounded-3" value={email} onChange={e => setEmail(e.target.value)} required />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-medium">Số điện thoại <span className="text-danger">*</span></label>
                            <input type="tel" className="form-control rounded-3" value={phone} onChange={e => setPhone(e.target.value)} required />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-medium">Ngày sinh <span className="text-danger">*</span></label>
                            <input type="date" className="form-control rounded-3" value={birthday} onChange={e => setBirthday(e.target.value)} required />
                          </div>
                        </div>

                        <h5 className="fw-bold mb-3 border-bottom pb-2">2. Kinh nghiệm & Động lực</h5>
                        <div className="mb-3">
                          <label className="form-label fw-medium">Giới thiệu bản thân & Kinh nghiệm <span className="text-danger">*</span></label>
                          <textarea className="form-control rounded-3" rows={4} placeholder="Ví dụ: Đã có 3 năm kinh nghiệm lập trình Java..." value={introduction} onChange={e => setIntroduction(e.target.value)} required></textarea>
                          <div className="form-text text-muted">Mô tả ngắn gọn về chuyên môn, dự án đã làm hoặc thành tích học tập.</div>
                        </div>
                        <div className="mb-4">
                          <label className="form-label fw-medium">Động lực trở thành Mentor <span className="text-danger">*</span></label>
                          <textarea className="form-control rounded-3" rows={3} placeholder="Vì sao bạn muốn tham gia chia sẻ kiến thức..." value={motivation} onChange={e => setMotivation(e.target.value)} required></textarea>
                        </div>

                        <h5 className="fw-bold mb-3 border-bottom pb-2">3. Hồ sơ đính kèm (Xác thực năng lực)</h5>
                        <div className="mb-3">
                          <label className="form-label fw-medium">Tải lên CV (PDF/Word) <span className="text-danger">*</span></label>
                          <input type="file" className="form-control rounded-3" accept=".pdf,.doc,.docx" onChange={e => setCvFile(e.target.files?.[0] || null)} required />
                        </div>
                        <div className="row g-3 mb-4">
                          <div className="col-md-6">
                            <label className="form-label fw-medium">Chứng chỉ liên quan (nếu có)</label>
                            <input type="file" className="form-control rounded-3" accept=".pdf,.jpg,.png" onChange={e => setCertificateFile(e.target.files?.[0] || null)} />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-medium">Bằng cấp chuyên môn (nếu có)</label>
                            <input type="file" className="form-control rounded-3" accept=".pdf,.jpg,.png" onChange={e => setDegreeFile(e.target.files?.[0] || null)} />
                          </div>
                        </div>

                        <div className="form-check mb-4">
                          <input className="form-check-input" type="checkbox" id="agreeTerms" required />
                          <label className="form-check-label text-muted" htmlFor="agreeTerms">
                            Tôi cam kết những thông tin và tài liệu cung cấp là hoàn toàn chính xác. Tôi đồng ý với các điều khoản và quy định của PolyHUB đối với vai trò Mentor.
                          </label>
                        </div>

                        <div className="d-flex gap-3 mt-4 pt-3 border-top">
                          <Link href="/mentors" className="btn btn-light rounded-pill px-4 fw-medium">Hủy bỏ</Link>
                          <button type="submit" className="btn btn-primary rounded-pill px-5 fw-medium" style={{ backgroundColor: '#4F46E5', border: 'none' }} disabled={loading}>
                            {loading ? <><span className="spinner-border spinner-border-sm me-2"></span> Đang xử lý...</> : 'Gửi Yêu Cầu'}
                          </button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
