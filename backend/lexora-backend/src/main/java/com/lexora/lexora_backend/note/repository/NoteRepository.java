package com.lexora.lexora_backend.note.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.lexora.lexora_backend.note.entity.Note;
import com.lexora.lexora_backend.workspace.entity.Workspace;
import com.lexora.lexora_backend.user.entity.User;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByWorkspaceAndDeletedFalse(Workspace workspace, Pageable pageable);

    List<Note> findByWorkspaceOwnerAndDeletedFalse(User owner, Pageable pageable);
}
