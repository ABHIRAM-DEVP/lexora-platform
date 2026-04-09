package com.lexora.lexora_backend.media.document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
@Document(collection = "media_files")
@CompoundIndex(name = "media_workspace_deleted_idx", def = "{'workspaceId': 1, 'deleted': 1}")
@CompoundIndex(name = "media_owner_created_idx", def = "{'ownerId': 1, 'createdAt': -1}")
@CompoundIndex(name = "media_fileName_idx", def = "{'fileName': 1}")
public class MediaFile {

    @Id
    private String id;

    private UUID ownerId;

    @TextIndexed(weight = 5) // 🔍 Full-text search enabled
    private String fileName;

    private String fileType;  
    private String storagePath; 
    private UUID workspaceId;
    private long size;

    @TextIndexed(weight = 3)
    private String description;

    @TextIndexed(weight = 2)
    private List<String> tags;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private LocalDateTime createdAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private LocalDateTime updatedAt;

    private boolean deleted = false; // 🔹 soft delete

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
    public String getStoragePath() { return storagePath; }
    public void setStoragePath(String storagePath) { this.storagePath = storagePath; }
    public UUID getWorkspaceId() { return workspaceId; }
    public void setWorkspaceId(UUID workspaceId) { this.workspaceId = workspaceId; }
    public long getSize() { return size; }
    public void setSize(long size) { this.size = size; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}
