package com.lexora.lexora_backend.workspace.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceMemberSummary {
    private UUID id;
    private String username;
    private String email;
    private String role;
    private boolean owner;
}
