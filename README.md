# PolyHUB Monorepo

Đây là kho lưu trữ mã nguồn (monorepo) của dự án **PolyHUB** - Cộng đồng chia sẻ kiến thức và kết nối dành cho sinh viên FPT Polytechnic.

Dự án là một hệ sinh thái đồng bộ bao gồm:
*   **Backend (REST API):** Xây dựng trên nền tảng Spring Boot (Java 17).
*   **Frontend (Web App):** Xây dựng bằng Next.js (TypeScript/React 19).
*   **Mobile App (Ứng dụng di động):** Xây dựng bằng Expo (React Native & TypeScript).

---

## 📂 Cấu trúc thư mục (Project Structure)

```text
polyhub/
├── backend/            # Mã nguồn Spring Boot (Java) - Cung cấp REST API & WebSocket Server
├── frontend/           # Mã nguồn Next.js (TypeScript) - Giao diện Web Client & Admin Dashboard
├── Mobile/             # Mã nguồn Expo (React Native) - Ứng dụng di động dành cho sinh viên
├── scripts/            # Các kịch bản tiện ích (Java, Python, PowerShell) hỗ trợ tự động hóa chỉnh sửa HTML/Profile
├── archives/           # Thư mục lưu trữ các tệp tin nén sao lưu (.zip, .rar)
├── .env                # Biến môi trường dùng chung cho các khóa API bên thứ ba (Gemini, ZegoCloud)
├── .gitignore          # Cấu hình bỏ qua tệp tin rác của Git
└── README.md           # Tài liệu hướng dẫn dự án (tệp tin này)
```

---

## 🛠️ Công nghệ sử dụng (Technology Stack)

### 1. Backend
*   **Framework chính:** Spring Boot 4.0.4, Spring Security.
*   **Xác thực & Ủy quyền:** JSON Web Token (JWT) sử dụng thư viện `io.jsonwebtoken` (phiên bản `0.12.6`).
*   **Cơ sở dữ liệu:**
    *   **MySQL:** Lưu trữ dữ liệu quan hệ (người dùng, bài đăng, lịch hẹn, tài liệu, logs...).
    *   **MongoDB:** Lưu trữ dữ liệu phi quan hệ thời gian thực (lịch sử tin nhắn chat, phòng chat).
*   **Kết nối thời gian thực:** Spring Boot WebSocket (STOMP Protocol).
*   **Lưu trữ đám mây:** Cloudinary (dùng để lưu trữ hình ảnh và tệp tải lên).
*   **Trí tuệ nhân tạo:** Google Gemini AI API (Model: `gemini-1.5-flash`).
*   **Thông báo & Xác thực:** SMTP Gmail (gửi mã OTP và thông báo hệ thống).
*   **Công cụ hỗ trợ:** Lombok, Mapstruct, Jackson.

### 2. Frontend (Web App)
*   **Framework:** Next.js (phiên bản 16.2.6), React 19, TypeScript.
*   **Quản lý giao diện & Hoạt họa:** Tailwind CSS (tùy biến), Framer Motion, Lucide React.
*   **Biểu đồ & Thống kê:** Chart.js kết hợp `react-chartjs-2`.
*   **Đàm thoại trực tuyến:** ZegoCloud Web UIKit (`@zegocloud/zego-uikit-prebuilt`).
*   **Kết nối WebSocket:** `@stomp/stompjs` & `sockjs-client`.

### 3. Mobile App (Expo)
*   **Môi trường & Framework:** Expo SDK 54, React Native 0.81.5, TypeScript.
*   **Điều hướng:** React Navigation v7.
*   **Quản lý trạng thái:** Zustand (thay thế Redux giúp tối giản hóa và tăng hiệu năng).
*   **Kết nối mạng:** Axios (kết nối REST API) & `@stomp/stompjs` (chat thời gian thực).
*   **Đàm thoại trực tuyến:** ZegoCloud React Native UIKit (`@zegocloud/zego-uikit-prebuilt-call-rn`).

---

## 🚀 Các tính năng cốt lõi (Core Features)

