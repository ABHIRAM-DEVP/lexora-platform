package com.lexora.lexora_backend.publication.controller;


import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
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
}