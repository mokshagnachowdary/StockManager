package com.inventory.service;

import com.inventory.dto.Dtos.*;
import com.inventory.entity.*;
import com.inventory.exception.Exceptions;
import com.inventory.repository.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ItemService {

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;

    public ItemService(ItemRepository itemRepository, CategoryRepository categoryRepository) {
        this.itemRepository = itemRepository;
        this.categoryRepository = categoryRepository;
    }

    public Page<ItemResponse> getAllItems(int page, int size, String sort) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sort).ascending());
        return itemRepository.findByActiveTrue(pageable).map(this::toResponse);
    }

    public ItemResponse getById(Long id) {
        return toResponse(findEntityById(id));
    }

    public Page<ItemResponse> search(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return itemRepository.searchByKeyword(query, pageable).map(this::toResponse);
    }

    public Page<ItemResponse> getByCategory(Long categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return itemRepository.findByCategoryId(categoryId, pageable).map(this::toResponse);
    }

    @Transactional
    public ItemResponse create(ItemRequest req) {
        if (itemRepository.existsBySku(req.getSku()))
            throw new Exceptions.BadRequest("SKU already exists: " + req.getSku());

        Item item = new Item();
        item.setSku(req.getSku());
        item.setName(req.getName());
        item.setDescription(req.getDescription());
        item.setUsageContext(req.getUsageContext());
        item.setUnit(req.getUnit() != null ? req.getUnit() : "units");
        item.setUnitPrice(req.getUnitPrice());
        item.setReorderLevel(req.getReorderLevel() != null ? req.getReorderLevel() : 10);
        item.setMaxStockLevel(req.getMaxStockLevel() != null ? req.getMaxStockLevel() : 1000);
        item.setActive(true);

        if (req.getCategoryId() != null) {
            item.setCategory(categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new Exceptions.NotFound("Category", req.getCategoryId())));
        }
        return toResponse(itemRepository.save(item));
    }

    @Transactional
    public ItemResponse update(Long id, ItemRequest req) {
        Item item = findEntityById(id);
        if (!item.getSku().equals(req.getSku()) && itemRepository.existsBySku(req.getSku()))
            throw new Exceptions.BadRequest("SKU already exists: " + req.getSku());

        item.setSku(req.getSku());
        item.setName(req.getName());
        item.setDescription(req.getDescription());
        item.setUsageContext(req.getUsageContext());
        if (req.getUnit() != null)          item.setUnit(req.getUnit());
        if (req.getUnitPrice() != null)     item.setUnitPrice(req.getUnitPrice());
        if (req.getReorderLevel() != null)  item.setReorderLevel(req.getReorderLevel());
        if (req.getMaxStockLevel() != null) item.setMaxStockLevel(req.getMaxStockLevel());
        if (req.getCategoryId() != null) {
            item.setCategory(categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new Exceptions.NotFound("Category", req.getCategoryId())));
        }
        return toResponse(itemRepository.save(item));
    }

    @Transactional
    public void deactivate(Long id) {
        Item item = findEntityById(id);
        item.setActive(false);
        itemRepository.save(item);
    }

    public Item findEntityById(Long id) {
        return itemRepository.findById(id)
            .orElseThrow(() -> new Exceptions.NotFound("Item", id));
    }

    public ItemResponse toResponse(Item i) {
        return ItemResponse.builder()
            .id(i.getId()).sku(i.getSku()).name(i.getName())
            .description(i.getDescription()).usageContext(i.getUsageContext())
            .categoryId(i.getCategory() != null ? i.getCategory().getId() : null)
            .categoryName(i.getCategory() != null ? i.getCategory().getName() : null)
            .unit(i.getUnit()).unitPrice(i.getUnitPrice())
            .reorderLevel(i.getReorderLevel()).maxStockLevel(i.getMaxStockLevel())
            .active(i.getActive()).createdAt(i.getCreatedAt()).updatedAt(i.getUpdatedAt())
            .build();
    }
}
