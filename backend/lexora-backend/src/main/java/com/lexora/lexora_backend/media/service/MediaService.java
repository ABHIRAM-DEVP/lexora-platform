
package com.lexora.lexora_backend.media.service;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Criteria;

import com.lexora.lexora_backend.auth.service.AuthService;
import com.lexora.lexora_backend.common.exception.AccessDeniedException;
import com.lexora.lexora_backend.common.exception.FileSizeExceededException;
import com.lexora.lexora_backend.common.exception.InvalidFileTypeException;
import com.lexora.lexora_backend.common.exception.MediaNotFoundException;
import com.lexora.lexora_backend.media.document.MediaFile;
import com.lexora.lexora_backend.media.dto.UploadFileRequest;
import com.lexora.lexora_backend.media.repository.MediaRepository;
import com.lexora.lexora_backend.workspace.service.WorkspaceService;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.apache.tika.Tika;

import com.lexora.lexora_backend.workspace.repository.WorkspaceMemberRepository;

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

    /**
     * Upload file to workspace
     */
    public MediaFile uploadFile(MultipartFile file, UploadFileRequest request, UUID userId)
            throws IOException {

            Tika tika = new Tika();
String detectedType = tika.detect(file.getInputStream());

if (!(detectedType.startsWith("image/") || detectedType.equals("application/pdf"))) {
    throw new InvalidFileTypeException("Invalid file content type");
}

        // ✅ Validate file
        if (file == null || file.isEmpty())
            throw new InvalidFileTypeException("Uploaded file is empty");

        String fileType = file.getContentType();
        if (fileType == null ||
            !(fileType.startsWith("image/") || fileType.equals("application/pdf"))) {
            throw new InvalidFileTypeException("Only images and PDFs allowed");
        }

        if (file.getSize() > MAX_SIZE)
            throw new FileSizeExceededException("File exceeds 10MB");

        validateRole(request.getWorkspaceId(), userId, "OWNER", "ADMIN", "MEMBER");


        // ✅ Prepare storage directories
        File rootDir = new File(storagePath);
        if (!rootDir.exists()) rootDir.mkdirs();

        File workspaceDir = new File(rootDir, request.getWorkspaceId().toString());
        if (!workspaceDir.exists()) workspaceDir.mkdirs();

        // ✅ Store file
        String storedFileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        File destination = new File(workspaceDir, storedFileName);
        file.transferTo(destination);

        // ✅ Save media metadata
        MediaFile mediaFile = new MediaFile();
        mediaFile.setFileName(file.getOriginalFilename());
        mediaFile.setFileType(fileType);
        mediaFile.setStoragePath(destination.getAbsolutePath());
        mediaFile.setWorkspaceId(request.getWorkspaceId());
        mediaFile.setOwnerId(userId);
        mediaFile.setSize(file.getSize());
        mediaFile.setDeleted(false);

        return mediaRepository.save(mediaFile);
    }

    /**
     * Get a single file (only non-deleted)
     */
    public MediaFile getFile(String fileId, UUID userId) {
        return mediaRepository
                .findByIdAndOwnerIdAndDeletedFalse(fileId, userId)
                .orElseThrow(() -> new MediaNotFoundException("File not found"));
    }

    /**
     * List all files in a workspace (non-deleted)
     */
    public Page<MediaFile> listFiles(UUID workspaceId, UUID userId, Pageable pageable) {
        validateWorkspace(workspaceId, userId);
        return mediaRepository
                .findByWorkspaceIdAndOwnerIdAndDeletedFalse(workspaceId, userId, pageable);
    }

    /**
     * List files with filters
     */
    public Page<MediaFile> listFilesFiltered(
        UUID workspaceId,
        UUID userId,
        String keyword,
        String fileType,
        LocalDateTime fromDate,
        LocalDateTime toDate,
        Pageable pageable) {

    Criteria criteria = Criteria.where("workspaceId").is(workspaceId)
                                .and("ownerId").is(userId)
                                .and("deleted").is(false);

    if (keyword != null && !keyword.isBlank()) {
        criteria = criteria.and("fileName").regex(keyword, "i");
    }
    if (fileType != null) {
        criteria = criteria.and("fileType").is(fileType);
    }
    if (fromDate != null) {
        criteria = criteria.and("createdAt").gte(fromDate);
    }
    if (toDate != null) {
        criteria = criteria.and("createdAt").lte(toDate);
    }

    Query query = new Query(criteria).with(pageable);
    List<MediaFile> files = mongoTemplate.find(query, MediaFile.class);
    long total = mongoTemplate.count(query.skip(0).limit(0), MediaFile.class);

    return new PageImpl<>(files, pageable, total);
}
    /**
     * Soft delete a file
     */
    public void deleteFile(String fileId, UUID userId) {
        MediaFile file = getFile(fileId, userId);
validateRole(file.getWorkspaceId(), userId, "OWNER", "ADMIN");

        file.setDeleted(true);
        mediaRepository.save(file);
    }

    /**
     * Restore a soft-deleted file
     */
    public void restoreFile(String fileId, UUID userId) {
        
        MediaFile file = mediaRepository
                .findByIdAndOwnerId(fileId, userId)
                .orElseThrow(() -> new MediaNotFoundException("File not found"));

        file.setDeleted(false);
        mediaRepository.save(file);
    }

    /**
     * Search files in workspace by name
     */
    public Page<MediaFile> searchFiles(String query, UUID workspaceId, UUID userId, Pageable pageable) {
        validateWorkspace(workspaceId, userId);
        if (query == null) query = "";
        return mediaRepository
                .findByWorkspaceIdAndOwnerIdAndFileNameContainingIgnoreCaseAndDeletedFalse(
                        workspaceId, userId, query, pageable);
    }

    /**
     * Validate workspace access
     */
    private void validateWorkspace(UUID workspaceId, UUID userId) {
        // Throws exception if workspace doesn't exist or user has no access
        workspaceService.getWorkspaceById(authService.getCurrentUser(), workspaceId);
    }

    /**
     * Permanently delete a file from disk and DB
     */
    public void permanentDelete(MediaFile file) {
        // Delete from disk 
        File f = new File(file.getStoragePath());
        if (f.exists()) f.delete();

        // Delete from DB
        mediaRepository.delete(file);
    }

    public InputStreamResource downloadFile(String fileId, UUID userId) throws IOException {

    MediaFile mediaFile = getFile(fileId, userId);

    if (mediaFile.isDeleted()) {
        throw new MediaNotFoundException("File is deleted");
    }

    File file = new File(mediaFile.getStoragePath());

    if (!file.exists()) {
        throw new MediaNotFoundException("File not found on disk");
    }

    return new InputStreamResource(new FileInputStream(file));
}

private void validateRole(UUID workspaceId, UUID userId, String... allowedRoles) {

    String role = workspaceService.getUserRole(workspaceId, userId);

    for (String allowed : allowedRoles) {
        if (allowed.equalsIgnoreCase(role)) {
            return;
        }
    }

    throw new AccessDeniedException("Insufficient permissions. Your role: " + role);
}







}
