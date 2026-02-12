package com.lexora.lexora_backend.workspace.document;

import java.util.UUID;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.lexora.lexora_backend.workspace.enums.WorkspaceRole;

import lombok.Data;

@Data
@Document(collection = "workspace_members")
public class WorkspaceMember {

    @Id
    private String id;

    private UUID workspaceId;   // ✅ Fixed (was String)

    private UUID userId;

    private WorkspaceRole role;
}
