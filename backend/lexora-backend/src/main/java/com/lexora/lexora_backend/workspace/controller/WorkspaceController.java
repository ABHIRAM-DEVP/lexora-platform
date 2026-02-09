package com.lexora.lexora_backend.workspace.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lexora.lexora_backend.auth.service.AuthService;
import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.workspace.dto.CreateWorkspaceRequest;
import com.lexora.lexora_backend.workspace.entity.Workspace;
import com.lexora.lexora_backend.workspace.service.WorkspaceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;
    private final AuthService authService;

    @PostMapping
    public ResponseEntity<?> createWorkspace(@RequestBody CreateWorkspaceRequest request) {

        User currentUser = authService.getCurrentUser(); // 🔥 works with JWT subject

        return ResponseEntity.ok(
                workspaceService.createWorkspace(currentUser, request.getName())
        );
    }

    @GetMapping
    public ResponseEntity<List<Workspace>> getMyWorkspaces() {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(
                workspaceService.getWorkspacesForUser(currentUser)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Workspace> getWorkspaceById(@PathVariable Long id) {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(
                workspaceService.getWorkspaceById(currentUser, id)
        );
    }
}
