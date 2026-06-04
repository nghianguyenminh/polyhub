'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  BookOpen, 
  FileText, 
  AlertOctagon, 
  ArrowUpRight, 
  ArrowDownRight,
  Download
} from 'lucide-react';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { fetchAPI } from '@/lib/api';
import styles from './DashboardOverview.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StatCard {
  title: string;
  value: string;
  trend: number;
  icon: React.ElementType;
  colorClass: string;
}

const recentActivities = [
  { id: 1, user: 'Nguyễn Văn A', action: 'vừa tạo tài khoản mới.', time: '10 phút trước' },
  { id: 2, user: 'Trần Thị B', action: 'đã đăng tải tài liệu "Nhập môn ReactJS".', time: '1 giờ trước' },
  { id: 3, user: 'Lê Văn C', action: 'bị Cảnh cáo do spam nội dung.', time: '3 giờ trước' },
  { id: 4, user: 'Hoàng D', action: 'nâng cấp tài khoản Mentor.', time: '5 giờ trước' },
];

export default function DashboardOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI('/api/admin/dashboard');
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { title: 'Tổng người dùng', value: loading ? '...' : (data?.totalUsers?.toLocaleString() || '0'), icon: Users, colorClass: styles.iconIndigo, trend: 12.5 },
    { title: 'Tài liệu hệ thống', value: loading ? '...' : (data?.totalDocuments?.toLocaleString() || '0'), icon: BookOpen, colorClass: styles.iconOrange, trend: 4.2 },
    { title: 'Tài liệu chờ duyệt', value: loading ? '...' : (data?.pendingDocuments?.toLocaleString() || '0'), icon: FileText, colorClass: styles.iconGreen, trend: -2.4 },
    { title: 'Báo cáo vi phạm', value: loading ? '...' : (data?.totalReports?.toLocaleString() || '0'), icon: AlertOctagon, colorClass: styles.iconRed, trend: 15.3 },
  ];

  // Chart 1: Categories distribution (Pie / Doughnut Chart)
  const categoryChartData = {
    labels: (data?.countByCategory || []).map((row: any) => row[1] || 'Không tên'),
    datasets: [
      {
        label: 'Số lượng tài liệu',
        data: (data?.countByCategory || []).map((row: any) => row[2] || 0),
        backgroundColor: [
          'rgba(79, 70, 229, 0.75)',
          'rgba(242, 113, 37, 0.75)',
          'rgba(16, 185, 129, 0.75)',
          'rgba(239, 68, 68, 0.75)',
          'rgba(245, 158, 11, 0.75)',
          'rgba(59, 130, 246, 0.75)',
          'rgba(139, 92, 246, 0.75)',
        ],
        borderColor: [
          '#4F46E5',
          '#F27125',
          '#10b981',
          '#ef4444',
          '#f59e0b',
          '#3b82f6',
          '#8b5cf6',
        ],
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 12,
          padding: 12,
          font: {
            family: "'Inter', sans-serif",
            size: 11
          }
        }
      }
    }
  };

  // Chart 2: Double Line Chart (Weekly Traffic)
  const weeklyTrafficData = {
    labels: data?.weeklyTraffic?.labels || ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'],
    datasets: [
      {
        label: 'Lượt xem trang (Pageviews)',
        data: data?.weeklyTraffic?.pageviews || [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.35,
        fill: true,
      },
      {
        label: 'Tương tác (Interactions)',
        data: data?.weeklyTraffic?.interactions || [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          font: {
            family: "'Inter', sans-serif",
            size: 12
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Bảng điều khiển</h1>
          <p className={styles.pageSubtitle}>Tổng quan về hoạt động của hệ thống PolyHUB</p>
        </div>
        <button className={styles.actionButton} onClick={() => alert('Đang tạo báo cáo chi tiết...')}>
          <Download size={18} />
          Xuất báo cáo
        </button>
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const isPositive = stat.trend > 0;
          
          return (
            <div key={idx} className={styles.statCard}>
              <div className={styles.statHeader}>
                <h3 className={styles.statTitle}>{stat.title}</h3>
                <div className={`${styles.iconWrapper} ${stat.colorClass}`}>
                  <Icon size={20} />  
                </div>
              </div>
              <p className={styles.statValue}>{stat.value}</p>
              <div className={`${styles.statTrend} ${isPositive ? styles.trendPositive : styles.trendNegative}`}>
                {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                <span>{Math.abs(stat.trend)}%</span>
                <span className={styles.trendText}>so với tháng trước</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Areas */}
      <div className={styles.contentGrid}>
        {/* Weekly Traffic Line Chart */}
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Lưu lượng truy cập tuần qua</h2>
          </div>
          <div style={{ height: '300px', position: 'relative' }}>
            <Line data={weeklyTrafficData} options={lineOptions} />
          </div>
        </div>

        {/* Categories Pie/Doughnut Chart */}
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Phân bổ theo Chuyên ngành</h2>
          </div>
          <div style={{ height: '300px', position: 'relative' }}>
            {data?.countByCategory && data.countByCategory.length > 0 ? (
              <Doughnut data={categoryChartData} options={doughnutOptions} />
            ) : (
              <div className={styles.placeholderArea} style={{ height: '100%' }}>
                Chưa có dữ liệu danh mục tài liệu.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Content: Activity List */}
      <div className={styles.contentCard} style={{ marginTop: '8px' }}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Hoạt động gần đây</h2>
        </div>
        <div className={styles.activityList}>
          {recentActivities.map((activity) => (
            <div key={activity.id} className={styles.activityItem}>
              <div className={styles.activityAvatar}>
                {/* Placeholder for avatar image */}
              </div>
              <div className={styles.activityInfo}>
                <p className={styles.activityText}>
                  <strong>{activity.user}</strong> {activity.action}
                </p>
                <p className={styles.activityTime}>{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
