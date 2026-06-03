package com.polyhub.controller.api.admin;

import com.polyhub.entity.Product;
import com.polyhub.entity.Category;
import com.polyhub.repository.CategoryRepository;
import com.polyhub.service.CategoryService;
import com.polyhub.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductApiController {

    private final ProductService productService;
    private final CategoryService categoryService;
    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<?> getProducts() {
        List<Product> products = productService.getAllProducts();
        List<Category> categories = categoryService.getAllCategoriesForAdmin();

        Map<String, Object> response = new HashMap<>();
        response.put("products", products);
        response.put("categories", categories);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/add")
    public ResponseEntity<?> addProduct(@RequestBody Map<String, Object> payload) {
        try {
            String name = (String) payload.get("name");
            double price = Double.parseDouble(payload.get("price").toString());
            Long categoryId = Long.parseLong(payload.get("categoryId").toString());

            Product product = new Product();
            product.setName(name);
            product.setPrice(price);
            product.setCategory(categoryRepository.findById(categoryId).orElse(null));
            product.setCreatedAt(LocalDateTime.now());
            productService.saveProduct(product);

            return ResponseEntity.ok(Map.of("message", "Thêm sản phẩm thành công.", "product", product));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }
}
