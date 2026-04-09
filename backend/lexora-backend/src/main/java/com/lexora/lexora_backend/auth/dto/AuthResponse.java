package com.lexora.lexora_backend.auth.dto;


import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AuthResponse - returned after successful login or token refresh
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;    // JWT token
    private String tokenType = "Bearer"; // Optional, default to Bearer
    private String refreshToken;   // Optional, if you implement refresh tokens
    private UUID userId;         // ID of logged-in user
    private String email;          // User email
    private String role;           // User role (OWNER, ADMIN, EDITOR, etc.)
}