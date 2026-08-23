# PolyHUB Frontend — Web Application

> Giao diện web chính của hệ thống **PolyHUB** — Mạng xã hội học tập dành riêng cho sinh viên FPT Polytechnic.

## 🛠️ Công nghệ sử dụng

| Công nghệ | Phiên bản | Mô tả |
|---|---|---|
| **Next.js** | 16.2.6 | Framework React full-stack (App Router) |
| **React** | 19.2.4 | Thư viện UI |
| **TypeScript** | ^5 | Ngôn ngữ lập trình có kiểu dữ liệu tĩnh |
| **Bootstrap** | 5.3.3 | CSS Framework (CDN) |
| **Bootstrap Icons** | 1.11.3 | Bộ icon (CDN) |
| **Framer Motion** | ^12.40.0 | Thư viện hoạt họa (animations) |
| **Lucide React** | ^1.17.0 | Bộ icon SVG |
| **Chart.js** + react-chartjs-2 | ^4.5.1 / ^5.3.1 | Biểu đồ & thống kê |
| **Axios** | ^1.17.0 | HTTP Client |
| **@stomp/stompjs** + sockjs-client | ^7.3.0 / ^1.6.1 | WebSocket (Chat thời gian thực) |
| **@zegocloud/zego-uikit-prebuilt** | ^2.17.3 | Đàm thoại trực tuyến (Video Call) |
| **Google Fonts (Inter)** | — | Typography |

## 📁 Cấu trúc thư mục

```
frontend/
├── src/
│   ├── app/                        # App Router (Next.js 16)
│   │   ├── layout.tsx              # Root layout (AuthProvider, Bootstrap CDN)
│   │   ├── page.tsx                # Trang chủ (Homepage / Feed)
│   │   ├── login/                  # Trang đăng nhập
│   │   ├── register/               # Trang đăng ký
│   │   ├── forgot-password/        # Quên mật khẩu (gửi OTP qua email)
│   │   ├── verify-otp/             # Xác thực OTP & đặt lại mật khẩu
│   │   ├── profile/                # Trang cá nhân
│   │   ├── settings/               # Cài đặt tài khoản
│   │   ├── chat/                   # Nhắn tin thời gian thực (WebSocket)
│   │   ├── bookings/               # Đặt lịch hẹn Call Video với Mentor
│   │   ├── mentors/                # Danh sách Mentor & đăng ký làm Mentor
│   │   ├── documents/              # Tài liệu học tập (upload/download)
│   │   ├── groups/                 # Nhóm học tập
│   │   ├── connections/            # Bạn bè / Kết nối
│   │   ├── saved/                  # Bài viết đã lưu
│   │   ├── events/                 # Sự kiện
│   │   ├── videos/                 # Video Call (ZegoCloud)
│   │   └── admin/                  # Trang quản trị (Admin Panel)
│   │       ├── layout.tsx          # Layout riêng cho Admin
│   │       ├── page.tsx            # Dashboard tổng quan
│   │       ├── users/              # Quản lý người dùng
│   │       ├── categories/         # Quản lý chuyên ngành (CRUD, toggle trạng thái)
│   │       ├── documents/          # Quản lý tài liệu
│   │       ├── mentors/            # Quản lý Mentor
│   │       ├── groups/             # Quản lý nhóm
│   │       └── reports/            # Quản lý báo cáo vi phạm
│   ├── components/                 # React Components tái sử dụng
│   │   ├── admin/                  # Components cho Admin Panel
│   │   │   ├── categories/         # CategoryManagement (thêm/sửa/xóa/toggle)
│   │   │   ├── dashboard/          # Dashboard widgets & charts
│   │   │   ├── documents/          # Document management
│   │   │   ├── layout/             # Admin Sidebar, Header
│   │   │   ├── mentors/            # Mentor management
│   │   │   └── users/              # User management (tạo user, chi tiết user)
│   │   ├── chat/                   # Chat components
│   │   ├── common/                 # Shared components
│   │   ├── layout/                 # Header, Sidebar, SplashScreen
│   │   ├── mentors/                # Mentor components
│   │   └── post/                   # Post components (Feed, Create, Actions)
│   ├── contexts/                   # React Context Providers
│   │   └── AuthContext.tsx         # Xác thực & quản lý phiên đăng nhập
│   ├── lib/                        # Utility functions
│   │   └── api.ts                  # fetchAPI wrapper (JWT, error handling, 401/403)
│   └── styles/                     # CSS Stylesheets
│       ├── auth.css                # Giao diện đăng nhập/đăng ký
│       ├── bookings.css            # Giao diện lịch hẹn
│       ├── chat.css                # Giao diện chat
│       ├── style.css               # Styles chung
│       └── ...                     # Các file CSS khác theo chức năng
├── package.json
└── tsconfig.json
```

