package com.lexora.lexora_backend.user.service;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.lexora.lexora_backend.user.dto.UserSearchResult;
import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.user.repository.UserRepository;
import com.lexora.lexora_backend.workspace.entity.Workspace;
import com.lexora.lexora_backend.workspace.repository.WorkspaceMemberRepository;
import com.lexora.lexora_backend.workspace.repository.WorkspaceRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final WorkspaceRepository workspaceRepository;

    public UserService(
            UserRepository userRepository,
            WorkspaceMemberRepository workspaceMemberRepository,
            WorkspaceRepository workspaceRepository) {
        this.userRepository = userRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
        this.workspaceRepository = workspaceRepository;
    }

    public User getByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found with username/email: " + username
                        )
                );
    }

    public User getById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found with id: " + userId)
                );
    }

    public List<UserSearchResult> searchUsers(String query, UUID workspaceId) {
        String normalizedQuery = query == null ? "" : query.trim();

        List<User> users = normalizedQuery.isBlank()
                ? userRepository.findTop8ByOrderByUsernameAsc()
                : userRepository.findByEmailContainingIgnoreCaseOrUsernameContainingIgnoreCase(
                        normalizedQuery,
                        normalizedQuery);

        Set<UUID> excludedIds = workspaceId == null
                ? new HashSet<>()
                : workspaceMemberRepository.findAllByWorkspaceId(workspaceId).stream()
                        .map(member -> member.getUserId())
                        .collect(Collectors.toCollection(HashSet::new));

        if (workspaceId != null) {
            workspaceRepository.findById(workspaceId)
                    .map(Workspace::getOwner)
                    .map(User::getId)
                    .ifPresent(excludedIds::add);
        }

        return users.stream()
                .filter(user -> !excludedIds.contains(user.getId()))
                .sorted(Comparator.comparing(User::getUsername, String.CASE_INSENSITIVE_ORDER))
                .limit(8)
                .map(user -> UserSearchResult.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .username(user.getUsername())
                        .build())
                .collect(Collectors.toList());
    }

    public UserSearchResult findByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .map(user -> UserSearchResult.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .username(user.getUsername())
                        .build())
                .orElse(null);
    }

    public UserSearchResult findByUsername(String username) {
        return userRepository.findByUsernameIgnoreCase(username)
                .map(user -> UserSearchResult.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .username(user.getUsername())
                        .build())
                .orElse(null);
    }

    public Map<UUID, String> getUsernamesByIds(Set<UUID> ids) {
        return userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId, User::getUsername));
    }

}
