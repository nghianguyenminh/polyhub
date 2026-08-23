"""
BUOC 2 - Tach cac dong OCR tho thanh field co cau truc.

Logic: CCCD gan chip mau 2021 co layout gan nhu co dinh, moi field co
tu khoa "neo" (anchor keyword) di kem. Minh doc tung dong, neu dong chua
tu khoa thi lay phan text con lai (hoac dong ke tiep) lam gia tri field do.

LUU Y: day la heuristic dua tren layout pho bien, CAN CHINH SUA them sau khi
test voi nhieu anh CCCD that (goc chup lech, che khuat, font khac nhau...).
"""

import re
import unicodedata

ID_REGEX = re.compile(r"\b\d{12}\b")
DATE_REGEX = re.compile(r"\b\d{2}/\d{2}/\d{4}\b")


def _no_diacritics(text: str) -> str:
    """Bo dau tieng Viet de so khop nhan (label) khong bi vo khi VietOCR
    lo doc sai/thieu dau (vd 'quan' vs 'quản' vs 'quán' deu thanh 'quan')."""
    nfkd = unicodedata.normalize("NFD", text)
    return "".join(c for c in nfkd if unicodedata.category(c) != "Mn").lower()


def _strip_label(line: str, keywords: list[str]) -> str:
    """Bo phan nhan (label) tieng Viet/Anh o dau dong, chi giu lai gia tri."""
    cleaned = line
    for kw in keywords:
        idx = cleaned.lower().find(kw.lower())
        if idx != -1:
            cleaned = cleaned[idx + len(kw):]
    # bo cac ky tu thua nhu ":", "/" con sot lai o dau
    return cleaned.strip(" :/.-").strip()


def extract_front_side(raw_lines: list[str]) -> dict:
    """
    raw_lines: danh sach text da OCR duoc (theo thu tu tu tren xuong duoi),
    lay tu ket qua PaddleOCR cho MAT TRUOC CCCD.
    Tra ve dict giong schema "data[0]" ma FptAiService.java dang cho.
    """
    joined = " ".join(raw_lines)

    result = {
        "id": "",
        "name": "",
        "dob": "",
        "sex": "",
        "nationality": "Việt Nam",
        "home": "",
        "address": "",
        "type": "front",
    }

    # --- So CCCD: 12 chu so, thuong xuat hien som trong cac dong dau ---
    id_match = ID_REGEX.search(joined)
    if id_match:
        result["id"] = id_match.group()

    all_dates = DATE_REGEX.findall(joined)

    for i, line in enumerate(raw_lines):
        norm = _no_diacritics(line)

        if ("ho va ten" in norm or "full name" in norm) and not result["name"]:
            value = _strip_label(line, ["Họ và tên", "Full name", "Ho va ten"])
            if not value and i + 1 < len(raw_lines):
                value = raw_lines[i + 1]
            result["name"] = value.upper().strip()

        elif "ngay sinh" in norm or "date of birth" in norm:
            m = DATE_REGEX.search(line)
            if m:
                result["dob"] = m.group()
            elif all_dates:
                result["dob"] = all_dates[0]

        elif norm.strip() == "nam" or "nu" in norm or "sex" in norm:
            if "nu" in norm:
                result["sex"] = "NỮ"
            elif "nam" in norm:
                result["sex"] = "NAM"

        elif "que quan" in norm or "place of origin" in norm:
            value = _strip_label(line, ["Quê quán", "Place of origin", "Que quan"])
            if not value and i + 1 < len(raw_lines):
                value = raw_lines[i + 1]
            result["home"] = value.strip()

        elif "thuong tru" in norm or "place of residence" in norm:
            value = _strip_label(line, ["Nơi thường trú", "Place of residence", "Thuong tru"])
            extra = raw_lines[i + 1] if i + 1 < len(raw_lines) else ""
            result["address"] = (value + " " + extra).strip()

    # neu khong tim thay du lieu toi thieu (id + name) -> coi nhu khong doc duoc the
    if not result["id"] or not result["name"]:
        return {"errorCode": 5, "errorMessage": "Không tìm thấy thẻ CCCD hoặc khuôn mặt trong ảnh.", "data": []}

    return {"errorCode": 0, "errorMessage": "success", "data": [result]}


def extract_back_side(raw_lines: list[str]) -> dict:
    """Tuong tu nhung cho MAT SAU CCCD (ngay cap, noi cap)."""
    joined = " ".join(raw_lines)
    all_dates = DATE_REGEX.findall(joined)

    result = {
        "id": "",
        "name": "",
        "dob": "",
        "sex": "",
        "nationality": "",
        "home": "",
        "address": "",
        "type": "back",
        "issue_date": all_dates[-1] if all_dates else "",
        "issue_loc": "",
    }

    for i, line in enumerate(raw_lines):
        lower = line.lower()
        if "cục" in lower or "công an" in lower or "cong an" in lower or "cuc" in lower:
            result["issue_loc"] = line.strip()

    if not result["issue_date"]:
        return {"errorCode": 5, "errorMessage": "Không tìm thấy thẻ CCCD hoặc khuôn mặt trong ảnh.", "data": []}

    return {"errorCode": 0, "errorMessage": "success", "data": [result]}


def extract_auto(raw_lines: list[str]) -> dict:
    """
    Tu dong doan la mat truoc hay mat sau, KHONG can frontend/backend
    phai khai bao truoc - dung y het cach FPT.AI cu tu tra ve field "type".

    Cach doan: neu thay tu khoa dac trung cua mat sau (Cuc, Cong an,
    dac diem nhan dang...) thi uu tien thu mat sau truoc; nguoc lai thu
    mat truoc truoc. Neu ben uu tien khong ra ket qua hop le, thu ben con lai.
    """
    joined_lower = " ".join(raw_lines).lower()
    looks_like_back = any(
        kw in joined_lower
        for kw in ["cục", "cuc canh sat", "công an", "cong an", "đặc điểm nhân dạng", "dac diem nhan dang"]
    )

    if looks_like_back:
        result = extract_back_side(raw_lines)
        if result["errorCode"] == 0:
            return result
        return extract_front_side(raw_lines)
    else:
        result = extract_front_side(raw_lines)
        if result["errorCode"] == 0:
            return result
        return extract_back_side(raw_lines)
