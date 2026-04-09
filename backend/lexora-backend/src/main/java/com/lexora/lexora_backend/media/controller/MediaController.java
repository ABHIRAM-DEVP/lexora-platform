package com.lexora.lexora_backend.media.controller;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.lexora.lexora_backend.auth.service.AuthService;
import com.lexora.lexora_backend.common.dto.PagedResponse;
import com.lexora.lexora_backend.common.exception.AccessDeniedException;
import com.lexora.lexora_backend.common.exception.ForbiddenException;
import com.lexora.lexora_backend.common.exception.MediaNotFoundException;
import com.lexora.lexora_backend.common.exception.ResourceNotFoundException;
import com.lexora.lexora_backend.common.util.SecurityUtils;
import com.lexora.lexora_backend.media.document.MediaFile;
import com.lexora.lexora_backend.media.dto.MediaResponse;
import com.lexora.lexora_backend.media.dto.UploadFileRequest;
import com.lexora.lexora_backend.media.repository.MediaRepository;
import com.lexora.lexora_backend.media.service.MediaService;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    private static final Logger log = LoggerFactory.getLogger(MediaController.class);

    private final MediaService mediaService;
    private final MediaRepository mediaRepository;
    private final AuthService authService;

    public MediaController(MediaService mediaService, MediaRepository mediaRepository, AuthService authService) {
        this.mediaService = mediaService;
        this.mediaRepository = mediaRepository;
        this.authService = authService;
    }

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final String ERROR_KEY = "error";
    private static final String DETAILS_KEY = "details";


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
        } catch (IllegalArgumentException e) {
            log.warn("Invalid media upload request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(ERROR_KEY, e.getMessage()));
        } catch (ForbiddenException | AccessDeniedException e) {
            log.warn("Access denied during upload to workspace {}: {}", workspaceId, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(ERROR_KEY, e.getMessage()));
        } catch (Exception e) {
            log.error("File upload error: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(ERROR_KEY, "Failed to upload file", DETAILS_KEY, e.getMessage()));
        }
    }

    // 📄 List files with filtering + pagination
    @GetMapping("/list/{workspaceId}")
    public ResponseEntity<?> listFiles(
            @PathVariable UUID workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String fileType,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        try {
            UUID userId = authService.getCurrentUser().getId();
            Pageable pageable = PageRequest.of(page, size);

            LocalDateTime fromDate = null;
            LocalDateTime toDate = null;

            if (from != null && !from.isBlank())
                fromDate = LocalDateTime.parse(from, DATE_FORMATTER);

            if (to != null && !to.isBlank())
                toDate = LocalDateTime.parse(to, DATE_FORMATTER);

            PagedResponse<MediaResponse> response =
                    mediaService.listFilesFiltered(
                            workspaceId,
                            userId,
                            keyword,
                            fileType,
                            fromDate,
                            toDate,
                            pageable
                    );

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Bad request listing media for workspace {}: {}", workspaceId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(ERROR_KEY, e.getMessage()));
        } catch (ForbiddenException | AccessDeniedException e) {
            log.warn("Access denied listing media for workspace {}: {}", workspaceId, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(ERROR_KEY, e.getMessage()));
        } catch (Exception e) {
            log.error("Error listing media for workspace {}: {}", workspaceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(ERROR_KEY, "Failed to list media", DETAILS_KEY, e.getMessage()));
        }
    }

    // 🗑 Soft delete file
    @DeleteMapping("/{fileId}")
    public ResponseEntity<?> deleteFile(@PathVariable String fileId) {
        try {
            UUID userId = authService.getCurrentUser().getId();
            mediaService.deleteFile(fileId, userId);
            return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
        } catch (MediaNotFoundException e) {
            log.warn("Media file not found for delete: {}", fileId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(ERROR_KEY, e.getMessage()));
        } catch (Exception e) {
            log.error("Error deleting media file {}: {}", fileId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(ERROR_KEY, "Failed to delete file", DETAILS_KEY, e.getMessage()));
        }
    }

    // ⬇ Download file
    @GetMapping("/download/{fileId}")
    public ResponseEntity<?> downloadFile(@PathVariable String fileId) {
        try {
            UUID userId = authService.getCurrentUser().getId();

            MediaFile mediaFile = mediaService.getFileEntity(fileId, userId);
            InputStreamResource resource = mediaService.downloadFile(fileId, userId);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(mediaFile.getFileType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + mediaFile.getFileName() + "\"")
                    .body(resource);
        } catch (MediaNotFoundException e) {
            log.warn("Media file not found for download: {}", fileId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(ERROR_KEY, e.getMessage()));
        } catch (Exception e) {
            log.error("Error downloading media file {}: {}", fileId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(ERROR_KEY, "Failed to download file", DETAILS_KEY, e.getMessage()));
        }
    }

    // 🔄 Restore soft-deleted file
    @PostMapping("/restore/{fileId}")
    public ResponseEntity<?> restoreFile(@PathVariable String fileId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        try {
            mediaService.restoreFile(fileId, userId);
            return ResponseEntity.ok(Map.of("message", "File restored successfully"));
        } catch (MediaNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(ERROR_KEY, "File not found or access denied"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(ERROR_KEY, e.getMessage()));
        } catch (Exception e) {
            log.error("Error restoring media file {}: {}", fileId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(ERROR_KEY, "Unexpected server error", DETAILS_KEY, e.getMessage()));
        }
    }

    // 🔍 List deleted files
    @GetMapping("/deleted/{workspaceId}")
    public ResponseEntity<?> listDeletedFiles(
            @PathVariable UUID workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            UUID userId = authService.getCurrentUser().getId();
            Pageable pageable = PageRequest.of(page, size);

            PagedResponse<MediaResponse> response =
                    mediaService.listDeletedFiles(workspaceId, userId, pageable);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error listing deleted media for workspace {}: {}", workspaceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(ERROR_KEY, "Failed to list deleted media", DETAILS_KEY, e.getMessage()));
        }
    }

    // 🔍 Search files by keyword
    @GetMapping("/search")
    public ResponseEntity<?> searchFiles(
            @RequestParam String keyword,
            @RequestParam UUID workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            UUID userId = authService.getCurrentUser().getId();
            Pageable pageable = PageRequest.of(page, size);

            PagedResponse<MediaResponse> response =
                    mediaService.searchFilesByKeyword(workspaceId, userId, keyword, pageable);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Bad search request for workspace {}: {}", workspaceId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(ERROR_KEY, e.getMessage()));
        } catch (Exception e) {
            log.error("Error searching media for workspace {}: {}", workspaceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(ERROR_KEY, "Failed to search media", DETAILS_KEY, e.getMessage()));
        }
    }

    // ❌ Permanent delete (owner-only)
    @DeleteMapping("/permanent/{id}")
    public ResponseEntity<?> permanentDelete(@PathVariable String id) {
        try {
            UUID userId = authService.getCurrentUser().getId();
            mediaService.permanentDelete(id, userId);
            return ResponseEntity.ok(Map.of("message", "File permanently deleted"));
        } catch (MediaNotFoundException e) {
            log.warn("Media file not found for permanent delete: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(ERROR_KEY, e.getMessage()));
        } catch (Exception e) {
            log.error("Error permanently deleting media file {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(ERROR_KEY, "Failed to permanently delete file", DETAILS_KEY, e.getMessage()));
        }
    }

    // 📝 Update metadata
    @PatchMapping("/{fileId}")
    public ResponseEntity<?> updateMetadata(
            @PathVariable String fileId,
            @RequestBody Map<String, String> updates) {
        try {
            UUID userId = authService.getCurrentUser().getId();
            MediaFile file = mediaService.getFile(fileId, userId);

            if (!file.getOwnerId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of(ERROR_KEY, "Access denied"));
            }

            if (updates.containsKey("fileName")) file.setFileName(updates.get("fileName"));
            if (updates.containsKey("description")) file.setDescription(updates.get("description"));

            mediaRepository.save(file);
            return ResponseEntity.ok(Map.of("message", "File metadata updated"));
        } catch (MediaNotFoundException e) {
            log.warn("Media file not found for metadata update: {}", fileId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(ERROR_KEY, e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating metadata for media file {}: {}", fileId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(ERROR_KEY, "Failed to update metadata", DETAILS_KEY, e.getMessage()));
        }
    }

    // 🔗 Temporary signed download URL
    @GetMapping("/download-url/{fileId}")
    public ResponseEntity<?> getTemporaryDownloadUrl(@PathVariable String fileId) {
        try {
            UUID userId = authService.getCurrentUser().getId();
            MediaFile file = mediaService.getFile(fileId, userId);

            String token = UUID.randomUUID().toString();
            String url = "/api/media/temp-download/" + file.getId() + "?token=" + token;

            return ResponseEntity.ok(Map.of("downloadUrl", url));
        } catch (MediaNotFoundException e) {
            log.warn("Media file not found for temporary download URL: {}", fileId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(ERROR_KEY, e.getMessage()));
        } catch (Exception e) {
            log.error("Error generating temporary download URL for media file {}: {}", fileId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(ERROR_KEY, "Failed to generate download URL", DETAILS_KEY, e.getMessage()));
        }
    }
}
