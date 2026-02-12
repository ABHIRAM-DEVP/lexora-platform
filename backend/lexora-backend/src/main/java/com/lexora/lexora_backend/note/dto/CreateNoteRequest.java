package com.lexora.lexora_backend.note.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateNoteRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String content;

    @NotNull
    private UUID workspaceId;
}

