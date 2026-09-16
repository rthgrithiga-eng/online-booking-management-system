package com.onlinebooking.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class BookingRequestDTO {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Service ID is required")
    private Long serviceId;

    @NotNull(message = "Booking date and time is required")
    @Future(message = "Booking date and time must be in the future")
    private LocalDateTime bookingDateTime;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    public BookingRequestDTO() {
    }

    public BookingRequestDTO(Long userId, Long serviceId, LocalDateTime bookingDateTime, String notes) {
        this.userId = userId;
        this.serviceId = serviceId;
        this.bookingDateTime = bookingDateTime;
        this.notes = notes;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getServiceId() {
        return serviceId;
    }

    public void setServiceId(Long serviceId) {
        this.serviceId = serviceId;
    }

    public LocalDateTime getBookingDateTime() {
        return bookingDateTime;
    }

    public void setBookingDateTime(LocalDateTime bookingDateTime) {
        this.bookingDateTime = bookingDateTime;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
