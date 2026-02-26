package com.lexora.lexora_backend.comment.document;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Document(collection = "comments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {

    @Id
    private String id;

    private UUID noteId;
    private UUID workspaceId;
    private UUID userId;

    private String content;

    private Instant createdAt;
    private Instant updatedAt;

    private boolean isDeleted;
}
