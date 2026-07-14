"""
API CHINH THUC thay the FPT.AI - chay file nay tren may/server dung de
phuc vu that (khong phai chi test nua).

Cach chay:
    uvicorn cccd_ocr_api:app --host 0.0.0.0 --port 8001

--host 0.0.0.0 nghia la cho phep may khac (vd server chay Spring Boot,
neu no o may/container khac) goi vao duoc, khong chi localhost.
Neu Spring Boot va service nay chay CHUNG 1 may thi dung "localhost"
o phia Java goi sang la du.
"""

from fastapi import FastAPI, UploadFile, File, Query
from fastapi.responses import JSONResponse
from ocr_pipeline import get_ocr_lines
from cccd_extractor import extract_front_side, extract_back_side, extract_auto
import tempfile
import os

app = FastAPI(title="CCCD OCR Service (thay the FPT.AI)")

print("Dang khoi tao model, cho mot chut truoc khi API san sang nhan request...")
get_ocr_lines.__module__  # noop, dam bao import chay truoc


@app.post("/ocr-cccd")
async def ocr_cccd(image: UploadFile = File(...), side: str = Query("auto", enum=["front", "back", "auto"])):
    suffix = os.path.splitext(image.filename or "upload.jpg")[1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await image.read())
        tmp_path = tmp.name

    try:
        raw_lines = get_ocr_lines(tmp_path)
        if side == "front":
            parsed = extract_front_side(raw_lines)
        elif side == "back":
            parsed = extract_back_side(raw_lines)
        else:
            parsed = extract_auto(raw_lines)
        return JSONResponse(content=parsed)
    finally:
        os.remove(tmp_path)


@app.get("/health")
async def health():
    return {"status": "ok"}
