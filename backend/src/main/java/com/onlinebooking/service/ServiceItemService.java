package com.onlinebooking.service;

import com.onlinebooking.dto.ServiceRequestDTO;
import com.onlinebooking.dto.ServiceResponseDTO;
import com.onlinebooking.entity.ServiceItem;

import java.util.List;

public interface ServiceItemService {

    ServiceResponseDTO createService(ServiceRequestDTO requestDTO);

    ServiceResponseDTO getServiceById(Long id);

    List<ServiceResponseDTO> getAllServices(Boolean activeOnly);

    List<ServiceResponseDTO> getAllServices();

    List<ServiceResponseDTO> getActiveServices();

    ServiceResponseDTO updateService(Long id, ServiceRequestDTO requestDTO);

    ServiceResponseDTO deactivateService(Long id);

    void deleteService(Long id);

    ServiceItem findEntityById(Long id);
}
