# --- Dockerfile cho Face Service (InsightFace Buffalo_L & Liveness) ---
FROM python:3.10-slim

WORKDIR /app

# Cài đặt build-essential để compile InsightFace từ mã nguồn và các thư viện OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Sao chép và cài đặt các dependencies cơ bản trước
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Cài đặt insightface (Thư viện này sẽ tự build trên Linux Docker nhờ build-essential)
RUN pip install --no-cache-dir insightface==0.7.3

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Expose port (Mặc định chạy ở 8002, tự động đổi nếu chạy trên Hugging Face / Render)
EXPOSE 8002

# Khởi chạy service sử dụng Uvicorn với Port động
CMD ["sh", "-c", "uvicorn face_api:app --host 0.0.0.0 --port ${PORT:-8002}"]
