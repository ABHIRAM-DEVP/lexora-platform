package com.lexora.lexora_backend.workspace.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChangeRoleRequest {
    private UUID userId;
    private String role;  // ADMIN / MEMBER
    // getters & setters
}
