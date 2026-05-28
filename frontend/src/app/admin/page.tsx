'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchAPI('/api/admin/dashboard');
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      }
    };
    loadStats();
  }, []);

  if (!stats) {
    return <div className="text-center mt-5"><div className="spinner-border text-poly" /></div>;
  }

  const trafficData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Lượt truy cập',
        data: stats.trafficData || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
    ],
  };

  const trafficOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { borderDash: [5, 5], color: '#E5E7EB' }, ticks: { font: { size: 11 } } },
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };

  const categoryDataArray = stats.countByCategory || [];
  const majorLabels = categoryDataArray.length > 0 ? categoryDataArray.map((c: any) => c[1]) : ['Chưa có dữ liệu'];
  const majorDataCount = categoryDataArray.length > 0 ? categoryDataArray.map((c: any) => c[2]) : [1];
  const bgColors = categoryDataArray.length > 0 
    ? ['#4F46E5', '#818CF8', '#C7D2FE', '#8B5CF6', '#A78BFA', '#DDD6FE', '#6366F1', '#E5E7EB'] 
    : ['#E5E7EB'];

  const majorData = {
    labels: majorLabels,
    datasets: [
      {
        data: majorDataCount,
        backgroundColor: bgColors,
        borderWidth: 3,
        borderColor: '#ffffff',
      },
    ],
  };

  const majorOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 10, font: { size: 12 }, padding: 15 } } },
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-uppercase text-muted" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>
              <li className="breadcrumb-item"><Link href="/admin" className="text-decoration-none text-muted">Trang chủ</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Bảng điều khiển</li>
            </ol>
          </nav>
          <h3 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-1px' }}>Tổng quan PolyHUB</h3>
        </div>
        <button className="btn btn-primary btn-sm rounded-pill px-3 py-2 fw-medium d-flex align-items-center gap-2" style={{ backgroundColor: '#4F46E5', border: 'none' }}>
          <i className="bi bi-file-earmark-arrow-down fs-6"></i> Xuất báo cáo
        </button>
      </div>

      <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3 mb-4">
        <div className="col">
          <div className="poly-card p-3 d-flex align-items-center gap-3 h-100 bg-white rounded-3 shadow-sm border-0">
            <div className="icon-box-lg bg-primary-soft rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5' }}>
              <i className="bi bi-people fs-4"></i>
            </div>
            <div>
              <div className="text-muted fw-medium" style={{ fontSize: '13px' }}>Tổng người dùng</div>
              <h4 className="fw-bold mb-0" style={{ color: 'var(--text-dark)' }}>{stats.totalUsers}</h4>
              <div className="stat-indicator text-success" style={{ fontSize: '11px' }}><i className="bi bi-arrow-up"></i> 15% <span className="text-muted">vs hôm qua</span></div>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="poly-card p-3 d-flex align-items-center gap-3 h-100 bg-white rounded-3 shadow-sm border-0">
            <div className="icon-box-lg rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', backgroundColor: 'rgba(40, 167, 69, 0.1)', color: '#28a745' }}>
              <i className="bi bi-collection fs-4"></i>
            </div>
            <div>
              <div className="text-muted fw-medium" style={{ fontSize: '13px' }}>Tổng Số Tài Liệu</div>
              <h4 className="fw-bold mb-0" style={{ color: 'var(--text-dark)' }}>{stats.totalDocuments}</h4>
              <div className="stat-indicator text-success" style={{ fontSize: '11px' }}><i className="bi bi-arrow-up"></i> 5% <span className="text-muted">vs hôm qua</span></div>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="poly-card p-3 d-flex align-items-center gap-3 h-100 bg-white rounded-3 shadow-sm border-0">
            <div className="icon-box-lg rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', backgroundColor: 'rgba(255, 193, 7, 0.1)', color: '#ffc107' }}>
              <i className="bi bi-patch-exclamation fs-4"></i>
            </div>
            <div>
              <div className="text-muted fw-medium" style={{ fontSize: '13px' }}>Mentor chờ duyệt</div>
              <h4 className="fw-bold mb-0" style={{ color: 'var(--text-dark)' }}>{stats.pendingMentors}</h4>
              <div className="stat-indicator text-danger" style={{ fontSize: '11px' }}>Cần xử lý</div>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="poly-card p-3 d-flex align-items-center gap-3 h-100 bg-white rounded-3 shadow-sm border-0">
            <div className="icon-box-lg rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', backgroundColor: 'rgba(220, 53, 69, 0.1)', color: '#dc3545' }}>
              <i className="bi bi-flag fs-4"></i>
            </div>
            <div>
              <div className="text-muted fw-medium" style={{ fontSize: '13px' }}>Báo cáo vi phạm</div>
              <h4 className="fw-bold mb-0" style={{ color: 'var(--text-dark)' }}>{stats.totalReports}</h4>
              <div className="stat-indicator text-danger" style={{ fontSize: '11px' }}><i className="bi bi-arrow-up"></i> Tăng nhẹ</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-xl-8">
          <div className="poly-card p-4 h-100 bg-white rounded-3 shadow-sm border-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-dark mb-0">Lưu lượng truy cập hệ thống (Năm nay)</h6>
              <div className="badge bg-light text-dark border fw-medium" style={{ fontSize: '11px' }}>Cập nhật tự động</div>
            </div>
            <div className="chart-container" style={{ position: 'relative', height: '250px', width: '100%' }}>
              <Line data={trafficData} options={trafficOptions} />
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="poly-card p-4 h-100 bg-white rounded-3 shadow-sm border-0">
            <h6 className="fw-bold text-dark mb-3">Tỉ lệ tài liệu theo Chuyên ngành</h6>
            <div className="chart-container" style={{ height: '250px' }}>
              <Doughnut data={majorData} options={majorOptions} />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-5">
        <div className="col-12">
          <div className="poly-card p-4 bg-white rounded-3 shadow-sm border-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-dark mb-0">Yêu cầu Mentor đang chờ duyệt <i className="bi bi-fire text-danger"></i></h6>
              <Link href="/admin/mentors" className="text-decoration-none fw-medium" style={{ fontSize: '13px', color: '#4F46E5' }}>Xem tất cả</Link>
            </div>
            
            <div className="table-responsive">
              <table className="table table-hover mb-0" style={{ fontSize: '13.5px' }}>
                <thead className="table-light">
                  <tr>
                    <th scope="col" style={{ width: '25px' }}></th>
                    <th scope="col">Ứng viên</th>
                    <th scope="col">Ngày gửi</th>
                    <th scope="col">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.pendingRequests && stats.pendingRequests.length > 0 ? (
                    stats.pendingRequests.map((req: any) => (
                      <tr key={req.id}>
                        <td className="text-center align-middle"><input className="form-check-input shadow-none" type="checkbox" /></td>
                        <td className="align-middle">
                          <div className="d-flex align-items-center gap-2">
                            <img 
                              src={req.avatar && req.avatar !== 'default.png' ? req.avatar : `https://ui-avatars.com/api/?name=${req.fullname}`} 
                              className="rounded-circle" width="30" height="30" alt="avatar" 
                            />
                            <div style={{ lineHeight: '1.2' }}>
                              <div className="fw-semibold text-dark">{req.fullname}</div>
                              <div className="text-muted" style={{ fontSize: '11px' }}>{req.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle text-muted">
                          {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="align-middle">
                          <Link href={`/admin/mentors`} className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-medium" style={{ fontSize: '12px' }}>
                            Xem hồ sơ
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted">Hiện tại không có yêu cầu nào đang chờ xử lý.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
