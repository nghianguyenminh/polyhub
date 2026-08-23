"""
BUOC 1 - Test tho InsightFace: so sanh 2 anh khuon mat, in ra do
tuong dong (cosine similarity). CHUA dung video, chi de kiem tra
InsightFace cai dat dung va model tai ve on chua.

Cach chay:
    python test_face_match.py anh_cccd.jpg anh_selfie.jpg

Lan dau chay se tu dong tai model "buffalo_l" (~300MB) ve
~/.insightface/models (Windows: C:\\Users\\<ten>\\.insightface\\models),
can mang, co the mat vai phut.
"""

import sys
import cv2
import numpy as np
from insightface.app import FaceAnalysis


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def main():
    if len(sys.argv) < 3:
        print("Cach dung: python test_face_match.py anh1.jpg anh2.jpg")
        sys.exit(1)

    path1, path2 = sys.argv[1], sys.argv[2]

    print("Dang khoi tao InsightFace (lan dau se tai model buffalo_l, cho vai phut)...")
    app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    app.prepare(ctx_id=0, det_size=(640, 640))

    img1 = cv2.imread(path1)
    img2 = cv2.imread(path2)

    if img1 is None:
        print(f"!! Khong doc duoc anh: {path1}")
        sys.exit(1)
    if img2 is None:
        print(f"!! Khong doc duoc anh: {path2}")
        sys.exit(1)

    faces1 = app.get(img1)
    faces2 = app.get(img2)

    print(f"\nSo khuon mat phat hien trong anh 1 ({path1}): {len(faces1)}")
    print(f"So khuon mat phat hien trong anh 2 ({path2}): {len(faces2)}")

    if not faces1:
        print(f"!! Khong phat hien khuon mat nao trong {path1}")
        sys.exit(1)
    if not faces2:
        print(f"!! Khong phat hien khuon mat nao trong {path2}")
        sys.exit(1)

    # neu co nhieu mat trong 1 anh, lay mat co bbox lon nhat (gan camera nhat)
    def biggest_face(faces):
        return max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))

    face1 = biggest_face(faces1)
    face2 = biggest_face(faces2)

    similarity = cosine_similarity(face1.embedding, face2.embedding)

    print(f"\n===== KET QUA =====")
    print(f"Cosine similarity: {similarity:.4f}")
    print("(Tham khao: >0.4 thuong la cung 1 nguoi voi buffalo_l, nhung ")
    print(" CAN TU TEST voi nhieu cap anh that/khac nguoi de chon nguong ")
    print(" chinh xac cho du an cua ban, khong nen tin cung con so nay.)")


if __name__ == "__main__":
    main()
