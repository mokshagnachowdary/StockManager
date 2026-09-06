package com.inventory.controller;

import com.inventory.dto.Dtos.*;
import com.inventory.repository.InventoryTransactionRepository;
import com.inventory.service.InventoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/transactions")
@Tag(name = "Transactions", description = "Inventory transaction history")
@CrossOrigin(origins = "*")
public class TransactionController {

    private final InventoryTransactionRepository transactionRepository;
    private final InventoryService inventoryService;

    public TransactionController(InventoryTransactionRepository transactionRepository, InventoryService inventoryService) {
        this.transactionRepository = transactionRepository;
        this.inventoryService = inventoryService;
    }

    @GetMapping("/recent")
    public List<TransactionResponse> recent() {
        return transactionRepository.findTop20ByOrderByCreatedAtDesc()
            .stream().map(inventoryService::toTxResponse).collect(Collectors.toList());
    }
}
