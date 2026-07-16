# Face Verification Service (thay thế FPT.AI Liveness V3)

Service Python nhỏ, thay thế cho FPT.AI Liveness V3 đã ngừng hoạt động.
Dùng **InsightFace (buffalo_l)** để so khớp khuôn mặt (CCCD vs video),
kết hợp kiểm tra **chuyển động qua nhiều frame** làm lớp liveness đơn giản
ở server (bổ sung cho lớp FaceMesh/nháy mắt đã có sẵn ở frontend).
`FptAiService.java` bên backend gọi sang service này qua HTTP.

## ⚠️ Vì sao đây là service RIÊNG, không gộp chung với `ocr-service`

`ocr-service` (PaddleOCR) và `face-service` (InsightFace) đòi hỏi 2 phiên
bản `protobuf` xung đột nhau — không thể cài chung 1 venv. Đây là bài học
rút ra sau khi gặp lỗi `TypeError: Descriptors cannot be created directly`
trong quá trình phát triển. **Luôn giữ 2 service này tách biệt, venv
riêng, port riêng.**

## Cấu trúc file

```
face-service/
├── requirements.txt   # thư viện cần cài (KHÔNG gồm insightface, xem bên dưới)
├── face_pipeline.py   # InsightFace: trích embedding, so khớp, kiểm tra chuyển động
├── face_api.py        # FastAPI, expose endpoint /verify-face
├── test_face_match.py # script test nhanh so khớp 2 ảnh tĩnh (không cần video)
└── README.md          # file này
```

## Yêu cầu bắt buộc: Python 3.11 (giống hệt `ocr-service`)

```
py -0
```
Nếu chưa có 3.11, tải tại `https://www.python.org/downloads/release/python-3119/`
(nhớ tick "Add python.exe to PATH").

## Cài đặt (làm 1 lần trên mỗi máy)

```bash
cd face-service
py -3.11 -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
```

### Cài `insightface` riêng — KHÔNG có trong `requirements.txt`

`insightface` không có bản build sẵn (wheel) chính thức cho Windows trên
PyPI — pip sẽ cố tự biên dịch bằng C++ và báo lỗi
`Microsoft Visual C++ 14.0 or greater is required` nếu máy chưa cài Visual
Studio Build Tools. Thay vì cài Build Tools (nặng, ~2-6GB), dùng bản build
sẵn từ cộng đồng (repo `Gourieff/Assets`, được dùng rộng rãi cho
ComfyUI/ReActor):

```bash
pip install https://github.com/Gourieff/Assets/raw/main/Insightface/insightface-0.7.3-cp311-cp311-win_amd64.whl
```

(đổi `cp311` thành đúng bản Python đang dùng nếu khác — kiểm tra bằng
`python --version`; repo có sẵn từ cp39 tới cp313)

### Sau khi cài `insightface`, BẮT BUỘC ghim lại đúng version NumPy

```bash
pip install numpy==1.26.4 --force-reinstall
```

Lý do: `insightface` kéo theo NumPy 2.x mới nhất, nhưng `onnxruntime==1.18.0`
được build cho NumPy 1.x, gây lỗi `AttributeError: _ARRAY_API not found`
nếu không ghim lại.

### Kiểm tra cài đặt đúng chưa

```bash
python -c "import insightface; print(insightface.__version__)"
```
Phải in ra `0.7.3`, không lỗi.

## Chạy service

```bash
uvicorn face_api:app --host 0.0.0.0 --port 8002
```

Lần đầu chạy sẽ tự tải model `buffalo_l` (~300MB, từ GitHub của
`deepinsight/insightface`, cần mạng, có thể mất nhiều phút tuỳ tốc độ
mạng — quan sát thấy có lúc chỉ ~500KB/s). Model cache vào
`C:\Users\<ten>\.insightface\models`, lần sau chạy sẽ nhanh.

## Test nhanh (không cần chạy cả hệ thống)

**Test so khớp 2 ảnh tĩnh** (không cần video, chỉ để kiểm tra cài đặt đúng):
```bash
python test_face_match.py anh1.jpg anh2.jpg
```

