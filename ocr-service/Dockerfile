# --- Dockerfile cho OCR Service (PaddleOCR + VietOCR) ---
FROM python:3.10-slim

WORKDIR /app

# Cài đặt các thư viện hệ thống cần thiết cho OpenCV, PaddlePaddle và VietOCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Sao chép và cài đặt các dependencies Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Expose port (sẽ chạy động theo port được cấp từ Cloud, ví dụ Hugging Face cấp 7860)
EXPOSE 8001

# Khởi chạy service sử dụng Uvicorn với Port động (Mặc định là 8001 nếu không có biến môi trường PORT)
CMD ["sh", "-c", "uvicorn cccd_ocr_api:app --host 0.0.0.0 --port ${PORT:-8001}"]
