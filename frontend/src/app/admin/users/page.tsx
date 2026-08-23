import React from 'react';
import UserManagement from '@/components/admin/users/UserManagement';

export const metadata = {
  title: 'Quản lý Người dùng | PolyHUB Admin',
  description: 'Quản lý người dùng, phân quyền và khóa tài khoản',
};

export default function AdminUsersPage() {
  return <UserManagement />;
}
