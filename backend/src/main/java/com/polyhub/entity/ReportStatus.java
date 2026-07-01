package com.polyhub.entity;

public enum ReportStatus {
    PENDING, // Chờ admin xử lý
    RESOLVED, // Chấp nhận -> đã gỡ/ẩn tài liệu
    DISMISSED // Từ chối -> tài liệu không vi phạm
}