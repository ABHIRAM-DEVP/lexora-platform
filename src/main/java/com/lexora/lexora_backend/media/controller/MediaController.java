package com.lexora.lexora_backend.media.controller;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
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
import com.lexora.lexora_backend.common.exception.MediaNotFoundException;
import com.lexora.lexora_backend.common.util.SecurityUtils;
import com.lexora.lexora_backend.media.document.MediaFile;
import com.lexora.lexora_backend.media.dto.MediaFileResponse;
import com.lexora.lexora_backend.media.dto.MediaResponse;
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

    // 📄 List files with filtering + pagination
    @GetMapping("/list/{workspaceId}")
    public ResponseEntity<PagedResponse<MediaResponse>> listFiles(
            @PathVariable UUID workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String fileType,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {

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
    }

    // 🗑 Soft delete file
    @DeleteMapping("/{fileId}")
    public ResponseEntity<?> deleteFile(@PathVariable String fileId) {
        UUID userId = authService.getCurrentUser().getId();
        mediaService.deleteFile(fileId, userId); // ✅ Soft delete
        return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
    }

    // ⬇ Download file
@GetMapping("/download/{fileId}")
    public ResponseEntity<?> downloadFile(@PathVariable String fileId) {

        try {
            UUID userId = authService.getCurrentUser().getId();

            MediaFile mediaFile =
                    mediaService.getFileEntity(fileId, userId);

            InputStreamResource resource =
                    mediaService.downloadFile(fileId, userId);

            return ResponseEntity.ok()
                    .contentType(
                            MediaType.parseMediaType(
                                    mediaFile.getFileType()
                            )
                    )
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" +
                                    mediaFile.getFileName() + "\"")
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // 🔄 Restore soft-deleted file
    @PostMapping("/restore/{fileId}")
    public ResponseEntity<?> restoreFile(@PathVariable String fileId) {
        UUID userId = SecurityUtils.getCurrentUserId(); // ✅ consistent access
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

    // 🔍 List deleted files
    // 🔍 List deleted files
    @GetMapping("/deleted/{workspaceId}")
    public ResponseEntity<?> listDeletedFiles(
            @PathVariable UUID workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        UUID userId = authService.getCurrentUser().getId();
        Pageable pageable = PageRequest.of(page, size);

        PagedResponse<MediaResponse> response =
        mediaService.listDeletedFiles(workspaceId, userId, pageable);

return ResponseEntity.ok(response);

    }
    // 🔍 Search files by keyword
    @GetMapping("/search")
    public ResponseEntity<?> searchFiles(
            @RequestParam String keyword,
            @RequestParam UUID workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        UUID userId = authService.getCurrentUser().getId();
        Pageable pageable = PageRequest.of(page, size);

        PagedResponse<MediaResponse> response =
            mediaService.searchFilesByKeyword(workspaceId, userId, keyword, pageable);

        return ResponseEntity.ok(response);

    }

    // ❌ Permanent delete (owner-only)
    @DeleteMapping("/permanent/{id}")
public ResponseEntity<?> permanentDelete(@PathVariable String id) {

    UUID userId = authService.getCurrentUser().getId();
    mediaService.permanentDelete(id, userId);

    return ResponseEntity.ok(Map.of(
            "message", "File permanently deleted"
    ));
}


    // 📝 Update metadata
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

    // 🔗 Temporary signed download URL
    @GetMapping("/download-url/{fileId}")
    public ResponseEntity<?> getTemporaryDownloadUrl(@PathVariable String fileId) {
        UUID userId = authService.getCurrentUser().getId();
        MediaFile file = mediaService.getFile(fileId, userId);

        String token = UUID.randomUUID().toString();
        String url = "/api/media/temp-download/" + file.getId() + "?token=" + token;

        return ResponseEntity.ok(Map.of("downloadUrl", url));
    }

    // 🔹 Mapper: MediaFile → DTO
    private MediaFileResponse mapToResponse(MediaFile media) {
        MediaFileResponse response = new MediaFileResponse();
        response.setId(media.getId());
        response.setFileName(media.getFileName());
        response.setFileType(media.getFileType());
        response.setSize(media.getSize());
        response.setWorkspaceId(media.getWorkspaceId());
        response.setDescription(media.getDescription());
        if (media.getCreatedAt() != null) {
            response.setCreatedAt(media.getCreatedAt().toInstant(ZoneOffset.UTC));
        }
        response.setDownloadUrl("/api/media/" + media.getId());
        return response;
    }
}
