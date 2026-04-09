package com.lexora.lexora_backend.notification.service;

import java.util.List;
import java.util.UUID;

import com.lexora.lexora_backend.notification.model.Notification;

public interface NotificationService {

    List<Notification> getNotificationsByUser(UUID userId);

    void markAsRead(UUID notificationId);

    public void notifyUser(UUID addedUserId, String message);
}