package com.lexora.lexora_backend.workspace.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.workspace.entity.Workspace;
import com.lexora.lexora_backend.workspace.repository.WorkspaceRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;

    public Workspace createWorkspace(User user, String name) {
        Workspace workspace = new Workspace();
        workspace.setName(name);
        workspace.setOwner(user); // ✅ guaranteed non-null
        return workspaceRepository.save(workspace);
    }

    public List<Workspace> getWorkspacesForUser(User user) {
        return workspaceRepository.findByOwner(user);
    }

    public Workspace getWorkspaceById(User user, Long workspaceId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace not found"));

        if (!workspace.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }
        return workspace;
    }
}
