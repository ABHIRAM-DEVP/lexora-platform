package com.lexora.lexora_backend.activity.service;

import java.util.List;
import java.util.UUID;

import com.lexora.lexora_backend.activity.model.ActivityLog;

public interface ActivityService {

    void log(UUID userId2, String action, UUID userId1);

    List<ActivityLog> getAllActivities();

    List<ActivityLog> getActivitiesByUser(UUID userId);
}