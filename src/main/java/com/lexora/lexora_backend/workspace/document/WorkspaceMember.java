package com.lexora.lexora_backend.workspace.document;

import java.util.List;
import java.util.UUID;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import com.lexora.lexora_backend.workspace.entity.Workspace;
import com.lexora.lexora_backend.workspace.enums.WorkspaceRole;

import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "workspace_members")
@CompoundIndex(name = "workspace_user_idx", def = "{'workspaceId': 1, 'userId': 1}")
public class WorkspaceMember {

    @Id
    private UUID id;

    private UUID workspaceId;   // ✅ Fixed (was String)

    private UUID userId;

    private WorkspaceRole role;
// @JoinColumn(name = "workspace_id", nullable = false)
// private Workspace workspace;



    
    
   
    
}
