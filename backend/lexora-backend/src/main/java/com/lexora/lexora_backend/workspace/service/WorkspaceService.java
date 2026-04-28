package com.lexora.lexora_backend.workspace.service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.auth.service.AuthService;
import com.lexora.lexora_backend.common.events.DomainEventPublisher;
import com.lexora.lexora_backend.common.exception.AccessDeniedException;
import com.lexora.lexora_backend.common.exception.ForbiddenException;
import com.lexora.lexora_backend.common.exception.ResourceNotFoundException;
import com.lexora.lexora_backend.user.entity.Role;
import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.user.repository.UserRepository;
import com.lexora.lexora_backend.workspace.document.WorkspaceMember;
import com.lexora.lexora_backend.workspace.dto.WorkspaceMemberSummary;
import com.lexora.lexora_backend.workspace.dto.WorkspaceResponse;
import com.lexora.lexora_backend.workspace.entity.Workspace;
import com.lexora.lexora_backend.workspace.enums.WorkspaceRole;
import com.lexora.lexora_backend.workspace.events.MemberAddedEvent;
import com.lexora.lexora_backend.workspace.repository.WorkspaceMemberRepository;
import com.lexora.lexora_backend.workspace.repository.WorkspaceRepository;

@Service
public class WorkspaceService {

    private static final Logger log = LoggerFactory.getLogger(WorkspaceService.class);

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final DomainEventPublisher eventPublisher;

    public WorkspaceService(
            WorkspaceRepository workspaceRepository,
            WorkspaceMemberRepository workspaceMemberRepository,
            UserRepository userRepository,
            AuthService authService,
            DomainEventPublisher eventPublisher) {
        this.workspaceRepository = workspaceRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
        this.userRepository = userRepository;
        this.authService = authService;
        this.eventPublisher = eventPublisher;
    }

    /* ============================================================
       CREATE WORKSPACE
       ============================================================ */
    public Workspace createWorkspace(User owner, String name, String description, String accessType) {

    if (name == null || name.isBlank()) {
        throw new IllegalArgumentException("Workspace name cannot be empty");
    }

    if (accessType == null || (!accessType.equals("PUBLIC") && !accessType.equals("PRIVATE") && !accessType.equals("COLLABORATIVE"))) {
        throw new IllegalArgumentException("Invalid access type. Must be PUBLIC, PRIVATE, or COLLABORATIVE");
    }

    // 1️⃣ Create workspace entity
    Workspace ws = new Workspace();
    ws.setName(name);
    ws.setDescription(description);
    ws.setAccessType(accessType);
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

        List<Workspace> owned = workspaceRepository.findByOwnerAndDeletedFalse(user);
        
        try {
            List<UUID> memberWorkspaceIds = workspaceMemberRepository.findAllByUserId(user.getId()).stream()
                    .map(WorkspaceMember::getWorkspaceId)
                    .toList();

            List<Workspace> memberWorkspaces = workspaceRepository.findByDeletedFalse().stream()
                    .filter(workspace -> memberWorkspaceIds.contains(workspace.getId()))
                    .toList();

            return Stream.concat(owned.stream(), memberWorkspaces.stream())
                    .distinct()
                    .toList();
        } catch (Exception e) {
            log.error("Failed to fetch member workspaces from Mongo: {}. Returning owned only.", e.getMessage());
            return owned;
        }
    }

    /* ============================================================
       GET WORKSPACE BY ID
       ============================================================ */
    @Cacheable(value = "workspaces", key = "#workspaceId + ':' + #user.id")
public WorkspaceResponse getWorkspaceById(User user, UUID workspaceId) {

    Workspace ws = user.getRole() == Role.ADMIN
            ? workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"))
            : validateWorkspaceAccess(workspaceId, user.getId());

    // Map to DTO
    WorkspaceResponse resp = new WorkspaceResponse();
    resp.setId(ws.getId());
    resp.setName(ws.getName());
    resp.setDescription(ws.getDescription());
    resp.setAccessType(ws.getAccessType());
    resp.setOwnerId(ws.getOwner().getId());
    resp.setDeleted(ws.isDeleted());
    resp.setDeletedAt(ws.getDeletedAt());

    return resp;
}


    /* ============================================================
       SOFT DELETE WORKSPACE
       ============================================================ */
    public void softDeleteWorkspace(User user, UUID workspaceId) {
    Workspace workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

    if (user.getRole() != Role.ADMIN) {
        validateOwner(workspaceId, user.getId());
    }

    if (workspace.isDeleted()) {
        throw new IllegalStateException("Workspace already deleted");
    }

    workspace.setDeleted(true);
    workspace.setDeletedAt(LocalDateTime.now());
    workspaceRepository.save(workspace);
    log.info("Workspace {} soft deleted by user {}", workspaceId, user.getId());
}

public void restoreWorkspace(User user, UUID workspaceId) {
    Workspace workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

    validateOwnerOrAdmin(workspaceId, user.getId());

    if (!workspace.isDeleted()) {
        throw new IllegalStateException("Workspace is not deleted");
    }

    workspace.setDeleted(false);
    workspace.setDeletedAt(null);
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
        validateOwnerOrAdmin(workspaceId, performedBy);
        workspaceMemberRepository.deleteByWorkspaceIdAndUserId(workspaceId, targetUser);
        log.info("Member {} removed from workspace {} by {}", targetUser, workspaceId, performedBy);
    }

    /* ============================================================
       CHANGE USER ROLE
       ============================================================ */
    @CacheEvict(value = "workspaces", allEntries = true)
    public void changeUserRole(UUID workspaceId, UUID performedBy, UUID targetUser, WorkspaceRole newRole) {
        validateOwnerOrAdmin(workspaceId, performedBy);

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
        // 1. If physical owner in Postgres -> OWNER
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        if (workspace.getOwner().getId().equals(userId)) {
            return WorkspaceRole.OWNER.name();
        }

        // 2. Otherwise check Mongo
        WorkspaceMember member = workspaceMemberRepository
                .findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this workspace."));
        return member.getRole().name();
    }

