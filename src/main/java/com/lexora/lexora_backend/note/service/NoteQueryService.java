package com.lexora.lexora_backend.note.service;

import java.util.UUID;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.common.exception.ResourceNotFoundException;
import com.lexora.lexora_backend.note.entity.Note;
import com.lexora.lexora_backend.note.mapper.NoteMapper;
import com.lexora.lexora_backend.note.repository.NoteRepository;
import com.lexora.lexora_backend.note.dto.NoteResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NoteQueryService {

    private final NoteRepository noteRepository;

    /**
     * Read-heavy cacheable query.
     * Key includes userId for RBAC safety.
     */
    @Cacheable(value = "notes", key = "#noteId + ':' + #userId")
    public NoteResponse getCachedNoteById(UUID noteId, UUID userId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found"));

        return NoteMapper.toResponse(note);
    }
}
