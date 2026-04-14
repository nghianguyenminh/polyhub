package com.polyhub.repository;

import com.polyhub.entity.Category;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends MongoRepository<Category, String> {
    
    // Tìm các danh mục đang hoạt động (dùng cho mảng Client: Sidebar/Dropdown/Filter)
    List<Category> findByIsActiveTrueOrderByNameAsc();
    
    // Kiểm tra mã danh mục xem có bị trùng khi Admin thêm mới hay không
    boolean existsByCode(String code);
}
