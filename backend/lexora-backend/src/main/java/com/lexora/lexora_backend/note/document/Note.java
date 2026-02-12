package com.lexora.lexora_backend.note.document;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Document(collection = "notes")
@Data
public class Note {

    @Id
    private UUID id;          // UUID for consistency

    private UUID noteId;        // Reference to SQL note
    private UUID workspaceId;
    private UUID ownerId;

    private String title;
    private String content;

    private boolean deleted;

    private Instant createdAt;
    private Instant updatedAt;
}
