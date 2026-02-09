package com.lexora.lexora_backend.workspace.entity;

import jakarta.persistence.*;
import com.lexora.lexora_backend.user.entity.User;
import lombok.Data;

@Entity
@Data
public class Workspace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;
}

