package com.lexora.lexora_backend.note.dto;

import java.time.Instant;
import java.util.UUID;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NoteResponse {

    private UUID id;
    private String title;
    private String content;

    private UUID workspaceId;

    private Instant createdAt;
    private Instant updatedAt;
}
