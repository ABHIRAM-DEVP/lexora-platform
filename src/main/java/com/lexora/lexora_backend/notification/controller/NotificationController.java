package com.lexora.lexora_backend.notification.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;
import com.lexora.lexora_backend.notification.model.Notification;
import com.lexora.lexora_backend.notification.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // 🔹 3. Get Notifications By User
    @GetMapping("/{userId}")
    public ResponseEntity<List<Notification>> getNotificationsByUser(
            @PathVariable UUID userId) {

        List<Notification> notifications =
                notificationService.getNotificationsByUser(userId);

        return ResponseEntity.ok(notifications);
    }

    // 🔹 4. Mark Notification As Read
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<String> markAsRead(
            @PathVariable UUID notificationId) {

        notificationService.markAsRead(notificationId);

        return ResponseEntity.ok("Notification marked as read successfully.");
    }
}