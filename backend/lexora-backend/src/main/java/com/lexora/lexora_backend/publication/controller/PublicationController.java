package com.lexora.lexora_backend.publication.controller;


import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lexora.lexora_backend.publication.dto.PublishRequest;
import com.lexora.lexora_backend.publication.dto.PublishResponse;
import com.lexora.lexora_backend.publication.entity.Publication;
import com.lexora.lexora_backend.publication.service.PublicationService;
import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.user.repository.UserRepository;

import com.lexora.lexora_backend.media.service.MediaService;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/publication")
public class PublicationController {

    private final PublicationService publicationService;
    private final UserRepository userRepository;
    private final MediaService mediaService;


    @PostMapping("/{noteId}/publish")
    public PublishResponse publish(@PathVariable UUID noteId,
                                   @RequestBody PublishRequest request,
                                   @RequestHeader("X-User-ID") UUID userId) {
        // Get the published article
        Publication publication = publicationService.publish(noteId, request, userId);
        
        // Enrich with author details
        User author = userRepository.findById(publication.getAuthorId()).orElse(null);
        
        // Return complete article data (no second API call needed)
        return PublishResponse.builder()
                .slug(publication.getSlug())
                .title(publication.getTitle())
                .content(publication.getContent())
                .tags(publication.getTags())
                .publishedAt(publication.getPublishedAt())
                .views(publication.getViews())
                .publishedByName(author != null ? author.getUsername() : "Unknown author")
                .publishedByEmail(author != null ? author.getEmail() : null)
                .media(mediaService.getMediaResponses(publication.getMediaIds()))
                .build();
    }

    @PostMapping("/{noteId}/unpublish")
    public void unpublish(@PathVariable UUID noteId) {
        publicationService.unpublish(noteId);
    }

    @GetMapping("/ping")
    public String ping() {
        return "PUBLICATION WORKING";
    }

    @GetMapping("/me")
    public Page<Publication> getMyPublications(@RequestHeader("X-User-ID") UUID userId, Pageable pageable) {
        return publicationService.findByAuthor(userId, pageable);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id, 
                                   @RequestHeader(value = "X-User-ID", required = false) String userIdStr,
                                   @RequestParam(required = false) String reason) {
        
        try {
            if (userIdStr == null || userIdStr.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing X-User-ID header"));
            }

            UUID userId;
            UUID noteId;
            try {
                userId = UUID.fromString(userIdStr);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid User ID format: " + userIdStr));
            }

            try {
                noteId = UUID.fromString(id);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid ID format: " + id));
            }

            publicationService.delete(noteId, userId, reason);
            return ResponseEntity.ok(Map.of("message", "Publication withdrawn successfully"));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}