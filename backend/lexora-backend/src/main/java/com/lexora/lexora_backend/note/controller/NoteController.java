package com.lexora.lexora_backend.note.controller;

import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.lexora.lexora_backend.auth.service.AuthService;
import com.lexora.lexora_backend.common.dto.PagedResponse;
import com.lexora.lexora_backend.common.exception.AccessDeniedException;
import com.lexora.lexora_backend.common.exception.ForbiddenException;
import com.lexora.lexora_backend.common.exception.ResourceNotFoundException;
import com.lexora.lexora_backend.note.dto.CreateNoteRequest;
import com.lexora.lexora_backend.note.dto.NoteResponse;
import com.lexora.lexora_backend.note.service.NoteService;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private static final Logger log = LoggerFactory.getLogger(NoteController.class);
    private static final String ERROR_KEY = "error";
    private static final String DETAILS_KEY = "details";

    private final NoteService noteService;
    private final AuthService authService;

    public NoteController(NoteService noteService, AuthService authService) {
        this.noteService = noteService;
        this.authService = authService;
    }


    // 📌 Create note
    @PostMapping
    public ResponseEntity<?> createNote(
            @Valid @RequestBody CreateNoteRequest request) {

        try {
            UUID userId = authService.getCurrentUser().getId();

            NoteResponse response =
                    noteService.createNote(
                            userId,
                            request.getTitle(),
                            request.getContent(),
                            request.getWorkspaceId()
                    );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(response);

        } catch (ResourceNotFoundException e) {
            log.warn("Resource not found while creating note: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(ERROR_KEY, e.getMessage()));
        } catch (ForbiddenException | AccessDeniedException e) {
            log.warn("Access denied while creating note: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(ERROR_KEY, e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating note", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(ERROR_KEY, "Failed to create note", DETAILS_KEY, String.valueOf(e.getMessage())));
        }
    }

    // 📄 List notes (pagination)
    @GetMapping("/list/{workspaceId}")
    public ResponseEntity<?> listNotes(
            @PathVariable UUID workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        try {
            UUID userId = authService.getCurrentUser().getId();
            Pageable pageable = PageRequest.of(page, size);

            PagedResponse<NoteResponse> response =
                    noteService.listNotes(workspaceId, userId, pageable);

            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            log.warn("Resource not found for note list: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(ERROR_KEY, e.getMessage()));
        } catch (ForbiddenException | AccessDeniedException e) {
            log.warn("Access denied for note list: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(ERROR_KEY, e.getMessage()));
        } catch (Exception e) {
            log.error("Error listing notes for workspace {}: {}", workspaceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(ERROR_KEY, "Failed to list notes", DETAILS_KEY, e.getMessage()));
        }
    }

    // 📄 Get single note
    @GetMapping("/{noteId}")
    public ResponseEntity<?> getNote(
            @PathVariable UUID noteId) {
        try {
            UUID userId = authService.getCurrentUser().getId();
            return ResponseEntity.ok(noteService.getNoteById(noteId, userId));
        } catch (ResourceNotFoundException e) {
            log.warn("Note not found: {}", noteId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(ERROR_KEY, e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching note {}: {}", noteId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(ERROR_KEY, "Failed to fetch note", DETAILS_KEY, e.getMessage()));
        }
    }

    // ✏ Update note
    @PutMapping("/{noteId}")
    public ResponseEntity<?> updateNote(
            @PathVariable UUID noteId,
            @RequestBody Map<String, String> body) {
        try {
            if (body == null || body.get("title") == null || body.get("content") == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(ERROR_KEY, "Both title and content are required"));
            }

            UUID userId = authService.getCurrentUser().getId();
            NoteResponse updated =
                    noteService.updateNote(
                            noteId,
                            userId,
                            body.get("title"),
                            body.get("content")
                    );

            return ResponseEntity.ok(updated);
        } catch (ResourceNotFoundException e) {
            log.warn("Note not found for update: {}", noteId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(ERROR_KEY, e.getMessage()));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid note update request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(ERROR_KEY, e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating note {}: {}", noteId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(ERROR_KEY, "Failed to update note", DETAILS_KEY, e.getMessage()));
        }
    }

    // 🗑 Soft delete
    @DeleteMapping("/{noteId}")
    public ResponseEntity<?> deleteNote(
            @PathVariable UUID noteId) {
        try {
            UUID userId = authService.getCurrentUser().getId();
            noteService.deleteNote(noteId, userId);
            return ResponseEntity.ok(Map.of("message", "Note deleted successfully"));
        } catch (ResourceNotFoundException e) {
            log.warn("Note not found for delete: {}", noteId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(ERROR_KEY, e.getMessage()));
        } catch (Exception e) {
            log.error("Error deleting note {}: {}", noteId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(ERROR_KEY, "Failed to delete note", DETAILS_KEY, e.getMessage()));
        }
    }
}
