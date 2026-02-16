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
}
