package com.lexora.lexora_backend.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class WorkspaceResponse {

    @NotBlank
    private String name;

    @Size(max=255)
    private String description;

    private String id;      // optional
    private String ownerId; // optional
}

