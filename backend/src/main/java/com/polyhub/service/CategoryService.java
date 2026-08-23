package com.polyhub.service;

import com.polyhub.entity.Category;
import com.polyhub.repository.CategoryRepository;
import com.polyhub.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {


private final CategoryRepository categoryRepository;
private final ProductRepository productRepository;

public List<Category> getAllCategoriesForAdmin() {
    return categoryRepository.findAll();
}

public List<Category> getActiveCategoriesForDropdown() {
    return categoryRepository.findByIsActiveTrueOrderByNameAsc();
}

@Transactional
public Category createCategory(Category category) {
    if (categoryRepository.existsByCode(category.getCode())) {
        throw new IllegalArgumentException("Mã chuyên ngành đã tồn tại.");
    }

    category.setCode(category.getCode().toUpperCase().trim());
    category.setName(category.getName().trim());

    return categoryRepository.save(category);
}

@Transactional
public Category updateCategory(Long id, Category updatedCat) {
    Category existing = categoryRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục."));

    existing.setName(updatedCat.getName().trim());

    return categoryRepository.save(existing);
}

@Transactional
public Category toggleStatus(Long id) {
    Category cat = categoryRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục."));

    cat.setActive(!cat.isActive());

    return categoryRepository.save(cat);
}

@Transactional
public void deleteCategory(Long id) {
    Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục."));

    if (!category.getDocuments().isEmpty()) {
        throw new IllegalStateException("Danh mục đang chứa tài liệu, không thể xóa.");
    }

    if (productRepository.existsByCategoryId(id)) {
        throw new IllegalStateException("Danh mục đang chứa sản phẩm, không thể xóa.");
    }

    categoryRepository.delete(category);
}


}
