# Test PaddleOCR đọc CCCD trên máy local

Mục tiêu: xác nhận PaddleOCR đọc được CCCD tiếng Việt đủ tốt trước khi
viết script cài đặt phân phối cho cả team.

## 0. Chuẩn bị môi trường

```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Lưu ý:
- Nếu máy bạn dùng Python 3.12, `paddlepaddle==2.6.1` có thể chưa có
  wheel sẵn — nếu lỗi khi cài, hạ xuống Python 3.10 hoặc 3.11 bằng
  `pyenv`/`conda` rồi tạo lại venv.
- Lần đầu chạy sẽ tự tải model detection + recognition tiếng Việt
  (khoảng vài chục MB) từ server PaddleOCR, cần mạng. Model được cache
  vào `~/.paddleocr` (Linux/Mac) hoặc `C:\Users\<user>\.paddleocr`
  (Windows), lần sau chạy sẽ nhanh và không cần mạng nữa.

## 1. Test thô — chỉ xem OCR đọc chữ có chuẩn không

```bash
python 01_test_ocr_raw.py duong_dan_anh_cccd_mat_truoc.jpg
```

Đọc kỹ output: các dòng có đọc đúng số CCCD, họ tên, ngày sinh không?
Nếu ảnh mờ/nghiêng/thiếu sáng, kết quả sẽ tệ — hãy thử với ảnh chụp rõ,
đủ sáng, thẻ nằm phẳng trong khung hình trước khi kết luận PaddleOCR
"không dùng được".

## 2. Test trích field — ra JSON đúng schema

```bash
python 02_test_ocr_extract.py duong_dan_anh_mat_truoc.jpg front
python 02_test_ocr_extract.py duong_dan_anh_mat_sau.jpg back
```

So sánh JSON in ra với đúng schema mà `FptAiService.java` hiện đang kỳ
vọng nhận về (`errorCode`, `data[0].id/name/dob/sex/...`). Nếu field nào
sai/trống, mở `cccd_extractor.py` chỉnh lại logic (đây là phần cần tinh
chỉnh nhiều nhất, tuỳ vào việc ảnh CCCD của bạn/nhóm chụp có layout thế
nào — chữ có bị che, thẻ có bị xoay, v.v).

## 3. Test qua FastAPI local (mô phỏng đúng cách Spring Boot sẽ gọi)

```bash
uvicorn 03_local_ocr_service:app --reload --port 8001
```

Test bằng curl (mở terminal khác):
```bash
curl -X POST "http://localhost:8001/ocr-cccd?side=front" \
     -F "image=@duong_dan_anh_mat_truoc.jpg"
```

Hoặc bằng Postman: `POST http://localhost:8001/ocr-cccd?side=front`,
Body → form-data → key `image` (type File) → chọn ảnh.

## Sau khi test OK trên máy bạn

Bước tiếp theo (chưa làm vội, đợi bạn xác nhận OCR đủ tốt):
1. Viết `download_models.py` để tự động tải model cho các thành viên khác.
2. Đóng gói service này bằng Docker để cả team chạy giống hệt nhau,
   tránh lỗi "máy tôi chạy được máy bạn không chạy được".
3. Sửa `FptAiService.java` để trỏ URL từ `api.fpt.ai` sang
   `http://localhost:8001/ocr-cccd` (hoặc URL container khi deploy).
4. Làm tương tự cho phần liveness + face match (InsightFace +
   Silent-Face-Anti-Spoofing) — để riêng bước sau như bạn đã chọn.
