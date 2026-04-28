package com.lexora.lexora_backend.publication.controller;


import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lexora.lexora_backend.common.exception.ResourceNotFoundException;
import com.lexora.lexora_backend.publication.dto.PublicBlogResponse;
import com.lexora.lexora_backend.publication.entity.Publication;
import com.lexora.lexora_backend.publication.entity.PublicationStatus;
import com.lexora.lexora_backend.publication.repository.PublicationRepository;
import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.user.repository.UserRepository;
import com.lexora.lexora_backend.media.service.MediaService;

import lombok.RequiredArgsConstructor;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/public")
public class PublicBlogController {

    private final PublicationRepository publicationRepository;
    private final UserRepository userRepository;
    private final MediaService mediaService;

    @GetMapping("/blog/{slug}")
    public PublicBlogResponse getBySlug(@PathVariable String slug) {

        Publication publication = publicationRepository
                .findBySlugAndStatus(slug, PublicationStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Blog not found"));

        Long currentViews = publication.getViews();
        publication.setViews((currentViews == null ? 0L : currentViews) + 1L);
        publicationRepository.save(publication);

        User author = userRepository.findById(publication.getAuthorId()).orElse(null);

        return PublicBlogResponse.builder()
                .title(publication.getTitle())
                .slug(publication.getSlug())
                .content(publication.getContent())
                .tags(publication.getTags())
                .publishedAt(publication.getPublishedAt())
                .views(publication.getViews())
                .publishedByName(author != null ? author.getUsername() : "Unknown author")
                .publishedByEmail(author != null ? author.getEmail() : null)
                .style(publication.getStyle())
                .media(mediaService.getMediaResponses(publication.getMediaIds()))
                .build();
    }



    @GetMapping("/blogs")
    public Page<PublicBlogResponse> list(
            @RequestParam(required = false) String tag,
            Pageable pageable) {

        Page<Publication> publicationPage;
        if (tag != null) {
            publicationPage = publicationRepository
                    .findByTagsContainingAndStatus(
                            tag,
                            PublicationStatus.PUBLISHED,
                            pageable);
        } else {
            publicationPage = publicationRepository
                    .findByStatusOrderByPublishedAtDesc(
                            PublicationStatus.PUBLISHED,
                            pageable);
        }

        var content = publicationPage.getContent().stream()
                .map(pub -> {
                    User author = userRepository.findById(pub.getAuthorId()).orElse(null);
                    return PublicBlogResponse.builder()
                            .title(pub.getTitle())
                            .slug(pub.getSlug())
                            .content(pub.getContent())
                            .tags(pub.getTags())
                            .publishedAt(pub.getPublishedAt())
                            .views(pub.getViews())
                            .publishedByName(author != null ? author.getUsername() : "Unknown author")
                            .publishedByEmail(author != null ? author.getEmail() : null)
                            .style(pub.getStyle())
                            .media(mediaService.getMediaResponses(pub.getMediaIds()))
                            .build();
                })
                .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, publicationPage.getTotalElements());
    }
}
