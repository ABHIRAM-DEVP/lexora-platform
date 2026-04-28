package com.lexora.lexora_backend.note.dto;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private UUID id;
    private String title;
    private String content;
    private UUID workspaceId;
    private UUID ownerId;
    private UUID updatedById;
    private String updatedByName;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant createdAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant updatedAt;

    private boolean deleted;
}
