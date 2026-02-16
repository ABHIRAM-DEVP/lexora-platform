package com.lexora.lexora_backend.workspace.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.auth.service.AuthService;
import com.lexora.lexora_backend.common.exception.AccessDeniedException;
import com.lexora.lexora_backend.common.exception.ForbiddenException;
import com.lexora.lexora_backend.common.exception.ResourceNotFoundException;
import com.lexora.lexora_backend.user.entity.Role;
import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.user.repository.UserRepository;
import com.lexora.lexora_backend.workspace.dto.WorkspaceResponse;
import com.lexora.lexora_backend.workspace.entity.Workspace;
import com.lexora.lexora_backend.workspace.document.WorkspaceMember;
import com.lexora.lexora_backend.workspace.enums.WorkspaceRole;
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
    private final UserRepository userRepository;
    private final AuthService authService;

    /* ============================================================
       CREATE WORKSPACE
       ============================================================ */
    public Workspace createWorkspace(User owner, String name, String description) {

    if (name == null || name.isBlank()) {
        throw new IllegalArgumentException("Workspace name cannot be empty");
    }

    // 1️⃣ Create workspace entity
    Workspace ws = new Workspace();
    ws.setName(name);
    ws.setDescription(description);
    ws.setOwner(owner);
    ws.setDeleted(false);

    Workspace saved = workspaceRepository.save(ws);

    log.info("Workspace {} created by user {}", saved.getId(), owner.getId());

    // 2️⃣ Add creator as OWNER in workspace_member table
    WorkspaceMember ownerMember = new WorkspaceMember();
    ownerMember.setId(UUID.randomUUID());      // 🔹 generate UUID manually
    ownerMember.setWorkspaceId(saved.getId());
    ownerMember.setUserId(owner.getId());
    ownerMember.setRole(WorkspaceRole.OWNER);

    workspaceMemberRepository.save(ownerMember);

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
    @Cacheable(value = "workspaces", key = "#workspaceId + ':' + #user.id")
public WorkspaceResponse getWorkspaceById(User user, UUID workspaceId) {

    Workspace ws = workspaceRepository.findById(workspaceId)
            .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

    // Check access
    if (user.getRole() != Role.ADMIN && !ws.getMembers().containsKey(user.getId())) {
        throw new AccessDeniedException("Access denied to this workspace");
    }

    // Map to DTO
    WorkspaceResponse resp = new WorkspaceResponse();
    resp.setId(ws.getId());
    resp.setName(ws.getName());
    resp.setDescription(ws.getDescription());
    resp.setOwnerId(ws.getOwner().getId());
    resp.setDeleted(ws.isDeleted());

    return resp;
}


    /* ============================================================
       SOFT DELETE WORKSPACE
       ============================================================ */
    public void softDeleteWorkspace(User user, UUID workspaceId) {
    Workspace workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

    validateOwnerOrAdmin(workspaceId, user.getId());

    if (workspace.isDeleted()) {
        throw new IllegalStateException("Workspace already deleted");
    }

    workspace.setDeleted(true);
    workspaceRepository.save(workspace);
    log.info("Workspace {} soft deleted by user {}", workspaceId, user.getId());
}

public void restoreWorkspace(User user, UUID workspaceId) {
    Workspace workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

    validateOwner(workspaceId, user.getId());

    if (!workspace.isDeleted()) {
        throw new IllegalStateException("Workspace is not deleted");
    }

    workspace.setDeleted(false);
    workspaceRepository.save(workspace);
    log.info("Workspace {} restored by user {}", workspaceId, user.getId());
}

    /* ============================================================
       GET DELETED WORKSPACES
       ============================================================ */
    public List<Workspace> getDeletedWorkspaces(User user) {
        if (user.getRole() == Role.ADMIN) {
            return workspaceRepository.findByDeletedTrue();
        }
        return workspaceRepository.findByOwnerAndDeletedTrue(user);
    }

    /* ============================================================
       ADD MEMBER
       ============================================================ */
    @CacheEvict(value = "workspaces", allEntries = true)
public void addMember(UUID workspaceId, UUID userIdToAdd, WorkspaceRole role) {
    User currentUser = authService.getCurrentUser(); // performer

    Workspace workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

    // Validate performer role
    WorkspaceMember performer = workspaceMemberRepository
            .findByWorkspaceIdAndUserId(workspaceId, currentUser.getId())
            .orElseThrow(() -> new AccessDeniedException("Not authorized"));

    if (performer.getRole() != WorkspaceRole.OWNER &&
        performer.getRole() != WorkspaceRole.ADMIN) {
        throw new AccessDeniedException("Only OWNER or ADMIN can add members.");
    }

    // Check target user exists
    userRepository.findById(userIdToAdd)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    // Already a member?
    if (workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userIdToAdd).isPresent()) {
        throw new IllegalStateException("User is already a member");
    }

    WorkspaceMember member = new WorkspaceMember();
member.setId(UUID.randomUUID());           // 🔹 manual UUID
member.setWorkspaceId(workspaceId);
member.setUserId(userIdToAdd);
member.setRole(role);

workspaceMemberRepository.save(member);


    log.info("User {} added to workspace {} as {}", userIdToAdd, workspaceId, role);
}

    /* ============================================================
       REMOVE MEMBER
       ============================================================ */
    @CacheEvict(value = "workspaces", allEntries = true)
    public void removeMember(UUID workspaceId, UUID performedBy, UUID targetUser) {
        WorkspaceMember performer = workspaceMemberRepository
                .findByWorkspaceIdAndUserId(workspaceId, performedBy)
                .orElseThrow(() -> new AccessDeniedException("Not authorized"));

        if (performer.getRole() != WorkspaceRole.OWNER) {
            throw new AccessDeniedException("Only OWNER can remove members");
        }

        workspaceMemberRepository.deleteByWorkspaceIdAndUserId(workspaceId, targetUser);
    }

    /* ============================================================
       CHANGE USER ROLE
       ============================================================ */
    @CacheEvict(value = "workspaces", allEntries = true)
    public void changeUserRole(UUID workspaceId, UUID performedBy, UUID targetUser, WorkspaceRole newRole) {
        WorkspaceMember performer = workspaceMemberRepository
                .findByWorkspaceIdAndUserId(workspaceId, performedBy)
                .orElseThrow(() -> new AccessDeniedException("Not authorized"));

        if (performer.getRole() != WorkspaceRole.OWNER) {
            throw new AccessDeniedException("Only OWNER can change roles");
        }

        WorkspaceMember target = workspaceMemberRepository
                .findByWorkspaceIdAndUserId(workspaceId, targetUser)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (target.getRole() == WorkspaceRole.OWNER) {
            throw new AccessDeniedException("Cannot modify OWNER");
        }

        target.setRole(newRole);
        workspaceMemberRepository.save(target);
    }

    /* ============================================================
       GET WORKSPACE MEMBERS
       ============================================================ */
    // public Map<UUID, String> getWorkspaceMembers(UUID workspaceId, UUID requesterId) {
    //     Workspace workspace = workspaceRepository.findById(workspaceId)
    //             .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

    //     validateOwnerOrAdmin(workspace, requesterId);

    //     return new HashMap<>(workspace.getMembers());
    // }

    /* ============================================================
       GET USER ROLE INSIDE WORKSPACE
       ============================================================ */
    public String getUserRole(UUID workspaceId, UUID userId) {
        WorkspaceMember member = workspaceMemberRepository
                .findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this workspace."));
        return member.getRole().name();
    }

    /* ============================================================
       ROLE VALIDATION HELPERS
       ============================================================ */
    private void validateOwnerOrAdmin(UUID workspaceId, UUID userId) {
    WorkspaceMember member = workspaceMemberRepository
            .findByWorkspaceIdAndUserId(workspaceId, userId)
            .orElseThrow(() -> new AccessDeniedException("Only OWNER or ADMIN can perform this action."));

    if (member.getRole() != WorkspaceRole.OWNER && member.getRole() != WorkspaceRole.ADMIN) {
        throw new AccessDeniedException("Only OWNER or ADMIN can perform this action.");
    }
}

