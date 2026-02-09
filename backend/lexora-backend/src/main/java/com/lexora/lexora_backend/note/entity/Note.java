package com.lexora.lexora_backend.note.entity;

import java.time.Instant;

import jakarta.persistence.*;

import com.lexora.lexora_backend.workspace.entity.Workspace;
import lombok.Data;

@Entity
@Table(name = "notes")
@Data
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
private String content;


    private boolean deleted;

    private Instant createdAt;
    private Instant updatedAt;
    private Instant deletedAt;

    @ManyToOne(optional = false)
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;
}