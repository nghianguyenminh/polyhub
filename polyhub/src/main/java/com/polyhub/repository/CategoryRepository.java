package com.polyhub.repository;

import com.polyhub.entity.Category;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
  List<Category> findByActive(boolean active);

  boolean existsByName(String name);

  boolean existsByCode(String code);
}
