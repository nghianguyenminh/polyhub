package com.polyhub.service;

import com.polyhub.entity.Category;
import com.polyhub.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    /** Admin: Lấy full danh sách Chuyên ngành (Kể cả bị khoá) */
    public List<Category> getAllCategoriesForAdmin() {
        return categoryRepository.findAll();
    }

    /** Client: Lấy các Chuyên ngành hoạt động đổ vào Dropdown Bộ Lọc */
    public List<Category> getActiveCategoriesForDropdown() {
        return categoryRepository.findByIsActiveTrueOrderByNameAsc();
    }

    /** Admin: Thêm chuyên ngành mới */
    @Transactional
    public Category createCategory(Category category) {
        if (categoryRepository.existsByCode(category.getCode())) {
            throw new IllegalArgumentException("Mã chuyên ngành đã tồn tại trong hệ thống.");
        }
        category.setCode(category.getCode().toUpperCase().trim());
        category.setName(category.getName().trim());
        return categoryRepository.save(category);
    }

    /** Admin: Cập nhật thông tin */
    @Transactional
    public Category updateCategory(Long id, Category updatedCat) {
        Category existing = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Danh mục."));
        
        // Không cho phép đổi Mã (Code), chỉ cho đổi Tên
        existing.setName(updatedCat.getName().trim());
        return categoryRepository.save(existing);
    }

    /** Admin: Bật/Tắt hoạt động (Lock/Unlock) */
    @Transactional
    public Category toggleStatus(Long id) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Danh mục."));
        
        // Đảo ngược trạng thái
        cat.setActive(!cat.isActive());
        return categoryRepository.save(cat);
    }
}
