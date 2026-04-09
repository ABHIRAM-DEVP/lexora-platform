package com.lexora.lexora_backend.user.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lexora.lexora_backend.user.entity.User;


@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    
    // Search methods for finding users to add to workspace
    Optional<User> findByEmailIgnoreCase(String email);

    List<User> findByEmailContainingIgnoreCaseOrUsernameContainingIgnoreCase(String emailPattern, String usernamePattern);

  
}

