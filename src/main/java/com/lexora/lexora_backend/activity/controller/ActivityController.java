package com.lexora.lexora_backend.activity.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

import com.lexora.lexora_backend.activity.service.ActivityService;
import com.lexora.lexora_backend.activity.model.ActivityLog;

@RestController
@RequestMapping("/api/activity")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    // 🔹 1. Get All Activity
    @GetMapping
    public ResponseEntity<List<ActivityLog>> getAllActivity() {
        List<ActivityLog> activities = activityService.getAllActivities();
        return ResponseEntity.ok(activities);
    }

    // 🔹 2. Get Activity By User
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ActivityLog>> getActivityByUser(
            @PathVariable UUID userId) {

        List<ActivityLog> activities = activityService.getActivitiesByUser(userId);
        return ResponseEntity.ok(activities);
    }
}