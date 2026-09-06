package com.inventory.service;

import com.inventory.dto.Dtos.*;
import com.inventory.entity.Location;
import com.inventory.exception.Exceptions;
import com.inventory.repository.LocationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class LocationService {

    private final LocationRepository locationRepository;

    public LocationService(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    public List<LocationResponse> getAll() {
        return locationRepository.findByActiveTrue().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public LocationResponse getById(Long id) {
        return toResponse(find(id));
    }

    @Transactional
    public LocationResponse create(LocationRequest req) {
        if (locationRepository.existsByName(req.getName()))
            throw new Exceptions.BadRequest("Location name already exists: " + req.getName());
        Location loc = new Location();
        loc.setName(req.getName());
        loc.setDescription(req.getDescription());
        loc.setAddress(req.getAddress());
        loc.setType(req.getType());
        loc.setActive(true);
        return toResponse(locationRepository.save(loc));
    }

    @Transactional
    public LocationResponse update(Long id, LocationRequest req) {
        Location loc = find(id);
        loc.setName(req.getName());
        loc.setDescription(req.getDescription());
        loc.setAddress(req.getAddress());
        loc.setType(req.getType());
        return toResponse(locationRepository.save(loc));
    }

    @Transactional
    public void deactivate(Long id) {
        Location loc = find(id);
        loc.setActive(false);
        locationRepository.save(loc);
    }

    private Location find(Long id) {
        return locationRepository.findById(id).orElseThrow(() -> new Exceptions.NotFound("Location", id));
    }

    private LocationResponse toResponse(Location l) {
        return LocationResponse.builder()
            .id(l.getId()).name(l.getName()).description(l.getDescription())
            .address(l.getAddress()).type(l.getType()).active(l.getActive())
            .createdAt(l.getCreatedAt()).build();
    }
}
