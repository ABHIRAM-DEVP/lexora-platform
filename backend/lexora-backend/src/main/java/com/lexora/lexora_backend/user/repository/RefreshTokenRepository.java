package com.lexora.lexora_backend.user.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lexora.lexora_backend.user.entity.RefreshToken;
import com.lexora.lexora_backend.user.entity.User;

    public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);
    void deleteByUser(User user);
    
}

    

