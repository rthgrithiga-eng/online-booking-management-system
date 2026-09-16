package com.onlinebooking.repository;

import com.onlinebooking.entity.ServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceItemRepository extends JpaRepository<ServiceItem, Long> {

    List<ServiceItem> findByIsActiveTrue();

    List<ServiceItem> findByTitleContainingIgnoreCase(String keyword);

    boolean existsByTitleIgnoreCase(String title);
}
