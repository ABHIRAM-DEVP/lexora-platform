package com.lexora.lexora_backend.events.model;

import java.time.Instant;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class BaseEvent {
    private String eventId;
    private String eventType;
    private Instant occurredAt;
    private String userId;
    private String workspaceId;

    public BaseEvent(String eventType, String userId, String workspaceId) {
        this.eventId = UUID.randomUUID().toString();
        this.eventType = eventType;
        this.occurredAt = Instant.now();
        this.userId = userId;
        this.workspaceId = workspaceId;
    }

    // Getters & Setters
}
