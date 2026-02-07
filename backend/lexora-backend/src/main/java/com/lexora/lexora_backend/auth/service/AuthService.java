package com.lexora.lexora_backend.auth.service;

import java.time.Instant;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.auth.dto.LoginRequest;
import com.lexora.lexora_backend.auth.dto.LoginResponse;
import com.lexora.lexora_backend.auth.dto.SignupRequest;
import com.lexora.lexora_backend.auth.jwt.JwtUtil;
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
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    
    

    public void registerUser(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User user = new User();
         user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.USER); // ✅ works
        userRepository.save(user);
    }



    public LoginResponse login(LoginRequest request) {
    User user = userRepository.findByUsername(request.getUsername())
        .orElseThrow(() -> new RuntimeException("User not found"));

    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
        throw new RuntimeException("Invalid password");
    }

    // Generate access token (JWT)
    String accessToken = jwtUtil.generateToken(user);

    // Generate refresh token (random UUID or JWT)
    String refreshToken = UUID.randomUUID().toString();

    // Save refresh token in DB
    RefreshToken tokenEntity = new RefreshToken();
    tokenEntity.setUser(user);
    tokenEntity.setToken(refreshToken);
    tokenEntity.setExpiryDate(Instant.now().plusSeconds(60*60*24*7)); // 7 days
    refreshTokenRepository.save(tokenEntity);

    return new LoginResponse(accessToken, refreshToken, "User logged in successfully 🏛️");
}


    
    public LoginResponse refreshAccessToken(String refreshToken) {
    RefreshToken tokenEntity = refreshTokenRepository.findByToken(refreshToken)
            .orElseThrow(() -> new RuntimeException("Refresh token not found"));

    // Check if expired
    if (tokenEntity.getExpiryDate().isBefore(Instant.now())) {
        refreshTokenRepository.delete(tokenEntity); // clean up expired token
        throw new RuntimeException("Refresh token expired, please login again");
    }

    User user = tokenEntity.getUser();
    if (user == null) {
        throw new RuntimeException("User not found");
    }

    // Generate new access token
    String newAccessToken = jwtUtil.generateToken(user);

    // Optional: rotate refresh token (more secure)
    String newRefreshToken = UUID.randomUUID().toString();
    tokenEntity.setToken(newRefreshToken);
    tokenEntity.setExpiryDate(Instant.now().plusSeconds(60*60*24*7)); // 7 days
    refreshTokenRepository.save(tokenEntity);

    return new LoginResponse(newAccessToken, newRefreshToken, "Token refreshed successfully 🔄");
}

public void logout(User user) {
    refreshTokenRepository.deleteByUser(user);
}



    public void promoteToAdmin(String email){
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if(user.getRole() ==Role.ADMIN){
            throw new RuntimeException("User is already an admin");
        }

        user.setRole(Role.ADMIN);
        userRepository.save(user);
    }


    
}

