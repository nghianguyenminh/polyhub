package com.polyhub.repository;

import com.polyhub.entity.Category;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
  List<Category> findByActiveTrueOrderByNameAsc();

  boolean existsByCode(String code);
}
