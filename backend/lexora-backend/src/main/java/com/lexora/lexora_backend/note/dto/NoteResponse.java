package com.lexora.lexora_backend.note.dto;

import java.time.Instant;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NoteResponse {

    private Long id;
    private String title;
    private String content;

    private Long workspaceId;

    private Instant createdAt;
    private Instant updatedAt;
}
