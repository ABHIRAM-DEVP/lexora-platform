package com.lexora.lexora_backend.user.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import com.lexora.lexora_backend.user.entity.RefreshToken;
import com.lexora.lexora_backend.user.entity.User;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    // Delete refresh tokens for a specific user
    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken rt WHERE rt.user = :user")
    public void deleteByUser(User user);

    public void deleteByUserId(RefreshToken tokenEntity);
}
