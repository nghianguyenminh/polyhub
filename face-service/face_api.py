"""
API xac thuc khuon mat - thay the FPT.AI Liveness V3.

Cach chay:
    uvicorn face_api:app --host 0.0.0.0 --port 8002
"""

from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from face_pipeline import verify_face
import tempfile
import os

app = FastAPI(title="Face Verification Service (thay the FPT.AI Liveness)")


@app.post("/verify-face")
async def verify_face_endpoint(video: UploadFile = File(...), cccd: UploadFile = File(...)):
    video_suffix = os.path.splitext(video.filename or "video.webm")[1] or ".webm"
    cccd_suffix = os.path.splitext(cccd.filename or "cccd.jpg")[1] or ".jpg"

    with tempfile.NamedTemporaryFile(delete=False, suffix=video_suffix) as tmp_video:
        tmp_video.write(await video.read())
        video_path = tmp_video.name

    with tempfile.NamedTemporaryFile(delete=False, suffix=cccd_suffix) as tmp_cccd:
        tmp_cccd.write(await cccd.read())
        cccd_path = tmp_cccd.name

    try:
        result = verify_face(video_path, cccd_path)
        return JSONResponse(content=result)
    finally:
        os.remove(video_path)
        os.remove(cccd_path)


@app.get("/health")
async def health():
    return {"status": "ok"}
