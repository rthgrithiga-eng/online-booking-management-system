package com.onlinebooking.controller;

import com.onlinebooking.dto.UserRequestDTO;
import com.onlinebooking.dto.UserResponseDTO;
import com.onlinebooking.security.UserPrincipal;
import com.onlinebooking.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Register a new user (public endpoint)
     * POST /api/users
     * Returns: 201 CREATED (or 409 CONFLICT if email exists)
     */
    @PostMapping
    public ResponseEntity<UserResponseDTO> registerUser(@Valid @RequestBody UserRequestDTO requestDTO) {
        UserResponseDTO registeredUser = userService.registerUser(requestDTO);
        return new ResponseEntity<>(registeredUser, HttpStatus.CREATED);
    }

    /**
     * List all users (ADMIN only)
     * GET /api/users
     * Returns: 200 OK
     */
    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAllUsers(
            @RequestParam(name = "email", required = false) String email
    ) {
        if (email != null && !email.trim().isEmpty()) {
            UserResponseDTO user = userService.getUserByEmail(email);
            return ResponseEntity.ok(List.of(user));
        }
        List<UserResponseDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    /**
     * Get user by ID (ADMIN or profile owner)
     * GET /api/users/{id}
     * Returns: 200 OK or 404 NOT FOUND
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!isAdmin && !id.equals(principal.getId())) {
                throw new AccessDeniedException("Access denied: You can only view your own user profile");
            }
        }
        UserResponseDTO user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }
}
