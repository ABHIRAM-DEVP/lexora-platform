package com.lexora.lexora_backend.media.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UploadFileResponse {
    private String message;
    private String fileId;
    private String fileName;
    private UUID workspaceId;
}
