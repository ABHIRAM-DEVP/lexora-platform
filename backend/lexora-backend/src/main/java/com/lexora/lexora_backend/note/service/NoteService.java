package com.lexora.lexora_backend.note.service;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.common.exception.ForbiddenException;
import com.lexora.lexora_backend.common.exception.ResourceNotFoundException;
import com.lexora.lexora_backend.note.entity.Note;
import com.lexora.lexora_backend.note.repository.NoteRepository;
import com.lexora.lexora_backend.workspace.entity.Workspace;
import com.lexora.lexora_backend.workspace.repository.WorkspaceRepository;
import com.lexora.lexora_backend.user.entity.User;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final WorkspaceRepository workspaceRepository;

    // CREATE
    public Note createNote(User user, String title, String content, Long workspaceId) {

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        if (!workspace.getOwner().getId().equals(user.getId())) {
            throw new ForbiddenException("Workspace does not belong to user");
        }

        Note note = new Note();
        note.setTitle(title);
        note.setContent(content);
        note.setWorkspace(workspace);
        note.setCreatedAt(Instant.now());
        note.setDeleted(false);

        return noteRepository.save(note);
    }

    // LIST
    public List<Note> getNotes(User user, Long workspaceId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);

        if (workspaceId != null) {
            Workspace ws = workspaceRepository.findById(workspaceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

            if (!ws.getOwner().getId().equals(user.getId())) {
                throw new ForbiddenException("Access denied");
            }

            return noteRepository.findByWorkspaceAndDeletedFalse(ws, pageable);
        }

        return noteRepository.findByWorkspaceOwnerAndDeletedFalse(user, pageable);
    }

    // GET ONE
    public Note getNoteById(User user, Long noteId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found"));

        if (note.isDeleted()) {
            throw new ResourceNotFoundException("Note deleted");
        }

        if (!note.getWorkspace().getOwner().getId().equals(user.getId())) {
            throw new ForbiddenException("Access denied");
        }

        return note;
    }

    // UPDATE
    public Note updateNote(User user, Long noteId, String title, String content) {
        Note note = getNoteById(user, noteId);
        note.setTitle(title);
        note.setContent(content);
        note.setUpdatedAt(Instant.now());
        return noteRepository.save(note);
    }

    // DELETE (SOFT)
    public void deleteNote(User user, Long noteId) {
        Note note = getNoteById(user, noteId);
        note.setDeleted(true);
        note.setDeletedAt(Instant.now());
        noteRepository.save(note);
    }
}
