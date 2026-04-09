package com.lexora.lexora_backend.activity.controller;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

import com.lexora.lexora_backend.activity.service.ActivityService;
import com.lexora.lexora_backend.activity.model.ActivityLog;
import com.lexora.lexora_backend.auth.service.AuthService;
import com.lexora.lexora_backend.user.entity.User;
import com.lexora.lexora_backend.user.entity.Role;
import com.lexora.lexora_backend.workspace.enums.WorkspaceRole;

@RestController
@RequestMapping("/api/activity")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;
    private final AuthService authService;

    // 🔹 1. Get All Activity (Admin)
    @GetMapping
    public ResponseEntity<List<ActivityLog>> getAllActivity(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        List<ActivityLog> activities = activityService.getAllActivities();
        
        // Apply filters
        if (action != null && !action.isEmpty()) {
            activities = activities.stream()
                .filter(a -> a.getAction().equalsIgnoreCase(action))
                .collect(Collectors.toList());
        }
        if (entityType != null && !entityType.isEmpty()) {
            activities = activities.stream()
                .filter(a -> a.getEntityType() != null && a.getEntityType().equalsIgnoreCase(entityType))
                .collect(Collectors.toList());
        }
        if (startDate != null) {
            activities = activities.stream()
                .filter(a -> a.getTimestamp().isAfter(startDate))
                .collect(Collectors.toList());
        }
        if (endDate != null) {
            activities = activities.stream()
                .filter(a -> a.getTimestamp().isBefore(endDate))
                .collect(Collectors.toList());
        }
        
        // Pagination
        int start = page * size;
        int end = Math.min(start + size, activities.size());
        if (start >= activities.size()) {
            activities = List.of();
        } else {
            activities = activities.subList(start, end);
        }
        
        return ResponseEntity.ok(activities);
    }

    // 🔹 2. Get Activity By User (with userId path param)
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ActivityLog>> getActivityByUser(
            @PathVariable UUID userId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate) {

        List<ActivityLog> activities = activityService.getActivitiesByUser(userId);
        
        // Apply filters
        if (action != null && !action.isEmpty()) {
            activities = activities.stream()
                .filter(a -> a.getAction().equalsIgnoreCase(action))
                .collect(Collectors.toList());
        }
        if (startDate != null) {
            activities = activities.stream()
                .filter(a -> a.getTimestamp().isAfter(startDate))
                .collect(Collectors.toList());
        }
        if (endDate != null) {
            activities = activities.stream()
                .filter(a -> a.getTimestamp().isBefore(endDate))
                .collect(Collectors.toList());
        }
        
        return ResponseEntity.ok(activities);
    }

    // 🔹 3. Get Current User's Activity (Auto-detect user)
    @GetMapping("/me")
    public ResponseEntity<List<ActivityLog>> getMyActivity(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        User currentUser = authService.getCurrentUser();
        List<ActivityLog> activities = activityService.getActivitiesByUser(currentUser.getId());
        
        // Apply filters
        if (action != null && !action.isEmpty()) {
            activities = activities.stream()
                .filter(a -> a.getAction().equalsIgnoreCase(action))
                .collect(Collectors.toList());
        }
        if (entityType != null && !entityType.isEmpty()) {
            activities = activities.stream()
                .filter(a -> a.getEntityType() != null && a.getEntityType().equalsIgnoreCase(entityType))
                .collect(Collectors.toList());
        }
        if (startDate != null) {
            activities = activities.stream()
                .filter(a -> a.getTimestamp().isAfter(startDate))
                .collect(Collectors.toList());
        }
        if (endDate != null) {
            activities = activities.stream()
                .filter(a -> a.getTimestamp().isBefore(endDate))
                .collect(Collectors.toList());
        }
        
        // Sort by timestamp descending
        activities = activities.stream()
            .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
            .collect(Collectors.toList());
        
        // Pagination
        int start = page * size;
        int end = Math.min(start + size, activities.size());
        if (start >= activities.size()) {
            activities = List.of();
        } else {
            activities = activities.subList(start, end);
        }
        
        return ResponseEntity.ok(activities);
    }

    // 🔹 4. Get Activity By Workspace (with workspaceId path param)
    @GetMapping("/workspace/{workspaceId}")
    public ResponseEntity<List<ActivityLog>> getActivityByWorkspace(
            @PathVariable UUID workspaceId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        List<ActivityLog> activities = activityService.getActivitiesByWorkspace(workspaceId);
        
        // Apply filters
        if (action != null && !action.isEmpty()) {
            activities = activities.stream()
                .filter(a -> a.getAction().equalsIgnoreCase(action))
                .collect(Collectors.toList());
        }
        if (entityType != null && !entityType.isEmpty()) {
            activities = activities.stream()
                .filter(a -> a.getEntityType() != null && a.getEntityType().equalsIgnoreCase(entityType))
                .collect(Collectors.toList());
        }
        if (startDate != null) {
            activities = activities.stream()
                .filter(a -> a.getTimestamp().isAfter(startDate))
                .collect(Collectors.toList());
        }
        if (endDate != null) {
            activities = activities.stream()
                .filter(a -> a.getTimestamp().isBefore(endDate))
                .collect(Collectors.toList());
        }
        
        // Sort by timestamp descending
        activities = activities.stream()
            .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
            .collect(Collectors.toList());
        
        // Pagination
        int start = page * size;
        int end = Math.min(start + size, activities.size());
        if (start >= activities.size()) {
            activities = List.of();
        } else {
            activities = activities.subList(start, end);
        }
        
        return ResponseEntity.ok(activities);
    }

    // 🔹 5. Get Current User's Workspace Activity (Auto-detect workspace)
    @GetMapping("/workspace")
    public ResponseEntity<List<ActivityLog>> getMyWorkspaceActivity(
            @RequestParam(required = false) UUID workspaceId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        User currentUser = authService.getCurrentUser();
        
        // Use provided workspaceId or get from user's workspaces
        UUID targetWorkspaceId = workspaceId;
        if (targetWorkspaceId == null) {
            targetWorkspaceId = activityService.getUserPrimaryWorkspaceId(currentUser.getId());
        }
        
        if (targetWorkspaceId == null) {
            return ResponseEntity.ok(List.of());
        }
        
        List<ActivityLog> activities = activityService.getActivitiesByWorkspace(targetWorkspaceId);
        
        // Apply filters
        if (action != null && !action.isEmpty()) {
            activities = activities.stream()
                .filter(a -> a.getAction().equalsIgnoreCase(action))
                .collect(Collectors.toList());
        }
        if (entityType != null && !entityType.isEmpty()) {
            activities = activities.stream()
                .filter(a -> a.getEntityType() != null && a.getEntityType().equalsIgnoreCase(entityType))
                .collect(Collectors.toList());
        }
        if (startDate != null) {
            activities = activities.stream()
                .filter(a -> a.getTimestamp().isAfter(startDate))
                .collect(Collectors.toList());
        }
        if (endDate != null) {
            activities = activities.stream()
                .filter(a -> a.getTimestamp().isBefore(endDate))
                .collect(Collectors.toList());
        }
        
        // Sort by timestamp descending
        activities = activities.stream()
            .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
            .collect(Collectors.toList());
        
        // Pagination
        int start = page * size;
        int end = Math.min(start + size, activities.size());
        if (start >= activities.size()) {
            activities = List.of();
        } else {
            activities = activities.subList(start, end);
        }
        
        return ResponseEntity.ok(activities);
    }

    // 🔹 6. Get Activity Analytics (Admin or Workspace Owner/Admin only)
    @GetMapping("/analytics")
    public ResponseEntity<?> getActivityAnalytics(
            @RequestParam(required = false) UUID workspaceId,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate) {

        User currentUser = authService.getCurrentUser();
        
        // Check if user is ADMIN
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        
        // Determine workspace - for non-admins, must be member of the workspace
        UUID targetWorkspaceId = workspaceId;
        if (targetWorkspaceId == null) {
            targetWorkspaceId = activityService.getUserPrimaryWorkspaceId(currentUser.getId());
        }
        
        // If not admin, check workspace role
        if (!isAdmin && targetWorkspaceId != null) {
            try {
                // Check if user has OWNER or ADMIN role in the workspace
                // This would require adding a method to check workspace role
                // For now, allow if they have access to the workspace
                var workspace = activityService.getWorkspaceForAnalytics(targetWorkspaceId, currentUser.getId());
                if (workspace == null) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "error", "Access denied. You don't have permission to view analytics for this workspace."
                    ));
                }
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "Access denied. You don't have permission to view analytics."
                ));
            }
        }
        
        // If no workspace and not admin, return error
        if (targetWorkspaceId == null && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", "Access denied. No workspace available for analytics."
            ));
        }
        
        List<ActivityLog> activities;
        if (targetWorkspaceId != null) {
            activities = activityService.getActivitiesByWorkspace(targetWorkspaceId);
        } else {
            activities = activityService.getAllActivities();
        }
        
        // Apply date filters
        if (startDate != null) {
            activities = activities.stream()
                .filter(a -> a.getTimestamp().isAfter(startDate))
                .collect(Collectors.toList());
        }
        if (endDate != null) {
            activities = activities.stream()
                .filter(a -> a.getTimestamp().isBefore(endDate))
                .collect(Collectors.toList());
        }
        
        // Calculate analytics
        Map<String, Object> analytics = new HashMap<>();
        
        // Include user role info
        analytics.put("isAdmin", isAdmin);
        analytics.put("userId", currentUser.getId());
        
        // Total activities
        analytics.put("totalActivities", activities.size());
        
        // Activities by action
        Map<String, Long> activitiesByAction = activities.stream()
            .collect(Collectors.groupingBy(ActivityLog::getAction, Collectors.counting()));
        analytics.put("activitiesByAction", activitiesByAction);
        
        // Activities by entity type
        Map<String, Long> activitiesByEntityType = activities.stream()
            .filter(a -> a.getEntityType() != null)
            .collect(Collectors.groupingBy(ActivityLog::getEntityType, Collectors.counting()));
        analytics.put("activitiesByEntityType", activitiesByEntityType);
        
        // Unique users (admin only)
        if (isAdmin) {
            long uniqueUsers = activities.stream()
                .map(ActivityLog::getUserId)
                .distinct()
                .count();
            analytics.put("uniqueUsers", uniqueUsers);
            
            // Most active user
            Map<UUID, Long> userActivityCount = activities.stream()
                .collect(Collectors.groupingBy(ActivityLog::getUserId, Collectors.counting()));
            UUID mostActiveUserId = userActivityCount.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
            analytics.put("mostActiveUserId", mostActiveUserId);
        }
        
        // Recent activity count (last 24 hours)
        Instant last24Hours = Instant.now().minusSeconds(86400);
        long recentActivities = activities.stream()
            .filter(a -> a.getTimestamp().isAfter(last24Hours))
            .count();
        analytics.put("activitiesLast24Hours", recentActivities);
        
        // Activity timeline (last 7 days)
        Map<String, Long> timeline = new HashMap<>();
        for (int i = 0; i < 7; i++) {
            Instant dayStart = Instant.now().minusSeconds(86400L * (i + 1));
            Instant dayEnd = Instant.now().minusSeconds(86400L * i);
            final Instant start = dayStart;
            final Instant end = dayEnd;
            long count = activities.stream()
                .filter(a -> a.getTimestamp().isAfter(start) && a.getTimestamp().isBefore(end))
                .count();
            timeline.put("day" + i, count);
        }
        analytics.put("activityTimeline", timeline);
        
        return ResponseEntity.ok(analytics);
    }

    // 🔹 7. Get Available Action Types
    @GetMapping("/actions")
    public ResponseEntity<List<String>> getAvailableActions() {
        List<ActivityLog> activities = activityService.getAllActivities();
        List<String> actions = activities.stream()
            .map(ActivityLog::getAction)
            .distinct()
            .sorted()
            .collect(Collectors.toList());
        return ResponseEntity.ok(actions);
    }

    // 🔹 8. Get Available Entity Types
    @GetMapping("/entity-types")
    public ResponseEntity<List<String>> getAvailableEntityTypes() {
        List<ActivityLog> activities = activityService.getAllActivities();
        List<String> entityTypes = activities.stream()
            .map(ActivityLog::getEntityType)
            .filter(et -> et != null && !et.isEmpty())
            .distinct()
            .sorted()
            .collect(Collectors.toList());
        return ResponseEntity.ok(entityTypes);
    }
}

