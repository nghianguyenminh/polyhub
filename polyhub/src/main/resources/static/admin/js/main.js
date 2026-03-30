/* =========================================
   POLYHUB ADMIN: CORE JS
   ========================================= */
document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Xử lý thu gọn/mở rộng Sidebar
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const mainMain = document.querySelector('.admin-main');

    if (sidebarToggle && sidebar && mainMain) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
        });
    }

    // 2. Khởi tạo Bootstrap Tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
});