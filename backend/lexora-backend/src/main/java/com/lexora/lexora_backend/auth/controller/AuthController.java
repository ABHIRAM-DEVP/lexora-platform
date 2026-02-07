package com.lexora.lexora_backend.auth.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lexora.lexora_backend.auth.dto.LoginRequest;
import com.lexora.lexora_backend.auth.dto.LoginResponse;
import com.lexora.lexora_backend.auth.dto.LogoutRequest;
import com.lexora.lexora_backend.auth.dto.RefreshTokenRequest;
import com.lexora.lexora_backend.auth.dto.SignupRequest;
import com.lexora.lexora_backend.auth.service.AuthService;
import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.user.repository.UserRepository;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService; //Constructor-based Dependency Injection

    @Autowired
    private UserRepository userRepository;

    

    
    @PostMapping("/signup")
public ResponseEntity<String> signup(@Valid @RequestBody SignupRequest signupRequest) {
    try {
        authService.registerUser(signupRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body("User registered successfully 🎉");
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Failed to register user: " + e.getMessage());
    }
}


    @PostMapping("/login")
public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
    try {
        LoginResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    } catch (RuntimeException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new LoginResponse(null, null, e.getMessage()));
    }
}


    @PostMapping("/refresh-token")
public ResponseEntity<?> refresh(@RequestBody RefreshTokenRequest request) {
    try {
        LoginResponse response = authService.refreshAccessToken(request.getRefreshToken());
        return ResponseEntity.ok(response);
    } catch (RuntimeException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", e.getMessage()));
    }
}



    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestBody LogoutRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        authService.logout(user);
        return ResponseEntity.ok("Logged out successfully");
    }


    




}
