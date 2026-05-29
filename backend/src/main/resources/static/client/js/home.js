
            document.addEventListener('DOMContentLoaded', function() {
                const likeBtns = document.querySelectorAll('.btn-like');
                likeBtns.forEach(btn => {
                    btn.addEventListener('click', function() {
                        this.classList.toggle('text-danger');
                        const icon = this.querySelector('i');
                        if (icon.classList.contains('bi-heart')) {
                            icon.classList.replace('bi-heart', 'bi-heart-fill');
                            icon.style.transform = 'scale(1.3)';
                            setTimeout(() => icon.style.transform = 'scale(1)', 200);
                        } else {
                            icon.classList.replace('bi-heart-fill', 'bi-heart');
                            this.classList.remove('text-danger');
                        }
                        icon.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    });
                });
            });

            /* =======================================================
               === PHASE 4: TÍNH NĂNG CHIA SẺ BÀI VIẾT (SHARE) ===
               ======================================================= */
            let currentSharePostId = null;

            // Hàm mở Modal gõ trạng thái chia sẻ
            function openShareModal(postId) {
                currentSharePostId = postId;
                // Nếu chưa có Modal HTML trong trang, tạo nó ngầm để bớt phình code 
                if(!document.getElementById('sharePostModal')) {
                    const modalHtml = `
                        <div class="modal fade" id="sharePostModal" tabindex="-1" aria-hidden="true">
                            <div class="modal-dialog modal-dialog-centered">
                                <div class="modal-content" style="border-radius: 16px; border: none; box-shadow: 0 10px 40px rgba(0,0,0,0.15);">
                                    <div class="modal-header border-0 pb-0 position-relative" style="font-family: 'Inter', sans-serif;">
                                        <h5 class="modal-title fw-bolder w-100 text-center" style="color: #050505; font-size: 1.25rem; letter-spacing: -0.3px;">Chia sẻ bài viết</h5>
                                        <button type="button" class="btn border-0 shadow-none position-absolute rounded-circle p-2" data-bs-dismiss="modal" aria-label="Close" style="right: 15px; top: 12px; background-color: #e4e6eb; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s;"><i class="bi bi-x fs-4"></i></button>
                                    </div>
                                    <hr class="w-100 mb-0 mt-3" style="border-top: 1px solid #ced0d4;">
                                    <div class="modal-body pt-3 pb-2">
                                        <textarea id="share-post-caption" class="form-control border-0 px-0 shadow-none w-100 mt-2" rows="3" placeholder="Hãy nói gì đó về nội dung này..." style="resize:none; outline:none; background-color: transparent; font-family: 'Inter', sans-serif; font-size: 16px; color: #050505;"></textarea>
                                    </div>
                                    <div class="modal-footer border-0 pt-0 pb-3 px-3">
                                        <button type="button" class="btn w-100 fw-bold post-btn text-white fs-6 py-2" onclick="execSharePost()" id="btn-submit-share">Chia sẻ ngay</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    document.body.insertAdjacentHTML('beforeend', modalHtml);
                }
                
                const bsModal = new bootstrap.Modal(document.getElementById('sharePostModal'));
                bsModal.show();
            }

            // Hành động ấn nút Chia sẻ
            async function execSharePost() {
                if(!currentSharePostId) return;

                const caption = document.getElementById('share-post-caption').value.trim();
                const btn = document.getElementById('btn-submit-share');
                btn.disabled = true;
                btn.innerHTML = '<i class="spinner-border spinner-border-sm me-1"></i> Đang chia sẻ...';

                try {
                    const res = await fetch(`/api/posts/${currentSharePostId}/share`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: caption })
                    });
                    
                    if(res.ok) {
                        const modalEl = document.getElementById('sharePostModal');
                        const modalInstance = bootstrap.Modal.getInstance(modalEl);
                        modalInstance.hide();
                        
                        document.getElementById('share-post-caption').value = '';
                        // Do luồng Chia sẻ yêu cầu Render bọc nguyên 1 cục Post mớ => Đẩy reload nhẹ cho chắc CSDL thay vì Build nguyên cục DOM to đùng.
                        window.location.reload(); 
                    } else if (res.status === 401) {
                        alert("Theo tác gọi API từ chối: Vui lòng đăng nhập hệ thống để sử dụng tính năng.");
                    } else {
                        const err = await res.text();
                        alert("Lỗi chia sẻ: " + err);
                    }
                } catch(e) {
                    alert("Lỗi mạng khi chia sẻ bài viết!");
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = 'Chia sẻ ngay';
                }
            }

            // Handle Image Preview
            function previewImage(event) {
                const previewContainer = document.getElementById('imagePreviewContainer');
                const previewImg = document.getElementById('imagePreview');
                const file = event.target.files[0];
                
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        previewImg.src = e.target.result;
                        previewContainer.classList.remove('d-none');
                        // Hiển thị nút AI caption
                        document.getElementById('btn-ai-caption').classList.remove('d-none');
                    }
                    reader.readAsDataURL(file);
                }
            }

            // Xóa ảnh đã chọn
            function removeImage() {
                document.getElementById('post-image').value = '';
                document.getElementById('imagePreviewContainer').classList.add('d-none');
                document.getElementById('imagePreview').src = '';
                document.getElementById('btn-ai-caption').classList.add('d-none');
            }

            // Gọi AI cải thiện văn bản
            document.getElementById('btn-ai-improve').addEventListener('click', async () => {
                const text = document.getElementById('post-content').value;
                if (!text.trim()) {
                    alert('Vui lòng nhập nội dung trước khi dùng AI!');
                    return;
                }

                document.getElementById('ai-loading').classList.remove('d-none');
                document.getElementById('btn-ai-improve').disabled = true;

                try {
                    const res = await fetch('/api/ai/improve-text', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: text })
                    });
                    if(res.ok) {
                        document.getElementById('post-content').value = await res.text();
                    } else {
                        alert('Lỗi khi gọi AI: ' + await res.text());
                    }
                } catch(e) {
                    alert('Lỗi kết nối tới Server AI!');
                }

                document.getElementById('ai-loading').classList.add('d-none');
                document.getElementById('btn-ai-improve').disabled = false;
            });

            // Gọi AI gợi ý caption từ ảnh
            document.getElementById('btn-ai-caption').addEventListener('click', async () => {
                const file = document.getElementById('post-image').files[0];
                if (!file) return;

                document.getElementById('ai-loading').classList.remove('d-none');
                document.getElementById('btn-ai-caption').disabled = true;

                const formData = new FormData();
                formData.append('image', file);

                try {
                    const res = await fetch('/api/ai/suggest-caption', {
                        method: 'POST',
                        body: formData
                    });
                    if(res.ok) {
                        const caption = await res.text();
                        // Append vào nội dung hiện tại
                        const currentText = document.getElementById('post-content').value;
                        document.getElementById('post-content').value = currentText ? currentText + '\n\n' + caption : caption;
                    } else {
                        alert('Lỗi khi gọi AI: ' + await res.text());
                    }
                } catch(e) {
                    alert('Lỗi kết nối tới Server AI!');
                }

                document.getElementById('ai-loading').classList.add('d-none');
                document.getElementById('btn-ai-caption').disabled = false;
            });

            async function submitPost() {
                const content = document.getElementById('post-content').value;
                const imageFile = document.getElementById('post-image').files[0];

                if (!content.trim()) {
                    alert('Bạn chưa nhập nội dung gì mà!');
                    return;
                }

                // Ẩn nút đăng tạm thời & hiện trạng thái loading
                const btnSubmit = document.querySelector('button[onclick="submitPost()"]');
                const originalText = btnSubmit.innerText;
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang đăng...';

                // Setup dử liệu FormData
                const formData = new FormData();
                formData.append('content', content);
                if (imageFile) {
                    formData.append('image', imageFile);
                }

                try {
                    const response = await fetch('/api/posts/create', {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                        alert(result.message);

                        // Đăng xong thì đóng modal và xóa trắng form
                        document.getElementById('post-content').value = '';
                        removeImage();
                        const modalElement = document.getElementById('createPostModal');
                        const modalInstance = bootstrap.Modal.getInstance(modalElement);
                        modalInstance.hide();
                        
                        // Ở bài toán thực tế, ta sẽ thêm div HTML bài mới vào đầu feed (Dùng JS prepend)
                        // Tạm thời reload trình duyệt để thấy thay đổi luôn nè:
                        window.location.reload(); 
                    } else {
                        alert('Có lỗi xảy ra: ' + response.statusText);
                    }
                } catch (error) {
                    console.error('Lỗi upload', error);
                    alert('Lỗi hệ thống khi đăng bài!');
                } finally {
                    // Trả nút về trạng thái cũ
                    btnSubmit.disabled = false;
                    btnSubmit.innerText = originalText;
                }
            }

            /* =======================================================
               === PHASE 3: AJAX XỬ LÝ CHỨC NĂNG BÌNH LUẬN (COMMENT) ===
               ======================================================= */
            
            let replyingToMap = {}; // Biến toàn cục giúp lưu tạm trạng thái đang Reply cho bình luận cha nào

            // 1. Mở/Đóng phần bình luận của một bài viết
            function toggleCommentSection(postId) {
                const section = document.getElementById('comment-section-' + postId);
                if (section.classList.contains('d-none')) {
                    section.classList.remove('d-none');
                    loadComments(postId); // Gọi API Fetch Bình luận bằng JSON
                    
                    // Focus chuột ngay vào ô nhập để người dùng gõ
                    setTimeout(() => {
                        document.getElementById('comment-input-' + postId).focus();
                    }, 100);
                } else {
                    section.classList.add('d-none');
                }
            }

            // 2. Fetch danh sách bình luận từ Spring Boot RESTful API
            async function loadComments(postId) {
                const commentList = document.getElementById('comment-list-' + postId);
                commentList.innerHTML = `<div class="text-center text-muted py-2" style="font-size: 13px;"><i class="spinner-border spinner-border-sm me-1"></i> Đang tải bình luận...</div>`;

                try {
                    const response = await fetch(`/api/comments/${postId}`);
                    if (!response.ok) throw new Error('Network lỗi không lấy được bình luận');
                    
                    const comments = await response.json();
                    renderComments(postId, comments);
                    
                } catch (error) {
                    console.error('Error fetching comments:', error);
                    commentList.innerHTML = `<div class="text-center text-danger small py-2">Lỗi kết nối tải bình luận, vui lòng thử lại!</div>`;
                }
            }

            // 3. Render giao diện các bình luận bằng HTML Injection (Render đệ quy danh sách)
            function renderComments(postId, comments) {
                const commentList = document.getElementById('comment-list-' + postId);
                commentList.innerHTML = ''; 

                if(comments.length === 0) {
                    commentList.innerHTML = `<div class="text-center text-muted py-3" style="font-size: 13.5px;" id="no-comment-msg-${postId}">Chưa có bình luận nào. Hãy là người trao yêu thương đầu tiên!</div>`;
                    return;
                }

                comments.forEach(comment => {
                    const html = generateCommentHtml(comment, false, postId);
                    commentList.insertAdjacentHTML('beforeend', html);
                });
            }

            // Hàm tạo Single Comment Block HTML (Hỗ trợ Render Đệ Quy cho cấu trúc con - Cấp 1, Cấp 2...)
            function generateCommentHtml(c, isReply, postId) {
                const avt = (c.avatar && c.avatar.startsWith('http')) ? c.avatar : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                
                const dateObj = new Date(c.createdAt);
                const timeString = `${dateObj.toLocaleDateString('vi-VN')} ${dateObj.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}`;
                
                let renderReplies = '';
                // Nếu comment có chứa vòng đời đệ quy con thì đâm thẳng vào code tiếp
                if(c.replies && c.replies.length > 0) {
                    c.replies.forEach(rep => {
                        renderReplies += generateCommentHtml(rep, true, postId);
                    });
                }

                return `
                    <div class="d-flex align-items-start gap-2 ${isReply ? 'ms-4 mt-2 border-start ps-2 border-2' : 'mt-1'}" id="comment-item-${c.id}">
                        <img src="${avt}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'" class="rounded-circle border mt-1" width="${isReply ? 24 : 32}" height="${isReply ? 24 : 32}" style="object-fit: cover;">
                        <div class="flex-grow-1">
                            <div class="bg-white rounded-4 px-3 py-2 border shadow-sm" style="display: inline-block; max-width: 100%;">
                                <div class="fw-bold" style="font-size: ${isReply ? 12 : 13.5}px;">${c.fullname}</div>
                                <div style="font-size: ${isReply ? 13 : 14}px; white-space: pre-wrap; line-height: 1.4; color: #1c1e21;">${c.content}</div>
                            </div>
                            <div class="d-flex align-items-center gap-3 text-muted mt-1 px-2" style="font-size: 11.5px; font-weight: 500;">
                                <span class="cursor-pointer" style="cursor:pointer;" onclick="alert('Tính năng Like Comment đang được nâng cấp')">Thích</span>
                                <span class="cursor-pointer" style="cursor:pointer;" onclick="focusReply(${postId}, ${c.id}, '${c.fullname}')">Phản hồi</span>
                                <span class="fw-normal" style="font-size: 11px;">${timeString}</span>
                            </div>
                            
                            <!-- Box render các replies (Đệ quy gắn vào ngọn này) -->
                            <div id="reply-list-${c.id}" class="d-flex flex-column w-100">
                                ${renderReplies}
                            </div>
                        </div>
                    </div>
                `;
            }

            // 4. Bắn HTTP POST Lên CSDL để Save Comment và Trả Mới Về Tức Thì
            async function submitComment(postId) {
                const inputEle = document.getElementById('comment-input-' + postId);
                const content = inputEle.value.trim();
                
                if (!content) return;

                // Lấy ID cha nếu đang rơi vào luồng Trả lời
                const parentId = replyingToMap[postId] || null;

                const payload = {
                    content: content,
                    postId: postId,
                    parentId: parentId
                };

                inputEle.disabled = true;

                try {
                    const response = await fetch('/api/comments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        const newCommentDTO = await response.json();
                        
                        // Xóa tin nhắn chuẩn bị cho lần gõ sau
                        inputEle.value = '';
                        inputEle.style.height = '38px'; 
                        replyingToMap[postId] = null; 

                        // Tắt chữ "Chưa có bình luận nào"
                        const noCmtMsg = document.getElementById('no-comment-msg-' + postId);
                        if(noCmtMsg) noCmtMsg.remove();

                        // Nếu là bắn trả lời thì dí HTML ngọn vào cành cha
                        if(parentId) {
                            const targetReplyList = document.getElementById('reply-list-' + parentId);
                            if(targetReplyList) {
                                targetReplyList.insertAdjacentHTML('beforeend', generateCommentHtml(newCommentDTO, true, postId));
                            }
                        } else {
                            // Cành cha thì mọc dưới luồng gốc bảng to
                            const listEle = document.getElementById('comment-list-' + postId);
                            listEle.insertAdjacentHTML('beforeend', generateCommentHtml(newCommentDTO, false, postId));
                        }

                        // Cuộn Auto trượt thanh cuốn xuống kịch đáy hộp chat Comment
                        const scrollDiv = document.getElementById('comment-list-' + postId);
                        scrollDiv.scrollTop = scrollDiv.scrollHeight;

                    } else {
                        const err = await response.text();
                        alert("Không thể gửi bình luận: " + err);
                    }
                } catch (error) {
                    console.error('Submit error:', error);
                    alert("Kết nối mạng yếu, không gửi được bình luận hiện tại.");
                } finally {
                    inputEle.disabled = false;
                    inputEle.focus();
                }
            }

            // 5. Nút Bấm Phản hồi (Mention Auto Fill)
            function focusReply(postId, commentId, authorName) {
                replyingToMap[postId] = commentId; // Neo node đang bị trỏ tới bằng Object Memory
                const inputArea = document.getElementById('comment-input-' + postId);
                inputArea.value = `@${authorName} : `; // Mention tên
                inputArea.focus();
                inputArea.style.height = inputArea.scrollHeight + 'px';
            }

            /* =======================================================
               === PHASE 5: TÍNH NĂNG QUẢN LÝ BÀI ĐĂNG ===
               ======================================================= */
            
            // 1. Chuyển đổi quyền riêng tư (Public/Private)
            async function togglePostPrivacy(postId) {
                if (!confirm("Bạn có chắc muốn thay đổi quyền riêng tư của bài viết này?")) return;
                
                try {
                    const res = await fetch(`/api/posts/${postId}/privacy`, {
                        method: 'PATCH'
                    });
                    
                    if (res.ok) {
                        const data = await res.json();
                        // Cập nhật lại UI
                        const iconEl = document.getElementById(`privacy-icon-${postId}`);
                        const menuIconEl = document.getElementById(`privacy-menu-icon-${postId}`);
                        const menuTextEl = document.getElementById(`privacy-menu-text-${postId}`);
                        
                        if (data.isPrivate) {
                            iconEl.className = 'bi bi-lock-fill';
                            iconEl.title = 'Chỉ mình tôi';
                            menuIconEl.className = 'bi bi-globe-americas me-2';
                            menuTextEl.innerText = 'Đổi sang Công khai';
                        } else {
                            iconEl.className = 'bi bi-globe-americas';
                            iconEl.title = 'Công khai';
                            menuIconEl.className = 'bi bi-lock me-2';
                            menuTextEl.innerText = 'Đổi sang Chỉ mình tôi';
                        }
                        
                        alert(data.message);
                    } else {
                        const err = await res.text();
                        alert("Lỗi: " + err);
                    }
                } catch(e) {
                    alert("Lỗi mạng. Vui lòng thử lại!");
                }
            }

            // 2. Xóa bài viết
            async function deletePost(postId) {
                if (!confirm("Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác!")) return;
                
                try {
                    const res = await fetch(`/api/posts/${postId}`, {
                        method: 'DELETE'
                    });
                    
                    if (res.ok) {
                        alert("Đã xóa bài viết thành công!");
                        window.location.reload();
                    } else {
                        const err = await res.text();
                        alert("Lỗi xóa: " + err);
                    }
                } catch(e) {
                    alert("Lỗi mạng. Vui lòng thử lại!");
                }
            }

            // 3. Sửa bài viết (Mở modal)
            let currentEditPostId = null;
            function openEditPostModal(postId) {
                currentEditPostId = postId;
                const contentEl = document.getElementById(`post-content-display-${postId}`);
                if(!contentEl) return;
                
                const currentContent = contentEl.innerText;
                
                // Nếu chưa có Modal HTML trong trang, tạo nó ngầm để bớt phình code 
                if(!document.getElementById('editPostModal')) {
                    const modalHtml = `
                        <div class="modal fade" id="editPostModal" tabindex="-1" aria-hidden="true">
                            <div class="modal-dialog modal-dialog-centered">
                                <div class="modal-content" style="border-radius: 16px; border: none; box-shadow: 0 10px 40px rgba(0,0,0,0.15);">
                                    <div class="modal-header border-0 pb-0 position-relative" style="font-family: 'Inter', sans-serif;">
                                        <h5 class="modal-title fw-bolder w-100 text-center" style="color: #050505; font-size: 1.25rem; letter-spacing: -0.3px;">Chỉnh sửa bài viết</h5>
                                        <button type="button" class="btn border-0 shadow-none position-absolute rounded-circle p-2" data-bs-dismiss="modal" aria-label="Close" style="right: 15px; top: 12px; background-color: #e4e6eb; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s;"><i class="bi bi-x fs-4"></i></button>
                                    </div>
                                    <hr class="w-100 mb-0 mt-3" style="border-top: 1px solid #ced0d4;">
                                    <div class="modal-body pt-3 pb-2">
                                        <textarea id="edit-post-content" class="form-control border-0 px-0 shadow-none w-100 mt-2" rows="4" style="resize:none; outline:none; background-color: transparent; font-family: 'Inter', sans-serif; font-size: 16px; color: #050505;"></textarea>
                                    </div>
                                    <div class="modal-footer border-0 pt-0 pb-3 px-3">
                                        <button type="button" class="btn w-100 fw-bold post-btn text-white fs-6 py-2" onclick="execEditPost()" id="btn-submit-edit">Lưu thay đổi</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    document.body.insertAdjacentHTML('beforeend', modalHtml);
                }
                
                document.getElementById('edit-post-content').value = currentContent;
                const bsModal = new bootstrap.Modal(document.getElementById('editPostModal'));
                bsModal.show();
            }

            // Thực thi lưu bài viết
            async function execEditPost() {
                if(!currentEditPostId) return;
                
                const newContent = document.getElementById('edit-post-content').value.trim();
                if(!newContent) {
                    alert("Nội dung không được để trống!");
                    return;
                }
                
                const btn = document.getElementById('btn-submit-edit');
                btn.disabled = true;
                btn.innerHTML = '<i class="spinner-border spinner-border-sm me-1"></i> Đang lưu...';

                try {
                    const res = await fetch(`/api/posts/${currentEditPostId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: newContent })
                    });
                    
                    if(res.ok) {
                        // Update DOM trực tiếp
                        document.getElementById(`post-content-display-${currentEditPostId}`).innerText = newContent;
                        
                        const modalEl = document.getElementById('editPostModal');
                        const modalInstance = bootstrap.Modal.getInstance(modalEl);
                        modalInstance.hide();
                        alert("Đã cập nhật bài viết!");
                    } else {
                        const err = await res.text();
                        alert("Lỗi: " + err);
                    }
                } catch(e) {
                    alert("Lỗi mạng khi lưu bài viết!");
                } finally {
                    btn.disabled = false;
                    btn.innerText = 'Lưu thay đổi';
                }
            }

            // 4. Báo cáo bài viết (Mở modal)
            let currentReportPostId = null;
            function openReportModal(postId) {
                currentReportPostId = postId;
                
                if(!document.getElementById('reportPostModal')) {
                    const modalHtml = `
                        <div class="modal fade" id="reportPostModal" tabindex="-1" aria-hidden="true">
                            <div class="modal-dialog modal-dialog-centered">
                                <div class="modal-content" style="border-radius: 16px; border: none; box-shadow: 0 10px 40px rgba(0,0,0,0.15);">
                                    <div class="modal-header border-0 pb-0 position-relative" style="font-family: 'Inter', sans-serif;">
                                        <h5 class="modal-title fw-bolder w-100 text-center text-danger" style="font-size: 1.25rem; letter-spacing: -0.3px;">Báo cáo bài viết</h5>
                                        <button type="button" class="btn border-0 shadow-none position-absolute rounded-circle p-2" data-bs-dismiss="modal" aria-label="Close" style="right: 15px; top: 12px; background-color: #e4e6eb; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s;"><i class="bi bi-x fs-4"></i></button>
                                    </div>
                                    <hr class="w-100 mb-0 mt-3" style="border-top: 1px solid #ced0d4;">
                                    <div class="modal-body pt-3 pb-2">
                                        <p class="mb-2 text-muted" style="font-size: 14.5px;">Hãy cho chúng tôi biết tại sao bạn muốn báo cáo bài viết này:</p>
                                        <select id="report-reason" class="form-select mb-3" style="border-radius: 8px; cursor: pointer; border-color: #ced0d4;">
                                            <option value="" disabled selected>-- Chọn lý do --</option>
                                            <option value="Nội dung khiêu dâm, đồi trụy">Nội dung khiêu dâm, đồi trụy</option>
                                            <option value="Bạo lực, đẫm máu">Bạo lực, đẫm máu</option>
                                            <option value="Xúc phạm, bôi nhọ người khác">Xúc phạm, bôi nhọ người khác</option>
                                            <option value="Spam, quảng cáo trái phép">Spam, quảng cáo trái phép</option>
                                            <option value="Khác">Lý do khác...</option>
                                        </select>
                                    </div>
                                    <div class="modal-footer border-0 pt-0 pb-3 px-3">
                                        <button type="button" class="btn btn-danger w-100 fw-bold fs-6 py-2" style="border-radius: 50rem;" onclick="execReportPost()" id="btn-submit-report">Gửi Báo Cáo</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    document.body.insertAdjacentHTML('beforeend', modalHtml);
                }
                
                document.getElementById('report-reason').value = "";
                const bsModal = new bootstrap.Modal(document.getElementById('reportPostModal'));
                bsModal.show();
            }

            // Thực thi Báo cáo
            async function execReportPost() {
                if(!currentReportPostId) return;
                
                const reason = document.getElementById('report-reason').value;
                if(!reason) {
                    alert("Vui lòng chọn một lý do báo cáo!");
                    return;
                }
                
                const btn = document.getElementById('btn-submit-report');
                btn.disabled = true;
                btn.innerHTML = '<i class="spinner-border spinner-border-sm me-1"></i> Đang gửi...';

                try {
                    const res = await fetch(`/api/posts/${currentReportPostId}/report`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reason: reason })
                    });
                    
                    if(res.ok) {
                        const data = await res.json();
                        alert(data.message); 
                        
                        const modalEl = document.getElementById('reportPostModal');
                        const modalInstance = bootstrap.Modal.getInstance(modalEl);
                        modalInstance.hide();
                    } else {
                        const err = await res.text();
                        alert("Không thể báo cáo: " + err);
                    }
                } catch(e) {
                    alert("Lỗi mạng khi gửi báo cáo!");
                } finally {
                    btn.disabled = false;
                    btn.innerText = 'Gửi Báo Cáo';
                }
            }
    