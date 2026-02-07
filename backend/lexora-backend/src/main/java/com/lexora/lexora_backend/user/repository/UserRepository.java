package com.lexora.lexora_backend.user.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lexora.lexora_backend.user.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long>{
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);
    
}


// boolean existsByEmail(String email);

// Purpose:
// 👉 Check if a user already exists

// Used in:

// Signup API

// Prevent duplicate accounts

// 📌 Purpose of UserRepository

// This interface is the data access layer for the User entity.

// It allows your application to talk to the database without writing SQL.

// In short:
// 👉 CRUD + user lookup for authentication