    /* ============================================================
       ROLE VALIDATION HELPERS
       ============================================================ */
    private void validateOwnerOrAdmin(UUID workspaceId, UUID userId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        if (workspace.getOwner().getId().equals(userId)) {
            return;
        }

        WorkspaceMember member = workspaceMemberRepository
                .findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new AccessDeniedException("Only OWNER or ADMIN can perform this action."));

        if (member.getRole() != WorkspaceRole.OWNER && member.getRole() != WorkspaceRole.ADMIN) {
            throw new AccessDeniedException("Only OWNER or ADMIN can perform this action.");
        }
    }

    private void validateOwner(UUID workspaceId, UUID userId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        if (workspace.getOwner().getId().equals(userId)) {
            return;
        }

        WorkspaceMember member = workspaceMemberRepository
                .findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new AccessDeniedException("Only OWNER can perform this action."));

        if (member.getRole() != WorkspaceRole.OWNER) {
            throw new AccessDeniedException("Only OWNER can perform this action.");
        }
    }



public List<WorkspaceMemberSummary> getWorkspaceMembers(UUID workspaceId, UUID requesterId) {
    // Check if requester is the Postgres workspace owner first
    Workspace workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

    boolean isPostgresOwner = workspace.getOwner().getId().equals(requesterId);

    if (!isPostgresOwner) {
        // Fall back to MongoDB member check
        WorkspaceMember requester = workspaceMemberRepository
                .findByWorkspaceIdAndUserId(workspaceId, requesterId)
                .orElseThrow(() -> new AccessDeniedException("Not authorized"));

        if (requester.getRole() != WorkspaceRole.OWNER && requester.getRole() != WorkspaceRole.ADMIN) {
            throw new AccessDeniedException("Only OWNER or ADMIN can perform this action.");
        }
    }

    Map<UUID, User> usersById = userRepository.findAllById(
            Stream.concat(
                    Stream.of(workspace.getOwner().getId()),
                    workspaceMemberRepository.findAllByWorkspaceId(workspaceId).stream()
                            .map(WorkspaceMember::getUserId))
                    .distinct()
                    .toList())
            .stream()
            .collect(Collectors.toMap(User::getId, user -> user));

    List<WorkspaceMemberSummary> members = workspaceMemberRepository.findAllByWorkspaceId(workspaceId).stream()
            .map(member -> {
                User memberUser = usersById.get(member.getUserId());
                return WorkspaceMemberSummary.builder()
                        .id(member.getUserId())
                        .username(memberUser != null ? memberUser.getUsername() : "Unknown user")
                        .email(memberUser != null ? memberUser.getEmail() : null)
                        .role(member.getRole().name())
                        .owner(false)
                        .build();
            })
            .collect(Collectors.toList());

    User owner = workspace.getOwner();
    members.add(WorkspaceMemberSummary.builder()
            .id(owner.getId())
            .username(owner.getUsername())
            .email(owner.getEmail())
            .role(WorkspaceRole.OWNER.name())
            .owner(true)
            .build());

    return members.stream()
            .sorted(Comparator
                    .comparing(WorkspaceMemberSummary::isOwner).reversed()
                    .thenComparing(WorkspaceMemberSummary::getUsername, String.CASE_INSENSITIVE_ORDER))
            .toList();
}

// public Workspace validateWorkspaceAccess(UUID workspaceId, UUID userId) {

//     Workspace workspace = workspaceRepository.findById(workspaceId)
//             .orElseThrow(() ->
//                     new ResourceNotFoundException("Workspace not found"));

//     if (!workspace.getOwner().getId().equals(userId)) {
//         throw new ForbiddenException("You do not have access to this workspace");
//     }

//     return workspace;
// }

public Workspace validateWorkspaceAccess(UUID workspaceId, UUID userId) {

    Workspace workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

    // 1. If physical owner in Postgres -> ALLOW
    if (workspace.getOwner().getId().equals(userId)) {
        return workspace;
    }

    // 2. Otherwise check membership in Mongo (for Collaborative access)
    workspaceMemberRepository
            .findByWorkspaceIdAndUserId(workspaceId, userId)
            .orElseThrow(() ->
                    new ForbiddenException("You do not have access to this workspace"));

    return workspace;
}




    public void addMember(UUID workspaceId,
                          UUID userIdToAdd,
                          String role,
                          UUID currentUserId) {

        WorkspaceMember member = new WorkspaceMember();
        member.setWorkspaceId(workspaceId);
        member.setUserId(userIdToAdd);
        member.setRole(WorkspaceRole.valueOf(role));

        workspaceMemberRepository.save(member);

        // 🔥 EVENT PUBLISHING HOOK
        eventPublisher.publish(
                "workspace.member.added",
                new MemberAddedEvent(
                        workspaceId,
                        currentUserId,
                        userIdToAdd,
                        role
                )
        );
    }

    @Scheduled(cron = "0 0 * * * *")
    public void purgeExpiredDeletedWorkspaces() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
        List<Workspace> expired = workspaceRepository.findByDeletedTrueAndDeletedAtBefore(cutoff);
        if (expired.isEmpty()) {
            return;
        }

        expired.forEach(workspace -> {
            workspaceMemberRepository.findAllByWorkspaceId(workspace.getId())
                    .forEach(workspaceMemberRepository::delete);
            workspaceRepository.delete(workspace);
        });

        log.info("Purged {} workspaces deleted before {}", expired.size(), cutoff);
    }
}
