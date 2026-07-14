# CCCD OCR Service (thay thế FPT.AI)

Service Python nhỏ, thay thế cho FPT.AI OCR đã ngừng hoạt động. Dùng
PaddleOCR để khoanh vùng chữ + VietOCR để đọc nội dung tiếng Việt có dấu.
`FptAiService.java` bên backend gọi sang service này qua HTTP.

## Cấu trúc file (chỉ 4 file cần thiết, không tính venv)

```
ocr-service/
├── requirements.txt      # danh sách thư viện cần cài
├── ocr_pipeline.py       # PaddleOCR khoanh vùng + VietOCR đọc chữ
├── cccd_extractor.py     # tách kết quả OCR thành field (id, name, dob...)
├── cccd_ocr_api.py       # FastAPI, expose endpoint /ocr-cccd
└── README.md             # file này
```

**KHÔNG commit thư mục `venv/`** lên Git (đã có `.gitignore` chặn sẵn) —
mỗi người tự tạo venv riêng trên máy mình, vì venv gắn chặt với đường dẫn
và hệ điều hành của từng máy, không share qua Git/Zalo được.

## Yêu cầu bắt buộc: Python 3.11 (KHÔNG dùng 3.12+/3.14)

`paddlepaddle` hiện chưa hỗ trợ Python bản quá mới. Kiểm tra trước:

```
py -0
```

Nếu chưa thấy `3.11` trong danh sách, tải tại:
`https://www.python.org/downloads/release/python-3119/`
(nhớ tick "Add python.exe to PATH" lúc cài)

## Cài đặt (làm 1 lần trên mỗi máy)

```bash
# 1. Clone/pull repo về, vào đúng thư mục ocr-service
cd ocr-service

# 2. Tạo virtual environment bằng đúng Python 3.11
py -3.11 -m venv venv

# 3. Kích hoạt venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# 4. Cài thư viện
pip install -r requirements.txt
```

## Chạy service

```bash
uvicorn cccd_ocr_api:app --host 0.0.0.0 --port 8001
```

- Lần đầu chạy sẽ tự tải model VietOCR (~180MB, cần mạng, mất vài phút).
  Từ lần sau sẽ dùng bản đã tải, không cần mạng nữa.
- Để cửa sổ này chạy song song với Spring Boot backend + Next.js frontend
  khi test/dùng — nó là 1 service riêng, giống như chạy thêm 1 backend nhỏ.

## Test nhanh service (không cần chạy cả hệ thống)

```bash
curl -X POST "http://localhost:8001/ocr-cccd?side=auto" -F "image=@duong_dan_anh_cccd.jpg"
```

## Kết nối với Spring Boot

`FptAiService.java` đã được sửa để gọi `http://localhost:8001/ocr-cccd?side=auto`.
Trong `application.properties`, đảm bảo `fpt.ai.api-key` **khác** giá trị
`mock` thì code mới chạy nhánh gọi sang service này (xem comment trong
`FptAiService.java`).

## Lỗi thường gặp

- `ModuleNotFoundError: No module named 'gdown'` dù đã cài — thường do
  Windows Defender xoá ngầm file vừa cài. Thử:
  ```
  pip uninstall gdown -y
  pip install gdown==4.4.0 --no-cache-dir
  ```
  Nếu vẫn lỗi, thêm thư mục project vào **Windows Security → Virus &
  threat protection → Exclusions** rồi cài lại.

- `ValueError: The truth value of an array...` — lỗi nội bộ đã biết của
  `paddleocr==2.7.3`, đã được né trong `ocr_pipeline.py` (không dùng
  `rec=False`). Nếu thấy lỗi này lại, kiểm tra `ocr_pipeline.py` có bị
  sửa nhầm không.
