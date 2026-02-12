package com.lexora.lexora_backend.workspace.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lexora.lexora_backend.auth.service.AuthService;
import com.lexora.lexora_backend.common.exception.AccessDeniedException;
import com.lexora.lexora_backend.common.exception.ResourceNotFoundException;
import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.workspace.dto.CreateWorkspaceRequest;
import com.lexora.lexora_backend.workspace.dto.WorkspaceResponse;
import com.lexora.lexora_backend.workspace.entity.Workspace;
import com.lexora.lexora_backend.workspace.service.WorkspaceService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
@Slf4j
public class WorkspaceController {

    private final WorkspaceService workspaceService;
    private final AuthService authService;

    /** CREATE */
    @PostMapping
    public ResponseEntity<?> createWorkspace(@RequestBody CreateWorkspaceRequest req) {
        try {
            User user = authService.getCurrentUser();
            Workspace ws = workspaceService.createWorkspace(user, req.getName(), req.getDescription());
            WorkspaceResponse resp = mapToResponse(ws);

            log.info("Workspace {} created by user {}", ws.getId(), user.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Workspace created successfully",
                    "workspace", resp
            ));
        } catch (Exception e) {
            log.error("Error creating workspace: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to create workspace",
                    "details", e.getMessage()
            ));
        }
    }

    /** GET all active workspaces */
    @GetMapping
    public ResponseEntity<?> getMyWorkspaces() {
        try {
            User user = authService.getCurrentUser();
            List<Workspace> workspaces = workspaceService.getWorkspacesForUser(user);

            if (workspaces.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "message", "No active workspaces found"
                ));
            }

            List<WorkspaceResponse> list = workspaces.stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());

            log.info("Fetched {} active workspaces for user {}", list.size(), user.getId());
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            log.error("Error fetching workspaces: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to fetch workspaces",
                    "details", e.getMessage()
            ));
        }
    }

    /** GET workspace by ID */
    @GetMapping("/{id}")
    public ResponseEntity<?> getWorkspaceById(@PathVariable UUID id) {
        try {
            User user = authService.getCurrentUser();
            Workspace ws = workspaceService.getWorkspaceById(user, id);
            return ResponseEntity.ok(mapToResponse(ws));
        } catch (SecurityException se) {
            log.warn("Access denied for user to workspace {}: {}", id, se.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", se.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching workspace {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    /** SOFT DELETE */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteWorkspace(@PathVariable UUID id) {
        try {
            User user = authService.getCurrentUser();
            workspaceService.softDeleteWorkspace(user, id);

            log.info("Workspace {} soft deleted by user {}", id, user.getId());
            return ResponseEntity.ok(Map.of(
                    "message", "Workspace deleted successfully",
                    "workspaceId", id
            ));
        } catch (Exception e) {
            log.error("Error deleting workspace {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    /** RESTORE deleted workspace */
    @PostMapping("/{id}/restore")
    public ResponseEntity<?> restoreWorkspace(@PathVariable UUID id) {
        try {
            User user = authService.getCurrentUser();
            workspaceService.restoreWorkspace(user, id);

            log.info("Workspace {} restored by user {}", id, user.getId());
            return ResponseEntity.ok(Map.of(
                    "message", "Workspace restored successfully",
                    "workspaceId", id
            ));
        } catch (Exception e) {
            log.error("Error restoring workspace {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    /** LIST deleted workspaces */
    @GetMapping("/deleted")
    public ResponseEntity<?> getDeletedWorkspaces() {
        try {
            User user = authService.getCurrentUser();
            List<WorkspaceResponse> deletedList = workspaceService.getDeletedWorkspaces(user).stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());

            log.info("Fetched {} deleted workspaces for user {}", deletedList.size(), user.getId());
            return ResponseEntity.ok(deletedList);
        } catch (Exception e) {
            log.error("Error fetching deleted workspaces: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to fetch deleted workspaces",
                    "details", e.getMessage()
            ));
        }
    }

    /** MAPPER: Workspace -> WorkspaceResponse */
    private WorkspaceResponse mapToResponse(Workspace ws) {
        WorkspaceResponse resp = new WorkspaceResponse();
        resp.setId(ws.getId());
        resp.setName(ws.getName());
        resp.setDescription(ws.getDescription());
        resp.setOwnerId(ws.getOwner().getId());
        resp.setDeleted(ws.isDeleted());
        return resp;
    }

    @PostMapping("/{workspaceId}/add-member")
public ResponseEntity<?> addMemberToWorkspace(
        @PathVariable UUID workspaceId,
        @RequestParam UUID userIdToAdd,
        @RequestParam String role) {

    try {
        UUID currentUserId = authService.getCurrentUser().getId();

        // Call service to handle role check and add member
        workspaceService.addMember(workspaceId, currentUserId, userIdToAdd, role);

        return ResponseEntity.ok(Map.of(
                "message", "Member added successfully",
                "workspaceId", workspaceId,
                "addedUserId", userIdToAdd,
                "role", role.toUpperCase()
        ));

    } catch (ResourceNotFoundException rnfe) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "error", rnfe.getMessage()
        ));
    } catch (AccessDeniedException ade) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", ade.getMessage()
        ));
    } catch (IllegalArgumentException iae) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "error", iae.getMessage()
        ));
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to add member",
                "details", e.getMessage()
        ));
    }
}

@GetMapping("/{workspaceId}/members")
public ResponseEntity<?> getWorkspaceMembers(@PathVariable UUID workspaceId) {
    UUID requesterId = authService.getCurrentUser().getId();

    try {
        Map<UUID, String> members = workspaceService.getWorkspaceMembers(workspaceId, requesterId);

        return ResponseEntity.ok(Map.of(
                "workspaceId", workspaceId,
                "members", members
        ));
    } catch (AccessDeniedException ade) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", ade.getMessage()));
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));
    }
}
}
