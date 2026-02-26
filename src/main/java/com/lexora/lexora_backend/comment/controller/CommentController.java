package com.lexora.lexora_backend.comment.controller;

import com.lexora.lexora_backend.comment.document.Comment;
import com.lexora.lexora_backend.comment.service.CommentService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    /**
     * ✅ Add Comment
     */
    @PostMapping("/notes/{noteId}/comments")
    public ResponseEntity<Comment> addComment(
            @PathVariable UUID noteId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UUID userId
    ) {

        UUID workspaceId = UUID.fromString(request.get("workspaceId"));
        String content = request.get("content");

        Comment savedComment = commentService.addComment(
                noteId,
                workspaceId,
                userId,
                content
        );

        return ResponseEntity.status(201).body(savedComment);
    }

    /**
     * ✅ Get Comments for Note
     */
    @GetMapping("/notes/{noteId}/comments")
    public ResponseEntity<List<Comment>> getComments(
            @PathVariable UUID noteId,
            @RequestParam UUID workspaceId,
            @AuthenticationPrincipal UUID userId
    ) {

        List<Comment> comments =
                commentService.getComments(noteId, workspaceId, userId);

        return ResponseEntity.ok(comments);
    }

    /**
     * ✅ Delete Comment
     */
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String commentId,
            @AuthenticationPrincipal UUID userId
    ) {

        commentService.deleteComment(commentId, userId);

        return ResponseEntity.noContent().build();
    }
}
