package com.lexora.lexora_backend.publication.service;


import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lexora.lexora_backend.activity.service.ActivityService;
import com.lexora.lexora_backend.note.entity.Note;
import com.lexora.lexora_backend.note.repository.NoteRepository;
import com.lexora.lexora_backend.publication.dto.PublishRequest;
import com.lexora.lexora_backend.publication.entity.Publication;
import com.lexora.lexora_backend.publication.entity.PublicationStatus;
import com.lexora.lexora_backend.publication.repository.PublicationRepository;
import com.lexora.lexora_backend.search.service.SearchService;
import com.lexora.lexora_backend.workspace.service.PermissionService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PublicationService {

    private final PublicationRepository publicationRepository;
    private final NoteRepository noteRepository;
    private final PermissionService permissionService;
    private final SearchService searchService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ActivityService auditLogService;
    private final MongoTemplate mongoTemplate;

    @Transactional
    public Publication publish(UUID noteId, PublishRequest request, UUID userId) {

        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        UUID workspaceId = note.getWorkspaceId();
        if (workspaceId != null) {
            permissionService.checkEditorAccess(workspaceId, userId);
        } else if (!note.getAuthorId().equals(userId)) {
            throw new RuntimeException("You do not have permission to publish this personal note");
        }

        Publication publication = publicationRepository.findByNoteId(noteId)
                .orElseGet(Publication::new);

        if (publication.getId() == null) {
            publication.setId(UUID.randomUUID());
            publication.setNoteId(noteId);
            publication.setViews(0L);
        }

        String requestedTitle = request.getTitle() == null || request.getTitle().isBlank()
                ? note.getTitle()
                : request.getTitle();

        if (publication.getSlug() == null || !requestedTitle.equals(publication.getTitle())) {
            publication.setSlug(buildSlug(requestedTitle));
        }

        publication.setWorkspaceId(note.getWorkspaceId());
        publication.setTitle(requestedTitle);
        publication.setContent(note.getContent());
        publication.setStatus(PublicationStatus.PUBLISHED);
        publication.setPublishedAt(Instant.now());
        publication.setTags(request.getTags());
        publication.setAuthorId(userId);
        publication.setMetaDescription(request.getMetaDescription());
        publication.setVisibility(request.getVisibility());
        publication.setLayout(request.getLayout());
        publication.setStyle(request.getStyle());
        publication.setMediaIds(request.getMediaIds());
        Publication saved = publicationRepository.save(publication);

        try {
            searchService.index(saved);
        } catch (Exception e) {
            // Log error but don't fail publishing
            System.err.println("Search indexing failed: " + e.getMessage());
        }

        try {
            kafkaTemplate.send("blog-published", saved);
        } catch (Exception e) {
            // Log error but don't fail publishing
            System.err.println("Kafka notification failed: " + e.getMessage());
        }

        auditLogService.log(userId, "PUBLISH", userId);
        return saved;
    }

    private String buildSlug(String title) {
        String slug = (title == null ? "" : title)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("[\\s-]+", "-")
                .replaceAll("^[-]+|[-]+$", "");

        if (slug.isBlank()) {
            slug = UUID.randomUUID().toString();
        }

        String uniqueSlug = slug;
        int suffix = 1;
        while (publicationRepository.existsBySlug(uniqueSlug)) {
            uniqueSlug = slug + "-" + suffix++;
        }

        return uniqueSlug;
    }

    public void unpublish(UUID noteId) {

        Publication publication = publicationRepository
                .findByNoteId(noteId)
                .orElseThrow(() -> new RuntimeException("Publication not found"));

        publication.setStatus(PublicationStatus.UNPUBLISHED);
        publicationRepository.save(publication);

    }

    @Transactional
    public void update(UUID noteId, PublishRequest request, UUID userId) {

    Publication publication = publicationRepository
            .findByNoteId(noteId)
            .orElseThrow(() -> new RuntimeException("Publication not found"));

    if (publication.getWorkspaceId() != null) {
        permissionService.checkEditorAccess(publication.getWorkspaceId(), userId);
    } else if (!publication.getAuthorId().equals(userId)) {
        throw new RuntimeException("You do not have permission to update this publication");
    }

    publication.setTitle(request.getTitle());
    publication.setMetaDescription(request.getMetaDescription());
    publication.setTags(request.getTags());
    publication.setVisibility(request.getVisibility());
    publication.setLayout(request.getLayout());
    publication.setStyle(request.getStyle());
    publication.setMediaIds(request.getMediaIds());

    publicationRepository.save(publication);

    searchService.index(publication);

    auditLogService.log(userId, "UPDATE_PUBLICATION", userId);
}


@Transactional
public void delete(UUID noteId, UUID userId) {

    Publication publication = publicationRepository
            .findByNoteId(noteId)
            .orElseThrow(() -> new RuntimeException("Not found"));

    if (publication.getWorkspaceId() != null) {
        permissionService.checkOwnerAccess(
                publication.getWorkspaceId()
        );
    } else if (!publication.getAuthorId().equals(userId)) {
        throw new RuntimeException("You do not have permission to delete this publication");
    }

    publicationRepository.delete(publication);

    searchService.delete(publication.getId());

    kafkaTemplate.send("blog-deleted", publication.getId());

    auditLogService.log(
            userId,
            "DELETE_PUBLICATION",
            noteId
    );
}

public void incrementViews(String slug) {

    Query query = new Query(
            Criteria.where("slug").is(slug)
    );

    Update update = new Update().inc("views", 1);

    mongoTemplate.updateFirst(query, update, Publication.class);
}
}
