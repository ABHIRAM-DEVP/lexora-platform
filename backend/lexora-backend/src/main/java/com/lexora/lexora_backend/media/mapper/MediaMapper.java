package com.lexora.lexora_backend.media.mapper;

import java.time.ZoneOffset;

import com.lexora.lexora_backend.media.document.MediaFile;
import com.lexora.lexora_backend.media.dto.MediaFileResponse;

public class MediaMapper {

    public static MediaFileResponse toResponse(MediaFile media) {

        MediaFileResponse response = new MediaFileResponse();

        response.setId(media.getId());
        response.setFileName(media.getFileName());
        response.setFileType(media.getFileType());
        response.setSize(media.getSize());
        response.setWorkspaceId(media.getWorkspaceId());

        // ✅ Convert LocalDateTime → Instant
        response.setCreatedAt(
            media.getCreatedAt().toInstant(ZoneOffset.UTC)
        );

            response.setDownloadUrl("/api/media/" + media.getId());


        return response;
    }
}
