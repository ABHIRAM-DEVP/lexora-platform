package com.lexora.lexora_backend.comment.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.lexora.lexora_backend.comment.document.Comment;

public interface CommentRepository extends MongoRepository<Comment, String> {

    List<Comment> findByNoteIdAndIsDeletedFalseOrderByCreatedAtAsc(UUID noteId);

}

