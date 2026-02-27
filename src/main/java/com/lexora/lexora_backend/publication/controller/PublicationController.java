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
import com.lexora.lexora_backend.publication.service.PublicationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/publication")
public class PublicationController {

    private final PublicationService publicationService;

    @PostMapping("/{noteId}/publish")
    public void publish(@PathVariable UUID noteId,
                        @RequestBody PublishRequest request,
                        @RequestHeader("X-User-ID") UUID userId) {
        publicationService.publish(noteId, request, userId);
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