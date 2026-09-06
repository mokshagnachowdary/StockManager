package com.inventory.service;

import com.inventory.dto.Dtos.*;
import com.inventory.entity.Category;
import com.inventory.exception.Exceptions;
import com.inventory.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryResponse> getAll() {
        return categoryRepository.findAllByOrderByNameAsc().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public CategoryResponse create(CategoryRequest req) {
        if (categoryRepository.existsByName(req.getName()))
            throw new Exceptions.BadRequest("Category already exists: " + req.getName());
        Category c = new Category();
        c.setName(req.getName());
        c.setDescription(req.getDescription());
        return toResponse(categoryRepository.save(c));
    }

    private CategoryResponse toResponse(Category c) {
        return CategoryResponse.builder()
            .id(c.getId()).name(c.getName())
            .description(c.getDescription()).createdAt(c.getCreatedAt()).build();
    }
}
