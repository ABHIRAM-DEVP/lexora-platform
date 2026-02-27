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
}