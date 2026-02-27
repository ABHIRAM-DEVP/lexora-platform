package com.lexora.lexora_backend.publication.dto;


import java.time.Instant;
import java.util.List;
import java.util.UUID;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PublicBlogResponse {

    private String title;
    private String slug;
    private String content;
    private List<String> tags;
    private Instant publishedAt;
    private Long views;

    
}