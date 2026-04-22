package com.polyhub.repository;

import com.polyhub.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    // Tìm các danh mục đang hoạt động (dùng cho mảng Client: Sidebar/Dropdown/Filter)
    List<Category> findByIsActiveTrueOrderByNameAsc();
    
    // Kiểm tra mã danh mục xem có bị trùng khi Admin thêm mới hay không
    boolean existsByCode(String code);
}
