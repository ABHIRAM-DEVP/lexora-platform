package com.lexora.lexora_backend.search.repository;

import com.lexora.lexora_backend.search.index.BlogIndex;

import java.util.UUID;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;



public interface BlogSearchRepository
        extends ElasticsearchRepository<BlogIndex, UUID> {
                
}