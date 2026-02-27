// package com.lexora.lexora_backend.config;

// import com.lexora.lexora_backend.publication.dto.PublicBlogResponse;
// import com.lexora.lexora_backend.publication.entity.Publication;
// import com.lexora.lexora_backend.publication.entity.PublicationStatus;

// import jakarta.persistence.Cacheable;

// public class CacheConfig {
    
//     @Cacheable(value = "publicBlog", key = "#slug")
// public PublicBlogResponse getPublicBlog(String slug) {

//     Publication publication = publicationRepository
//             .findBySlugAndStatus(slug, PublicationStatus.PUBLISHED)
//             .orElseThrow(() -> new RuntimeException("Blog not found"));

//     incrementViews(slug);

//     return mapper.toResponse(publication);
// }
// }
