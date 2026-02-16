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
import com.lexora.lexora_backend.note.dto.CreateNoteRequest;
import com.lexora.lexora_backend.note.dto.NoteResponse;
import com.lexora.lexora_backend.note.service.NoteService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
@Slf4j
public class NoteController {

    private final NoteService noteService;
    private final AuthService authService;

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

        } catch (Exception e) {
            log.error("Error creating note", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // 📄 List notes (pagination)
    @GetMapping("/list/{workspaceId}")
    public ResponseEntity<PagedResponse<NoteResponse>> listNotes(
            @PathVariable UUID workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        UUID userId = authService.getCurrentUser().getId();
        Pageable pageable = PageRequest.of(page, size);

        PagedResponse<NoteResponse> response =
                noteService.listNotes(workspaceId, userId, pageable);

        return ResponseEntity.ok(response);
    }

    // 📄 Get single note
    @GetMapping("/{noteId}")
    public ResponseEntity<NoteResponse> getNote(
            @PathVariable UUID noteId) {

        UUID userId = authService.getCurrentUser().getId();
        return ResponseEntity.ok(
                noteService.getNoteById(noteId, userId)
        );
    }

    // ✏ Update note
    @PutMapping("/{noteId}")
    public ResponseEntity<?> updateNote(
            @PathVariable UUID noteId,
            @RequestBody Map<String, String> body) {

        UUID userId = authService.getCurrentUser().getId();

        NoteResponse updated =
                noteService.updateNote(
                        noteId,
                        userId,
                        body.get("title"),
                        body.get("content")
                );

        return ResponseEntity.ok(updated);
    }

    // 🗑 Soft delete
    @DeleteMapping("/{noteId}")
    public ResponseEntity<?> deleteNote(
            @PathVariable UUID noteId) {

        UUID userId = authService.getCurrentUser().getId();
        noteService.deleteNote(noteId, userId);

        return ResponseEntity.ok(
                Map.of("message", "Note deleted successfully")
        );
    }
}
