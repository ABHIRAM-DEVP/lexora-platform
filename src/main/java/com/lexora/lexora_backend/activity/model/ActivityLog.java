package com.lexora.lexora_backend.activity.model;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "activity_logs")
public class ActivityLog {

    @Id
    private UUID id;

    private UUID userId;
    private UUID workspaceId;
    private String action;
    private String entityType;
    private UUID entityId;
    private Instant timestamp;
   
}
