package com.lexora.lexora_backend.media.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.lexora.lexora_backend.media.document.MediaFile;

public interface MediaRepository extends MongoRepository<MediaFile, String> {

    Page<MediaFile> findByWorkspaceIdAndOwnerIdAndDeletedFalse(
            UUID workspaceId,
            UUID ownerId,
            Pageable pageable
    );

    Optional<MediaFile> findByIdAndOwnerIdAndDeletedFalse(
            String fileId,
            UUID ownerId
    );

    Optional<MediaFile> findByIdAndOwnerId(
            String fileId,
            UUID ownerId
    );

    public Page<MediaFile> findByWorkspaceIdAndOwnerIdAndFileNameContainingIgnoreCaseAndDeletedFalse(UUID workspaceId, UUID userId, String query, Pageable pageable);

    @Query("{ 'workspaceId': ?0, 'ownerId': ?1, 'deleted': false, " +
       ": [ " +
       "{ : [ { 'fileName': { : { : [ '', ?2 ] }, : 'i' } }, { ?2: null } ] }, " +
       "{ : [ { 'fileType': ?3 }, { ?3: null } ] }, " +
       "{ : [ { 'createdAt': { : ?4 } }, { ?4: null } ] }, " +
       "{ : [ { 'createdAt': { : ?5 } }, { ?5: null } ] } " +
       "] }")
Page<MediaFile> findByWorkspaceIdAndOwnerIdAndDeletedFalseWithFilters(
        UUID workspaceId,
        UUID ownerId,
        String keyword,
        String fileType,
        LocalDateTime fromDate,
        LocalDateTime toDate,
        Pageable pageable
);


    Page<MediaFile> findByWorkspaceIdAndOwnerIdAndDeletedTrue(UUID workspaceId, UUID userId, Pageable pageable);

    List<MediaFile> findByWorkspaceIdAndDeletedFalse(UUID workspaceId, Pageable pageable);

    Page<MediaFile> findByWorkspaceIdAndDeletedTrue(UUID workspaceId, Pageable pageable);

            Page<MediaFile> findByWorkspaceIdAndFileNameContainingIgnoreCaseAndDeletedFalse(UUID workspaceId, String keyword,
            Pageable pageable);


            Page<MediaFile> findByWorkspaceIdAndDeletedFalseAndFileNameContainingIgnoreCase(
        UUID workspaceId,
        String fileName,
        Pageable pageable
);

}
