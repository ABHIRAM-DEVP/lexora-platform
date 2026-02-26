package com.lexora.lexora_backend.workspace.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.common.exception.AccessDeniedException;
import com.lexora.lexora_backend.workspace.document.WorkspaceMember;
import com.lexora.lexora_backend.workspace.enums.WorkspaceRole;
import com.lexora.lexora_backend.workspace.repository.WorkspaceMemberRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WorkspaceMemberService {

    private final WorkspaceMemberRepository repository;

    public void validateMembership(UUID workspaceId, UUID userId) {

        boolean exists = repository
            .existsByWorkspaceIdAndUserId(workspaceId, userId);

        if (!exists) {
            throw new AccessDeniedException("User not part of workspace");
        }
    }

    public boolean isOwner(UUID workspaceId, UUID userId) {

        return repository
            .findByWorkspaceIdAndUserId(workspaceId, userId)
            .map(member -> member.getRole() == WorkspaceRole.OWNER)
            .orElse(false);
    }

    public void validateEditPermission(UUID workspaceId, UUID userId) {

        WorkspaceMember member = repository
            .findByWorkspaceIdAndUserId(workspaceId, userId)
            .orElseThrow(() -> new AccessDeniedException("Not a member"));

        if (member.getRole() == WorkspaceRole.VIEWER) {
            throw new AccessDeniedException("No edit permission");
        }
    }
}

