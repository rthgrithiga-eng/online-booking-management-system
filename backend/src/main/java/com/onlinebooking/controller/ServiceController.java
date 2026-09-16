package com.onlinebooking.controller;

import com.onlinebooking.dto.ServiceRequestDTO;
import com.onlinebooking.dto.ServiceResponseDTO;
import com.onlinebooking.service.ServiceItemService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/services")
@CrossOrigin(origins = "*")
public class ServiceController {

    private final ServiceItemService serviceItemService;

    public ServiceController(ServiceItemService serviceItemService) {
        this.serviceItemService = serviceItemService;
    }

    /**
     * Create a new service item
     * POST /api/services
     * Returns: 201 CREATED
     */
    @PostMapping
    public ResponseEntity<ServiceResponseDTO> createService(@Valid @RequestBody ServiceRequestDTO requestDTO) {
        ServiceResponseDTO createdService = serviceItemService.createService(requestDTO);
        return new ResponseEntity<>(createdService, HttpStatus.CREATED);
    }

    /**
     * View all services (optional query param: activeOnly=true)
     * GET /api/services
     * GET /api/services?activeOnly=true
     * Returns: 200 OK
     */
    @GetMapping
    public ResponseEntity<List<ServiceResponseDTO>> getAllServices(
            @RequestParam(name = "activeOnly", required = false, defaultValue = "false") boolean activeOnly
    ) {
        List<ServiceResponseDTO> services = serviceItemService.getAllServices(activeOnly);
        return ResponseEntity.ok(services);
    }

    /**
     * View one service by ID
     * GET /api/services/{id}
     * Returns: 200 OK or 404 NOT FOUND
     */
    @GetMapping("/{id}")
    public ResponseEntity<ServiceResponseDTO> getServiceById(@PathVariable Long id) {
        ServiceResponseDTO service = serviceItemService.getServiceById(id);
        return ResponseEntity.ok(service);
    }

    /**
     * Update an existing service
     * PUT /api/services/{id}
     * Returns: 200 OK
     */
    @PutMapping("/{id}")
    public ResponseEntity<ServiceResponseDTO> updateService(
            @PathVariable Long id,
            @Valid @RequestBody ServiceRequestDTO requestDTO
    ) {
        ServiceResponseDTO updatedService = serviceItemService.updateService(id, requestDTO);
        return ResponseEntity.ok(updatedService);
    }

    /**
     * Soft delete (deactivate) a service
     * DELETE /api/services/{id}
     * Returns: 200 OK
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteService(@PathVariable Long id) {
        ServiceResponseDTO deactivated = serviceItemService.deactivateService(id);
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Service deactivated successfully");
        response.put("id", deactivated.getId());
        response.put("title", deactivated.getTitle());
        response.put("isActive", deactivated.getIsActive());
        
        return ResponseEntity.ok(response);
    }
}
