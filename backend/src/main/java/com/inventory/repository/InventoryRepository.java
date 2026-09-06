package com.inventory.repository;

import com.inventory.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByItemIdAndLocationId(Long itemId, Long locationId);

    List<Inventory> findByItemId(Long itemId);

    List<Inventory> findByLocationId(Long locationId);

    @Query("""
        SELECT inv FROM Inventory inv
        JOIN FETCH inv.item i
        JOIN FETCH inv.location l
        WHERE i.active = true AND l.active = true
        ORDER BY i.name, l.name
        """)
    List<Inventory> findAllWithDetails();

    // Items with stock at or below reorder level
    @Query("""
        SELECT inv FROM Inventory inv
        JOIN FETCH inv.item i
        JOIN FETCH inv.location l
        WHERE inv.quantity <= i.reorderLevel AND i.active = true
        ORDER BY inv.quantity ASC
        """)
    List<Inventory> findLowStockItems();

    // Dashboard summary counts
    @Query(value = """
        SELECT
            COUNT(DISTINCT item_id)                                          AS total_items,
            COUNT(DISTINCT location_id)                                      AS active_locations,
            SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END)                   AS out_of_stock,
            SUM(CASE WHEN quantity > 0 AND quantity <=
                (SELECT reorder_level FROM items WHERE id = item_id) THEN 1 ELSE 0 END) AS low_stock
        FROM inventory
        """, nativeQuery = true)
    Object[] getDashboardCounts();
}
