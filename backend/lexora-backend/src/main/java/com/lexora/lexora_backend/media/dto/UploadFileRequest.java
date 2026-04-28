package com.lexora.lexora_backend.media.dto;

import java.util.UUID;

import lombok.Data;

@Data
public class UploadFileRequest {

    private UUID workspaceId;

    public UUID getWorkspaceId() {
        return workspaceId;
    }

    public void setWorkspaceId(UUID workspaceId) {
        this.workspaceId = workspaceId;
    }
}
