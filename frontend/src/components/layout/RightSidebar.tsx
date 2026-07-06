'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

export default function RightSidebar() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [mentorsRes, docsRes] = await Promise.all([
          fetchAPI('/api/mentors?page=1'),
          fetchAPI('/api/documents?page=1&size=3')
        ]);

        if (mentorsRes.mentors) {
          setMentors(mentorsRes.mentors.slice(0, 2));
        }
        if (docsRes.documents) {
          setDocuments(docsRes.documents.slice(0, 3));
        }
      } catch (error) {
        console.error('Lỗi tải dữ liệu sidebar:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getDocIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'PDF': return { icon: 'bi-file-earmark-pdf-fill', color: 'danger', bg: 'rgba(220,53,69,0.1)' };
      case 'DOC':
      case 'DOCX': return { icon: 'bi-file-earmark-word-fill', color: 'primary', bg: 'rgba(13,110,253,0.1)' };
      case 'ZIP':
      case 'RAR': return { icon: 'bi-file-earmark-zip-fill', color: 'warning', bg: 'rgba(255,193,7,0.15)' };
      default: return { icon: 'bi-file-earmark-fill', color: 'secondary', bg: 'rgba(108,117,125,0.1)' };
    }
  };

  const handleDownload = async (doc: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetchAPI(`/api/documents/${doc.id}/download`, { method: 'POST' });
      if (res.downloadUrl) {
        window.open(res.downloadUrl, '_blank');
      }
    } catch (err: any) {
      console.error('Lỗi tải tài liệu', err);
    }
  };

  return (
    <div className="poly-sidebar-right d-none d-xl-block" style={{ padding: '0 5px' }}>
      <div className="d-flex justify-content-between align-items-center mb-3 mt-2">
        <div className="text-muted fw-bold" style={{ fontSize: '13px', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="bi bi-stars text-warning fs-5"></i> GỢI Ý MENTOR
        </div>
        <Link href="/mentors" className="text-decoration-none text-poly fw-medium" style={{ fontSize: '13px' }}>Xem thêm</Link>
      </div>

      {loading ? (
        <div className="text-center p-3 text-muted" style={{ fontSize: '13px' }}>Đang tải...</div>
      ) : mentors.length === 0 ? (
        <div className="text-center p-4 text-muted bg-white rounded-3 border" style={{ fontSize: '13px' }}>Chưa có gợi ý nào.</div>
      ) : (
        mentors.map((mentor) => (
          <div key={mentor.id} className="mentor-suggestion-card mb-3" style={{
            borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)', transition: 'all 0.3s ease',
            background: '#fff', cursor: 'pointer'
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(255,115,0,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,115,0,0.2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
            onClick={() => router.push(`/mentors/${mentor.user?.username}`)}
          >
            <div className="mentor-cover" style={{
              height: '65px',
              background: `linear-gradient(135deg, rgba(255, 255, 255, 0), rgba(245, 245, 245, 0.85)), url('https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=400')`,
              backgroundSize: 'cover', backgroundPosition: 'center'
            }}></div>
            <div className="mentor-info" style={{ padding: '0 16px 16px', position: 'relative', marginTop: '-25px' }}>
              <img
                src={mentor.user?.avatar && mentor.user?.avatar !== 'default.png' ? mentor.user.avatar : `https://ui-avatars.com/api/?name=${mentor.fullname}&background=random`}
                className="mentor-avatar" alt="avatar"
                style={{ width: '54px', height: '54px', borderRadius: '50%', border: '3px solid #fff', objectFit: 'cover', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              />
              <div className="d-flex justify-content-between align-items-start mt-2">
                <div>
                  <div className="fw-bold text-dark text-truncate" style={{ fontSize: '15px', maxWidth: '140px' }}>{mentor.fullname}</div>
                  <div className="text-muted text-truncate" style={{ fontSize: '12px', marginTop: '2px', maxWidth: '140px' }}>{mentor.user?.major || 'Chuyên gia IT'}</div>
                </div>
                <button className="btn-icon-circle" style={{
                  width: '32px', height: '32px', borderRadius: '50%', border: 'none', flexShrink: 0,
                  background: 'rgba(255,115,0,0.1)', color: '#ff7300', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#ff7300'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,115,0,0.1)'; e.currentTarget.style.color = '#ff7300'; }}
                  title="Xem chi tiết"
                >
                  <i className="bi bi-arrow-right-short fs-4"></i>
                </button>
              </div>

              <div className="mt-3 d-flex gap-2 align-items-center bg-light rounded-pill px-2 py-1" style={{ width: 'fit-content' }}>
                <div className="d-flex align-items-center text-warning fw-bold" style={{ fontSize: '12px' }}>
                  <i className="bi bi-star-fill me-1"></i> {mentor.averageRating > 0 ? mentor.averageRating : '5.0'}
                </div>
                <div className="text-muted" style={{ fontSize: '11px' }}>
                  ({mentor.reviewCount} đánh giá)
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      <div className="d-flex justify-content-between align-items-center mb-3 mt-4">
        <div className="text-muted fw-bold" style={{ fontSize: '13px', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="bi bi-journal-text text-primary fs-5"></i> TÀI LIỆU MỚI
        </div>
        <Link href="/documents" className="text-decoration-none text-poly fw-medium" style={{ fontSize: '13px' }}>Xem tất cả</Link>
      </div>

      {loading ? (
        <div className="text-center p-3 text-muted" style={{ fontSize: '13px' }}>Đang tải...</div>
      ) : documents.length === 0 ? (
        <div className="text-center p-4 text-muted bg-white rounded-3 border" style={{ fontSize: '13px' }}>Chưa có tài liệu nào.</div>
      ) : (
        documents.map((doc) => {
          const docStyle = getDocIcon(doc.documentType);
          return (
            <div key={doc.id} onClick={() => router.push(`/documents/${doc.id}`)} className="d-flex align-items-center mb-3 p-2 bg-white rounded-3" style={{
              transition: 'all 0.3s ease', cursor: 'pointer',
              border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = 'rgba(13,110,253,0.2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
            >
              <div className={`text-${docStyle.color} rounded-3 d-flex justify-content-center align-items-center me-3`} style={{ width: '48px', height: '48px', flexShrink: 0, background: docStyle.bg }}>
                <i className={`bi ${docStyle.icon} fs-4`}></i>
              </div>
              <div className="flex-grow-1 overflow-hidden">
                <div className="fw-bold text-dark text-truncate mb-1" style={{ fontSize: '14px' }} title={doc.title}>{doc.title}</div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge fw-medium" style={{ fontSize: '10px', background: '#f8f9fa', color: '#6c757d', border: '1px solid #dee2e6' }}>{doc.documentType || 'DOC'}</span>
                  <span className="text-muted" style={{ fontSize: '11px' }}><i className="bi bi-download me-1"></i>{doc.downloadCount || 0}</span>
                </div>
              </div>
              <button
                onClick={(e) => handleDownload(doc, e)}
                className="btn btn-sm rounded-circle text-muted ms-1" style={{ width: '32px', height: '32px', flexShrink: 0, border: '1px solid #dee2e6', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e9ecef'; e.currentTarget.style.color = '#495057'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.color = '#6c757d'; }}
                title="Tải xuống"
              >
                <i className="bi bi-cloud-arrow-down" style={{ fontSize: '14px' }}></i>
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
