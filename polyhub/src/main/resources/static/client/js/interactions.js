/**
 * polyhub interactions: Like, Comment, Share
 */

// Hàm gọi khi nhấn Like
async function toggleLike(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Cần truyền CSRF Token nếu đang xài Spring Security CSRF bảo vệ (thường đọc từ meta tag)
                // 'X-CSRF-TOKEN': document.querySelector('meta[name="_csrf"]').content
            }
        });
        
        if (response.status === 401) {
            alert("Bạn cần đăng nhập để thả tim!");
            return;
        }
        
        const data = await response.json();
        const likeCountEl = document.getElementById(`like-count-${postId}`);
        const likeIconEl = document.getElementById(`like-icon-${postId}`);
        
        // Cập nhật giao diện
        if (likeCountEl) likeCountEl.textContent = data.totalLikes;
        if (likeIconEl) {
            if (data.liked) {
                likeIconEl.classList.remove('bi-heart');
                likeIconEl.classList.add('bi-heart-fill', 'text-danger');
            } else {
                likeIconEl.classList.remove('bi-heart-fill', 'text-danger');
                likeIconEl.classList.add('bi-heart');
            }
        }
    } catch (error) {
        console.error("Lỗi khi thả tim:", error);
    }
}

// Hàm gửi bình luận
async function submitComment(postId) {
    const commentInput = document.getElementById(`comment-input-${postId}`);
    const content = commentInput ? commentInput.value.trim() : '';
    
    if (!content) {
        alert("Bình luận không được để trống!");
        return;
    }
    
    try {
        const response = await fetch(`/api/posts/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: content })
        });
        
        if (response.status === 401) {
            alert("Bạn cần đăng nhập để bình luận!");
            return;
        }
        
        const newComment = await response.json();
        
        // Thêm bình luận mới vào UI
        const commentList = document.getElementById(`comment-list-${postId}`);
        if (commentList) {
            const userFullname = newComment.userFullname || newComment.username || "Ẩn danh";
            const userAvatar = newComment.userAvatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
            
            const commentHtml = `
                <div class="d-flex gap-2">
                    <img src="${userAvatar}" class="rounded-circle border" width="32" height="32" style="object-fit: cover;">
                    <div class="bg-light rounded-4 px-3 py-2" style="max-width: 85%;">
                        <strong style="font-size: 13.5px;" class="text-dark">${userFullname}</strong>
                        <p class="mb-0" style="font-size: 14.5px;">${newComment.content}</p>
                    </div>
                </div>
            `;
            commentList.insertAdjacentHTML('afterbegin', commentHtml);
        }
        
        // Reset input
        commentInput.value = '';
        
        // Tải lại list comment để render lại cấu trúc có Nút Reply
        loadPostComments(postId);
        
        // Tăng số lượng đếm nếu có
        const cmtCountEl = document.getElementById(`comment-count-${postId}`);
        if (cmtCountEl) {
            cmtCountEl.textContent = parseInt(cmtCountEl.textContent || 0) + 1;
        }
        
    } catch (error) {
        console.error("Lỗi khi gửi bình luận:", error);
    }
}

// Hàm gửi phản hồi bình luận
async function submitReply(postId, commentId) {
    const replyInput = document.getElementById(`reply-input-${commentId}`);
    const content = replyInput ? replyInput.value.trim() : '';

    if (!content) {
        alert("Phản hồi không được để trống!");
        return;
    }

    try {
        const response = await fetch(`/api/posts/${postId}/comment/${commentId}/reply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: content })
        });

        if (response.status === 401) {
            alert("Bạn cần đăng nhập để phản hồi lại!");
            return;
        }

        // Tải lại toàn bộ list comment sau khi phản hồi thành công
        loadPostComments(postId);
        
    } catch (error) {
        console.error("Lỗi khi gửi phản hồi:", error);
    }
}

// Hàm chia sẻ
async function sharePost(postId, destination = "Facebook") {
    try {
        const response = await fetch(`/api/posts/${postId}/share`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ destination: destination })
        });
        
        if (response.status === 401) {
            alert("Hãy đăng nhập để chia sẻ!");
            return;
        }
        
        const data = await response.json();
        console.log("Shared:", data);
        
        const shareCountEl = document.getElementById(`share-count-${postId}`);
        if (shareCountEl) {
            shareCountEl.textContent = parseInt(shareCountEl.textContent || 0) + 1;
        }
        
        alert(`Chia sẻ thành công lên ${destination}!`);
    } catch (error) {
        console.error("Lỗi khi chia sẻ:", error);
    }
}

