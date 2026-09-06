package com.inventory.repository;

import com.inventory.entity.InventoryTransaction;
import com.inventory.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    Page<InventoryTransaction> findByItemIdOrderByCreatedAtDesc(Long itemId, Pageable pageable);

    Page<InventoryTransaction> findByLocationIdOrderByCreatedAtDesc(Long locationId, Pageable pageable);

    Page<InventoryTransaction> findByTransactionTypeOrderByCreatedAtDesc(TransactionType type, Pageable pageable);

    List<InventoryTransaction> findTop20ByOrderByCreatedAtDesc();
}
