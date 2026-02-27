package com.lexora.lexora_backend.search.dto;

import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BlogSearchDTO {

    private UUID id;
    private String title;
    private String slug;
    private String content;
    private List<String> tags;
    private Instant publishedAt;
}