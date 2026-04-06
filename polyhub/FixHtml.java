import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class FixHtml {
    public static void main(String[] args) throws Exception {
        Path path = Paths.get("h:/DA_PolyHUb/polyhub/polyhub/src/main/resources/templates/admin/documents.html");
        String content = new String(Files.readAllBytes(path), "UTF-8");

        String dropdownRegex = "(?s)<ul class=\"dropdown-menu dropdown-menu-end action-menu shadow\">.*?</ul>";
        String newDropdown = "<ul class=\"dropdown-menu dropdown-menu-end action-menu shadow\">\n" +
                "                                        <li><a class=\"dropdown-item fw-medium\" th:href=\"${doc.fileUrl}\" target=\"_blank\"><i class=\"bi bi-eye text-primary\"></i> Xem / Tải file gốc</a></li>\n" +
                "                                        <li><hr class=\"dropdown-divider\"></li>\n" +
                "                                        \n" +
                "                                        <li th:if=\"${doc.status.name() == 'PENDING'}\">\n" +
                "                                            <form th:action=\"@{/admin/documents/{id}/approve(id=${doc.id})}\" method=\"post\" class=\"m-0\">\n" +
                "                                                <button type=\"submit\" class=\"dropdown-item item-success fw-medium\"><i class=\"bi bi-check-circle-fill\"></i> Duyệt (Approve)</button>\n" +
                "                                            </form>\n" +
                "                                        </li>\n" +
                "                                        \n" +
                "                                        <li th:if=\"${doc.status.name() != 'HIDDEN'}\">\n" +
                "                                            <a class=\"dropdown-item item-warning fw-medium\" href=\"#\" data-bs-toggle=\"modal\" th:attr=\"data-bs-target='#takedownModal' + ${doc.id}\"><i class=\"bi bi-eye-slash-fill\"></i> Gỡ / Ẩn (Soft Delete)</a>\n" +
                "                                        </li>\n" +
                "                                        \n" +
                "                                        <li th:if=\"${doc.status.name() == 'HIDDEN'}\">\n" +
                "                                            <form th:action=\"@{/admin/documents/{id}/restore(id=${doc.id})}\" method=\"post\" class=\"m-0\">\n" +
                "                                                <button type=\"submit\" class=\"dropdown-item fw-medium\" style=\"color: #0dcaf0;\"><i class=\"bi bi-unlock-fill\"></i> Mở khóa (Restore)</button>\n" +
                "                                            </form>\n" +
                "                                        </li>\n" +
                "                                        \n" +
                "                                        <li><hr class=\"dropdown-divider\"></li>\n" +
                "                                        <li><a class=\"dropdown-item item-danger fw-medium\" href=\"#\" data-bs-toggle=\"modal\" th:attr=\"data-bs-target='#hardDeleteModal' + ${doc.id}\"><i class=\"bi bi-fire\"></i> Xóa sạch (Hard Delete)</a></li>\n" +
                "                                    </ul>";

        content = content.replaceAll(dropdownRegex, java.util.regex.Matcher.quoteReplacement(newDropdown));
        
        Files.write(path, content.getBytes("UTF-8"));
        System.out.println("Cleaned dropdown HTML!");
    }
}
