# PolyHUB Monorepo

Đây là kho lưu trữ mã nguồn (monorepo) của dự án **PolyHUB** - Cộng đồng chia sẻ kiến thức và kết nối dành cho sinh viên FPT Polytechnic.

Dự án là một hệ sinh thái đồng bộ bao gồm:
*   **Backend (REST API):** Xây dựng trên nền tảng Spring Boot (Java 17).
*   **Frontend (Web App):** Xây dựng bằng Next.js (TypeScript/React 19).
*   **Mobile App (Ứng dụng di động):** Xây dựng bằng Expo (React Native & TypeScript).
*   **OCR Service (Python Microservice):** Dịch vụ nhận dạng CCCD thay thế FPT.AI, chạy bằng Python 3.11.

---

## 📂 Cấu trúc thư mục (Project Structure)

```text
polyhub/
├── backend/            # Mã nguồn Spring Boot (Java) - Cung cấp REST API & WebSocket Server
├── frontend/           # Mã nguồn Next.js (TypeScript) - Giao diện Web Client & Admin Dashboard
├── Mobile/             # Mã nguồn Expo (React Native) - Ứng dụng di động dành cho sinh viên
├── ocr-service/        # OCR Microservice (Python 3.11/FastAPI) - Đọc thông tin CCCD thay FPT.AI
│   ├── cccd_ocr_api.py     # FastAPI app, expose endpoint POST /ocr-cccd
│   ├── ocr_pipeline.py     # PaddleOCR khoanh vùng + VietOCR đọc chữ
│   ├── cccd_extractor.py   # Tách kết quả OCR thành các field (id, name, dob...)
│   ├── requirements.txt    # Danh sách thư viện Python cần cài
│   └── test_face_match.py  # Script test nhận diện khuôn mặt
├── scripts/            # Các kịch bản tiện ích (Java, Python, PowerShell) hỗ trợ tự động hóa
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

### 4. OCR Service (Python Microservice)
*   **Ngôn ngữ:** Python **3.11** (bắt buộc — `paddlepaddle` chưa hỗ trợ 3.12+).
*   **Framework API:** FastAPI + Uvicorn.
*   **OCR Engine:** PaddleOCR 2.7.3 (khoanh vùng chữ) + VietOCR 0.3.13 (đọc tiếng Việt có dấu).
*   **Nhận diện khuôn mặt:** InsightFace 0.7.3 + ONNXRuntime 1.18.0.
*   **Deep Learning:** PyTorch 2.3.1 + TorchVision 0.18.1.
*   **Chức năng:** Đọc thông tin CCCD (Căn cước công dân) thay thế cho FPT.AI eKYC, expose endpoint `POST /ocr-cccd`.

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
9.  **Xác minh danh tính (eKYC — CCCD OCR):**
    *   OCR Service nội bộ (Python/FastAPI) đọc thông tin từ ảnh CCCD thay thế FPT.AI.
    *   Hỗ trợ nhận diện mặt trước/sau hoặc tự động phát hiện chiều (`side=auto`).
10. **Bảng quản trị toàn diện (Admin Dashboard):**
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

### 4. 🐍 Khởi chạy OCR Service (Python 3.11)

Service Python độc lập thay thế FPT.AI eKYC, sử dụng PaddleOCR + VietOCR để đọc thông tin CCCD.
Chạy song song với Backend và Frontend — không cần thiết cho mọi tính năng, chỉ cần khi dùng eKYC.

> ⚠️ **Bắt buộc dùng Python 3.11** — `paddlepaddle` chưa hỗ trợ Python 3.12 trở lên.

#### Bước 0 — Kiểm tra Python 3.11 đã cài chưa

```powershell
py -0
```

Nếu thấy `-3.11-64` (hoặc `-3.11-32`) trong danh sách → đã có, bỏ qua bước cài.

Nếu **chưa có**, tải bản installer tại:
```
https://www.python.org/downloads/release/python-3119/
```
> Khi cài nhớ tick ✅ **"Add python.exe to PATH"**.

#### Bước 1 — Di chuyển vào thư mục `ocr-service`

```bash
cd ocr-service
```

#### Bước 2 — Tạo Virtual Environment bằng Python 3.11

```powershell
# Windows
py -3.11 -m venv venv
```

```bash
# macOS / Linux
python3.11 -m venv venv
```

> ⚠️ **Không commit thư mục `venv/`** lên Git (đã có `.gitignore` chặn sẵn).
> Mỗi thành viên tự tạo `venv` riêng trên máy của mình — venv gắn chặt với đường dẫn và hệ điều hành, không share qua Git được.

#### Bước 3 — Kích hoạt Virtual Environment

```powershell
# Windows (PowerShell)
venv\Scripts\activate
```

```bash
# macOS / Linux
source venv/bin/activate
```

Sau khi kích hoạt thành công, dấu nhắc lệnh sẽ hiển thị `(venv)` ở đầu dòng.

> 💡 **Lưu ý Windows PowerShell:** Nếu gặp lỗi quyền hạn, chạy lệnh sau trước:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

#### Bước 4 — Cài đặt thư viện

```bash
pip install -r requirements.txt
```

> ℹ️ Quá trình cài đặt có thể mất **5–15 phút** tùy tốc độ mạng vì cần tải PyTorch (~800MB) và PaddlePaddle.

#### Bước 5 — Chạy OCR Service

```bash
uvicorn cccd_ocr_api:app --host 0.0.0.0 --port 8001
```

*   **Lần đầu chạy:** Service sẽ tự động tải model VietOCR (~180MB) — cần kết nối Internet, mất vài phút. Từ lần sau sẽ dùng bản cache, không cần mạng nữa.
*   **Cổng mặc định:** `http://localhost:8001`
*   Để cửa sổ terminal này **chạy song song** cùng với Backend (cổng `8080`) và Frontend (cổng `3000`).

