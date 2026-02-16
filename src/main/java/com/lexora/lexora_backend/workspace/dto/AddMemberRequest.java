package com.lexora.lexora_backend.workspace.dto;

import java.util.UUID;

import lombok.Data;

@Data
public class AddMemberRequest {

    private UUID performedBy;
    private UUID userId;
    private String role;

    public UUID getPerformedBy() { return performedBy; }
    public UUID getUserId() { return userId; }
    public String getRole() { return role; }
}

