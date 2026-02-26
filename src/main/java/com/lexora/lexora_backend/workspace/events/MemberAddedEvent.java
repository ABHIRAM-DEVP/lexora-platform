package com.lexora.lexora_backend.workspace.events;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MemberAddedEvent {

    private UUID workspaceId;
    private UUID addedByUserId;
    private UUID addedUserId;
    private String role;
}