1.  **Hệ thống tài khoản:**
    *   Đăng ký, Đăng nhập và Đăng xuất dựa trên cơ chế Stateless JWT Token.
    *   Xác minh tài khoản và Khôi phục mật khẩu thông qua mã OTP bảo mật gửi qua Email sinh viên.
    *   Quản lý thông tin cá nhân và tải lên ảnh đại diện (avatar) trực tiếp lên Cloudinary.
2.  **Bản tin cộng đồng (Feed & Social Media):**
    *   Đăng bài viết kèm hình ảnh, thích (Like), bình luận (Comment), chia sẻ (Share) bài viết.
    *   Lưu trữ các bài viết yêu thích (Saved Posts).
    *   Hệ thống báo cáo vi phạm bài viết (Report) để kiểm duyệt nội dung xấu.
3.  **Mạng lưới kết nối sinh viên (Connections):**
    *   Gửi yêu cầu kết nối, đồng ý hoặc từ chối kết nối.
    *   Theo dõi (Follow) hoạt động học tập của các thành viên khác.
4.  **Trò chuyện thời gian thực (Realtime Chat):**
    *   Nhắn tin 1-1 thời gian thực mượt mà thông qua kết nối WebSocket Stomp.
    *   Lưu trữ lịch sử hội thoại lâu dài trên MongoDB Atlas.
5.  **Cuộc gọi thoại & hình ảnh trực tiếp (Voice & Video Calls):**
    *   Cho phép gọi điện trực tiếp giữa các tài khoản thông qua ZegoCloud SDK.
    *   Tích hợp trực tiếp trên Web và Ứng dụng di động (Mobile có cơ chế phát hiện và giả lập mock trên môi trường Expo Go không có native modules).
6.  **Cố vấn học tập (Mentorship & Booking):**
    *   Đăng ký làm Mentor (Cố vấn), quản lý danh sách yêu cầu phê duyệt làm Mentor (Admin).
    *   Mentor chủ động đăng ký lịch rảnh (Mentor Schedule).
    *   Sinh viên dễ dàng đặt lịch hẹn học tập (Booking) với Mentor và nhận phản hồi chấp nhận/từ chối từ Mentor.
7.  **Kho tài liệu học tập (Documents Hub):**
    *   Sinh viên chia sẻ tài liệu học tập cá nhân lên cộng đồng theo các danh mục môn học (Category).
    *   Hệ thống kiểm duyệt tài liệu (Admin Approval) trước khi công bố rộng rãi.
    *   Lưu trữ tài liệu hữu ích (Saved Documents).
8.  **Trợ lý học tập thông minh (AI Assistant):**
    *   Tích hợp Google Gemini AI hỗ trợ sinh viên giải đáp các thắc mắc học tập, ôn luyện kiến thức trực tiếp.
9.  **Bảng quản trị toàn diện (Admin Dashboard):**
    *   Thống kê số lượng truy cập (Visitor Logs), tổng số lượt đặt lịch (Bookings), báo cáo vi phạm (Reports).
    *   Kiểm duyệt và quản lý người dùng, phân quyền (User/Admin).
    *   Quản lý danh sách Mentor và phê duyệt yêu cầu làm Mentor.
    *   Quản lý danh mục học tập, tài liệu chia sẻ, sản phẩm trao đổi (Marketplace) và báo cáo bài viết.

---

## ⚡ Hướng dẫn cài đặt & Khởi chạy (Getting Started)

### 🔑 Cấu hình biến môi trường
Tạo tệp tin `.env` tại thư mục gốc của dự án (`polyhub/`) với nội dung như sau:
```env
GEMINI_API_KEY=AIzaSy... (API Key của Google Gemini)
NEXT_PUBLIC_ZEGOCLOUD_APP_ID=1435055187 (App ID ZegoCloud test)
NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET=b4651... (Server Secret ZegoCloud test)
```

