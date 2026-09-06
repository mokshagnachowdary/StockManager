package com.inventory.dto;

import com.inventory.enums.StockStatus;
import com.inventory.enums.TransactionType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

// ─── Location DTOs ───────────────────────────────────────────────────────────

@Data @NoArgsConstructor @AllArgsConstructor @Builder
class LocationDto {
    private Long id;
    private String name;
    private String description;
    private String address;
    private String type;
    private Boolean active;
    private LocalDateTime createdAt;
}

// Make public for external use
public class Dtos {

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class LocationResponse {
        private Long id;
        private String name;
        private String description;
        private String address;
        private String type;
        private Boolean active;
        private LocalDateTime createdAt;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class LocationRequest {
        @NotBlank @Size(max = 100)
        private String name;
        private String description;
        @Size(max = 255)
        private String address;
        @Pattern(regexp = "WAREHOUSE|STORE|OFFICE|FACTORY|OTHER")
        private String type;
    }

    // ─── Category DTOs ────────────────────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CategoryResponse {
        private Long id;
        private String name;
        private String description;
        private LocalDateTime createdAt;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CategoryRequest {
        @NotBlank @Size(max = 100)
        private String name;
        private String description;
    }

    // ─── Item DTOs ────────────────────────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ItemResponse {
        private Long id;
        private String sku;
        private String name;
        private String description;
        private String usageContext;
        private Long categoryId;
        private String categoryName;
        private String unit;
        private BigDecimal unitPrice;
        private Integer reorderLevel;
        private Integer maxStockLevel;
        private Boolean active;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ItemRequest {
        @NotBlank @Size(max = 100)
        private String sku;
        @NotBlank @Size(max = 200)
        private String name;
        private String description;
        private String usageContext;
        private Long categoryId;
        @Size(max = 50)
        private String unit;
        @DecimalMin("0")
        private BigDecimal unitPrice;
        @Min(0)
        private Integer reorderLevel;
        @Min(1)
        private Integer maxStockLevel;
    }

    // ─── Inventory DTOs ───────────────────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class InventoryResponse {
        private Long id;
        private Long itemId;
        private String itemSku;
        private String itemName;
        private String itemUnit;
        private Long locationId;
        private String locationName;
        private Integer quantity;
        private Integer reservedQty;
        private Integer availableQty;
        private Integer reorderLevel;
        private StockStatus stockStatus;
        private LocalDateTime updatedAt;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class UpdateStockRequest {
        @NotNull
        private Long itemId;
        @NotNull
        private Long locationId;
        @NotNull
        private TransactionType transactionType;
        @NotNull @Min(1)
        private Integer quantity;
        private String referenceNo;
        private String notes;
        private String performedBy;
    }

    // ─── Transaction DTOs ─────────────────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TransactionResponse {
        private Long id;
        private Long itemId;
        private String itemName;
        private String itemSku;
        private Long locationId;
        private String locationName;
        private TransactionType transactionType;
        private Integer quantity;
        private Integer quantityBefore;
        private Integer quantityAfter;
        private String referenceNo;
        private String notes;
        private String performedBy;
        private LocalDateTime createdAt;
    }

    // ─── Dashboard DTOs ───────────────────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DashboardSummary {
        private long totalItems;
        private long activeLocations;
        private long outOfStockCount;
        private long lowStockCount;
        private long inStockCount;
        private List<InventoryResponse> lowStockAlerts;
        private List<TransactionResponse> recentTransactions;
    }

    // ─── Stock Status View projection ─────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class StockSummary {
        private Long itemId;
        private String sku;
        private String itemName;
        private String unit;
        private String categoryName;
        private Long totalQuantity;
        private Long totalReserved;
        private Long locationCount;
        private StockStatus overallStatus;
        private Integer reorderLevel;
    }
}
