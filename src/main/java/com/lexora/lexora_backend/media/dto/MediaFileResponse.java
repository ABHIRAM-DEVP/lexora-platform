package com.lexora.lexora_backend.media.dto;

import lombok.Data;

import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MediaFileResponse {

    private String id;
    private String fileName;
    private String fileType;
    private long size;
    private UUID workspaceId;
        
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant createdAt;

    

    private String downloadUrl;
    private String description; // included for phase 5 enhancements
}
