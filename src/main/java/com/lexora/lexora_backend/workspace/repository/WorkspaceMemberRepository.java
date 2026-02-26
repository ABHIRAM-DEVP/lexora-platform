package com.lexora.lexora_backend.workspace.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.lexora.lexora_backend.workspace.document.WorkspaceMember;
import com.lexora.lexora_backend.workspace.enums.WorkspaceRole;

public interface WorkspaceMemberRepository
        extends MongoRepository<WorkspaceMember, UUID>{

    Optional<WorkspaceMember> findByWorkspaceIdAndUserId(
            UUID workspaceId,
            UUID userId
    );

    boolean existsByWorkspaceIdAndUserIdAndRole(
            UUID workspaceId,
            UUID userId,
            WorkspaceRole role
    );

    public void deleteByWorkspaceIdAndUserId(UUID workspaceId, UUID memberId);

    public List<WorkspaceMember> findAllByWorkspaceId(UUID workspaceId);

    public boolean existsByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);
}
