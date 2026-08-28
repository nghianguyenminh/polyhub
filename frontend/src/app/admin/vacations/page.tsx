'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { Calendar, User, FileText, CheckCircle2, ShieldAlert, Award, Clock, ArrowRight } from 'lucide-react';

interface BusyRequest {
  id: number;
  mentorUsername: string;
  mentorFullname: string;
  startTime: string;
  endTime: string;
  reason: string;
  reliabilityImpact: number;
  adminApproved: boolean;
}

export default function AdminVacationPage() {
  const [requests, setRequests] = useState<BusyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form edit states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [actualPenalty, setActualPenalty] = useState<string>('0.0');
  const [adjustReason, setAdjustReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await fetchAPI('/api/bookings/admin/busy');
      setRequests(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể tải danh sách báo bận');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (req: BusyRequest) => {
    setEditingId(req.id);
    setActualPenalty(req.reliabilityImpact.toString());
    setAdjustReason('');
  };

  const handleApprove = async (id: number) => {
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetchAPI('/api/bookings/admin/approve-busy', {
        method: 'POST',
        body: JSON.stringify({
          busyId: id,
          actualPenalty: parseFloat(actualPenalty),
          adjustmentReason: adjustReason || 'Phê duyệt không điều chỉnh',
        }),
      });
      setSuccessMsg(res.message || 'Phê duyệt đợt nghỉ phép thành công!');
      setEditingId(null);
      loadRequests();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Phê duyệt thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (str: string) => {
    const d = new Date(str);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', color: '#f3f4f6' }}>
      {/* Title */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
          <Calendar style={{ color: '#ef4444' }} /> Duyệt nghỉ phép & Báo bận của Mentor
        </h1>
        <p style={{ color: '#9ca3af', marginTop: '6px', fontSize: '14.5px' }}>
          Quản lý các đợt báo bận đột xuất, xem xét lý do được Gemini AI phân tích, điều chỉnh mức phạt uy tín và phê duyệt.
        </p>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} /> {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div style={{ width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#ef4444', borderRadius: '50%', animation: 'bk-spin 0.7s linear infinite' }} />
          <span style={{ marginLeft: '12px', color: '#9ca3af' }}>Đang tải danh sách báo bận...</span>
        </div>
      ) : requests.length === 0 ? (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
          <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          Không có đợt báo bận nào cần duyệt.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {requests.map((req) => {
            const isEditing = editingId === req.id;
            return (
              <div key={req.id} style={{ background: '#1e293b', border: `1px solid ${req.adminApproved ? 'rgba(255,255,255,0.06)' : 'rgba(239, 68, 68, 0.3)'}`, borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={20} style={{ color: '#ef4444' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{req.mentorFullname}</h3>
                      <span style={{ fontSize: '13px', color: '#9ca3af' }}>@{req.mentorUsername}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12.5px', fontWeight: 'bold', background: req.adminApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: req.adminApproved ? '#34d399' : '#f87171', border: `1px solid ${req.adminApproved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
                      {req.adminApproved ? 'Đã duyệt' : 'Chờ duyệt'}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '18px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '13px', marginBottom: '6px' }}>
                      <Clock size={15} /> Khoảng thời gian xin nghỉ
                    </div>
                    <div style={{ fontSize: '14.5px', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {formatDateTime(req.startTime)}
                      <ArrowRight size={15} style={{ color: '#ef4444' }} />
                      {formatDateTime(req.endTime)}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '13px', marginBottom: '6px' }}>
                      <FileText size={15} /> Lý do xin nghỉ
                    </div>
                    <p style={{ fontSize: '14px', color: '#d1d5db', lineHeight: '1.5' }}>
                      "{req.reason}"
                    </p>
                  </div>


                </div>

                {/* Approval Section */}
                {!req.adminApproved && (
                  <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {!isEditing ? (
                      <button onClick={() => handleStartEdit(req)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                        Phê duyệt &amp; Điều chỉnh phạt
                      </button>
                    ) : (
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ fontSize: '14.5px', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>Cấu hình điểm phạt uy tín thực tế</h4>

                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '14px' }}>
                          <div style={{ flex: '1', minWidth: '180px' }}>
                            <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Mức điểm phạt (%)</label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="100"
                              value={actualPenalty}
                              onChange={(e) => setActualPenalty(e.target.value)}
                              style={{ width: '100%', padding: '8px 12px', background: '#111827', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', outline: 'none' }}
                            />
                          </div>

                          <div style={{ flex: '2', minWidth: '280px' }}>
                            <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Lý do điều chỉnh (lưu feedback loop tự học)</label>
                            <input
                              type="text"
                              value={adjustReason}
                              onChange={(e) => setAdjustReason(e.target.value)}
                              placeholder="Ví dụ: Giảm nhẹ do mentor báo bận đúng quy định..."
                              style={{ width: '100%', padding: '8px 12px', background: '#111827', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', outline: 'none' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => handleApprove(req.id)} disabled={submitting} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13.5px', fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                            {submitting ? 'Đang duyệt...' : 'Đồng ý & Phê duyệt'}
                          </button>
                          <button onClick={() => setEditingId(null)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13.5px', cursor: 'pointer' }}>
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
