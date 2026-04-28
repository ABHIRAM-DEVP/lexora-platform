package com.lexora.lexora_backend.publication.dto;

import java.time.Instant;
import java.util.List;
import com.lexora.lexora_backend.media.dto.MediaResponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublishResponse {
    // Slug for URL routing
    private String slug;
    
    // Full article data for immediate UI rendering (no second API call needed)
    private String title;
    private String content;
    private List<String> tags;
    private Instant publishedAt;
    private Long views;
    private String publishedByName;
    private String publishedByEmail;
    private List<MediaResponse> media;
}
