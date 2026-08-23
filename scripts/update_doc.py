import re

file_path = 'backend\\src\\main\\resources\\templates\\admin\\documents.html'
with open(file_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the tbody block
tbody_start = html.find('<tbody>')
tbody_end = html.find('</tbody>') + len('</tbody>')

tbody_content = '''<tbody>
                        <tr th:each="doc : ${documentPage.content}" th:classappend="${doc.status.name() == 'HIDDEN'} ? 'opacity-75' : (${doc.status.name() == 'REJECTED'} ? 'bg-danger-subtle' : '')">
                            <td class="ps-4">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="file-icon" th:classappend="
                                        ${doc.documentType == 'PDF' ? 'icon-pdf' : 
                                         (doc.documentType == 'WORD' ? 'icon-word' : 
                                         (doc.documentType == 'EXCEL' ? 'icon-excel' : 
                                         (doc.documentType == 'PPT' ? 'icon-ppt' : 'icon-zip')))}">
                                        <i class="bi" th:classappend="
                                            ${doc.documentType == 'PDF' ? 'bi-file-earmark-pdf-fill' : 
                                             (doc.documentType == 'WORD' ? 'bi-file-earmark-word-fill' : 
                                             (doc.documentType == 'EXCEL' ? 'bi-file-earmark-excel-fill' : 
                                             (doc.documentType == 'PPT' ? 'bi-file-earmark-ppt-fill' : 'bi-file-earmark-zip-fill')))}"></i>
                                    </div>
                                    <div style="line-height: 1.4; max-width: 250px;">
                                        <a th:href="${doc.fileUrl}" target="_blank" class="fw-bold text-dark text-decoration-none text-truncate d-block" th:text="${doc.title}">Title</a>
                                        <div class="d-flex align-items-center gap-2 mt-1">
                                            <span class="storage-badge text-muted" style="font-size: 11.5px;">
                                                <i class="bi bi-hdd-fill text-muted"></i> <span th:text="${doc.fileSize != null ? #numbers.formatDecimal(doc.fileSize / 1024.0 / 1024.0, 1, 2) + ' MB' : 'N/A'}">1.2 MB</span>
                                            </span>
                                            <span class="text-muted" style="font-size: 10px;">•</span>
                                            <span class="text-muted" style="font-size: 11.5px;" th:text="${#temporals.format(doc.createdAt, 'dd/MM/yyyy')}">10/10/2023</span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="d-flex align-items-center gap-2">
                                    <img src="https://ui-avatars.com/api/?name=Admin&background=F3F4F6&color=6B7280" class="owner-avatar">
                                    <span class="text-dark fw-medium" style="font-size: 13px;">Admin (Tạm)</span>
                                </div>
                            </td>
                            <td>
                                <span class="subject-tag" th:text="${doc.category != null ? doc.category.name : 'Không phân loại'}">Category</span>
                            </td>
                            <td>
                                <div class="interaction-stats">
                                    <div class="stat-item cursor-pointer" title="Lượt tải"><i class="bi bi-download"></i> <span th:text="${doc.downloadCount}">0</span></div>
                                </div>
                            </td>
                            <td>
                                <span class="status-badge" 
                                      th:classappend="${doc.status.name() == 'APPROVED' ? 'status-active' : 
                                                       (doc.status.name() == 'PENDING' ? 'status-pending' : 
                                                       (doc.status.name() == 'HIDDEN' ? 'status-hidden' : 'status-danger'))}">
                                    <span class="status-dot"></span> 
                                    <span th:text="${doc.status.name() == 'APPROVED' ? 'Đã Duyệt' : 
                                                     (doc.status.name() == 'PENDING' ? 'Chờ Duyệt' : 
                                                     (doc.status.name() == 'HIDDEN' ? 'Đã Gỡ/Ẩn' : 'Từ Chối'))}">Trạng thái</span>
                                </span>
                            </td>
                            <td class="text-center" style="padding-right: 1.5rem;">
                                <div class="dropdown">
                                    <button class="btn-action-dots mx-auto" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        <i class="bi bi-three-dots-vertical"></i>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end action-menu shadow">
                                        <li><a class="dropdown-item fw-medium" th:href="${doc.fileUrl}" target="_blank"><i class="bi bi-eye"></i> Xem / Tải file gốc</a></li>
                                        <li><hr class="dropdown-divider"></li>
                                        
                                        <li th:if="${doc.status.name() == 'PENDING'}">
                                            <form th:action="@{/admin/documents/{id}/approve(id=${doc.id})}" method="post" class="d-inline">
                                                <button type="submit" class="dropdown-item item-success fw-medium"><i class="bi bi-check-circle-fill"></i> Duyệt (Approve)</button>
                                            </form>
                                        </li>
                                        
                                        <li th:if="${doc.status.name() != 'HIDDEN'}">
                                            <a class="dropdown-item item-warning fw-medium" href="#" data-bs-toggle="modal" th:attr="data-bs-target='#takedownModal' + ${doc.id}"><i class="bi bi-eye-slash-fill"></i> Gỡ / Ẩn (Soft Delete)</a>
                                        </li>
                                        
                                        <li><hr class="dropdown-divider"></li>
                                        <li><a class="dropdown-item item-danger fw-medium" href="#" data-bs-toggle="modal" th:attr="data-bs-target='#hardDeleteModal' + ${doc.id}"><i class="bi bi-fire"></i> Xóa sạch (Hard Delete)</a></li>
                                    </ul>
                                </div>
                                
                                <!-- Modals cho từng Document (Takedown & Hard Delete) -->
                                <!-- Modal Gỡ Tài Liệu (Soft Delete) -->
                                <div class="modal fade text-start" th:id="'takedownModal' + ${doc.id}" tabindex="-1" aria-hidden="true">
                                    <div class="modal-dialog modal-dialog-centered">
                                        <div class="modal-content" style="border-radius: 16px; border: none;">
                                            <form th:action="@{/admin/documents/{id}/takedown(id=${doc.id})}" method="post">
                                                <div class="modal-header" style="background-color: #F9FAFB; border-radius: 16px 16px 0 0;">
                                                    <h5 class="modal-title fw-bold" style="font-size: 1.1rem;"><i class="bi bi-eye-slash-fill text-danger me-2"></i> Gỡ Tài liệu (Takedown)</h5>
                                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                                </div>
                                                <div class="modal-body">
                                                    <p class="text-muted" style="font-size: 14px;">Tài liệu <strong th:text="${doc.title}"></strong> sẽ bị <strong>Ẩn khỏi cộng đồng</strong> (Soft Delete) nhưng vẫn giữ File gốc trên Server.</p>
                                                    <div class="mb-3">
                                                        <label class="form-label fw-semibold" style="font-size: 13px;">Lý do gỡ tài liệu (Bắt buộc) <span class="text-danger">*</span></label>
                                                        <select name="reason" class="form-select form-select-sm mb-2" style="font-size: 13.5px; height: 38px;" required>
                                                            <option value="">-- Chọn một lý do tiêu chuẩn --</option>
                                                            <option value="Vi phạm bản quyền / Share Assignment">Vi phạm bản quyền / Share Assignment</option>
                                                            <option value="Sai môn học / Nội dung không liên quan">Sai môn học / Nội dung không liên quan</option>
                                                            <option value="File lỗi / File rác">File lỗi / File rác</option>
                                                            <option value="Khác">Lý do khác...</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div class="modal-footer bg-light" style="border-radius: 0 0 16px 16px;">
                                                    <button type="button" class="btn btn-light btn-sm px-4" data-bs-dismiss="modal">Hủy</button>
                                                    <button type="submit" class="btn btn-danger btn-sm px-4 fw-bold">Xác nhận Gỡ Tài liệu</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>

                                <!-- Modal Hard Delete File -->
                                <div class="modal fade text-start" th:id="'hardDeleteModal' + ${doc.id}" tabindex="-1" aria-hidden="true">
                                    <div class="modal-dialog modal-dialog-centered">
                                        <div class="modal-content border-danger" style="border-radius: 16px;">
                                            <form th:action="@{/admin/documents/{id}/delete(id=${doc.id})}" method="post">
                                                <div class="modal-header bg-danger text-white" style="border-radius: 14px 14px 0 0;">
                                                    <h5 class="modal-title fw-bold" style="font-size: 1.1rem;"><i class="bi bi-fire me-2"></i>Xóa vĩnh viễn (Hard Delete)</h5>
                                                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                                                </div>
                                                <div class="modal-body text-center py-4">
                                                    <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size: 3.5rem;"></i>
                                                    <h5 class="fw-bold mt-3 mb-2 text-danger">Xóa tận gốc File trên Server!</h5>
                                                    <p class="text-muted mb-0" style="font-size: 14px;">
                                                        Hành động này sẽ <strong>xóa file vật lý khỏi Cloud Storage</strong> và không thể hoàn tác. Bạn đang xóa file: <strong th:text="${doc.title}"></strong>.
                                                    </p>
                                                </div>
                                                <div class="modal-footer justify-content-center" style="border-radius: 0 0 16px 16px;">
                                                    <button type="button" class="btn btn-light px-4" data-bs-dismiss="modal">Hủy bỏ</button>
                                                    <button type="submit" class="btn btn-danger px-4 fw-bold"><i class="bi bi-trash3-fill"></i> Tiến hành Xóa sạch</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        
                        <tr th:if="${#lists.isEmpty(documentPage.content)}">
                            <td colspan="6" class="text-center py-5 text-muted">
                                <i class="bi bi-folder-x fs-1 d-block mb-3"></i>
                                Không tìm thấy tài liệu nào phù hợp.
                            </td>
                        </tr>
                    </tbody>'''

new_html = html[:tbody_start] + tbody_content + html[tbody_end:]

# Replace KPIs
kpi_total = new_html.find('12,450')
if kpi_total != -1:
    new_html = new_html[:kpi_total] + '<span th:text="${stats.total}">12,450</span>' + new_html[kpi_total + 6:]

kpi_pending = new_html.find('140')
if kpi_pending != -1:
    new_html = new_html[:kpi_pending] + '<span th:text="${stats.pending}">140</span>' + new_html[kpi_pending + 3:]

kpi_hidden = new_html.find('45')
if kpi_hidden != -1:
    new_html = new_html[:kpi_hidden] + '<span th:text="${stats.hidden}">45</span>' + new_html[kpi_hidden + 2:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_html)

print('Updated successfully')
