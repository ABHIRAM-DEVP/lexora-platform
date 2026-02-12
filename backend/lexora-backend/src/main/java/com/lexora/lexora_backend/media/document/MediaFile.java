package com.lexora.lexora_backend.media.document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "media_files")
public class MediaFile {

    @Id
    private String id;

    @TextIndexed(weight = 5) // 🔍 Full-text search enabled for fileName
    private String fileName;

    private String fileType;  // image/pdf/txt
    private String storagePath; // local path or S3 key
    private UUID workspaceId;
    private UUID ownerId;
    private long size;

    @TextIndexed(weight = 3)
    private String description;

    @TextIndexed(weight = 2)
    private List<String> tags;
    
    @CreatedDate
    private LocalDateTime createdAt = LocalDateTime.now();

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private boolean deleted = false; // soft delete
}
