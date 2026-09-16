package com.onlinebooking.service;

import com.onlinebooking.dto.BookingRequestDTO;
import com.onlinebooking.dto.BookingResponseDTO;
import com.onlinebooking.dto.BookingUpdateDTO;
import com.onlinebooking.entity.BookingStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface BookingService {

    BookingResponseDTO createBooking(BookingRequestDTO requestDTO);

    BookingResponseDTO getBookingById(Long id);

    List<BookingResponseDTO> getBookingsByUserId(Long userId);

    List<BookingResponseDTO> getBookingsByStatus(BookingStatus status);

    List<BookingResponseDTO> getAllBookings();

    List<BookingResponseDTO> getBookingsWithFilters(BookingStatus status, Long userId, Long serviceId, LocalDate date);

    BookingResponseDTO updateBooking(Long id, BookingUpdateDTO updateDTO);

    BookingResponseDTO updateBookingStatus(Long id, BookingStatus newStatus);

    BookingResponseDTO rescheduleBooking(Long id, LocalDateTime newDateTime, String notes);

    BookingResponseDTO cancelBooking(Long id);

    boolean isSlotAvailable(Long serviceId, LocalDateTime dateTime);

    boolean isSlotAvailableExcludingBooking(Long serviceId, LocalDateTime dateTime, Long bookingId);
}
