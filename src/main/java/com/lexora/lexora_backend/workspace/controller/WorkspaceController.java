package com.lexora.lexora_backend.workspace.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.lexora.lexora_backend.auth.service.AuthService;
import com.lexora.lexora_backend.common.exception.AccessDeniedException;
import com.lexora.lexora_backend.common.exception.ResourceNotFoundException;
import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.workspace.dto.AddMemberRequest;
import com.lexora.lexora_backend.workspace.dto.ChangeRoleRequest;
import com.lexora.lexora_backend.workspace.dto.CreateWorkspaceRequest;
import com.lexora.lexora_backend.workspace.dto.WorkspaceResponse;
import com.lexora.lexora_backend.workspace.entity.Workspace;
import com.lexora.lexora_backend.workspace.enums.WorkspaceRole;
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

    /** CREATE WORKSPACE */
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
            WorkspaceResponse ws = workspaceService.getWorkspaceById(user, id);
            return ResponseEntity.ok(ws);

        } catch (AccessDeniedException ade) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ade.getMessage()));
        } catch (ResourceNotFoundException rnfe) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", rnfe.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
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
        } catch (AccessDeniedException ade) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ade.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
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
        } catch (AccessDeniedException ade) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ade.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
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

    /** ADD MEMBER */
   @PostMapping("/{workspaceId}/members")
public ResponseEntity<?> addMember(
        @PathVariable UUID workspaceId,
        @RequestBody AddMemberRequest request) {
    try {
        WorkspaceRole role;
        try {
            role = WorkspaceRole.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid role. Must be MEMBER or ADMIN."));
        }

        // ⚡ Call 3-argument service method
        workspaceService.addMember(workspaceId, request.getUserId(), role);

        return ResponseEntity.ok(Map.of(
                "message", "Member added successfully",
                "userId", request.getUserId(),
                "role", role.name()
        ));
    } catch (AccessDeniedException ade) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ade.getMessage()));
    } catch (ResourceNotFoundException rnfe) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", rnfe.getMessage()));
    } catch (IllegalStateException ise) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ise.getMessage()));
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Unexpected error occurred", "details", e.getMessage()));
    }
}


    /** REMOVE MEMBER */
    @DeleteMapping("/{workspaceId}/members/{userId}")
    public ResponseEntity<?> removeMember(
            @PathVariable UUID workspaceId,
            @PathVariable UUID userId) {
        try {
            UUID performerId = authService.getCurrentUser().getId();
            workspaceService.removeMember(workspaceId, performerId, userId);

            return ResponseEntity.ok(Map.of("message", "Member removed successfully"));
        } catch (AccessDeniedException ade) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ade.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    /** CHANGE ROLE */
    @PostMapping("/{workspaceId}/role")
    public ResponseEntity<?> changeRole(
            @PathVariable UUID workspaceId,
            @RequestBody ChangeRoleRequest request) {
        try {
            WorkspaceRole newRole;
            try {
                newRole = WorkspaceRole.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid role"));
            }

            UUID performerId = authService.getCurrentUser().getId();
            workspaceService.changeUserRole(workspaceId, performerId, request.getUserId(), newRole);

            return ResponseEntity.ok(Map.of("message", "Role changed successfully"));
        } catch (AccessDeniedException ade) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ade.getMessage()));
        } catch (ResourceNotFoundException rnfe) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", rnfe.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
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

    // GET /api/workspaces/{workspaceId}/members
    @GetMapping("/{workspaceId}/members")
    public ResponseEntity<Map<UUID, String>> getWorkspaceMembers(
            @PathVariable UUID workspaceId) {

        // Get current logged-in user
        User currentUser = authService.getCurrentUser(); // or from AuthService

        Map<UUID, String> members = workspaceService.getWorkspaceMembers(workspaceId, currentUser.getId());

        return ResponseEntity.ok(members);
    }
}
