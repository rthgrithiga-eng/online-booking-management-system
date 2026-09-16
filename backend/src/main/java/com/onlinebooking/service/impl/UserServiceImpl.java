package com.onlinebooking.service.impl;

import com.onlinebooking.dto.UserRequestDTO;
import com.onlinebooking.dto.UserResponseDTO;
import com.onlinebooking.entity.User;
import com.onlinebooking.entity.UserRole;
import com.onlinebooking.exception.DuplicateResourceException;
import com.onlinebooking.exception.ResourceNotFoundException;
import com.onlinebooking.repository.UserRepository;
import com.onlinebooking.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserResponseDTO registerUser(UserRequestDTO requestDTO) {
        String normalizedEmail = requestDTO.getEmail().trim().toLowerCase();

        // 1. Check email uniqueness
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateResourceException("User", "email", normalizedEmail);
        }

        // 2. Hash password with BCryptPasswordEncoder
        String hashedPassword = passwordEncoder.encode(requestDTO.getPassword());

        // 3. Create User entity
        User user = new User();
        user.setFullName(requestDTO.getFullName().trim());
        user.setEmail(normalizedEmail);
        user.setPassword(hashedPassword);
        user.setPhone(requestDTO.getPhone() != null && !requestDTO.getPhone().trim().isEmpty()
                ? requestDTO.getPhone().trim()
                : null);
        user.setRole(requestDTO.getRole() != null ? requestDTO.getRole() : UserRole.CUSTOMER);

        User savedUser = userRepository.save(user);
        return mapToResponseDTO(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponseDTO getUserById(Long id) {
        User user = findEntityById(id);
        return mapToResponseDTO(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponseDTO getUserByEmail(String email) {
        String normalizedEmail = email != null ? email.trim().toLowerCase() : "";
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return mapToResponseDTO(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public User findEntityById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    private UserResponseDTO mapToResponseDTO(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getCreatedAt()
        );
    }
}
