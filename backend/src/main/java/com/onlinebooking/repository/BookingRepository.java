package com.onlinebooking.repository;

import com.onlinebooking.entity.Booking;
import com.onlinebooking.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Find bookings by user
    List<Booking> findByUserId(Long userId);

    List<Booking> findByUserIdOrderByBookingDateTimeDesc(Long userId);

    // Find bookings by status
    List<Booking> findByStatus(BookingStatus status);

    List<Booking> findByUserIdAndStatus(Long userId, BookingStatus status);

    List<Booking> findByServiceId(Long serviceId);

    // Check whether a service / time slot is already booked (excluding cancelled ones)
    boolean existsByServiceIdAndBookingDateTimeAndStatusNot(
            Long serviceId,
            LocalDateTime bookingDateTime,
            BookingStatus excludedStatus
    );

    // Check slot availability against active reservation statuses (e.g. PENDING, CONFIRMED)
    boolean existsByServiceIdAndBookingDateTimeAndStatusIn(
            Long serviceId,
            LocalDateTime bookingDateTime,
            Collection<BookingStatus> activeStatuses
    );

    // Find bookings for a specific service and time slot
    List<Booking> findByServiceIdAndBookingDateTime(Long serviceId, LocalDateTime bookingDateTime);

    // Range queries for calendar views & conflict checking
    List<Booking> findByServiceIdAndBookingDateTimeBetween(
            Long serviceId,
            LocalDateTime start,
            LocalDateTime end
    );

    @Query("SELECT b FROM Booking b WHERE b.service.id = :serviceId AND b.bookingDateTime = :dateTime AND b.status <> 'CANCELLED'")
    List<Booking> findActiveConflictingBookings(
            @Param("serviceId") Long serviceId,
            @Param("dateTime") LocalDateTime dateTime
    );

    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.service.id = :serviceId AND b.bookingDateTime = :dateTime AND b.status <> 'CANCELLED' AND b.id <> :excludeId")
    boolean existsConflictingBookingExcluding(
            @Param("serviceId") Long serviceId,
            @Param("dateTime") LocalDateTime dateTime,
            @Param("excludeId") Long excludeId
    );

    @Query("SELECT b FROM Booking b WHERE " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:userId IS NULL OR b.user.id = :userId) AND " +
           "(:serviceId IS NULL OR b.service.id = :serviceId) AND " +
           "(:startDate IS NULL OR b.bookingDateTime >= :startDate) AND " +
           "(:endDate IS NULL OR b.bookingDateTime < :endDate) " +
           "ORDER BY b.bookingDateTime DESC")
    List<Booking> findWithFilters(
            @Param("status") BookingStatus status,
            @Param("userId") Long userId,
            @Param("serviceId") Long serviceId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
