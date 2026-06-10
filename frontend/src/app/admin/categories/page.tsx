import React from 'react';
import CategoryManagement from '@/components/admin/categories/CategoryManagement';

export const metadata = {
  title: 'Quản lý Chuyên ngành | PolyHUB Admin',
  description: 'Quản lý chuyên ngành và danh mục',
};

export default function AdminCategoriesPage() {
  return <CategoryManagement />;
}
