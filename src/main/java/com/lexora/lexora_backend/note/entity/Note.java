package com.lexora.lexora_backend.note.entity;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.GenericGenerator;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.lexora.lexora_backend.workspace.entity.Workspace;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "notes")
@Data
@Getter
@Setter
public class Note {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    private UUID id;


    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private boolean deleted;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant createdAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant updatedAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant deletedAt;

    @Column(name = "workspace_id", nullable = false)
private UUID workspaceId;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "workspace_id", insertable = false, updatable = false)
private Workspace workspace;
    private UUID authorId;
}
