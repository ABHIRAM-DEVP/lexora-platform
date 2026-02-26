package com.lexora.lexora_backend.activity.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.activity.model.ActivityLog;


public interface ActivityService {

    List<ActivityLog> getAllActivities();

    List<ActivityLog> getActivitiesByUser(UUID userId);
}