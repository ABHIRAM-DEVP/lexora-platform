package com.lexora.lexora_backend.note.mapper;

import com.lexora.lexora_backend.note.dto.NoteResponse;
import com.lexora.lexora_backend.note.entity.Note;

public class NoteMapper {

    /**
     * Convert Note entity to NoteResponse DTO
     */
    public static NoteResponse toResponse(Note note) {
        return NoteResponse.builder()
                .id(note.getId())
                .title(note.getTitle())
                .content(note.getContent())
                .workspaceId(note.getWorkspace() != null ? note.getWorkspace().getId() : null)
                .ownerId(note.getWorkspace() != null && note.getWorkspace().getOwner() != null
                        ? note.getWorkspace().getOwner().getId() : null)
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .deleted(note.isDeleted())
                .build();
    }

    /**
     * Optional: Convert NoteResponse DTO to Note entity
     * Use carefully: usually only for create/update where mapping from DTO needed
     */
    public static Note toEntity(NoteResponse response) {
        Note note = new Note();
        note.setId(response.getId());
        note.setTitle(response.getTitle());
        note.setContent(response.getContent());
        note.setCreatedAt(response.getCreatedAt());
        note.setUpdatedAt(response.getUpdatedAt());
        note.setDeleted(response.isDeleted());
        return note;
    }
}