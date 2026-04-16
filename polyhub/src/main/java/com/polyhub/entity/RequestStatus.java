package com.polyhub.entity;

public enum RequestStatus {
    PENDING,   // Chờ phê duyệt
    APPROVED,  // Đã được duyệt
    REJECTED,   // Bị từ chối
    REVOKED    // Bị tước quyền.
}
