package com.onlinebooking.service.impl;

import com.onlinebooking.dto.ServiceRequestDTO;
import com.onlinebooking.dto.ServiceResponseDTO;
import com.onlinebooking.entity.ServiceItem;
import com.onlinebooking.exception.ResourceNotFoundException;
import com.onlinebooking.repository.ServiceItemRepository;
import com.onlinebooking.service.ServiceItemService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ServiceItemServiceImpl implements ServiceItemService {

    private final ServiceItemRepository serviceItemRepository;

    public ServiceItemServiceImpl(ServiceItemRepository serviceItemRepository) {
        this.serviceItemRepository = serviceItemRepository;
    }

    @Override
    public ServiceResponseDTO createService(ServiceRequestDTO requestDTO) {
        ServiceItem serviceItem = new ServiceItem();
        serviceItem.setTitle(requestDTO.getTitle().trim());
        serviceItem.setDescription(requestDTO.getDescription() != null ? requestDTO.getDescription().trim() : null);
        serviceItem.setDurationMinutes(requestDTO.getDurationMinutes());
        serviceItem.setPrice(requestDTO.getPrice());
        serviceItem.setIsActive(requestDTO.getIsActive() != null ? requestDTO.getIsActive() : true);

        ServiceItem saved = serviceItemRepository.save(serviceItem);
        return mapToResponseDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceResponseDTO getServiceById(Long id) {
        ServiceItem serviceItem = findEntityById(id);
        return mapToResponseDTO(serviceItem);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceResponseDTO> getAllServices(Boolean activeOnly) {
        List<ServiceItem> services;
        if (Boolean.TRUE.equals(activeOnly)) {
            services = serviceItemRepository.findByIsActiveTrue();
        } else {
            services = serviceItemRepository.findAll();
        }
        return services.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceResponseDTO> getAllServices() {
        return getAllServices(false);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceResponseDTO> getActiveServices() {
        return getAllServices(true);
    }

    @Override
    public ServiceResponseDTO updateService(Long id, ServiceRequestDTO requestDTO) {
        ServiceItem serviceItem = findEntityById(id);

        serviceItem.setTitle(requestDTO.getTitle().trim());
        serviceItem.setDescription(requestDTO.getDescription() != null ? requestDTO.getDescription().trim() : null);
        serviceItem.setDurationMinutes(requestDTO.getDurationMinutes());
        serviceItem.setPrice(requestDTO.getPrice());
        if (requestDTO.getIsActive() != null) {
            serviceItem.setIsActive(requestDTO.getIsActive());
        }

        ServiceItem updated = serviceItemRepository.save(serviceItem);
        return mapToResponseDTO(updated);
    }

    @Override
    public ServiceResponseDTO deactivateService(Long id) {
        ServiceItem serviceItem = findEntityById(id);
        serviceItem.setIsActive(false);
        ServiceItem updated = serviceItemRepository.save(serviceItem);
        return mapToResponseDTO(updated);
    }

    @Override
    public void deleteService(Long id) {
        deactivateService(id);
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceItem findEntityById(Long id) {
        return serviceItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", id));
    }

    private ServiceResponseDTO mapToResponseDTO(ServiceItem item) {
        return new ServiceResponseDTO(
                item.getId(),
                item.getTitle(),
                item.getDescription(),
                item.getDurationMinutes(),
                item.getPrice(),
                item.getIsActive(),
                item.getCreatedAt()
        );
    }
}
