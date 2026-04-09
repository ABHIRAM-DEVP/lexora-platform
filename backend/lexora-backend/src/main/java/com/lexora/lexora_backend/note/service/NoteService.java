package com.lexora.lexora_backend.note.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.common.constants.CacheKeys;
import com.lexora.lexora_backend.common.dto.PagedResponse;
import com.lexora.lexora_backend.common.exception.ResourceNotFoundException;
import com.lexora.lexora_backend.note.dto.NoteResponse;
import com.lexora.lexora_backend.note.entity.Note;
import com.lexora.lexora_backend.note.mapper.NoteMapper;
import com.lexora.lexora_backend.note.repository.NoteRepository;
import com.lexora.lexora_backend.workspace.entity.Workspace;
import com.lexora.lexora_backend.workspace.service.WorkspaceService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NoteService {

    private final NoteRepository noteRepository;
    private final WorkspaceService workspaceService;

    // ---------------------------
    // Create Note
    // ---------------------------
    @CacheEvict(value = CacheKeys.WORKSPACE_NOTES, allEntries = true)
    public NoteResponse createNote(
            UUID userId,
            String title,
            String content,
            UUID workspaceId) {

        Workspace workspace =
                workspaceService.validateWorkspaceAccess(workspaceId, userId);

        Note note = new Note();
        note.setTitle(title);
        note.setContent(content);
        note.setWorkspaceId(workspace.getId());
        note.setAuthorId(userId);
        note.setCreatedAt(Instant.now());
        note.setDeleted(false);

        return NoteMapper.toResponse(
                noteRepository.save(note)
        );
    }

    // ---------------------------
    // List Notes (cached)
    // ---------------------------
    @Cacheable(
            value = CacheKeys.WORKSPACE_NOTES,
            key = "#workspaceId + ':' + #userId + ':' + #pageable.pageNumber + ':' + #pageable.pageSize",
            sync=true
    )
    public PagedResponse<NoteResponse> listNotes(
            UUID workspaceId,
            UUID userId,
            Pageable pageable) {

        workspaceService.validateWorkspaceAccess(workspaceId, userId);

        Page<Note> page =
                noteRepository.findByWorkspaceIdAndDeletedFalse(
                        workspaceId,
                        pageable
                );

        List<NoteResponse> content =
                page.getContent()
                        .stream()
                        .map(NoteMapper::toResponse)
                        .collect(Collectors.toList());

        return new PagedResponse<>(
        content,
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages()
);

    }

    // ---------------------------
    // Get Note (cached)
    // ---------------------------
    @Cacheable(
        value = CacheKeys.NOTE,
        key = "#noteId + ':' + #userId",
        sync=true
)
    public NoteResponse getNoteById(
            UUID noteId,
            UUID userId) {

        Note note = noteRepository.findById(noteId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Note not found"));

        if (note.isDeleted())
            throw new ResourceNotFoundException("Note deleted");

        workspaceService.validateWorkspaceAccess(
        note.getWorkspaceId(),
        userId
);

        return NoteMapper.toResponse(note);
    }

    // ---------------------------
    // Update Note
    // ---------------------------
    @Caching(evict = {
            @CacheEvict(value = CacheKeys.NOTE,
                    key = "#noteId + ':' + #userId"),
            @CacheEvict(value = CacheKeys.WORKSPACE_NOTES,
                    allEntries = true)
    })
    public NoteResponse updateNote(
            UUID noteId,
            UUID userId,
            String title,
            String content) {

        Note note = noteRepository.findById(noteId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Note not found"));

        workspaceService.validateWorkspaceAccess(
                note.getWorkspaceId(),
                userId
        );

        note.setTitle(title);
        note.setContent(content);
        note.setUpdatedAt(Instant.now());

        return NoteMapper.toResponse(
                noteRepository.save(note)
        );
    }

    // ---------------------------
    // Soft Delete
    // ---------------------------
    @Caching(evict = {
            @CacheEvict(value = CacheKeys.NOTE,
                    key = "#noteId + ':' + #userId"),
            @CacheEvict(value = CacheKeys.WORKSPACE_NOTES,
                    allEntries = true)
    })
    public void deleteNote(UUID noteId, UUID userId) {

        Note note = noteRepository.findById(noteId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Note not found"));

        workspaceService.validateWorkspaceAccess(
                note.getWorkspaceId(),
                userId
        );

        note.setDeleted(true);
        note.setDeletedAt(Instant.now());

        noteRepository.save(note);
    }

    // ---------------------------
    // Cache Preload (stub method)
    // ---------------------------
    public void preloadActiveWorkspaces() {
        // This method is intended for cache warming on startup
        // Implementation can be added as needed
        log.info("Preloading active workspaces into cache...");
    }
}