private void validateOwner(UUID workspaceId, UUID userId) {
    WorkspaceMember member = workspaceMemberRepository
            .findByWorkspaceIdAndUserId(workspaceId, userId)
            .orElseThrow(() -> new AccessDeniedException("Only OWNER can perform this action."));

    if (member.getRole() != WorkspaceRole.OWNER) {
        throw new AccessDeniedException("Only OWNER can perform this action.");
    }
}



public Map<UUID, String> getWorkspaceMembers(UUID workspaceId, UUID requesterId) {
    // Check if requester is OWNER or ADMIN
    WorkspaceMember requester = workspaceMemberRepository
            .findByWorkspaceIdAndUserId(workspaceId, requesterId)
            .orElseThrow(() -> new AccessDeniedException("Not authorized"));

    if (requester.getRole() != WorkspaceRole.OWNER && requester.getRole() != WorkspaceRole.ADMIN) {
        throw new AccessDeniedException("Only OWNER or ADMIN can perform this action.");
    }

    // Fetch all members from workspace_members
    List<WorkspaceMember> members = workspaceMemberRepository.findAllByWorkspaceId(workspaceId);

    // Map to UUID -> String
    return members.stream()
            .collect(Collectors.toMap(
                    WorkspaceMember::getUserId,
                    member -> member.getRole().name() // convert enum to string
            ));
}

public Workspace validateWorkspaceAccess(UUID workspaceId, UUID userId) {

    Workspace workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow(() ->
                    new ResourceNotFoundException("Workspace not found"));

    if (!workspace.getOwner().getId().equals(userId)) {
        throw new ForbiddenException("You do not have access to this workspace");
    }

    return workspace;
}

}
