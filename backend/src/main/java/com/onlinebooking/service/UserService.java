package com.onlinebooking.service;

import com.onlinebooking.dto.UserRequestDTO;
import com.onlinebooking.dto.UserResponseDTO;
import com.onlinebooking.entity.User;

import java.util.List;

public interface UserService {

    UserResponseDTO registerUser(UserRequestDTO requestDTO);

    UserResponseDTO getUserById(Long id);

    UserResponseDTO getUserByEmail(String email);

    List<UserResponseDTO> getAllUsers();

    User findEntityById(Long id);
}
