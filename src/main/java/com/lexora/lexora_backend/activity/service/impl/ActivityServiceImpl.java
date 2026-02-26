package com.lexora.lexora_backend.activity.service.impl;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.activity.model.ActivityLog;
import com.lexora.lexora_backend.activity.repository.ActivityLogRepository;
import com.lexora.lexora_backend.activity.service.ActivityService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ActivityServiceImpl implements ActivityService {

    private final ActivityLogRepository activityLogRepository;

    public void logActivity(UUID userId, String action, String description) {
        ActivityLog log = new ActivityLog();
        log.setUserId(userId);
        log.setAction(action);
        log.setTimestamp(Instant.now());

        activityLogRepository.save(log);
    }

    public List<ActivityLog> getAllActivity() {
        return activityLogRepository.findAll();
    }

    
    public List<ActivityLog> getActivityByUser(UUID userId) {
        return activityLogRepository.findByUserId(userId);
    }

    @Override
    public List<ActivityLog> getAllActivities() {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public List<ActivityLog> getActivitiesByUser(UUID userId) {
        throw new UnsupportedOperationException("Not supported yet.");
    }
}