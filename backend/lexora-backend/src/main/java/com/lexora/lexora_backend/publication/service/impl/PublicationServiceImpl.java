package com.lexora.lexora_backend.publication.service.impl;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.publication.dto.PublicBlogResponse;
import com.lexora.lexora_backend.publication.entity.Publication;
import com.lexora.lexora_backend.publication.entity.PublicationStatus;
import com.lexora.lexora_backend.publication.repository.PublicationRepository;
import com.lexora.lexora_backend.publication.service.PublicationService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PublicationServiceImpl {

    private final PublicationService publicationService;

    private final PublicationRepository publicationRepository;

    
    @Cacheable(value = "publicBlog", key = "#slug")
    public PublicBlogResponse getPublicBlog(String slug) {

        Publication publication = publicationRepository
                .findBySlugAndStatus(slug, PublicationStatus.PUBLISHED)
                .orElseThrow(() -> new RuntimeException("Blog not found"));

        incrementViews(slug);

        return PublicBlogResponse.builder()
        .title(publication.getTitle())
        .slug(publication.getSlug())
        .content(publication.getContent())
        .views(publication.getViews())
        .publishedAt(publication.getPublishedAt())
        .build();
    }


    private void incrementViews(String slug) {
    publicationService.incrementViews(slug);
}
}