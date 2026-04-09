package com.lexora.lexora_backend.activity.consumer;

import java.time.Instant;
import java.util.UUID;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.lexora.lexora_backend.activity.model.ActivityLog;
import com.lexora.lexora_backend.activity.repository.ActivityLogRepository;
import com.lexora.lexora_backend.events.model.CommentCreatedEvent;

@Component
public class ActivityLogConsumer {

    private final ActivityLogRepository activityLogRepository;

    public ActivityLogConsumer(ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
    }

    @KafkaListener(topics = "comment-events", groupId = "activity-log-group")
    public void handleCommentEvent(CommentCreatedEvent event) {

        ActivityLog log = ActivityLog.builder()
                .userId(UUID.fromString(event.getUserId()))
                .workspaceId(UUID.fromString(event.getWorkspaceId()))
                .action("COMMENT_CREATED")
                .entityType("COMMENT")
                .entityId(UUID.fromString(event.getNoteId()))
                .timestamp(Instant.now())
                .build();

        activityLogRepository.save(log);
    }
}
