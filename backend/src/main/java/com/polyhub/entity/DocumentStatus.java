package com.polyhub.entity;

public enum DocumentStatus {
    PENDING,    // Chờ duyệt
    APPROVED,   // Đã duyệt (hiển thị public)
    REJECTED,   // Bị từ chối
    HIDDEN      // Đã gỡ/ẩn (Soft delete)
}
