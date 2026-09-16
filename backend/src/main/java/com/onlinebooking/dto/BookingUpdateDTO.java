package com.onlinebooking.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class BookingUpdateDTO {

    @NotNull(message = "Booking date and time is required")
    @Future(message = "Booking date and time must be in the future")
    private LocalDateTime bookingDateTime;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    public BookingUpdateDTO() {
    }

    public BookingUpdateDTO(LocalDateTime bookingDateTime, String notes) {
        this.bookingDateTime = bookingDateTime;
        this.notes = notes;
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
