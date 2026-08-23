package com.polyhub.entity;

/**
 * Trạng thái kiểm duyệt nội dung của bài đăng.
 * - APPROVED: Đã được AI/Admin duyệt, hiển thị công khai
 * - PENDING_REVIEW: Nghi ngờ vi phạm, đang chờ Admin xem xét
 * - REJECTED: Bị từ chối vì vi phạm nội quy
 */
public enum ModerationStatus {
    APPROVED,
    PENDING_REVIEW,
    REJECTED
}
