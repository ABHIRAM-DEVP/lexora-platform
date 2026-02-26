package com.lexora.lexora_backend.notification.consumer;

import com.lexora.lexora_backend.events.model.CommentCreatedEvent;
import com.lexora.lexora_backend.notification.model.Notification;
import com.lexora.lexora_backend.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final NotificationRepository notificationRepository;

    @KafkaListener(topics = "comment-events", groupId = "notification-group")
    public void handleCommentEvent(CommentCreatedEvent event) {

        Notification notification = Notification.builder()
                .userId(event.getUserId())
                .message("New comment added in workspace " + event.getWorkspaceId())
                .isRead(false)
                .createdAt(Instant.now())
                .build();

        notificationRepository.save(notification);
    }
}
