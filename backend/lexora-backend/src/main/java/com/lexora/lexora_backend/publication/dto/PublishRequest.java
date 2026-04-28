package com.lexora.lexora_backend.publication.dto;

import java.util.List;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class PublishRequest {

    private String title;
    private String metaDescription;
    private List<String> tags;
    private String visibility;
    private String layout;
    private java.util.Map<String, Object> style;
    private List<String> mediaIds;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMetaDescription() { return metaDescription; }
    public void setMetaDescription(String metaDescription) { this.metaDescription = metaDescription; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public String getVisibility() { return visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }
    public String getLayout() { return layout; }
    public void setLayout(String layout) { this.layout = layout; }
    public java.util.Map<String, Object> getStyle() { return style; }
    public void setStyle(java.util.Map<String, Object> style) { this.style = style; }
    public List<String> getMediaIds() { return mediaIds; }
    public void setMediaIds(List<String> mediaIds) { this.mediaIds = mediaIds; }
}