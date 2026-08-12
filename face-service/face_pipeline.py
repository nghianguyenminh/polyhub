"""
Module xu ly Liveness + Face Match, dung InsightFace (buffalo_l).

Chien luoc "nhanh gon" da chon:
- Face match: so sanh embedding (ArcFace) giua anh CCCD va frame tot nhat
  trong video, dung cosine similarity.
- Liveness: KHONG dung model chong gia mao rieng (Silent-Face-Anti-Spoofing).
  Thay vao do, kiem tra CHUYEN DONG cua khuon mat qua nhieu frame trong
  video - anh tinh/anh in lai se co vi tri landmark gan nhu dung yen tuyet
  doi, nguoi that quay video luon co chut rung dong tu nhien (dau, mat...).
  Ket hop voi lop kiem tra FaceMesh/nhay mat da co san o phia client
  (frontend), day la lop bo sung o server, khong phai lop duy nhat.

LUU Y: day la giai phap heuristic phu hop cho do an/du an noi bo, KHONG
phai giai phap chong gia mao cap do thuong mai. Nguong (threshold) can
tu tinh chinh voi du lieu that cua nhom truoc khi tin tuong hoan toan.
"""

import cv2
import numpy as np
from insightface.app import FaceAnalysis

_face_app = None

# Nguong tham khao - CAN TU TEST LAI voi du lieu that cua nhom
FACE_MATCH_THRESHOLD = 0.40
MOTION_LIVENESS_THRESHOLD = 1.5  # don vi: pixel, do lech trung binh landmark giua cac frame


def _get_face_app() -> FaceAnalysis:
    global _face_app
    if _face_app is None:
        print("Dang khoi tao InsightFace (buffalo_l)...")
        _face_app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
        _face_app.prepare(ctx_id=0, det_size=(640, 640))
    return _face_app


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def _biggest_face(faces):
    return max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))


def _extract_frames(video_path: str, max_frames: int = 8) -> list:
    """Trich mot so frame rai deu tren toan bo video.

    QUAN TRONG: doc TUAN TU tung frame (cap.read() lien tuc), KHONG dung
    cap.set(CAP_PROP_POS_FRAMES, idx) de "tua" toi frame theo so thu tu.
    Cach tua ay khong dang tin cay voi file .webm (dinh dang trinh duyet
    hay dung, thuong co toc do khung hinh khong deu) - OpenCV de doc
    trung frame giong het nhau nhieu lan, khien video that (co quay dau,
    chop mat) bi tuong nham la "khong co chuyen dong" -> is_live sai.
    Doc tuan tu tin cay hon nhieu, khong phan biet dinh dang video.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return []

    all_frames = []
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        all_frames.append(frame)
    cap.release()

    if not all_frames:
        return []

    # lay mau rai deu tren toan bo danh sach frame da doc duoc
    total = len(all_frames)
    if total <= max_frames:
        return all_frames

    step = total / max_frames
    return [all_frames[int(i * step)] for i in range(max_frames)]


def verify_face(video_path: str, cccd_image_path: str) -> dict:
    """
    Tra ve dict dung schema ma FptAiService.java dang doc:
    {
      "code": "200"/"400"/"500",
      "message": "...",
      "data": { "liveness": {...}, "face_match": {...} }
    }
    """
    app = _get_face_app()

    cccd_img = cv2.imread(cccd_image_path)
    if cccd_img is None:
        return {"code": "400", "message": "Không đọc được ảnh CCCD", "data": {}}

    cccd_faces = app.get(cccd_img)
    if not cccd_faces:
        return {"code": "400", "message": "Không phát hiện khuôn mặt trong ảnh CCCD", "data": {}}
    cccd_face = _biggest_face(cccd_faces)

    frames = _extract_frames(video_path, max_frames=8)
    if not frames:
        return {"code": "400", "message": "Không đọc được video", "data": {}}

    # Phat hien khuon mat + landmark tren tung frame, bo qua frame khong co mat
    frame_faces = []
    for frame in frames:
        faces = app.get(frame)
        if faces:
            frame_faces.append(_biggest_face(faces))

    if not frame_faces:
        return {"code": "400", "message": "Không phát hiện khuôn mặt trong video", "data": {}}

    # --- Face match: dung frame co mat lon nhat (ro net nhat) ---
    best_frame_face = max(frame_faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
    similarity = _cosine_similarity(cccd_face.embedding, best_frame_face.embedding)
    is_match = similarity >= FACE_MATCH_THRESHOLD

    # --- Liveness: do do lech trung binh cua landmark (kps) giua cac frame ---
    if len(frame_faces) >= 2:
        kps_list = [f.kps for f in frame_faces]  # moi kps: 5 diem moc (mat, mui, mieng)
        diffs = []
        for i in range(1, len(kps_list)):
            diff = np.linalg.norm(kps_list[i] - kps_list[i - 1], axis=1).mean()
            diffs.append(diff)
        avg_motion = float(np.mean(diffs))
        is_live = avg_motion >= MOTION_LIVENESS_THRESHOLD
    else:
        # chi co 1 frame co mat -> khong du du lieu de danh gia chuyen dong,
        # coi nhu khong chac chan, danh dau false de yeu cau quay lai video khac
        avg_motion = 0.0
        is_live = False

    return {
        "code": "200",
        "message": "Success",
        "data": {
            "liveness": {
                "is_live": is_live,
                "deep_fake": False,  # khong co model rieng de danh gia rieng deepfake
                "motion_score": round(avg_motion, 3),
            },
            "face_match": {
                "isMatch": is_match,
                "similarity": round(similarity * 100, 2),
            },
        },
    }