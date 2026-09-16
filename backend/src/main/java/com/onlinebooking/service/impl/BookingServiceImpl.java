package com.onlinebooking.service.impl;

import com.onlinebooking.dto.BookingRequestDTO;
import com.onlinebooking.dto.BookingResponseDTO;
import com.onlinebooking.dto.BookingUpdateDTO;
import com.onlinebooking.entity.Booking;
import com.onlinebooking.entity.BookingStatus;
import com.onlinebooking.entity.ServiceItem;
import com.onlinebooking.entity.User;
import com.onlinebooking.exception.ResourceNotFoundException;
import com.onlinebooking.exception.SlotUnavailableException;
import com.onlinebooking.repository.BookingRepository;
import com.onlinebooking.repository.ServiceItemRepository;
import com.onlinebooking.repository.UserRepository;
import com.onlinebooking.service.BookingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ServiceItemRepository serviceItemRepository;

    public BookingServiceImpl(
            BookingRepository bookingRepository,
            UserRepository userRepository,
            ServiceItemRepository serviceItemRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.serviceItemRepository = serviceItemRepository;
    }

    @Override
    public BookingResponseDTO createBooking(BookingRequestDTO requestDTO) {
        // 1. Verify user exists
        User user = userRepository.findById(requestDTO.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", requestDTO.getUserId()));

        // 2. Verify service exists
        ServiceItem service = serviceItemRepository.findById(requestDTO.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", requestDTO.getServiceId()));

        // 3. Verify service is active
        if (!Boolean.TRUE.equals(service.getIsActive())) {
            throw new IllegalArgumentException("Service '" + service.getTitle() + "' is currently inactive and cannot be booked");
        }

        // 4. Verify booking date/time is not in the past
        LocalDateTime bookingDateTime = requestDTO.getBookingDateTime();
        if (bookingDateTime == null || bookingDateTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Booking date and time must be in the future");
        }

        // 5. Check whether the slot is already booked for this service
        if (!isSlotAvailable(service.getId(), bookingDateTime)) {
            throw new SlotUnavailableException(
                    "The selected time slot (" + bookingDateTime + ") is already booked for service '" 
                    + service.getTitle() + "'. Please choose another date or time slot."
            );
        }

        // 6. Create booking
        Booking booking = new Booking();
        booking.setUser(user);
        booking.setService(service);
        booking.setBookingDateTime(bookingDateTime);
        // 7. Initial status PENDING
        booking.setStatus(BookingStatus.PENDING);
        booking.setNotes(requestDTO.getNotes() != null ? requestDTO.getNotes().trim() : null);
        // 8. Total amount from current service price
        booking.setTotalAmount(service.getPrice());

        // 9. Save to database
        Booking saved = bookingRepository.save(booking);

        return mapToResponseDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponseDTO getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));
        return mapToResponseDTO(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getAllBookings() {
        return bookingRepository.findAll().stream()
                .sorted((a, b) -> b.getBookingDateTime().compareTo(a.getBookingDateTime()))
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getBookingsByUserId(Long userId) {
        // Ensure user exists
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        return bookingRepository.findByUserIdOrderByBookingDateTimeDesc(userId).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getBookingsByStatus(BookingStatus status) {
        return bookingRepository.findByStatus(status).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getBookingsWithFilters(BookingStatus status, Long userId, Long serviceId, LocalDate date) {
        LocalDateTime startDate = null;
        LocalDateTime endDate = null;

        if (date != null) {
            startDate = date.atStartOfDay();
            endDate = date.plusDays(1).atStartOfDay();
        }

        List<Booking> bookings = bookingRepository.findWithFilters(status, userId, serviceId, startDate, endDate);
        return bookings.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public BookingResponseDTO updateBooking(Long id, BookingUpdateDTO updateDTO) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        LocalDateTime newDateTime = updateDTO.getBookingDateTime();
        if (newDateTime == null || newDateTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Rescheduled booking date and time must be in the future");
        }

        // Check for conflicts with another booking (excluding current booking and cancelled bookings)
        if (!isSlotAvailableExcludingBooking(booking.getService().getId(), newDateTime, id)) {
            throw new SlotUnavailableException(
                    "Cannot reschedule: the selected time slot (" + newDateTime + ") is already booked for service '" 
                    + booking.getService().getTitle() + "'."
            );
        }

        booking.setBookingDateTime(newDateTime);
        if (updateDTO.getNotes() != null) {
            booking.setNotes(updateDTO.getNotes().trim());
        }
        booking.setUpdatedAt(LocalDateTime.now());

        Booking updated = bookingRepository.save(booking);
        return mapToResponseDTO(updated);
    }

    @Override
    public BookingResponseDTO rescheduleBooking(Long id, LocalDateTime newDateTime, String notes) {
        return updateBooking(id, new BookingUpdateDTO(newDateTime, notes));
    }

    @Override
    public BookingResponseDTO updateBookingStatus(Long id, BookingStatus newStatus) {
        if (newStatus == null) {
            throw new IllegalArgumentException("Booking status cannot be null");
        }

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        booking.setStatus(newStatus);
        booking.setUpdatedAt(LocalDateTime.now());

        Booking updated = bookingRepository.save(booking);
        return mapToResponseDTO(updated);
    }

    @Override
    public BookingResponseDTO cancelBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setUpdatedAt(LocalDateTime.now());

        Booking updated = bookingRepository.save(booking);
        return mapToResponseDTO(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isSlotAvailable(Long serviceId, LocalDateTime dateTime) {
        return !bookingRepository.existsByServiceIdAndBookingDateTimeAndStatusNot(
                serviceId,
                dateTime,
                BookingStatus.CANCELLED
        );
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isSlotAvailableExcludingBooking(Long serviceId, LocalDateTime dateTime, Long bookingId) {
        return !bookingRepository.existsConflictingBookingExcluding(
                serviceId,
                dateTime,
                bookingId
        );
    }

    private BookingResponseDTO mapToResponseDTO(Booking booking) {
        return new BookingResponseDTO(
                booking.getId(),
                booking.getUser() != null ? booking.getUser().getId() : null,
                booking.getUser() != null ? booking.getUser().getFullName() : null,
                booking.getUser() != null ? booking.getUser().getEmail() : null,
                booking.getService() != null ? booking.getService().getId() : null,
                booking.getService() != null ? booking.getService().getTitle() : null,
                booking.getService() != null ? booking.getService().getDurationMinutes() : null,
                booking.getBookingDateTime(),
                booking.getStatus(),
                booking.getNotes(),
                booking.getTotalAmount(),
                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );
    }
}
