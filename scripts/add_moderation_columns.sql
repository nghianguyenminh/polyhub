-- =============================================================================
-- Migration: Thêm các cột kiểm duyệt nội dung AI vào bảng posts
-- Chạy script này 1 lần trên database production/staging
-- =============================================================================

-- Thêm cột trạng thái kiểm duyệt (default APPROVED để tương thích dữ liệu cũ)
ALTER TABLE posts
    ADD COLUMN moderation_status  VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
    ADD COLUMN moderation_reason  VARCHAR(500) NULL,
    ADD COLUMN moderation_category VARCHAR(50) NULL;

-- Index để admin query nhanh danh sách bài PENDING_REVIEW
CREATE INDEX idx_posts_moderation_status
    ON posts (moderation_status, created_at);

-- Xác nhận kết quả
SELECT
    moderation_status,
    COUNT(*) AS total
FROM posts
GROUP BY moderation_status;
