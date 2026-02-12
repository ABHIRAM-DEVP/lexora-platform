package com.lexora.lexora_backend.media.controller;

import java.net.MalformedURLException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.lexora.lexora_backend.auth.service.AuthService;
import com.lexora.lexora_backend.common.exception.MediaNotFoundException;
import com.lexora.lexora_backend.common.util.SecurityUtils;
import com.lexora.lexora_backend.media.document.MediaFile;
import com.lexora.lexora_backend.media.dto.MediaFileResponse;
import com.lexora.lexora_backend.media.dto.UploadFileRequest;
import com.lexora.lexora_backend.media.mapper.MediaMapper;
import com.lexora.lexora_backend.media.repository.MediaRepository;
import com.lexora.lexora_backend.media.service.MediaService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
@Slf4j
public class MediaController {

    private final MediaService mediaService;
    private final MediaRepository mediaRepository;
    private final AuthService authService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    // 📤 Upload file
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("workspaceId") UUID workspaceId) {
        try {
            UUID userId = authService.getCurrentUser().getId();
            UploadFileRequest request = new UploadFileRequest();
            request.setWorkspaceId(workspaceId);

            MediaFile savedFile = mediaService.uploadFile(file, request, userId);

            return ResponseEntity.ok(Map.of(
                    "message", "File uploaded successfully",
                    "fileId", savedFile.getId(),
                    "fileName", savedFile.getFileName(),
                    "workspaceId", savedFile.getWorkspaceId()
            ));
        } catch (Exception e) {
            log.error("File upload error: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // 📄 List files (with optional pagination)
    @GetMapping("/list/{workspaceId}")
public ResponseEntity<?> listFiles(
        @PathVariable UUID workspaceId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String fileType,
        @RequestParam(required = false) String from,
        @RequestParam(required = false) String to) {

    UUID userId = authService.getCurrentUser().getId();
    Pageable pageable = PageRequest.of(page, size);

    // ✅ Convert String → LocalDateTime
    LocalDateTime fromDate = null;
    LocalDateTime toDate = null;

    if (from != null && !from.isBlank()) {
        fromDate = LocalDateTime.parse(from);
    }

    if (to != null && !to.isBlank()) {
        toDate = LocalDateTime.parse(to);
    }

    Page<MediaFile> filesPage = mediaService.listFilesFiltered(
            workspaceId,
            userId,
            keyword,
            fileType,
            fromDate,   // ✅ Now correct type
            toDate,     // ✅ Now correct type
            pageable);

    List<MediaFileResponse> response = filesPage.stream()
            .map(this::mapToResponse)
            .toList();

    return ResponseEntity.ok(Map.of(
            "content", response,
            "page", filesPage.getNumber(),
            "size", filesPage.getSize(),
            "totalElements", filesPage.getTotalElements(),
            "totalPages", filesPage.getTotalPages()
    ));
}



    // 🗑 Soft delete file
    @DeleteMapping("/{fileId}")
    public ResponseEntity<?> deleteFile(@PathVariable String fileId) {
        UUID userId = authService.getCurrentUser().getId();
        mediaService.deleteFile(fileId, userId);
        return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
    }

    // ⬇ Download file
    @GetMapping("/{fileId}")
public ResponseEntity<Resource> downloadFile(@PathVariable String fileId) {
    try {
        UUID userId = authService.getCurrentUser().getId();
        MediaFile mediaFile = mediaService.getFile(fileId, userId);

        // Ensure the file exists on disk
        Path path = Paths.get(mediaFile.getStoragePath());
        if (!Files.exists(path) || !Files.isReadable(path)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(null); // file not found
        }

         // ✅ Fixed null-safety warning by using Objects.requireNonNull
            URI fileUri = java.util.Objects.requireNonNull(path.toUri()); 
            Resource resource = new UrlResource(fileUri);

        // Detect content type
        String contentType = mediaFile.getFileType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + mediaFile.getFileName() + "\"")
                .body(resource);

    } catch (MediaNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
    } catch (MalformedURLException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
    }
}

    // ✅ Map MediaFile to DTO
//     private MediaFileResponse mapToResponse(MediaFile media) {
//         MediaFileResponse response = new MediaFileResponse();
//         response.setId(media.getId());
//         response.setFileName(media.getFileName());
//         response.setFileType(media.getFileType());
//         response.setSize(media.getSize());
//         response.setWorkspaceId(media.getWorkspaceId());
//         response.setCreatedAt(media.getCreatedAt().toInstant(ZoneOffset.UTC));
//         response.setDownloadUrl("/api/media/" + media.getId());
//         return response;
//     }

    private MediaFileResponse mapToResponse(MediaFile media) {
    MediaFileResponse response = new MediaFileResponse();
    response.setId(media.getId());
    response.setFileName(media.getFileName());
    response.setFileType(media.getFileType());
    response.setSize(media.getSize());
    response.setWorkspaceId(media.getWorkspaceId());
    if (media.getCreatedAt() != null) {
        response.setCreatedAt(media.getCreatedAt().toInstant(ZoneOffset.UTC));
    }
    response.setDownloadUrl("/api/media/" + media.getId());
    return response;
}


// 🟢 Restore soft-deleted file
@PostMapping("/restore/{fileId}")
public ResponseEntity<?> restoreFile(@PathVariable String fileId) {
    UUID userId = SecurityUtils.getCurrentUserId();
    try {
        mediaService.restoreFile(fileId, userId);
        return ResponseEntity.ok(Map.of("message", "File restored successfully"));
    } catch (MediaNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "File not found or access denied"));
    } catch (IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Unexpected server error"));
    }
}

