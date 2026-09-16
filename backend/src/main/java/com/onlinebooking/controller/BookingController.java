package com.onlinebooking.controller;

import com.onlinebooking.dto.BookingRequestDTO;
import com.onlinebooking.dto.BookingResponseDTO;
import com.onlinebooking.dto.BookingStatusUpdateDTO;
import com.onlinebooking.dto.BookingUpdateDTO;
import com.onlinebooking.entity.BookingStatus;
import com.onlinebooking.security.UserPrincipal;
import com.onlinebooking.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    private UserPrincipal getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return principal;
        }
        return null;
    }

    private boolean isCurrentUserAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    /**
     * 1. Create a new booking (requires authenticated user; customers book for themselves)
     * POST /api/bookings
     * Returns: 201 CREATED or 409 CONFLICT if slot unavailable
     */
    @PostMapping
    public ResponseEntity<BookingResponseDTO> createBooking(@Valid @RequestBody BookingRequestDTO requestDTO) {
        UserPrincipal user = getCurrentUser();
        if (user != null && !isCurrentUserAdmin()) {
            if (requestDTO.getUserId() != null && !requestDTO.getUserId().equals(user.getId())) {
                throw new AccessDeniedException("Access denied: You can only create bookings for your own account");
            }
            requestDTO.setUserId(user.getId());
        }
        BookingResponseDTO created = bookingService.createBooking(requestDTO);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /**
     * 2. & 7. Get bookings:
     * - Admins can view all bookings across all users.
     * - Customers can only view their own bookings.
     * GET /api/bookings
     * Returns: 200 OK
     */
    @GetMapping
    public ResponseEntity<List<BookingResponseDTO>> getAllBookings(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "userId", required = false) Long userId,
            @RequestParam(name = "serviceId", required = false) Long serviceId,
            @RequestParam(name = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        UserPrincipal user = getCurrentUser();
        boolean isAdmin = isCurrentUserAdmin();

        // Enforce role restriction: non-admins can only see their own bookings
        if (!isAdmin) {
            if (userId != null && user != null && !userId.equals(user.getId())) {
                throw new AccessDeniedException("Access denied: Viewing all bookings across users requires ADMIN role");
            }
            if (user != null) {
                userId = user.getId();
            }
        }

        BookingStatus statusEnum = null;
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            try {
                statusEnum = BookingStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException(
                        "Invalid status: '" + status + "'. Allowed values are: PENDING, CONFIRMED, CANCELLED, COMPLETED"
                );
            }
        }

        List<BookingResponseDTO> bookings = bookingService.getBookingsWithFilters(statusEnum, userId, serviceId, date);
        return ResponseEntity.ok(bookings);
    }

    /**
     * 3. Get booking by ID (admins or the booking owner)
     * GET /api/bookings/{id}
     * Returns: 200 OK or 404 NOT FOUND
     */
    @GetMapping("/{id}")
    public ResponseEntity<BookingResponseDTO> getBookingById(@PathVariable Long id) {
        BookingResponseDTO booking = bookingService.getBookingById(id);
        UserPrincipal user = getCurrentUser();
        if (!isCurrentUserAdmin() && user != null && !booking.getUserId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied: You can only view your own booking details");
        }
        return ResponseEntity.ok(booking);
    }

    /**
     * 4. Update / Reschedule booking (admins or the booking owner)
     * PUT /api/bookings/{id}
     * Returns: 200 OK or 409 CONFLICT or 404 NOT FOUND
     */
    @PutMapping("/{id}")
    public ResponseEntity<BookingResponseDTO> updateBooking(
            @PathVariable Long id,
            @Valid @RequestBody BookingUpdateDTO updateDTO
    ) {
        BookingResponseDTO existing = bookingService.getBookingById(id);
        UserPrincipal user = getCurrentUser();
        if (!isCurrentUserAdmin() && user != null && !existing.getUserId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied: You can only update your own bookings");
        }
        BookingResponseDTO updated = bookingService.updateBooking(id, updateDTO);
        return ResponseEntity.ok(updated);
    }

    /**
     * 5. Change booking status (ADMIN only)
     * PATCH /api/bookings/{id}/status
     * Returns: 200 OK or 400 BAD REQUEST or 404 NOT FOUND
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<BookingResponseDTO> changeBookingStatus(
            @PathVariable Long id,
            @Valid @RequestBody BookingStatusUpdateDTO statusDTO
    ) {
        if (!isCurrentUserAdmin()) {
            throw new AccessDeniedException("Access denied: Only administrators can update booking status");
        }

        BookingStatus newStatus;
        try {
            newStatus = BookingStatus.valueOf(statusDTO.getStatus().trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid status: '" + statusDTO.getStatus() + "'. Allowed values are: PENDING, CONFIRMED, CANCELLED, COMPLETED"
            );
        }

        BookingResponseDTO updated = bookingService.updateBookingStatus(id, newStatus);
        return ResponseEntity.ok(updated);
    }

    /**
     * 6. Cancel booking (admins or the booking owner)
     * DELETE /api/bookings/{id}
     * Returns: 200 OK or 404 NOT FOUND
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> cancelBooking(@PathVariable Long id) {
        BookingResponseDTO existing = bookingService.getBookingById(id);
        UserPrincipal user = getCurrentUser();
        if (!isCurrentUserAdmin() && user != null && !existing.getUserId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied: You can only cancel your own bookings");
        }
        BookingResponseDTO cancelled = bookingService.cancelBooking(id);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Booking cancelled successfully");
        response.put("id", cancelled.getId());
        response.put("status", cancelled.getStatus());
        response.put("booking", cancelled);

        return ResponseEntity.ok(response);
    }
}
