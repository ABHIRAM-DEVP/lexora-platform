package com.lexora.lexora_backend.user.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.user.dto.UserSearchResult;
import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.user.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found with username/email: " + username
                        )
                );
    }

    public User getById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found with id: " + userId)
                );
    }

    public List<UserSearchResult> searchUsers(String query, UUID workspaceId) {
        String searchPattern = "%" + query + "%";
        
        List<User> users = userRepository.findByEmailContainingIgnoreCaseOrUsernameContainingIgnoreCase(
                searchPattern, searchPattern);
        
        return users.stream()
                .map(user -> UserSearchResult.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .username(user.getUsername())
                        .build())
                .collect(Collectors.toList());
    }

    public UserSearchResult findByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .map(user -> UserSearchResult.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .username(user.getUsername())
                        .build())
                .orElse(null);
    }

}
