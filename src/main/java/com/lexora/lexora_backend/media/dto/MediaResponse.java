package com.lexora.lexora_backend.media.dto;

import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class MediaResponse {
    private String id;
    private String fileName;
    private String fileType;
    private UUID workspaceId;
    private UUID ownerId;
    private long size;
    private String description;
    private List<String> tags;
    private String createdAt;
    private String updatedAt;
    private boolean deleted;
}
