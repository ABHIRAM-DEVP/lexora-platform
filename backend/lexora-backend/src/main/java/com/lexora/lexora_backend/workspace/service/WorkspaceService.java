package com.lexora.lexora_backend.workspace.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.common.exception.AccessDeniedException;
import com.lexora.lexora_backend.common.exception.ResourceNotFoundException;
import com.lexora.lexora_backend.user.entity.Role;
import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.workspace.entity.Workspace;
import com.lexora.lexora_backend.workspace.repository.WorkspaceRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;

    /**
     * Create a new workspace for a user
     * @param user owner of the workspace
     * @param name workspace name (non-null, non-blank)
     * @param description optional workspace description
     * @return saved Workspace
     */
    // public Workspace createWorkspace(User user, String name, String description) {
    //     if (name == null || name.isBlank()) {
    //         log.warn("Attempted to create workspace with empty name by user: {}", user.getId());
    //         throw new IllegalArgumentException("Workspace name cannot be empty");
    //     }

    //     Workspace workspace = new Workspace();
    //     workspace.setName(name);
    //     workspace.setDescription(description);
    //     workspace.setOwner(user);

    //     Workspace savedWorkspace = workspaceRepository.save(workspace);
    //     log.info("Workspace created: {} by user {}", savedWorkspace.getId(), user.getId());

    //     return savedWorkspace;
    // }

    /**
     * Get all workspaces for a user
     * @param user owner
     * @return list of active workspaces (ADMIN: all active)
     */
    public List<Workspace> getWorkspacesForUser(User user) {
        List<Workspace> workspaces;

        if (user.getRole() == Role.ADMIN) {
            workspaces = workspaceRepository.findByDeletedFalse();
            log.info("ADMIN user {} fetched all active workspaces: {}", user.getId(), workspaces.size());
        } else {
            workspaces = workspaceRepository.findByOwnerAndDeletedFalse(user);
            log.info("USER {} fetched {} active workspaces", user.getId(), workspaces.size());
        }

        return workspaces;
    }

    /**
     * Get workspace by UUID, verifying ownership or ADMIN access
     * @param user owner
     * @param workspaceId UUID of workspace
     * @return workspace
     */
    public Workspace getWorkspaceById(User user, UUID workspaceId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> {
                    log.warn("Workspace not found: {}", workspaceId);
                    return new IllegalArgumentException("Workspace not found");
                });

        if (!workspace.getOwner().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            log.warn("Access denied for user {} to workspace {}", user.getId(), workspaceId);
            throw new SecurityException("Access denied to this workspace");
        }

        log.info("Workspace {} accessed by user {}", workspaceId, user.getId());
        return workspace;
    }

    /**
     * Soft delete workspace
     */
    public void softDeleteWorkspace(User user, UUID workspaceId) {
        Workspace workspace = getWorkspaceById(user, workspaceId);

        if (workspace.isDeleted()) {
            log.warn("Workspace {} already deleted, user {}", workspaceId, user.getId());
            throw new IllegalStateException("Workspace already deleted");
        }

        workspace.setDeleted(true);
        workspaceRepository.save(workspace);
        log.info("Workspace {} soft deleted by user {}", workspaceId, user.getId());
    }

    /**
     * Restore deleted workspace
     */
    public void restoreWorkspace(User user, UUID workspaceId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> {
                    log.warn("Workspace not found for restore: {}", workspaceId);
                    return new IllegalArgumentException("Workspace not found");
                });

        if (!workspace.getOwner().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            log.warn("Access denied for user {} to restore workspace {}", user.getId(), workspaceId);
            throw new SecurityException("Access denied to restore this workspace");
        }

        if (!workspace.isDeleted()) {
            log.warn("Workspace {} is not deleted, cannot restore", workspaceId);
            throw new IllegalStateException("Workspace is not deleted");
        }

        workspace.setDeleted(false);
        workspaceRepository.save(workspace);
        log.info("Workspace {} restored by user {}", workspaceId, user.getId());
    }

    /**
     * List deleted workspaces
     */
    public List<Workspace> getDeletedWorkspaces(User user) {
        List<Workspace> deleted;

        if (user.getRole() == Role.ADMIN) {
            deleted = workspaceRepository.findByDeletedTrue();
            log.info("ADMIN {} fetched all deleted workspaces: {}", user.getId(), deleted.size());
        } else {
            deleted = workspaceRepository.findByOwnerAndDeletedTrue(user);
            log.info("USER {} fetched {} deleted workspaces", user.getId(), deleted.size());
        }

        return deleted;
    }

    public void addMember(UUID workspaceId, UUID currentUserId, UUID userIdToAdd, String role) {

    // 1️⃣ Fetch workspace
    Workspace workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow(() -> new ResourceNotFoundException(
                    "Workspace not found. Please check the workspaceId: " + workspaceId));

    // 2️⃣ Check currentUserId role — must be OWNER or ADMIN
    Map<UUID, String> members = workspace.getMembers();
    if (members == null || members.isEmpty()) {
        throw new AccessDeniedException(
                "Workspace has no members. Only OWNER or ADMIN can add new members.");
    }

    String currentUserRole = members.get(currentUserId);
    if (currentUserRole == null) {
        throw new AccessDeniedException(
                "You are not a member of this workspace. Access denied.");
    }

    if (!currentUserRole.equalsIgnoreCase("OWNER") && !currentUserRole.equalsIgnoreCase("ADMIN")) {
        throw new AccessDeniedException(
                "Only users with role OWNER or ADMIN can add new members. Your role: " + currentUserRole);
    }

    // 3️⃣ Prevent adding duplicates
    if (members.containsKey(userIdToAdd)) {
        throw new IllegalArgumentException(
                "User with ID " + userIdToAdd + " is already a member of this workspace.");
    }

    // 4️⃣ Add new member
    members.put(userIdToAdd, role.toUpperCase());
    workspaceRepository.save(workspace);
}

public Workspace createWorkspace(User owner, String name, String description) {

    Workspace ws = new Workspace();
    ws.setName(name);
    ws.setDescription(description);
    ws.setOwner(owner);
    ws.setDeleted(false);

    // 🔹 Initialize members map
    Map<UUID, String> members = new HashMap<>();
    members.put(owner.getId(), "OWNER"); // Owner is automatically OWNER
    ws.setMembers(members);

    return workspaceRepository.save(ws);
}

public Map<UUID, String> getWorkspaceMembers(UUID workspaceId, UUID requesterId) {
    // 1️⃣ Fetch workspace
    Workspace workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

    // 2️⃣ Check if requester has permission
    String requesterRole = workspace.getMembers().get(requesterId);
    if (requesterRole == null || 
        (!requesterRole.equals("OWNER") && !requesterRole.equals("ADMIN"))) {
        throw new AccessDeniedException("Only OWNER or ADMIN can view workspace members");
    }

    // 3️⃣ Return a copy of members map
    return new HashMap<>(workspace.getMembers());
}

}
