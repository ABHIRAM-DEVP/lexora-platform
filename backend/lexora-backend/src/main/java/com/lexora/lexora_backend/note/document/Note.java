package com.lexora.lexora_backend.note.document;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Document(collection = "notes")
@Data
public class Note {

    @Id
    private String id;          // Mongo uses String/ObjectId

    private Long noteId;        // Reference to SQL note
    private Long workspaceId;
    private Long ownerId;

    private String title;
    private String content;

    private boolean deleted;

    private Instant createdAt;
    private Instant updatedAt;
}
