# PolyHUB Monorepo

Đây là kho lưu trữ mã nguồn (monorepo) của dự án **PolyHUB** - Cộng đồng chia sẻ kiến thức và kết nối dành cho sinh viên FPT Polytechnic.

Dự án được phân chia thành hai phần chính: Frontend (Next.js React) và Backend (Spring Boot Java).

---

## 📂 Cấu trúc thư mục (Project Structure)

```text
polyhub/
├── backend/            # Mã nguồn Spring Boot (Java) - API & Server-side templates
├── frontend/           # Mã nguồn Next.js (TypeScript/React) - Giao diện người dùng
├── scripts/            # Các kịch bản tiện ích hỗ trợ (Java, Python, PowerShell)
├── archives/           # Thư mục lưu trữ các tệp tin nén sao lưu (.zip, .rar)
├── .gitignore          # Cấu hình bỏ qua tệp tin rác của Git
└── README.md           # Tài liệu hướng dẫn dự án (tệp tin này)
```

---

## 🚀 Hướng dẫn khởi chạy dự án (Getting Started)

### 1. Khởi chạy Backend (Spring Boot)
Yêu cầu hệ thống: Java 17+, Maven.

1. Di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Cấu hình cơ sở dữ liệu MySQL và MongoDB trong tệp [application.properties](file:///d:/Tien/K19/SP26/JAV202/asm/polyhub/backend/src/main/resources/application.properties).
3. Khởi chạy dự án bằng Maven:
   ```bash
   ./mvnw spring-boot:run
   ```

### 2. Khởi chạy Frontend (Next.js)
Yêu cầu hệ thống: Node.js 18+.

1. Di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```
2. Cài đặt các gói phụ thuộc (dependencies):
   ```bash
   npm install
   ```
3. Chạy môi trường phát triển (development server):
   ```bash
   npm run dev
   ```
4. Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Các kịch bản tiện ích (Utility Scripts)
Thư mục `scripts/` chứa các tệp tin hỗ trợ tự động hóa chỉnh sửa giao diện HTML cho phía Admin/Client:
- `UpdateHtml.java` / `FixHtml.java`: Định dạng lại bảng tài liệu và dropdown trong bảng quản trị.
- `update_profile.py` / `UpdateProfile.java`: Đồng bộ hóa vùng chứa bài viết từ trang chủ (`home.html`) sang trang cá nhân (`profile.html`).
- `update.ps1`: Kịch bản PowerShell tự động hóa đồng bộ.

*Lưu ý: Tất cả các kịch bản đã được cập nhật đường dẫn tương đối trỏ chính xác vào `./backend` để có thể chạy trực tiếp từ thư mục gốc của dự án.*
