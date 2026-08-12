"""
Module dung chung: PaddleOCR de KHOANH VUNG chu, VietOCR de DOC NOI DUNG.
Cac script khac (01b, 02b...) import ham get_ocr_lines() tu day thay vi
lap lai code.
"""

from paddleocr import PaddleOCR
from vietocr.tool.predictor import Predictor
from vietocr.tool.config import Cfg
from PIL import Image

_det_engine = None
_recognizer = None


def _get_engines():
    global _det_engine, _recognizer
    if _det_engine is None:
        print("Dang khoi tao PaddleOCR (chi dung de khoanh vung chu)...")
        _det_engine = PaddleOCR(use_angle_cls=True, lang="vi", show_log=False)
    if _recognizer is None:
        print("Dang khoi tao VietOCR...")
        config = Cfg.load_config_from_name("vgg_transformer")
        config["device"] = "cpu"
        _recognizer = Predictor(config)
    return _det_engine, _recognizer


def get_ocr_lines(image_path: str) -> list[str]:
    """
    Tra ve danh sach cac dong chu da doc duoc tu anh, sap xep tren->duoi,
    dung PaddleOCR de tim vi tri + VietOCR de doc noi dung (chinh xac
    dau tieng Viet hon nhieu so voi model rec mac dinh cua PaddleOCR).
    """
    det_engine, recognizer = _get_engines()

    # KHONG dung rec=False (loi noi bo cua paddleocr 2.7.3), de no chay
    # full roi bo qua phan chu no tu doc, chi lay toa do box.
    det_result = det_engine.ocr(image_path, cls=True)

    if not det_result or det_result[0] is None:
        return []

    boxes = [item[0] for item in det_result[0]]
    original_image = Image.open(image_path).convert("RGB")

    lines = []
    for box in boxes:
        xs = [p[0] for p in box]
        ys = [p[1] for p in box]
        x_min, x_max = int(min(xs)), int(max(xs))
        y_min, y_max = int(min(ys)), int(max(ys))
        crop = original_image.crop((
            max(0, x_min - 2), max(0, y_min - 2),
            x_max + 2, y_max + 2
        ))
        text = recognizer.predict(crop)
        lines.append((y_min, text))

    lines.sort(key=lambda x: x[0])
    return [text for _, text in lines]
