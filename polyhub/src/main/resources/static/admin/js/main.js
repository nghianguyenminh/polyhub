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
            
            // Nếu có main content area, điều chỉnh padding
            if(sidebar.classList.contains('collapsed')) {
                mainMain.style.paddingLeft = 'var(--sidebar-collapsed-width)';
            } else {
                mainMain.style.paddingLeft = 'var(--sidebar-width)';
            }
        });
    }

    // 2. Khởi tạo Bootstrap Tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
});