### 1. Khởi chạy Backend (Spring Boot)
*   **Yêu cầu hệ thống:** Java 17+, Maven 3.x, MySQL Server, MongoDB.
*   **Các bước thực hiện:**
    1.  Di chuyển vào thư mục `backend`:
        ```bash
        cd backend
        ```
    2.  Cấu hình kết nối cơ sở dữ liệu MySQL và MongoDB của bạn trong tệp [application.properties](file:///d:/Tien/K19/SP26/JAV202/asm/polyhub/backend/src/main/resources/application.properties).
    3.  Khởi chạy ứng dụng bằng Maven Wrapper:
        ```bash
        # Trên Windows (PowerShell / Command Prompt)
        .\mvnw.cmd spring-boot:run

        # Trên Linux / macOS
        chmod +x mvnw
        ./mvnw spring-boot:run
        ```
    4.  Cổng chạy mặc định của API: `http://localhost:8080`.

### 2. Khởi chạy Frontend (Next.js Web)
*   **Yêu cầu hệ thống:** Node.js 18+ (khuyên dùng v20+), pnpm.
*   **Các bước thực hiện:**
    1.  Di chuyển vào thư mục `frontend`:
        ```bash
        cd frontend
        ```
    2.  Cài đặt các gói phụ thuộc (dependencies):
        ```bash
        pnpm install
        ```
    3.  Khởi chạy dự án ở chế độ phát triển:
        ```bash
        pnpm dev
        ```
    4.  Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000).

### 3. Khởi chạy Ứng dụng Di động (Mobile Expo)
*   **Yêu cầu hệ thống:** Node.js 18+, ứng dụng **Expo Go** trên điện thoại Android/iOS (hoặc máy ảo Android Studio / Xcode).
*   **Các bước thực hiện:**
    1.  Di chuyển vào thư mục `Mobile`:
        ```bash
        cd Mobile
        ```
    2.  Cấu hình địa chỉ IP máy tính chạy Backend của bạn tại tệp [api.ts](file:///d:/Tien/K19/SP26/JAV202/asm/polyhub/Mobile/src/services/api.ts) dòng 16 để ứng dụng di động có thể kết nối được với server API trong cùng mạng Wi-Fi:
        ```typescript
        const apiBase = 'http://<IP_MÁY_TÍNH_CỦA_BẠN>:8080';
        ```
    3.  Cài đặt các gói phụ thuộc:
        ```bash
        pnpm install
        ```
    4.  Khởi động máy chủ đóng gói Expo (Metro bundler):
        ```bash
        pnpm start
        # Hoặc chạy trực tiếp trên thiết bị/giả lập cụ thể:
        pnpm android
        pnpm ios
        ```
    5.  Sử dụng camera điện thoại quét mã QR hiển thị trên màn hình terminal (qua ứng dụng Expo Go trên Android hoặc Camera mặc định trên iOS) để trải nghiệm ứng dụng trực tiếp.
    *   *Lưu ý về ZegoCloud Voice & Video Call:* Do tính năng gọi thoại yêu cầu các thư viện Native và mã biên dịch chuyên sâu, tính năng này không chạy trực tiếp được trên ứng dụng Expo Go thông thường. Để chạy tính năng này trên di động, bạn cần build thành tệp APK (sử dụng lệnh `eas build`) hoặc thiết lập Development Build cục bộ.

---

## 🛠️ Các kịch bản tiện ích (Utility Scripts)
Thư mục `scripts/` chứa các kịch bản giúp đồng bộ hóa dữ liệu và định dạng HTML:
*   `UpdateHtml.java` / `FixHtml.java`: Định dạng các bảng và dropdown trong phần quản trị.
*   `update_profile.py` / `UpdateProfile.java`: Đồng bộ hóa cấu trúc bài viết từ trang chủ (`home.html`) sang trang hồ sơ cá nhân (`profile.html`).
*   `update.ps1`: Tự động chạy toàn bộ quy trình đồng bộ hóa bằng PowerShell.

## Lấy API KEY ChatBot Client
Truy cập "console.groq.com" đăng nhập bằng tài khoản google sau đó tạo API key và chép key vào Application Properties local
[https://console.groq.com/keys](https://console.groq.com/keys)
