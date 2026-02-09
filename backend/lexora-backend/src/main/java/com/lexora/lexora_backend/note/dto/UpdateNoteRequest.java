package com.lexora.lexora_backend.note.dto;

import lombok.Data;

@Data
public class UpdateNoteRequest {
    private String title;
    private String content;
}
