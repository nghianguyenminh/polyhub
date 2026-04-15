package com.polyhub.repository;

import com.polyhub.entity.Category;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
  List<Category> findByActiveTrueOrderByNameAsc();

  @Query("SELECT c FROM Category c WHERE c.active = true ORDER BY c.name ASC")
  List<Category> findByIsActiveTrueOrderByNameAsc();

  boolean existsByCode(String code);
}