**Test endpoint đầy đủ** (cần 1 video mặt + 1 ảnh CCCD):
```bash
curl.exe -X POST "http://localhost:8002/verify-face" -F "video=@video.mp4" -F "cccd=@cccd.jpg"
```
⚠️ Trên Windows PowerShell, phải gõ **`curl.exe`** (thêm đuôi `.exe`), vì
`curl` mặc định là alias của `Invoke-WebRequest`, không hiểu cú pháp
`-X`/`-F` của curl thật.

## Ý nghĩa JSON trả về

```json
{
  "code": "200",
  "message": "Success",
  "data": {
    "liveness": { "is_live": true, "deep_fake": false, "motion_score": 94.5 },
    "face_match": { "isMatch": true, "similarity": 66.92 }
  }
}
```

- `face_match.similarity` (0-100): độ giống khuôn mặt CCCD vs video, dựa
  trên cosine similarity của ArcFace embedding. Ngưỡng đang dùng: `0.40`
  (tương đương 40 trên thang 100) — xem `FACE_MATCH_THRESHOLD` trong
  `face_pipeline.py`.
- `liveness.motion_score`: độ lệch trung bình vị trí các điểm mốc khuôn
  mặt (mắt/mũi/miệng) giữa các frame trong video. Ngưỡng: `1.5` — xem
  `MOTION_LIVENESS_THRESHOLD`.

### ⚠️ Hạn chế đã biết (QUAN TRỌNG — đọc trước khi tin tưởng hệ thống)

Cách kiểm tra `is_live` hiện tại **chỉ đo có chuyển động giữa các frame
hay không** — nó **không phân biệt được "khuôn mặt người" với "bất kỳ
vật gì đang di chuyển"**. Test thực tế: quay 1 chai nước đang lắc cũng
cho ra `is_live: true` với `motion_score` rất cao. Hệ thống vẫn từ chối
được trường hợp này nhờ `isMatch: false` đi kèm (không có khuôn mặt nào
để so khớp), nhưng **nếu tách riêng, phần `is_live` không đủ chặt để
chống giả mạo thật sự**. Đây là điểm nên ghi vào phần "Hạn chế và hướng
phát triển" của báo cáo — hướng nâng cấp là dùng model
Silent-Face-Anti-Spoofing chuyên dụng thay vì heuristic chuyển động này
(xem `FEATURE_XAC_THUC_CCCD.md` bên `ocr-service`, mục 3.6).

## Kết nối với Spring Boot

`FptAiService.java` gọi `http://localhost:8002/verify-face`, gửi lên 2
file: `video` (webm/mp4 ghi từ frontend) và `cccd` (ảnh mặt trước CCCD).
Trong `application.properties`, `fpt.ai.api-key` khác `mock` thì mới chạy
nhánh gọi thật (xem comment trong `FptAiService.java`).

## Lỗi thường gặp

- `ModuleNotFoundError: No module named 'gdown'`/`'insightface'` dù đã
  cài — do Windows Defender xoá ngầm file vừa cài. Cài lại với
  `--no-cache-dir`, nếu vẫn lỗi thì thêm thư mục project vào
  **Windows Security → Virus & threat protection → Exclusions**.

- `error: Microsoft Visual C++ 14.0 or greater is required` — xem mục
  "Cài `insightface` riêng" ở trên, dùng bản wheel build sẵn thay vì để
  pip tự compile.

- `AttributeError: _ARRAY_API not found` — NumPy 2.x không tương thích
  với `onnxruntime==1.18.0`. Chạy `pip install numpy==1.26.4 --force-reinstall`.

- `TypeError: Descriptors cannot be created directly` khi chạy chung với
  `paddleocr`/`paddlepaddle` — xung đột `protobuf`. **Không cài
  `insightface` vào cùng venv với `ocr-service`**, luôn giữ 2 venv
  riêng biệt.

- Video ghi từ web (`.webm`) cho kết quả `is_live: false` sai dù rõ ràng
  có chuyển động thật — do cách đọc frame kiểu "tua theo số thứ tự"
  (`cap.set(CAP_PROP_POS_FRAMES, ...)`) không đáng tin cậy với `.webm`.
  `face_pipeline.py` hiện đã đọc frame **tuần tự** (không tua) để tránh
  lỗi này — nếu thấy lỗi tương tự quay lại, kiểm tra `_extract_frames()`
  có bị sửa nhầm về cách tua frame không.
