package com.lexora.lexora_backend.comment.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.comment.document.Comment;
import com.lexora.lexora_backend.comment.repository.CommentRepository;
import com.lexora.lexora_backend.common.exception.AccessDeniedException;
import com.lexora.lexora_backend.events.producer.KafkaEventProducer;
import com.lexora.lexora_backend.workspace.service.WorkspaceMemberService;
import com.lexora.lexora_backend.notification.service.NotificationService;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class CommentService {

    private final WorkspaceMemberService workspaceMemberService;
    private final CommentRepository commentRepository;
    private final KafkaEventProducer kafkaEventProducer;
    private final NotificationService notificationService;

    public Comment addComment(UUID noteId,
                          UUID workspaceId,
                          UUID userId,
                          String content) {

    // 1. Validate workspace membership
    workspaceMemberService.validateMembership(workspaceId, userId);

    Comment comment = Comment.builder()
            .noteId(noteId)
            .workspaceId(workspaceId)
            .userId(userId)
            .content(content)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .isDeleted(false)
            .build();

    return commentRepository.save(comment);
    }


    public List<Comment> getComments(UUID noteId, UUID userId, UUID userId1) {

    // Validate membership via workspaceId from note
    return commentRepository
            .findByNoteIdAndIsDeletedFalseOrderByCreatedAtAsc(noteId);
    }

    public void deleteComment(String commentId, UUID userId) {

    Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new RuntimeException("Comment not found"));

    boolean isOwner = workspaceMemberService
            .isOwner(comment.getWorkspaceId(), userId);

    boolean isAuthor = comment.getUserId().equals(userId);

    if (!isOwner && !isAuthor) {
        throw new AccessDeniedException("Not allowed to delete comment");
    }

    comment.setDeleted(true);
    comment.setUpdatedAt(Instant.now());

    commentRepository.save(comment);
    }

    public Comment addComment(Comment comment) {
        Comment saved = commentRepository.save(comment);

        kafkaEventProducer.publishCommentCreated(
            saved.getId().toString(),
            saved.getUserId().toString(),
            saved.getWorkspaceId().toString()
        );

        return saved;
    }
    
}
