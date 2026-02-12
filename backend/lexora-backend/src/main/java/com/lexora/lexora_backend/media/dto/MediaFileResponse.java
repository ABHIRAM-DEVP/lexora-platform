package com.lexora.lexora_backend.media.dto;

import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
public class MediaFileResponse {

    private String id;
    private String fileName;
    private String fileType;

    // ✅ ADD THIS
    private long size;
    private UUID workspaceId;
    private Instant createdAt;
    private String downloadUrl;
    private String description; // ✅ include in response

}
