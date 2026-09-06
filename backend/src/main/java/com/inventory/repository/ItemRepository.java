package com.inventory.repository;

import com.inventory.entity.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    Optional<Item> findBySkuAndActiveTrue(String sku);

    Page<Item> findByActiveTrue(Pageable pageable);

    // Full-text search using PostgreSQL tsvector
    @Query(value = """
        SELECT * FROM items
        WHERE active = true
          AND search_vector @@ plainto_tsquery('english', :query)
        ORDER BY ts_rank(search_vector, plainto_tsquery('english', :query)) DESC
        """, nativeQuery = true)
    Page<Item> fullTextSearch(@Param("query") String query, Pageable pageable);

    // Trigram similarity search (fuzzy)
    @Query(value = """
        SELECT * FROM items
        WHERE active = true
          AND (name ILIKE '%' || :query || '%'
            OR description ILIKE '%' || :query || '%'
            OR usage_context ILIKE '%' || :query || '%'
            OR sku ILIKE '%' || :query || '%')
        ORDER BY similarity(name, :query) DESC
        """, nativeQuery = true)
    Page<Item> searchByKeyword(@Param("query") String query, Pageable pageable);

    @Query("SELECT i FROM Item i WHERE i.category.id = :categoryId AND i.active = true")
    Page<Item> findByCategoryId(@Param("categoryId") Long categoryId, Pageable pageable);

    boolean existsBySku(String sku);
}
