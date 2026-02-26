package com.lexora.lexora_backend.activity.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.lexora.lexora_backend.activity.model.ActivityLog;

@Repository
public interface ActivityLogRepository extends MongoRepository<ActivityLog, UUID> {

    // Fetch all logs for a specific user
    List<ActivityLog> findByUserId(UUID userId);

    // Fetch logs for a workspace
    List<ActivityLog> findByWorkspaceId(UUID workspaceId);

    // Fetch logs ordered by latest first
    List<ActivityLog> findAllByOrderByTimestampDesc();

    public interface ActivityService {
    List<ActivityLog> getAllActivities();
    List<ActivityLog> getActivitiesByUser(UUID userId);
}
}
