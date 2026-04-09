package com.lexora.lexora_backend.activity.service;

import java.util.List;
import java.util.UUID;

import com.lexora.lexora_backend.activity.model.ActivityLog;

public interface ActivityService {

    void log(UUID userId, String action, UUID entityId);

    List<ActivityLog> getAllActivities();

    List<ActivityLog> getActivitiesByUser(UUID userId);
    
    List<ActivityLog> getActivitiesByWorkspace(UUID workspaceId);
    
    UUID getUserPrimaryWorkspaceId(UUID userId);
    
    Object getWorkspaceForAnalytics(UUID workspaceId, UUID userId);
}

