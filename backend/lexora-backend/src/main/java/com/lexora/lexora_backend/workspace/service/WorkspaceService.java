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
import com.lexora.lexora_backend.workspace.repository.WorkspaceMemberRepository;
import com.lexora.lexora_backend.workspace.repository.WorkspaceRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;


    /* ============================================================
       CREATE WORKSPACE
       ============================================================ */
    public Workspace createWorkspace(User owner, String name, String description) {

        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Workspace name cannot be empty");
        }

        Workspace ws = new Workspace();
        ws.setName(name);
        ws.setDescription(description);
        ws.setOwner(owner);
        ws.setDeleted(false);

        // Initialize members map
        Map<UUID, String> members = new HashMap<>();
        members.put(owner.getId(), "OWNER");
        ws.setMembers(members);

        Workspace saved = workspaceRepository.save(ws);

        log.info("Workspace {} created by user {}", saved.getId(), owner.getId());
        return saved;
    }

    /* ============================================================
       GET ACTIVE WORKSPACES
       ============================================================ */
    public List<Workspace> getWorkspacesForUser(User user) {

        if (user.getRole() == Role.ADMIN) {
            return workspaceRepository.findByDeletedFalse();
        }

        return workspaceRepository.findByOwnerAndDeletedFalse(user);
    }

    /* ============================================================
       GET WORKSPACE BY ID
       ============================================================ */
    public Workspace getWorkspaceById(User user, UUID workspaceId) {

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Workspace not found"));

        // Global ADMIN can access everything
        if (user.getRole() == Role.ADMIN) {
            return workspace;
        }

        Map<UUID, String> members = workspace.getMembers();

        if (members == null || !members.containsKey(user.getId())) {
            throw new AccessDeniedException("Access denied to this workspace");
        }

        return workspace;
    }

    /* ============================================================
       SOFT DELETE (OWNER or ADMIN)
       ============================================================ */
    public void softDeleteWorkspace(User user, UUID workspaceId) {

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Workspace not found"));

        validateOwnerOrAdmin(workspace, user.getId());

        if (workspace.isDeleted()) {
            throw new IllegalStateException("Workspace already deleted");
        }

        workspace.setDeleted(true);
        workspaceRepository.save(workspace);

        log.info("Workspace {} soft deleted by user {}", workspaceId, user.getId());
    }

    /* ============================================================
       RESTORE WORKSPACE (OWNER ONLY)
       ============================================================ */
    public void restoreWorkspace(User user, UUID workspaceId) {

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Workspace not found"));

        validateOwner(workspace, user.getId());

        if (!workspace.isDeleted()) {
            throw new IllegalStateException("Workspace is not deleted");
        }

        workspace.setDeleted(false);
        workspaceRepository.save(workspace);

        log.info("Workspace {} restored by user {}", workspaceId, user.getId());
    }

    /* ============================================================
       LIST DELETED WORKSPACES
       ============================================================ */
    public List<Workspace> getDeletedWorkspaces(User user) {

        if (user.getRole() == Role.ADMIN) {
            return workspaceRepository.findByDeletedTrue();
        }

        return workspaceRepository.findByOwnerAndDeletedTrue(user);
    }

    /* ============================================================
       ADD MEMBER (OWNER or ADMIN)
       ============================================================ */
    public void addMember(UUID workspaceId,
                          UUID currentUserId,
                          UUID userIdToAdd,
                          String role) {

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Workspace not found"));

        validateOwnerOrAdmin(workspace, currentUserId);

        Map<UUID, String> members = workspace.getMembers();

        if (members.containsKey(userIdToAdd)) {
            throw new IllegalArgumentException(
                    "User is already a member of this workspace.");
        }

        members.put(userIdToAdd, role.toUpperCase());
        workspaceRepository.save(workspace);

        log.info("User {} added to workspace {} as {}",
                userIdToAdd, workspaceId, role);
    }

    /* ============================================================
       GET WORKSPACE MEMBERS (OWNER or ADMIN)
       ============================================================ */
    public Map<UUID, String> getWorkspaceMembers(UUID workspaceId,
                                                 UUID requesterId) {

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Workspace not found"));

        validateOwnerOrAdmin(workspace, requesterId);

        return new HashMap<>(workspace.getMembers());
    }

    /* ============================================================
       GET USER ROLE INSIDE WORKSPACE
       ============================================================ */
    public String getUserRole(UUID workspaceId, UUID userId) {

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Workspace not found"));

        Map<UUID, String> members = workspace.getMembers();

        if (members == null || !members.containsKey(userId)) {
            throw new AccessDeniedException(
                    "You are not a member of this workspace.");
        }

        return members.get(userId);
    }

    /* ============================================================
       ROLE VALIDATION HELPERS
       ============================================================ */

    private void validateOwnerOrAdmin(Workspace workspace, UUID userId) {

        String role = workspace.getMembers().get(userId);

        if (role == null ||
                (!role.equalsIgnoreCase("OWNER") &&
                 !role.equalsIgnoreCase("ADMIN"))) {

            throw new AccessDeniedException(
                    "Only OWNER or ADMIN can perform this action.");
        }
    }

    private void validateOwner(Workspace workspace, UUID userId) {

        String role = workspace.getMembers().get(userId);

        if (role == null || !role.equalsIgnoreCase("OWNER")) {
            throw new AccessDeniedException(
                    "Only OWNER can perform this action.");
        }
    }
    public void removeMember(UUID workspaceId, UUID memberId, UUID currentUserId) {

    String role = getUserRole(workspaceId, currentUserId);

    if (!role.equalsIgnoreCase("OWNER")) {
        throw new AccessDeniedException("Only OWNER can remove members");
    }

    workspaceMemberRepository.deleteByWorkspaceIdAndUserId(workspaceId, memberId);
}
}
