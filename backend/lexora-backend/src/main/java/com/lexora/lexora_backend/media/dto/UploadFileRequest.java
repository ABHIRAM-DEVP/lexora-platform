package com.lexora.lexora_backend.media.dto;

import lombok.Data;
import java.util.UUID;
import jakarta.validation.constraints.NotNull;

@Data
public class UploadFileRequest {

    @NotNull(message = "workspaceId is required") // ✅ Validation for workspaceId
    private UUID workspaceId;

    public UUID getWorkspaceId() {
        return workspaceId;
    }

    public void setWorkspaceId(UUID workspaceId) {
        this.workspaceId = workspaceId;
    }
}
