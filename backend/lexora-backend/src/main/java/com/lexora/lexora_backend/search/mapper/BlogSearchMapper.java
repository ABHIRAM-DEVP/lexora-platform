package com.lexora.lexora_backend.search.mapper;

import org.springframework.stereotype.Component;

import com.lexora.lexora_backend.search.dto.BlogSearchDTO;
import com.lexora.lexora_backend.search.index.BlogIndex;

@Component
public class BlogSearchMapper {

    public BlogSearchDTO toDTO(BlogIndex index) {
        return BlogSearchDTO.builder()
                .id(index.getId())
                .title(index.getTitle())
                .content(index.getContent())
                .tags(index.getTags())
                .build();
    }
}