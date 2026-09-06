package com.inventory.controller;

import com.inventory.dto.Dtos.*;
import com.inventory.service.ItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/items")
@Tag(name = "Items", description = "Item catalog management")
@CrossOrigin(origins = "*")
public class ItemController {

    private final ItemService itemService;

    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    @GetMapping
    @Operation(summary = "List all active items")
    public Page<ItemResponse> getAll(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size,
        @RequestParam(defaultValue = "name") String sort) {
        return itemService.getAllItems(page, size, sort);
    }

    @GetMapping("/{id}")
    public ItemResponse getById(@PathVariable Long id) { return itemService.getById(id); }

    @GetMapping("/search")
    @Operation(summary = "Search items by name, description, usage context, or SKU")
    public Page<ItemResponse> search(
        @RequestParam String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {
        return itemService.search(q, page, size);
    }

    @GetMapping("/category/{categoryId}")
    public Page<ItemResponse> byCategory(
        @PathVariable Long categoryId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {
        return itemService.getByCategory(categoryId, page, size);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ItemResponse create(@Valid @RequestBody ItemRequest req) { return itemService.create(req); }

    @PutMapping("/{id}")
    public ItemResponse update(@PathVariable Long id, @Valid @RequestBody ItemRequest req) {
        return itemService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable Long id) { itemService.deactivate(id); }
}
