$filePath = "h:\DA_PolyHUb\polyhub\polyhub\src\main\resources\templates\admin\documents.html"
$content = Get-Content -Path $filePath -Raw -Encoding UTF8

$tbodyStart = $content.IndexOf("<tbody>")
$tbodyEnd = $content.IndexOf("</tbody>") + 8

$tbodyContent = @"
<tbody>
                        <tr th:each="doc : `${documentPage.content}" th:classappend="`${doc.status.name() == 'HIDDEN'} ? 'opacity-75' : (`${doc.status.name() == 'REJECTED'} ? 'bg-danger-subtle' : '')">
                            <td class="ps-4">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="file-icon" th:classappend="
                                        `${doc.documentType == 'PDF' ? 'icon-pdf' : 
                                         (doc.documentType == 'WORD' ? 'icon-word' : 
                                         (doc.documentType == 'EXCEL' ? 'icon-excel' : 
                                         (doc.documentType == 'PPT' ? 'icon-ppt' : 'icon-zip')))}">
                                        <i class="bi" th:classappend="
                                            `${doc.documentType == 'PDF' ? 'bi-file-earmark-pdf-fill' : 
                                             (doc.documentType == 'WORD' ? 'bi-file-earmark-word-fill' : 
                                             (doc.documentType == 'EXCEL' ? 'bi-file-earmark-excel-fill' : 
                                             (doc.documentType == 'PPT' ? 'bi-file-earmark-ppt-fill' : 'bi-file-earmark-zip-fill')))}"></i>
                                    </div>
                                    <div style="line-height: 1.4; max-width: 250px;">
                                        <a th:href="`${doc.fileUrl}" target="_blank" class="fw-bold text-dark text-decoration-none text-truncate d-block" th:text="`${doc.title}">Title</a>
                                        <div class="d-flex align-items-center gap-2 mt-1">
                                            <span class="storage-badge text-muted" style="font-size: 11.5px;">
                                                <i class="bi bi-hdd-fill text-muted"></i> <span th:text="`${doc.fileSize != null ? #numbers.formatDecimal(doc.fileSize / 1024.0 / 1024.0, 1, 2) + ' MB' : 'N/A'}">1.2 MB</span>
                                            </span>
                                            <span class="text-muted" style="font-size: 10px;">•</span>
                                            <span class="text-muted" style="font-size: 11.5px;" th:text="`${#temporals.format(doc.createdAt, 'dd/MM/yyyy')}">10/10/2023</span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="d-flex align-items-center gap-2">
                                    <img src="https://ui-avatars.com/api/?name=Admin&background=F3F4F6&color=6B7280" class="owner-avatar">
                                    <span class="text-dark fw-medium" style="font-size: 13px;">Admin</span>
                                </div>
                            </td>
                            <td>
                                <span class="subject-tag" th:text="`${doc.category != null ? doc.category.name : 'Không phân loại'}">Category</span>
                            </td>
                            <td>
                                <div class="interaction-stats">
                                    <div class="stat-item cursor-pointer" title="Lượt tải"><i class="bi bi-download"></i> <span th:text="`${doc.downloadCount}">0</span></div>
                                </div>
                            </td>
                            <td>
                                <span class="status-badge" 
                                      th:classappend="`${doc.status.name() == 'APPROVED' ? 'status-active' : 
                                                       (doc.status.name() == 'PENDING' ? 'status-pending' : 
                                                       (doc.status.name() == 'HIDDEN' ? 'status-hidden' : 'status-danger'))}">
                                    <span class="status-dot"></span> 
                                    <span th:text="`${doc.status.name() == 'APPROVED' ? 'Đã Duyệt' : 
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
                                        <li><a class="dropdown-item fw-medium" th:href="`${doc.fileUrl}" target="_blank"><i class="bi bi-eye"></i> Xem / Tải file gốc</a></li>
                                        <li><hr class="dropdown-divider"></li>
                                        
                                        <li th:if="`${doc.status.name() == 'PENDING'}">
                                            <form th:action="`@{/admin/documents/{id}/approve(id=`${doc.id})}" method="post" class="d-inline">
                                                <button type="submit" class="dropdown-item item-success fw-medium"><i class="bi bi-check-circle-fill"></i> Duyệt (Approve)</button>
                                            </form>
                                        </li>
                                        
                                        <li th:if="`${doc.status.name() != 'HIDDEN'}">
                                            <a class="dropdown-item item-warning fw-medium" href="#" data-bs-toggle="modal" th:attr="data-bs-target='#takedownModal' + `${doc.id}"><i class="bi bi-eye-slash-fill"></i> Gỡ / Ẩn (Soft Delete)</a>
                                        </li>
                                        
                                        <li><hr class="dropdown-divider"></li>
                                        <li><a class="dropdown-item item-danger fw-medium" href="#" data-bs-toggle="modal" th:attr="data-bs-target='#hardDeleteModal' + `${doc.id}"><i class="bi bi-fire"></i> Xóa sạch (Hard Delete)</a></li>
                                    </ul>
                                </div>
                                
                                <div class="modal fade text-start" th:id="'takedownModal' + `${doc.id}" tabindex="-1" aria-hidden="true">
                                    <div class="modal-dialog modal-dialog-centered">
                                        <div class="modal-content" style="border-radius: 16px; border: none;">
                                            <form th:action="`@{/admin/documents/{id}/takedown(id=`${doc.id})}" method="post">
                                                <div class="modal-header" style="background-color: #F9FAFB; border-radius: 16px 16px 0 0;">
                                                    <h5 class="modal-title fw-bold" style="font-size: 1.1rem;"><i class="bi bi-eye-slash-fill text-danger me-2"></i> Gỡ Tài liệu (Takedown)</h5>
                                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                                </div>
                                                <div class="modal-body">
                                                    <p class="text-muted" style="font-size: 14px;">Tài liệu <strong th:text="`${doc.title}"></strong> sẽ bị <strong>Ẩn khỏi cộng đồng</strong> nhưng vẫn giữ File gốc trên Server.</p>
                                                    <div class="mb-3">
                                                        <label class="form-label" style="font-size: 13px;">Lý do (Bắt buộc) <span class="text-danger">*</span></label>
                                                        <select name="reason" class="form-select form-select-sm" required>
                                                            <option value="">-- Chọn một lý do --</option>
                                                            <option value="Vi phạm bản quyền">Vi phạm bản quyền</option>
                                                            <option value="Sai môn học">Sai môn học</option>
                                                            <option value="File lỗi / File rác">File lỗi / File rác</option>
                                                            <option value="Khác">Lý do khác...</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div class="modal-footer bg-light">
                                                    <button type="button" class="btn btn-light btn-sm px-4" data-bs-dismiss="modal">Hủy</button>
                                                    <button type="submit" class="btn btn-danger btn-sm px-4 fw-bold">Xác nhận</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>

                                <div class="modal fade text-start" th:id="'hardDeleteModal' + `${doc.id}" tabindex="-1" aria-hidden="true">
                                    <div class="modal-dialog modal-dialog-centered">
                                        <div class="modal-content border-danger" style="border-radius: 16px;">
                                            <form th:action="`@{/admin/documents/{id}/delete(id=`${doc.id})}" method="post">
                                                <div class="modal-header bg-danger text-white">
                                                    <h5 class="modal-title fw-bold"><i class="bi bi-fire me-2"></i>Xóa vĩnh viễn (Hard Delete)</h5>
                                                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                                                </div>
                                                <div class="modal-body text-center py-4">
                                                    <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size: 3.5rem;"></i>
                                                    <h5 class="fw-bold mt-3 mb-2 text-danger">Xóa tận gốc File trên Server!</h5>
                                                    <p class="text-muted" style="font-size: 14px;">Bạn đang xóa file: <strong th:text="`${doc.title}"></strong>.</p>
                                                </div>
                                                <div class="modal-footer justify-content-center">
                                                    <button type="button" class="btn btn-light px-4" data-bs-dismiss="modal">Hủy bỏ</button>
                                                    <button type="submit" class="btn btn-danger px-4 fw-bold"><i class="bi bi-trash3-fill"></i> Xóa sạch</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        
                        <tr th:if="`${#lists.isEmpty(documentPage.content)}">
                            <td colspan="6" class="text-center py-5 text-muted">
                                <i class="bi bi-folder-x fs-1 d-block mb-3"></i>
                                Không tìm thấy tài liệu nào.
                            </td>
                        </tr>
                    </tbody>
"@
$newContent = $content.Substring(0, $tbodyStart) + $tbodyContent + $content.Substring($tbodyEnd)
$newContent = $newContent -replace '12,450', '<span th:text="`${stats.total}">0</span>'
$newContent = $newContent -replace '140', '<span th:text="`${stats.pending}">0</span>'
$newContent = $newContent -replace '45', '<span th:text="`${stats.hidden}">0</span>'

# Tidy up unneeded modal blocks at end of file so there's no conflict
$modalStart = $newContent.IndexOf('<!-- Modal View PDF Preview -->')
if ($modalStart -gt 0) {
    # Find the end of the myContent fragment
    $fragmentEnd = $newContent.IndexOf('</div>', $modalStart)
    $newContent = $newContent.Substring(0, $modalStart) + "<!-- Dynamic Modals inside Table -->`n    </div>`n</body>`n</html>"
}

[System.IO.File]::WriteAllText($filePath, $newContent, [System.Text.Encoding]::UTF8)
Write-Host "Updated"
