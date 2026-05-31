import DocumentManagement from '@/components/admin/documents/DocumentManagement';

export const metadata = {
  title: 'Quản lý Tài liệu | Admin PolyHUB',
  description: 'Quản lý, phê duyệt và gỡ bỏ tài liệu trên hệ thống PolyHUB',
};

export default function DocumentManagementPage() {
  return <DocumentManagement />;
}
