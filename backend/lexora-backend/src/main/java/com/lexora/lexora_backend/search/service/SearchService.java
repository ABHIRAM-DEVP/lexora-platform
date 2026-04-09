package com.lexora.lexora_backend.search.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.publication.entity.Publication;
import com.lexora.lexora_backend.search.dto.BlogSearchDTO;
import com.lexora.lexora_backend.search.index.BlogIndex;
import com.lexora.lexora_backend.search.mapper.BlogSearchMapper;
import com.lexora.lexora_backend.search.repository.BlogSearchRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final BlogSearchRepository blogSearchRepository;
    private final ElasticsearchOperations elasticsearchOperations;
    private final BlogSearchMapper mapper;

    // 🔹 Index Blog
    public void index(Publication publication) {

        BlogIndex index = BlogIndex.builder()
                .id(publication.getId())   // UUID
                .title(publication.getTitle())
                .content(publication.getContent())
                .tags(publication.getTags())
                .build();

        blogSearchRepository.save(index);
    }

    // 🔹 Remove from Index
//     public void removeFromIndex(UUID id) {
//         blogSearchRepository.deleteById(id);
//     }

    // 🔹 Search Blogs
    public List<BlogSearchDTO> search(String keyword) {

        NativeQuery query = NativeQuery.builder()
                .withQuery(q -> q
                        .multiMatch(m -> m
                                .query(keyword)
                                .fields("title", "content", "tags")
                        )
                )
                .build();

        SearchHits<BlogIndex> hits =
                elasticsearchOperations.search(query, BlogIndex.class);

        return (List<BlogSearchDTO>) hits.getSearchHits()
                .stream()
                .map((SearchHit<BlogIndex> hit) ->
                        mapper.toDTO(hit.getContent()))
                .collect(Collectors.toList());
    }

    // 🔹 Delete using operations (optional)
    public void delete(UUID id) {
        elasticsearchOperations.delete(id.toString(), BlogIndex.class);
    }
}