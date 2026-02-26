package com.lexora.lexora_backend.notification.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.lexora.lexora_backend.notification.Document.Notification;

public interface NotificationRepository
        extends MongoRepository<Notification, String> {


    public void save(com.lexora.lexora_backend.notification.model.Notification notification);


    List<Notification> findByUserId(UUID userId);

    Optional<Notification> findById(UUID id);  // Optional is IMPORTANT
}
