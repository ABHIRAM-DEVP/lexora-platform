package com.lexora.lexora_backend.publication.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.lexora.lexora_backend.publication.entity.Publication;
import com.lexora.lexora_backend.publication.entity.PublicationStatus;
public interface PublicationRepository
        extends MongoRepository<Publication, UUID> {

    Optional<Publication> findBySlug(String slug);

    Optional<Publication> findByNoteId(UUID noteId);

    java.util.List<Publication> findAllByNoteId(UUID noteId);

    boolean existsBySlug(String slug);

    Optional<Publication> findBySlugAndStatus(
            String slug,
            PublicationStatus status
    );

    Page<Publication> findByStatusOrderByPublishedAtDesc(
            PublicationStatus status,
            Pageable pageable
    );

    Page<Publication> findByTagsContainingAndStatus(
            String tag,
            PublicationStatus status,
            Pageable pageable
    );

    Page<Publication> findByStatus(
            PublicationStatus status,
            Pageable pageable
    );

    Page<Publication> findByAuthorId(UUID authorId, Pageable pageable);
}