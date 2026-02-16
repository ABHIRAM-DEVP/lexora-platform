package com.lexora.lexora_backend.media.mapper;

import java.util.stream.Collectors;

import com.lexora.lexora_backend.media.document.MediaFile;
import com.lexora.lexora_backend.media.dto.MediaResponse;

public class MediaMapper {

    // Convert MediaFile → MediaResponse DTO
    public static MediaResponse toResponse(MediaFile file) {
        if (file == null) return null;

        return MediaResponse.builder()
                .id(file.getId())
                .fileName(file.getFileName())
                .fileType(file.getFileType())
                .workspaceId(file.getWorkspaceId())
                .ownerId(file.getOwnerId())
                .size(file.getSize())
                .description(file.getDescription())
                .tags(file.getTags() != null ? file.getTags().stream().collect(Collectors.toList()) : null)
                .createdAt(file.getCreatedAt() != null ? file.getCreatedAt().toString() : null)
                .updatedAt(file.getUpdatedAt() != null ? file.getUpdatedAt().toString() : null)
                .deleted(file.isDeleted())
                .build();
    }
}
