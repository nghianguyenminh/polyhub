package com.polyhub.controller.admin;

import com.polyhub.entity.Product;
import com.polyhub.service.CategoryService;
import com.polyhub.service.ProductService;
import java.util.Date;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequiredArgsConstructor
@RequestMapping("/admin/products")
public class ProductAdminController {

    private final ProductService productService;
    private final CategoryService categoryService;

    @GetMapping
    public String listProducts(Model model) {
        model.addAttribute("products", productService.getAllProducts());
        model.addAttribute("categories", categoryService.getAllCategories());
        return "admin/products";
    }

    @PostMapping("/add")
    public String addProduct(
        @RequestParam String name,
        @RequestParam double price,
        @RequestParam Long categoryId
    ) {
        Product product = new Product();
        product.setName(name);
        product.setPrice(price);
        product.setCategory(categoryService.findById(categoryId));
        product.setCreatedAt(new Date());
        productService.saveProduct(product);
        return "redirect:/admin/products";
    }
}
