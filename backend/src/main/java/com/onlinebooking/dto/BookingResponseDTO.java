package com.onlinebooking.dto;

import com.onlinebooking.entity.BookingStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class BookingResponseDTO {

    private Long id;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private Long serviceId;
    private String serviceTitle;
    private Integer serviceDurationMinutes;
    private LocalDateTime bookingDateTime;
    private BookingStatus status;
    private String notes;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public BookingResponseDTO() {
    }

    public BookingResponseDTO(Long id, Long userId, String userFullName, String userEmail,
                              Long serviceId, String serviceTitle, Integer serviceDurationMinutes,
                              LocalDateTime bookingDateTime, BookingStatus status, String notes,
                              BigDecimal totalAmount, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.userFullName = userFullName;
        this.userEmail = userEmail;
        this.serviceId = serviceId;
        this.serviceTitle = serviceTitle;
        this.serviceDurationMinutes = serviceDurationMinutes;
        this.bookingDateTime = bookingDateTime;
        this.status = status;
        this.notes = notes;
        this.totalAmount = totalAmount;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserFullName() {
        return userFullName;
    }

    public void setUserFullName(String userFullName) {
        this.userFullName = userFullName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public Long getServiceId() {
        return serviceId;
    }

    public void setServiceId(Long serviceId) {
        this.serviceId = serviceId;
    }

    public String getServiceTitle() {
        return serviceTitle;
    }

    public void setServiceTitle(String serviceTitle) {
        this.serviceTitle = serviceTitle;
    }

    public Integer getServiceDurationMinutes() {
        return serviceDurationMinutes;
    }

    public void setServiceDurationMinutes(Integer serviceDurationMinutes) {
        this.serviceDurationMinutes = serviceDurationMinutes;
    }

    public LocalDateTime getBookingDateTime() {
        return bookingDateTime;
    }

    public void setBookingDateTime(LocalDateTime bookingDateTime) {
        this.bookingDateTime = bookingDateTime;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getBookingDate() {
        return bookingDateTime != null ? bookingDateTime.toLocalDate().toString() : null;
    }

    public String getBookingTime() {
        return bookingDateTime != null ? String.format("%02d:%02d", bookingDateTime.getHour(), bookingDateTime.getMinute()) : null;
    }
}
