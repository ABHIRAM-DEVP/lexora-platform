package com.lexora.lexora_backend.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateWorkspaceRequest {
    @NotBlank
    private String name;

    @Size(max = 255)
    private String description;

    @NotBlank
    private String accessType; // PUBLIC, PRIVATE, COLLABORATIVE
}
