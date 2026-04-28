package com.lexora.lexora_backend.publication.entity;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "publications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Publication {

    @Id
    private UUID id = UUID.randomUUID();

    private UUID noteId;
    private UUID workspaceId;
    private String title;
    private String slug;
    private String content;
    private PublicationStatus status;
    private Instant publishedAt;
    private List<String> tags;
    private UUID authorId;
    private String metaDescription;
    private Long views;
    private String visibility;
    private String layout;
    private java.util.Map<String, Object> style;
    private List<String> mediaIds;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getNoteId() { return noteId; }
    public void setNoteId(UUID noteId) { this.noteId = noteId; }
    public UUID getWorkspaceId() { return workspaceId; }
    public void setWorkspaceId(UUID workspaceId) { this.workspaceId = workspaceId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public PublicationStatus getStatus() { return status; }
    public void setStatus(PublicationStatus status) { this.status = status; }
    public Instant getPublishedAt() { return publishedAt; }
    public void setPublishedAt(Instant publishedAt) { this.publishedAt = publishedAt; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public UUID getAuthorId() { return authorId; }
    public void setAuthorId(UUID authorId) { this.authorId = authorId; }
    public String getMetaDescription() { return metaDescription; }
    public void setMetaDescription(String metaDescription) { this.metaDescription = metaDescription; }
    public Long getViews() { return views; }
    public void setViews(Long views) { this.views = views; }
    public String getVisibility() { return visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }
    public String getLayout() { return layout; }
    public void setLayout(String layout) { this.layout = layout; }
    public java.util.Map<String, Object> getStyle() { return style; }
    public void setStyle(java.util.Map<String, Object> style) { this.style = style; }
    public List<String> getMediaIds() { return mediaIds; }
    public void setMediaIds(List<String> mediaIds) { this.mediaIds = mediaIds; }
}