package com.lexora.lexora_backend.note.entity;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.GenericGenerator;

import com.lexora.lexora_backend.workspace.entity.Workspace;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "notes")
@Data
public class Note {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    private UUID id;

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