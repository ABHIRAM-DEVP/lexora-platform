package com.lexora.lexora_backend.note.dto;

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
    private Long workspaceId;
}

