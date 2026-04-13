import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class UpdateHtml {
    public static void main(String[] args) throws Exception {
        Path path = Paths.get("h:/DA_PolyHUb/polyhub/polyhub/src/main/resources/templates/admin/documents.html");
        String content = new String(Files.readAllBytes(path));

        String tbodyStartToken = "<tbody>";
        String tbodyEndToken = "</tbody>";
        
        int start = content.indexOf(tbodyStartToken);
        int end = content.indexOf(tbodyEndToken) + tbodyEndToken.length();
        
        String newTbody = "<tbody>\n" +
                "                        <tr th:each=\"doc : ${documentPage.content}\" th:classappend=\"${doc.status.name() == 'HIDDEN'} ? 'opacity-75' : (${doc.status.name() == 'REJECTED'} ? 'bg-danger-subtle' : '')\">\n" +
                "                            <td class=\"ps-4\">\n" +
                "                                <div class=\"d-flex align-items-center gap-3\">\n" +
                "                                    <div class=\"file-icon\" th:classappend=\"\n" +
                "                                        ${doc.documentType == 'PDF' ? 'icon-pdf' : \n" +
                "                                         (doc.documentType == 'WORD' ? 'icon-word' : \n" +
                "                                         (doc.documentType == 'EXCEL' ? 'icon-excel' : \n" +
                "                                         (doc.documentType == 'PPT' ? 'icon-ppt' : 'icon-zip')))}\">\n" +
                "                                        <i class=\"bi\" th:classappend=\"\n" +
                "                                            ${doc.documentType == 'PDF' ? 'bi-file-earmark-pdf-fill' : \n" +
                "                                             (doc.documentType == 'WORD' ? 'bi-file-earmark-word-fill' : \n" +
                "                                             (doc.documentType == 'EXCEL' ? 'bi-file-earmark-excel-fill' : \n" +
                "                                             (doc.documentType == 'PPT' ? 'bi-file-earmark-ppt-fill' : 'bi-file-earmark-zip-fill')))}\"></i>\n" +
                "                                    </div>\n" +
                "                                    <div style=\"line-height: 1.4; max-width: 250px;\">\n" +
                "                                        <a th:href=\"${doc.fileUrl}\" target=\"_blank\" class=\"fw-bold text-dark text-decoration-none text-truncate d-block\" th:text=\"${doc.title}\">Title</a>\n" +
                "                                        <div class=\"d-flex align-items-center gap-2 mt-1\">\n" +
                "                                            <span class=\"storage-badge text-muted\" style=\"font-size: 11.5px;\">\n" +
                "                                                <i class=\"bi bi-hdd-fill text-muted\"></i> <span th:text=\"${doc.fileSize != null ? #numbers.formatDecimal(doc.fileSize / 1024.0 / 1024.0, 1, 2) + ' MB' : 'N/A'}\">1.2 MB</span>\n" +
                "                                            </span>\n" +
                "                                            <span class=\"text-muted\" style=\"font-size: 10px;\">•</span>\n" +
                "                                            <span class=\"text-muted\" style=\"font-size: 11.5px;\" th:text=\"${#temporals.format(doc.createdAt, 'dd/MM/yyyy')}\">10/10/2023</span>\n" +
                "                                        </div>\n" +
                "                                    </div>\n" +
                "                                </div>\n" +
                "                            </td>\n" +
                "                            <td>\n" +
                "                                <div class=\"d-flex align-items-center gap-2\">\n" +
                "                                    <img src=\"https://ui-avatars.com/api/?name=User&background=F3F4F6&color=6B7280\" class=\"owner-avatar\">\n" +
                "                                    <span class=\"text-dark fw-medium\" style=\"font-size: 13px;\">Học viên</span>\n" +
                "                                </div>\n" +
                "                            </td>\n" +
                "                            <td>\n" +
                "                                <span class=\"subject-tag\" th:text=\"${doc.category != null ? doc.category.name : 'Không phân loại'}\">Category</span>\n" +
                "                            </td>\n" +
                "                            <td>\n" +
                "                                <div class=\"interaction-stats\">\n" +
                "                                    <div class=\"stat-item cursor-pointer\" title=\"Lượt tải\"><i class=\"bi bi-download\"></i> <span th:text=\"${doc.downloadCount}\">0</span></div>\n" +
                "                                </div>\n" +
                "                            </td>\n" +
                "                            <td>\n" +
                "                                <span class=\"status-badge\" \n" +
                "                                      th:classappend=\"${doc.status.name() == 'APPROVED' ? 'status-active' : \n" +
                "                                                       (doc.status.name() == 'PENDING' ? 'status-pending' : \n" +
                "                                                       (doc.status.name() == 'HIDDEN' ? 'status-hidden' : 'status-danger'))}\">\n" +
                "                                    <span class=\"status-dot\"></span> \n" +
                "                                    <span th:text=\"${doc.status.name() == 'APPROVED' ? 'Đã Duyệt' : \n" +
                "                                                     (doc.status.name() == 'PENDING' ? 'Chờ Duyệt' : \n" +
                "                                                     (doc.status.name() == 'HIDDEN' ? 'Đã Gỡ/Ẩn' : 'Từ Chối'))}\">Trạng thái</span>\n" +
                "                                </span>\n" +
                "                            </td>\n" +
                "                            <td class=\"text-center\" style=\"padding-right: 1.5rem;\">\n" +
                "                                <div class=\"dropdown\">\n" +
                "                                    <button class=\"btn-action-dots mx-auto\" type=\"button\" data-bs-toggle=\"dropdown\" aria-expanded=\"false\">\n" +
                "                                        <i class=\"bi bi-three-dots-vertical\"></i>\n" +
                "                                    </button>\n" +
                "                                    <ul class=\"dropdown-menu dropdown-menu-end action-menu shadow\">\n" +
                "                                        <li><a class=\"dropdown-item fw-medium\" th:href=\"${doc.fileUrl}\" target=\"_blank\"><i class=\"bi bi-eye\"></i> Xem / Tải file gốc</a></li>\n" +
                "                                        <li><hr class=\"dropdown-divider\"></li>\n" +
                "                                        \n" +
                "                                        <li th:if=\"${doc.status.name() == 'PENDING'}\">\n" +
                "                                            <form th:action=\"@{/admin/documents/{id}/approve(id=${doc.id})}\" method=\"post\" class=\"d-inline\">\n" +
                "                                                <button type=\"submit\" class=\"dropdown-item item-success fw-medium\"><i class=\"bi bi-check-circle-fill\"></i> Duyệt (Approve)</button>\n" +
                "                                            </form>\n" +
                "                                        </li>\n" +
                "                                        \n" +
                "                                        <li th:if=\"${doc.status.name() != 'HIDDEN'}\">\n" +
                "                                            <a class=\"dropdown-item item-warning fw-medium\" href=\"#\" data-bs-toggle=\"modal\" th:attr=\"data-bs-target='#takedownModal' + ${doc.id}\"><i class=\"bi bi-eye-slash-fill\"></i> Gỡ / Ẩn (Soft Delete)</a>\n" +
                "                                        </li>\n" +
                "                                        \n" +
                "                                        <li><hr class=\"dropdown-divider\"></li>\n" +
                "                                        <li><a class=\"dropdown-item item-danger fw-medium\" href=\"#\" data-bs-toggle=\"modal\" th:attr=\"data-bs-target='#hardDeleteModal' + ${doc.id}\"><i class=\"bi bi-fire\"></i> Xóa sạch (Hard Delete)</a></li>\n" +
                "                                    </ul>\n" +
                "                                </div>\n" +
                "                                \n" +
                "                                <!-- Modal Gỡ Tài Liệu (Soft Delete) -->\n" +
                "                                <div class=\"modal fade text-start\" th:id=\"'takedownModal' + ${doc.id}\" tabindex=\"-1\" aria-hidden=\"true\">\n" +
                "                                    <div class=\"modal-dialog modal-dialog-centered\">\n" +
                "                                        <div class=\"modal-content\" style=\"border-radius: 16px; border: none;\">\n" +
                "                                            <form th:action=\"@{/admin/documents/{id}/takedown(id=${doc.id})}\" method=\"post\">\n" +
                "                                                <div class=\"modal-header\" style=\"background-color: #F9FAFB; border-radius: 16px 16px 0 0;\">\n" +
                "                                                    <h5 class=\"modal-title fw-bold\" style=\"font-size: 1.1rem;\"><i class=\"bi bi-eye-slash-fill text-danger me-2\"></i> Gỡ Tài liệu (Takedown)</h5>\n" +
                "                                                    <button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"modal\" aria-label=\"Close\"></button>\n" +
                "                                                </div>\n" +
                "                                                <div class=\"modal-body\">\n" +
                "                                                    <p class=\"text-muted\" style=\"font-size: 14px;\">Tài liệu <strong th:text=\"${doc.title}\"></strong> sẽ bị <strong>Ẩn khỏi cộng đồng</strong> nhưng vẫn giữ File gốc trên Server.</p>\n" +
                "                                                    <div class=\"mb-3\">\n" +
                "                                                        <label class=\"form-label\" style=\"font-size: 13px;\">Lý do gỡ tài liệu (Bắt buộc) <span class=\"text-danger\">*</span></label>\n" +
                "                                                        <select name=\"reason\" class=\"form-select form-select-sm mb-2\" style=\"font-size: 13.5px; height: 38px;\" required>\n" +
                "                                                            <option value=\"\">-- Chọn một lý do tiêu chuẩn --</option>\n" +
                "                                                            <option value=\"Vi phạm bản quyền / Share Assignment\">Vi phạm bản quyền / Share Assignment</option>\n" +
                "                                                            <option value=\"Sai môn học / Nội dung không liên quan\">Sai môn học / Nội dung không liên quan</option>\n" +
                "                                                            <option value=\"File lỗi / File rác\">File lỗi / File rác</option>\n" +
                "                                                            <option value=\"Khác\">Lý do khác...</option>\n" +
                "                                                        </select>\n" +
                "                                                    </div>\n" +
                "                                                </div>\n" +
                "                                                <div class=\"modal-footer bg-light\" style=\"border-radius: 0 0 16px 16px;\">\n" +
                "                                                    <button type=\"button\" class=\"btn btn-light btn-sm px-4\" data-bs-dismiss=\"modal\">Hủy</button>\n" +
                "                                                    <button type=\"submit\" class=\"btn btn-danger btn-sm px-4 fw-bold\">Xác nhận Gỡ Tài liệu</button>\n" +
                "                                                </div>\n" +
                "                                            </form>\n" +
                "                                        </div>\n" +
                "                                    </div>\n" +
                "                                </div>\n" +
                "\n" +
                "                                <!-- Modal Hard Delete File -->\n" +
                "                                <div class=\"modal fade text-start\" th:id=\"'hardDeleteModal' + ${doc.id}\" tabindex=\"-1\" aria-hidden=\"true\">\n" +
                "                                    <div class=\"modal-dialog modal-dialog-centered\">\n" +
                "                                        <div class=\"modal-content border-danger\" style=\"border-radius: 16px;\">\n" +
                "                                            <form th:action=\"@{/admin/documents/{id}/delete(id=${doc.id})}\" method=\"post\">\n" +
                "                                                <div class=\"modal-header bg-danger text-white\" style=\"border-radius: 14px 14px 0 0;\">\n" +
                "                                                    <h5 class=\"modal-title fw-bold\" style=\"font-size: 1.1rem;\"><i class=\"bi bi-fire me-2\"></i>Xóa vĩnh viễn (Hard Delete)</h5>\n" +
                "                                                    <button type=\"button\" class=\"btn-close btn-close-white\" data-bs-dismiss=\"modal\" aria-label=\"Close\"></button>\n" +
                "                                                </div>\n" +
                "                                                <div class=\"modal-body text-center py-4\">\n" +
                "                                                    <i class=\"bi bi-exclamation-triangle-fill text-danger\" style=\"font-size: 3.5rem;\"></i>\n" +
                "                                                    <h5 class=\"fw-bold mt-3 mb-2 text-danger\">Xóa tận gốc File trên Server!</h5>\n" +
                "                                                    <p class=\"text-muted mb-0\" style=\"font-size: 14px;\">\n" +
                "                                                        Hành động này sẽ <strong>xóa file vật lý khỏi Cloud Storage</strong> và không thể hoàn tác. Bạn đang xóa file: <strong th:text=\"${doc.title}\"></strong>.\n" +
                "                                                    </p>\n" +
                "                                                </div>\n" +
                "                                                <div class=\"modal-footer justify-content-center\" style=\"border-radius: 0 0 16px 16px;\">\n" +
                "                                                    <button type=\"button\" class=\"btn btn-light px-4\" data-bs-dismiss=\"modal\">Hủy bỏ</button>\n" +
                "                                                    <button type=\"submit\" class=\"btn btn-danger px-4 fw-bold\"><i class=\"bi bi-trash3-fill\"></i> Tiến hành Xóa sạch</button>\n" +
                "                                                </div>\n" +
                "                                            </form>\n" +
                "                                        </div>\n" +
                "                                    </div>\n" +
                "                                </div>\n" +
                "                            </td>\n" +
                "                        </tr>\n" +
                "                        \n" +
                "                        <tr th:if=\"${#lists.isEmpty(documentPage.content)}\">\n" +
                "                            <td colspan=\"6\" class=\"text-center py-5 text-muted\">\n" +
                "                                <i class=\"bi bi-folder-x fs-1 d-block mb-3\"></i>\n" +
                "                                Không tìm thấy tài liệu nào.\n" +
                "                            </td>\n" +
                "                        </tr>\n" +
                "                    </tbody>";

        String modified = content.substring(0, start) + newTbody + content.substring(end);
        
        modified = modified.replace("12,450", "<span th:text=\"${stats.total}\">0</span>");
        modified = modified.replace("140", "<span th:text=\"${stats.pending}\">0</span>");
        modified = modified.replace("45", "<span th:text=\"${stats.hidden}\">0</span>");
        
        // Remove trailing modlas that overlap
        int staticModalStart = modified.indexOf("<!-- 5. Modals for Interventions -->");
        if (staticModalStart != -1) {
            int closeDiv = modified.indexOf("</div>", staticModalStart);
            int closeDiv2 = modified.indexOf("</div>", closeDiv + 4);
            int closeEnd = modified.indexOf("</div>", closeDiv2 + 4);
            String endPart = "\n    </div>\n</body>\n</html>";
            modified = modified.substring(0, staticModalStart) + endPart;
        }
        
        Files.write(path, modified.getBytes());
        System.out.println("DONE");
    }
}
