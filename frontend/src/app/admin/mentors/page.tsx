import { Suspense } from 'react';
import MentorManagement from '@/components/admin/mentors/MentorManagement';

export const metadata = {
  title: 'Kiểm duyệt Mentor | Admin PolyHUB',
  description: 'Quản lý, phê duyệt và cấp quyền Mentor cho người dùng PolyHUB',
};

export default function MentorManagementPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '48px', textAlign: 'center', color: '#4F46E5', fontWeight: 500 }}>
        Đang tải giao diện quản lý...
      </div>
    }>
      <MentorManagement />
    </Suspense>
  );
}
