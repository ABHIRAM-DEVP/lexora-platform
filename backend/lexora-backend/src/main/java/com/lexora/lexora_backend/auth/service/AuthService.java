package com.lexora.lexora_backend.auth.service;

import java.time.Instant;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lexora.lexora_backend.auth.dto.LoginRequest;
import com.lexora.lexora_backend.auth.dto.LoginResponse;
import com.lexora.lexora_backend.auth.dto.SignupRequest;
import com.lexora.lexora_backend.auth.jwt.JwtUtil;
import com.lexora.lexora_backend.common.exception.ForbiddenException;
import com.lexora.lexora_backend.user.entity.RefreshToken;
import com.lexora.lexora_backend.user.entity.Role;
import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.user.repository.RefreshTokenRepository;
import com.lexora.lexora_backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // REGISTER
    public void registerUser(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.USER);

        userRepository.save(user);
    }

    // LOGIN
    public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        String accessToken = jwtUtil.generateToken(user);
        String refreshToken = UUID.randomUUID().toString();

        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setToken(refreshToken);
        token.setExpiryDate(Instant.now().plusSeconds(7 * 24 * 60 * 60));

        refreshTokenRepository.save(token);

        return new LoginResponse(accessToken, refreshToken, "Login successful");
    }

    // REFRESH TOKEN
    public LoginResponse refreshAccessToken(String refreshToken) {

        RefreshToken token = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));

        if (token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token expired");
        }

        User user = token.getUser();

        String newAccessToken = jwtUtil.generateToken(user);
        String newRefreshToken = UUID.randomUUID().toString();

        token.setToken(newRefreshToken);
        token.setExpiryDate(Instant.now().plusSeconds(7 * 24 * 60 * 60));
        refreshTokenRepository.save(token);

        return new LoginResponse(newAccessToken, newRefreshToken, "Token refreshed");
    }

    // LOGOUT
    @Transactional
    public void logout(User user) {
        refreshTokenRepository.deleteByUser(user);
    }
    //promote to admin
    public void promoteToAdmin(String email){
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if(user.getRole() ==Role.ADMIN){
            throw new RuntimeException("User is already an admin");
        }

        user.setRole(Role.ADMIN);
        userRepository.save(user);
    }


    public String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ForbiddenException("User is not authenticated");
        }
        return authentication.getName(); // JWT subject = userId as string
    }


    // AuthService.java
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("No authenticated user found");
        }

        String userIdStr = authentication.getName(); // Assuming userId is stored as subject
        if (userIdStr == null || userIdStr.isBlank()) {
            throw new RuntimeException("JWT does not contain user ID");
        }

        UUID userId;
        try {
            userId = UUID.fromString(userIdStr);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid user ID in JWT");
        }

        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

    }




    
}