package com.lexora.lexora_backend.activity.service.impl;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.activity.model.ActivityLog;
import com.lexora.lexora_backend.activity.repository.ActivityLogRepository;
import com.lexora.lexora_backend.activity.service.ActivityService;
import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.user.repository.UserRepository;
import com.lexora.lexora_backend.workspace.entity.Workspace;
import com.lexora.lexora_backend.workspace.repository.WorkspaceRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ActivityServiceImpl implements ActivityService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;

    @Override
    public void log(UUID userId, String action, UUID entityId) {

        ActivityLog log = ActivityLog.builder()
                .id(UUID.randomUUID())      // UUID assigned here
                .userId(userId)
                .action(action)
                .entityId(entityId)
                .timestamp(Instant.now())
                .build();

        activityLogRepository.save(log);
    }

    @Override
    public List<ActivityLog> getAllActivities() {
        return activityLogRepository.findAll();
    }

    @Override
    public List<ActivityLog> getActivitiesByUser(UUID userId) {
        return activityLogRepository.findByUserId(userId);
    }
    
    @Override
    public List<ActivityLog> getActivitiesByWorkspace(UUID workspaceId) {
        return activityLogRepository.findByWorkspaceId(workspaceId);
    }
    
    @Override
    public UUID getUserPrimaryWorkspaceId(UUID userId) {
        // Get the user's first workspace (primary workspace)
        User user = userRepository.findById(userId).orElse(null);
        if (user != null && user.getWorkspaces() != null && !user.getWorkspaces().isEmpty()) {
            // Get the first non-deleted workspace
            for (Workspace ws : user.getWorkspaces()) {
                if (!ws.isDeleted()) {
                    return ws.getId();
                }
            }
        }
        return null;
    }
    
    @Override
    public Object getWorkspaceForAnalytics(UUID workspaceId, UUID userId) {
        // Check if user has access to the workspace
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return null;
        }
        
        // Check if user is owner of the workspace
        Workspace workspace = workspaceRepository.findById(workspaceId).orElse(null);
        if (workspace == null) {
            return null;
        }
        
        // Check if user is the owner
        if (workspace.getOwner() != null && workspace.getOwner().getId().equals(userId)) {
            return workspace;
        }
        
        // Check if user is a member of the workspace
        if (user.getWorkspaces() != null) {
            for (Workspace ws : user.getWorkspaces()) {
                if (ws.getId().equals(workspaceId)) {
                    return workspace;
                }
            }
        }
        
        return null;
    }
}