// Tự động tải số liệu tương tác và bình luận
function initInteractions() {
    const posts = document.querySelectorAll('[data-post-id]');
    posts.forEach(post => {
        const postId = post.getAttribute('data-post-id');
        loadPostInteractions(postId);
        loadPostComments(postId);
    });
}

// Chạy khi script được load bình thường
document.addEventListener("DOMContentLoaded", initInteractions);
// Chạy thủ công nếu được load động
if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(initInteractions, 100);
}

async function loadPostInteractions(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}/interactions`);
        if (response.ok) {
            const data = await response.json();
            const likeCountEl = document.getElementById(`like-count-${postId}`);
            const commentCountEl = document.getElementById(`comment-count-${postId}`);
            const shareCountEl = document.getElementById(`share-count-${postId}`);
            const likeIconEl = document.getElementById(`like-icon-${postId}`);

            if (likeCountEl) likeCountEl.textContent = data.totalLikes;
            if (commentCountEl) commentCountEl.textContent = data.totalComments;
            if (shareCountEl) shareCountEl.textContent = data.totalShares;

            // Đổi trạng thái nút Like nếu user đã like
            if (likeIconEl && data.isLiked) {
                likeIconEl.classList.remove('bi-heart');
                likeIconEl.classList.add('bi-heart-fill', 'text-danger');
            }
        }
    } catch (error) {
        console.error("Lỗi tải interactions:", error);
    }
}

async function loadPostComments(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}/comments`);
        if (response.ok) {
            const comments = await response.json();
            const commentList = document.getElementById(`comment-list-${postId}`);
            if (commentList) {
                commentList.innerHTML = '';
                // Thêm danh sách comment từ dưới lên (cũ trên, mới dưới)
                comments.reverse().forEach(comment => {
                    const userFullname = comment.userFullname || comment.username || "Ẩn danh";
                    const userAvatar = comment.userAvatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                    const commentId = comment.id;

                    let repliesHtml = "";
                    if (comment.replies && comment.replies.length > 0) {
                        comment.replies.forEach(reply => {
                            const replyFullname = reply.userFullname || reply.username || "Ẩn danh";
                            const replyAvatar = reply.userAvatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                            repliesHtml += `
                                <div class="d-flex gap-2 mt-2">
                                    <img src="${replyAvatar}" class="rounded-circle border" width="24" height="24" style="object-fit: cover;">
                                    <div class="bg-light rounded-4 px-3 py-2" style="max-width: 85%;">
                                        <strong style="font-size: 13px;" class="text-dark">${replyFullname}</strong>
                                        <p class="mb-0" style="font-size: 13.5px;">${reply.content}</p>
                                    </div>
                                </div>
                            `;
                        });
                    }

                    const commentHtml = `
                        <div class="d-flex gap-2 mb-2 w-100">
                            <img src="${userAvatar}" class="rounded-circle border" width="32" height="32" style="object-fit: cover;">
                            <div class="w-100">
                                <div class="bg-light rounded-4 px-3 py-2" style="max-width: 85%; width: fit-content;">
                                    <strong style="font-size: 13.5px;" class="text-dark">${userFullname}</strong>
                                    <p class="mb-0" style="font-size: 14.5px;">${comment.content}</p>
                                </div>
                                <div class="ms-3 mt-1">
                                    <small class="text-muted fw-bold" style="cursor: pointer;" onclick="document.getElementById('reply-box-${commentId}').classList.toggle('d-none')">Phản hồi</small>
                                </div>
                                
                                ${repliesHtml}

                                <div id="reply-box-${commentId}" class="d-none mt-2 d-flex gap-2 w-100">
                                    <input type="text" id="reply-input-${commentId}" class="form-control form-control-sm rounded-pill" placeholder="Viết phản hồi...">
                                    <button class="btn btn-sm text-primary fw-bold" onclick="submitReply(${postId}, '${commentId}')"><i class="bi bi-send-fill"></i></button>
                                </div>
                            </div>
                        </div>
                    `;
                    commentList.insertAdjacentHTML('afterbegin', commentHtml);
                });
            }
        }
    } catch (error) {
        console.error("Lỗi tải list bình luận:", error);
    }
}