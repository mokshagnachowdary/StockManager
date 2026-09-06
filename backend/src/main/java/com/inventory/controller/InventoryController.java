package com.inventory.controller;

import com.inventory.dto.Dtos.*;
import com.inventory.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/v1/inventory")
@Tag(name = "Inventory", description = "Stock level management")
@CrossOrigin(origins = "*")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    @Operation(summary = "Get all inventory with stock status")
    public List<InventoryResponse> getAll() { return inventoryService.getAllInventory(); }

    @GetMapping("/item/{itemId}")
    public List<InventoryResponse> byItem(@PathVariable Long itemId) { return inventoryService.getByItem(itemId); }

    @GetMapping("/location/{locationId}")
    public List<InventoryResponse> byLocation(@PathVariable Long locationId) { return inventoryService.getByLocation(locationId); }

    @GetMapping("/alerts/low-stock")
    @Operation(summary = "Items at or below reorder level")
    public List<InventoryResponse> lowStock() { return inventoryService.getLowStockAlerts(); }

    @PostMapping("/update")
    @Operation(summary = "Update stock (usage, replenishment, adjustment, transfer)")
    public TransactionResponse updateStock(@Valid @RequestBody UpdateStockRequest req) {
        return inventoryService.updateStock(req);
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Dashboard summary with alerts and recent activity")
    public DashboardSummary dashboard() { return inventoryService.getDashboard(); }
}
