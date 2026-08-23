import { Suspense } from 'react';
import DocumentManagement from '@/components/admin/documents/DocumentManagement';

export const metadata = {
  title: 'Quản lý Tài liệu | Admin PolyHUB',
  description: 'Quản lý, phê duyệt và gỡ bỏ tài liệu trên hệ thống PolyHUB',
};

export default function DocumentManagementPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '48px', textAlign: 'center', color: '#4F46E5', fontWeight: 500 }}>
        Đang tải giao diện quản lý...
      </div>
    }>
      <DocumentManagement />
    </Suspense>
  );
}
