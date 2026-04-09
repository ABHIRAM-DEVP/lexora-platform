package com.lexora.lexora_backend.workspace.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class WorkspaceDTO {

    private UUID id;
    private String name;
    private UUID ownerId;

    // constructors
    // getters
}
