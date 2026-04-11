package com.lexora.lexora_backend.workspace.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class WorkspaceResponse {
    private UUID id;    
    private String name;
    private String description;
    private String accessType;
    private UUID ownerId;
    private boolean deleted;
    private LocalDateTime deletedAt;
}
