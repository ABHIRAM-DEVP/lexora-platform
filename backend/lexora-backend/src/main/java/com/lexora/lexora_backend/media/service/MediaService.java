package com.lexora.lexora_backend.media.service;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import javax.print.attribute.standard.Media;

import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.lexora.lexora_backend.auth.service.AuthService;
import com.lexora.lexora_backend.common.constants.CacheKeys;
import com.lexora.lexora_backend.common.dto.PagedResponse;
import com.lexora.lexora_backend.common.exception.AccessDeniedException;
import com.lexora.lexora_backend.common.exception.FileSizeExceededException;
import com.lexora.lexora_backend.common.exception.InvalidFileTypeException;
import com.lexora.lexora_backend.common.exception.MediaNotFoundException;
import com.lexora.lexora_backend.media.document.MediaFile;
import com.lexora.lexora_backend.media.dto.MediaResponse;
import com.lexora.lexora_backend.media.dto.UploadFileRequest;
import com.lexora.lexora_backend.media.mapper.MediaMapper;
import com.lexora.lexora_backend.media.repository.MediaRepository;
import com.lexora.lexora_backend.workspace.service.WorkspaceService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MediaService {

    private final MediaRepository mediaRepository;
    private final WorkspaceService workspaceService;
    private final AuthService authService;
    private final MongoTemplate mongoTemplate;

    @Value("${storage.localPath}")
    private String storagePath;

    private static final long MAX_SIZE = 10 * 1024 * 1024; // 10MB

    private final Tika tika = new Tika();

    // ---------------------------
    // Upload a new file
    // ---------------------------
    @CacheEvict(
    value = CacheKeys.WORKSPACE_MEDIA,
    allEntries = true
)
    public MediaFile uploadFile(MultipartFile file, UploadFileRequest request, UUID userId) throws IOException {
        // Validate file content
        if (file == null || file.isEmpty()) throw new InvalidFileTypeException("Uploaded file is empty");

        String detectedType = tika.detect(file.getInputStream());
        if (!(detectedType.startsWith("image/") || detectedType.equals("application/pdf")))
            throw new InvalidFileTypeException("Only images and PDFs allowed");

        if (file.getSize() > MAX_SIZE) throw new FileSizeExceededException("File exceeds 10MB");

        validateRole(request.getWorkspaceId(), userId, "OWNER", "ADMIN", "MEMBER");

        // Prepare storage path
        File rootDir = new File(storagePath);
        if (!rootDir.exists()) rootDir.mkdirs();
        File workspaceDir = new File(rootDir, request.getWorkspaceId().toString());
        if (!workspaceDir.exists()) workspaceDir.mkdirs();

        String storedFileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        File destination = new File(workspaceDir, storedFileName);
        file.transferTo(destination);

        // Save metadata
        MediaFile mediaFile = new MediaFile();
        mediaFile.setFileName(file.getOriginalFilename());
        mediaFile.setFileType(file.getContentType());
        mediaFile.setStoragePath(destination.getAbsolutePath());
        mediaFile.setWorkspaceId(request.getWorkspaceId());
        mediaFile.setOwnerId(userId);
        mediaFile.setSize(file.getSize());
        mediaFile.setDeleted(false);

        return mediaRepository.save(mediaFile);
    }

    // ---------------------------
    // Get file metadata (cached)
    // ---------------------------
@Cacheable(
    value = CacheKeys.MEDIA,
    key = "#fileId + ':' + #userId",
    sync=true
)    public MediaFile getFile(String fileId, UUID userId) {
        return mediaRepository
                .findByIdAndOwnerIdAndDeletedFalse(fileId, userId)
                .orElseThrow(() -> new MediaNotFoundException("File not found"));
    }

    // ---------------------------
    // List all files in workspace (cached)
    // ---------------------------
    @Cacheable(
        value = "workspaceMedia",
        key = "#workspaceId.toString() + ':' + #userId.toString() + ':' + #pageable.pageNumber + ':' + #pageable.pageSize + ':' + (#keyword ?: '') + ':' + (#fileType ?: '') + ':' + (#from ?: '') + ':' + (#to ?: '')",
        sync=true
    )
    public PagedResponse<MediaResponse> listFilesFiltered(
            UUID workspaceId,
            UUID userId,
            String keyword,
            String fileType,
            LocalDateTime from,
            LocalDateTime to,
            Pageable pageable) {

        validateWorkspace(workspaceId, userId);

        Criteria criteria = Criteria.where("workspaceId").is(workspaceId)
                .and("deleted").is(false);

        if (keyword != null && !keyword.isBlank()) {
            criteria.and("fileName").regex(keyword, "i");
        }

        if (fileType != null && !fileType.isBlank()) {
            criteria.and("fileType").is(fileType);
        }

        if (from != null) {
            criteria.and("createdAt").gte(from);
        }

        if (to != null) {
            criteria.and("createdAt").lte(to);
        }

        Query query = new Query(criteria).with(pageable);

        List<MediaFile> files = mongoTemplate.find(query, MediaFile.class);
        long total = mongoTemplate.count(Query.of(query).limit(-1).skip(-1), MediaFile.class);

        List<MediaResponse> responseList = files.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        Page<MediaResponse> pageResult =
                new PageImpl<>(responseList, pageable, total);

        return new PagedResponse<>(
                pageResult.getContent(),
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }

    // ---------------------------
    // Soft delete (evict caches)
    // ---------------------------
    
    // @CacheEvict(value = {"mediaFiles", "workspaceMedia"}, key = "#fileId", allEntries = true)
    @Caching(evict = {
    @CacheEvict(value = CacheKeys.MEDIA, key = "#fileId + ':' + #userId"),
    @CacheEvict(value = CacheKeys.WORKSPACE_MEDIA, allEntries = true)
})
    public void deleteFile(String fileId, UUID userId) {
        MediaFile file = getFile(fileId, userId);
        validateRole(file.getWorkspaceId(), userId, "OWNER", "ADMIN");

        file.setDeleted(true);
        mediaRepository.save(file);
    }

    // ---------------------------
    // Restore file (evict caches)
    // ---------------------------
    // @CacheEvict(value = {"mediaFiles", "workspaceMedia"}, key = "#fileId", allEntries = true)
    @Caching(evict = {
    @CacheEvict(value = CacheKeys.MEDIA, key = "#fileId + ':' + #userId"),
    @CacheEvict(value = CacheKeys.WORKSPACE_MEDIA, allEntries = true)
})
    public void restoreFile(String fileId, UUID userId) {
        MediaFile file = mediaRepository
                .findByIdAndOwnerId(fileId, userId)
                .orElseThrow(() -> new MediaNotFoundException("File not found"));

        file.setDeleted(false);
        mediaRepository.save(file);
    }

    // ---------------------------
    // Permanently delete file
    // ---------------------------
    @CacheEvict(value = {"mediaFiles", "workspaceMedia"}, key = "#file.id", allEntries = true)
    public void permanentDelete(MediaFile file) {
        File f = new File(file.getStoragePath());
        if (f.exists()) f.delete();
        mediaRepository.delete(file);
    }

    // ---------------------------
    // Download file (no cache)
    // ---------------------------
    public InputStreamResource downloadFile(String fileId, UUID userId) throws IOException {
        MediaFile mediaFile = getFile(fileId, userId);
        if (mediaFile.isDeleted()) throw new MediaNotFoundException("File is deleted");

        File file = new File(mediaFile.getStoragePath());
        if (!file.exists()) throw new MediaNotFoundException("File not found on disk");

        return new InputStreamResource(new FileInputStream(file));
    }

    // ---------------------------
    // Update metadata (evict cache)
    // ---------------------------
    @CacheEvict(value = {"mediaFiles", "workspaceMedia"}, key = "#file.id", allEntries = true)
    public MediaFile updateMetadata(MediaFile file, Map<String, String> updates) {
        if (updates.containsKey("fileName")) file.setFileName(updates.get("fileName"));
        if (updates.containsKey("description")) file.setDescription(updates.get("description"));
        return mediaRepository.save(file);
    }

    // ---------------------------
    // Search files (cached)
    // ---------------------------
    @Cacheable(
            value = "workspaceMedia",
            key = "'search:' + #workspaceId.toString() + ':' + #userId.toString() + ':' + #pageable.pageNumber + ':' + #pageable.pageSize",
            sync=true
    )
    public PagedResponse<MediaResponse> searchFiles(
            String query,
            UUID workspaceId,
            UUID userId,
            Pageable pageable) {

        validateWorkspace(workspaceId, userId);

        Page<MediaFile> page =
                mediaRepository
                        .findByWorkspaceIdAndOwnerIdAndFileNameContainingIgnoreCaseAndDeletedFalse(
                                workspaceId, userId,
                                query == null ? "" : query,
                                pageable);

        List<MediaResponse> content =
                page.getContent()
                        .stream()
                        .map(this::mapToResponse)
                        .toList();

        return new PagedResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }

    // ---------------------------
    // Helper: Validate workspace access
    // ---------------------------
    private void validateWorkspace(UUID workspaceId, UUID userId) {
        workspaceService.getWorkspaceById(authService.getCurrentUser(), workspaceId);
    }

    // ---------------------------
    // Helper: Validate user role
    // ---------------------------
    private void validateRole(UUID workspaceId, UUID userId, String... allowedRoles) {
        String role = workspaceService.getUserRole(workspaceId, userId);
        for (String allowed : allowedRoles) {
            if (allowed.equalsIgnoreCase(role)) return;
        }
        throw new AccessDeniedException("Insufficient permissions. Your role: " + role);
    }

    private MediaResponse mapToResponse(MediaFile file) {
    return new MediaResponse(
            file.getId(),
            file.getFileName(),
            file.getFileType(),
            file.getWorkspaceId(),
            file.getOwnerId(),
            file.getSize(),
            file.getDescription(),
            file.getTags(), 
            file.getCreatedAt() != null ? file.getCreatedAt().toString() : null,
            file.getUpdatedAt() != null ? file.getUpdatedAt().toString() : null,
            file.isDeleted()
    );
}

// ---------------------------
// List deleted files
// ---------------------------
public PagedResponse<MediaResponse> listDeletedFiles(
            UUID workspaceId,
            UUID userId,
            Pageable pageable) {

        Page<MediaFile> page =
                mediaRepository
                        .findByWorkspaceIdAndOwnerIdAndDeletedTrue(
                                workspaceId, userId, pageable);

        List<MediaResponse> content =
                page.getContent()
                        .stream()
                        .map(this::mapToResponse)
                        .toList();

        return new PagedResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }
// ---------------------------
// Get file entity (internal use)
// ---------------------------
public MediaFile getFileEntity(String fileId, UUID userId) {
    return mediaRepository
            .findByIdAndOwnerIdAndDeletedFalse(fileId, userId)
            .orElseThrow(() ->
                    new MediaNotFoundException("File not found"));
}

public void permanentDelete(String fileId, UUID userId) {

    MediaFile file = mediaRepository.findById(fileId)
            .orElseThrow(() -> new RuntimeException("File not found"));

    if (!file.getOwnerId().equals(userId)) {
        throw new RuntimeException("Unauthorized access");
    }

    mediaRepository.delete(file);
}

    

    public PagedResponse<MediaResponse> searchFilesByKeyword(
        UUID workspaceId,
        UUID userId,
        String keyword,
        Pageable pageable) {

    // Validate workspace access
    workspaceService.validateWorkspaceAccess(workspaceId, userId);

     Page<MediaFile> page = mediaRepository.findByWorkspaceIdAndFileNameContainingIgnoreCaseAndDeletedFalse(workspaceId, keyword, pageable);
        List<MediaResponse> content = page.getContent().stream()
                .map(MediaMapper::toResponse)
                .collect(Collectors.toList());

    return new PagedResponse<>(
            content,
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages()
    );
}


}