#### 🧪 Kiểm tra nhanh (không cần chạy cả hệ thống)

```bash
# Kiểm tra health check
curl http://localhost:8001/health

# OCR ảnh CCCD (thay đường dẫn ảnh thực tế của bạn)
curl -X POST "http://localhost:8001/ocr-cccd?side=auto" -F "image=@duong_dan_anh_cccd.jpg"
```

Tham số `side` nhận các giá trị: `front` (mặt trước), `back` (mặt sau), `auto` (tự động phát hiện).

#### 🔗 Kết nối với Spring Boot Backend

`FptAiService.java` trong backend đã được cấu hình gọi sang `http://localhost:8001/ocr-cccd?side=auto`.
Đảm bảo trong [application.properties](backend/src/main/resources/application.properties) giá trị `fpt.ai.api-key` **khác** chuỗi `mock` để kích hoạt nhánh gọi sang OCR Service thay vì dùng data giả.

---

#### ❗ Lỗi thường gặp khi cài OCR Service

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `ModuleNotFoundError: No module named 'gdown'` | Windows Defender xóa ngầm file vừa cài | Chạy: `pip uninstall gdown -y` → `pip install gdown==4.4.0 --no-cache-dir`. Nếu vẫn lỗi: thêm thư mục project vào **Windows Security → Virus & threat protection → Exclusions** rồi cài lại. |
| `ValueError: The truth value of an array...` | Lỗi nội bộ của `paddleocr==2.7.3` | Kiểm tra `ocr_pipeline.py` — đảm bảo **không** truyền tham số `rec=False` vào PaddleOCR. |
| `ERROR: Could not find a version that satisfies paddlepaddle` | Python version sai (3.12+) | Xóa `venv` cũ, tạo lại bằng `py -3.11 -m venv venv` và cài lại. |
| `venv\Scripts\activate` không chạy được trên PowerShell | Execution Policy bị hạn chế | Chạy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| Service khởi động nhưng timeout khi nhận ảnh | Model chưa tải xong | Chờ thêm, xem log terminal — lần đầu tải model VietOCR mất vài phút. |

---

## 🛠️ Các kịch bản tiện ích (Utility Scripts)
Thư mục `scripts/` chứa các kịch bản giúp đồng bộ hóa dữ liệu và định dạng HTML:
*   `UpdateHtml.java` / `FixHtml.java`: Định dạng các bảng và dropdown trong phần quản trị.
*   `update_profile.py` / `UpdateProfile.java`: Đồng bộ hóa cấu trúc bài viết từ trang chủ (`home.html`) sang trang hồ sơ cá nhân (`profile.html`).
*   `update.ps1`: Tự động chạy toàn bộ quy trình đồng bộ hóa bằng PowerShell.
