package com.onlinebooking.dto;

import jakarta.validation.constraints.NotBlank;

public class BookingStatusUpdateDTO {

    @NotBlank(message = "Status cannot be blank")
    private String status;

    public BookingStatusUpdateDTO() {
    }

    public BookingStatusUpdateDTO(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
