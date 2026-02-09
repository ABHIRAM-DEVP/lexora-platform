package com.lexora.lexora_backend.user.service;

import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Fetch User entity using username/email from JWT
     */
    public User getByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found with username/email: " + username
                        )
                );
    }

    /**
     * Fetch User entity by ID (long)
     */
    public User getById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found with id: " + userId)
                );
    }
}
