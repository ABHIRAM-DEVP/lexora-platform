package com.lexora.lexora_backend.publication.entity;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
@Document(collection = "publications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Publication {

    @Id
private UUID id = UUID.randomUUID();;

    private UUID noteId;
    private UUID workspaceId;
    private String title;
    private String slug;
    private String content;
    private PublicationStatus status;
    private Instant publishedAt;
    private List<String> tags;
    private UUID authorId;
    private String metaDescription;
    private Long views;
}