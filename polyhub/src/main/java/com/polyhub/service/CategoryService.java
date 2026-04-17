package com.polyhub.service;

import com.polyhub.entity.Category;
import java.util.List;

public interface CategoryService {
    List<Category> getAllCategories();
    Category saveCategory(Category category);
    Category findById(Long id);
}
