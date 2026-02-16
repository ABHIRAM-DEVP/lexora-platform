package com.lexora.lexora_backend.note.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.lexora.lexora_backend.note.entity.Note;
import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.workspace.entity.Workspace;

public interface NoteRepository extends JpaRepository<Note, UUID> {

    List<Note> findByWorkspaceAndDeletedFalse(Workspace workspace, Pageable pageable);

    List<Note> findByWorkspaceOwnerAndDeletedFalse(User owner, Pageable pageable);

    Page<Note> findByWorkspace_IdAndDeletedFalse(UUID workspaceId, Pageable pageable);

    Page<Note> findByWorkspaceIdAndDeletedFalse(
        UUID workspaceId,
        Pageable pageable
);

}
