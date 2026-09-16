package com.onlinebooking.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Online Booking Management System Backend");
        response.put("framework", "Spring Boot 3");
        response.put("database", "MySQL (online_booking_db)");
        response.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(response);
    }
}