## 🚀 Hướng dẫn khởi chạy

### Yêu cầu
- **Node.js** 18+ (khuyến nghị 20+)
- **pnpm** hoặc **npm**

### Cài đặt & chạy

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt dependencies
pnpm install
# hoặc: npm install

# 3. Chạy development server
pnpm dev
# hoặc: npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

### Biến môi trường

Tạo file `.env.local` (hoặc sử dụng file `.env` ở thư mục gốc dự án):

```env
# Backend API URL (mặc định: http://localhost:8080)
NEXT_PUBLIC_API_URL=http://localhost:8080

# ZegoCloud Video Call
NEXT_PUBLIC_ZEGOCLOUD_APP_ID=<App ID>
NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET=<Server Secret>
```

## 📋 Chức năng chính

### 🔐 Xác thực & Phân quyền
- Đăng nhập / Đăng ký (với particle animation background)
- Quên mật khẩu → Gửi OTP qua email → Đặt lại mật khẩu
- JWT Token authentication
- Phân quyền theo vai trò: `STUDENT`, `MENTOR`, `CONTENT_ADMIN`, `USER_ADMIN`, `ADMIN`, `SUPER_ADMIN`

### 📰 Mạng xã hội
- News Feed với infinite scroll
- Tạo bài viết (hỗ trợ AI Gemini soạn nội dung)
- Like, Comment, Share, Save bài viết
- Báo cáo bài viết vi phạm

### 💬 Chat thời gian thực
- Nhắn tin 1-1 qua WebSocket (STOMP protocol)
- Giao diện chat giống Messenger

### 📅 Đặt lịch hẹn Mentor
- Sinh viên đặt lịch call video với Mentor
- Mentor duyệt / từ chối lịch hẹn
- Thông báo qua email khi duyệt/từ chối
- Tích hợp ZegoCloud video call

### 📚 Tài liệu học tập
- Upload / Download tài liệu theo chuyên ngành
- Lọc theo danh mục (category)

### 👨‍💼 Admin Panel
- **Dashboard:** Thống kê tổng quan (biểu đồ Chart.js)
- **Quản lý người dùng:** Tạo, xem chi tiết, khóa/mở tài khoản
- **Quản lý chuyên ngành:** Thêm/Sửa/Xóa danh mục, bật/tắt trạng thái (toggle switch)
- **Quản lý tài liệu:** Phê duyệt, xóa tài liệu
- **Quản lý Mentor:** Phê duyệt đăng ký Mentor
- **Quản lý báo cáo vi phạm:** Xem chi tiết, cảnh báo (gửi email), yêu cầu khóa tài khoản, xóa bài viết

## 🔗 Kết nối Backend

Frontend kết nối đến backend Spring Boot tại `http://localhost:8080` (mặc định).

Tất cả API calls đều đi qua hàm `fetchAPI()` trong `src/lib/api.ts`, tự động:
- Gắn JWT token vào header `Authorization`
- Xử lý lỗi 401 (redirect về `/login`) và 403 (thông báo không có quyền)
- Log lỗi API ra console

---

> **Lưu ý:** Đảm bảo backend đã được khởi chạy trước khi truy cập frontend.
