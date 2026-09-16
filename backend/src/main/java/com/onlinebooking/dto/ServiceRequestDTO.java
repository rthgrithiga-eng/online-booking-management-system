package com.onlinebooking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class ServiceRequestDTO {

    @NotBlank(message = "Service title is required")
    @Size(min = 2, max = 150, message = "Title must be between 2 and 150 characters")
    private String title;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    @NotNull(message = "Duration in minutes is required")
    @Positive(message = "Duration must be a positive number of minutes")
    private Integer durationMinutes;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be a valid positive amount")
    private BigDecimal price;

    private Boolean isActive = true;

    public ServiceRequestDTO() {
    }

    public ServiceRequestDTO(String title, String description, Integer durationMinutes, BigDecimal price, Boolean isActive) {
        this.title = title;
        this.description = description;
        this.durationMinutes = durationMinutes;
        this.price = price;
        this.isActive = isActive != null ? isActive : true;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }
}
