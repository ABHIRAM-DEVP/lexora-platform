package com.lexora.lexora_backend.notification.listener;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.lexora.lexora_backend.notification.service.NotificationService;
import com.lexora.lexora_backend.workspace.events.MemberAddedEvent;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class MemberNotificationListener {

    private final NotificationService notificationService;

    @KafkaListener(
        topics = "workspace.member.added",
        groupId = "notification-group"
    )
    public void handleMemberAdded(MemberAddedEvent event) {

        String message = "You were added to workspace " +
                event.getWorkspaceId();

        notificationService.notifyUser(
                event.getAddedUserId(),
                message
        );
    }
}
