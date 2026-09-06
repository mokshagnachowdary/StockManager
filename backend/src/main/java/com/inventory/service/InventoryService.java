package com.inventory.service;

import com.inventory.dto.Dtos.*;
import com.inventory.entity.*;
import com.inventory.enums.StockStatus;
import com.inventory.enums.TransactionType;
import com.inventory.exception.Exceptions;
import com.inventory.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ItemRepository itemRepository;
    private final LocationRepository locationRepository;
    private final InventoryTransactionRepository transactionRepository;

    public InventoryService(
        InventoryRepository inventoryRepository,
        ItemRepository itemRepository,
        LocationRepository locationRepository,
        InventoryTransactionRepository transactionRepository) {
        this.inventoryRepository = inventoryRepository;
        this.itemRepository = itemRepository;
        this.locationRepository = locationRepository;
        this.transactionRepository = transactionRepository;
    }

    public List<InventoryResponse> getAllInventory() {
        return inventoryRepository.findAllWithDetails().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<InventoryResponse> getByItem(Long itemId) {
        return inventoryRepository.findByItemId(itemId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<InventoryResponse> getByLocation(Long locationId) {
        return inventoryRepository.findByLocationId(locationId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<InventoryResponse> getLowStockAlerts() {
        return inventoryRepository.findLowStockItems().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public TransactionResponse updateStock(UpdateStockRequest req) {
        Item item = itemRepository.findById(req.getItemId())
            .orElseThrow(() -> new Exceptions.NotFound("Item", req.getItemId()));
        Location location = locationRepository.findById(req.getLocationId())
            .orElseThrow(() -> new Exceptions.NotFound("Location", req.getLocationId()));

        Inventory inv = inventoryRepository.findByItemIdAndLocationId(req.getItemId(), req.getLocationId())
            .orElseGet(() -> {
                Inventory newInv = new Inventory();
                newInv.setItem(item);
                newInv.setLocation(location);
                newInv.setQuantity(0);
                newInv.setReservedQty(0);
                return newInv;
            });

        int before = inv.getQuantity();
        int delta  = resolveQuantityDelta(req.getTransactionType(), req.getQuantity());
        int after  = before + delta;

        if (after < 0)
            throw new Exceptions.InsufficientStock(
                String.format("Insufficient stock. Available: %d, Requested: %d", before, req.getQuantity()));
        if (after > item.getMaxStockLevel())
            throw new Exceptions.BadRequest(
                String.format("Would exceed max stock level of %d. Current: %d", item.getMaxStockLevel(), before));

        inv.setQuantity(after);
        inventoryRepository.save(inv);

        InventoryTransaction tx = new InventoryTransaction();
        tx.setItem(item);
        tx.setLocation(location);
        tx.setTransactionType(req.getTransactionType());
        tx.setQuantity(delta);
        tx.setQuantityBefore(before);
        tx.setQuantityAfter(after);
        tx.setReferenceNo(req.getReferenceNo());
        tx.setNotes(req.getNotes());
        tx.setPerformedBy(req.getPerformedBy());

        return toTxResponse(transactionRepository.save(tx));
    }

    public DashboardSummary getDashboard() {
        Object[] counts = inventoryRepository.getDashboardCounts();
        Object[] row = (counts != null && counts.length > 0) ? counts : new Object[]{0L, 0L, 0L, 0L};

        List<InventoryResponse> lowStock = getLowStockAlerts();
        List<TransactionResponse> recent = transactionRepository.findTop20ByOrderByCreatedAtDesc()
            .stream().map(this::toTxResponse).collect(Collectors.toList());

        long total     = row[0] != null ? ((Number) row[0]).longValue() : 0L;
        long locations = row[1] != null ? ((Number) row[1]).longValue() : 0L;
        long outOf     = row[2] != null ? ((Number) row[2]).longValue() : 0L;
        long low       = row[3] != null ? ((Number) row[3]).longValue() : 0L;

        return DashboardSummary.builder()
            .totalItems(total).activeLocations(locations)
            .outOfStockCount(outOf).lowStockCount(low)
            .inStockCount(Math.max(0, total - outOf - low))
            .lowStockAlerts(lowStock.subList(0, Math.min(6, lowStock.size())))
            .recentTransactions(recent)
            .build();
    }

    private int resolveQuantityDelta(TransactionType type, int qty) {
        return switch (type) {
            case REPLENISHMENT, TRANSFER_IN, RETURN -> qty;
            case USAGE, TRANSFER_OUT -> -qty;
            case ADJUSTMENT -> qty;
        };
    }

    private StockStatus computeStatus(Inventory inv) {
        int qty     = inv.getQuantity();
        int reorder = inv.getItem().getReorderLevel();
        int max     = inv.getItem().getMaxStockLevel();
        if (qty == 0)       return StockStatus.OUT_OF_STOCK;
        if (qty <= reorder) return StockStatus.LOW_STOCK;
        if (qty >= max)     return StockStatus.OVERSTOCKED;
        return StockStatus.IN_STOCK;
    }

    public InventoryResponse toResponse(Inventory inv) {
        return InventoryResponse.builder()
            .id(inv.getId())
            .itemId(inv.getItem().getId()).itemSku(inv.getItem().getSku())
            .itemName(inv.getItem().getName()).itemUnit(inv.getItem().getUnit())
            .locationId(inv.getLocation().getId()).locationName(inv.getLocation().getName())
            .quantity(inv.getQuantity()).reservedQty(inv.getReservedQty())
            .availableQty(inv.getQuantity() - inv.getReservedQty())
            .reorderLevel(inv.getItem().getReorderLevel())
            .stockStatus(computeStatus(inv)).updatedAt(inv.getUpdatedAt())
            .build();
    }

    public TransactionResponse toTxResponse(InventoryTransaction tx) {
        return TransactionResponse.builder()
            .id(tx.getId())
            .itemId(tx.getItem().getId()).itemName(tx.getItem().getName()).itemSku(tx.getItem().getSku())
            .locationId(tx.getLocation().getId()).locationName(tx.getLocation().getName())
            .transactionType(tx.getTransactionType()).quantity(tx.getQuantity())
            .quantityBefore(tx.getQuantityBefore()).quantityAfter(tx.getQuantityAfter())
            .referenceNo(tx.getReferenceNo()).notes(tx.getNotes())
            .performedBy(tx.getPerformedBy()).createdAt(tx.getCreatedAt())
            .build();
    }
}
