package com.lexora.lexora_backend.note.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lexora.lexora_backend.note.dto.CreateNoteRequest;
import com.lexora.lexora_backend.note.entity.Note;
import com.lexora.lexora_backend.note.service.NoteService;
import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.user.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;
    private final UserService userService;

    // ---------- helper ----------
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        return userService.getByUsername(auth.getName());
    }

    // ---------- CREATE ----------
    @PostMapping
public ResponseEntity<?> createNote(
        @Valid @RequestBody CreateNoteRequest request
) {
    User user = getCurrentUser();

    Note note = noteService.createNote(
            user,
            request.getTitle(),
            request.getContent(),
            request.getWorkspaceId()
    );

    return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(note);
}


    // ---------- LIST ----------
    @GetMapping
    public ResponseEntity<List<Note>> getNotes(
            @RequestParam(required = false) UUID workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        User user = getCurrentUser();
        return ResponseEntity.ok(
                noteService.getNotes(user, workspaceId, page, size)
        );
    }

    // ---------- GET ONE ----------
    @GetMapping("/{id}")
    public ResponseEntity<Note> getNote(@PathVariable UUID id) {
        User user = getCurrentUser();
        return ResponseEntity.ok(noteService.getNoteById(user, id));
    }

    // ---------- UPDATE ----------
    @PutMapping("/{id}")
    public ResponseEntity<Note> updateNote(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {

        User user = getCurrentUser();
        return ResponseEntity.ok(
                noteService.updateNote(user, id, body.get("title"), body.get("content"))
        );
    }

    // ---------- DELETE ----------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(@PathVariable UUID id) {
        User user = getCurrentUser();
        noteService.deleteNote(user, id);
        return ResponseEntity.ok(Map.of("message", "Note deleted"));
    }
}
