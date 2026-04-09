package com.lexora.lexora_backend.auth.service;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String userIdStr)
            throws UsernameNotFoundException {

        UUID userId;
        try {
            userId = UUID.fromString(userIdStr);
        } catch (IllegalArgumentException e) {
            throw new UsernameNotFoundException("Invalid user ID: " + userIdStr);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found with id: " + userIdStr)
                );

        return new org.springframework.security.core.userdetails.User(
                user.getId().toString(),   // JWT subject
                user.getPassword(),
                List.of(new SimpleGrantedAuthority(
                        "ROLE_" + user.getRole().name()))
        );
    }
}
