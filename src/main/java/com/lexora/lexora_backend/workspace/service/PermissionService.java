package com.lexora.lexora_backend.workspace.service;


import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.auth.service.AuthService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final WorkspaceService workspaceService;
    private final AuthService authService;

    /**
     * Allows OWNER, ADMIN, EDITOR
     */
    public void checkEditorAccess(UUID workspaceId, UUID userId) {


        String role = workspaceService
                .getUserRole(workspaceId, userId);

        if (!role.equalsIgnoreCase("OWNER") &&
            !role.equalsIgnoreCase("ADMIN") &&
            !role.equalsIgnoreCase("EDITOR")) {

            throw new AccessDeniedException(
                    "You do not have permission. Your role: " + role);
        }
    }

    /**
     * Allows OWNER or ADMIN only
     */
    public void checkAdminAccess(UUID workspaceId) {

        UUID userId = authService.getCurrentUser().getId();

        String role = workspaceService
                .getUserRole(workspaceId, userId);

        if (!role.equalsIgnoreCase("OWNER") &&
            !role.equalsIgnoreCase("ADMIN")) {

            throw new AccessDeniedException(
                    "Only OWNER or ADMIN allowed. Your role: " + role);
        }
    }

    /**
     * Only OWNER
     */
    public void checkOwnerAccess(UUID workspaceId) {

        UUID userId = authService.getCurrentUser().getId();

        String role = workspaceService
                .getUserRole(workspaceId, userId);

        if (!role.equalsIgnoreCase("OWNER")) {

            throw new AccessDeniedException(
                    "Only OWNER allowed. Your role: " + role);
        }
    }
}
