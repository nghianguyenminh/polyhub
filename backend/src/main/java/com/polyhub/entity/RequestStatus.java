package com.polyhub.entity;

public enum RequestStatus {
    PENDING,       // Chờ phê duyệt
    NEEDS_UPDATE,  // Yêu cầu bổ sung hồ sơ
    INTERVIEWING,  // Đang phỏng vấn
    APPROVED,      // Đã được duyệt
    REJECTED,      // Bị từ chối
    REVOKED        // Bị tước quyền
}
