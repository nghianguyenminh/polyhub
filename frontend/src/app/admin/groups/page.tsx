'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import '@/styles/admin-groups.css';

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Gọi API tạm (sẽ sửa khi nâng cấp SWR)
    const loadGroups = async () => {
      setLoading(true);
      try {
        const data = await fetchAPI('/api/admin/groups?page=1');
        setGroups(data.groups || []);
      } catch (err) {
        console.error('Failed to load groups', err);
      } finally {
        setLoading(false);
      }
    };
    loadGroups();
  }, []);

  return (
    <>
      {/* Header & Breadcrumb */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-uppercase text-muted" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>
              <li className="breadcrumb-item"><Link href="/admin" className="text-decoration-none text-muted">Trang chủ</Link></li>
              <li className="breadcrumb-item"><span className="text-muted">Kiểm duyệt Cộng đồng</span></li>
              <li className="breadcrumb-item active" aria-current="page">Nhóm học tập</li>
            </ol>
          </nav>
          <h3 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Quản lý Nhóm học tập</h3>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-2 fw-medium d-flex align-items-center gap-2">
            <i className="bi bi-download"></i> Xuất Dữ Liệu
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="kpi-card kpi-total">
            <div className="kpi-icon"><i className="bi bi-collection"></i></div>
            <div>
              <div className="kpi-value">1,245</div>
              <div className="kpi-label">Tổng số nhóm</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="kpi-card kpi-new">
            <div className="kpi-icon"><i className="bi bi-stars"></i></div>
            <div>
              <div className="kpi-value text-success">+34</div>
              <div className="kpi-label">Nhóm mới tuần này</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="kpi-card kpi-reported">
            <div className="kpi-icon"><i className="bi bi-flag-fill"></i></div>
            <div>
              <div className="kpi-value text-danger">8</div>
              <div className="kpi-label">Nhóm bị Report</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="kpi-card kpi-inactive">
            <div className="kpi-icon"><i className="bi bi-moon-stars"></i></div>
            <div>
              <div className="kpi-value">150</div>
              <div className="kpi-label">Nhóm &quot;Ma&quot; (Inactive)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div className="filter-card">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-4 col-lg-4">
            <div className="search-input-wrapper">
              <i className="bi bi-search"></i>
              <input type="text" className="form-control" placeholder="Tìm theo Tên nhóm, Trưởng nhóm hoăc MSSV..." />
            </div>
          </div>
          <div className="col-12 col-md-8 col-lg-8">
            <div className="d-flex gap-2 flex-wrap justify-content-md-end">
              <select className="bs-select-mock form-select d-inline-block w-auto">
                <option value="">Tất cả Trạng thái</option>
                <option value="REPORTED">Đang bị Report</option>
                <option value="PUBLIC">Nhóm Public</option>
                <option value="PRIVATE">Nhóm Private</option>
                <option value="LOCKED">Nhóm Khóa/Đình chỉ</option>
              </select>
              <select className="bs-select-mock form-select d-inline-block w-auto">
                <option value="">Tất cả Ngành học</option>
                <option value="UDPM">Ứng dụng phần mềm</option>
                <option value="TKDH">Thiết kế đồ họa</option>
                <option value="DM">Digital Marketing</option>
                <option value="WEB">Lập trình Web</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-container mb-4">
        <div className="table-responsive" style={{ minHeight: '400px' }}>
          <table className="table table-hover admin-table mb-0 align-middle" style={{ fontSize: '13.5px' }}>
            <thead className="table-light">
              <tr>
                <th scope="col" className="ps-4">Thông tin Nhóm</th>
                <th scope="col">Trưởng nhóm</th>
                <th scope="col">Thành viên</th>
                <th scope="col">Mức độ HĐ</th>
                <th scope="col">Trạng thái</th>
                <th scope="col" className="text-center" style={{ paddingRight: '1.5rem' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {/* Fake Data Layout (Giống Template HTML cũ) */}
              <tr>
                <td className="ps-4">
                  <div className="d-flex align-items-center gap-3">
                    <img src="https://ui-avatars.com/api/?name=Java&background=E0E7FF&color=4338CA" className="group-avatar" alt="avt"/>
                    <div style={{ lineHeight: '1.4' }}>
                      <div className="fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: '14px' }}>
                        Cộng đồng Java Spring 
                        <span className="badge-privacy badge-public">Public</span>
                      </div>
                      <div className="text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>Tag: #UngDungPhanMem</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <img src="https://ui-avatars.com/api/?name=Thành+Lê&background=random" className="owner-avatar" alt="avt"/>
                    <div>
                      <div className="text-dark fw-medium" style={{ fontSize: '13px' }}>Lê Văn Thành</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>PS12345</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="fw-semibold text-dark"><i className="bi bi-people-fill text-muted me-1"></i> 156</span>
                </td>
                <td>
                  <div className="activity-indicator">
                    <i className="bi bi-graph-up-arrow text-success"></i> 24 bài/tuần
                  </div>
                </td>
                <td>
                  <span className="status-badge status-active">
                    <span className="status-dot"></span> Hoạt động
                  </span>
                </td>
                <td className="text-center" style={{ paddingRight: '1.5rem' }}>
                  <div className="dropdown">
                    <button className="btn-action-dots mx-auto" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                      <i className="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end action-menu shadow">
                      <li><a className="dropdown-item" href="#"><i className="bi bi-flag-fill text-primary"></i> Xem Reports</a></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><a className="dropdown-item item-warning" href="#" data-bs-toggle="modal" data-bs-target="#warnModal"><i className="bi bi-exclamation-triangle"></i> Gửi cảnh cáo</a></li>
                      <li><a className="dropdown-item item-danger" href="#" data-bs-toggle="modal" data-bs-target="#lockModal"><i className="bi bi-lock-fill"></i> Khóa nhóm</a></li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </>
  );
}
