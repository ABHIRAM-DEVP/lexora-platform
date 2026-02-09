package com.lexora.lexora_backend.workspace.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lexora.lexora_backend.workspace.entity.Workspace;
import com.lexora.lexora_backend.user.entity.User;

public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {

    List<Workspace> findByOwner(User owner);
}