@GetMapping("/deleted/{workspaceId}")
public ResponseEntity<?> listDeletedFiles(
        @PathVariable UUID workspaceId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size) {

    UUID userId = authService.getCurrentUser().getId();
    Pageable pageable = PageRequest.of(page, size);

    Page<MediaFile> deletedFiles = mediaRepository.findByWorkspaceIdAndOwnerIdAndDeletedTrue(workspaceId, userId, pageable);

    List<MediaFileResponse> response = deletedFiles.stream()
            .map(this::mapToResponse)
            .toList();

    return ResponseEntity.ok(Map.of(
            "content", response,
            "page", deletedFiles.getNumber(),
            "size", deletedFiles.getSize(),
            "totalElements", deletedFiles.getTotalElements(),
            "totalPages", deletedFiles.getTotalPages()
    ));
}


@GetMapping("/search")
public ResponseEntity<?> searchFiles(
        @RequestParam String keyword,
        @RequestParam UUID workspaceId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {

    UUID userId = authService.getCurrentUser().getId();
    Pageable pageable = PageRequest.of(page, size);

    Page<MediaFile> result =
            mediaService.searchFiles(keyword, workspaceId, userId, pageable);

    return ResponseEntity.ok(result.map(MediaMapper::toResponse));
}


@DeleteMapping("/permanent/{fileId}")
public ResponseEntity<?> permanentDeleteFile(@PathVariable String fileId) {
    UUID userId = authService.getCurrentUser().getId();
    MediaFile file = mediaService.getFile(fileId, userId);

    if (!file.getOwnerId().equals(userId)) { // Only owner can permanently delete
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "Access denied"));
    }

    mediaService.permanentDelete(file);
    return ResponseEntity.ok(Map.of("message", "File permanently deleted"));
}

@PatchMapping("/{fileId}")
public ResponseEntity<?> updateMetadata(
        @PathVariable String fileId,
        @RequestBody Map<String, String> updates) {

    UUID userId = authService.getCurrentUser().getId();
    MediaFile file = mediaService.getFile(fileId, userId);

    if (!file.getOwnerId().equals(userId)) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "Access denied"));
    }

    if (updates.containsKey("fileName")) file.setFileName(updates.get("fileName"));
    if (updates.containsKey("description")) file.setDescription(updates.get("description"));

    mediaRepository.save(file);
    return ResponseEntity.ok(Map.of("message", "File metadata updated"));
}


@GetMapping("/download/{fileId}")
public ResponseEntity<?> getTemporaryDownloadUrl(@PathVariable String fileId) {
    UUID userId = authService.getCurrentUser().getId();
    MediaFile file = mediaService.getFile(fileId, userId);

    // Generate signed URL (example: using timestamp + token)
    String token = UUID.randomUUID().toString();
    String url = "/api/media/temp-download/" + file.getId() + "?token=" + token;

    // Optionally, store token in cache/DB to validate on actual download
    return ResponseEntity.ok(Map.of("downloadUrl", url));
}






}
