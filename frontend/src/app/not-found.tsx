import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      backgroundColor: '#f9fafb',
      fontFamily: 'Inter, sans-serif'
    }}>
      <h1 style={{ fontSize: '100px', fontWeight: 'bold', color: '#4F46E5', margin: 0 }}>404</h1>
      <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Oops! Trang này không tồn tại
      </h2>
      <p style={{ color: '#6B7280', marginBottom: '32px', textAlign: 'center', maxWidth: '400px' }}>
        Có vẻ như đường dẫn bạn đang tìm kiếm đã bị xóa, thay đổi tên hoặc tạm thời không thể truy cập được.
      </p>
      <Link href="/" style={{
        backgroundColor: '#4F46E5',
        color: 'white',
        padding: '10px 24px',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: '500',
        transition: 'background-color 0.2s'
      }}>
        Trở về Trang chủ
      </Link>
    </div>
  );
}
