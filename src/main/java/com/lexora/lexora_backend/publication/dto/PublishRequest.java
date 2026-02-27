package com.lexora.lexora_backend.publication.dto;

import java.util.List;

import lombok.Data;

@Data
public class PublishRequest {

    private String title;
    private String metaDescription;
    private List<String> tags;
}