package com.lexora.lexora_backend.publication.controller;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lexora.lexora_backend.publication.dto.PublicBlogResponse;
import com.lexora.lexora_backend.publication.entity.Publication;
import com.lexora.lexora_backend.publication.entity.PublicationStatus;
import com.lexora.lexora_backend.publication.repository.PublicationRepository;

import lombok.RequiredArgsConstructor;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/public")
public class PublicBlogController {

    private final PublicationRepository publicationRepository;

    @GetMapping("/blog/{slug}")
    public PublicBlogResponse getBySlug(@PathVariable String slug) {

        Publication publication = publicationRepository
.findBySlugAndStatus(slug, PublicationStatus.PUBLISHED)                .orElseThrow(() -> new RuntimeException("Blog not found"));

        publication.setViews(publication.getViews() + 1);
        publicationRepository.save(publication);

        return PublicBlogResponse.builder()
                .title(publication.getTitle())
                .slug(publication.getSlug())
                .content(publication.getContent())
                .tags(publication.getTags())
                .publishedAt(publication.getPublishedAt())
                .views(publication.getViews())
                .build();
    }



    @GetMapping("/blogs")
    public Page<Publication> list(
            @RequestParam(required = false) String tag,
            Pageable pageable) {

        if (tag != null) {
            return publicationRepository
                    .findByTagsContainingAndStatus(
                            tag,
                            PublicationStatus.PUBLISHED,
                            pageable);
        }

        return publicationRepository
                .findByStatusOrderByPublishedAtDesc(
                        PublicationStatus.PUBLISHED,
                        pageable);
    }
}
