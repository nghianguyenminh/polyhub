'use client';

import React from 'react';
import { 
  Users, 
  BookOpen, 
  FileText, 
  AlertOctagon, 
  ArrowUpRight, 
  ArrowDownRight,
  Download
} from 'lucide-react';
import styles from './DashboardOverview.module.css';

// --- Types & Mock Data ---
interface StatCard {
  title: string;
  value: string;
  trend: number;
  icon: React.ElementType;
  colorClass: string;
}

const stats: StatCard[] = [
  { title: 'Tổng người dùng', value: '12,450', trend: 12.5, icon: Users, colorClass: styles.iconIndigo },
  { title: 'Khóa học & Danh mục', value: '342', trend: 4.2, icon: BookOpen, colorClass: styles.iconOrange },
  { title: 'Tài liệu chờ duyệt', value: '89', trend: -2.4, icon: FileText, colorClass: styles.iconGreen },
  { title: 'Báo cáo vi phạm', value: '14', trend: 15.3, icon: AlertOctagon, colorClass: styles.iconRed },
];

const recentActivities = [
  { id: 1, user: 'Nguyễn Văn A', action: 'vừa tạo tài khoản mới.', time: '10 phút trước' },
  { id: 2, user: 'Trần Thị B', action: 'đã đăng tải tài liệu "Nhập môn ReactJS".', time: '1 giờ trước' },
  { id: 3, user: 'Lê Văn C', action: 'bị Cảnh cáo do spam nội dung.', time: '3 giờ trước' },
  { id: 4, user: 'Hoàng D', action: 'nâng cấp tài khoản Mentor.', time: '5 giờ trước' },
];

export default function DashboardOverview() {
  return (
    <div className={styles.container}>
      {/* Page Header */}
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Bảng điều khiển</h1>
          <p className={styles.pageSubtitle}>Tổng quan về hoạt động của hệ thống PolyHUB</p>
        </div>
        <button className={styles.actionButton}>
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
        {/* Chart Area */}
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Lưu lượng truy cập</h2>
            {/* Optional: Add a simple dropdown or filter button here */}
          </div>
          <div className={styles.placeholderArea}>
            Khu vực gắn Biểu đồ (e.g., Recharts hoặc Chart.js)
          </div>
        </div>

        {/* Activity Area */}
        <div className={styles.contentCard}>
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
    </div>
  );
}
