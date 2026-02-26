package com.lexora.lexora_backend.events.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
            public class CommentCreatedEvent extends BaseEvent {
            private String noteId;
            private String commentId;

            public CommentCreatedEvent(String noteId, String userId, String workspaceId) {
                super("COMMENT_CREATED", userId, workspaceId);
                this.noteId = noteId;
            }

    // Getters & Setters
}


