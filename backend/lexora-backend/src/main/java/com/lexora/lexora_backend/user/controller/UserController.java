package com.lexora.lexora_backend.user.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.lexora.lexora_backend.user.dto.UserSearchResult;
import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.user.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    @GetMapping("/search")
    public ResponseEntity<List<UserSearchResult>> searchUsers(
            @RequestParam String query,
            @RequestParam(required = false) UUID workspaceId) {
        
        List<UserSearchResult> users = userService.searchUsers(query, workspaceId);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/by-email")
    public ResponseEntity<UserSearchResult> getUserByEmail(@RequestParam String email) {
        UserSearchResult user = userService.findByEmail(email);
        return ResponseEntity.ok(user);
    }

    public UserService getUserService() {
        return userService;
    }
}
