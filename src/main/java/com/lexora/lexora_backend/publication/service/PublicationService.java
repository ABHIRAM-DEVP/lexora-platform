package com.lexora.lexora_backend.publication.service;


import java.time.Instant;
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

    public String generateSlug(String title) {
        return title.toLowerCase()
                .replaceAll("[^a-z0-9\s]", "")
                .replaceAll("\s+", "-");
    }

    @Transactional
    public void publish(UUID noteId, PublishRequest request, UUID userId) {

        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        UUID workspaceId = note.getWorkspaceId();        
        permissionService.checkEditorAccess(workspaceId,userId);

        String slug = generateUniqueSlug(request.getTitle());

        Publication publication = Publication.builder()
                .id(UUID.randomUUID())
                .noteId(noteId)
                .workspaceId(note.getWorkspaceId())
                .title(request.getTitle())
                .slug(slug)
                .content(note.getContent())
                .status(PublicationStatus.PUBLISHED)
                .publishedAt(Instant.now())
                .tags(request.getTags())
                .authorId(userId)
                .metaDescription(request.getMetaDescription())
                .views((long) 0)
                .build();
publicationRepository.findBySlugAndStatus(slug, PublicationStatus.PUBLISHED);
        publicationRepository.save(publication);

        searchService.index(publication);

        kafkaTemplate.send("blog-published", publication);

        auditLogService.log(userId, "PUBLISH", userId);
    }

    public void unpublish(UUID noteId) {

        Publication publication = publicationRepository
                .findByNoteId(noteId)
                .orElseThrow(() -> new RuntimeException("Publication not found"));

publication.setStatus(PublicationStatus.UNPUBLISHED);
        publicationRepository.save(publication);

    }

    private String generateUniqueSlug(String title) {

    String baseSlug = title.toLowerCase()
            .replaceAll("[^a-z0-9\\s]", "")
            .replaceAll("\\s+", "-");

    String slug = baseSlug;
    int counter = 1;

    while (publicationRepository.existsBySlug(slug)) {
        slug = baseSlug + "-" + counter++;
    }

    return slug;
}

@Transactional
public void update(UUID noteId, PublishRequest request, UUID userId) {

    Publication publication = publicationRepository
            .findByNoteId(noteId)
            .orElseThrow(() -> new RuntimeException("Publication not found"));

    permissionService.checkEditorAccess(publication.getWorkspaceId(), userId);

    publication.setTitle(request.getTitle());
    publication.setMetaDescription(request.getMetaDescription());
    publication.setTags(request.getTags());

    publicationRepository.save(publication);

    searchService.index(publication);

    auditLogService.log(userId, "UPDATE_PUBLICATION", userId);
}


@Transactional
public void delete(UUID noteId, UUID userId) {

    Publication publication = publicationRepository
            .findByNoteId(noteId)
            .orElseThrow(() -> new RuntimeException("Not found"));

    permissionService.checkOwnerAccess(
            publication.getWorkspaceId()
    );

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