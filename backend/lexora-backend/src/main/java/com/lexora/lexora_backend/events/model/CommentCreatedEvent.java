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

    // Explicit getter for noteId to ensure IDE recognition
    public String getNoteId() {
        return noteId;
    }
    
    public void setNoteId(String noteId) {
        this.noteId = noteId;
    }
    
    public String getCommentId() {
        return commentId;
    }
    
    public void setCommentId(String commentId) {
        this.commentId = commentId;
    }
}


