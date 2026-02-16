package com.lexora.lexora_backend.workspace.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.workspace.entity.Workspace;

public interface WorkspaceRepository extends JpaRepository<Workspace, UUID> {

    List<Workspace> findByOwner(User owner);

    // Only non-deleted workspaces
    List<Workspace> findByOwnerAndDeletedFalse(User owner);

    // Include deleted (for trash/recovery)
    List<Workspace> findByOwnerAndDeletedTrue(User owner);

    
   

    // Admin: all deleted
    List<Workspace> findByDeletedTrue();

    // Admin: all active
    List<Workspace> findByDeletedFalse();

Optional<Workspace> findByIdAndOwner_Id(UUID id, UUID ownerId);
}